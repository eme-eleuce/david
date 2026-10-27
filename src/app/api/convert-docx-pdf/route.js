import { NextResponse } from "next/server";
import { convertDocxToPdf } from "@/lib/docx-to-pdf";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
/** Word/LibreOffice pueden tardar */
export const maxDuration = 120;

/**
 * POST multipart: file = .docx
 * Responde application/pdf
 */
export async function POST(request) {
  try {
    const form = await request.formData();
    const file = form.get("file");

    if (!file || typeof file === "string") {
      return NextResponse.json(
        { error: "Falta el archivo Word (.docx)." },
        { status: 400 },
      );
    }

    const name = String(file.name || "").toLowerCase();
    if (name && !name.endsWith(".docx")) {
      return NextResponse.json(
        { error: "Solo se aceptan archivos .docx." },
        { status: 400 },
      );
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    if (bytes.byteLength < 100) {
      return NextResponse.json(
        { error: "El archivo Word está vacío o es inválido." },
        { status: 400 },
      );
    }

    const pdfBuffer = await convertDocxToPdf(bytes);
    const base =
      (name || "documento.docx").replace(/\.docx$/i, "") || "documento";

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${base}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("[convert-docx-pdf]", err);
    return NextResponse.json(
      {
        error:
          err?.message ||
          "No se pudo convertir a PDF. ¿Está instalado Microsoft Word o LibreOffice?",
      },
      { status: 500 },
    );
  }
}
