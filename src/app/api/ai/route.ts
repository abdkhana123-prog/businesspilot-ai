import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const prompt = body?.prompt;

    if (typeof prompt !== "string" || !prompt.trim()) {
      return NextResponse.json(
        { error: "Please enter a question." },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "OPENROUTER_API_KEY is missing in Vercel." },
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
                "You are a helpful business assistant. Answer the user's exact question directly. Do not write a marketing proposal unless requested. Reply in English or Urdu according to the user's question.",
            },
            {
              role: "user",
              content: prompt.trim( ),
            },
          ],
          temperature: 0.5,
          max_tokens: 600,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("OpenRouter API error:", data);

      return NextResponse.json(
        {
          error:
            data?.error?.message ||
            "OpenRouter request failed. Try again later.",
        },
        { status: 502 }
      );
    }

    const message = data?.choices?.[0]?.message;

    let answer = "";

    if (typeof message?.content === "string") {
      answer = message.content.trim();
    } else if (Array.isArray(message?.content)) {
      answer = message.content
        .map((item: { text?: string }) => item?.text || "")
        .join("")
        .trim();
    } else if (typeof data?.choices?.[0]?.text === "string") {
      answer = data.choices[0].text.trim();
    }

    if (!answer && typeof message?.reasoning === "string") {
      answer = message.reasoning.trim();
    }

    if (!answer) {
      console.error("OpenRouter empty response:", JSON.stringify(data));

      return NextResponse.json(
        {
          error:
            "The free AI model is temporarily busy. Please try the question again.",
        },
        { status: 503 }
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
