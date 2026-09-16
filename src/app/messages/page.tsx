"use client";

import { FormEvent, useState } from "react";

type MessageType =
  | "Customer Follow-up"
  | "Professional Email"
  | "Complaint Reply"
  | "WhatsApp Message";

type Tone = "Professional" | "Friendly" | "Urgent";

export default function MessagesPage() {
  const [messageType, setMessageType] =
    useState<MessageType>("Customer Follow-up");

  const [tone, setTone] = useState<Tone>("Professional");
  const [customerName, setCustomerName] = useState("");
  const [details, setDetails] = useState("");
  const [result, setResult] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  async function generateMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!details.trim()) {
      setResult("Please describe what you want to say.");
      return;
    }

    setIsGenerating(true);
    setResult("");

    const prompt = `Create a ${messageType}.

Tone: ${tone}
Customer name: ${customerName || "Customer"}
Situation or details:
${details}

Rules:
- Write only the final message.
- Do not add explanations before or after the message.
- Keep it clear and natural.
- Do not claim that an action was completed unless the details confirm it.`;

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: prompt,
        }),
      });

      const responseText = await response.text();

      let data: { reply?: string; error?: string };

      try {
        data = JSON.parse(responseText);
      } catch {
        throw new Error("The server returned an invalid response.");
      }

      if (!response.ok) {
        throw new Error(data.error || "Message generation failed.");
      }

      setResult(data.reply || "No message was generated.");
    } catch (error) {
      setResult(
        error instanceof Error
          ? error.message
          : "Could not connect to the local AI.",
      );
    } finally {
      setIsGenerating(false);
    }
  }

  async function copyMessage() {
    if (!result) {
      return;
    }

    await navigator.clipboard.writeText(result);
    alert("Message copied to clipboard.");
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-cyan-400">
              BusinessPilot AI
            </p>

            <h1 className="mt-2 text-4xl font-bold">Message Studio</h1>

            <p className="mt-2 text-slate-400">
              Create professional customer messages with your local AI.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <a
              href="/"
              className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:border-cyan-400 hover:text-cyan-300"
            >
              Chat
            </a>

            <a
              href="/dashboard"
              className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:border-cyan-400 hover:text-cyan-300"
            >
              Dashboard
            </a>
          </div>
        </header>

        <div className="grid gap-8 lg:grid-cols-2">
          <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="mb-5 text-2xl font-bold">Message Details</h2>

            <form onSubmit={generateMessage} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm text-slate-400">
                  Message type
                </label>

                <select
                  value={messageType}
                  onChange={(event) =>
                    setMessageType(event.target.value as MessageType)
                  }
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400"
                >
                  <option>Customer Follow-up</option>
                  <option>Professional Email</option>
                  <option>Complaint Reply</option>
                  <option>WhatsApp Message</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm text-slate-400">
                  Tone
                </label>

                <select
                  value={tone}
                  onChange={(event) =>
                    setTone(event.target.value as Tone)
                  }
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-cyan-400"
                >
                  <option>Professional</option>
                  <option>Friendly</option>
                  <option>Urgent</option>
                </select>
              </div>

              <input
                value={customerName}
                onChange={(event) => setCustomerName(event.target.value)}
                placeholder="Customer name"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-cyan-400"
              />

              <textarea
                value={details}
                onChange={(event) => setDetails(event.target.value)}
                placeholder="Example: The customer asked about our website package and has not replied for three days."
                rows={8}
                className="w-full resize-none rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-cyan-400"
              />

              <button
                type="submit"
                disabled={isGenerating}
                className="w-full rounded-xl bg-cyan-400 px-5 py-3 font-bold text-slate-950 hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isGenerating ? "Generating..." : "Generate Message"}
              </button>
            </form>
          </section>

          <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <div className="mb-5 flex items-center justify-between gap-4">
              <h2 className="text-2xl font-bold">Generated Message</h2>

              <button
                type="button"
                onClick={copyMessage}
                disabled={!result}
                className="rounded-lg border border-cyan-500/40 px-3 py-2 text-sm text-cyan-300 hover:bg-cyan-500/10 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Copy
              </button>
            </div>

            <div className="min-h-80 whitespace-pre-wrap rounded-xl border border-slate-700 bg-slate-950 p-5 leading-7 text-slate-300">
              {result ||
                "Your generated customer message will appear here."}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
