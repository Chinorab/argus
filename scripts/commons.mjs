// Cherche sur Wikimedia Commons et télécharge des photos sous licence libre, avec attribution.
import { writeFile } from "node:fs/promises";
const UA = "Argus/0.1 (hackathon demo; contact via repo)";
const [query, out, pick = "0"] = process.argv.slice(2);
const api = (params) => fetch("https://commons.wikimedia.org/w/api.php?" + new URLSearchParams({ format: "json", ...params }), { headers: { "User-Agent": UA } }).then((r) => r.json());
const s = await api({ action: "query", list: "search", srsearch: query + " filetype:bitmap", srnamespace: 6, srlimit: 12 });
const titles = s.query.search.map((r) => r.title);
titles.forEach((t, i) => console.error(`${i}: ${t}`));
const title = titles[Number(pick)];
const info = await api({ action: "query", titles: title, prop: "imageinfo", iiprop: "url|extmetadata", iiurlwidth: 1400 });
const ii = Object.values(info.query.pages)[0].imageinfo[0];
const meta = ii.extmetadata;
const lic = meta.LicenseShortName?.value ?? "?";
const artist = (meta.Artist?.value ?? "?").replace(/<[^>]+>/g, "");
console.error(`→ ${title}\n   licence ${lic}, auteur ${artist}`);
if (!/^(CC BY|CC BY-SA|CC0|Public domain)/i.test(lic)) { console.error("licence non libre, abandon"); process.exit(2); }
const buf = Buffer.from(await fetch(ii.thumburl, { headers: { "User-Agent": UA } }).then((r) => r.arrayBuffer()));
await writeFile(out, buf);
console.log(JSON.stringify({ file: out, title, license: lic, artist, source: "https://commons.wikimedia.org/wiki/" + encodeURIComponent(title.replace(/ /g, "_")) }));
