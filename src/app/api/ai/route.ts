import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { error: "Please enter a question." },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is missing." },
        { status: 500 }
      );
    }

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [
              {
                text: "You are BusinessPilot AI, a helpful business assistant. Answer the user's exact question clearly and briefly. Do not advertise BusinessPilot AI unless the user asks about it.",
              },
            ],
          },
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 400,
          },
        } ),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini error:", data);

      return NextResponse.json(
        {
          error:
            data?.error?.message ||
            "Gemini request failed. Check your API key and quota.",
        },
        { status: 502 }
      );
    }

    const text =
      data?.candidates?.[0]?.content?.parts
        ?.map((part: { text?: string }) => part.text || "")
        .join("")
        .trim() || "";

    if (!text) {
      return NextResponse.json(
        { error: "Gemini returned an empty response." },
        { status: 502 }
      );
    }

    return NextResponse.json({ text });
  } catch (error) {
    console.error("AI route error:", error);

    return NextResponse.json(
      { error: "Something went wrong while contacting Gemini." },
      { status: 500 }
    );
  }
}
