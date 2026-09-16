"use client";

import { ChangeEvent, FormEvent, useState } from "react";

export default function DocumentsPage() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [fileName, setFileName] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isThinking, setIsThinking] = useState(false);

  async function handlePdfUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (file.type !== "application/pdf") {
      setAnswer("Please select a PDF file.");
      return;
    }

    setIsUploading(true);
    setAnswer("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/pdf", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "PDF upload failed.");
      }

      setFileName(data.fileName);
      setTitle(data.fileName.replace(/\.pdf$/i, ""));
      setContent(data.text || "");

      setAnswer(
        `PDF loaded successfully: ${data.fileName}. Review the text, then click Save Document.`,
      );
    } catch (error) {
      setAnswer(
        error instanceof Error
          ? error.message
          : "Could not read this PDF.",
      );
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  }

  function saveDocument(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!title.trim() || !content.trim()) {
      setAnswer("Please upload a PDF or enter document text first.");
      return;
    }

    const oldDocuments = localStorage.getItem("businesspilot-documents");
    const documents = oldDocuments ? JSON.parse(oldDocuments) : [];

    const newDocument = {
      id: Date.now(),
      title: title.trim(),
      content: content.trim(),
      createdAt: new Date().toLocaleDateString(),
    };

    localStorage.setItem(
      "businesspilot-documents",
      JSON.stringify([newDocument, ...documents]),
    );

    setAnswer(`Document saved successfully: ${newDocument.title}`);
  }

  async function askQuestion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!question.trim()) {
      return;
    }

    if (!content.trim()) {
      setAnswer("Please upload and save a document first.");
      return;
    }

    setIsThinking(true);
    setAnswer("");

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: `Answer only from this document.

Document title:
${title}

Document content:
${content}

Question:
${question}

If the answer is not present in the document, say:
"I could not find that information in the document."`,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "The AI could not answer.");
      }

      setAnswer(data.reply);
    } catch (error) {
      setAnswer(
        error instanceof Error
          ? error.message
          : "Could not connect to the local AI.",
      );
    } finally {
      setIsThinking(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-widest text-cyan-400">
              BusinessPilot AI
            </p>

            <h1 className="mt-2 text-4xl font-bold">
              Document Assistant
            </h1>

            <p className="mt-2 text-slate-400">
              Upload a PDF and ask questions about its content.
            </p>
          </div>

          <a
            href="/"
            className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:border-cyan-400"
          >
            Back to Chat
          </a>
        </header>

        <div className="grid gap-8 lg:grid-cols-2">
          <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="mb-5 text-2xl font-bold">
              Upload a PDF
            </h2>

            <label className="mb-5 block cursor-pointer rounded-xl border border-dashed border-cyan-500/50 bg-cyan-500/5 p-6 text-center transition hover:bg-cyan-500/10">
              <span className="font-semibold text-cyan-300">
                {isUploading ? "Reading PDF..." : "Choose a PDF file"}
              </span>

              <span className="mt-2 block text-sm text-slate-400">
                Select a text-based PDF from your computer.
              </span>

              <input
                type="file"
                accept="application/pdf,.pdf"
                onChange={handlePdfUpload}
                disabled={isUploading}
                className="hidden"
              />
            </label>

            {fileName && (
              <p className="mb-4 rounded-lg bg-slate-950 p-3 text-sm text-emerald-300">
                Loaded file: {fileName}
              </p>
            )}

            <form onSubmit={saveDocument} className="space-y-4">
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Document title"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 p-4 outline-none focus:border-cyan-400"
              />

              <textarea
                value={content}
                onChange={(event) => setContent(event.target.value)}
                placeholder="PDF text will appear here..."
                rows={12}
                className="w-full resize-none rounded-xl border border-slate-700 bg-slate-950 p-4 outline-none focus:border-cyan-400"
              />

              <button
                type="submit"
                className="w-full rounded-xl bg-cyan-400 px-5 py-3 font-bold text-slate-950 hover:bg-cyan-300"
              >
                Save Document
              </button>
            </form>
          </section>

          <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="mb-5 text-2xl font-bold">
              Ask About the PDF
            </h2>

            <form onSubmit={askQuestion} className="space-y-4">
              <textarea
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                placeholder="Example: What is the refund period?"
                rows={5}
                className="w-full resize-none rounded-xl border border-slate-700 bg-slate-950 p-4 outline-none focus:border-cyan-400"
              />

              <button
                type="submit"
                disabled={isThinking || !question.trim()}
                className="w-full rounded-xl bg-cyan-400 px-5 py-3 font-bold text-slate-950 hover:bg-cyan-300 disabled:opacity-50"
              >
                {isThinking ? "Thinking..." : "Ask BusinessPilot"}
              </button>
            </form>

            <div className="mt-6 min-h-40 rounded-xl border border-slate-700 bg-slate-950 p-5">
              <p className="mb-2 text-sm font-semibold text-cyan-400">
                Status / AI Answer
              </p>

              <p className="whitespace-pre-wrap leading-7 text-slate-300">
                {answer || "Upload a PDF to begin."}
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

