import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const prompt = body?.prompt;

    if (typeof prompt !== "string" || prompt.trim().length === 0) {
      return NextResponse.json(
        { error: "Please enter a question." },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is missing in environment variables." },
        { status: 500 }
      );
    }

    const geminiResponse = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent",
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
                text:
                  "You are BusinessPilot AI, a helpful assistant for business owners. " +
                  "Answer the user's exact question directly, clearly, and briefly. " +
                  "You can answer general questions, explain business terms, and help with invoices, sales, customers, tasks, and appointments. " +
                  "Do not write a sales proposal unless the user specifically asks for one. " +
                  "You may answer in English or Urdu according to the user's language.",
              },
            ],
          },
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: prompt.trim( ),
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 500,
          },
        }),
      }
    );

    const data = await geminiResponse.json();

    if (!geminiResponse.ok) {
      console.error("Gemini API error:", data);

      return NextResponse.json(
        {
          error:
            data?.error?.message ||
            "Gemini request failed. Check the model name, API key, and quota.",
        },
        { status: 502 }
      );
    }

    const answer = data?.candidates?.[0]?.content?.parts
      ?.map((part: { text?: string }) => part.text || "")
      .join("")
      .trim();

    if (!answer) {
      return NextResponse.json(
        { error: "Gemini returned an empty answer." },
        { status: 502 }
      );
    }

    return NextResponse.json({ text: answer });
  } catch (error) {
    console.error("Chat API error:", error);

    return NextResponse.json(
      { error: "The AI service could not be reached." },
      { status: 500 }
    );
  }
}
