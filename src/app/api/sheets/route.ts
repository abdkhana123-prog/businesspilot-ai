import { NextResponse } from "next/server";

type SheetsRequest = {
  action?: "save" | "read";
  resource?: string;
  record?: Record<string, unknown>;
};

function cleanResource(resource: unknown ) {
  if (typeof resource !== "string") {
    return "";
  }

  return resource.trim().slice(0, 80);
}

export async function POST(request: Request) {
  try {
    const apiUrl = process.env.GOOGLE_SHEETS_API_URL;

    if (!apiUrl) {
      return NextResponse.json(
        {
          success: false,
          error: "GOOGLE_SHEETS_API_URL is not configured.",
        },
        { status: 500 },
      );
    }

    const body = (await request.json()) as SheetsRequest;
    const action = body.action || "save";
    const resource = cleanResource(body.resource);

    if (!resource) {
      return NextResponse.json(
        {
          success: false,
          error: "A resource name is required.",
        },
        { status: 400 },
      );
    }

    if (action === "save" && !body.record) {
      return NextResponse.json(
        {
          success: false,
          error: "A record is required for save.",
        },
        { status: 400 },
      );
    }

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action,
        resource,
        record: body.record || null,
        timestamp: new Date().toISOString(),
      }),
      signal: AbortSignal.timeout(30000),
    });

    const rawText = await response.text();

    let result: Record<string, unknown>;

    try {
      result = JSON.parse(rawText);
    } catch {
      return NextResponse.json(
        {
          success: false,
          error:
            "Google Apps Script returned an invalid response.",
          details: rawText.slice(0, 300),
        },
        { status: 502 },
      );
    }

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          error:
            typeof result.error === "string"
              ? result.error
              : "Google Sheets request failed.",
        },
        { status: response.status },
      );
    }

    return NextResponse.json({
      success: result.success !== false,
      resource,
      result,
    });
  } catch (error) {
    console.error("Google Sheets API error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Google Sheets backup failed.",
      },
      { status: 500 },
    );
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: "Google Sheets API route is online.",
  });
}
