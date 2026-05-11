const { validationResult } = require('express-validator');
const Event = require('../models/Event');
const Registration = require('../models/Registration');

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function buildEventMatch(query) {
  const { category, status, year, month } = query;
  const match = {};

  if (category) match.category = category;
  if (status) match.status = status;

  if (year) {
    const parsedYear = Number(year);
    const parsedMonth = Number(month);

    if (month) {
      match.startDate = {
        $gte: new Date(Date.UTC(parsedYear, parsedMonth - 1, 1)),
        $lt: new Date(Date.UTC(parsedYear, parsedMonth, 1)),
      };
    } else {
      match.startDate = {
        $gte: new Date(Date.UTC(parsedYear, 0, 1)),
        $lt: new Date(Date.UTC(parsedYear + 1, 0, 1)),
      };
    }
  }

  return match;
}

function makeTrendBuckets(count = 12) {
  const now = new Date();
  const buckets = [];

  for (let i = count - 1; i >= 0; i -= 1) {
    const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    buckets.push({
      key: `${date.getUTCFullYear()}-${date.getUTCMonth() + 1}`,
      label: `${MONTH_NAMES[date.getUTCMonth()]} ${date.getUTCFullYear()}`,
      year: date.getUTCFullYear(),
      month: date.getUTCMonth() + 1,
      eventsCreated: 0,
      registrations: 0,
      revenue: 0,
    });
  }

  return buckets;
}

function groupDrilldown(events, drillLevel) {
  const rows = new Map();

  events.forEach((event) => {
    const date = new Date(event.startDate);
    let key;
    let label;

    if (drillLevel === 'year') {
      key = `${date.getUTCFullYear()}`;
      label = key;
    } else if (drillLevel === 'day') {
      key = `${date.getUTCFullYear()}-${date.getUTCMonth() + 1}-${date.getUTCDate()}`;
      label = `${date.getUTCDate()} ${MONTH_NAMES[date.getUTCMonth()]}`;
    } else {
      key = `${date.getUTCFullYear()}-${date.getUTCMonth() + 1}`;
      label = `${MONTH_NAMES[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
    }

    if (!rows.has(key)) {
      rows.set(key, { label, count: 0, registrations: 0, revenue: 0 });
    }

    const row = rows.get(key);
    row.count += 1;
    row.registrations += event.registeredCount || 0;
    row.revenue += (event.registeredCount || 0) * (event.price || 0);
  });

  return Array.from(rows.values());
}

function runKMeans(points, k = 3, iterations = 12) {
  if (points.length === 0) return [];
  if (points.length <= k) return points.map((point, index) => ({ ...point, cluster: index }));

  const sorted = [...points].sort((a, b) => a.registrationsCount - b.registrationsCount);
  let centroids = [
    [sorted[0].registrationsCount, sorted[0].activeMonths],
    [sorted[Math.floor(sorted.length / 2)].registrationsCount, sorted[Math.floor(sorted.length / 2)].activeMonths],
    [sorted[sorted.length - 1].registrationsCount, sorted[sorted.length - 1].activeMonths],
  ];

  let assignments = [];

  for (let i = 0; i < iterations; i += 1) {
    assignments = points.map((point) => {
      let bestCluster = 0;
      let bestDistance = Number.POSITIVE_INFINITY;

      centroids.forEach((centroid, index) => {
        const distance = Math.hypot(
          point.registrationsCount - centroid[0],
          point.activeMonths - centroid[1]
        );

        if (distance < bestDistance) {
          bestDistance = distance;
          bestCluster = index;
        }
      });

      return bestCluster;
    });

    centroids = centroids.map((centroid, index) => {
      const members = points.filter((_, pointIndex) => assignments[pointIndex] === index);
      if (members.length === 0) return centroid;

      const totals = members.reduce(
        (acc, member) => {
          acc.registrationsCount += member.registrationsCount;
          acc.activeMonths += member.activeMonths;
          return acc;
        },
        { registrationsCount: 0, activeMonths: 0 }
      );

      return [
        totals.registrationsCount / members.length,
        totals.activeMonths / members.length,
      ];
    });
  }

  return points.map((point, index) => ({ ...point, cluster: assignments[index] }));
}

function summarizeClusters(points) {
  if (points.length === 0) return [];

  const grouped = new Map();
  points.forEach((point) => {
    if (!grouped.has(point.cluster)) grouped.set(point.cluster, []);
    grouped.get(point.cluster).push(point);
  });

  const labels = ['High activity users', 'Medium users', 'Low engagement users'];

  return Array.from(grouped.entries())
    .map(([cluster, members]) => {
      const totals = members.reduce(
        (acc, member) => {
          acc.registrationsCount += member.registrationsCount;
          acc.activeMonths += member.activeMonths;
          return acc;
        },
        { registrationsCount: 0, activeMonths: 0 }
      );

      return {
        cluster,
        size: members.length,
        avgRegistrations: totals.registrationsCount / members.length,
        avgActiveMonths: totals.activeMonths / members.length,
      };
    })
    .sort((a, b) => b.avgRegistrations - a.avgRegistrations)
    .map((cluster, index) => ({
      label: labels[index] || `Cluster ${index + 1}`,
      size: cluster.size,
      avgRegistrations: Number(cluster.avgRegistrations.toFixed(1)),
      avgActiveMonths: Number(cluster.avgActiveMonths.toFixed(1)),
    }));
}

// GET /api/events - filter/search/sort
exports.getEvents = async (req, res, next) => {
  try {
    const { search, category, status, sort = '-createdAt', page = 1, limit = 10 } = req.query;

    const filter = {};
    if (category) filter.category = category;
    if (status) filter.status = status;
    if (search) filter.$text = { $search: search };

    const skip = (Number(page) - 1) * Number(limit);

    const [events, total] = await Promise.all([
      Event.find(filter)
        .populate('organiser', 'name email')
        .sort(sort)
        .skip(skip)
        .limit(Number(limit)),
      Event.countDocuments(filter),
    ]);

    res.json({ events, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err) {
    next(err);
  }
};

// GET /api/events/:id
exports.getEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id).populate('organiser', 'name email');
    if (!event) return res.status(404).json({ message: 'Event not found' });
    res.json(event);
  } catch (err) {
    next(err);
  }
};

// POST /api/events
exports.createEvent = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const event = await Event.create({ ...req.body, organiser: req.user.id });
    res.status(201).json(event);
  } catch (err) {
    next(err);
  }
};

// PUT /api/events/:id
exports.updateEvent = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    if (event.organiser.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorised' });
    }

    Object.assign(event, req.body);
    await event.save();
    res.json(event);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/events/:id
exports.deleteEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    if (event.organiser.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorised' });
    }

    await Promise.all([
      event.deleteOne(),
      Registration.deleteMany({ event: event._id }),
    ]);

    res.json({ message: 'Event deleted' });
  } catch (err) {
    next(err);
  }
};

// GET /api/events/stats
exports.getStats = async (req, res, next) => {
  try {
    const eventMatch = buildEventMatch(req.query);
    const drillLevel = req.query.drill || 'month';

    const [filteredEvents, yearRows] = await Promise.all([
      Event.find(eventMatch)
        .select('title category status price createdAt startDate endDate registeredCount capacity')
        .sort({ createdAt: -1 })
        .lean(),
      Event.aggregate([
        { $group: { _id: { $year: '$startDate' } } },
        { $sort: { _id: -1 } },
      ]),
    ]);

    const eventIds = filteredEvents.map((event) => event._id);
    const registrations = eventIds.length > 0
      ? await Registration.find({ event: { $in: eventIds }, status: 'confirmed' })
        .select('event attendee createdAt')
        .lean()
      : [];

    const eventLookup = new Map(filteredEvents.map((event) => [String(event._id), event]));

    const overview = filteredEvents.reduce(
      (acc, event) => {
        acc.totalEvents += 1;
        acc.totalRegistrations += event.registeredCount || 0;
        acc.totalRevenue += (event.registeredCount || 0) * (event.price || 0);
        acc.capacityRatios.push(event.capacity > 0 ? (event.registeredCount || 0) / event.capacity : 0);
        return acc;
      },
      { totalEvents: 0, totalRegistrations: 0, totalRevenue: 0, capacityRatios: [] }
    );

    const byCategoryMap = new Map();
    const byStatusMap = new Map();
    const pivotMap = new Map();

    filteredEvents.forEach((event) => {
      const categoryRow = byCategoryMap.get(event.category) || { _id: event.category, count: 0, registrations: 0 };
      categoryRow.count += 1;
      categoryRow.registrations += event.registeredCount || 0;
      byCategoryMap.set(event.category, categoryRow);

      const statusRow = byStatusMap.get(event.status) || { _id: event.status, count: 0 };
      statusRow.count += 1;
      byStatusMap.set(event.status, statusRow);

      const pivotRow = pivotMap.get(event.category) || { category: event.category, revenue: 0, registrations: 0, events: 0 };
      pivotRow.revenue += (event.registeredCount || 0) * (event.price || 0);
      pivotRow.registrations += event.registeredCount || 0;
      pivotRow.events += 1;
      pivotMap.set(event.category, pivotRow);
    });

    const trendBuckets = makeTrendBuckets(12);
    const trendMap = new Map(trendBuckets.map((bucket) => [bucket.key, bucket]));

    filteredEvents.forEach((event) => {
      const created = new Date(event.createdAt);
      const key = `${created.getUTCFullYear()}-${created.getUTCMonth() + 1}`;
      if (trendMap.has(key)) trendMap.get(key).eventsCreated += 1;
    });

    registrations.forEach((registration) => {
      const created = new Date(registration.createdAt);
      const key = `${created.getUTCFullYear()}-${created.getUTCMonth() + 1}`;
      const linkedEvent = eventLookup.get(String(registration.event));
      if (trendMap.has(key)) {
        trendMap.get(key).registrations += 1;
        trendMap.get(key).revenue += linkedEvent?.price || 0;
      }
    });

    const byMonth = trendBuckets.map((bucket) => ({
      _id: { year: bucket.year, month: bucket.month },
      count: bucket.eventsCreated,
      registrations: bucket.registrations,
    }));

    const attendeeAggMap = new Map();
    registrations.forEach((registration) => {
      const attendeeKey = String(registration.attendee);
      if (!attendeeAggMap.has(attendeeKey)) {
        attendeeAggMap.set(attendeeKey, {
          attendee: attendeeKey,
          registrationsCount: 0,
          monthKeys: new Set(),
        });
      }

      const row = attendeeAggMap.get(attendeeKey);
      row.registrationsCount += 1;
      const date = new Date(registration.createdAt);
      row.monthKeys.add(`${date.getUTCFullYear()}-${date.getUTCMonth() + 1}`);
    });

    const attendeePoints = Array.from(attendeeAggMap.values()).map((row) => ({
      attendee: row.attendee,
      registrationsCount: row.registrationsCount,
      activeMonths: row.monthKeys.size,
    }));

    const selectedParts = [req.query.category, req.query.year, req.query.month, req.query.status].filter(Boolean);

    res.json({
      overview: {
        totalEvents: overview.totalEvents,
        totalRegistrations: overview.totalRegistrations,
        totalRevenue: overview.totalRevenue,
        avgCapacityUsed: overview.capacityRatios.length
          ? overview.capacityRatios.reduce((sum, value) => sum + value, 0) / overview.capacityRatios.length
          : 0,
      },
      byCategory: Array.from(byCategoryMap.values()).sort((a, b) => b.count - a.count),
      byStatus: Array.from(byStatusMap.values()).sort((a, b) => b.count - a.count),
      byMonth,
      topEvents: [...filteredEvents]
        .sort((a, b) => (b.registeredCount || 0) - (a.registeredCount || 0))
        .slice(0, 5)
        .map((event) => ({
          _id: event._id,
          title: event.title,
          registeredCount: event.registeredCount,
          capacity: event.capacity,
          category: event.category,
        })),
      drilldown: {
        level: drillLevel,
        rows: groupDrilldown(filteredEvents, drillLevel),
      },
      pivot: Array.from(pivotMap.values()).sort((a, b) => b.revenue - a.revenue),
      trends: trendBuckets.map(({ label, eventsCreated, registrations: totalRegistrations, revenue }) => ({
        label,
        eventsCreated,
        registrations: totalRegistrations,
        revenue,
      })),
      clusters: summarizeClusters(runKMeans(attendeePoints)),
      olap: {
        slice: req.query.category ? `Slice: ${req.query.category}` : 'Slice: all categories',
        dice: selectedParts.length > 1 ? `Dice: ${selectedParts.join(' / ')}` : 'Dice: add more filters to narrow the cube',
        drill: `Drill-down level: ${drillLevel}`,
      },
      meta: {
        years: yearRows.map((row) => row._id).filter(Boolean),
      },
    });
  } catch (err) {
    next(err);
  }
};
