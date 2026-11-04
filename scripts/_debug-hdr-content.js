const { readFileSync } = require("fs");
const JSZip = require("jszip");

async function inspect(name) {
  const zip = await JSZip.loadAsync(
    readFileSync(`public/templates/${name}.docx`),
  );
  console.log("\n====", name, "====");

  const doc = await zip.file("word/document.xml").async("string");
  const drawings = (doc.match(/w:drawing/g) || []).length;
  const blips = [...doc.matchAll(/r:embed="(rId\d+)"/g)].map((m) => m[1]);
  console.log("body drawings", drawings, "embeds", blips);

  for (const h of ["header1.xml", "header2.xml"]) {
    const f = zip.file(`word/${h}`);
    if (!f) continue;
    const xml = await f.async("string");
    const embeds = [...xml.matchAll(/r:embed="(rId\d+)"/g)].map((m) => m[1]);
    const vml = (xml.match(/v:imagedata/g) || []).length;
    const drawing = (xml.match(/w:drawing/g) || []).length;
    const pict = (xml.match(/w:pict/g) || []).length;
    console.log(h, { embeds, vml, drawing, pict, len: xml.length });
    // show a snippet around first image ref
    const i = xml.search(/a:blip|v:imagedata|w:drawing/);
    if (i >= 0) console.log("  snippet:", xml.slice(i, i + 300).replace(/\s+/g, " "));
  }
}

async function main() {
  for (const n of ["Ecuasinergy", "Duropegasa", "Multinuclear", "Kurs"]) {
    await inspect(n);
  }
}

main();
