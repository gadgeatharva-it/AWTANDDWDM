const OpenAI = require('openai');

const Event = require('../models/Event');
const Registration = require('../models/Registration');

const client = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,

  baseURL: 'https://api.groq.com/openai/v1',
});

//
// ATTENDEE CHAT
//

exports.attendeeChat = async (
  req,
  res
) => {
  try {

    const { message } = req.body;

    const query =
      message.toLowerCase();

    //
    // FETCH EVENTS
    //

    const events = await Event.find({
      status: 'published',
    }).select(
      `
      title
      category
      location
      city
      startDate
      price
      `
    );

    let filteredEvents = [...events];

    //
    // CATEGORY FILTERING
    //

    const categories = [
      "conference",
      "workshop",
      "webinar",
      "meetup",
      "concert",
      "sports",
      "hackathon",
      "ai",
      "iot",
      "robotics",
      "cybersecurity",
      "blockchain",
      "cloud",
      "coding",
      "startup",
      "ieee",
    ];

    categories.forEach((category) => {

      if (query.includes(category)) {

        filteredEvents =
          filteredEvents.filter((event) => {

            const text = `
              ${event.title}
              ${event.category}
            `.toLowerCase();

            return text.includes(category);

          });

      }

    });

    //
    // LOCATION FILTERING
    //

    const locations = [
      "india",
      "pune",
      "mumbai",
      "delhi",
      "new delhi",
      "bangalore",
      "bengaluru",
      "hyderabad",
      "chennai",
      "kolkata",
      "dubai",
      "singapore",
      "usa",
      "london",
      "online",
    ];

    locations.forEach((location) => {

      if (query.includes(location)) {

        filteredEvents =
          filteredEvents.filter((event) => {

            const place = `
              ${event.location}
              ${event.city || ""}
            `.toLowerCase();

            return place.includes(location);

          });

      }

    });

    //
    // MONTH FILTERING
    //

    const months = {
      january: 0,
      february: 1,
      march: 2,
      april: 3,
      may: 4,
      june: 5,
      july: 6,
      august: 7,
      september: 8,
      october: 9,
      november: 10,
      december: 11,
    };

    for (const month in months) {

      if (query.includes(month)) {

        filteredEvents =
          filteredEvents.filter((event) => {

            const date =
              new Date(event.startDate);

            return (
              date.getMonth() ===
              months[month]
            );

          });

      }

    }

    //
    // FREE EVENTS
    //

    if (
      query.includes("free")
    ) {

      filteredEvents =
        filteredEvents.filter(
          (event) => event.price === 0
        );

    }

    //
    // PAID EVENTS
    //

    if (
      query.includes("paid")
    ) {

      filteredEvents =
        filteredEvents.filter(
          (event) => event.price > 0
        );

    }

    //
    // UPCOMING EVENTS
    //

    if (
      query.includes("upcoming")
    ) {

      filteredEvents =
        filteredEvents.filter(
          (event) =>
            new Date(event.startDate) >
            new Date()
        );

    }

    //
    // TODAY EVENTS
    //

    if (
      query.includes("today")
    ) {

      const today = new Date();

      filteredEvents =
        filteredEvents.filter(
          (event) => {

            const eventDate =
              new Date(event.startDate);

            return (
              eventDate.toDateString() ===
              today.toDateString()
            );

          }
        );

    }

    //
    // THIS WEEK EVENTS
    //

    if (
      query.includes("this week")
    ) {

      const now = new Date();

      const nextWeek =
        new Date();

      nextWeek.setDate(
        now.getDate() + 7
      );

      filteredEvents =
        filteredEvents.filter(
          (event) => {

            const date =
              new Date(event.startDate);

            return (
              date >= now &&
              date <= nextWeek
            );

          }
        );

    }

    //
    // KEYWORD SEARCH
    //

    const ignoredWords = [
      "events",
      "event",
      "show",
      "find",
      "search",
      "in",
      "at",
      "near",
      "for",
      "the",
      "held",
      "available",
    ];

    const keywords = query
      .split(" ")
      .filter(
        (word) =>
          !ignoredWords.includes(word) &&
          word.length > 2
      );

    if (keywords.length) {

      filteredEvents =
        filteredEvents.filter(
          (event) => {

            const text = `
              ${event.title}
              ${event.category}
              ${event.location}
              ${event.city || ""}
            `.toLowerCase();

            return keywords.some(
              (keyword) =>
                text.includes(keyword)
            );

          }
        );

    }

    //
    // LIMIT RESULTS
    //

    filteredEvents =
      filteredEvents.slice(0, 6);

    //
    // FORMAT EVENTS
    //

    const formattedEvents =
      filteredEvents
        .map((event) => {

          const formattedDate =
            new Date(
              event.startDate
            ).toLocaleDateString(
              "en-US",
              {
                year: "numeric",
                month: "long",
                day: "numeric",
              }
            );

          return `
• ${event.title}
  Category: ${event.category}
  Location: ${event.location}
  Price: ₹${event.price}
  Date: ${formattedDate}
`;

        })
        .join("\n");

    //
    // AI PROMPT
    //

    const prompt = `
You are EventFlow AI.

Help users discover events.

RULES:
- Use ONLY provided events
- Never invent data
- Keep responses short
- Use clean bullet formatting
- Never mention filtering logic
- Never explain exclusions
- Show maximum 6 events
- If no events match, suggest alternatives naturally

GOOD RESPONSE:

Here are upcoming AI events:

• AI Summit 2026 — Pune

• ML Conference — Bengaluru

AVAILABLE EVENTS:
${formattedEvents || "No matching events found."}

USER QUESTION:
${message}
`;

    //
    // AI COMPLETION
    //

    const completion =
      await client.chat.completions.create({

        model:
          'llama-3.1-8b-instant',

        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],

        temperature: 0.5,

      });

    const reply =
      completion
        .choices[0]
        .message
        .content;

    //
    // RESPONSE
    //

    res.json({
      success: true,
      reply,
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      success: false,
      message: 'AI Server Error',
    });

  }
};


//
// ORGANIZER COPILOT
//

exports.organizerCopilot = async (req, res) => {
  try {

    const { message, organizerId } =
      req.body;

    const orgId =
      organizerId || req.user?.id;

    //
    // VALIDATION
    //

    if (!orgId) {

      return res.status(400).json({
        success: false,
        message:
          "Organizer ID missing",
      });

    }

    //
    // FETCH EVENTS
    //

    const events = await Event.find({
      organiser: orgId,
    }).select(`
      title
      startDate
      status
      capacity
      registeredCount
      revenue
      category
      location
    `);

    //
    // NO EVENTS
    //

    if (!events.length) {

      return res.json({
        success: true,
        reply:
          "No events found yet. Create your first event to unlock organizer insights.",
      });

    }

    //
    // BASIC METRICS
    //

    const totalEvents =
      events.length;

    const totalRevenue =
      events.reduce(
        (sum, e) =>
          sum + (e.revenue || 0),
        0
      );

    const totalRegistrations =
      events.reduce(
        (sum, e) =>
          sum +
          (e.registeredCount || 0),
        0
      );

    const avgAttendanceRate =
      events.reduce((sum, e) => {

        if (!e.capacity)
          return sum;

        return (
          sum +
          e.registeredCount /
            e.capacity
        );

      }, 0) / totalEvents;

    //
    // EVENT ANALYTICS
    //

    const eventAnalytics =
      events.map((e) => {

        const occupancy =
          e.capacity
            ? (
                (e.registeredCount /
                  e.capacity) *
                100
              ).toFixed(1)
            : 0;

        return {
          title: e.title,
          revenue:
            e.revenue || 0,
          registrations:
            e.registeredCount || 0,
          capacity:
            e.capacity || 0,
          occupancyRate:
            occupancy,
          status: e.status,
          category:
            e.category,
          location:
            e.location,
          date:
            new Date(
              e.startDate
            ).toLocaleDateString(),
        };

      });

    //
    // TOP EVENT
    //

    const bestEvent =
      [...eventAnalytics].sort(
        (a, b) =>
          Number(
            b.occupancyRate
          ) -
          Number(
            a.occupancyRate
          )
      )[0];

    //
    // LOW EVENT
    //

    const lowEvent =
      [...eventAnalytics].sort(
        (a, b) =>
          Number(
            a.occupancyRate
          ) -
          Number(
            b.occupancyRate
          )
      )[0];

    //
    // SOLD OUT EVENTS
    //

    const soldOutEvents =
      eventAnalytics.filter(
        (e) =>
          Number(
            e.occupancyRate
          ) >= 90
      );

    //
    // HIGH PERFORMANCE
    //

    const highPerformingEvents =
      eventAnalytics.filter(
        (e) =>
          Number(
            e.occupancyRate
          ) >= 60
      );

    //
    // LOW PERFORMANCE
    //

    const lowPerformingEvents =
      eventAnalytics.filter(
        (e) =>
          Number(
            e.occupancyRate
          ) < 20
      );

    //
    // TOP CATEGORY
    //

    const topCategory =
      Object.entries(

        events.reduce(
          (acc, e) => {

            acc[e.category] =
              (acc[e.category] ||
                0) + 1;

            return acc;

          },
          {}
        )

      ).sort(
        (a, b) =>
          b[1] - a[1]
      )[0];

    //
    // SMART INSIGHTS
    //

    const insights = [];

    if (
      Number(
        bestEvent.occupancyRate
      ) > 3
    ) {

      insights.push(
        `${bestEvent.title} is currently attracting stronger engagement compared to most other events.`
      );

    }

    if (
      lowPerformingEvents.length >
      totalEvents * 0.7
    ) {

      insights.push(
        `A large portion of events have low attendance, suggesting discoverability or audience targeting challenges.`
      );

    }

    if (
      totalRevenue === 0
    ) {

      insights.push(
        `Revenue generation has not started yet, so the immediate focus should be increasing registrations and engagement.`
      );

    }

    if (
      soldOutEvents.length
    ) {

      insights.push(
        `${soldOutEvents.length} events are nearing full capacity, indicating stronger demand in specific segments.`
      );

    }

    if (topCategory) {

      insights.push(
        `${topCategory[0]} is currently your most active event category.`
      );

    }

    //
    // PROMPT
    //

    const prompt = `
You are EventFlow Organizer Copilot.

You are an intelligent SaaS analytics assistant.

Your job is to:
- explain business insights clearly
- avoid generic statements
- avoid repeating metrics
- sound modern and strategic
- provide concise actionable recommendations

USER QUESTION:
${message}

BUSINESS METRICS:
- Total Events: ${totalEvents}
- Total Registrations: ${totalRegistrations}
- Average Attendance Rate: ${(
      avgAttendanceRate * 100
    ).toFixed(1)}%
- Revenue: ₹${totalRevenue}

TOP EVENT:
${bestEvent.title}
(${bestEvent.occupancyRate}% attendance)

LOWEST EVENT:
${lowEvent.title}
(${lowEvent.occupancyRate}% attendance)

INSIGHTS:
${insights.join("\n")}

TOP EVENTS:
${eventAnalytics
  .sort(
    (a, b) =>
      Number(
        b.occupancyRate
      ) -
      Number(
        a.occupancyRate
      )
  )
  .slice(0, 5)
  .map(
    (e) =>
      `• ${e.title} (${e.occupancyRate}% attendance)`
  )
  .join("\n")}

IMPORTANT RULES:
- NEVER repeat metrics
- NEVER say "underwhelming"
- NEVER sound robotic
- NEVER insult the organizer
- NEVER repeat the same event multiple times
- Focus on strategic insights
- Keep response under 140 words
- Sound like a premium SaaS dashboard AI
- Give highly practical suggestions
- Avoid generic advice
- If revenue is 0, focus more on engagement and audience growth

FORMAT:

📊 Overview
...

📈 Insights
• ...
• ...

🚀 Actions
• ...
• ...
`;

    //
    // AI COMPLETION
    //

    const completion =
      await client.chat.completions.create({

        model:
          "llama-3.1-8b-instant",

        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],

        temperature: 0.4,

      });

    //
    // RESPONSE
    //

    const reply =
      completion
        .choices[0]
        .message
        .content;

    res.json({
      success: true,
      reply,
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      success: false,
      message:
        "Organizer Copilot Error",
    });

  }
};