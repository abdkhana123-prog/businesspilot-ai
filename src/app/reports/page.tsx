"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { getMyWorkspaceId } from "@/lib/workspace";

type Lead = {
  name: string;
  status: string;
};

type Task = {
  title: string;
  priority: string;
  completed: boolean;
  due_date: string | null;
};

type Appointment = {
  customer_name: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
};

type Invoice = {
  quantity: number;
  price: number;
  tax: number;
  discount: number;
};

type Expense = {
  title: string;
  category: string;
  amount: number;
};

export default function ReportsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [appointments, setAppointments] = useState<
    Appointment[]
  >([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadReport();
  }, []);

  async function loadReport() {
    setLoading(true);
    setMessage("");

    try {
      const workspaceId = await getMyWorkspaceId();

      const [
        leadsResult,
        tasksResult,
        appointmentsResult,
        invoicesResult,
        expensesResult,
      ] = await Promise.all([
        supabase
          .from("leads")
          .select("name, status")
          .eq("workspace_id", workspaceId),

        supabase
          .from("tasks")
          .select("title, priority, completed, due_date")
          .eq("workspace_id", workspaceId),

        supabase
          .from("appointments")
          .select(
            "customer_name, appointment_date, appointment_time, status",
          )
          .eq("workspace_id", workspaceId)
          .order("appointment_date", { ascending: true }),

        supabase
          .from("invoices")
          .select("quantity, price, tax, discount")
          .eq("workspace_id", workspaceId),

        supabase
          .from("expenses")
          .select("title, category, amount")
          .eq("workspace_id", workspaceId),
      ]);

      const error =
        leadsResult.error ||
        tasksResult.error ||
        appointmentsResult.error ||
        invoicesResult.error ||
        expensesResult.error;

      if (error) {
        throw new Error(error.message);
      }

      setLeads((leadsResult.data || []) as Lead[]);
      setTasks((tasksResult.data || []) as Task[]);
      setAppointments(
        (appointmentsResult.data || []) as Appointment[],
      );
      setInvoices((invoicesResult.data || []) as Invoice[]);
      setExpenses((expensesResult.data || []) as Expense[]);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not load business report.",
      );
    } finally {
      setLoading(false);
    }
  }

  const today = new Date().toISOString().slice(0, 10);

  const newLeads = leads.filter(
    (lead) => lead.status === "New",
  );

  const qualifiedLeads = leads.filter(
    (lead) => lead.status === "Qualified",
  );

  const pendingTasks = tasks.filter(
    (task) => !task.completed,
  );

  const highPriorityTasks = pendingTasks.filter(
    (task) => task.priority === "High",
  );

  const todaysAppointments = appointments.filter(
    (appointment) =>
      appointment.appointment_date === today &&
      appointment.status !== "Cancelled",
  );

  const invoiceRevenue = invoices.reduce(
    (total, invoice) => {
      const subtotal = Number(invoice.quantity) * Number(invoice.price);
      const tax = (subtotal * Number(invoice.tax)) / 100;
      const discount =
        (subtotal * Number(invoice.discount)) / 100;

      return total + subtotal + tax - discount;
    },
    0,
  );

  const totalExpenses = expenses.reduce(
    (total, expense) => total + Number(expense.amount),
    0,
  );

  const estimatedProfit = invoiceRevenue - totalExpenses;

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 p-8 text-white">
        <p className="text-slate-400">
          Loading secure business report...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm uppercase tracking-widest text-cyan-400">
              BusinessPilot AI
            </p>

            <h1 className="mt-2 text-4xl font-bold">
              Business Report
            </h1>

            <p className="mt-2 text-slate-400">
              Secure summary of your private workspace.
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

            <button
              type="button"
              onClick={loadReport}
              className="rounded-xl bg-cyan-400 px-4 py-2 text-sm font-bold text-slate-950 hover:bg-cyan-300"
            >
              Refresh Report
            </button>
          </div>
        </header>

        {message && (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-300">
            {message}
          </div>
        )}

        <section className="mb-8 rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-6">
          <p className="text-sm uppercase tracking-widest text-cyan-400">
            Today&apos;s Summary
          </p>

          <h2 className="mt-3 text-2xl font-bold">
            Here is what needs your attention
          </h2>

          <p className="mt-4 leading-7 text-slate-300">
            You have {newLeads.length} new lead
            {newLeads.length === 1 ? "" : "s"}, {pendingTasks.length}{" "}
            pending task
            {pendingTasks.length === 1 ? "" : "s"}, and{" "}
            {todaysAppointments.length} appointment
            {todaysAppointments.length === 1 ? "" : "s"} today.
            {highPriorityTasks.length > 0
              ? ` ${highPriorityTasks.length} high-priority task${
                  highPriorityTasks.length === 1 ? "" : "s"
                } need attention.`
              : " There are no high-priority pending tasks."}
          </p>
        </section>

        <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="New Leads"
            value={newLeads.length}
          />

          <MetricCard
            title="Qualified Leads"
            value={qualifiedLeads.length}
          />

          <MetricCard
            title="Pending Tasks"
            value={pendingTasks.length}
          />

          <MetricCard
            title="Today's Appointments"
            value={todaysAppointments.length}
          />

          <MetricCard
            title="Invoice Revenue"
            value={`$${invoiceRevenue.toFixed(2)}`}
          />

          <MetricCard
            title="Total Expenses"
            value={`$${totalExpenses.toFixed(2)}`}
          />

          <MetricCard
            title="Estimated Profit"
            value={`$${estimatedProfit.toFixed(2)}`}
          />

          <MetricCard
            title="Total Records"
            value={
              leads.length +
              tasks.length +
              appointments.length +
              invoices.length +
              expenses.length
            }
          />
        </section>

        <div className="grid gap-8 lg:grid-cols-2">
          <ReportList
            title="Priority Tasks"
            emptyText="No pending high-priority tasks."
          >
            {highPriorityTasks.map((task, index) => (
              <div
                key={`${task.title}-${index}`}
                className="border-b border-slate-800 px-6 py-4 last:border-0"
              >
                <p className="font-semibold">{task.title}</p>

                <p className="mt-1 text-sm text-red-300">
                  High priority
                  {task.due_date
                    ? ` • Due ${task.due_date}`
                    : ""}
                </p>
              </div>
            ))}
          </ReportList>

          <ReportList
            title="Today&apos;s Appointments"
            emptyText="No appointments scheduled for today."
          >
            {todaysAppointments.map((appointment, index) => (
              <div
                key={`${appointment.customer_name}-${index}`}
                className="border-b border-slate-800 px-6 py-4 last:border-0"
              >
                <p className="font-semibold">
                  {appointment.customer_name}
                </p>

                <p className="mt-1 text-sm text-cyan-300">
                  {appointment.appointment_time}
                </p>

                <p className="mt-1 text-sm text-slate-400">
                  {appointment.status}
                </p>
              </div>
            ))}
          </ReportList>

          <ReportList
            title="New Leads"
            emptyText="No new leads waiting."
          >
            {newLeads.map((lead, index) => (
              <div
                key={`${lead.name}-${index}`}
                className="border-b border-slate-800 px-6 py-4 last:border-0"
              >
                <p className="font-semibold">{lead.name}</p>

                <p className="mt-1 text-sm text-cyan-300">
                  {lead.status}
                </p>
              </div>
            ))}
          </ReportList>

          <ReportList
            title="Expense Breakdown"
            emptyText="No expenses recorded."
          >
            {expenses.slice(0, 5).map((expense, index) => (
              <div
                key={`${expense.title}-${index}`}
                className="flex items-center justify-between border-b border-slate-800 px-6 py-4 last:border-0"
              >
                <div>
                  <p className="font-semibold">
                    {expense.title}
                  </p>

                  <p className="mt-1 text-sm text-slate-400">
                    {expense.category}
                  </p>
                </div>

                <p className="font-bold text-red-300">
                  ${Number(expense.amount).toFixed(2)}
                </p>
              </div>
            ))}
          </ReportList>
        </div>
      </div>
    </main>
  );
}

function MetricCard({
  title,
  value,
}: {
  title: string;
  value: number | string;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
      <p className="text-sm text-slate-400">{title}</p>

      <p className="mt-3 text-3xl font-bold text-cyan-300">
        {value}
      </p>
    </div>
  );
}

function ReportList({
  title,
  emptyText,
  children,
}: {
  title: string;
  emptyText: string;
  children: React.ReactNode;
}) {
  const hasItems = Boolean(children);

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
      <div className="border-b border-slate-800 px-6 py-5">
        <h2 className="text-xl font-bold">{title}</h2>
      </div>

      {hasItems ? (
        children
      ) : (
        <p className="p-6 text-slate-400">{emptyText}</p>
      )}
    </section>
  );
}
