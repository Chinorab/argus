import { writeFile } from "node:fs/promises";
const UA = "Argus/0.1 (hackathon demo)";
const [title, out] = process.argv.slice(2);
const api = (params) => fetch("https://commons.wikimedia.org/w/api.php?" + new URLSearchParams({ format: "json", ...params }), { headers: { "User-Agent": UA } }).then((r) => r.json());
const info = await api({ action: "query", titles: title, prop: "imageinfo", iiprop: "url|extmetadata", iiurlwidth: 1400 });
const ii = Object.values(info.query.pages)[0].imageinfo[0];
const meta = ii.extmetadata;
const lic = meta.LicenseShortName?.value ?? "?";
const artist = (meta.Artist?.value ?? "?").replace(/<[^>]+>/g, "").trim();
if (!/^(CC BY|CC BY-SA|CC0|Public domain)/i.test(lic)) { console.error(`${title}: licence ${lic} non libre`); process.exit(2); }
const buf = Buffer.from(await fetch(ii.thumburl, { headers: { "User-Agent": UA } }).then((r) => r.arrayBuffer()));
await writeFile(out, buf);
console.log(JSON.stringify({ file: out.split("/").pop(), title, license: lic, artist, source: "https://commons.wikimedia.org/wiki/" + title.replace(/ /g, "_") }));
