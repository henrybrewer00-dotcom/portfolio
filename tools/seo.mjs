// node tools/seo.mjs (also runs as part of `npm run model`)
//
// Writes everything search engines and AI answer engines read, from src/content.js:
//   index.html   the JSON-LD (who Henry is) and the "About Henry Brewer" section, as real HTML in the page
//   llms.txt     a plain-text summary for AI crawlers (https://llmstxt.org)
//   sitemap.xml  with today's date as lastmod

import { readFileSync, writeFileSync } from "node:fs";
import { ITEMS, BIO, SITE, PROFILES, GH } from "../src/content.js";

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
      url: SITE + "/", description: BIO, image: SITE + "/assets/share-henry.png",
      jobTitle: "Cofounder and CTO, Crawft",
      worksFor: { "@id": "https://crawft.ai/#org" },
      alumniOf: { "@type": "EducationalOrganization", name: "Alpha High School", url: "https://alphahigh.school" },
      email: "mailto:henrybrewer00@gmail.com",
      knowsAbout: ["Artificial intelligence", "AI agents", "Cybersecurity", "Penetration testing", "Voice AI", "Robotics", "Web development", "TypeScript", "React", "Python", "Open source"],
      sameAs: PROFILES,
    },
    { "@type": "Organization", "@id": "https://crawft.ai/#org", name: "Crawft", url: "https://crawft.ai", description: item("crawft").body.replace(/^I'm cofounder and CTO, since mid-August 2026\. /, ""), founder: { "@id": person } },
    { "@type": "Organization", "@id": "https://sitelight.xyz/#org", name: "SiteLight", url: "https://sitelight.xyz", description: "Checks whether AI assistants recommend your business when someone asks, then hands you the to-do list to become the answer.", founder: { "@id": person } },
    { "@type": "SoftwareApplication", name: "Vurn AI", applicationCategory: "SecurityApplication", description: item("vurn").body, creator: { "@id": person } },
    { "@type": "WebSite", "@id": `${SITE}/#website`, url: SITE + "/", name: "Henry Brewer", inLanguage: "en", publisher: { "@id": person } },
    { "@type": "ProfilePage", "@id": `${SITE}/#page`, url: SITE + "/", name: "Henry Brewer", isPartOf: { "@id": `${SITE}/#website` }, mainEntity: { "@id": person }, about: { "@id": person }, dateModified: today },
  ],
};
const jsonld = JSON.stringify(graph, null, 2).replace(/</g, "\\u003c").split("\n").map((l) => "    " + l).join("\n");

// ---------- the about section (real text in the HTML, visible to everyone) ----------
const links = (it) => (it.links || []).map((l) => ` <a class="act is-soft" href="${esc(abs(l.href))}">${esc(l.label)}</a>`).join("");
const about = `      <section class="about" id="about" aria-labelledby="about-title">
        <h2 class="about-title" id="about-title">About Henry Brewer</h2>
        <p class="about-bio">${esc(BIO)}</p>
        <p class="about-links"><a class="act is-soft" href="${GH}">GitHub ↗</a> <a class="act is-soft" href="https://crawft.ai">Crawft ↗</a> <a class="act is-soft" href="https://sitelight.xyz">SiteLight ↗</a> <a class="act is-soft" href="mailto:henrybrewer00@gmail.com">henrybrewer00@gmail.com</a></p>
        <ul class="about-list">
${shown.map((it) => `          <li><p class="kicker">${esc(it.kicker)}</p><h3>${esc(it.title)}</h3><p>${esc(text(it))}</p>${links(it) ? `<p>${links(it).trim()}</p>` : ""}</li>`).join("\n")}
        </ul>
      </section>`;

const page = new URL("../index.html", import.meta.url);
const before = readFileSync(page, "utf8");
const after = before
  .replace(/(<!-- jsonld:start -->)[\s\S]*?(<!-- jsonld:end -->)/, `$1\n    <script type="application/ld+json">\n${jsonld}\n    </script>\n    $2`)
  .replace(/(<!-- about:start -->)[\s\S]*?(<!-- about:end -->)/, `$1\n${about}\n      $2`);
if (after !== before) { writeFileSync(page, after); console.log("index.html: JSON-LD and about section updated"); }

// ---------- llms.txt ----------
const llms = `# Henry Brewer

> ${BIO}

Site: ${SITE}/
GitHub: ${GH}
Email: henrybrewer00@gmail.com

## Work

${shown.map((it) => {
  const link = (it.links || []).map((l) => abs(l.href)).find((h) => h.startsWith("http"));
  const facts = (it.facts || []).map((f) => `  - ${f}`).join("\n");
  return `- ${link ? `[${it.title}](${link})` : it.title} (${it.kicker}): ${text(it)}${facts ? "\n" + facts : ""}`;
}).join("\n")}

## School

${item("me").facts.map((f) => `- ${f}`).join("\n")}
`;
writeFileSync(new URL("../llms.txt", import.meta.url), llms);

// ---------- sitemap.xml ----------
writeFileSync(new URL("../sitemap.xml", import.meta.url), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${SITE}/</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>1.0</priority></url>
</urlset>
`);
console.log("llms.txt and sitemap.xml written");
