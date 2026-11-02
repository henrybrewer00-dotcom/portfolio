// node tools/seo.mjs (also runs as part of `npm run model`)
//
// Writes everything search engines and AI answer engines read, from src/content.js:
//   index.html   the JSON-LD (who Henry is) and the "About Henry Brewer" section, as real HTML in the page
//   llms.txt     a plain-text summary for AI crawlers (https://llmstxt.org)
//   sitemap.xml  with today's date as lastmod

import { readFileSync, writeFileSync } from "node:fs";
import { ITEMS, BIO, SITE, PROFILES, GH, FAQ, QUICK } from "../src/content.js";

const today = new Date().toISOString().slice(0, 10);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const item = (id) => ITEMS.find((it) => it.id === id);
// absolute links only: "#prs" and mailto stay on the page, relative asset paths become full URLs
const abs = (href) => /^(https?:|mailto:|#)/.test(href) ? href : SITE + "/" + href.replace(/^\.?\//, "");
const shown = ITEMS.filter((it) => it.kind !== "about" && it.kind !== "contact");
const text = (it) => it.body || (it.list || []).join(", ");

// ---------- JSON-LD ----------
const person = `${SITE}/#henry`;
const graph = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Person", "@id": person, name: "Henry Brewer", givenName: "Henry", familyName: "Brewer",
      alternateName: ["Henry Brewer (developer)", "henrybrewer00-dotcom"],
      url: SITE + "/", mainEntityOfPage: { "@id": `${SITE}/#page` }, image: SITE + "/assets/share-henry-3.png",
      description: BIO,
      // what tells this Henry Brewer apart from the others in search (the illustrator, the provost-marshal...)
      disambiguatingDescription: "14-year-old developer from Austin, Texas, who goes to Alpha High School and builds AI projects such as Vurn AI; formerly cofounder and CTO of Crawft.",
      jobTitle: "Software developer",
      hasOccupation: { "@type": "Occupation", name: "Software developer", skills: "AI agents, cybersecurity, voice AI, TypeScript, React, Python" },
      // past role: Crawft cofounder and CTO from mid-August 2026 until he sold his stake (the company itself was not sold)
      affiliation: { "@type": "OrganizationRole", roleName: "Cofounder and CTO (former; sold his stake)", startDate: "2026-08", affiliation: { "@id": "https://crawft.ai/#org" } },
      alumniOf: { "@type": "EducationalOrganization", name: "Alpha High School", url: "https://alphahigh.school" },
      homeLocation: { "@type": "Place", name: "Austin, Texas", address: { "@type": "PostalAddress", addressLocality: "Austin", addressRegion: "TX", addressCountry: "US" } },
      nationality: { "@type": "Country", name: "United States" },
      email: "mailto:henrybrewer00@gmail.com",
      award: ["Hackathon win: InsForge", "Hackathon win: Frontier Tower", "Hackathon win: a16z × Cursor"],
      knowsAbout: ["Software development", "Artificial intelligence", "AI agents", "Cybersecurity", "Penetration testing", "Voice AI", "Robotics", "Web development", "TypeScript", "React", "Python", "Open source"],
      sameAs: PROFILES,
    },
    { "@type": "Organization", "@id": "https://crawft.ai/#org", name: "Crawft", url: "https://crawft.ai", description: item("crawft").body.replace(/^I cofounded Crawft and was its CTO from mid-August 2026, then sold my stake\. /, ""), founder: { "@id": person } },
    { "@type": "SoftwareApplication", name: "SiteLight", applicationCategory: "BusinessApplication", operatingSystem: "Web", description: item("sitelight").body, creator: { "@id": person } },
    { "@type": "SoftwareApplication", name: "Vurn AI", applicationCategory: "SecurityApplication", operatingSystem: "Web", description: item("vurn").body, creator: { "@id": person }, author: { "@id": person } },
    { "@type": "WebSite", "@id": `${SITE}/#website`, url: SITE + "/", name: "Henry Brewer", inLanguage: "en", publisher: { "@id": person } },
    { "@type": "ProfilePage", "@id": `${SITE}/#page`, url: SITE + "/", name: "Henry Brewer", isPartOf: { "@id": `${SITE}/#website` }, mainEntity: { "@id": person }, about: { "@id": person }, dateCreated: "2026-10-25", dateModified: today },
    { "@type": "FAQPage", "@id": `${SITE}/#faq`, url: SITE + "/", about: { "@id": person },
      mainEntity: FAQ.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) },
  ],
};
const jsonld = JSON.stringify(graph, null, 2).replace(/</g, "\\u003c").split("\n").map((l) => "    " + l).join("\n");

// ---------- the about section (real text in the HTML, visible to everyone) ----------
const links = (it) => (it.links || []).map((l) => l.href ? ` <a class="act is-soft" href="${esc(abs(l.href))}">${esc(l.label)}</a>` : ` <span class="act is-soft">${esc(l.label)}</span>`).join("");
const about = `      <section class="about" id="about" aria-labelledby="about-title">
        <h2 class="about-title" id="about-title">About Henry Brewer, 14-year-old developer</h2>
        <p class="about-bio">${esc(BIO)}</p>
        <p class="about-links"><a class="act is-soft" href="${GH}">GitHub ↗</a> <a class="act is-soft" href="https://crawft.ai">Crawft ↗</a> <a class="act is-soft" href="https://x.com/Henry_J_Brew">X ↗</a> <a class="act is-soft" href="mailto:henrybrewer00@gmail.com">henrybrewer00@gmail.com</a></p>
        <ul class="about-list">
${shown.map((it) => `          <li><p class="kicker">${esc(it.kicker)}</p><h3>${esc(it.title)}</h3><p>${esc(text(it))}</p>${links(it) ? `<p>${links(it).trim()}</p>` : ""}</li>`).join("\n")}
        </ul>
      </section>`;

const page = new URL("../index.html", import.meta.url);
const before = readFileSync(page, "utf8");
const after = before
  // Function replacers on purpose: a string replacement treats "$2" in the content
  // (e.g. "It made $2") as a capture group, which once wrote the end marker into
  // the text and duplicated the whole block. Greedy match up to the LAST end
  // marker so a page damaged that way repairs itself on the next run.
  .replace(/<!-- jsonld:start -->[\s\S]*<!-- jsonld:end -->/, () => `<!-- jsonld:start -->\n    <script type="application/ld+json">\n${jsonld}\n    </script>\n    <!-- jsonld:end -->`)
  .replace(/<!-- about:start -->[\s\S]*<!-- about:end -->/, () => `<!-- about:start -->\n${about}\n      <!-- about:end -->`);
if (after !== before) { writeFileSync(page, after); console.log("index.html: JSON-LD and about section updated"); }

// ---------- llms.txt ----------
const llms = `# Henry Brewer

> ${BIO}

Site: ${SITE}/
GitHub: ${GH}
X: https://x.com/Henry_J_Brew
Email: henrybrewer00@gmail.com

## Work

${shown.map((it) => {
  const link = (it.links || []).filter((l) => l.href).map((l) => abs(l.href)).find((h) => h.startsWith("http"));
  const facts = (it.facts || []).map((f) => `  - ${f}`).join("\n");
  return `- ${link ? `[${it.title}](${link})` : it.title} (${it.kicker}): ${text(it)}${facts ? "\n" + facts : ""}`;
}).join("\n")}

## School

${item("me").facts.map((f) => `- ${f}`).join("\n")}

## FAQ

${FAQ.map(([q, a]) => `### ${q}\n${a}`).join("\n\n")}

`;
writeFileSync(new URL("../llms.txt", import.meta.url), llms);

// /about/ is a 301 to the home page (vercel.json), so searches always land on the home page.

// ---------- sitemap.xml ----------
writeFileSync(new URL("../sitemap.xml", import.meta.url), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${SITE}/</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>1.0</priority></url>
</urlset>
`);
console.log("llms.txt and sitemap.xml written");
