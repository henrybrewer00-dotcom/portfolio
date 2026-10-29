// node tools/seo.mjs (also runs as part of `npm run model`)
//
// Writes everything search engines and AI answer engines read, from src/content.js:
//   index.html   the JSON-LD (who Henry is) and the "About Henry Brewer" section, as real HTML in the page
//   llms.txt     a plain-text summary for AI crawlers (https://llmstxt.org)
//   about/index.html  a plain page of facts about Henry, with FAQ schema
//   sitemap.xml  with today's date as lastmod

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
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
      url: SITE + "/", mainEntityOfPage: { "@id": `${SITE}/#page` }, image: SITE + "/assets/share-henry-2.png",
      description: BIO,
      // what tells this Henry Brewer apart from the others in search (the illustrator, the provost-marshal...)
      disambiguatingDescription: "14-year-old software developer and entrepreneur from Austin, Texas; founder and CEO of SiteLight, former cofounder and CTO of Crawft, and creator of the AI pentesting tool Vurn AI.",
      jobTitle: ["Software developer", "Founder and CEO of SiteLight"],
      hasOccupation: [
        { "@type": "Occupation", name: "Software developer", skills: "AI agents, cybersecurity, voice AI, TypeScript, React, Python" },
        { "@type": "Occupation", name: "Entrepreneur" },
      ],
      worksFor: { "@id": "https://sitelight.xyz/#org" },
      // Crawft: cofounder and CTO from mid-August 2026 until he sold his stake
      affiliation: { "@type": "OrganizationRole", roleName: "Cofounder and CTO (former; sold his stake)", startDate: "2026-08", affiliation: { "@id": "https://crawft.ai/#org" } },
      alumniOf: { "@type": "EducationalOrganization", name: "Alpha High School", url: "https://alphahigh.school" },
      homeLocation: { "@type": "Place", name: "Austin, Texas", address: { "@type": "PostalAddress", addressLocality: "Austin", addressRegion: "TX", addressCountry: "US" } },
      nationality: { "@type": "Country", name: "United States" },
      email: "mailto:henrybrewer00@gmail.com",
      award: ["Hackathon win: InsForge", "Hackathon win: Frontier Tower", "Hackathon win: a16z × Cursor"],
      knowsAbout: ["Software development", "Artificial intelligence", "AI agents", "Cybersecurity", "Penetration testing", "Voice AI", "Robotics", "Web development", "Entrepreneurship", "Startups", "TypeScript", "React", "Python", "Open source"],
      sameAs: PROFILES,
    },
    { "@type": "Organization", "@id": "https://crawft.ai/#org", name: "Crawft", url: "https://crawft.ai", description: item("crawft").body.replace(/^I cofounded Crawft and was its CTO from mid-August 2026, then sold my stake\. /, ""), founder: { "@id": person } },
    { "@type": "Organization", "@id": "https://sitelight.xyz/#org", name: "SiteLight", url: "https://sitelight.xyz", description: "Checks whether AI assistants recommend your business when someone asks, then hands you the to-do list to become the answer.", founder: { "@id": person } },
    { "@type": "SoftwareApplication", name: "Vurn AI", applicationCategory: "SecurityApplication", operatingSystem: "Web", description: item("vurn").body, creator: { "@id": person }, author: { "@id": person } },
    { "@type": "WebSite", "@id": `${SITE}/#website`, url: SITE + "/", name: "Henry Brewer", inLanguage: "en", publisher: { "@id": person } },
    { "@type": "ProfilePage", "@id": `${SITE}/#page`, url: SITE + "/", name: "Henry Brewer", isPartOf: { "@id": `${SITE}/#website` }, mainEntity: { "@id": person }, about: { "@id": person }, dateCreated: "2026-10-25", dateModified: today },
  ],
};
const jsonld = JSON.stringify(graph, null, 2).replace(/</g, "\\u003c").split("\n").map((l) => "    " + l).join("\n");

// ---------- the about section (real text in the HTML, visible to everyone) ----------
const links = (it) => (it.links || []).map((l) => ` <a class="act is-soft" href="${esc(abs(l.href))}">${esc(l.label)}</a>`).join("");
const about = `      <section class="about" id="about" aria-labelledby="about-title">
        <h2 class="about-title" id="about-title">About Henry Brewer, 14-year-old developer</h2>
        <p class="about-bio">${esc(BIO)}</p>
        <p class="about-more"><a class="act is-soft" href="/about/">More about Henry Brewer →</a></p>
        <p class="about-links"><a class="act is-soft" href="${GH}">GitHub ↗</a> <a class="act is-soft" href="https://crawft.ai">Crawft ↗</a> <a class="act is-soft" href="https://sitelight.xyz">SiteLight ↗</a> <a class="act is-soft" href="https://x.com/Henry_J_Brew">X ↗</a> <a class="act is-soft" href="mailto:henrybrewer00@gmail.com">henrybrewer00@gmail.com</a></p>
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
X: https://x.com/Henry_J_Brew
Email: henrybrewer00@gmail.com

## Work

${shown.map((it) => {
  const link = (it.links || []).map((l) => abs(l.href)).find((h) => h.startsWith("http"));
  const facts = (it.facts || []).map((f) => `  - ${f}`).join("\n");
  return `- ${link ? `[${it.title}](${link})` : it.title} (${it.kicker}): ${text(it)}${facts ? "\n" + facts : ""}`;
}).join("\n")}

## School

${item("me").facts.map((f) => `- ${f}`).join("\n")}

## FAQ

${FAQ.map(([q, a]) => `### ${q}\n${a}`).join("\n\n")}

More: ${SITE}/about/
`;
writeFileSync(new URL("../llms.txt", import.meta.url), llms);

// ---------- about/index.html: the facts, stated plainly, for search engines and AI overviews ----------
const aboutUrl = SITE + "/about/";
const aboutGraph = {
  "@context": "https://schema.org",
  "@graph": [
    graph["@graph"][0],
    { "@type": "ProfilePage", "@id": `${aboutUrl}#page`, url: aboutUrl, name: "About Henry Brewer", isPartOf: { "@id": `${SITE}/#website` }, mainEntity: { "@id": person }, about: { "@id": person }, dateModified: today },
    { "@type": "FAQPage", "@id": `${aboutUrl}#faq`, url: aboutUrl, about: { "@id": person },
      mainEntity: FAQ.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) },
  ],
};
const aboutJson = JSON.stringify(aboutGraph, null, 2).replace(/</g, "\\u003c");
const aboutHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>About Henry Brewer · 14-year-old developer and entrepreneur</title>
    <meta name="description" content="${esc(FAQ[0][1])}" />
    <meta name="author" content="Henry Brewer" />
    <link rel="canonical" href="${aboutUrl}" />
    <meta name="theme-color" content="#000000" />
    <meta property="og:title" content="About Henry Brewer" />
    <meta property="og:description" content="${esc(FAQ[0][1])}" />
    <meta property="og:type" content="profile" />
    <meta property="og:url" content="${aboutUrl}" />
    <meta property="og:image" content="${SITE}/assets/share-henry-2.png" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:creator" content="@Henry_J_Brew" />
    <link rel="icon" href="/favicon.ico" sizes="48x48" />
    <link rel="icon" href="/assets/favicon-v2.svg" type="image/svg+xml" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500&family=Instrument+Serif&display=swap" rel="stylesheet" />
    <style>
      :root { color-scheme: dark; --ink: #ece8de; --muted: #8d8a80; --border: #2c2b26; }
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { background: #000; color: var(--ink); font: 16px/1.6 Geist, system-ui, sans-serif; -webkit-font-smoothing: antialiased; }
      main { max-width: 42rem; margin: 0 auto; padding: 3rem 16px 5rem; }
      a { color: var(--ink); }
      .home { font: 400 1.4rem/1 "Instrument Serif", Georgia, serif; text-decoration: none; }
      h1 { font: 400 clamp(2.6rem, 9vw, 4rem)/1 "Instrument Serif", Georgia, serif; margin: 3rem 0 1rem; letter-spacing: -0.01em; }
      h2 { font: 400 1.8rem/1.1 "Instrument Serif", Georgia, serif; margin: 3rem 0 1rem; }
      h3 { font: 500 1rem/1.4 Geist, system-ui, sans-serif; margin: 1.6rem 0 0.3rem; }
      p { color: #cfcbbf; }
      .lede { font-size: 1.1rem; }
      dl { display: grid; grid-template-columns: max-content 1fr; gap: 0.5rem 1.4rem; border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); padding: 1.2rem 0; }
      dt { color: var(--muted); font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.08em; padding-top: 0.15rem; }
      dd { color: var(--ink); }
      .links { margin-top: 3rem; color: var(--muted); font-size: 0.9rem; }
      .links a { margin-right: 1rem; }
    </style>
    <script type="application/ld+json">
${aboutJson}
    </script>
  </head>
  <body>
    <main>
      <a class="home" href="/">henry.</a>
      <h1>Henry Brewer</h1>
      <p class="lede">${esc(BIO)}</p>
      <h2>Quick facts</h2>
      <dl>
${QUICK.map(([k, v]) => `        <dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join("\n")}
      </dl>
      <h2>Questions people ask</h2>
${FAQ.map(([q, a]) => `      <h3>${esc(q)}</h3>\n      <p>${esc(a)}</p>`).join("\n")}
      <p class="links"><a href="/">Ask about anything he's built →</a> <a href="${GH}">GitHub</a> <a href="https://x.com/Henry_J_Brew">X</a> <a href="https://sitelight.xyz">SiteLight</a> <a href="mailto:henrybrewer00@gmail.com">Email</a></p>
    </main>
  </body>
</html>
`;
mkdirSync(new URL("../about/", import.meta.url), { recursive: true });
writeFileSync(new URL("../about/index.html", import.meta.url), aboutHtml);

// ---------- sitemap.xml ----------
writeFileSync(new URL("../sitemap.xml", import.meta.url), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${SITE}/</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>1.0</priority></url>
  <url><loc>${SITE}/about/</loc><lastmod>${today}</lastmod><changefreq>monthly</changefreq><priority>0.9</priority></url>
</urlset>
`);
console.log("llms.txt, about/index.html and sitemap.xml written");
