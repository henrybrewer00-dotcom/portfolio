// Check the decision model on phrases it never trained on, and time it.
//   node tools/test.mjs   (or: npm test)

import { readFileSync } from "node:fs";
import { INTENTS, personaFor } from "../src/content.js";
import { createModel } from "../src/model.js";
import { createSuggester } from "../src/suggest.js";

const model = createModel(JSON.parse(readFileSync(new URL("../model/model.json", import.meta.url), "utf8")));
const { suggest } = createSuggester(INTENTS);

// Written separately from the training phrases in content.js.
const HELD_OUT = [
  ["show me henrys current job", "crawft"], ["wheres henry working", "crawft"], ["what's his business", "sitelight"],
  ["what's his job", "crawft"], ["henry's startup", "sitelight"], ["where's he employed", "crawft"], ["the ai visibility thing", "sitelight"],
  ["show me henrys cyber work", "vurn"], ["is he into hacking", "vurn"], ["the pentest tool", "vurn"],
  ["show me his marketing", "sitelight"], ["can he market a product", "sitelight"],
  ["how long has henry bean building", "about"], ["how long has he been making things", "about"],
  ["who's henry", "about"], ["how old are you", "about"], ["where are you from", "about"],
  ["the grandma ai", "lily"], ["what calls grandma", "lily"], ["lily app", "lily"],
  ["the drivethru", "drivethru"], ["voice food ordering", "drivethru"],
  ["rap battle", "elevenmile"], ["the rap one", "elevenmile"],
  ["screen recorder app", "glasscast"], ["glasscast", "glasscast"],
  ["pawbot", "pawbot"], ["helping seniors with computers", "pawbot"],
  ["robot car", "siege"], ["the car that chases dogs", "siege"], ["siege", "siege"],
  ["submarine", "sub"], ["the rov", "sub"], ["underwater", "sub"],
  ["pull requests", "oss"], ["merged prs on github", "oss"],
  ["hackathons", "wins"], ["did henry win anything", "wins"], ["prizes", "wins"],
  ["tech stack", "stack"], ["what languages", "stack"], ["does he know typescript", "stack"],
  ["grades", "receipts"], ["typing speed", "receipts"], ["is he smart", "receipts"],
  ["contact", "contact"], ["how do i email henry", "contact"], ["hire him", "contact"], ["i want to hire you", "contact"],
  ["voice ai", "voice"], ["elevenlabs stuff", "voice"], ["voice projects", "voice"],
  ["hardware", "hardware"], ["arduino", "hardware"], ["physical builds", "hardware"],
  ["open source", "opensource"], ["public code", "opensource"],
  ["ai projects", "ai"], ["stuff with ai", "ai"],
  ["everything", "browse"], ["all his projects", "browse"], ["what has he built", "browse"], ["portfolio", "browse"],
  ["what is his occupation right now", "crawft"], ["is he good at school", "receipts"], ["the lily project", "lily"], ["does he use python", "stack"], ["show me robotics", "siege"], ["send henry an email", "contact"], ["the drive through bot", "drivethru"],
];

let right = 0;
const misses = [];
for (const [text, want] of HELD_OUT) {
  const [top] = model.predict(text);
  if (top.id === want) right++; else misses.push(`  "${text}" → ${top.id} (${top.p.toFixed(2)}), wanted ${want}`);
}
const acc = right / HELD_OUT.length;
console.log(`held-out accuracy: ${right}/${HELD_OUT.length} (${(acc * 100).toFixed(0)}%)`);
if (misses.length) console.log(misses.join("\n"));

// speed: one prediction per keystroke of a long query
const q = "show me henry's current job and everything he has built";
const t0 = performance.now(); let n = 0;
for (let r = 0; r < 200; r++) for (let i = 1; i <= q.length; i++) { model.predict(q.slice(0, i)); n++; }
console.log(`predict: ${((performance.now() - t0) / n * 1000).toFixed(1)} µs per keystroke`);

// ghost text
for (const typed of ["henry's cu", "show me hen", "the sub", "how do i", "voice", "zzz"]) {
  const p = Object.fromEntries(model.predict(typed).map((r) => [r.id, r.p]));
  const s = suggest(typed, (id) => p[id] || 0);
  console.log(`  "${typed}" → ${s ? `"${typed}[${s.ghost}]" (${s.intent})` : "no ghost"}`);
}

// who-are-you answers: a job at a school is a job, not a student
const ROLES = [["guide at alpha school", "educator"], ["I teach high school math", "educator"], ["school principal", "educator"], ["school nurse", "educator"],
  ["professor at stanford university", "educator"], ["student at alpha school", "student"], ["junior in high school", "student"], ["I go to school", "student"],
  ["I work for Google", "engineer"], ["software engineer at a school", "engineer"], ["product designer", "designer"], ["just browsing", "curious"],
  // wanting a kind of person is hiring that kind, not being it
  ["im lokoing to hire a designer", "hiring-designer"], ["I'm looking to hire a designer", "hiring-designer"], ["I need a designer", "hiring-designer"],
  ["we have an open role for a ux designer", "hiring-designer"], ["design recruiter", "hiring-designer"], ["engineer looking to hire designers", "hiring-designer"],
  ["looking for someone to design our logo", "hiring-designer"], ["hiring engineers", "hiring-engineer"], ["I'm hiring engineers", "hiring-engineer"],
  ["we're looking for a frontend dev", "hiring-engineer"], ["tech recruiter", "hiring-engineer"], ["looking for someone to build my app", "hiring-engineer"],
  ["recruiting software engineers for a startup", "hiring-engineer"], ["hiring a security engineer", "hiring-security"], ["my team needs a pentester", "hiring-security"],
  ["hiring hackers", "hiring-security"], ["I'm a recruiter", "hiring"], ["i want to hire you", "hiring"], ["my company is hiring", "hiring"], ["hr", "hiring"],
  ["I'm a talent acquisition partner", "hiring"], ["school hiring teachers", "hiring"], ["looking for interns", "hiring-engineer"], ["hiring manager", "hiring"],
  ["looking for a cofounder", "founder"], ["looking for a technical cofounder", "founder"], ["investor looking for startups", "founder"],
  // wanting to be one, or wanting work, is not hiring
  ["I want to be a designer", "designer"], ["I want to become an engineer", "engineer"], ["looking for a job as a designer", "designer"],
  ["student looking for an internship", "student"], ["I need a website", "curious"], ["I'm opening a bakery", "curious"],
  // typos, negations, more ways to say it
  ["desginer", "designer"], ["softwre enginer", "engineer"], ["hirign a desinger", "hiring-designer"], ["I'm not a designer, I code", "engineer"],
  ["cs major", "student"], ["art director", "designer"], ["illustrator", "designer"], ["junior developer", "engineer"], ["senior in high school", "student"],
  ["I'm in 8th grade", "student"], ["white hat hacker", "security"], ["I run a startup", "founder"], ["I'm a teacher", "educator"], ["I'm a parent", "student"]];
const wrongRoles = ROLES.filter(([t, want]) => personaFor(t) !== want);
for (const [t, want] of wrongRoles) console.error(`  role: "${t}" → ${personaFor(t)}, want ${want}`);
console.log(`roles: ${ROLES.length - wrongRoles.length}/${ROLES.length}`);
if (wrongRoles.length) process.exit(1);

if (acc < 0.9) { console.error("accuracy under 90%"); process.exit(1); }
