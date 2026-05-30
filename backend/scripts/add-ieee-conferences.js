const fs = require('fs');
const path = require('path');

// Local dev convenience: load `backend/.env` if present.
const envPath = path.join(__dirname, '..', '.env');
if (process.env.NODE_ENV !== 'production' && fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
}

const mongoose = require('mongoose');
const User = require('../models/User');
const Event = require('../models/Event');

const DAY_MS = 24 * 60 * 60 * 1000;

function dateUtc(year, month, day, hour = 9, minute = 0) {
  return new Date(Date.UTC(year, month - 1, day, hour, minute, 0, 0));
}

function endOfDayUtc(year, month, day) {
  return dateUtc(year, month, day, 17, 30);
}

const academicEvents = [
  {
    title: 'IEEE ICRA 2026',
    description: 'IEEE International Conference on Robotics and Automation, a major robotics research and industry conference covering automation, autonomous systems, robot learning, perception, and real-world robotics applications.',
    location: 'Vienna, Austria',
    city: 'Vienna',
    startDate: dateUtc(2026, 6, 1),
    endDate: endOfDayUtc(2026, 6, 5),
    externalUrl: 'https://www.ieee-ras.org/conferences-workshops/fully-sponsored/icra',
    tags: ['ieee', 'robotics', 'automation', 'ai', 'research'],
  },
  {
    title: 'IEEE ICAD 2026',
    description: 'IEEE International Conference on AI and Data Analytics focused on AI applications, data analytics, research breakthroughs, industry use cases, and networking with AI practitioners.',
    location: 'Boston, Massachusetts, USA',
    city: 'Boston',
    startDate: dateUtc(2026, 6, 11),
    endDate: endOfDayUtc(2026, 6, 12),
    externalUrl: 'https://ieee-icad.org/',
    tags: ['ieee', 'ai', 'data-analytics', 'machine-learning'],
  },
  {
    title: 'IEEE WCCI 2026',
    description: 'IEEE World Congress on Computational Intelligence, bringing together neural networks, fuzzy systems, evolutionary computation, and broader computational intelligence research.',
    location: 'Maastricht, Netherlands',
    city: 'Maastricht',
    startDate: dateUtc(2026, 6, 21),
    endDate: endOfDayUtc(2026, 6, 26),
    externalUrl: 'https://wcci.klinkhamergroup.com/',
    tags: ['ieee', 'computational-intelligence', 'ai', 'neural-networks'],
  },
  {
    title: 'IEEE ICHMS 2026',
    description: 'IEEE International Conference on Human-Machine Systems for research on human-machine interaction, autonomous systems, AI-enabled decision support, and human-centered technology.',
    location: 'Singapore',
    city: 'Singapore',
    startDate: dateUtc(2026, 7, 1),
    endDate: endOfDayUtc(2026, 7, 3),
    externalUrl: 'https://ieeesmc.org/conferences/',
    tags: ['ieee', 'human-machine-systems', 'ai', 'hci'],
  },
  {
    title: 'IEEE ICCSE 2026',
    description: 'International Conference on Computer Science and Education with manuscripts intended for Springer or IEEE Xplore proceedings, covering computing education, software, systems, and research practice.',
    location: 'Hungary',
    city: 'Hungary',
    startDate: dateUtc(2026, 7, 21),
    endDate: endOfDayUtc(2026, 7, 25),
    externalUrl: 'https://www.ieee-iccse.org/downloadfile/Cfp-ICCSE2026-v1.pdf',
    tags: ['ieee', 'springer', 'computer-science', 'education'],
  },
  {
    title: 'IEEE CIBCB 2026',
    description: 'IEEE Conference on Computational Intelligence in Bioinformatics and Computational Biology, focused on computational intelligence methods for biological and biomedical data.',
    location: 'Athens, Greece',
    city: 'Athens',
    startDate: dateUtc(2026, 8, 31),
    endDate: endOfDayUtc(2026, 9, 2),
    externalUrl: 'https://ai.ieee.org/events/',
    tags: ['ieee', 'bioinformatics', 'computational-biology', 'ai'],
  },
  {
    title: 'IEEE ICDL 2026',
    description: 'IEEE International Conference on Development and Learning, gathering robotics, psychology, neuroscience, and machine learning researchers studying learning and development.',
    location: 'Kyoto University, Kyoto, Japan',
    city: 'Kyoto',
    startDate: dateUtc(2026, 9, 15),
    endDate: endOfDayUtc(2026, 9, 18),
    externalUrl: 'https://www.ieee-ras.org/event/2026-ieee-international-conference-on-development-and-learning-icdl-67399/',
    tags: ['ieee', 'robotics', 'machine-learning', 'developmental-learning'],
  },
  {
    title: 'IEEE IROS 2026',
    description: 'IEEE/RSJ International Conference on Intelligent Robots and Systems, a leading robotics and AI conference covering manipulation, autonomous systems, drones, perception, and human-robot interaction.',
    location: 'David L. Lawrence Convention Center, Pittsburgh, PA, USA',
    city: 'Pittsburgh',
    startDate: dateUtc(2026, 9, 27),
    endDate: endOfDayUtc(2026, 10, 1),
    externalUrl: 'https://2026.ieee-iros.org/',
    tags: ['ieee', 'robotics', 'ai', 'intelligent-systems'],
  },
  {
    title: 'ACM/IEEE JCDL 2026',
    description: 'ACM/IEEE Joint Conference on Digital Libraries, focused on digital libraries, information organization, discovery, preservation, AI, and access to complex collections.',
    location: 'Dallas, Texas, USA',
    city: 'Dallas',
    startDate: dateUtc(2026, 10, 13),
    endDate: endOfDayUtc(2026, 10, 16),
    externalUrl: 'https://2026.jcdl.org/',
    tags: ['ieee', 'acm', 'digital-libraries', 'information-science'],
  },
  {
    title: 'IEEE IC2E 2026',
    description: 'IEEE International Conference on Cloud Engineering, covering cloud systems, platforms, sustainability, storage, networking, databases, analytics, and cloud applications.',
    location: 'Santa Clara, California, USA',
    city: 'Santa Clara',
    startDate: dateUtc(2026, 10, 13),
    endDate: endOfDayUtc(2026, 10, 16),
    externalUrl: 'https://conferences.computer.org/IC2E/2026/index.html',
    tags: ['ieee', 'cloud', 'systems', 'software-engineering'],
  },
  {
    title: 'IEEE RISC 2026',
    description: 'IEEE Conference on Resilience and Integrated Security for Space and Critical Systems, covering security and resilience of space systems and critical infrastructure.',
    location: 'San Jose, California, USA',
    city: 'San Jose',
    startDate: dateUtc(2026, 11, 4),
    endDate: endOfDayUtc(2026, 11, 6),
    externalUrl: 'https://risc.ieee-cs.org/2026/',
    tags: ['ieee', 'security', 'space-systems', 'critical-infrastructure'],
  },
  {
    title: 'IEEE BlackSeaCom 2026',
    description: 'IEEE International Black Sea Conference on Communications and Networking, focused on intelligent connectivity, communications networks, 5G/6G, edge/cloud computing, IoT, cybersecurity, and vehicular networks.',
    location: 'Bucharest, Romania',
    city: 'Bucharest',
    startDate: dateUtc(2026, 6, 8),
    endDate: endOfDayUtc(2026, 6, 11),
    externalUrl: 'https://blackseacom2026.ieee-blackseacom.org/',
    tags: ['ieee', 'romania', 'communications', 'networking', '5g', '6g'],
  },
  {
    title: 'IEEE DEMOcon 2026',
    description: 'IEEE DEMOcon Digital Education and MOOCs Conference, combining the legacy of IEEE Learning with MOOCs and EMOOCs for research in digital education, open education, MOOCs, and learning technologies.',
    location: 'Politehnica University of Timisoara, Timisoara, Romania',
    city: 'Timisoara',
    startDate: dateUtc(2026, 6, 24),
    endDate: endOfDayUtc(2026, 6, 26),
    externalUrl: 'https://ieee-edusociety.org/event/conference/ieee-democon-digital-education-and-moocs-conference',
    tags: ['ieee', 'romania', 'education', 'moocs', 'learning-technologies'],
  },
  {
    title: 'IEEE icSmartGrid 2026',
    description: 'International Conference on Smart Grid in Suceava with IEEE technical co-sponsorship, covering smart grid research, renewable integration, microgrids, HVDC, optimization, reliability, and sustainability.',
    location: 'Suceava, Romania',
    city: 'Suceava',
    startDate: dateUtc(2026, 7, 6),
    endDate: endOfDayUtc(2026, 7, 9),
    externalUrl: 'https://www.icsmartgrid.org/',
    tags: ['ieee', 'romania', 'smart-grid', 'power', 'renewable-energy'],
  },
  {
    title: 'IEEE ICCNS 2026',
    description: 'International Conference on Intelligent Computing, Communication, Networking and Services in Bucharest, covering wireless systems, 5G/6G, IoT, edge/cloud computing, networking infrastructure, and automation systems.',
    location: 'Bucharest, Romania',
    city: 'Bucharest',
    startDate: dateUtc(2026, 9, 22),
    endDate: endOfDayUtc(2026, 9, 25),
    externalUrl: 'https://iccns-conference.org/',
    tags: ['ieee', 'romania', 'intelligent-computing', 'networking', 'iot'],
  },
  {
    title: 'IEEE Cyber-AI 2026',
    description: 'IEEE International Conference on Cybersecurity and AI-Based Systems in Bucharest, focused on cybersecurity, artificial intelligence, resilient systems, and AI-supported security methods.',
    location: 'Bucharest, Romania',
    city: 'Bucharest',
    startDate: dateUtc(2026, 9, 22),
    endDate: endOfDayUtc(2026, 9, 25),
    externalUrl: 'https://cyber-ai.org/program.php',
    tags: ['ieee', 'romania', 'cybersecurity', 'ai', 'security'],
  },
  {
    title: 'IEEE ICSTCC 2026',
    description: 'IEEE International Conference on System Theory, Control and Computing, technically co-sponsored by IEEE Control Systems Society, focused on control systems, automation, computing, and systems theory.',
    location: 'Hotel International Iasi, Iasi, Romania',
    city: 'Iasi',
    startDate: dateUtc(2026, 10, 21),
    endDate: endOfDayUtc(2026, 10, 24),
    externalUrl: 'https://icstcc.org/',
    tags: ['ieee', 'romania', 'control-systems', 'automation', 'computing'],
  },
  {
    title: 'IEEE ICCP 2026',
    description: 'IEEE International Conference on Intelligent Computer Communication and Processing in Cluj-Napoca, bringing together researchers and practitioners in communication, processing software, intelligent systems, and applied computing.',
    location: 'Cluj-Napoca, Romania',
    city: 'Cluj-Napoca',
    startDate: dateUtc(2026, 10, 22),
    endDate: endOfDayUtc(2026, 10, 24),
    externalUrl: 'https://iccp.ro/index/',
    tags: ['ieee', 'romania', 'computer-communication', 'processing', 'intelligent-systems'],
  },
  {
    title: 'IEEE EPEi 2026',
    description: 'IEEE International Conference and Exposition on Electrical and Power Engineering in Iasi, technically co-sponsored by IEEE Romania Section, covering electrical engineering, power systems, and energy technologies.',
    location: 'Iasi, Romania',
    city: 'Iasi',
    startDate: dateUtc(2026, 10, 22),
    endDate: endOfDayUtc(2026, 10, 24),
    externalUrl: 'https://www.epe.tuiasi.ro/',
    tags: ['ieee', 'romania', 'electrical-engineering', 'power-engineering', 'energy'],
  },
  {
    title: 'IEEE EHB 2026',
    description: 'International Conference on e-Health and Bioengineering in Iasi, covering digital health, biomedical engineering, medical bioengineering, and intelligent healthcare technologies, with prior proceedings indexed in IEEE Xplore.',
    location: 'Hybrid, Iasi, Romania',
    city: 'Iasi',
    startDate: dateUtc(2026, 11, 12),
    endDate: endOfDayUtc(2026, 11, 13),
    externalUrl: 'https://www.ehbconference.ro/',
    tags: ['ieee', 'romania', 'e-health', 'bioengineering', 'healthtech'],
  },
  {
    title: 'Springer CAiSE 2026',
    description: 'Springer LNCS proceedings for the International Conference on Advanced Information Systems Engineering, covering information systems, software engineering, process modeling, and enterprise systems.',
    location: 'Verona, Italy',
    city: 'Verona',
    startDate: dateUtc(2026, 6, 8),
    endDate: endOfDayUtc(2026, 6, 12),
    externalUrl: 'https://link.springer.com/book/9783032281098',
    tags: ['springer', 'lncs', 'information-systems', 'software-engineering'],
  },
  {
    title: 'Springer FORTE 2026',
    description: 'Springer LNCS proceedings for FORTE 2026, part of DisCoTec, focused on formal techniques for distributed objects, components, systems, models, tools, and applications.',
    location: 'Urbino, Italy',
    city: 'Urbino',
    startDate: dateUtc(2026, 6, 8),
    endDate: endOfDayUtc(2026, 6, 12),
    externalUrl: 'https://link.springer.com/book/9783032281869',
    tags: ['springer', 'lncs', 'distributed-systems', 'formal-methods'],
  },
  {
    title: 'Springer IPCO 2026',
    description: 'Springer LNCS proceedings for Integer Programming and Combinatorial Optimization, covering optimization theory, integer programming, algorithms, and combinatorial methods.',
    location: 'Padua, Italy',
    city: 'Padua',
    startDate: dateUtc(2026, 6, 17),
    endDate: endOfDayUtc(2026, 6, 19),
    externalUrl: 'https://link.springer.com/book/9783032286901',
    tags: ['springer', 'lncs', 'optimization', 'algorithms'],
  },
  {
    title: 'Springer ICCS 2026 Workshops',
    description: 'Springer proceedings for International Conference on Computational Science workshops, covering computational science, modeling, simulation, AI, and scientific computing.',
    location: 'Hamburg, Germany',
    city: 'Hamburg',
    startDate: dateUtc(2026, 6, 29),
    endDate: endOfDayUtc(2026, 7, 1),
    externalUrl: 'https://link.springer.com/book/9783032299086',
    tags: ['springer', 'computational-science', 'simulation', 'ai'],
  },
  {
    title: 'Springer Computing Conference 2026',
    description: 'Springer proceedings for Computing Conference 2026, covering intelligent computing, AI, machine learning, data science, cybersecurity, computer vision, and future computing architectures.',
    location: 'London, United Kingdom',
    city: 'London',
    startDate: dateUtc(2026, 7, 9),
    endDate: endOfDayUtc(2026, 7, 10),
    externalUrl: 'https://link.springer.com/book/9783032248060',
    tags: ['springer', 'intelligent-computing', 'ai', 'data-science'],
  },
  {
    title: 'Springer HCII HIMI 2026',
    description: 'Springer LNCS proceedings for HIMI 2026 at HCI International, focused on human interface and information management within human-computer interaction research.',
    location: 'Montreal, Quebec, Canada',
    city: 'Montreal',
    startDate: dateUtc(2026, 7, 26),
    endDate: endOfDayUtc(2026, 7, 31),
    externalUrl: 'https://link.springer.com/book/9783032291776',
    tags: ['springer', 'lncs', 'hci', 'information-management'],
  },
];

function normalizeEvent(event, organiserId) {
  return {
    ...event,
    category: 'conference',
    status: 'published',
    capacity: 300,
    registeredCount: 0,
    availableTickets: 300,
    price: 0,
    organiser: organiserId,
  };
}

async function main() {
  if (!process.env.MONGO_URI) {
    throw new Error('Missing MONGO_URI env var (set it in backend/.env or your shell).');
  }

  await mongoose.connect(process.env.MONGO_URI);

  const organiser =
    (await User.findOne({ email: 'gadge@gmail.com' }).select('_id email role').lean())
    || (await User.findOne({ role: 'organiser' }).select('_id email role').lean())
    || (await User.findOne({ role: 'admin' }).select('_id email role').lean());

  if (!organiser) {
    throw new Error('No organiser/admin user found. Create an organiser account first.');
  }

  const today = new Date();
  const upcomingEvents = academicEvents.filter((event) => {
    const end = new Date(event.endDate);
    end.setTime(end.getTime() + DAY_MS);
    return end >= today;
  });

  let inserted = 0;
  let updated = 0;

  for (const rawEvent of upcomingEvents) {
    const doc = normalizeEvent(rawEvent, organiser._id);
    const result = await Event.updateOne(
      { $or: [{ externalUrl: doc.externalUrl }, { title: doc.title }] },
      { $set: doc },
      { upsert: true },
    );

    if (result.upsertedCount) inserted += 1;
    else if (result.modifiedCount) updated += 1;
  }

  console.log(`Useful upcoming events: ${upcomingEvents.length}`);
  console.log(`Inserted: ${inserted}`);
  console.log(`Updated: ${updated}`);
  console.log(`Skipped completed/old: ${academicEvents.length - upcomingEvents.length}`);
}

main()
  .catch((err) => {
    console.error('ERROR:', err.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      await mongoose.disconnect();
    } catch {
      // ignore
    }
  });
