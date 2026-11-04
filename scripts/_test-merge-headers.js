const { readFileSync, writeFileSync } = require("fs");
const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
} = require("docx");
const JSZip = require("jszip");

const PAGE_TOP_MARGIN = 2880;

function withHeaderClearance(sectPrXml) {
  let xml = sectPrXml;
  if (/\bw:top="/i.test(xml)) {
    xml = xml.replace(/\bw:top="\d+"/i, `w:top="${PAGE_TOP_MARGIN}"`);
  }
  if (/\bw:header="/i.test(xml)) {
    xml = xml.replace(/\bw:header="\d+"/i, `w:header="500"`);
  }
  return xml;
}

async function merge(tplPath, outPath) {
  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: "HOJA DE VIDA EMPRESARIAL",
                bold: true,
                size: 32,
                font: "Arial",
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: "EXPERIENCIA",
                bold: true,
                size: 22,
                font: "Arial",
              }),
            ],
          }),
        ],
      },
    ],
  });
  const contentBlob = await Packer.toBlob(doc);
  const tplZip = await JSZip.loadAsync(readFileSync(tplPath));
  const genZip = await JSZip.loadAsync(await contentBlob.arrayBuffer());
  const tplDocXml = await tplZip.file("word/document.xml").async("string");
  const genDocXml = await genZip.file("word/document.xml").async("string");
  const tplBody = tplDocXml.match(/<w:body\b[^>]*>([\s\S]*)<\/w:body>/i);
  const genBody = genDocXml.match(/<w:body\b[^>]*>([\s\S]*)<\/w:body>/i);
  const sectPrRaw = tplBody[1].match(/<w:sectPr\b[\s\S]*?<\/w:sectPr>/i)[0];
  const sectPr = withHeaderClearance(sectPrRaw);
  const genInner = genBody[1].replace(/<w:sectPr\b[\s\S]*?<\/w:sectPr>/i, "");

  // Preserve template body decorations (floating header art in body)
  const tplInner = tplBody[1].replace(/<w:sectPr\b[\s\S]*?<\/w:sectPr>/i, "");
  const deco = [];
  // Keep blocks that contain drawings
  const parts = tplInner.split(/(?=<w:p[\s>])/i);
  for (const part of parts) {
    if (/w:drawing|w:pict|v:imagedata/i.test(part)) deco.push(part);
  }

  const newDocXml = tplDocXml.replace(
    /<w:body\b[^>]*>[\s\S]*<\/w:body>/i,
    `<w:body>${deco.join("")}${genInner}${sectPr}</w:body>`,
  );
  tplZip.file("word/document.xml", newDocXml);
  const out = await tplZip.generateAsync({ type: "nodebuffer" });
  writeFileSync(outPath, out);

  const z = await JSZip.loadAsync(out);
  const hdr = z.file("word/header1.xml")
    ? await z.file("word/header1.xml").async("string")
    : "";
  const embeds = [...hdr.matchAll(/r:embed="(rId\d+)"/g)].map((m) => m[1]);
  const media = Object.keys(z.files).filter((f) => f.startsWith("word/media/"));
  const body = await z.file("word/document.xml").async("string");
  const bodyEmbeds = [...body.matchAll(/r:embed="(rId\d+)"/g)].map((m) => m[1]);
  console.log(outPath, {
    bytes: out.length,
    headerEmbeds: embeds,
    bodyEmbeds,
    media: media.map((m) => m.split("/").pop()),
    titlePg: /titlePg/.test(body),
    decoParts: deco.length,
  });
}

async function main() {
  for (const n of ["Ecuasinergy", "Duropegasa", "Kurs", "Multinuclear"]) {
    await merge(
      `public/templates/${n}.docx`,
      `public/templates/_merged-${n}.docx`,
    );
  }
}

main();
