"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { getMyWorkspaceId } from "@/lib/workspace";
import {
  openWhatsApp,
  buildInvoiceWhatsAppMessage,
} from "@/lib/whatsapp";

type Invoice = {
  id: string;
  invoice_number: string;
  customer_name: string;
  customer_email: string | null;
  description: string;
  quantity: number;
  price: number;
  tax: number;
  discount: number;
  payment_status: string;
  paid_amount: number;
  created_at: string;
};

type InvoiceForm = {
  customerName: string;
  customerEmail: string;
  description: string;
  quantity: string;
  price: string;
  tax: string;
  discount: string;
};

const emptyForm: InvoiceForm = {
  customerName: "",
  customerEmail: "",
  description: "",
  quantity: "1",
  price: "",
  tax: "0",
  discount: "0",
};

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [form, setForm] = useState<InvoiceForm>(emptyForm);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadInvoices();
  }, []);

  async function loadInvoices() {
    setLoading(true);
    setError("");

    try {
      const workspaceId = await getMyWorkspaceId();

      const { data, error: loadError } = await supabase
        .from("invoices")
        .select(
          "id, invoice_number, customer_name, customer_email, description, quantity, price, tax, discount, payment_status, paid_amount, created_at",
        )
        .eq("workspace_id", workspaceId)
        .order("created_at", { ascending: false });

      if (loadError) {
        throw new Error(loadError.message);
      }

      setInvoices((data || []) as Invoice[]);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Invoices could not be loaded.",
      );
    } finally {
      setLoading(false);
    }
  }

  function calculateTotal() {
    const quantity = Number(form.quantity || 0);
    const price = Number(form.price || 0);
    const tax = Number(form.tax || 0);
    const discount = Number(form.discount || 0);

    const subtotal = quantity * price;

    return (
      subtotal + (subtotal * tax) / 100 - (subtotal * discount) / 100
    );
  }

  async function saveToSheets(invoice: Invoice, total: number) {
    try {
      const response = await fetch("/api/sheets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "save",
          resource: "Invoices",
          record: {
            id: invoice.id,
            invoiceNumber: invoice.invoice_number,
            customerName: invoice.customer_name,
            customerEmail: invoice.customer_email || "",
            description: invoice.description,
            quantity: invoice.quantity,
            price: invoice.price,
            tax: invoice.tax,
            discount: invoice.discount,
            paymentStatus: invoice.payment_status,
            paidAmount: invoice.paid_amount,
            total,
            createdAt: invoice.created_at,
          },
        }),
      });

      const result = await response.json();
      return response.ok && result.success === true;
    } catch {
      return false;
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (
      !form.customerName.trim() ||
      !form.customerEmail.trim() ||
      !form.description.trim() ||
      !form.price
    ) {
      setError(
        "Customer name, email, description, and price are required.",
      );
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const workspaceId = await getMyWorkspaceId();
      const invoiceNumber = `INV-${Date.now().toString().slice(-8)}`;

      const { data, error: insertError } = await supabase
        .from("invoices")
        .insert({
          workspace_id: workspaceId,
          invoice_number: invoiceNumber,
          customer_name: form.customerName.trim(),
          customer_email: form.customerEmail.trim(),
          description: form.description.trim(),
          quantity: Number(form.quantity || 1),
          price: Number(form.price || 0),
          tax: Number(form.tax || 0),
          discount: Number(form.discount || 0),
          payment_status: "Unpaid",
          paid_amount: 0,
        })
        .select()
        .single();

      if (insertError || !data) {
        throw new Error(
          insertError?.message || "Invoice could not be saved.",
        );
      }

      const invoice = data as Invoice;
      const total = calculateTotal();
      const backupWorked = await saveToSheets(invoice, total);

      setInvoices((current) => [invoice, ...current]);
      setForm(emptyForm);
      setShowForm(false);

      setMessage(
        backupWorked
          ? "Invoice saved securely and backed up to Google Sheets."
          : "Invoice saved in Supabase, but Google Sheets backup failed.",
      );
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Invoice could not be saved.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function markAsPaid(invoiceId: string) {
    setError("");
    setMessage("");

    const current = invoices.find((invoice) => invoice.id === invoiceId);
    const paidTotal = current ? getInvoiceTotal(current) : 0;

    const { data, error: updateError } = await supabase
      .from("invoices")
      .update({
        payment_status: "Paid",
        paid_amount: paidTotal,
      })
      .eq("id", invoiceId)
      .select()
      .single();

    if (updateError || !data) {
      setError(
        updateError?.message || "Invoice could not be updated.",
      );
      return;
    }

    setInvoices((current) =>
      current.map((invoice) =>
        invoice.id === invoiceId ? (data as Invoice) : invoice,
      ),
    );

    setMessage("Invoice marked as paid.");
  }

  function exportToCSV() {
    if (filteredInvoices.length === 0) return;

    const headers = [
      "Invoice Number",
      "Customer Name",
      "Customer Email",
      "Description",
      "Quantity",
      "Price",
      "Tax %",
      "Discount %",
      "Total Amount",
      "Status",
      "Created Date",
    ];

    const rows = filteredInvoices.map((inv) => [
      inv.invoice_number,
      `"${inv.customer_name}"`,
      inv.customer_email || "",
      `"${inv.description}"`,
      inv.quantity,
      inv.price,
      inv.tax,
      inv.discount,
      getInvoiceTotal(inv).toFixed(2),
      inv.payment_status,
      new Date(inv.created_at).toLocaleDateString(),
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `Invoices_Export_${new Date().toISOString().slice(0, 10)}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const filteredInvoices = useMemo(() => {
    const query = search.trim().toLowerCase();

    return invoices.filter((invoice) => {
      const matchesSearch =
        !query ||
        invoice.invoice_number.toLowerCase().includes(query) ||
        invoice.customer_name.toLowerCase().includes(query) ||
        invoice.customer_email?.toLowerCase().includes(query);

      const matchesFilter =
        filter === "All" || invoice.payment_status === filter;

      return matchesSearch && matchesFilter;
    });
  }, [invoices, search, filter]);

  const totalBilled = invoices.reduce(
    (total, invoice) => total + getInvoiceTotal(invoice),
    0,
  );

  const totalPaid = invoices
    .filter(
      (invoice) => invoice.payment_status.toLowerCase() === "paid",
    )
    .reduce(
      (total, invoice) => total + getInvoiceTotal(invoice),
      0,
    );

  const totalOutstanding = totalBilled - totalPaid;

  return (
    <main className="min-h-screen bg-[#050816] px-4 py-6 text-white sm:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-300 via-orange-500 to-rose-600 text-xl font-black text-white shadow-lg shadow-orange-500/20">
                $
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-[0.25em] text-amber-300">
                  Revenue workspace
                </p>

                <h1 className="mt-1 text-3xl font-black tracking-tight sm:text-4xl">
                  Invoices
                </h1>
              </div>
            </div>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-500">
              Create professional invoices, track payments, send WhatsApp
              reminders, generate PDF records, and keep your cash flow visible.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={exportToCSV}
              disabled={filteredInvoices.length === 0}
              className="rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm font-bold text-slate-300 transition hover:bg-white/10 disabled:opacity-40"
            >
              📥 Export CSV
            </button>

            <button
              type="button"
              onClick={() => {
                setShowForm((current) => !current);
                setError("");
                setMessage("");
              }}
              className="rounded-xl bg-gradient-to-r from-amber-300 to-orange-500 px-5 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-orange-500/10 transition hover:from-amber-200 hover:to-orange-400"
            >
              {showForm ? "Close form" : "+ Create invoice"}
            </button>
          </div>
        </header>

        <section className="mt-8 grid gap-4 sm:grid-cols-3">
          <MoneyCard
            label="Total billed"
            value={totalBilled}
            icon="↗"
            color="amber"
          />

          <MoneyCard
            label="Collected"
            value={totalPaid}
            icon="✓"
            color="emerald"
          />

          <MoneyCard
            label="Outstanding"
            value={totalOutstanding}
            icon="!"
            color="rose"
          />
        </section>

        {message && (
          <div className="mt-6 rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.08] p-4 text-sm text-emerald-200">
            {message}
          </div>
        )}

        {error && (
          <div className="mt-6 rounded-2xl border border-rose-400/20 bg-rose-400/[0.08] p-4 text-sm text-rose-200">
            <p className="font-semibold">Something went wrong</p>
            <p className="mt-1 text-xs text-rose-300/80">{error}</p>
          </div>
        )}

        {showForm && (
          <section className="mt-6 rounded-3xl border border-amber-400/20 bg-gradient-to-br from-amber-400/[0.1] to-white/[0.04] p-6 shadow-2xl shadow-black/20 sm:p-8">
            <div className="mb-6">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-300">
                New billing record
              </p>

              <h2 className="mt-2 text-2xl font-black">Create an invoice</h2>
            </div>

            <form
              onSubmit={handleSubmit}
              className="grid gap-4 md:grid-cols-2"
            >
              <Field
                label="Customer name"
                value={form.customerName}
                placeholder="e.g. Sara Khan"
                onChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    customerName: value,
                  }))
                }
              />

              <Field
                label="Customer email"
                type="email"
                value={form.customerEmail}
                placeholder="sara@example.com"
                onChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    customerEmail: value,
                  }))
                }
              />

              <label className="block md:col-span-2">
                <span className="mb-2 block text-xs font-semibold text-slate-400">
                  Service or description
                </span>

                <input
                  value={form.description}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  placeholder="Website design services"
                  className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-amber-400/50"
                />
              </label>

              <Field
                label="Quantity"
                type="number"
                value={form.quantity}
                placeholder="1"
                onChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    quantity: value,
                  }))
                }
              />

              <Field
                label="Price"
                type="number"
                value={form.price}
                placeholder="500"
                onChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    price: value,
                  }))
                }
              />

              <Field
                label="Tax percentage"
                type="number"
                value={form.tax}
                placeholder="0"
                onChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    tax: value,
                  }))
                }
              />

              <Field
                label="Discount percentage"
                type="number"
                value={form.discount}
                placeholder="0"
                onChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    discount: value,
                  }))
                }
              />

              <div className="rounded-2xl border border-amber-300/20 bg-amber-300/[0.08] p-4 md:col-span-2">
                <p className="text-xs text-slate-500">
                  Estimated invoice total
                </p>

                <p className="mt-2 text-3xl font-black text-amber-200">
                  ${calculateTotal().toFixed(2)}
                </p>
              </div>

              <div className="flex gap-3 md:col-span-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-amber-300 px-5 py-3 text-sm font-bold text-slate-950 disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save invoice"}
                </button>

                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="rounded-xl border border-white/10 px-5 py-3 text-sm text-slate-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </section>
        )}

        <section className="mt-6 rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/20 sm:p-7">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
                Billing records
              </p>

              <h2 className="mt-2 text-2xl font-black">All invoices</h2>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search invoices..."
                className="rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-amber-400/50"
              />

              <select
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
                className="rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-slate-300 outline-none focus:border-amber-400/50"
              >
                <option className="bg-slate-900">All</option>
                <option className="bg-slate-900">Paid</option>
                <option className="bg-slate-900">Unpaid</option>
              </select>
            </div>
          </div>

          <div className="mt-6">
            {loading ? (
              <InvoiceSkeleton />
            ) : filteredInvoices.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 p-10 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-400/10 text-2xl text-amber-300">
                  $
                </div>

                <h3 className="mt-5 font-bold text-slate-200">
                  No invoices found
                </h3>

                <p className="mt-2 text-sm text-slate-600">
                  Create an invoice to start tracking revenue.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredInvoices.map((invoice) => (
                  <InvoiceCard
                    key={invoice.id}
                    invoice={invoice}
                    onMarkPaid={() => markAsPaid(invoice.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function MoneyCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: number;
  icon: string;
  color: "amber" | "emerald" | "rose";
}) {
  const colors = {
    amber: "bg-amber-400/10 text-amber-300",
    emerald: "bg-emerald-400/10 text-emerald-300",
    rose: "bg-rose-400/10 text-rose-300",
  };

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
      <div
        className={`flex h-11 w-11 items-center justify-center rounded-2xl text-lg ${colors[color]}`}
      >
        {icon}
      </div>

      <p className="mt-5 text-xs font-semibold text-slate-500">{label}</p>

      <p className="mt-2 text-3xl font-black">
        ${value.toLocaleString()}
      </p>
    </div>
  );
}

function InvoiceCard({
  invoice,
  onMarkPaid,
}: {
  invoice: Invoice;
  onMarkPaid: () => void;
}) {
  const total = getInvoiceTotal(invoice);
  const isPaid = invoice.payment_status.toLowerCase() === "paid";
  const [copied, setCopied] = useState(false);
  const [showPhoneInput, setShowPhoneInput] = useState(false);
  const [waPhone, setWaPhone] = useState("");

  const handlePrintPDF = () => {
    const subtotal =
      Number(invoice.quantity || 1) * Number(invoice.price || 0);
    const taxAmt = (subtotal * Number(invoice.tax || 0)) / 100;
    const discountAmt =
      (subtotal * Number(invoice.discount || 0)) / 100;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice #${invoice.invoice_number}</title>
          <style>
            body { font-family: 'Helvetica Neue', Arial, sans-serif; padding: 40px; color: #333; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #ea580c; padding-bottom: 20px; }
            .logo { font-size: 26px; font-weight: 900; color: #ea580c; }
            .status { font-weight: bold; text-transform: uppercase; padding: 6px 12px; border-radius: 4px; display: inline-block; }
            .status-paid { background: #dcfce7; color: #15803d; }
            .status-unpaid { background: #ffe4e6; color: #b91c1c; }
            .details { margin-top: 30px; display: flex; justify-content: space-between; }
            .table { width: 100%; border-collapse: collapse; margin-top: 30px; }
            .table th { background: #f8fafc; text-align: left; padding: 12px; border-bottom: 2px solid #e2e8f0; font-size: 13px; text-transform: uppercase; }
            .table td { padding: 12px; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
            .totals { margin-top: 20px; text-align: right; font-size: 14px; }
            .grand-total { font-size: 22px; font-weight: bold; color: #ea580c; margin-top: 10px; }
            .footer { margin-top: 50px; text-align: center; color: #94a3b8; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="logo">BusinessPilot AI</div>
              <p style="color:#64748b; margin-top:5px; font-size:14px;">Official Invoice</p>
            </div>
            <div style="text-align: right;">
              <h2 style="margin:0; font-size:20px;">#${invoice.invoice_number}</h2>
              <p style="color:#64748b; font-size:13px; margin:5px 0 10px 0;">Date: ${new Date(invoice.created_at).toLocaleDateString()}</p>
              <span class="status ${isPaid ? "status-paid" : "status-unpaid"}">${invoice.payment_status}</span>
            </div>
          </div>

          <div class="details">
            <div>
              <p style="color:#94a3b8; font-size:11px; font-weight:bold; text-transform:uppercase;">Billed To:</p>
              <h3 style="margin:5px 0 2px 0;">${invoice.customer_name}</h3>
              <p style="color:#64748b; margin:0; font-size:13px;">${invoice.customer_email || "No Email"}</p>
            </div>
          </div>

          <table class="table">
            <thead>
              <tr>
                <th>Description</th>
                <th style="text-align:center;">Qty</th>
                <th style="text-align:right;">Price</th>
                <th style="text-align:right;">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>${invoice.description}</td>
                <td style="text-align:center;">${invoice.quantity}</td>
                <td style="text-align:right;">$${Number(invoice.price).toFixed(2)}</td>
                <td style="text-align:right;">$${subtotal.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>

          <div class="totals">
            <p style="margin: 4px 0;">Subtotal: <strong>$${subtotal.toFixed(2)}</strong></p>
            ${
              Number(invoice.tax) > 0
                ? `<p style="margin: 4px 0;">Tax (${invoice.tax}%): +$${taxAmt.toFixed(2)}</p>`
                : ""
            }
            ${
              Number(invoice.discount) > 0
                ? `<p style="margin: 4px 0;">Discount (${invoice.discount}%): -$${discountAmt.toFixed(2)}</p>`
                : ""
            }
            <div class="grand-total">Total: $${total.toFixed(2)}</div>
          </div>

          <div class="footer">
            <p>Thank you for doing business with us!</p>
            <p>Generated by BusinessPilot-AI Platform</p>
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

  const copyEmailNotice = () => {
    const text = `Hi ${invoice.customer_name},\n\nHere is your invoice ${invoice.invoice_number} for "${invoice.description}" totaling $${total.toFixed(2)}.\n\nStatus: ${invoice.payment_status}\n\nThank you,\nBusinessPilot Team`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const triggerWhatsApp = (targetPhone: string) => {
    const msg = buildInvoiceWhatsAppMessage({
      customer_name: invoice.customer_name,
      invoice_number: invoice.invoice_number,
      description: invoice.description,
      total,
      payment_status: invoice.payment_status,
    });

    openWhatsApp(targetPhone, msg);
  };

  return (
    <article className="flex flex-col justify-between gap-5 rounded-2xl border border-white/10 bg-slate-950/30 p-5 transition hover:border-amber-400/30 hover:bg-amber-400/[0.04]">
      <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
        <div className="flex min-w-0 items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-400/10 text-lg font-black text-amber-300">
            $
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h3 className="font-bold text-slate-100">
                {invoice.invoice_number}
              </h3>

              <span
                className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                  isPaid
                    ? "bg-emerald-400/10 text-emerald-300"
                    : "bg-rose-400/10 text-rose-300"
                }`}
              >
                {invoice.payment_status}
              </span>
            </div>

            <p className="mt-2 text-sm text-slate-400">
              {invoice.customer_name}
            </p>

            <p className="mt-1 truncate text-xs text-slate-600">
              {invoice.description}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 md:justify-end">
          <div className="text-left md:text-right">
            <p className="text-xl font-black text-slate-100">
              $
              {total.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>

            <p className="mt-1 text-xs text-slate-600">
              {invoice.customer_email}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handlePrintPDF}
              title="Download PDF or Print"
              className="rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-white/10"
            >
              📥 PDF
            </button>

            <button
              type="button"
              onClick={copyEmailNotice}
              title="Copy Email Text"
              className="rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-white/10"
            >
              {copied ? "✓ Copied" : "✉️ Email"}
            </button>

            <button
              type="button"
              onClick={() => setShowPhoneInput((prev) => !prev)}
              title="Send WhatsApp reminder"
              className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 text-xs font-bold text-emerald-300 hover:bg-emerald-400/20"
            >
              📲 WhatsApp
            </button>

            {!isPaid && (
              <button
                type="button"
                onClick={onMarkPaid}
                className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-xs font-bold text-emerald-300 hover:bg-emerald-400/20"
              >
                Mark paid
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Inline WhatsApp Phone Drawer */}
      {showPhoneInput && (
        <div className="mt-3 flex items-center gap-2 rounded-xl border border-emerald-400/30 bg-emerald-400/10 p-3">
          <input
            type="text"
            value={waPhone}
            onChange={(e) => setWaPhone(e.target.value)}
            placeholder="Enter customer WhatsApp number (e.g. 923001234567)"
            className="flex-1 rounded-lg border border-emerald-400/20 bg-slate-950 px-3 py-2 text-xs text-white outline-none placeholder:text-slate-500 focus:border-emerald-400"
          />
          <button
            type="button"
            onClick={() => {
              if (!waPhone.trim()) {
                alert("Please enter a phone number first.");
                return;
              }
              triggerWhatsApp(waPhone);
            }}
            className="rounded-lg bg-emerald-400 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-emerald-300"
          >
            🚀 Send
          </button>
          <button
            type="button"
            onClick={() => setShowPhoneInput(false)}
            className="text-xs text-slate-400 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}
    </article>
  );
}

function Field({
  label,
  value,
  placeholder,
  type = "text",
  onChange,
}: {
  label: string;
  value: string;
  placeholder: string;
  type?: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold text-slate-400">
        {label}
      </span>

      <input
        type={type}
        min={type === "number" ? "0" : undefined}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-amber-400/50"
      />
    </label>
  );
}

function getInvoiceTotal(invoice: Invoice) {
  const subtotal =
    Number(invoice.quantity || 1) * Number(invoice.price || 0);

  return (
    subtotal +
    (subtotal * Number(invoice.tax || 0)) / 100 -
    (subtotal * Number(invoice.discount || 0)) / 100
  );
}

function InvoiceSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4].map((item) => (
        <div
          key={item}
          className="h-24 animate-pulse rounded-2xl bg-white/[0.05]"
        />
      ))}
    </div>
  );
}