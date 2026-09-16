"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { getMyWorkspaceId } from "@/lib/workspace";

type Appointment = {
  id: string;
  customer_name: string;
  appointment_date: string;
  appointment_time: string;
  purpose: string;
  status: string;
  created_at?: string;
};

type AppointmentForm = {
  customerName: string;
  date: string;
  time: string;
  purpose: string;
};

const emptyForm: AppointmentForm = {
  customerName: "",
  date: "",
  time: "",
  purpose: "",
};

export default function AppointmentsPage( ) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [form, setForm] =
    useState<AppointmentForm>(emptyForm);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadAppointments();
  }, []);

  async function loadAppointments() {
    setLoading(true);
    setError("");

    try {
      const workspaceId = await getMyWorkspaceId();

      const { data, error: loadError } = await supabase
        .from("appointments")
        .select(
          "id, customer_name, appointment_date, appointment_time, purpose, status, created_at",
        )
        .eq("workspace_id", workspaceId)
        .order("appointment_date", { ascending: true });

      if (loadError) {
        throw new Error(loadError.message);
      }

      setAppointments((data || []) as Appointment[]);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Appointments could not be loaded.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function saveToSheets(appointment: Appointment) {
    try {
      const response = await fetch("/api/sheets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "save",
          resource: "Appointments",
          record: {
            id: appointment.id,
            customerName: appointment.customer_name,
            date: appointment.appointment_date,
            time: appointment.appointment_time,
            purpose: appointment.purpose,
            status: appointment.status,
            createdAt: appointment.created_at,
          },
        }),
      });

      const result = await response.json();
      return response.ok && result.success === true;
    } catch {
      return false;
    }
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (
      !form.customerName.trim() ||
      !form.date ||
      !form.time ||
      !form.purpose.trim()
    ) {
      setError(
        "Customer, date, time, and purpose are required.",
      );
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const workspaceId = await getMyWorkspaceId();

      const { data, error: insertError } = await supabase
        .from("appointments")
        .insert({
          workspace_id: workspaceId,
          customer_name: form.customerName.trim(),
          appointment_date: form.date,
          appointment_time: form.time,
          purpose: form.purpose.trim(),
          status: "Scheduled",
        })
        .select()
        .single();

      if (insertError || !data) {
        throw new Error(
          insertError?.message ||
            "Appointment could not be saved.",
        );
      }

      const appointment = data as Appointment;
      const backupWorked = await saveToSheets(appointment);

      setAppointments((current) => [
        ...current,
        appointment,
      ]);

      setForm(emptyForm);
      setShowForm(false);

      setMessage(
        backupWorked
          ? "Appointment saved and backed up to Google Sheets."
          : "Appointment saved in Supabase, but Google Sheets backup failed.",
      );
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Appointment could not be saved.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(
    appointmentId: string,
    status: string,
  ) {
    const { data, error: updateError } = await supabase
      .from("appointments")
      .update({ status })
      .eq("id", appointmentId)
      .select()
      .single();

    if (updateError || !data) {
      setError(
        updateError?.message ||
          "Appointment status could not be updated.",
      );
      return;
    }

    setAppointments((current) =>
      current.map((appointment) =>
        appointment.id === appointmentId
          ? (data as Appointment)
          : appointment,
      ),
    );

    setMessage(`Appointment marked as ${status}.`);
  }

  const filteredAppointments = useMemo(() => {
    const query = search.trim().toLowerCase();

    return appointments.filter((appointment) => {
      const matchesSearch =
        !query ||
        appointment.customer_name
          .toLowerCase()
          .includes(query) ||
        appointment.purpose.toLowerCase().includes(query);

      const matchesFilter =
        filter === "All" ||
        appointment.status === filter;

      return matchesSearch && matchesFilter;
    });
  }, [appointments, search, filter]);

  const scheduled = appointments.filter(
    (appointment) => appointment.status === "Scheduled",
  ).length;

  const completed = appointments.filter(
    (appointment) => appointment.status === "Completed",
  ).length;

  const today = appointments.filter(
    (appointment) =>
      appointment.appointment_date ===
      new Date().toISOString().slice(0, 10),
  ).length;

  return (
    <main className="min-h-screen bg-[#050816] px-4 py-6 text-white sm:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-300 via-cyan-500 to-blue-600 text-xl font-black text-slate-950 shadow-lg shadow-emerald-500/20">
                ◷
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-[0.25em] text-emerald-300">
                  Client calendar
                </p>

                <h1 className="mt-1 text-3xl font-black sm:text-4xl">
                  Appointments
                </h1>
              </div>
            </div>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-500">
              Plan meetings, protect your time, and keep every client
              conversation organized.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setShowForm((current) => !current);
              setError("");
              setMessage("");
            }}
            className="rounded-xl bg-gradient-to-r from-emerald-300 to-cyan-500 px-5 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-emerald-500/10 transition hover:from-emerald-200 hover:to-cyan-400"
          >
            {showForm ? "Close form" : "+ Book appointment"}
          </button>
        </header>

        <section className="mt-8 grid gap-4 sm:grid-cols-3">
          <Summary
            label="Scheduled"
            value={scheduled}
            icon="◷"
            color="emerald"
          />

          <Summary
            label="Today"
            value={today}
            icon="!"
            color="amber"
          />

          <Summary
            label="Completed"
            value={completed}
            icon="✓"
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
            {error}
          </div>
        )}

        {showForm && (
          <section className="mt-6 rounded-3xl border border-emerald-400/20 bg-gradient-to-br from-emerald-400/[0.1] to-white/[0.04] p-6 shadow-2xl shadow-black/20 sm:p-8">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-300">
              Calendar entry
            </p>

            <h2 className="mt-2 text-2xl font-black">
              Book an appointment
            </h2>

            <form
              onSubmit={handleSubmit}
              className="mt-6 grid gap-4 md:grid-cols-2"
            >
              <Input
                label="Customer name"
                value={form.customerName}
                placeholder="Sara Khan"
                onChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    customerName: value,
                  }))
                }
              />

              <Input
                label="Purpose"
                value={form.purpose}
                placeholder="Project consultation"
                onChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    purpose: value,
                  }))
                }
              />

              <label>
                <span className="mb-2 block text-xs font-semibold text-slate-400">
                  Date
                </span>

                <input
                  type="date"
                  value={form.date}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      date: event.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none focus:border-emerald-400/50"
                />
              </label>

              <label>
                <span className="mb-2 block text-xs font-semibold text-slate-400">
                  Time
                </span>

                <input
                  type="time"
                  value={form.time}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      time: event.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none focus:border-emerald-400/50"
                />
              </label>

              <div className="flex gap-3 md:col-span-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-emerald-300 px-5 py-3 text-sm font-bold text-slate-950 disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save appointment"}
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
                Schedule
              </p>

              <h2 className="mt-2 text-2xl font-black">
                Upcoming meetings
              </h2>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search appointments..."
                className="rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-emerald-400/50"
              />

              <select
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
                className="rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-slate-300 outline-none focus:border-emerald-400/50"
              >
                <option className="bg-slate-900">All</option>
                <option className="bg-slate-900">
                  Scheduled
                </option>
                <option className="bg-slate-900">
                  Completed
                </option>
                <option className="bg-slate-900">
                  Cancelled
                </option>
              </select>
            </div>
          </div>

          <div className="mt-6">
            {loading ? (
              <LoadingRows />
            ) : filteredAppointments.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 p-10 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-400/10 text-2xl text-emerald-300">
                  ◷
                </div>

                <h3 className="mt-5 font-bold text-slate-200">
                  No appointments found
                </h3>

                <p className="mt-2 text-sm text-slate-600">
                  Book a meeting to start building your schedule.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredAppointments.map((appointment) => (
                  <AppointmentCard
                    key={appointment.id}
                    appointment={appointment}
                    onStatusChange={(status) =>
                      updateStatus(appointment.id, status)
                    }
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

function Summary({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: number;
  icon: string;
  color: "emerald" | "amber" | "cyan";
}) {
  const colors = {
    emerald: "bg-emerald-400/10 text-emerald-300",
    amber: "bg-amber-400/10 text-amber-300",
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

function AppointmentCard({
  appointment,
  onStatusChange,
}: {
  appointment: Appointment;
  onStatusChange: (status: string) => void;
}) {
  return (
    <article className="flex flex-col justify-between gap-5 rounded-2xl border border-white/10 bg-slate-950/30 p-5 transition hover:border-emerald-400/30 hover:bg-emerald-400/[0.04] md:flex-row md:items-center">
      <div className="flex items-center gap-4">
        <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-2xl bg-emerald-400/10 text-emerald-300">
          <span className="text-[10px] uppercase">
            {formatMonth(appointment.appointment_date)}
          </span>

          <span className="text-xl font-black">
            {formatDay(appointment.appointment_date)}
          </span>
        </div>

        <div>
          <h3 className="font-bold text-slate-100">
            {appointment.customer_name}
          </h3>

          <p className="mt-1 text-sm text-slate-400">
            {appointment.purpose}
          </p>

          <p className="mt-2 text-xs text-slate-600">
            {appointment.appointment_time}
          </p>
        </div>
      </div>

      <select
        value={appointment.status}
        onChange={(event) =>
          onStatusChange(event.target.value)
        }
        className="rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2 text-xs text-slate-300 outline-none focus:border-emerald-400/50"
      >
        <option className="bg-slate-900">Scheduled</option>
        <option className="bg-slate-900">Completed</option>
        <option className="bg-slate-900">Cancelled</option>
      </select>
    </article>
  );
}

function Input({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}) {
  return (
    <label>
      <span className="mb-2 block text-xs font-semibold text-slate-400">
        {label}
      </span>

      <input
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-emerald-400/50"
      />
    </label>
  );
}

function formatMonth(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString(
    "en-US",
    { month: "short" },
  );
}

function formatDay(date: string) {
  return new Date(`${date}T00:00:00`).getDate();
}

function LoadingRows() {
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
