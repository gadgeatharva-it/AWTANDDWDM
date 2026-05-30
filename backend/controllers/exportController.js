const Event = require('../models/Event');

function csvEscape(value) {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (/[",\r\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

function formatDate(value) {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.valueOf())) return '';
  return date.toISOString().slice(0, 10);
}

function formatDateTime(value) {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.valueOf())) return '';
  return date.toISOString();
}

exports.exportExecutiveSummaryCsv = async (req, res, next) => {
  try {
    const ownerFilter = req.user.role === 'admin' ? {} : { organiser: req.user.id };
    const ownerName = req.user.role === 'admin' ? 'All organisers' : (req.user.name || '');

    const events = await Event.find(ownerFilter)
      .populate('organiser', 'name email')
      .select('title registeredCount startDate endDate location capacity price category status tags createdAt updatedAt')
      .lean();

    const header = [
      'Event ID',
      'Event Name',
      'Organizer Name',
      'Start Date',
      'End Date',
      'Location',
      'Capacity',
      'Price',
      'Total Registrations',
      'Category',
      'Status',
      'Tags',
      'Created At',
      'Updated At',
      'Estimated Revenue',
    ];

    const lines = [header.map(csvEscape).join(',')];
    let totalRegistrations = 0;
    let totalRevenue = 0;
    events.forEach((event) => {
      const registrations = Number(event?.registeredCount || 0);
      const price = Number(event?.price || 0);
      const revenue = registrations * price;
      totalRegistrations += registrations;
      totalRevenue += revenue;

      lines.push(
        [
          event?._id?.toString?.() || '',
          event?.title || '',
          event?.organiser?.name || ownerName,
          formatDate(event?.startDate),
          formatDate(event?.endDate),
          event?.location || '',
          Number(event?.capacity || 0),
          price,
          registrations,
          event?.category || '',
          event?.status || '',
          Array.isArray(event?.tags) ? event.tags.join('|') : '',
          formatDateTime(event?.createdAt),
          formatDateTime(event?.updatedAt),
          revenue,
        ].map(csvEscape).join(',')
      );
    });

    lines.push(
      [
        '',
        'TOTAL',
        ownerName,
        '',
        '',
        '',
        '',
        '',
        totalRegistrations,
        '',
        '',
        '',
        '',
        '',
        totalRevenue,
      ].map(csvEscape).join(',')
    );

    const csv = `${lines.join('\r\n')}\r\n`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="executive_summary.csv"');
    return res.status(200).send(csv);
  } catch (err) {
    return next(err);
  }
};
