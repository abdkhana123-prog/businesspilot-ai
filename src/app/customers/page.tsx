"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { getMyWorkspaceId } from "@/lib/workspace";

type Customer = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  status: string | null;
  notes: string | null;
  created_at: string;
};

type CustomerForm = {
  name: string;
  email: string;
  phone: string;
  company: string;
  status: string;
  notes: string;
};

const emptyForm: CustomerForm = {
  name: "",
  email: "",
  phone: "",
  company: "",
  status: "Active",
  notes: "",
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [form, setForm] = useState<CustomerForm>(emptyForm);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadCustomers();
  }, []);

  async function loadCustomers() {
    setLoading(true);
    setError("");

    try {
      const workspaceId = await getMyWorkspaceId();

      const { data, error: loadError } = await supabase
        .from("customers")
        .select(
          "id, name, email, phone, company, status, notes, created_at",
        )
        .eq("workspace_id", workspaceId)
        .order("created_at", { ascending: false });

      if (loadError) {
        throw new Error(loadError.message);
      }

      setCustomers((data || []) as Customer[]);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Customers could not be loaded.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function saveToSheets(customer: Customer) {
    try {
      const response = await fetch("/api/sheets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "save",
          resource: "Customers",
          record: {
            id: customer.id,
            name: customer.name,
            email: customer.email || "",
            phone: customer.phone || "",
            company: customer.company || "",
            status: customer.status || "",
            notes: customer.notes || "",
            createdAt: customer.created_at,
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

    if (!form.name.trim() || !form.email.trim()) {
      setError("Name and email are required.");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const workspaceId = await getMyWorkspaceId();

      const { data, error: insertError } = await supabase
        .from("customers")
        .insert({
          workspace_id: workspaceId,
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          company: form.company.trim(),
          status: form.status,
          notes: form.notes.trim(),
        })
        .select()
        .single();

      if (insertError || !data) {
        throw new Error(
          insertError?.message || "Customer could not be saved.",
        );
      }

      const customer = data as Customer;
      const backupWorked = await saveToSheets(customer);

      setCustomers((current) => [customer, ...current]);
      setForm(emptyForm);
      setShowForm(false);

      setMessage(
        backupWorked
          ? "Customer saved securely and backed up to Google Sheets."
          : "Customer saved in Supabase, but Google Sheets backup failed.",
      );
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Customer could not be saved.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteCustomer(customerId: string) {
    const shouldDelete = window.confirm(
      "Are you sure you want to delete this customer?",
    );

    if (!shouldDelete) {
      return;
    }

    try {
      const { error: deleteError } = await supabase
        .from("customers")
        .delete()
        .eq("id", customerId);

      if (deleteError) {
        throw new Error(deleteError.message);
      }

      setCustomers((current) =>
        current.filter((customer) => customer.id !== customerId),
      );

      setMessage("Customer deleted successfully.");
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Customer could not be deleted.",
      );
    }
  }

  const filteredCustomers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return customers.filter((customer) => {
      const matchesSearch =
        !query ||
        customer.name.toLowerCase().includes(query) ||
        customer.email?.toLowerCase().includes(query) ||
        customer.company?.toLowerCase().includes(query) ||
        customer.phone?.toLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "All" ||
        customer.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [customers, search, statusFilter]);

  const activeCustomers = customers.filter(
    (customer) => customer.status === "Active",
  ).length;

  const prospects = customers.filter(
    (customer) => customer.status === "Prospect",
  ).length;

  return (
    <main className="min-h-screen bg-[#050816] px-4 py-6 text-white sm:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-300 via-blue-500 to-cyan-500 text-xl font-black shadow-lg shadow-violet-500/20">
                ◉
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-[0.25em] text-violet-300">
                  Relationship workspace
                </p>

                <h1 className="mt-1 text-3xl font-black tracking-tight sm:text-4xl">
                  Customers
                </h1>
              </div>
            </div>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-500">
              Keep every client relationship organized, searchable,
              and ready for your next follow-up.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setShowForm((current) => !current);
              setError("");
              setMessage("");
            }}
            className="rounded-xl bg-gradient-to-r from-violet-300 to-blue-500 px-5 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-violet-500/10 transition hover:from-violet-200 hover:to-blue-400"
          >
            {showForm ? "Close form" : "+ Add customer"}
          </button>
        </header>

        <section className="mt-8 grid gap-4 sm:grid-cols-3">
          <SummaryCard
            label="Total customers"
            value={customers.length}
            icon="◉"
            color="violet"
          />

          <SummaryCard
            label="Active customers"
            value={activeCustomers}
            icon="✓"
            color="emerald"
          />

          <SummaryCard
            label="Prospects"
            value={prospects}
            icon="◎"
            color="cyan"
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
            <p className="mt-1 text-xs text-rose-300/80">
              {error}
            </p>
          </div>
        )}

        {showForm && (
          <section className="mt-6 rounded-3xl border border-violet-400/20 bg-gradient-to-br from-violet-400/[0.1] to-white/[0.04] p-6 shadow-2xl shadow-black/20 sm:p-8">
            <div className="mb-6">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-300">
                New relationship
              </p>

              <h2 className="mt-2 text-2xl font-black">
                Add a customer
              </h2>
            </div>

            <form
              onSubmit={handleSubmit}
              className="grid gap-4 md:grid-cols-2"
            >
              <Input
                label="Customer name"
                value={form.name}
                placeholder="e.g. Sara Khan"
                onChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    name: value,
                  }))
                }
              />

              <Input
                label="Email address"
                type="email"
                value={form.email}
                placeholder="sara@example.com"
                onChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    email: value,
                  }))
                }
              />

              <Input
                label="Phone number"
                value={form.phone}
                placeholder="03001234567"
                onChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    phone: value,
                  }))
                }
              />

              <Input
                label="Company"
                value={form.company}
                placeholder="Company name"
                onChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    company: value,
                  }))
                }
              />

              <label className="block">
                <span className="mb-2 block text-xs font-semibold text-slate-400">
                  Relationship status
                </span>

                <select
                  value={form.status}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      status: event.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none focus:border-violet-400/50"
                >
                  <option className="bg-slate-900">
                    Active
                  </option>
                  <option className="bg-slate-900">
                    Prospect
                  </option>
                  <option className="bg-slate-900">
                    Inactive
                  </option>
                </select>
              </label>

              <label className="block md:col-span-2">
                <span className="mb-2 block text-xs font-semibold text-slate-400">
                  Notes
                </span>

                <textarea
                  value={form.notes}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      notes: event.target.value,
                    }))
                  }
                  rows={3}
                  placeholder="Add useful context about this customer..."
                  className="w-full resize-none rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-violet-400/50"
                />
              </label>

              <div className="flex gap-3 md:col-span-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-violet-300 px-5 py-3 text-sm font-bold text-slate-950 disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save customer"}
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
                Client directory
              </p>

              <h2 className="mt-2 text-2xl font-black">
                All customers
              </h2>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search customers..."
                className="rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-violet-400/50"
              />

              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value)
                }
                className="rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-slate-300 outline-none focus:border-violet-400/50"
              >
                <option className="bg-slate-900">All</option>
                <option className="bg-slate-900">Active</option>
                <option className="bg-slate-900">Prospect</option>
                <option className="bg-slate-900">Inactive</option>
              </select>
            </div>
          </div>

          <div className="mt-6">
            {loading ? (
              <LoadingRows />
            ) : filteredCustomers.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 p-10 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-400/10 text-2xl text-violet-300">
                  ◉
                </div>

                <h3 className="mt-5 font-bold text-slate-200">
                  No customers found
                </h3>

                <p className="mt-2 text-sm text-slate-600">
                  Add a customer or change your search filters.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {filteredCustomers.map((customer) => (
                  <CustomerCard
                    key={customer.id}
                    customer={customer}
                    onDelete={() => deleteCustomer(customer.id)}
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

function SummaryCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: number;
  icon: string;
  color: "violet" | "emerald" | "cyan";
}) {
  const colors = {
    violet: "bg-violet-400/10 text-violet-300",
    emerald: "bg-emerald-400/10 text-emerald-300",
    cyan: "bg-cyan-400/10 text-cyan-300",
  };

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
      <div
        className={`flex h-11 w-11 items-center justify-center rounded-2xl text-lg ${colors[color]}`}
      >
        {icon}
      </div>

      <p className="mt-5 text-xs font-semibold text-slate-500">
        {label}
      </p>

      <p className="mt-2 text-3xl font-black">{value}</p>
    </div>
  );
}

function CustomerCard({
  customer,
  onDelete,
}: {
  customer: Customer;
  onDelete: () => void;
}) {
  const initials = customer.name
    .split(" ")
    .map((part) => part.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <article className="group rounded-3xl border border-white/10 bg-slate-950/30 p-5 transition hover:-translate-y-1 hover:border-violet-400/30 hover:bg-violet-400/[0.04]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-300 to-blue-600 font-black text-slate-950">
            {initials || "CU"}
          </div>

          <div className="min-w-0">
            <h3 className="truncate font-bold text-slate-100">
              {customer.name}
            </h3>

            <p className="mt-1 truncate text-xs text-slate-600">
              {customer.company || "Independent customer"}
            </p>
          </div>
        </div>

        <span className="rounded-full bg-emerald-400/10 px-2.5 py-1 text-[10px] font-semibold text-emerald-300">
          {customer.status || "Active"}
        </span>
      </div>

      <div className="mt-6 space-y-3 border-t border-white/10 pt-5">
        <p className="truncate text-sm text-slate-400">
          <span className="mr-2 text-violet-300">@</span>
          {customer.email || "No email"}
        </p>

        <p className="truncate text-sm text-slate-400">
          <span className="mr-2 text-violet-300">☎</span>
          {customer.phone || "No phone"}
        </p>

        {customer.notes && (
          <p className="line-clamp-2 text-xs leading-5 text-slate-600">
            {customer.notes}
          </p>
        )}
      </div>

      <div className="mt-6 flex items-center justify-between">
        <a
          href={`mailto:${customer.email || ""}`}
          className="text-xs font-bold text-violet-300 hover:text-violet-200"
        >
          Contact customer →
        </a>

        <button
          type="button"
          onClick={onDelete}
          className="text-xs text-slate-700 transition hover:text-rose-300"
        >
          Delete
        </button>
      </div>
    </article>
  );
}

function Input({
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
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-violet-400/50"
      />
    </label>
  );
}

function LoadingRows() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {[1, 2, 3, 4, 5, 6].map((item) => (
        <div
          key={item}
          className="h-52 animate-pulse rounded-3xl bg-white/[0.05]"
        />
      ))}
    </div>
  );
}
