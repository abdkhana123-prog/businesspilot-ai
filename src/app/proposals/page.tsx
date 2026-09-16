"use client";

import { FormEvent, useState } from "react";

export default function ProposalsPage() {
  const [clientName, setClientName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [services, setServices] = useState("");
  const [budget, setBudget] = useState("");
  const [deadline, setDeadline] = useState("");
  const [notes, setNotes] = useState("");
  const [proposal, setProposal] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  // Quick Presets for Demo / Testing
  const loadTemplate = (type: "web" | "ai" | "marketing") => {
    if (type === "web") {
      setClientName("Acme Tech Solutions");
      setCompanyName("Acme Corp");
      setServices("Full-Stack Next.js Website Redesign, Mobile Responsiveness, SEO Optimization, and Speed Tuning.");
      setBudget("$3,500");
      setDeadline("3 Weeks");
      setNotes("Client wants dark mode design and modern animations.");
    } else if (type === "ai") {
      setClientName("Global Logistics Inc");
      setCompanyName("Global Logistics");
      setServices("AI Customer Support Chatbot Integration, Automated Lead Scoring, and CRM Workflow Automation.");
      setBudget("$5,000");
      setDeadline("1 Month");
      setNotes("Integrate with WhatsApp API and Google Sheets.");
    } else {
      setClientName("Apex Digital Media");
      setCompanyName("Apex Media");
      setServices("Monthly Social Media Management, Content Creation, Performance Marketing, and Weekly Analytics Reports.");
      setBudget("$1,200/month");
      setDeadline("Ongoing (6-Month Contract)");
      setNotes("Focus on B2B lead generation via LinkedIn.");
    }
  };

  async function generateProposal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!clientName.trim() || !services.trim()) {
      setProposal("Please enter the client name and services.");
      return;
    }

    setIsGenerating(true);
    setProposal("");

    const prompt = `Write an official, high-converting business proposal for a prospective client.

Client Name: ${clientName}
Company Name: ${companyName || "Not provided"}
Services Requested:
${services}

Budget: ${budget || "To be discussed"}
Expected Deadline: ${deadline || "To be discussed"}
Additional Notes:
${notes || "None"}

Please structure the proposal clearly with the following sections:
1. Executive Summary
2. Understanding Your Requirements
3. Scope of Work & Deliverables
4. Project Timeline & Milestones
5. Investment & Commercial Terms
6. Why Choose BusinessPilot AI
7. Next Steps & Approval

Use professional tone, bullet points for readability, plain text (no markdown headings with hash symbols), and clear spacing.`;

    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
        }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || "Proposal generation failed.");
      }

      setProposal(data.text || "No proposal was generated.");
    } catch (error) {
      setProposal(
        `BusinessProposal Overview for ${clientName}:

1. EXECUTIVE SUMMARY
Thank you for considering our team for your project. We are excited to propose a tailored solution designed to elevate ${companyName || clientName}'s operations and market position.

2. SCOPE OF WORK & DELIVERABLES
${services}

3. TIMELINE & INVESTMENT
- Estimated Completion: ${deadline || "To be confirmed"}
- Total Investment: ${budget || "To be discussed"}

4. NEXT STEPS
To move forward, please reply to confirm approval. We look forward to launching this partnership!`
      );
    } finally {
      setIsGenerating(false);
    }
  }

  async function copyProposal() {
    if (!proposal) return;
    await navigator.clipboard.writeText(proposal);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // Enterprise Feature: Printable High-Res Corporate PDF Export
  const handlePrintPDF = () => {
    if (!proposal) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Proposal - ${clientName || "Client"}</title>
          <style>
            body { font-family: 'Segoe UI', Helvetica, Arial, sans-serif; padding: 40px; color: #1e293b; line-height: 1.6; }
            .header { border-bottom: 3px solid #06b6d4; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center; }
            .logo { font-size: 26px; font-weight: 900; color: #0f172a; text-transform: uppercase; }
            .logo span { color: #06b6d4; }
            .badge { background: #ecfeff; color: #0891b2; font-size: 12px; font-weight: 700; padding: 6px 12px; border-radius: 20px; border: 1px solid #cffafe; }
            .meta { background: #f8fafc; padding: 20px; border-radius: 12px; margin-bottom: 30px; display: grid; grid-template-columns: 1fr 1fr; gap: 15px; border: 1px solid #e2e8f0; }
            .meta-item { font-size: 13px; }
            .meta-label { font-weight: 700; color: #64748b; text-transform: uppercase; font-size: 11px; }
            .content { font-size: 14px; white-space: pre-wrap; font-family: inherit; color: #334155; }
            .footer { margin-top: 50px; border-t: 1px solid #e2e8f0; pt: 20px; text-align: center; color: #94a3b8; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">Business<span>Pilot</span> AI</div>
            <div class="badge">CONFIDENTIAL PROPOSAL</div>
          </div>

          <div class="meta">
            <div class="meta-item">
              <div class="meta-label">Prepared For:</div>
              <strong>${clientName}</strong> ${companyName ? `(${companyName})` : ""}
            </div>
            <div class="meta-item">
              <div class="meta-label">Date Generated:</div>
              <strong>${new Date().toLocaleDateString()}</strong>
            </div>
            <div class="meta-item">
              <div class="meta-label">Proposed Budget:</div>
              <strong>${budget || "To be discussed"}</strong>
            </div>
            <div class="meta-item">
              <div class="meta-label">Estimated Timeline:</div>
              <strong>${deadline || "To be discussed"}</strong>
            </div>
          </div>

          <div class="content">${proposal}</div>

          <div class="footer">
            <p>Generated securely via BusinessPilot AI Sales Engine</p>
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 400);
  };

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-cyan-400">
              BusinessPilot AI
            </p>

            <h1 className="mt-2 text-4xl font-bold">
              AI Proposal Engine
            </h1>

            <p className="mt-2 text-slate-400">
              Generate, customize, and download high-converting client proposals in seconds.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <a
              href="/"
              className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:border-cyan-400 hover:text-cyan-300 transition"
            >
              Chat
            </a>

            <a
              href="/dashboard"
              className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:border-cyan-400 hover:text-cyan-300 transition"
            >
              Dashboard
            </a>
          </div>
        </header>

        {/* Quick Demo Templates Header */}
        <section className="mb-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
            ⚡ Quick Sample Templates (One-Click Fill)
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => loadTemplate("web")}
              className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-cyan-300 border border-cyan-500/20 hover:bg-cyan-500/10"
            >
              🌐 Web Development
            </button>
            <button
              type="button"
              onClick={() => loadTemplate("ai")}
              className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-violet-300 border border-violet-500/20 hover:bg-violet-500/10"
            >
              🤖 AI & Automation
            </button>
            <button
              type="button"
              onClick={() => loadTemplate("marketing")}
              className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-amber-300 border border-amber-500/20 hover:bg-amber-500/10"
            >
              📈 Retainer / Marketing
            </button>
          </div>
        </section>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Inputs Section */}
          <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
            <h2 className="mb-5 text-2xl font-bold">
              Proposal Inputs
            </h2>

            <form onSubmit={generateProposal} className="space-y-4">
              <input
                value={clientName}
                onChange={(event) => setClientName(event.target.value)}
                placeholder="Client name *"
                required
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-cyan-400"
              />

              <input
                value={companyName}
                onChange={(event) => setCompanyName(event.target.value)}
                placeholder="Company name"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-cyan-400"
              />

              <textarea
                value={services}
                onChange={(event) => setServices(event.target.value)}
                placeholder="Services required, for example: website, chatbot, SEO..."
                required
                rows={4}
                className="w-full resize-none rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-cyan-400"
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <input
                  value={budget}
                  onChange={(event) => setBudget(event.target.value)}
                  placeholder="Budget ($)"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-cyan-400"
                />

                <input
                  value={deadline}
                  onChange={(event) => setDeadline(event.target.value)}
                  placeholder="Deadline"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-cyan-400"
                />
              </div>

              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Additional notes or client requirements"
                rows={3}
                className="w-full resize-none rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none placeholder:text-slate-500 focus:border-cyan-400"
              />

              <button
                type="submit"
                disabled={isGenerating}
                className="w-full rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 px-5 py-3 font-bold text-slate-950 hover:from-cyan-300 hover:to-blue-400 disabled:cursor-not-allowed disabled:opacity-50 transition shadow-lg shadow-cyan-500/10"
              >
                {isGenerating
                  ? "✨ AI Writing Proposal..."
                  : "✨ Generate AI Proposal"}
              </button>
            </form>
          </section>

          {/* Proposal Preview Section */}
          <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl flex flex-col">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
              <h2 className="text-2xl font-bold">Generated Proposal</h2>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrintPDF}
                  disabled={!proposal}
                  className="rounded-lg bg-cyan-400/10 border border-cyan-400/40 px-3 py-2 text-xs font-bold text-cyan-300 hover:bg-cyan-400/20 disabled:opacity-40 transition"
                >
                  📥 Download PDF
                </button>

                <button
                  type="button"
                  onClick={copyProposal}
                  disabled={!proposal}
                  className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-bold text-slate-300 hover:border-slate-500 disabled:opacity-40 transition"
                >
                  {copied ? "✓ Copied" : "📋 Copy"}
                </button>
              </div>
            </div>

            <div className="flex-1 min-h-[480px] whitespace-pre-wrap rounded-xl border border-slate-800 bg-slate-950 p-5 leading-7 text-slate-300 text-sm overflow-y-auto">
              {proposal || (
                <div className="flex h-full flex-col items-center justify-center text-center text-slate-600">
                  <span className="text-3xl mb-2">📄</span>
                  <p className="font-semibold text-slate-400">No Proposal Generated Yet</p>
                  <p className="text-xs mt-1">Fill out the details on the left or click a sample template to start.</p>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}