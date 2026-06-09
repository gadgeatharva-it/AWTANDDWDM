const mongoose = require('mongoose');
const Event = require('../models/Event');
const Registration = require('../models/Registration');
// Register the referenced schema before populating event organisers.
require('../models/User');

const DAY_MS = 24 * 60 * 60 * 1000;

function normalize(value) {
  return String(value || '').trim().toLowerCase();
}

function addPreference(map, value, weight = 1) {
  const key = normalize(value);
  if (!key) return;
  map.set(key, (map.get(key) || 0) + weight);
}

function preferenceScore(map, value, maxPoints) {
  const key = normalize(value);
  if (!key || map.size === 0) return 0;
  const maximum = Math.max(...map.values());
  return maximum > 0 ? ((map.get(key) || 0) / maximum) * maxPoints : 0;
}

function tagsScore(preferences, tags, maxPoints) {
  if (preferences.size === 0 || !Array.isArray(tags) || tags.length === 0) return 0;
  const maximum = Math.max(...preferences.values());
  const matches = tags.reduce((sum, tag) => sum + (preferences.get(normalize(tag)) || 0), 0);
  return Math.min(maxPoints, (matches / maximum) * (maxPoints / 2));
}

function occupancyScore(event) {
  const capacity = Number(event.capacity) || 0;
  if (capacity <= 0) return 0;
  return Math.min(1, (Number(event.registeredCount) || 0) / capacity);
}

function dateScore(startDate) {
  const daysAway = Math.max(0, (new Date(startDate).getTime() - Date.now()) / DAY_MS);
  return Math.max(0, 1 - daysAway / 180);
}

function buildPreferences(historyEvents) {
  const preferences = {
    categories: new Map(),
    tags: new Map(),
    cities: new Map(),
    locations: new Map(),
    priceTypes: new Map(),
  };

  historyEvents.forEach((event, index) => {
    // Recent registrations influence the profile slightly more than older ones.
    const weight = Math.max(1, 1.5 - index * 0.05);
    addPreference(preferences.categories, event.category, weight);
    addPreference(preferences.cities, event.city, weight);
    addPreference(preferences.locations, event.location, weight);
    addPreference(preferences.priceTypes, Number(event.price) > 0 ? 'paid' : 'free', weight);
    (event.tags || []).forEach((tag) => addPreference(preferences.tags, tag, weight));
  });

  return preferences;
}

function buildReasons(event, preferences, collaborativePoints, hasHistory) {
  const reasons = [];
  const category = normalize(event.category);
  const matchingTags = (event.tags || []).filter((tag) => preferences.tags.has(normalize(tag)));

  if (category && preferences.categories.has(category)) {
    reasons.push(`Matches your interest in ${event.category}`);
  }
  if (matchingTags.length > 0) {
    reasons.push(`Related to ${matchingTags.slice(0, 2).join(' and ')}`);
  }
  if (
    (event.city && preferences.cities.has(normalize(event.city)))
    || preferences.locations.has(normalize(event.location))
  ) {
    reasons.push(`Matches locations you attend`);
  }
  if (collaborativePoints > 0) {
    reasons.push('Popular with attendees like you');
  }
  if (occupancyScore(event) >= 0.5) {
    reasons.push('Trending event');
  }
  if (!hasHistory && reasons.length === 0) {
    reasons.push('Suggested upcoming event');
  }

  return reasons.slice(0, 2);
}

async function getCollaborativeCounts(attendeeId, historyEventIds, excludedEventIds) {
  if (historyEventIds.length === 0) return new Map();

  const similarRows = await Registration.find({
    event: { $in: historyEventIds },
    attendee: { $ne: attendeeId },
    status: 'confirmed',
  })
    .select('attendee')
    .limit(500)
    .lean();

  const similarAttendeeIds = [...new Set(similarRows.map((row) => String(row.attendee)))];
  if (similarAttendeeIds.length === 0) return new Map();

  const rows = await Registration.aggregate([
    {
      $match: {
        attendee: { $in: similarAttendeeIds.map((id) => new mongoose.Types.ObjectId(id)) },
        event: { $nin: excludedEventIds },
        status: 'confirmed',
      },
    },
    { $group: { _id: '$event', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 300 },
  ]);

  return new Map(rows.map((row) => [String(row._id), row.count]));
}

async function getEventRecommendations(attendeeId, requestedLimit = 6) {
  const limit = Math.min(12, Math.max(1, Number(requestedLimit) || 6));

  const registrations = await Registration.find({ attendee: attendeeId })
    .select('event status createdAt')
    .populate('event', 'title category tags city location price startDate')
    .sort({ createdAt: -1 })
    .lean();

  const excludedEventIds = registrations.map((registration) => registration.event?._id).filter(Boolean);
  const confirmedHistory = registrations
    .filter((registration) => registration.status === 'confirmed' && registration.event)
    .map((registration) => registration.event);
  const historyEventIds = confirmedHistory.map((event) => event._id);

  const [candidates, collaborativeCounts] = await Promise.all([
    Event.find({
      status: 'published',
      startDate: { $gte: new Date() },
      _id: { $nin: excludedEventIds },
      $expr: { $lt: ['$registeredCount', '$capacity'] },
    })
      .populate('organiser', 'name email')
      .sort({ startDate: 1 })
      .limit(300)
      .lean(),
    getCollaborativeCounts(attendeeId, historyEventIds, excludedEventIds),
  ]);

  const preferences = buildPreferences(confirmedHistory);
  const maxCollaborativeCount = Math.max(0, ...collaborativeCounts.values());
  const hasHistory = confirmedHistory.length > 0;

  const recommendations = candidates
    .map((event) => {
      const collaborativeCount = collaborativeCounts.get(String(event._id)) || 0;
      const collaborativePoints = maxCollaborativeCount > 0
        ? (collaborativeCount / maxCollaborativeCount) * 17
        : 0;
      const contentPoints = hasHistory
        ? preferenceScore(preferences.categories, event.category, 25)
          + tagsScore(preferences.tags, event.tags, 25)
          + Math.max(
            preferenceScore(preferences.cities, event.city, 10),
            preferenceScore(preferences.locations, event.location, 10),
          )
          + preferenceScore(
            preferences.priceTypes,
            Number(event.price) > 0 ? 'paid' : 'free',
            8,
          )
        : 0;
      const popularityPoints = occupancyScore(event) * (hasHistory ? 10 : 70);
      const upcomingPoints = dateScore(event.startDate) * (hasHistory ? 5 : 30);
      const score = contentPoints + collaborativePoints + popularityPoints + upcomingPoints;

      return {
        ...event,
        recommendationScore: Number(score.toFixed(1)),
        recommendationReasons: buildReasons(event, preferences, collaborativePoints, hasHistory),
      };
    })
    .sort((a, b) => (
      b.recommendationScore - a.recommendationScore
      || new Date(a.startDate) - new Date(b.startDate)
    ))
    .slice(0, limit);

  return {
    recommendations,
    personalized: hasHistory,
    historySize: confirmedHistory.length,
  };
}

module.exports = { getEventRecommendations };
