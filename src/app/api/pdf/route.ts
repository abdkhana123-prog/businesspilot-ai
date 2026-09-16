import { NextResponse } from "next/server";
import { createRequire } from "node:module";

export const runtime = "nodejs";

const require = createRequire(import.meta.url);

// Important: direct parser file use kar rahe hain.
// Main "pdf-parse" entry point test PDF load karne ki koshish karta hai.
const pdfParse = require("pdf-parse/lib/pdf-parse.js");

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          error: "No PDF file was selected.",
        },
        {
          status: 400,
        },
      );
    }

    const isPdf =
      file.type === "application/pdf" ||
      file.name.toLowerCase().endsWith(".pdf");

    if (!isPdf) {
      return NextResponse.json(
        {
          error: "Only PDF files are allowed.",
        },
        {
          status: 400,
        },
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await pdfParse(buffer);

    return NextResponse.json({
      fileName: file.name,
      pages: result.numpages || 1,
      text: result.text || "",
    });
  } catch (error) {
    console.error("PDF reading error:", error);

    return NextResponse.json(
      {
        error:
          "The PDF could not be read. Please upload a text-based PDF file.",
      },
      {
        status: 500,
      },
    );
  }
}