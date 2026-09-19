import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json();

    if (typeof prompt !== "string" || !prompt.trim()) {
      return NextResponse.json(
        { error: "Please enter a question." },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "OPENROUTER_API_KEY is missing." },
        { status: 500 }
      );
    }

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://businesspilot-ai-live.vercel.app",
          "X-OpenRouter-Title": "BusinessPilot AI",
        },
        body: JSON.stringify({
          model: "openrouter/free",
          messages: [
            {
              role: "system",
              content:
                "You are BusinessPilot AI, a helpful assistant for business owners. Answer the user's exact question clearly and briefly. Do not create a sales proposal unless the user asks for one. Reply in English or Urdu according to the user's language.",
            },
            {
              role: "user",
              content: prompt.trim( ),
            },
          ],
          temperature: 0.7,
          max_tokens: 500,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("OpenRouter error:", data);

      return NextResponse.json(
        {
          error:
            data?.error?.message ||
            "OpenRouter request failed. Try again later.",
        },
        { status: 502 }
      );
    }

    const answer = data?.choices?.[0]?.message?.content?.trim();

    if (!answer) {
      return NextResponse.json(
        { error: "AI returned an empty answer." },
        { status: 502 }
      );
    }

    return NextResponse.json({ text: answer });
  } catch (error) {
    console.error("AI route error:", error);

    return NextResponse.json(
      { error: "AI service could not be reached." },
      { status: 500 }
    );
  }
}
