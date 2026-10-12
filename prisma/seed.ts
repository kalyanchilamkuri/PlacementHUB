/**
 * Demo data: students, companies, drives, offers and a live timeline.
 * Run with `npm run db:seed`. Safe to re-run: it stops if demo students exist.
 * Every demo student signs in with the password printed at the end.
 */
import { PrismaClient } from '@prisma/client';
import { randomBytes, scrypt } from 'node:crypto';
import { promisify } from 'node:util';

const db = new PrismaClient();
const scryptAsync = promisify(scrypt) as (p: string, s: string, k: number) => Promise<Buffer>;
const PASSWORD = 'Placement@2026';
const DOMAIN = process.env.ALLOWED_EMAIL_DOMAIN || 'iiitl.ac.in';

async function hash(p: string) {
  const salt = randomBytes(16).toString('hex');
  return `scrypt:${salt}:${(await scryptAsync(p, salt, 64)).toString('hex')}`;
}

let seed = 20260927;
const rnd = () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const pick = <T,>(xs: T[]) => xs[Math.floor(rnd() * xs.length)]!;
const between = (a: number, b: number) => a + rnd() * (b - a);
const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000);
const inDays = (n: number) => new Date(Date.now() + n * 86_400_000);
const L = (x: number) => Math.round(x * 100_000);

const FIRST = ['Aarav', 'Ananya', 'Rohan', 'Priya', 'Karthik', 'Sneha', 'Aditya', 'Ishita', 'Vikram', 'Meera', 'Arjun', 'Kavya', 'Rahul', 'Diya', 'Siddharth', 'Pooja', 'Nikhil', 'Riya', 'Harsh', 'Tanvi', 'Manish', 'Sanya', 'Yash', 'Neha', 'Varun', 'Aisha', 'Dev', 'Shruti', 'Kunal', 'Nandini'];
const LAST = ['Sharma', 'Verma', 'Gupta', 'Singh', 'Reddy', 'Iyer', 'Patel', 'Mishra', 'Nair', 'Kapoor', 'Yadav', 'Joshi', 'Chopra', 'Rao', 'Bansal', 'Tiwari', 'Khanna', 'Menon', 'Agarwal', 'Pandey'];
const SKILLS = ['React', 'Node.js', 'Python', 'Java', 'C++', 'SQL', 'Machine Learning', 'Docker', 'AWS', 'TypeScript', 'Go', 'Django', 'Flutter', 'Kubernetes', 'Verilog', 'Embedded C'];
const COMPANIES: [string, string, string][] = [
  ['Google', 'Technology', 'Bengaluru'],
  ['Microsoft', 'Technology', 'Hyderabad'],
  ['Amazon', 'E-commerce', 'Bengaluru'],
  ['Adobe', 'Software', 'Noida'],
  ['Atlassian', 'Software', 'Bengaluru'],
  ['Goldman Sachs', 'Finance', 'Bengaluru'],
  ['Flipkart', 'E-commerce', 'Bengaluru'],
  ['Zomato', 'Consumer tech', 'Gurugram'],
  ['Razorpay', 'Fintech', 'Bengaluru'],
  ['Texas Instruments', 'Semiconductors', 'Bengaluru'],
  ['Qualcomm', 'Semiconductors', 'Hyderabad'],
  ['TCS', 'IT services', 'Mumbai'],
  ['Infosys', 'IT services', 'Bengaluru'],
  ['Wipro', 'IT services', 'Bengaluru'],
  ['Zoho', 'Software', 'Chennai'],
  ['Deloitte', 'Consulting', 'Gurugram'],
];
const BIG = new Set(['Google', 'Microsoft', 'Amazon', 'Adobe', 'Atlassian', 'Goldman Sachs']);
const SERVICE = new Set(['TCS', 'Infosys', 'Wipro', 'Deloitte']);

/** Intern -> PPO conversions, so the status views have something to show. Runs once. */
async function conversions() {
  if ((await db.offer.count({ where: { convertedFrom: { not: null } } })) > 0) return;
  const interns = ['2_MONTH_INTERN', '6_MONTH_INTERN', 'WINTER_INTERN'];
  const ppos = await db.offer.findMany({ where: { offerType: 'PPO' } });
  for (const o of ppos)
    if (rnd() < 0.7) await db.offer.update({ where: { id: o.id }, data: { convertedFrom: pick(interns) } });
  const candidates = await db.offer.findMany({
    where: { offerType: { in: ['6_MONTH_INTERN', '2_MONTH_INTERN'] }, student: { batch: 2027 } },
  });
  let n = 0;
  for (const o of candidates) {
    if (rnd() > 0.45) continue;
    await db.offer.update({
      where: { id: o.id },
      data: { offerType: 'PPO', convertedFrom: o.offerType, ctc: L(Math.round(between(10, 32))), stipend: o.stipend },
    });
    n++;
  }
  console.log(`Marked PPO conversions (${n} interns converted).`);
}

async function main() {
  const adminEmail = `placement.cell@${DOMAIN}`;
  await db.user.upsert({
    where: { email: adminEmail },
    create: { email: adminEmail, name: 'Placement Cell', role: 'ADMIN', passwordHash: await hash(PASSWORD) },
    update: {},
  });

  await conversions();

  if ((await db.student.count({ where: { rollNo: { startsWith: 'L' } } })) > 0) {
    console.log(`Demo students already exist. Placement cell demo account: ${adminEmail}`);
    return;
  }

  for (const [code, name] of [['CSE', 'Computer Science and Engineering'], ['IT', 'Information Technology'], ['ECE', 'Electronics and Communication']] as const)
    await db.branch.upsert({ where: { code }, create: { code, name, programme: 'B.Tech' }, update: {} });

  const passwordHash = await hash(PASSWORD);
  const used = new Set<string>();

  // batch -> year-of-study during 2026-27
  const cohorts = [
    { batch: 2026, n: 28 },
    { batch: 2027, n: 30 },
    { batch: 2028, n: 30 },
  ];
  const students: { id: string; userId: string; name: string; batch: number; branch: string; cgpa: number }[] = [];
  let serial = 0;

  for (const c of cohorts) {
    for (let i = 0; i < c.n; i++) {
      let name = '';
      do name = `${pick(FIRST)} ${pick(LAST)}`;
      while (used.has(name));
      used.add(name);
      serial++;
      const branch = pick(['CSE', 'CSE', 'CSE', 'IT', 'IT', 'ECE']);
      const roll = `L${branch === 'ECE' ? 'EC' : branch === 'IT' ? 'IT' : 'CS'}${c.batch - 4}${String(i + 1).padStart(3, '0')}`;
      const cgpa = Math.round(between(6.2, 9.7) * 100) / 100;
      const skills = [...new Set(Array.from({ length: 3 + Math.floor(rnd() * 3) }, () => pick(SKILLS)))].join(', ');
      const user = await db.user.create({
        data: {
          name,
          email: `${name.toLowerCase().replace(/ /g, '.')}${serial}@${DOMAIN}`,
          passwordHash,
          role: 'STUDENT',
          student: {
            create: {
              rollNo: roll,
              branchCode: branch,
              batch: c.batch,
              cgpa,
              tenthPct: Math.round(between(78, 98)),
              twelfthPct: Math.round(between(75, 97)),
              phone: `9${Math.floor(100000000 + rnd() * 899999999)}`,
              skills,
              linkedinUrl: rnd() > 0.4 ? `https://linkedin.com/in/${name.toLowerCase().replace(/ /g, '-')}-${serial}` : null,
              verified: rnd() > 0.3,
            },
          },
        },
        include: { student: true },
      });
      students.push({ id: user.student!.id, userId: user.id, name, batch: c.batch, branch, cgpa });
    }
  }

  const companies = new Map<string, string>();
  for (const [name, sector, hq] of COMPANIES) {
    const c = await db.company.upsert({ where: { name }, create: { name, sector, hq }, update: {} });
    companies.set(name, c.id);
  }

  // Which students are 3rd / 4th year in each season.
  const seasons = [
    { year: '2025-26', third: 2027, fourth: 2026, age: 330 },
    { year: '2026-27', third: 2028, fourth: 2027, age: 40 },
  ];

  const place = async (
    s: (typeof students)[number],
    companyName: string,
    year: string,
    yearOfStudy: 3 | 4,
    offerType: string,
    ctcLpa: number,
    stipend: number | null,
    when: Date,
    onCampus = true,
  ) => {
    const companyId = companies.get(companyName)!;
    const driveType = onCampus ? (yearOfStudy === 3 ? 'Internship' : 'Full-time') : 'Off-campus';
    let drive = await db.drive.findFirst({ where: { companyId, academicYear: year, yearOfStudy, type: driveType } });
    drive ??= await db.drive.create({
      data: {
        companyId,
        role: yearOfStudy === 3 ? 'Software Engineering Intern' : onCampus ? 'Software Engineer' : 'Off-campus role',
        type: driveType,
        ctc: L(ctcLpa),
        stipend,
        deadline: when,
        status: 'COMPLETED',
        season: year,
        academicYear: year,
        yearOfStudy,
        minCgpa: 6.5,
        rounds: onCampus
          ? { create: [{ order: 1, name: 'Online assessment', type: 'OA' }, { order: 2, name: 'Technical interview', type: 'TECH' }, { order: 3, name: 'HR interview', type: 'HR' }] }
          : undefined,
        createdAt: new Date(when.getTime() - 20 * 86_400_000),
      },
      include: { rounds: true },
    });
    await db.application.create({ data: { driveId: drive.id, studentId: s.id, stage: 'OFFER', appliedAt: new Date(when.getTime() - 12 * 86_400_000) } });
    await db.offer.create({
      data: { studentId: s.id, driveId: drive.id, ctc: L(ctcLpa), offerType, isOnCampus: onCampus, stipend, offeredOn: when },
    });
    const label = { FULL_TIME: 'full-time', PPO: 'PPO', WINTER_INTERN: 'winter intern', '6_MONTH_INTERN': '6-month intern', '2_MONTH_INTERN': '2-month intern' }[offerType];
    await db.timelineEvent.create({
      data: {
        studentId: s.id,
        driveId: drive.id,
        type: onCampus ? 'OFFER_RECORDED' : 'OFFER_OFFCAMPUS',
        message: `${s.name} got a ${label} offer at ${companyName}${onCampus ? '' : ' (off-campus)'}`,
        ctc: L(ctcLpa),
        offerType,
        createdAt: when,
      },
    });
  };

  const bigNames = [...BIG];
  const allNames = COMPANIES.map((c) => c[0]);

  for (const season of seasons) {
    const third = students.filter((s) => s.batch === season.third);
    const fourth = students.filter((s) => s.batch === season.fourth);
    const current = season.year === '2026-27';

    // 3rd year internships (about 60% land one).
    for (const s of third) {
      if (rnd() > 0.6) continue;
      const six = rnd() > 0.55;
      const co = pick(s.cgpa > 8.3 ? bigNames : allNames);
      await place(s, co, season.year, 3, six ? '6_MONTH_INTERN' : '2_MONTH_INTERN', 0, Math.round(between(25, BIG.has(co) ? 90 : 40)) * 1000, daysAgo(season.age + Math.floor(rnd() * 90)), rnd() > 0.12);
    }

    // 4th year: winter interns, PPOs and full-time.
    for (const s of fourth) {
      const r = rnd();
      const when = daysAgo(season.age + Math.floor(rnd() * 120));
      if (current) {
        if (r < 0.3) await place(s, pick(allNames), season.year, 4, 'WINTER_INTERN', 0, Math.round(between(30, 80)) * 1000, when);
        else if (r < 0.5) await place(s, pick(bigNames), season.year, 4, 'PPO', between(14, 38), null, when);
        else if (r < 0.62) await place(s, pick(allNames), season.year, 4, 'FULL_TIME', between(6, 24), null, when);
      } else if (r < 0.82) {
        const co = pick(s.cgpa > 8.5 ? bigNames : allNames);
        const ctc = SERVICE.has(co) ? between(3.6, 7.5) : BIG.has(co) ? between(18, 46) : between(8, 22);
        await place(s, co, season.year, 4, r < 0.15 ? 'PPO' : 'FULL_TIME', Math.round(ctc * 10) / 10, null, when, rnd() > 0.1);
      }
    }
  }

  // Live drives with applicants partway through the rounds.
  const live: [string, string, number, number, number][] = [
    ['Razorpay', 'Backend Engineer', 16, 7.5, 6],
    ['Zoho', 'Member Technical Staff', 8, 6.5, 4],
    ['Texas Instruments', 'Analog Design Engineer', 14, 7.5, 8],
  ];
  const fourth27 = students.filter((s) => s.batch === 2027);
  for (const [co, role, ctc, minCgpa, days] of live) {
    const drive = await db.drive.create({
      data: {
        companyId: companies.get(co)!,
        role,
        type: 'Full-time',
        ctc: L(ctc),
        locations: 'Bengaluru',
        deadline: inDays(days),
        status: 'PUBLISHED',
        season: '2026-27',
        academicYear: '2026-27',
        yearOfStudy: 4,
        minCgpa,
        rounds: {
          create: [
            { order: 1, name: 'Online assessment', type: 'OA', startsAt: inDays(days + 2) },
            { order: 2, name: 'Technical interview', type: 'TECH', startsAt: inDays(days + 5) },
            { order: 3, name: 'HR interview', type: 'HR', startsAt: inDays(days + 7) },
          ],
        },
      },
      include: { rounds: true },
    });
    for (const s of fourth27.filter((x) => x.cgpa >= minCgpa).slice(0, 10)) {
      const exists = await db.application.findFirst({ where: { driveId: drive.id, studentId: s.id } });
      if (exists) continue;
      await db.application.create({ data: { driveId: drive.id, studentId: s.id } });
    }
  }

  await db.notice.create({
    data: {
      title: 'Resume freeze for the winter internship season',
      body: 'Upload your final resume by Friday. Verified academics only.\nThe cell will not accept changes after the freeze.',
      priority: 'URGENT',
    },
  });

  const [st, off] = await Promise.all([db.student.count(), db.offer.count()]);
  console.log(`Seeded ${st} students and ${off} offers.`);
  console.log(`Demo placement cell: ${adminEmail}`);
  console.log(`Demo password (all demo accounts): ${PASSWORD}`);
}

main().finally(() => db.$disconnect());
