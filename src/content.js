/* =========================================================================
   henry. — everything on the site, in one place.

   ITEMS are the cards. INTENTS are what the decision model can pick: each
   one names the cards it opens, the word the shader engraves, the phrases
   the model learns from, and the suggestions the ghost text offers.

   Add a project: add an item, add an intent for it (or add its id to a
   group intent), then run `npm run model` and commit model/model.json.
   ========================================================================= */

export const GH = "https://github.com/henrybrewer00-dotcom";
export const MAIL = "mailto:henrybrewer00@gmail.com?subject=" + encodeURIComponent("You're hired") + "&body=" + encodeURIComponent("Hi Henry,\n\nHere's what I'd love to build with you:\n\n");

// Who Henry is, in the third person, for search engines and AI answer engines: the about section under the
// page, the JSON-LD and llms.txt (all written by tools/seo.mjs). Only facts that are already on the cards.
export const SITE = "https://www.henrybrewer.dev";
export const BIO = "Henry Brewer is a 14-year-old software developer and entrepreneur from Austin, Texas. He is the founder and CEO of SiteLight, which checks whether AI assistants recommend a business. He cofounded Crawft, an AI-powered monitoring tool for schools and managers, and was its CTO until he sold his stake. He built Vurn AI, a fully autonomous AI pentesting tool, and he goes to Alpha High School. He also builds voice AI, robots and an ROV submarine, has won hackathons at InsForge, Frontier Tower and a16z × Cursor, and has merged pull requests in SymPy, Biome and Astro.";
// Plain question-and-answer facts about Henry, for the /about page and its FAQ schema (written by tools/seo.mjs).
// Only facts that are already on the cards. Never his campus or address.
export const QUICK = [["Age", "14"], ["Based in", "Austin, Texas"], ["Does", "Software developer, entrepreneur"], ["Company", "SiteLight (founder and CEO)"],
  ["Previously", "Crawft (cofounder and CTO, sold his stake)"], ["Known for", "Vurn AI, an autonomous AI pentesting tool"], ["School", "Alpha High School"]];
export const FAQ = [
  ["Who is Henry Brewer?", "Henry Brewer is a 14-year-old software developer and entrepreneur from Austin, Texas. He is the founder and CEO of SiteLight, he built the AI pentesting tool Vurn AI, and he cofounded Crawft, where he was CTO until he sold his stake."],
  ["How old is Henry Brewer?", "Henry Brewer is 14 years old."],
  ["Where is Henry Brewer from?", "Henry Brewer is from Austin, Texas."],
  ["What company did Henry Brewer found?", "Henry Brewer founded SiteLight (sitelight.xyz) and is its CEO. SiteLight checks whether AI assistants like ChatGPT, Gemini, Perplexity and Claude recommend a business when someone asks, then gives the business a to-do list to become the answer. He took it from nothing to its first revenue in 10 days."],
  ["What is Vurn AI?", "Vurn AI is a fully autonomous AI pentesting tool built by Henry Brewer. Within 24 hours of being built, it found a major vulnerability in a top-200 GitHub repository that gave access to over 40,000 Shopify accounts."],
  ["Was Henry Brewer the CTO of Crawft?", "Yes. Henry Brewer cofounded Crawft, an AI-powered monitoring tool for schools and managers, and was its CTO from mid-August 2026. He then sold his own stake in the company. Crawft itself was not sold."],
  ["Where does Henry Brewer go to school?", "Henry Brewer goes to Alpha High School, part of Alpha School, which uses the 2 Hour Learning model: academics in a short morning block, and afternoons for projects and life skills."],
  ["What has Henry Brewer built?", "Besides SiteLight, Vurn AI and Crawft, Henry Brewer built Lily, a voice AI that calls his grandma every morning and texts the family how she sounded; Glasscast, a free open-source screen recorder; PawBot, which helps older people use a computer; Lily's Drive-Thru, a voice ordering system; a self-driving car; and an ROV submarine he is still building."],
  ["Has Henry Brewer won any hackathons?", "Yes. Henry Brewer has won hackathons at InsForge, Frontier Tower and a16z × Cursor."],
  ["Does Henry Brewer contribute to open source?", "Yes. Henry Brewer has merged pull requests in SymPy, Biome and Astro."],
  ["How can I contact Henry Brewer?", "Email henrybrewer00@gmail.com, or find him on GitHub (henrybrewer00-dotcom) and X (@Henry_J_Brew)."],
];

// profiles that are Henry's (schema.org sameAs): add LinkedIn, X and others here
export const PROFILES = [GH, "https://x.com/Henry_J_Brew"];

/**
 * @typedef {{ label: string, href: string }} Link
 * @typedef {{
 *   id: string, kind: "about"|"job"|"project"|"hardware"|"oss"|"win"|"fact"|"contact",
 *   kicker: string, title: string, body?: string, list?: string[], tags?: string[],
 *   facts?: string[],   // extra facts for the typed answers only, never shown on the card
 *   current?: boolean, pinned?: boolean, image?: { src: string, alt: string, cap: string }, images?: { src: string, alt: string, cap: string }[], links?: Link[]
 * }} Item
 */

/** @type {Item[]} */
export const ITEMS = [
  { id: "me", kind: "about", kicker: "the maker", title: "I'm Henry.", body: "Fourteen, from Austin, and a proud vibecoder. I build voice AI, robots, a submarine, and a company. I go to Alpha High School. I founded SiteLight, and I cofounded Crawft, then sold my stake.", tags: ["14", "Austin, TX", "Alpha High School", "Proud vibecoder"], links: [{ label: "GitHub ↗", href: GH }, { label: "Email →", href: MAIL }] ,
    // answer-only facts about Henry's school, from alpha.school and alphahigh.school as of 2026-10-14
    facts: ["Henry goes to Alpha High School, part of Alpha School, which calls itself an AI-powered private school.",
      "Alpha's model is 2 Hour Learning: students do their academics in a short morning block with adaptive software that gives each of them 1:1 learning at their own pace, aiming for full mastery before moving on.",
      "At Alpha, the adults are called guides, not teachers: they don't grade or write lesson plans, they coach, motivate and support students.",
      "Afternoons at Alpha are for life-skills workshops and students' own projects; at Alpha High that includes sports, arts and entrepreneurship.",
      "Alpha says its students learn twice as fast and rank in the top 1% nationwide; Alpha High lists a December 2024 school-wide SAT average of 1410.",
      "Alpha has campuses across the US; Alpha High has campuses in Austin, Miami, New York City, Oklahoma City, San Francisco and Santa Barbara."] },
  { id: "crawft", tease: "Cofounded it, then sold my stake.", kind: "job", pinned: true, kicker: "cofounder · sold my stake", title: "Crawft", body: "I cofounded Crawft and was its CTO from mid-August 2026, then sold my stake. Crawft is an AI-powered monitoring tool for schools and managers: it turns activity data into answers backed by evidence, and sends smart nudges that steer people off bad websites.", tags: ["Cofounder", "Sold stake", "AI monitoring", "Schools"], links: [{ label: "crawft.ai ↗", href: "https://crawft.ai" }],
    // answer-only facts (not shown on the card), from Henry, crawft.ai and the Crawft codebase, as of 2026-10-13
    facts: ["Henry cofounded Crawft and was its CTO from mid-August 2026. He has since sold his own stake in the company, so he no longer works there. Crawft itself was not sold or acquired; it carries on without him.", "Crawft was running a beta trial while Henry was CTO.",
      "It has a workplace mode (people, groups, managers) and a school mode (students, classes, teachers), on organization-owned computers.",
      "It turns each person's activity into a written daily account of their day, with every line linked to evidence, so a manager or teacher can see what happened without chasing updates.",
      "Nudges: an AI model judges whether activity is off task and sends the person a short message to get back on track; on-task work is never nudged.",
      "It's built from a native Mac agent in Swift, a Windows agent in Rust (in progress), a TypeScript backend on Fastify and PostgreSQL, Next.js web consoles, and infrastructure on AWS.",
      "It never records audio, camera video or location, and screenshot images are not sent to AI providers.",
      "Crawft's site headline is \"See the work you're paying for.\" Pricing isn't public; teams contact sales."] },
  { id: "vurn", tease: "Found a hole in 40,000 Shopify accounts.", kind: "project", pinned: true, kicker: "cybersecurity", title: "Vurn AI", body: "A fully autonomous AI pentesting tool. 24 hours after I built it, it found a major vulnerability in a top-200 GitHub repo that gave access to over 40,000 Shopify accounts.", tags: ["Security", "Pentesting", "AI agents"],
    // answer-only facts, from the Vurn AI codebase as of 2026-10-13
    facts: ["Vurn AI scans the code of AI-written apps for security holes: leaked keys in the browser bundle, database tables with row-level security off, auth that only runs in the browser, IDOR and injection.",
      "It works in two passes: a fast deterministic pass for secrets and database rules, then a reasoning pass with Claude that reviews the code through focused security lenses using a map of the repo.",
      "Every finding from the reasoning pass is checked against the actual file, and dropped if the quoted code isn't there, so it doesn't report made-up bugs.",
      "Henry built a benchmark of 86 real, verified vulnerabilities plus 13 clean cases across 9 real repos in 6 languages; Vurn finds 70 of the 99.",
      "One of its real finds was a Shopify OAuth bug that sent an app's client secret to an attacker-chosen host.",
      "It's built with TypeScript, Next.js and React, with InsForge for the database and auth, about 14,000 lines of code and 99 unit and stress tests."] },
  { id: "sitelight", tease: "Nothing to revenue in 10 days.", kind: "job", pinned: true, kicker: "founder", title: "SiteLight", body: "A personal challenge: go from nothing to revenue in under two weeks. I made it in 10 days. It checks whether AI assistants recommend your business when someone asks, then hands you the to-do list to become the answer.", tags: ["Founder", "Marketing", "AI visibility", "10 days"], images: [
      { src: "assets/design/sitelight-landing.jpg", alt: "SiteLight's landing page: When AI recommends a business, is it you? with a live report card beside it.", cap: "the landing page" },
      { src: "assets/design/sitelight-scan.jpg", alt: "SiteLight's scan screen: balloons float while it asks ChatGPT, Gemini, Grok and Claude about a plumber.", cap: "the scan, while it asks each AI" },
      { src: "assets/design/sitelight-fixes.jpg", alt: "SiteLight's fixes page: a step-by-step plan to get named by AI.", cap: "the fix plan · demo data" },
      { src: "assets/sitelight-stripe.jpg", alt: "Stripe email: Congratulations, SiteLight! You've just received your first payment through Stripe. $2.00.", cap: "the first $2 · via stripe" }], links: [{ label: "Sorry, SiteLight was shut down" }] ,
    // answer-only facts, from Henry and the SiteLight codebase as of 2026-10-13
    facts: ["Henry is SiteLight's founder and CEO. The SiteLight website (sitelight.xyz) has been shut down, so there's no live link anymore.",
      "It's for local businesses like plumbers, coffee shops, golf courses, med spas and roofers.",
      "How it works: it writes the questions a buyer would ask, like \"best coffee shop in Austin\", asks four AI assistants (ChatGPT, Gemini, Perplexity and Claude), and checks whether the business is named, where it ranks, how it's described and which competitors come up instead.",
      "Then it gives a 0 to 100 score with a letter grade, a dashboard with a heatmap and share of voice, and ready-to-paste fixes: structured business data, an llms.txt file and FAQ blocks.",
      "Pricing is one-time scan packs through Stripe: $2 for one scan, $5 for three, $10 for eight.",
      "Henry sold it with cold emails that each included a real scan naming the competitors AI recommended instead; in one batch, 26 of 28 businesses he checked were invisible to AI.",
      "It's built with TypeScript, React, Vite and Tailwind, with InsForge for the database, auth and server functions, about 30,000 lines of code."] },
  { id: "lily", tease: "Calls my grandma every morning.", kind: "project", kicker: "voice AI", title: "Lily", body: "Calls my grandma every morning, has an actual conversation, then texts the family how she sounded.", tags: ["ElevenLabs", "Twilio", "InsForge"], image: { src: "assets/lily-demo-poster.jpg", alt: "Lily's demo screen", cap: "lily · demo" }, links: [{ label: "Live ↗", href: "https://lily.insforge.site" }, { label: "Repo ↗", href: GH + "/lily" }] },
  { id: "wins", tease: "InsForge, Frontier Tower, a16z × Cursor.", kind: "win", kicker: "hackathons", title: "Some hackathon wins", list: ["InsForge", "Frontier Tower", "a16z × Cursor"] },
  { id: "glasscast", tease: "A free Screen Studio, with AI built in.", kind: "oss", kicker: "open source", title: "Glasscast", body: "Screen Studio costs money, so I made a free one. Cinematic zooms, auto-captions, a webcam bubble, bring your own AI keys.", tags: ["Electron", "TypeScript", "macOS"], links: [{ label: "Repo ↗", href: GH + "/Glasscast" }] },
  { id: "site", tease: "This portfolio: a koi pond drawn in ASCII.", kind: "design", kicker: "design", title: "This site", body: "My portfolio, designed from scratch. Behind the page is a koi pond drawn in ASCII tiles: black and white koi, little fish that scatter from your cursor, and wakes that light up where they swim. Rest the cursor and the koi come to look, and tiles flip over as you pass across them. The koi follow your cursor, and a click calls them over to that spot. My name decodes into the pond tile by tile. Black and white only.", tags: ["Design", "ASCII", "Vanilla JS", "Canvas"],
    images: [
      { src: "assets/design/site-home.jpg", alt: "The portfolio home: hello. in ASCII tiles over a black koi pond, with the ask bar below.", cap: "the home page" },
      { src: "assets/design/site-intro.jpg", alt: "The intro: henry. decoding into the pond tile by tile.", cap: "the intro, mid-decode" },
      { src: "assets/design/site-phone.jpg", alt: "The portfolio on a phone.", cap: "on a phone" }],
    links: [{ label: "Repo ↗", href: GH + "/portfolio" }] },
  { id: "drivethru", kind: "project", kicker: "voice AI", title: "Lily's Drive-Thru", body: "Order out loud. The AI takes it, upsells you once, reads the total back with tax, and fires a live ticket to the kitchen screen.", tags: ["ElevenLabs", "Express", "SSE"], links: [{ label: "Repo ↗", href: GH + "/voice-drive-thru" }] },
  { id: "elevenmile", kind: "project", kicker: "AI + audio", title: "Eleven Mile", body: "Pick two people and a topic and watch them rap-battle. Claude writes the bars, ElevenLabs raps them. A little dumb and I love it.", tags: ["Claude", "ElevenLabs"], links: [{ label: "Repo ↗", href: GH + "/eleven-mile" }] },
  { id: "pawbot", tease: "Walks older people through the computer.", kind: "project", kicker: "accessibility", title: "PawBot", body: "Helps older people use a computer one step at a time, like helping your grandparent figure out their email.", tags: ["Hackathon", "Assistive"], links: [{ label: "Repo ↗", href: GH + "/PawBot" }] },
  { id: "siege", tease: "A self-driving car that chases my dogs.", kind: "hardware", kicker: "robotics", title: "S.I.E.G.E.", body: "A self-driving car that chases my dogs around while I'm busy. Sensors, steering logic, a lot of calibration, and wiring that looks worse than it works.", tags: ["Arduino", "C++", "Sensors"] },
  { id: "sub", tease: "A sub that has to survive real water.", kind: "hardware", current: true, kicker: "hardware · building now", title: "ROV Submarine", body: "A remote-controlled sub that has to survive real water. Most of the work is the unglamorous part: watertight, buoyant, and a battery that behaves.", tags: ["CAD", "Marine", "Physics"] },
  { id: "oss", tease: "Merged PRs in SymPy, Biome and Astro.", kind: "oss", kicker: "merged pull requests", title: "Open source", body: "Real, merged pull requests to tools I use: SymPy, Biome, Astro. Small fixes, shipped, and people actually run them.", tags: ["SymPy", "Biome", "Astro"], facts: ["Some of his merged open-source PRs (examples, not the full count): SymPy #29951 (type hints for series acceleration, merged Jul 2026), Biome #10759 (lint rule ignores Svelte special elements, Jun 2026), Biome #10758 (formatter keeps parens around await/yield, Jun 2026), Astro #16703 (case-mismatched project paths, Jun 2026). He also opens many PRs in his own repos and in private work repos; the live count and full list are in the pull requests section of this page."], links: [{ label: "All my PRs ↓", href: "#prs" }, { label: "On GitHub ↗", href: "https://github.com/pulls?q=is%3Apr+author%3Ahenrybrewer00-dotcom" }] },
  { id: "stack", kind: "fact", kicker: "made with", title: "The stack", list: ["React", "TypeScript", "Python", "Electron", "Arduino", "Twilio", "ElevenLabs", "Claude", "Vercel", "GitHub"] },
  { id: "receipts", tease: "Straight A's, 125 words a minute.", kind: "fact", kicker: "also", title: "Receipts", body: "Straight A's, 99.5 in math, 125 words a minute. Hackathon wins at InsForge, Frontier Tower and a16z × Cursor. Merged PRs in SymPy, Biome and Astro." },
  { id: "hire", kind: "contact", kicker: "say hi", title: "Got an idea?", body: "Let's build it this weekend.", links: [{ label: "Email me →", href: MAIL }, { label: "GitHub ↗", href: GH }, { label: "Older site: card deck", href: "deck/" }, { label: "Older site: terminal", href: "old/" }] },
];

/**
 * @typedef {{
 *   id: string, title: string, engrave: string, ids: string[],
 *   suggest: string[], subjects: string[], questions: string[]
 * }} Intent
 * suggest   — full sentences the ghost text completes to (first one is the canonical).
 * subjects  — noun phrases; the trainer wraps them in "show me …", "henry's …", etc.
 * questions — whole sentences people might type, used as-is.
 */

/** @type {Intent[]} */
export const INTENTS = [
  { id: "crawft", title: "Crawft", engrave: "Crawft", ids: ["crawft"],
    suggest: ["show me Crawft", "the company Henry sold his stake in", "Crawft"],
    subjects: ["crawft", "monitoring tool", "school monitoring", "nudges", "craft", "his old job", "last job", "previous job", "past job", "former role", "cto", "cto job", "the stake he sold", "his stake", "selling his stake", "employee monitoring"],
    questions: ["what is crawft", "did henry sell a company", "what did henry sell", "what was his last job", "was henry a cto", "where did henry use to work", "why did he sell his stake", "is he still at crawft", "does he still work at crawft", "what happened with crawft"] },
  { id: "vurn", title: "Vurn AI", engrave: "Vurn AI", ids: ["vurn"],
    suggest: ["show me Henry's cyber work", "Henry's cybersecurity work", "Vurn AI"],
    subjects: ["cyber work", "cyber", "cybersecurity", "cyber security", "security", "security work", "hacking", "pentesting", "pen testing", "penetration testing", "vulnerability", "vulnerabilities", "bug bounty", "exploit", "vurn", "vurn ai", "infosec", "white hat", "security research", "shopify bug", "ai pentester", "red team"],
    questions: ["does henry do cyber", "is henry a hacker", "has he found any bugs", "what did he hack", "does he know security", "what security stuff has he built", "did he find a vulnerability", "what is vurn", "what's the shopify thing", "has henry done any pentesting"] },
  { id: "sitelight", title: "SiteLight", engrave: "SiteLight", ids: ["sitelight"],
    suggest: ["show me Henry's company", "what's Henry's company", "show me Henry's current job", "SiteLight"],
    subjects: ["marketing", "marketing work", "growth", "go to market", "getting customers", "sales", "seo", "ai seo", "selling", "his marketing", "company", "startup", "business", "sitelight", "site light", "his company", "the company he founded", "ai visibility tool", "first revenue", "first $2", "stripe payment", "founder", "current job", "job", "work", "where he works", "what he does for work", "career", "role", "occupation", "day job", "current role", "ceo"],
    questions: ["can henry do marketing", "is he good at marketing", "how does he market things", "has he sold anything", "how did he get customers", "what is his company", "what company did henry found", "what is henry founder of", "how did he make money", "what's his startup", "is henry a founder", "what does sitelight do", "how did he get revenue in 10 days", "where does henry work", "does henry have a job", "what does henry do for work", "what's his job right now", "what's he doing now", "is he working anywhere"] },
  { id: "about", title: "About Henry", engrave: "Henry", ids: ["me"],
    suggest: ["who is Henry", "tell me about Henry", "about Henry", "how long has Henry been building"],
    subjects: ["school", "his school", "where he goes to school", "alpha school", "alpha high", "alpha high school", "2 hour learning", "two hour learning", "about", "bio", "intro", "henry", "himself", "who he is", "age", "where he lives", "background", "experience", "his experience", "how long he's been coding", "when he started"],
    questions: ["where does henry go to school", "what school does he go to", "does henry go to school", "what is alpha school", "is he homeschooled", "what grade is he in", "how long has henry been building", "how long has he been building stuff", "how long has henry been coding", "when did henry start coding", "when did he start building", "how much experience does he have", "how long has he been programming", "how many years has he coded", "is he experienced", "who is henry", "who are you", "how old is henry", "where is henry from", "where does he live", "tell me about yourself", "introduce yourself", "what is a vibecoder", "is he really 14", "who made this site", "who is this"] },
  { id: "lily", title: "Lily", engrave: "Lily", ids: ["lily"],
    suggest: ["show me Lily", "the AI that calls his grandma", "Lily, the voice AI"],
    subjects: ["lily", "grandma calling ai", "ai that calls grandma", "the grandma bot", "phone call ai", "morning call bot", "alzheimer's project", "voice companion", "lily app", "lily ai"],
    questions: ["what calls his grandma", "the ai that calls his grandma every morning", "what did he build for his grandma", "does he have a phone ai", "the one that texts the family", "what is lily"] },
  { id: "drivethru", title: "Lily's Drive-Thru", engrave: "Drive-Thru", ids: ["drivethru"],
    suggest: ["show me the drive-thru AI", "Lily's Drive-Thru"],
    subjects: ["drive-thru", "drive thru", "drive through", "voice ordering", "order taking ai", "fast food ai", "kitchen ticket", "restaurant voice bot"],
    questions: ["can i order food by voice", "the ai that takes orders", "what's the drive thru project", "did he make a restaurant ai", "the one that upsells you"] },
  { id: "elevenmile", title: "Eleven Mile", engrave: "Eleven Mile", ids: ["elevenmile"],
    suggest: ["show me the rap battle app", "Eleven Mile"],
    subjects: ["eleven mile", "11 mile", "rap battle", "rap battles", "ai rap", "rapping ai", "diss track generator", "8 mile parody"],
    questions: ["can ai rap battle", "the rap battle thing", "where two people rap battle", "did he make a rap app", "what's eleven mile"] },
  { id: "design", title: "Design work", engrave: "Design", ids: ["site", "sitelight", "glasscast"],
    suggest: ["show me Henry's design work", "Henry's designs", "show me what Henry designed"],
    subjects: ["design work", "design", "designs", "designer", "ui", "ux", "ui design", "ux design", "visual design", "web design", "product design", "interfaces", "his design", "screenshots", "photos of his work", "pictures of his work", "what it looks like", "this site", "this portfolio", "the portfolio", "his portfolio", "the website", "dither", "dithering", "branding", "figma"],
    questions: ["can henry design", "is he a designer", "does henry do design", "who designed this site", "did he design this", "how was this site made", "what does his work look like", "can i see screenshots", "does he have an eye for design", "show me pictures"] },
  { id: "glasscast", title: "Glasscast", engrave: "Glasscast", ids: ["glasscast"],
    suggest: ["show me Glasscast", "the free Screen Studio"],
    subjects: ["glasscast", "glass cast", "screen recorder", "screen recording app", "free screen studio", "screen studio alternative", "mac app", "electron app", "auto captions"],
    questions: ["did he make a screen recorder", "free alternative to screen studio", "what desktop apps has he made", "what's glasscast"] },
  { id: "pawbot", title: "PawBot", engrave: "PawBot", ids: ["pawbot"],
    suggest: ["show me PawBot", "the app that helps grandparents"],
    subjects: ["pawbot", "paw bot", "accessibility project", "computer help for seniors", "helping grandparents", "elderly helper", "assistive tech"],
    questions: ["did he build something for old people", "helps older people use a computer", "the grandparent email helper", "what's pawbot"] },
  { id: "siege", title: "S.I.E.G.E.", engrave: "S.I.E.G.E.", ids: ["siege"],
    suggest: ["show me the robot car", "S.I.E.G.E."],
    subjects: ["siege", "s.i.e.g.e.", "robot", "robot car", "self driving car", "rc car", "dog chasing car", "arduino car", "robotics"],
    questions: ["does he build robots", "the car that chases his dogs", "what robots has he made", "did he make a self driving car"] },
  { id: "sub", title: "ROV Submarine", engrave: "Submarine", ids: ["sub"],
    suggest: ["show me the submarine", "the ROV submarine"],
    subjects: ["submarine", "sub", "rov", "underwater robot", "underwater drone", "boat", "marine project", "what he's building now in hardware"],
    questions: ["is he really building a submarine", "the sub", "what's the underwater thing", "does it float", "what hardware is he building now"] },
  { id: "oss", title: "Pull requests", engrave: "PRs", ids: ["oss"],
    suggest: ["show me Henry's pull requests", "show me Henry's merged pull requests", "merged PRs"],
    subjects: ["prs", "pr's", "his prs", "henrys prs", "pull requests", "merged prs", "merged pull requests", "contributions", "sympy", "biome", "astro", "github contributions", "commits", "github activity"],
    questions: ["has he contributed to open source", "did he get prs merged", "what repos has he contributed to", "does he contribute to sympy"] },
  { id: "wins", title: "Hackathon wins", engrave: "Hackathons", ids: ["wins"],
    suggest: ["show me Henry's hackathon wins", "hackathon wins"],
    subjects: ["hackathons", "hackathon wins", "awards", "prizes", "competitions", "trophies", "insforge", "frontier tower", "a16z cursor"],
    questions: ["has he won anything", "did he win any hackathons", "what has he won", "what awards does he have"] },
  { id: "stack", title: "The stack", engrave: "The stack", ids: ["stack"],
    suggest: ["what does Henry build with", "Henry's tech stack"],
    subjects: ["stack", "tech stack", "tools", "languages", "skills", "frameworks", "programming languages", "what he codes in", "typescript", "javascript", "react", "python", "coding languages"],
    questions: ["what languages does he know", "what does he code in", "does he know python", "does he use react", "what tools does he use", "what are his skills"] },
  { id: "receipts", title: "Receipts", engrave: "Receipts", ids: ["receipts"],
    suggest: ["show me Henry's receipts", "Henry's grades"],
    subjects: ["receipts", "grades", "school", "gpa", "math score", "typing speed", "wpm", "achievements", "stats", "academics", "how smart he is", "test scores"],
    questions: ["how are his grades", "how fast does he type", "is he good at math", "what are his stats", "how does he do in school"] },
  { id: "contact", title: "Contact", engrave: "Say hi", ids: ["hire"],
    suggest: ["how do I contact Henry", "hire Henry", "email Henry"],
    subjects: ["contact", "email", "hire", "hiring", "contact info", "reach out", "work together", "collab", "socials", "github profile"],
    questions: ["how do i reach him", "can i hire henry", "how do i contact you", "is he available", "can we build something", "what's his email", "where's his github", "i want to work with henry"] },
  { id: "voice", title: "Voice AI", engrave: "Voice AI", ids: ["lily", "drivethru", "elevenmile"],
    suggest: ["show me Henry's voice AI projects", "voice AI stuff"],
    subjects: ["voice ai", "voice projects", "voice ai stuff", "elevenlabs projects", "talking ai", "speech projects", "audio ai", "voice agents", "twilio projects"],
    questions: ["what voice ai has he built", "does he do voice stuff", "anything with elevenlabs", "has he built voice agents"] },
  { id: "hardware", title: "Hardware", engrave: "Hardware", ids: ["siege", "sub"],
    suggest: ["show me Henry's hardware projects", "hardware stuff"],
    subjects: ["hardware", "hardware projects", "physical projects", "things he built by hand", "electronics", "arduino projects", "robots and subs", "cad"],
    questions: ["does he build physical things", "what hardware has he made", "does he do electronics", "anything with arduino"] },
  { id: "opensource", title: "Open source", engrave: "Open source", ids: ["glasscast", "oss"],
    suggest: ["show me Henry's open source work", "open source stuff"],
    subjects: ["open source", "open source work", "open source projects", "public repos", "free tools he made", "oss"],
    questions: ["is his code open source", "what has he open sourced", "any public repos"] },
  { id: "ai", title: "AI projects", engrave: "AI", ids: ["vurn", "sitelight", "lily", "drivethru", "elevenmile", "pawbot"],
    suggest: ["show me Henry's AI projects", "AI stuff"],
    subjects: ["ai projects", "ai stuff", "ai apps", "machine learning", "llm projects", "claude projects", "things with ai", "artificial intelligence"],
    questions: ["what ai has he built", "does he use ai", "has he made ai apps", "anything with claude"] },
  { id: "browse", title: "Everything", engrave: "Everything", ids: ITEMS.map((i) => i.id),
    suggest: ["show me everything Henry has built", "everything", "all projects"],
    subjects: ["everything", "all projects", "projects", "portfolio", "all of it", "his work", "what he has built", "what he has made", "the whole list", "best work", "highlights"],
    questions: ["what has henry built", "what has he made", "show me his projects", "what can he do", "what are his projects", "list everything", "show all", "what have you made", "what does he make"] },
];

export const HINTS = ["show me Henry's current job", "show me Henry's cyber work", "what's Henry's company", "show me Henry's voice AI projects", "is he really building a submarine", "show me everything Henry has built", "how do I contact Henry"];

export const itemById = Object.fromEntries(ITEMS.map((i) => [i.id, i]));
export const intentById = Object.fromEntries(INTENTS.map((i) => [i.id, i]));

/** The pinned row on the home screen. */
export const PINNED = ["vurn", "crawft", "sitelight"].map((id) => itemById[id]);

/**
 * "Who are you?" — the intro asks, then the pinned row becomes three picks for that kind of visitor.
 * match: words that put a typed answer ("I run a startup") into this group.
 */
export const PERSONAS = [
  { id: "hiring", label: "I'm hiring", noun: "someone hiring", picks: ["crawft", "vurn", "receipts"],
    match: ["hire", "hiring", "recruit", "recruiter", "talent", "hr", "manager", "team lead", "cto", "ceo", "job"] },
  { id: "founder", label: "I'm building a startup", noun: "a founder", picks: ["sitelight", "crawft", "vurn"],
    match: ["founder", "startup", "company", "business", "investor", "vc", "invest", "entrepreneur", "own", "run a", "cofounder"] },
  { id: "security", label: "I work in security", noun: "a security person", picks: ["vurn", "crawft", "oss"],
    match: ["security", "cyber", "pentest", "hacker", "hacking", "infosec", "red team", "bug bounty", "appsec", "ctf", "pentester", "pen tester", "pen testing", "red teamer", "soc analyst", "blue team", "threat", "malware", "vulnerability"] },
  { id: "engineer", label: "I write code", noun: "an engineer", picks: ["vurn", "glasscast", "oss"],
    match: ["engineer", "engineering", "developer", "dev", "code", "coder", "coding", "programmer", "programming", "software", "swe", "sde", "backend", "frontend", "full stack", "fullstack", "build",
      "ml", "ai", "data scientist", "data", "researcher", "research", "scientist", "tech", "devops", "sre", "infra", "web dev", "app dev", "intern", "internship", "computer science", "cs", "hacker news", "mobile dev", "ios", "android"],
    // working at a tech company says more than any job title they might leave out
    companies: ["google", "alphabet", "deepmind", "meta", "facebook", "instagram", "apple", "microsoft", "amazon", "aws", "netflix", "nvidia", "openai", "anthropic", "xai", "tesla", "spacex",
      "stripe", "shopify", "uber", "airbnb", "salesforce", "oracle", "ibm", "intel", "amd", "adobe", "linkedin", "github", "vercel", "cloudflare", "databricks", "palantir", "snowflake",
      "tiktok", "bytedance", "twitter", "snap", "spotify", "dropbox", "figma", "notion", "slack", "atlassian", "coinbase", "robinhood", "doordash", "lyft", "pinterest", "reddit", "discord"] },
  { id: "designer", label: "I design things", noun: "a designer", picks: ["site", "sitelight", "glasscast"],
    match: ["design", "designer", "ux", "ui", "product", "pm", "product manager", "art", "creative", "brand", "figma", "artist", "illustrator", "animator", "graphic", "visual", "typography", "art director", "creative director", "motion design", "interaction design", "web designer"] },
  { id: "educator", label: "I teach", noun: "an educator", picks: ["crawft", "receipts", "pawbot"],
    match: ["teacher", "teach", "teaching", "guide", "educator", "education", "tutor", "tutoring", "principal", "professor", "prof", "instructor", "lecturer", "coach", "mentor",
      "faculty", "dean", "counselor", "counsellor", "librarian", "administrator", "admin", "head of school", "superintendent", "admissions", "teaching assistant", "ta", "homeschool", "school nurse", "school staff", "work at a school", "work at school", "works at a school"] },
  { id: "student", label: "I'm a student", noun: "a student", picks: ["wins", "siege", "sub"],
    match: ["student", "learning", "kid", "teen", "parent", "freshman", "sophomore", "high schooler", "pupil", "studying", "study", "major", "undergrad", "grad student", "phd", "junior", "senior in high school", "sixth grade", "eighth grade", "ninth grade", "grade"],
    // where someone is, not what they do: worth a point, so "guide at Alpha School" reads as a guide
    context: ["school", "college", "university", "high school", "middle school", "class", "homework"] },
  { id: "curious", label: "just looking around", noun: "a curious visitor", picks: ["vurn", "lily", "siege"], match: [] },
];
// Someone hiring (or looking for) a kind of person sees the work that kind of person would: "I'm looking to hire a
// designer" is someone hiring a designer, not a designer. The hiring persona's own picks are for when no kind is named.
const HIRING_FOR = {
  engineer: { noun: "someone hiring an engineer", picks: ["crawft", "vurn", "oss"] },
  designer: { noun: "someone hiring a designer", picks: ["site", "sitelight", "glasscast"] },
  security: { noun: "someone hiring for security", picks: ["vurn", "crawft", "oss"] },
};
export const HIRING_PERSONAS = Object.entries(HIRING_FOR).map(([kind, p]) => ({ id: `hiring-${kind}`, label: "I'm hiring", ...p, match: [] }));
export const personaById = Object.fromEntries([...PERSONAS, ...HIRING_PERSONAS].map((p) => [p.id, p]));

// saying you want a kind of person: these always mean hiring, whatever follows
const HIRE_WORDS = ["hire", "hiring", "hires", "hired", "recruit", "recruiting", "recruiter", "recruitment", "headhunter", "headhunting", "talent", "staffing",
  "sourcing", "sourcer", "hr", "hiring manager", "job opening", "open role", "open position", "headcount", "vacancy"];
// these mean hiring only when a person comes next ("I need a designer", not "I need a website")
const SEEK = /\b(looking for|looking to (?:find|get|bring on|add|work with)|searching for|seeking|scouting|scouting for|need|needs|needing|want|wants|find|finding|on the hunt for|in the market for)\b/;
const PEOPLE = /\b(engineers?|developers?|devs?|programmers?|coders?|designers?|hackers?|pentesters?|interns?|freelancers?|contractors?|someone|somebody|people|candidates?|talent|hires?|teammates?|team members?|employees?|staff)\b/;
// looking for work, not workers
const JOB_HUNT = /\b(looking for|searching for|seeking|need|want|finding|find|hunting for|applying for|apply for)\s+(?:a |an |some |new |my first |)(job|jobs|work|internship|internships|position|role|gig|gigs|opportunit\w*|employment)\b|\bjob (hunting|searching|seeker)\b|\bopen to work\b/g;
const CONTRACT = { "i m": "i am", "im": "i am", "we re": "we are", "were": "we are", "i ve": "i have", "ive": "i have", "i d": "i would", "id": "i would", "don t": "do not", "dont": "do not", "isn t": "is not", "wanna": "want to", "gonna": "going to", "lookin": "looking", "tryna": "trying to" };

// everything we know how to spell, so a typo one letter off ("lokoing", "desginer") still counts
const VOCAB = [...new Set([...PERSONAS.flatMap((p) => [...p.match, ...(p.context || []), ...(p.companies || [])]), ...HIRE_WORDS,
  "looking", "searching", "seeking", "scouting", "finding", "developers", "engineers", "designers", "someone", "candidates", "freelancer", "contractor"]
  .filter((w) => !w.includes(" ") && w.length >= 5))];
function oneOff(a, b) {   // Damerau-Levenshtein distance is at most 1
  if (a === b) return true;
  if (Math.abs(a.length - b.length) > 1) return false;
  let i = 0; while (i < a.length && a[i] === b[i]) i++;
  if (a.length === b.length) return a.slice(i + 1) === b.slice(i + 1) || (a[i] === b[i + 1] && a[i + 1] === b[i] && a.slice(i + 2) === b.slice(i + 2));
  return a.length > b.length ? a.slice(i + 1) === b.slice(i) : a.slice(i) === b.slice(i + 1);
}
const known = new Set(VOCAB);
const fix = (w) => w.length < 5 || known.has(w) || known.has(w.replace(/s$/, "")) ? w : VOCAB.find((v) => v[0] === w[0] && oneOff(w, v)) || w;

function clean(text) {
  let t = ` ${String(text).toLowerCase().replace(/[’']/g, " ").replace(/[^a-z ]/g, " ").replace(/\s+/g, " ").trim()} `;
  t = ` ${t.trim().split(" ").map(fix).join(" ")} `;
  for (const [a, b] of Object.entries(CONTRACT)) t = t.replaceAll(` ${a} `, ` ${b} `);
  // what they aren't doesn't count: "not a designer", "no longer teaching"
  t = t.replace(/ (not|no longer|never|nor) (really |exactly |actually |even |)(a |an |)[a-z]+/g, " ");
  return t.replace(/\s+/g, " ");
}
function score(t, list) {   // longer matches say more, so a phrase outweighs a stray short word
  const has = (w) => t.includes(` ${w} `) || t.includes(` ${w}s `);
  return list.filter(has);
}
function bestOf(t, ids) {
  let best = null, top = 0;
  for (const id of ids) {
    const p = personaById[id];
    const s = score(t, p.match).reduce((n, w) => n + w.length, 0) + score(t, p.context || []).length;
    if (s > top) { best = id; top = s; }
  }
  return best;
}
// a role word that belongs to hiring itself ("hire", "talent", "job") shouldn't also name the kind of person they want
const strip = (t, words) => words.reduce((s, w) => s.replaceAll(` ${w} `, " ").replaceAll(` ${w}s `, " "), t);

/** Typed answer → persona id (curious when nothing matches). "I work for Google" counts as an engineer;
 *  "I'm looking to hire a designer" counts as someone hiring a designer. */
export function personaFor(text) {
  let t = clean(text);
  const jobHunting = JOB_HUNT.test(t); JOB_HUNT.lastIndex = 0;
  if (jobHunting) t = t.replace(JOB_HUNT, " ");   // "looking for a job as a designer" is a designer
  // wanting a kind of person, said straight out ("hiring", "recruiter") or with a person after it ("I need a designer")
  const hireHit = score(t, HIRE_WORDS).length > 0;
  const seek = t.match(SEEK);
  const after = seek ? t.slice(seek.index) : "";
  const seekHit = seek && PEOPLE.test(after) && !/^\S+(?: \S+)? (to be|to become|to learn|to study|to get into|to try)\b/.test(after);
  if (hireHit || seekHit) {
    if (/ (co founder|cofounder|cto|technical partner|business partner) /.test(t)) return "founder";
    // the kind they want comes after the asking word ("an engineer hiring designers"), else anywhere ("tech recruiter")
    const kinds = ["security", "designer", "engineer"], hiringWords = [...HIRE_WORDS, ...personaById.hiring.match];
    const at = hireHit ? Math.min(...score(t, HIRE_WORDS).map((w) => t.indexOf(` ${w}`))) : seek.index;
    const kind = bestOf(strip(` ${t.slice(at)}`, hiringWords), kinds) || (hireHit ? bestOf(strip(t, hiringWords), kinds) : null);
    if (kind) return `hiring-${kind}`;
    if (hireHit || /\b(interns?|candidates?|talent|hires?|employees?|staff)\b/.test(after)) return "hiring";
  }
  const best = bestOf(t, PERSONAS.map((p) => p.id)) || "curious";
  // no role named, but a tech employer is: they're almost certainly in engineering
  if (best === "curious") for (const p of PERSONAS) if (score(t, p.companies || []).length) return p.id;
  return best;
}

// merged pull requests, newest first; checked against each project's main branch history
export const PRS = [
  { repo: "SymPy", n: 29951, merged: "2026-07-03", url: "https://github.com/sympy/sympy/pull/29951", title: "typing: add type annotations to series/acceleration.py", what: "Type hints for SymPy's series acceleration module" },
  { repo: "Biome", n: 10759, merged: "2026-06-30", url: "https://github.com/biomejs/biome/pull/10759", title: "fix(linter): ignore svelte special elements in noStaticElementInteractions", what: "Stopped a lint rule from flagging Svelte's special elements" },
  { repo: "Biome", n: 10758, merged: "2026-06-25", url: "https://github.com/biomejs/biome/pull/10758", title: "fix(formatter): keep parens around await/yield in instantiation expressions", what: "Kept the formatter from dropping parentheses that change what code means" },
  { repo: "Astro", n: 16703, merged: "2026-06-03", url: "https://github.com/withastro/astro/pull/16703", title: "fix(astro): match case-mismatched project paths in normalizeFilename", what: "Fixed Astro builds when a project path's letter case doesn't match" },
];
