import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdtemp, readFile, rm, writeFile, access } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

const execFileAsync = promisify(execFile);

async function pathExists(p) {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

function findSofficeCandidates() {
  return [
    process.env.LIBREOFFICE_PATH,
    "C:\\Program Files\\LibreOffice\\program\\soffice.exe",
    "C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe",
    "/usr/bin/soffice",
    "/usr/bin/libreoffice",
    "/Applications/LibreOffice.app/Contents/MacOS/soffice",
  ].filter(Boolean);
}

/**
 * Convierte DOCX → PDF con LibreOffice (si el binario existe).
 */
async function convertWithLibreOffice(docxPath, outDir) {
  const candidates = findSofficeCandidates();
  let tried = false;

  for (const bin of candidates) {
    if (!(await pathExists(bin))) continue;
    tried = true;
    await execFileAsync(
      bin,
      [
        "--headless",
        "--nologo",
        "--nofirststartwizard",
        "--convert-to",
        "pdf",
        "--outdir",
        outDir,
        docxPath,
      ],
      { timeout: 120_000, windowsHide: true },
    );
    const pdfPath = path.join(
      outDir,
      `${path.basename(docxPath, path.extname(docxPath))}.pdf`,
    );
    if (await pathExists(pdfPath)) return pdfPath;
  }

  throw new Error(
    tried
      ? "LibreOffice no generó el PDF"
      : "LibreOffice no instalado",
  );
}

/**
 * Convierte DOCX → PDF con Microsoft Word (Windows COM + SaveAs2).
 */
async function convertWithWordCom(docxPath, pdfPath) {
  const scriptPath = path.join(path.dirname(docxPath), "convert.ps1");
  const script = `
$ErrorActionPreference = 'Stop'
$docx = ${JSON.stringify(docxPath)}
$pdf = ${JSON.stringify(pdfPath)}
$word = $null
$doc = $null
try {
  $word = New-Object -ComObject Word.Application
  $word.Visible = $false
  $word.DisplayAlerts = 0
  $doc = $word.Documents.Open($docx, $false, $true)
  # 17 = wdFormatPDF (SaveAs2 es estable en Word/COM)
  $wdFormatPDF = 17
  $doc.SaveAs2([ref]$pdf, [ref]$wdFormatPDF)
} finally {
  if ($null -ne $doc) {
    try { $doc.Close([ref]$false) } catch {}
  }
  if ($null -ne $word) {
    try { $word.Quit([ref]$false) } catch {}
    try {
      [System.Runtime.InteropServices.Marshal]::ReleaseComObject($word) | Out-Null
    } catch {}
  }
  [GC]::Collect()
  [GC]::WaitForPendingFinalizers()
}
`;

  await writeFile(scriptPath, script, "utf8");

  await execFileAsync(
    "powershell.exe",
    [
      "-NoProfile",
      "-NonInteractive",
      "-ExecutionPolicy",
      "Bypass",
      "-File",
      scriptPath,
    ],
    { timeout: 180_000, windowsHide: true },
  );

  if (!(await pathExists(pdfPath))) {
    throw new Error("Word no generó el PDF");
  }
  return pdfPath;
}

/**
 * Convierte un buffer/Uint8Array DOCX a PDF.
 * En Windows prioriza Word; si no, LibreOffice.
 * @param {Uint8Array|Buffer} docxBytes
 * @returns {Promise<Buffer>}
 */
export async function convertDocxToPdf(docxBytes) {
  const dir = await mkdtemp(path.join(tmpdir(), "hv-docx-pdf-"));
  const docxPath = path.join(dir, "documento.docx");
  const pdfPath = path.join(dir, "documento.pdf");

  try {
    await writeFile(docxPath, Buffer.from(docxBytes));

    let outPdf = null;
    const errors = [];

    if (process.platform === "win32") {
      try {
        outPdf = await convertWithWordCom(docxPath, pdfPath);
      } catch (err) {
        errors.push(`Word: ${err?.message || err}`);
      }
    }

    if (!outPdf) {
      try {
        outPdf = await convertWithLibreOffice(docxPath, dir);
      } catch (err) {
        errors.push(`LibreOffice: ${err?.message || err}`);
      }
    }

    if (!outPdf) {
      throw new Error(
        `No se pudo convertir DOCX a PDF. ${errors.join(" | ") || "Instala Microsoft Word o LibreOffice."}`,
      );
    }

    return await readFile(outPdf);
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => {});
  }
}
