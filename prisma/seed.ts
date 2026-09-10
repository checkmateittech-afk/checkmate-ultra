import { PrismaClient } from "@prisma/client";
import { PLANS } from "../src/lib/plans";

const db = new PrismaClient();

// ---------- deterministic RNG so re-seeds are stable ----------
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(42);
const pick = <T,>(arr: T[]) => arr[Math.floor(rnd() * arr.length)];
const between = (min: number, max: number) => Math.floor(rnd() * (max - min + 1)) + min;

const CATEGORIES = [
  { slug: "packers-and-movers", name: "Packers & Movers", icon: "Truck", blurb: "Home & office relocation, local and intercity.", leadPrice: 40 },
  { slug: "home-cleaning", name: "Home Cleaning", icon: "Sparkles", blurb: "Deep cleaning, kitchen, bathroom and sofa care.", leadPrice: 20 },
  { slug: "electricians", name: "Electricians", icon: "Plug", blurb: "Wiring, repairs, fittings and inverter setup.", leadPrice: 15 },
  { slug: "plumbers", name: "Plumbers", icon: "Wrench", blurb: "Leak fixes, taps, tanks and bathroom fittings.", leadPrice: 15 },
  { slug: "painters", name: "Painters", icon: "PaintRoller", blurb: "Interior, exterior, texture and waterproofing.", leadPrice: 30 },
  { slug: "pest-control", name: "Pest Control", icon: "Bug", blurb: "Cockroach, termite, bed bug and mosquito control.", leadPrice: 20 },
  { slug: "ac-service", name: "AC Service & Repair", icon: "Wind", blurb: "Servicing, gas refill, installation and uninstallation.", leadPrice: 18 },
  { slug: "interior-designers", name: "Interior Designers", icon: "Ruler", blurb: "Full-home interiors, modular kitchens and wardrobes.", leadPrice: 80 },
  { slug: "home-tutors", name: "Home Tutors", icon: "GraduationCap", blurb: "CBSE, ICSE and State board tuition, all subjects.", leadPrice: 15 },
  { slug: "yoga-classes", name: "Yoga Classes", icon: "Activity", blurb: "Personal and group sessions, therapy and prenatal.", leadPrice: 15 },
  { slug: "wedding-photographers", name: "Wedding Photographers", icon: "Camera", blurb: "Candid, traditional, pre-wedding and video teams.", leadPrice: 60 },
  { slug: "event-caterers", name: "Event Caterers", icon: "UtensilsCrossed", blurb: "Weddings, parties and corporate — veg & non-veg.", leadPrice: 45 },
];

const CITIES = [
  {
    slug: "bengaluru",
    name: "Bengaluru",
    state: "Karnataka",
    localities: ["Indiranagar", "Koramangala", "Whitefield", "HSR Layout", "Jayanagar", "Marathahalli", "Electronic City", "Yelahanka"],
  },
  {
    slug: "pune",
    name: "Pune",
    state: "Maharashtra",
    localities: ["Kothrud", "Baner", "Hinjewadi", "Viman Nagar", "Wakad", "Aundh", "Hadapsar", "Kharadi"],
  },
];

const BRAND_WORDS = ["Sri", "Balaji", "Royal", "Prime", "Elite", "Green", "Star", "Metro", "Trusty", "Apex", "Urban", "Sunrise", "Perfect", "Quick", "Sai", "Crown"];
const SUFFIX_BY_CAT: Record<string, string[]> = {
  "packers-and-movers": ["Packers & Movers", "Relocations", "Cargo Movers", "Logistics"],
  "home-cleaning": ["Home Care", "Cleaning Services", "Facility Care", "Shine Cleaners"],
  electricians: ["Electricals", "Electric Works", "Power Solutions", "Electrical Services"],
  plumbers: ["Plumbing Works", "Plumbing Services", "Sanitary Solutions", "Pipes & Fittings"],
  painters: ["Painters", "Paint House", "Wall Decor", "Colours"],
  "pest-control": ["Pest Control", "Hygiene Services", "Pest Solutions", "Fumigation"],
  "ac-service": ["Cool Care", "AC Services", "Climate Care", "Aircon Experts"],
  "interior-designers": ["Interiors", "Design Studio", "Interior Concepts", "Spaces"],
  "home-tutors": ["Tutorials", "Learning Centre", "Home Tuitions", "Academy"],
  "yoga-classes": ["Yoga Studio", "Wellness", "Yoga Kendra", "Yoga & Fitness"],
  "wedding-photographers": ["Photography", "Studios", "Films", "Frames"],
  "event-caterers": ["Caterers", "Catering Co.", "Food Services", "Kitchen"],
};
const PRICE_META: Record<string, { from: [number, number]; unit: string }> = {
  "packers-and-movers": { from: [4000, 9000], unit: "per move" },
  "home-cleaning": { from: [1200, 3500], unit: "per visit" },
  electricians: { from: [200, 500], unit: "per visit" },
  plumbers: { from: [250, 600], unit: "per visit" },
  painters: { from: [12, 25], unit: "per sq ft" },
  "pest-control": { from: [900, 2500], unit: "per treatment" },
  "ac-service": { from: [450, 800], unit: "per unit" },
  "interior-designers": { from: [120000, 400000], unit: "project onwards" },
  "home-tutors": { from: [400, 900], unit: "per hour" },
  "yoga-classes": { from: [1500, 4000], unit: "per month" },
  "wedding-photographers": { from: [35000, 120000], unit: "per event" },
  "event-caterers": { from: [350, 900], unit: "per plate" },
};

const FIRST = ["Rahul", "Priya", "Amit", "Sneha", "Vikram", "Anjali", "Karthik", "Deepa", "Rohan", "Meera", "Arjun", "Kavya", "Suresh", "Nisha", "Manoj", "Pooja"];
const LAST = ["Sharma", "Iyer", "Reddy", "Nair", "Gupta", "Rao", "Menon", "Patil", "Kulkarni", "Shetty", "Verma", "Joshi"];
const REVIEW_TITLES = ["Very professional", "On time and neat", "Highly recommend", "Good value for money", "Polite and skilled staff", "Job done well", "Slightly delayed but good work", "Excellent service"];
const REVIEW_BODIES = [
  "Booked them through Checkmate and the team arrived on schedule. Work was tidy and they cleaned up afterwards.",
  "Reasonable pricing and no last-minute changes to the quote. Would use again.",
  "Responsive on calls, explained everything clearly before starting. Happy with the result.",
  "Quality of work was good. Took a little longer than promised but the outcome was worth it.",
  "Staff were courteous and careful with our belongings. Smooth experience overall.",
  "Fair estimate, punctual, and stood by their work when we asked for a small fix.",
];
const ABOUT = (cat: string, city: string) =>
  `Established local team serving ${city} and nearby areas. We handle ${cat.toLowerCase()} jobs of every size with trained staff, transparent pricing and on-time service. Free site assessment and written quotes before any work begins.`;

async function main() {
  console.log("Clearing existing data…");
  await db.course.deleteMany();
  await db.courseCategory.deleteMany();
  await db.walletTransaction.deleteMany();
  await db.wallet.deleteMany();
  await db.subscription.deleteMany();
  await db.lead.deleteMany();
  await db.review.deleteMany();
  await db.providerPhoto.deleteMany();
  await db.providerService.deleteMany();
  await db.kycSubmission.deleteMany();
  await db.leadRequest.deleteMany();
  await db.provider.deleteMany();
  await db.locality.deleteMany();
  await db.city.deleteMany();
  await db.category.deleteMany();
  await db.plan.deleteMany();
  await db.otpChallenge.deleteMany();
  await db.user.deleteMany();

  console.log("Seeding plans…");
  for (const p of PLANS) {
    await db.plan.create({ data: { ...p } });
  }

  console.log("Seeding categories…");
  const categoryRows = [];
  for (let i = 0; i < CATEGORIES.length; i++) {
    categoryRows.push(await db.category.create({ data: { ...CATEGORIES[i], sortOrder: i } }));
  }

  console.log("Seeding cities & localities…");
  const cityRows = [];
  for (const c of CITIES) {
    const city = await db.city.create({
      data: {
        slug: c.slug,
        name: c.name,
        state: c.state,
        localities: {
          create: c.localities.map((n) => ({ slug: slugify(n), name: n })),
        },
      },
      include: { localities: true },
    });
    cityRows.push(city);
  }

  console.log("Seeding providers…");
  let total = 0;
  for (const city of cityRows) {
    for (const category of categoryRows) {
      const count = between(2, 4);
      for (let n = 0; n < count; n++) {
        const brand = pick(BRAND_WORDS);
        const suffix = pick(SUFFIX_BY_CAT[category.slug]);
        const name = `${brand} ${suffix}`;
        const locality = pick(city.localities);
        const slug = `${slugify(name)}-${city.slug}-${(++total).toString(36)}`;
        const pm = PRICE_META[category.slug];

        const nReviews = between(3, 9);
        const reviews = Array.from({ length: nReviews }).map(() => {
          const stars = pick([5, 5, 5, 4, 4, 4, 3, 5, 4]);
          return {
            authorName: `${pick(FIRST)} ${pick(LAST)}`,
            rating: stars,
            title: pick(REVIEW_TITLES),
            body: pick(REVIEW_BODIES),
            createdAt: new Date(Date.now() - between(1, 400) * 86400000),
          };
        });
        const ratingAvg = Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10;

        // 60% single-category providers, 40% also offer one adjacent category
        const extra = rnd() < 0.4 ? pick(categoryRows.filter((c) => c.id !== category.id)) : null;
        const isVerified = rnd() < 0.6;
        const tierRoll = rnd();
        const tier = tierRoll > 0.92 ? "PRO" : tierRoll > 0.78 ? "STARTER" : "FREE";
        const rankBoost = tier === "PRO" ? 2 : tier === "STARTER" ? 1 : 0;
        // ~20% of free providers have an empty wallet (won't receive fan-out leads).
        const startBalance =
          tier === "PRO" ? between(500, 1200) : tier === "STARTER" ? between(150, 600) : rnd() < 0.2 ? 0 : between(15, 250);

        const provider = await db.provider.create({
          data: {
            slug,
            name,
            about: ABOUT(category.name, city.name),
            phone: `+91 ${between(70, 99)}${between(10000000, 99999999)}`,
            email: `${slugify(brand)}.${category.slug.split("-")[0]}@example.com`,
            verified: isVerified,
            status: "ACTIVE",
            kycStatus: isVerified ? "VERIFIED" : "UNVERIFIED",
            tier,
            rankBoost,
            yearsInBusiness: between(1, 18),
            ratingAvg,
            ratingCount: nReviews,
            addressLine: `${between(1, 220)}, ${locality.name} Main Road`,
            cityId: city.id,
            localityId: locality.id,
            services: {
              create: [
                { categoryId: category.id, priceFrom: between(pm.from[0], pm.from[1]), priceUnit: pm.unit },
                ...(extra
                  ? [
                      {
                        categoryId: extra.id,
                        priceFrom: between(PRICE_META[extra.slug].from[0], PRICE_META[extra.slug].from[1]),
                        priceUnit: PRICE_META[extra.slug].unit,
                      },
                    ]
                  : []),
              ],
            },
            createdAt: new Date(Date.now() - between(0, 75) * 86400000),
            reviews: { create: reviews },
            photos: {
              create: Array.from({ length: between(3, 5) }).map((_, i) => ({
                label: `${category.name} work sample ${i + 1}`,
                tint: pick(["f2620f", "1f3a5f", "0f766e", "7c3aed", "b45309", "be123c"]),
                sortOrder: i,
              })),
            },
          },
        });

        const wallet = await db.wallet.create({
          data: { providerId: provider.id, balance: startBalance },
        });
        if (startBalance > 0) {
          await db.walletTransaction.create({
            data: {
              walletId: wallet.id,
              type: tier === "FREE" ? "TOPUP" : "PLAN_GRANT",
              amount: startBalance,
              balanceAfter: startBalance,
              note: tier === "FREE" ? "Initial top-up" : `${tier} plan monthly credits`,
            },
          });
        }
        if (tier !== "FREE") {
          const end = new Date();
          end.setMonth(end.getMonth() + 1);
          await db.subscription.create({
            data: { providerId: provider.id, planSlug: tier, currentPeriodEnd: end },
          });
        }
      }
    }
  }

  console.log("Seeding users…");
  await db.user.createMany({
    data: [
      { phone: "+919000000001", name: "Checkmate Admin", email: "admin@checkmate.local", role: "ADMIN" },
      { phone: "+919000000002", name: "Moderator", email: "mod@checkmate.local", role: "MODERATOR" },
      { phone: "+919888800001", name: "Anita Rao", role: "CONSUMER" },
    ],
  });
  // Historical consumer signups spread over the last ~60 days (for admin charts).
  const histUsers = Array.from({ length: 44 }).map((_, i) => ({
    phone: `+9187${i.toString().padStart(4, "0")}${between(100000, 999999)}`,
    name: `${pick(FIRST)} ${pick(LAST)}`,
    role: "CONSUMER",
    createdAt: new Date(Date.now() - between(0, 60) * 86400000),
    lastLogin: rnd() < 0.5 ? new Date(Date.now() - between(0, 20) * 86400000) : null,
  }));
  await db.user.createMany({ data: histUsers });

  console.log("Seeding historical enquiries…");
  const allProviders = await db.provider.findMany({
    where: { status: "ACTIVE" },
    select: {
      id: true,
      tier: true,
      services: { select: { category: { select: { slug: true } } } },
      city: { select: { slug: true } },
      wallet: { select: { id: true, balance: true } },
    },
  });
  const catBySlug = Object.fromEntries(categoryRows.map((c) => [c.slug, c]));
  const bal = new Map(allProviders.map((p) => [p.id, p.wallet?.balance ?? 0]));
  const spent = new Map(allProviders.map((p) => [p.id, 0]));
  const discountFor = (tier: string) => (tier === "PRO" ? 20 : tier === "STARTER" ? 10 : 0);

  let histLeads = 0;
  for (let i = 0; i < 190; i++) {
    const cat = pick(categoryRows);
    const city = pick(cityRows);
    const when = new Date(Date.now() - between(0, 21) * 86400000 - between(0, 23) * 3600000);
    const lr = await db.leadRequest.create({
      data: {
        name: `${pick(FIRST)} ${pick(LAST)}`,
        phone: `+91 ${between(70, 99)}${between(10000000, 99999999)}`,
        message: pick([
          `Looking for ${cat.name.toLowerCase()} in ${city.name}. Please share a quote.`,
          `Need ${cat.name.toLowerCase()} this week. What are your charges?`,
          `Requirement for ${cat.name.toLowerCase()} — 2BHK, ${city.name}.`,
          `Urgent ${cat.name.toLowerCase()} needed. Are you available?`,
        ]),
        categorySlug: cat.slug,
        citySlug: city.slug,
        source: "web",
        status: "NEW",
        createdAt: when,
      },
    });
    histLeads++;

    const matches = allProviders
      .filter((p) => p.city.slug === city.slug && p.services.some((s) => s.category.slug === cat.slug))
      .slice(0, between(0, 3));
    for (const m of matches) {
      const cost = Math.max(1, Math.round(catBySlug[cat.slug].leadPrice * (1 - discountFor(m.tier) / 100)));
      const current = bal.get(m.id) ?? 0;
      if (!m.wallet || current < cost) continue;
      const after = current - cost;
      bal.set(m.id, after);
      spent.set(m.id, (spent.get(m.id) ?? 0) + cost);
      await db.lead.create({
        data: {
          leadRequestId: lr.id,
          providerId: m.id,
          creditCost: cost,
          chargedAt: when,
          status: pick(["NEW", "VIEWED", "VIEWED", "CONTACTED", "CONTACTED", "WON", "LOST"]),
          createdAt: when,
        },
      });
      await db.walletTransaction.create({
        data: {
          walletId: m.wallet.id,
          type: "LEAD_CHARGE",
          amount: -cost,
          balanceAfter: after,
          refType: "lead_request",
          refId: lr.id,
          note: `Lead in ${cat.slug}`,
          createdAt: when,
        },
      });
    }
  }
  // Write back the running balances / lifetime spend.
  for (const p of allProviders) {
    if (!p.wallet) continue;
    await db.wallet.update({
      where: { id: p.wallet.id },
      data: { balance: bal.get(p.id) ?? p.wallet.balance, lifetimeSpent: spent.get(p.id) ?? 0 },
    });
  }

  console.log("Seeding team + courses…");
  await db.user.create({ data: { phone: "+919777700001", name: "Priya Editor", role: "EDITOR" } });
  const admin = await db.user.findUniqueOrThrow({ where: { phone: "+919000000001" } });

  const COURSE_CATS = [
    { name: "Business Analysis", blurb: "Requirements, process modelling, Agile delivery and stakeholder management." },
    { name: "Quality Assurance", blurb: "Manual testing, automation, API and performance testing." },
    { name: "Cloud & DevOps", blurb: "AWS, Azure, containers, CI/CD and infrastructure as code." },
    { name: "Data & Analytics", blurb: "SQL, Python, BI tools, machine learning and big data." },
    { name: "Web Development", blurb: "Front-end, back-end and full-stack engineering tracks." },
    { name: "Cybersecurity", blurb: "Security fundamentals, ethical hacking and cloud security." },
  ];
  const catRows: Record<string, string> = {};
  for (let i = 0; i < COURSE_CATS.length; i++) {
    const c = await db.courseCategory.create({
      data: { name: COURSE_CATS[i].name, slug: slugify(COURSE_CATS[i].name), blurb: COURSE_CATS[i].blurb, sortOrder: i },
    });
    catRows[c.name] = c.id;
  }

  const faq = (arr: [string, string][]) => JSON.stringify(arr.map(([q, a]) => ({ q, a })));
  const COURSES = [
    {
      cat: "Business Analysis",
      title: "Business Analyst Training",
      subtitle: "Instructor-led · job-ready in 10 weeks",
      tint: "1f3a5f",
      summary:
        "A complete, hands-on Business Analyst program covering requirements engineering, process modelling, Agile delivery and the tools BAs use every day.",
      overview:
        "This program takes you from the fundamentals of business analysis to confidently running discovery, elicitation and backlog refinement on a live project.\n\nYou will work through real case studies, produce a full requirements package (BRD, FRD, user stories, process maps) and finish with a capstone you can show in interviews. Sessions are live and recorded, with weekly assignments reviewed by your trainer.",
      mode: "ONLINE",
      level: "Beginner to Intermediate",
      durationText: "10 weeks · 50 hrs",
      feeText: "₹35,000",
      trainer: "Senior BA practitioners",
      highlights:
        "Requirements elicitation techniques\nBPMN & UML process modelling\nUser stories, acceptance criteria & backlog grooming\nAgile / Scrum ceremonies in practice\nSQL for analysts\nStakeholder communication & workshops\nCapstone project + interview prep",
      curriculum:
        "Introduction to business analysis & the BA role\nStakeholder analysis and elicitation\nRequirements documentation (BRD / FRD / SRS)\nProcess modelling with BPMN\nUML for BAs — use case & activity diagrams\nUser stories, epics and acceptance criteria\nAgile, Scrum and the BA in a sprint\nSQL and data analysis basics\nUAT planning and defect triage\nCapstone project & mock interviews",
      audience: "Freshers and working professionals moving into BA, product or consulting roles.",
      prereq: "No coding required. Comfort with spreadsheets and clear written English helps.",
      faq: faq([
        ["Is this course beginner friendly?", "Yes. We start from first principles and build up to a live project, so no prior BA experience is needed."],
        ["Will I get a certificate?", "Yes, a certificate of completion is issued after you submit the capstone project."],
        ["Are sessions recorded?", "Every live session is recorded and shared, so you can catch up if you miss a class."],
        ["Do you help with interviews?", "The last module is dedicated to resume review, mock interviews and portfolio prep."],
      ]),
    },
    {
      cat: "Quality Assurance",
      title: "QA Automation with Selenium & Playwright",
      subtitle: "Manual + automation, one track",
      tint: "0f766e",
      summary:
        "Become a job-ready SDET: manual testing foundations, then automation with Selenium, Playwright, TestNG and CI pipelines.",
      overview:
        "Start with test design and manual testing discipline, then automate. You'll build a maintainable framework from scratch using the Page Object Model, run it in CI, and add API and cross-browser coverage.\n\nBy the end you'll have a portfolio framework on GitHub and the vocabulary to pass SDET interviews.",
      mode: "ONLINE",
      level: "Beginner to Advanced",
      durationText: "12 weeks · 60 hrs",
      feeText: "₹32,000",
      trainer: "Automation leads",
      highlights:
        "Test case design & bug reporting\nSelenium WebDriver + TestNG\nPlaywright for modern web apps\nPage Object Model & framework design\nAPI testing with REST Assured / Postman\nCI with GitHub Actions / Jenkins\nParallel & cross-browser runs",
      curriculum:
        "SDLC, STLC and test design techniques\nDefect life cycle and tools (Jira)\nJava essentials for testers\nSelenium WebDriver fundamentals\nTestNG, assertions and reporting\nBuilding a POM framework\nPlaywright basics and fixtures\nAPI testing fundamentals\nData-driven and parallel execution\nCI/CD integration and capstone",
      audience: "Manual testers wanting automation skills, and freshers targeting SDET roles.",
      prereq: "Basic programming logic. We cover the Java you need.",
      faq: faq([
        ["Do I need to know Java already?", "No — a Java primer for testers is built into the course."],
        ["Selenium or Playwright — which do you teach?", "Both. Selenium for breadth and interviews, Playwright for modern projects."],
        ["Is there a real project?", "Yes, you build and ship a framework to GitHub as your capstone."],
      ]),
    },
    {
      cat: "Cloud & DevOps",
      title: "AWS DevOps Engineer Bootcamp",
      subtitle: "CI/CD, containers and IaC on AWS",
      tint: "b45309",
      summary:
        "Hands-on DevOps on AWS: Linux, Git, Docker, Kubernetes, Terraform and building real CI/CD pipelines.",
      overview:
        "A practical bootcamp that mirrors a real DevOps role. You provision infrastructure with Terraform, containerise apps, deploy to EKS, and wire up pipelines that build, test and release automatically.\n\nEvery module ends with a lab in your own AWS sandbox.",
      mode: "HYBRID",
      level: "Intermediate",
      durationText: "14 weeks · 70 hrs",
      feeText: "₹45,000",
      trainer: "AWS-certified engineers",
      highlights:
        "Linux & shell scripting\nGit branching strategies\nDocker & image best practices\nKubernetes / EKS deployments\nTerraform infrastructure as code\nCI/CD with GitHub Actions & Jenkins\nMonitoring with CloudWatch & Prometheus",
      curriculum:
        "Linux administration and networking\nGit, GitHub and workflows\nContainers with Docker\nContainer orchestration with Kubernetes\nAWS core services (EC2, VPC, IAM, S3)\nInfrastructure as code with Terraform\nBuilding CI/CD pipelines\nObservability and logging\nSecurity and secrets management\nCapstone: end-to-end delivery pipeline",
      audience: "Developers, sysadmins and QA engineers moving into DevOps / SRE.",
      prereq: "Comfort on the command line and basic cloud awareness.",
      faq: faq([
        ["Do I need my own AWS account?", "A guided sandbox is provided; we also show you how to stay within the free tier."],
        ["Is this classroom or online?", "Hybrid — weekday sessions online, optional weekend lab days in-centre."],
      ]),
    },
    {
      cat: "Data & Analytics",
      title: "Data Analytics with Python & Power BI",
      subtitle: "From spreadsheets to dashboards",
      tint: "7c3aed",
      summary:
        "Turn raw data into decisions: SQL, Python (pandas), statistics and interactive dashboards in Power BI.",
      overview:
        "A career-focused analytics course. You'll query databases with SQL, wrangle and visualise data in Python, apply core statistics, and build polished Power BI dashboards with a real dataset.\n\nThe capstone is a stakeholder-ready report you present live.",
      mode: "ONLINE",
      level: "Beginner to Intermediate",
      durationText: "10 weeks · 45 hrs",
      feeText: "₹28,000",
      trainer: "Practising data analysts",
      highlights:
        "SQL for analysis (joins, window functions)\nPython & pandas for data wrangling\nExploratory data analysis & visualisation\nStatistics for decision-making\nPower BI data modelling & DAX\nDashboard design principles\nStorytelling with data",
      curriculum:
        "Analytics workflow and tooling\nSQL fundamentals to advanced\nPython basics for analysts\npandas: cleaning and transforming data\nVisualisation with matplotlib / seaborn\nDescriptive & inferential statistics\nPower BI: connect, model, DAX\nBuilding and sharing dashboards\nData storytelling\nCapstone analysis & presentation",
      audience: "Freshers, MIS/reporting staff and professionals moving into analytics.",
      prereq: "Basic Excel. No prior coding needed.",
      faq: faq([
        ["Power BI or Tableau?", "This track uses Power BI. The concepts transfer directly to Tableau."],
        ["Will this help me switch careers?", "Yes — it's designed around the analyst job description, with portfolio and interview support."],
      ]),
    },
    {
      cat: "Web Development",
      title: "Full-Stack Web Development (MERN)",
      subtitle: "Build and deploy real apps",
      tint: "1d4ed8",
      summary:
        "Front-to-back web engineering with React, Node, Express and MongoDB — plus Git, testing and deployment.",
      overview:
        "A project-driven full-stack course. You build several apps culminating in a production-style MERN application with authentication, a REST API, tests and a live deployment.\n\nCode reviews every week keep your standards high.",
      mode: "ONLINE",
      level: "Beginner to Intermediate",
      durationText: "16 weeks · 80 hrs",
      feeText: "₹40,000",
      trainer: "Full-stack engineers",
      highlights:
        "Modern JavaScript & TypeScript\nReact, hooks and state management\nNode.js + Express REST APIs\nMongoDB data modelling\nAuth, security and testing\nGit workflows and code review\nDeployment to the cloud",
      curriculum:
        "HTML, CSS and responsive layout\nJavaScript deep dive + TypeScript\nReact fundamentals and hooks\nRouting, forms and state\nNode.js and Express\nREST API design\nMongoDB and Mongoose\nAuthentication and authorization\nTesting and CI\nCapstone: full MERN app + deployment",
      audience: "Beginners serious about a developer career, and coders wanting structured full-stack skills.",
      prereq: "Logical aptitude and consistent weekly time. We start from HTML/CSS.",
      faq: faq([
        ["Is this enough to get a job?", "Combined with the capstone and portfolio, graduates target junior full-stack and front-end roles."],
        ["Do you cover TypeScript?", "Yes, TypeScript is introduced early and used throughout."],
      ]),
    },
    {
      cat: "Cybersecurity",
      title: "Certified Ethical Hacking Foundations",
      subtitle: "Offensive security, hands-on",
      tint: "be123c",
      summary:
        "Learn the attacker's toolkit responsibly: reconnaissance, scanning, exploitation basics, web app security and reporting.",
      overview:
        "A lab-heavy introduction to offensive security aligned to industry certification objectives. You practise in isolated vulnerable environments, understand common vulnerability classes, and learn to write clear findings.\n\nEthics, scope and legal boundaries are covered throughout.",
      mode: "CLASSROOM",
      level: "Beginner to Intermediate",
      durationText: "8 weeks · 48 hrs",
      feeText: "₹38,000",
      trainer: "Certified security consultants",
      highlights:
        "Networking & Linux for security\nRecon and enumeration\nVulnerability scanning\nWeb app vulnerabilities (OWASP Top 10)\nPassword attacks and hardening\nReporting and disclosure\nCareer paths in security",
      curriculum:
        "Security fundamentals and ethics\nNetworking and protocols refresher\nKali Linux and tooling\nFootprinting and reconnaissance\nScanning and enumeration\nExploitation basics in a lab\nWeb application security (OWASP)\nWireless and social engineering overview\nWriting a penetration test report\nCapstone lab assessment",
      audience: "IT support, network and QA professionals moving into security roles.",
      prereq: "Basic networking (TCP/IP) and Linux familiarity.",
      faq: faq([
        ["Is this legal to practise?", "All labs are isolated and provided by us. We cover scope, authorisation and the law in module one."],
        ["Is it classroom only?", "Yes, this track is in-centre for the supervised lab environment."],
      ]),
    },
    {
      cat: "Data & Analytics",
      title: "Machine Learning Essentials",
      subtitle: "Practical ML with scikit-learn",
      tint: "047857",
      summary:
        "Build, evaluate and ship classical machine-learning models with Python, scikit-learn and sound methodology.",
      overview:
        "A grounded ML course that avoids hype. You learn the workflow — framing, features, training, evaluation, iteration — and apply it to regression, classification and clustering problems with real datasets.",
      mode: "ONLINE",
      level: "Intermediate",
      durationText: "9 weeks · 45 hrs",
      feeText: "₹30,000",
      trainer: "ML engineers",
      highlights:
        "The end-to-end ML workflow\nFeature engineering\nRegression & classification models\nModel evaluation & cross-validation\nClustering and dimensionality reduction\nAvoiding leakage and overfitting\nPackaging a model for use",
      curriculum:
        "Python & numpy / pandas refresher\nProblem framing and metrics\nLinear and logistic regression\nTrees, forests and boosting\nModel selection and validation\nFeature engineering and pipelines\nUnsupervised learning\nIntro to model deployment\nCapstone modelling project",
      audience: "Analysts and developers who want practical ML skills without a research focus.",
      prereq: "Comfortable with Python and basic statistics.",
      faq: faq([
        ["Do you cover deep learning?", "Only briefly — this course focuses on classical ML that solves most business problems."],
      ]),
    },
    {
      cat: "Business Analysis",
      title: "Agile & Scrum for Delivery Teams",
      subtitle: "Short, practical, team-ready",
      tint: "9333ea",
      summary:
        "A focused course on running Agile delivery well: Scrum roles, events, artifacts, estimation and healthy metrics.",
      overview:
        "For teams and individuals who want Agile to actually work. We go beyond definitions into facilitation, backlog health, estimation techniques and the metrics that matter — with practice exercises each session.",
      mode: "ONLINE",
      level: "Beginner",
      durationText: "4 weeks · 16 hrs",
      feeText: "₹12,000",
      trainer: "Scrum practitioners",
      highlights:
        "Scrum roles, events and artifacts\nWriting and slicing user stories\nEstimation: story points & planning poker\nBacklog refinement that works\nAgile metrics (velocity, burndown, CFD)\nFacilitation and anti-patterns",
      curriculum:
        "Agile mindset and frameworks\nScrum in depth\nProduct backlog and refinement\nSprint planning and estimation\nDaily scrum, review and retrospective\nMetrics and continuous improvement",
      audience: "New Scrum Masters, BAs, POs and developers joining Agile teams.",
      prereq: "None.",
      faq: faq([
        ["Is this a certification course?", "It prepares you well for entry-level Agile certifications but the exam is booked separately."],
      ]),
    },
  ];

  for (const c of COURSES) {
    await db.course.create({
      data: {
        slug: slugify(c.title),
        title: c.title,
        subtitle: c.subtitle,
        summary: c.summary,
        overview: c.overview,
        categoryId: catRows[c.cat],
        mode: c.mode,
        level: c.level,
        durationText: c.durationText,
        feeText: c.feeText,
        trainerName: c.trainer,
        highlights: c.highlights,
        curriculum: c.curriculum,
        prerequisites: c.prereq,
        audience: c.audience,
        faqJson: c.faq,
        heroTint: c.tint,
        status: "PUBLISHED",
        metaDescription: c.summary.slice(0, 175),
        authorId: admin.id,
        publishedAt: new Date(Date.now() - between(1, 40) * 86400000),
      },
    });
  }

  console.log(
    `Done. ${categoryRows.length} categories, ${cityRows.length} cities, ${total} providers, ${histUsers.length + 4} users, ${histLeads} historical enquiries, ${COURSE_CATS.length} course tracks, ${COURSES.length} courses.`,
  );
  console.log("Dev login: use any 10-digit number; the OTP is printed here and shown on the login screen.");
  console.log("Admin +919000000001 · Editor +919777700001");
}

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
