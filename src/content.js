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

/**
 * @typedef {{ label: string, href: string }} Link
 * @typedef {{
 *   id: string, kind: "about"|"job"|"project"|"hardware"|"oss"|"win"|"fact"|"contact",
 *   kicker: string, title: string, body?: string, list?: string[], tags?: string[],
 *   current?: boolean, pinned?: boolean, image?: { src: string, alt: string, cap: string }, links?: Link[]
 * }} Item
 */

/** @type {Item[]} */
export const ITEMS = [
  { id: "me", kind: "about", kicker: "the maker", title: "I'm Henry.", body: "Fourteen, from Austin, and a proud vibecoder. I build voice AI, robots, a submarine, and a company. Right now I work at Crawft, and I founded SiteLight.", tags: ["14", "Austin, TX", "Proud vibecoder"], links: [{ label: "GitHub ↗", href: GH }, { label: "Email →", href: MAIL }] },
  { id: "crawft", kind: "job", current: true, pinned: true, kicker: "current job", title: "Crawft", body: "Where I work right now. Crawft is an AI-powered monitoring tool for schools and managers: it turns activity data into answers backed by evidence, and sends smart nudges that steer people off bad websites.", tags: ["Current", "AI monitoring", "Schools"], links: [{ label: "crawft.ai ↗", href: "https://crawft.ai" }] },
  { id: "vurn", kind: "project", pinned: true, kicker: "cybersecurity", title: "Vurn AI", body: "A fully autonomous AI pentesting tool. 24 hours after I built it, it found a major vulnerability in a top-200 GitHub repo that gave access to over 40,000 Shopify accounts.", tags: ["Security", "Pentesting", "AI agents"] },
  { id: "sitelight", kind: "job", pinned: true, kicker: "founder", title: "SiteLight", body: "A personal challenge: go from nothing to revenue in under two weeks. I made it in 10 days. It checks whether AI assistants recommend your business when someone asks, then hands you the to-do list to become the answer.", tags: ["Founder", "AI visibility", "10 days"], image: { src: "assets/sitelight-stripe.jpg", alt: "Stripe email: Congratulations, SiteLight! You've just received your first payment through Stripe. $2.00.", cap: "the first $2 · via stripe" }, links: [{ label: "sitelight.xyz ↗", href: "https://sitelight.xyz" }] },
  { id: "lily", kind: "project", kicker: "voice AI", title: "Lily", body: "Calls my grandma every morning, has an actual conversation, then texts the family how she sounded.", tags: ["ElevenLabs", "Twilio", "InsForge"], image: { src: "assets/lily-demo-poster.jpg", alt: "Lily's demo screen", cap: "lily · demo" }, links: [{ label: "Live ↗", href: "https://lily.insforge.site" }, { label: "Repo ↗", href: GH + "/lily" }] },
  { id: "wins", kind: "win", kicker: "hackathons", title: "Some hackathon wins", list: ["InsForge", "Frontier Tower", "a16z × Cursor"] },
  { id: "glasscast", kind: "oss", kicker: "open source", title: "Glasscast", body: "Screen Studio costs money, so I made a free one. Cinematic zooms, auto-captions, a webcam bubble, bring your own AI keys.", tags: ["Electron", "TypeScript", "macOS"], links: [{ label: "Repo ↗", href: GH + "/Glasscast" }] },
  { id: "drivethru", kind: "project", kicker: "voice AI", title: "Lily's Drive-Thru", body: "Order out loud. The AI takes it, upsells you once, reads the total back with tax, and fires a live ticket to the kitchen screen.", tags: ["ElevenLabs", "Express", "SSE"], links: [{ label: "Repo ↗", href: GH + "/voice-drive-thru" }] },
  { id: "elevenmile", kind: "project", kicker: "AI + audio", title: "Eleven Mile", body: "Pick two people and a topic and watch them rap-battle. Claude writes the bars, ElevenLabs raps them. A little dumb and I love it.", tags: ["Claude", "ElevenLabs"], links: [{ label: "Repo ↗", href: GH + "/eleven-mile" }] },
  { id: "pawbot", kind: "project", kicker: "accessibility", title: "PawBot", body: "Helps older people use a computer one step at a time, like helping your grandparent figure out their email.", tags: ["Hackathon", "Assistive"], links: [{ label: "Repo ↗", href: GH + "/PawBot" }] },
  { id: "siege", kind: "hardware", kicker: "robotics", title: "S.I.E.G.E.", body: "A self-driving car that chases my dogs around while I'm busy. Sensors, steering logic, a lot of calibration, and wiring that looks worse than it works.", tags: ["Arduino", "C++", "Sensors"] },
  { id: "sub", kind: "hardware", current: true, kicker: "hardware · building now", title: "ROV Submarine", body: "A remote-controlled sub that has to survive real water. Most of the work is the unglamorous part: watertight, buoyant, and a battery that behaves.", tags: ["CAD", "Marine", "Physics"] },
  { id: "oss", kind: "oss", kicker: "merged pull requests", title: "Open source", body: "Real, merged pull requests to tools I use: SymPy, Biome, Astro. Small fixes, shipped, and people actually run them.", tags: ["SymPy", "Biome", "Astro"], links: [{ label: "See the PRs ↗", href: "https://github.com/search?q=is%3Apr+author%3Ahenrybrewer00-dotcom+is%3Amerged&type=pullrequests" }] },
  { id: "stack", kind: "fact", kicker: "made with", title: "The stack", list: ["React", "TypeScript", "Python", "Electron", "Arduino", "Twilio", "ElevenLabs", "Claude", "Vercel", "GitHub"] },
  { id: "receipts", kind: "fact", kicker: "also", title: "Receipts", body: "Straight A's, 99.5 in math, 125 words a minute. Hackathon wins at InsForge, Frontier Tower and a16z × Cursor. Merged PRs in SymPy, Biome and Astro." },
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
    suggest: ["show me Henry's current job", "Henry's current job", "where does Henry work", "Crawft"],
    subjects: ["current job", "job", "work", "crawft", "monitoring tool", "school monitoring", "nudges", "craft", "where he works", "what he does for work", "employer", "career", "role", "position", "occupation", "day job", "current role", "workplace"],
    questions: ["where does henry work", "does henry have a job", "what does henry do for work", "is he working anywhere", "who does henry work for", "what's his job right now", "his day job", "what's he doing now", "where is he employed", "what is crawft"] },
  { id: "vurn", title: "Vurn AI", engrave: "Vurn AI", ids: ["vurn"],
    suggest: ["show me Henry's cyber work", "Henry's cybersecurity work", "Vurn AI"],
    subjects: ["cyber work", "cyber", "cybersecurity", "cyber security", "security", "security work", "hacking", "pentesting", "pen testing", "penetration testing", "vulnerability", "vulnerabilities", "bug bounty", "exploit", "vurn", "vurn ai", "infosec", "white hat", "security research", "shopify bug", "ai pentester", "red team"],
    questions: ["does henry do cyber", "is henry a hacker", "has he found any bugs", "what did he hack", "does he know security", "what security stuff has he built", "did he find a vulnerability", "what is vurn", "what's the shopify thing", "has henry done any pentesting"] },
  { id: "sitelight", title: "SiteLight", engrave: "SiteLight", ids: ["sitelight"],
    suggest: ["show me Henry's company", "what's Henry's company", "SiteLight"],
    subjects: ["company", "startup", "business", "sitelight", "site light", "his company", "the company he founded", "ai visibility tool", "first revenue", "first $2", "stripe payment", "founder"],
    questions: ["what is his company", "what company did henry found", "what is henry founder of", "how did he make money", "what's his startup", "is henry a founder", "what does sitelight do", "how did he get revenue in 10 days"] },
  { id: "about", title: "About Henry", engrave: "Henry", ids: ["me"],
    suggest: ["who is Henry", "tell me about Henry", "about Henry"],
    subjects: ["about", "bio", "intro", "henry", "himself", "who he is", "age", "where he lives", "background"],
    questions: ["who is henry", "who are you", "how old is henry", "where is henry from", "where does he live", "tell me about yourself", "introduce yourself", "what is a vibecoder", "is he really 14", "who made this site", "who is this"] },
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
  { id: "oss", title: "Open source PRs", engrave: "Merged PRs", ids: ["oss"],
    suggest: ["show me Henry's merged pull requests", "merged PRs"],
    subjects: ["merged prs", "pull requests", "merged pull requests", "contributions", "sympy", "biome", "astro", "github contributions", "commits"],
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
