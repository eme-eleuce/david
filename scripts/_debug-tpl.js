const { readFileSync, writeFileSync, mkdirSync } = require("fs");
const JSZip = require("jszip");

async function dump(name) {
  const zip = await JSZip.loadAsync(
    readFileSync(`public/templates/${name}.docx`),
  );
  console.log("\n========", name, "========");
  const files = Object.keys(zip.files)
    .filter((f) => f.startsWith("word/"))
    .sort();
  console.log(files.join("\n"));

  const docRels = await zip.file("word/_rels/document.xml.rels").async("string");
  console.log("\n-- document.xml.rels --\n", docRels);

  const doc = await zip.file("word/document.xml").async("string");
  const sect = doc.match(/<w:sectPr[\s\S]*?<\/w:sectPr>/i)?.[0];
  console.log("\n-- sectPr --\n", sect);

  for (const h of ["header1.xml", "header2.xml", "footer1.xml", "footer2.xml"]) {
    const f = zip.file(`word/${h}`);
    if (!f) continue;
    const xml = await f.async("string");
    console.log(`\n-- ${h} len=${xml.length} --`);
    console.log(xml.slice(0, 800));
    const rel = zip.file(`word/_rels/${h}.rels`);
    if (rel) console.log(`\n-- ${h}.rels --\n`, await rel.async("string"));
  }
}

async function main() {
  await dump("Ecuasinergy");
  await dump("Duropegasa");
  await dump("Multinuclear");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
