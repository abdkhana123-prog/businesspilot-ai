"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { getMyWorkspaceId } from "@/lib/workspace";
import { openWhatsApp, buildLeadWhatsAppMessage } from "@/lib/whatsapp";

type LeadStage =
  | "New"
  | "Contacted"
  | "Qualified"
  | "Proposal Sent"
  | "Won"
  | "Lost";

type Lead = {
  id: string;
  workspace_id: string;
  name: string;
  email: string;
  phone: string | null;
  interest: string | null;
  status: string;
  stage: LeadStage;
  follow_up_date: string | null;
  deal_value: number;
  follow_up_notes: string | null;
  created_at: string;
  updated_at: string;
};

const stages: LeadStage[] = [
  "New",
  "Contacted",
  "Qualified",
  "Proposal Sent",
  "Won",
  "Lost",
];

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [stageFilter, setStageFilter] = useState("All");
  const [search, setSearch] = useState("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [interest, setInterest] = useState("");
  const [stage, setStage] = useState<LeadStage>("New");
  const [followUpDate, setFollowUpDate] = useState("");
  const [dealValue, setDealValue] = useState("");
  const [followUpNotes, setFollowUpNotes] = useState("");

  // AI States
  const [aiLoadingId, setAiLoadingId] = useState<string | null>(null);
  const [aiResult, setAiResult] = useState<{ id: string; text: string; type: string } | null>(null);

  useEffect(() => {
    loadLeads();
  }, []);

  async function loadLeads() {
    setLoading(true);
    setMessage("");

    try {
      const workspaceId = await getMyWorkspaceId();

      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .eq("workspace_id", workspaceId)
        .order("created_at", { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      setLeads((data || []) as Lead[]);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not load leads.",
      );
    } finally {
      setLoading(false);
    }
  }

  function clearForm() {
    setName("");
    setEmail("");
    setPhone("");
    setInterest("");
    setStage("New");
    setFollowUpDate("");
    setDealValue("");
    setFollowUpNotes("");
  }

  // ===================== SECURE AI API CALL =====================
  async function generateWithAI(lead: Lead, type: "followup" | "pitch") {
    setAiLoadingId(lead.id);
    setAiResult(null);
    setMessage("");

    const prompt =
      type === "followup"
        ? `Write a professional sales follow-up email/message for:
           Name: ${lead.name}
           Interest: ${lead.interest || 'our services'}
           Deal: $${lead.deal_value || 0}
           Notes: ${lead.follow_up_notes || 'None'}`
        : `Write a persuasive sales pitch for:
           Name: ${lead.name}
           Interest: ${lead.interest || 'business partnership'}
           Value: $${lead.deal_value || 0}`;

    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || "AI Server Error");
      }

      setAiResult({
        id: lead.id,
        text: data.text.trim(),
        type: type === "followup" ? "Follow-up Message" : "Sales Pitch",
      });
    } catch (error) {
      setMessage(`⚠️ Error: ${error instanceof Error ? error.message : "AI Failed"}`);
    } finally {
      setAiLoadingId(null);
    }
  }

  async function saveAIToNotes(leadId: string, text: string) {
    await updateLead(leadId, { follow_up_notes: text });
    setAiResult(null);
    setMessage("✨ AI text saved to follow-up notes.");
  }

  function copyAIText(text: string) {
    navigator.clipboard.writeText(text);
    setMessage("📋 Copied to clipboard!");
    setTimeout(() => setMessage(""), 2000);
  }
  // ===================== END AI =====================

  async function addLead(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!name.trim() || !email.trim()) {
      setMessage("Please enter the lead name and email.");
      return;
    }

    const numericDealValue = Number(dealValue) || 0;

    if (numericDealValue < 0) {
      setMessage("Deal value cannot be negative.");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const workspaceId = await getMyWorkspaceId();

      const { data: savedLead, error } = await supabase
        .from("leads")
        .insert({
          workspace_id: workspaceId,
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          interest: interest.trim(),
          status: stage === "Won" ? "Closed" : stage,
          stage,
          follow_up_date: followUpDate || null,
          deal_value: numericDealValue,
          follow_up_notes: followUpNotes.trim(),
        })
        .select()
        .single();

      if (error || !savedLead) {
        throw new Error(
          error?.message || "Could not save lead.",
        );
      }

      // Google Sheets Integration Maintained!
      let sheetMessage = "Lead saved in Supabase and Google Sheets.";

      try {
        const sheetResponse = await fetch("/api/sheets", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "save",
            resource: "Leads",
            record: {
              id: savedLead.id,
              name: savedLead.name,
              email: savedLead.email,
              phone: savedLead.phone || "",
              interest: savedLead.interest || "",
              status: savedLead.status,
              stage: savedLead.stage,
              followUpDate: savedLead.follow_up_date || "",
              dealValue: savedLead.deal_value,
              followUpNotes: savedLead.follow_up_notes || "",
              createdAt: savedLead.created_at,
            },
          }),
        });

        const sheetData = await sheetResponse.json();

        if (!sheetResponse.ok || !sheetData.success) {
          sheetMessage = "Lead saved in Supabase, but Google Sheets failed.";
        }
      } catch {
        sheetMessage = "Lead saved in Supabase, but Google Sheets failed.";
      }

      setLeads((currentLeads) => [
        savedLead as Lead,
        ...currentLeads,
      ]);

      clearForm();
      setMessage(sheetMessage);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not save lead.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function updateLead(
    id: string,
    updates: Partial<Lead>,
  ) {
    try {
      const workspaceId = await getMyWorkspaceId();

      const databaseUpdates = {
        ...updates,
        ...(updates.stage
          ? {
              status:
                updates.stage === "Won"
                  ? "Closed"
                  : updates.stage,
            }
          : {}),
      };

      const { data, error } = await supabase
        .from("leads")
        .update(databaseUpdates)
        .eq("id", id)
        .eq("workspace_id", workspaceId)
        .select()
        .single();

      if (error || !data) {
        throw new Error(
          error?.message || "Could not update lead.",
        );
      }

      setLeads((currentLeads) =>
        currentLeads.map((lead) =>
          lead.id === id ? (data as Lead) : lead,
        ),
      );

      setMessage("Lead updated successfully.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not update lead.",
      );
    }
  }

  async function deleteLead(id: string) {
    const confirmed = window.confirm("Delete this lead?");

    if (!confirmed) {
      return;
    }

    try {
      const workspaceId = await getMyWorkspaceId();

      const { error } = await supabase
        .from("leads")
        .delete()
        .eq("id", id)
        .eq("workspace_id", workspaceId);

      if (error) {
        throw new Error(error.message);
      }

      setLeads((currentLeads) =>
        currentLeads.filter((lead) => lead.id !== id),
      );

      setMessage("Lead deleted from the secure database.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not delete lead.",
      );
    }
  }

  const today = new Date().toISOString().slice(0, 10);

  function isOverdue(lead: Lead) {
    return (
      Boolean(lead.follow_up_date) &&
      lead.follow_up_date! < today &&
      lead.stage !== "Won" &&
      lead.stage !== "Lost"
    );
  }

  const filteredLeads = useMemo(() => {
    const searchText = search.toLowerCase();

    return leads.filter((lead) => {
      const matchesStage =
        stageFilter === "All" || lead.stage === stageFilter;

      const matchesSearch =
        lead.name.toLowerCase().includes(searchText) ||
        lead.email.toLowerCase().includes(searchText) ||
        (lead.phone || "").toLowerCase().includes(searchText) ||
        (lead.interest || "")
          .toLowerCase()
          .includes(searchText);

      return matchesStage && matchesSearch;
    });
  }, [leads, search, stageFilter]);

  const overdueCount = leads.filter(isOverdue).length;

  const pipelineValue = leads
    .filter((lead) => lead.stage !== "Lost")
    .reduce(
      (total, lead) =>
        total + Number(lead.deal_value || 0),
      0,
    );

  const wonDeals = leads.filter(
    (lead) => lead.stage === "Won",
  ).length;

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm uppercase tracking-widest text-cyan-400">
              BusinessPilot AI
            </p>

            <h1 className="mt-2 text-4xl font-bold">
              Sales Pipeline
            </h1>

            <p className="mt-2 text-slate-400">
              Track deals, follow-ups, and generate AI-powered sales messages.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <a
              href="/dashboard"
              className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:border-cyan-400"
            >
              Dashboard
            </a>

            <a
              href="/"
              className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:border-cyan-400"
            >
              Chat
            </a>
          </div>
        </header>

        <section className="mb-8 rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="mb-5 text-2xl font-bold">
            Add Sales Lead
          </h2>

          <form onSubmit={addLead} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Lead name *"
                required
                className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none placeholder:text-slate-500 focus:border-cyan-400"
              />

              <input
                type="email"
                value={email}
                onChange={(event) =>
                  setEmail(event.target.value)
                }
                placeholder="Email *"
                required
                className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none placeholder:text-slate-500 focus:border-cyan-400"
              />

              <input
                value={phone}
                onChange={(event) =>
                  setPhone(event.target.value)
                }
                placeholder="Phone (e.g. 923001234567)"
                className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none placeholder:text-slate-500 focus:border-cyan-400"
              />

              <input
                value={interest}
                onChange={(event) =>
                  setInterest(event.target.value)
                }
                placeholder="Interested in..."
                className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none placeholder:text-slate-500 focus:border-cyan-400"
              />

              <select
                value={stage}
                onChange={(event) =>
                  setStage(event.target.value as LeadStage)
                }
                className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400"
              >
                {stages.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>

              <input
                type="date"
                value={followUpDate}
                onChange={(event) =>
                  setFollowUpDate(event.target.value)
                }
                className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400"
              />

              <input
                type="number"
                min="0"
                step="0.01"
                value={dealValue}
                onChange={(event) =>
                  setDealValue(event.target.value)
                }
                placeholder="Expected deal value"
                className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none placeholder:text-slate-500 focus:border-cyan-400"
              />

              <textarea
                value={followUpNotes}
                onChange={(event) =>
                  setFollowUpNotes(event.target.value)
                }
                placeholder="Follow-up notes"
                rows={2}
                className="resize-none rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none placeholder:text-slate-500 focus:border-cyan-400"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-xl bg-cyan-400 px-5 py-3 font-bold text-slate-950 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Lead"}
            </button>
          </form>

          {message && (
            <p className="mt-4 rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-4 text-cyan-300">
              {message}
            </p>
          )}
        </section>

        <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard
            title="Total Leads"
            value={leads.length.toString()}
          />

          <SummaryCard
            title="Active Pipeline"
            value={`$${pipelineValue.toFixed(2)}`}
          />

          <SummaryCard
            title="Overdue Follow-ups"
            value={overdueCount.toString()}
            danger={overdueCount > 0}
          />

          <SummaryCard
            title="Won Deals"
            value={wonDeals.toString()}
          />
        </section>

        <section className="mb-8 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {stages.map((item) => {
            const count = leads.filter(
              (lead) => lead.stage === item,
            ).length;

            return (
              <div
                key={item}
                className="rounded-xl border border-slate-800 bg-slate-900 p-4"
              >
                <p className="text-xs text-slate-400">{item}</p>

                <p className="mt-2 text-2xl font-bold text-cyan-300">
                  {count}
                </p>
              </div>
            );
          })}
        </section>

        <section className="mb-6 flex flex-col gap-3 sm:flex-row">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name, email, phone, or interest..."
            className="flex-1 rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 outline-none placeholder:text-slate-500 focus:border-cyan-400"
          />

          <select
            value={stageFilter}
            onChange={(event) =>
              setStageFilter(event.target.value)
            }
            className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 outline-none focus:border-cyan-400"
          >
            <option value="All">All stages</option>

            {stages.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
          <div className="border-b border-slate-800 px-6 py-5">
            <h2 className="text-2xl font-bold">
              Lead Follow-ups + AI Assistant
            </h2>
          </div>

          {loading ? (
            <p className="p-8 text-slate-400">
              Loading secure sales pipeline...
            </p>
          ) : filteredLeads.length === 0 ? (
            <p className="p-8 text-slate-400">
              No leads found.
            </p>
          ) : (
            <div className="divide-y divide-slate-800">
              {filteredLeads.map((lead) => (
                <article key={lead.id} className="px-6 py-5">
                  <div className="flex flex-col justify-between gap-5 lg:flex-row">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-xl font-bold">
                          {lead.name}
                        </h3>

                        <span className="rounded-full bg-cyan-500/10 px-3 py-1 text-xs text-cyan-300">
                          {lead.stage}
                        </span>

                        {isOverdue(lead) && (
                          <span className="rounded-full bg-red-500/10 px-3 py-1 text-xs text-red-300">
                            Follow-up overdue
                          </span>
                        )}
                      </div>

                      <p className="mt-2 text-sm text-slate-400">
                        {lead.email}
                        {lead.phone ? ` • ${lead.phone}` : ""}
                      </p>

                      <p className="mt-1 text-sm text-cyan-300">
                        {lead.interest || "No interest specified"}
                      </p>

                      <p className="mt-2 text-sm text-emerald-300">
                        Deal value: $
                        {Number(lead.deal_value || 0).toFixed(2)}
                      </p>

                      {lead.follow_up_notes && (
                        <p className="mt-2 whitespace-pre-wrap text-sm text-slate-400">
                          Notes: {lead.follow_up_notes}
                        </p>
                      )}

                      {/* AI & WHATSAPP ACTION BUTTONS */}
                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={aiLoadingId === lead.id}
                          onClick={() => generateWithAI(lead, "followup")}
                          className="rounded-lg border border-violet-500/40 bg-violet-500/10 px-3 py-2 text-xs font-bold text-violet-300 hover:bg-violet-500/20 disabled:opacity-50"
                        >
                          {aiLoadingId === lead.id
                            ? "✨ Thinking..."
                            : "✨ AI Follow-up"}
                        </button>

                        <button
                          type="button"
                          disabled={aiLoadingId === lead.id}
                          onClick={() => generateWithAI(lead, "pitch")}
                          className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs font-bold text-amber-300 hover:bg-amber-500/20 disabled:opacity-50"
                        >
                          {aiLoadingId === lead.id
                            ? "✨ Thinking..."
                            : "✨ AI Pitch"}
                        </button>

                        <button
                          type="button"
                          onClick={() => openWhatsApp(lead.phone, buildLeadWhatsAppMessage(lead))}
                          className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-300 hover:bg-emerald-500/20"
                        >
                          📲 WhatsApp Msg
                        </button>
                      </div>

                      {/* AI RESULT BOX */}
                      {aiResult && aiResult.id === lead.id && (
                        <div className="mt-4 rounded-xl border border-violet-500/30 bg-violet-500/10 p-4">
                          <div className="mb-2 flex items-center justify-between gap-3">
                            <p className="text-xs font-bold uppercase tracking-wider text-violet-300">
                              {aiResult.type}
                            </p>
                            <button
                              type="button"
                              onClick={() => setAiResult(null)}
                              className="text-xs text-slate-400 hover:text-white"
                            >
                              ✕ Close
                            </button>
                          </div>

                          <p className="whitespace-pre-wrap text-sm leading-6 text-slate-200">
                            {aiResult.text}
                          </p>

                          <div className="mt-4 flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => copyAIText(aiResult.text)}
                              className="rounded-lg bg-white/10 px-3 py-2 text-xs font-bold text-white hover:bg-white/20"
                            >
                              📋 Copy
                            </button>

                            <button
                              type="button"
                              onClick={() => saveAIToNotes(lead.id, aiResult.text)}
                              className="rounded-lg bg-cyan-400 px-3 py-2 text-xs font-bold text-slate-950 hover:bg-cyan-300"
                            >
                              💾 Save to Notes
                            </button>

                            <button
                              type="button"
                              onClick={() => openWhatsApp(lead.phone, aiResult.text)}
                              className="rounded-lg bg-emerald-500 px-3 py-2 text-xs font-bold text-slate-950 hover:bg-emerald-400"
                            >
                              📲 Send on WhatsApp
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[430px]">
                      <select
                        value={lead.stage}
                        onChange={(event) =>
                          updateLead(lead.id, {
                            stage: event.target.value as LeadStage,
                          })
                        }
                        className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-cyan-400"
                      >
                        {stages.map((item) => (
                          <option key={item} value={item}>
                            {item}
                          </option>
                        ))}
                      </select>

                      <input
                        type="date"
                        value={lead.follow_up_date || ""}
                        onChange={(event) =>
                          updateLead(lead.id, {
                            follow_up_date:
                              event.target.value || null,
                          })
                        }
                        className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-cyan-400"
                      />

                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={lead.deal_value || 0}
                        onChange={(event) => {
                          const value = Number(
                            event.target.value,
                          );

                          setLeads((currentLeads) =>
                            currentLeads.map((item) =>
                              item.id === lead.id
                                ? {
                                    ...item,
                                    deal_value: value,
                                  }
                                : item,
                            ),
                          );
                        }}
                        onBlur={(event) =>
                          updateLead(lead.id, {
                            deal_value:
                              Number(event.target.value) || 0,
                          })
                        }
                        className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-cyan-400"
                      />

                      <button
                        type="button"
                        onClick={() => deleteLead(lead.id)}
                        className="rounded-lg border border-red-500/40 px-3 py-2 text-sm text-red-300 hover:bg-red-500/10"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  <p className="mt-4 text-xs text-slate-500">
                    Follow-up:{" "}
                    {lead.follow_up_date || "Not scheduled"}
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function SummaryCard({
  title,
  value,
  danger = false,
}: {
  title: string;
  value: string;
  danger?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border bg-slate-900 p-5 ${
        danger ? "border-red-500/50" : "border-slate-800"
      }`}
    >
      <p className="text-sm text-slate-400">{title}</p>

      <p
        className={`mt-2 text-3xl font-bold ${
          danger ? "text-red-300" : "text-cyan-300"
        }`}
      >
        {value}
      </p>
    </div>
  );
}