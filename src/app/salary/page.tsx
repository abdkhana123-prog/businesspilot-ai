"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { getMyWorkspaceId } from "@/lib/workspace";

type PaymentStatus =
  | "Pending"
  | "Paid"
  | "Partially Paid";

type SalaryRecord = {
  id: string;
  workspace_id: string;
  employee_name: string;
  employee_email: string | null;
  employee_role: string;
  monthly_salary: number;
  salary_month: string;
  payment_status: PaymentStatus;
  paid_amount: number;
  payment_date: string | null;
  notes: string | null;
  created_at: string;
};

const roles = [
  "Owner",
  "Manager",
  "Salesperson",
  "Accountant",
  "Staff",
];

export default function SalaryPage() {
  const [records, setRecords] = useState<SalaryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [employeeName, setEmployeeName] = useState("");
  const [employeeEmail, setEmployeeEmail] = useState("");
  const [employeeRole, setEmployeeRole] = useState("Staff");
  const [monthlySalary, setMonthlySalary] = useState("");
  const [salaryMonth, setSalaryMonth] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [notes, setNotes] = useState("");

  useEffect(() => {
    loadSalaryRecords();
  }, []);

  async function loadSalaryRecords() {
    setLoading(true);
    setMessage("");

    try {
      const workspaceId = await getMyWorkspaceId();

      const { data, error } = await supabase
        .from("staff_salary")
        .select("*")
        .eq("workspace_id", workspaceId)
        .order("salary_month", { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      setRecords((data || []) as SalaryRecord[]);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not load salary records.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function addSalaryRecord(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const salary = Number(monthlySalary);

    if (!employeeName.trim() || salary <= 0 || !salaryMonth) {
      setMessage(
        "Please enter employee name, salary, and month.",
      );
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const workspaceId = await getMyWorkspaceId();

      const { data: savedRecord, error } = await supabase
        .from("staff_salary")
        .insert({
          workspace_id: workspaceId,
          employee_name: employeeName.trim(),
          employee_email: employeeEmail.trim() || null,
          employee_role: employeeRole,
          monthly_salary: salary,
          salary_month: salaryMonth,
          payment_status: "Pending",
          paid_amount: 0,
          notes: notes.trim() || null,
        })
        .select()
        .single();

      if (error || !savedRecord) {
        throw new Error(
          error?.message || "Could not save salary record.",
        );
      }

      let sheetMessage =
        "Salary record saved in Supabase and Google Sheets.";

      try {
        const sheetResponse = await fetch("/api/sheets", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "save",
            resource: "Salary",
            record: {
              id: savedRecord.id,
              employeeName: savedRecord.employee_name,
              employeeEmail: savedRecord.employee_email || "",
              employeeRole: savedRecord.employee_role,
              monthlySalary: savedRecord.monthly_salary,
              salaryMonth: savedRecord.salary_month,
              paymentStatus: savedRecord.payment_status,
              paidAmount: savedRecord.paid_amount,
              paymentDate: savedRecord.payment_date || "",
              notes: savedRecord.notes || "",
              createdAt: savedRecord.created_at,
            },
          }),
        });

        const sheetData = await sheetResponse.json();

        if (!sheetResponse.ok || !sheetData.success) {
          sheetMessage =
            "Salary saved in Supabase, but Google Sheets backup failed.";
        }
      } catch {
        sheetMessage =
          "Salary saved in Supabase, but Google Sheets backup failed.";
      }

      setRecords((currentRecords) => [
        savedRecord as SalaryRecord,
        ...currentRecords,
      ]);

      setEmployeeName("");
      setEmployeeEmail("");
      setEmployeeRole("Staff");
      setMonthlySalary("");
      setNotes("");
      setMessage(sheetMessage);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not save salary record.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function updatePayment(
    record: SalaryRecord,
    status: PaymentStatus,
  ) {
    const paidAmount =
      status === "Paid"
        ? Number(record.monthly_salary)
        : status === "Pending"
          ? 0
          : Number(record.paid_amount);

    const paymentDate =
      status === "Paid"
        ? new Date().toISOString().slice(0, 10)
        : record.payment_date;

    const workspaceId = await getMyWorkspaceId();

    const { data, error } = await supabase
      .from("staff_salary")
      .update({
        payment_status: status,
        paid_amount: paidAmount,
        payment_date: paymentDate,
      })
      .eq("id", record.id)
      .eq("workspace_id", workspaceId)
      .select()
      .single();

    if (error || !data) {
      setMessage(error?.message || "Could not update payment.");
      return;
    }

    setRecords((currentRecords) =>
      currentRecords.map((item) =>
        item.id === record.id ? (data as SalaryRecord) : item,
      ),
    );

    setMessage("Salary payment status updated.");
  }

  async function deleteRecord(id: string) {
    const confirmed = window.confirm(
      "Delete this salary record?",
    );

    if (!confirmed) {
      return;
    }

    const workspaceId = await getMyWorkspaceId();

    const { error } = await supabase
      .from("staff_salary")
      .delete()
      .eq("id", id)
      .eq("workspace_id", workspaceId);

    if (error) {
      setMessage(error.message);
      return;
    }

    setRecords((currentRecords) =>
      currentRecords.filter((record) => record.id !== id),
    );

    setMessage("Salary record deleted.");
  }

  const totalPayroll = records.reduce(
    (total, record) =>
      total + Number(record.monthly_salary),
    0,
  );

  const paidPayroll = records.reduce(
    (total, record) =>
      total + Number(record.paid_amount),
    0,
  );

  const pendingPayroll = Math.max(
    totalPayroll - paidPayroll,
    0,
  );

  const currentMonth = new Date().toISOString().slice(0, 7);

  const currentMonthRecords = useMemo(
    () =>
      records.filter((record) =>
        record.salary_month.startsWith(currentMonth),
      ),
    [records, currentMonth],
  );

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm uppercase tracking-widest text-cyan-400">
              BusinessPilot AI
            </p>

            <h1 className="mt-2 text-4xl font-bold">
              Salary Tracker
            </h1>

            <p className="mt-2 text-slate-400">
              Manage staff salaries and payment status securely.
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
              href="/team"
              className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:border-cyan-400"
            >
              Team
            </a>

            <a
              href="/"
              className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:border-cyan-400"
            >
              Chat
            </a>
          </div>
        </header>

        {message && (
          <div className="mb-6 rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-4 text-cyan-300">
            {message}
          </div>
        )}

        <section className="mb-8 rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="mb-5 text-2xl font-bold">
            Add Salary Record
          </h2>

          <form
            onSubmit={addSalaryRecord}
            className="grid gap-4 md:grid-cols-2"
          >
            <input
              value={employeeName}
              onChange={(event) =>
                setEmployeeName(event.target.value)
              }
              placeholder="Employee name *"
              required
              className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none placeholder:text-slate-500 focus:border-cyan-400"
            />

            <input
              type="email"
              value={employeeEmail}
              onChange={(event) =>
                setEmployeeEmail(event.target.value)
              }
              placeholder="Employee email"
              className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none placeholder:text-slate-500 focus:border-cyan-400"
            />

            <select
              value={employeeRole}
              onChange={(event) =>
                setEmployeeRole(event.target.value)
              }
              className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400"
            >
              {roles.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>

            <input
              type="number"
              min="0"
              step="0.01"
              value={monthlySalary}
              onChange={(event) =>
                setMonthlySalary(event.target.value)
              }
              placeholder="Monthly salary *"
              required
              className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none placeholder:text-slate-500 focus:border-cyan-400"
            />

            <input
              type="date"
              value={salaryMonth}
              onChange={(event) =>
                setSalaryMonth(event.target.value)
              }
              required
              className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400"
            />

            <input
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Notes"
              className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none placeholder:text-slate-500 focus:border-cyan-400"
            />

            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-cyan-400 px-5 py-3 font-bold text-slate-950 disabled:opacity-50 md:col-span-2"
            >
              {saving ? "Saving..." : "Save Salary Record"}
            </button>
          </form>
        </section>

        <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard
            title="Total Payroll"
            value={`$${totalPayroll.toFixed(2)}`}
          />

          <SummaryCard
            title="Paid Amount"
            value={`$${paidPayroll.toFixed(2)}`}
          />

          <SummaryCard
            title="Pending Amount"
            value={`$${pendingPayroll.toFixed(2)}`}
          />

          <SummaryCard
            title="Current Month Records"
            value={currentMonthRecords.length}
          />
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
          <div className="border-b border-slate-800 px-6 py-5">
            <h2 className="text-2xl font-bold">
              Salary Records
            </h2>
          </div>

          {loading ? (
            <p className="p-8 text-slate-400">
              Loading secure salary records...
            </p>
          ) : records.length === 0 ? (
            <p className="p-8 text-slate-400">
              No salary records yet.
            </p>
          ) : (
            <div className="divide-y divide-slate-800">
              {records.map((record) => (
                <article
                  key={record.id}
                  className="flex flex-col justify-between gap-5 px-6 py-5 lg:flex-row lg:items-center"
                >
                  <div>
                    <h3 className="text-lg font-bold">
                      {record.employee_name}
                    </h3>

                    <p className="mt-1 text-sm text-cyan-300">
                      {record.employee_role} •{" "}
                      {record.salary_month}
                    </p>

                    {record.employee_email && (
                      <p className="mt-1 text-sm text-slate-400">
                        {record.employee_email}
                      </p>
                    )}

                    {record.notes && (
                      <p className="mt-2 text-sm text-slate-500">
                        {record.notes}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <div className="text-right">
                      <p className="text-xl font-bold text-cyan-300">
                        $
                        {Number(
                          record.monthly_salary,
                        ).toFixed(2)}
                      </p>

                      <p className="text-xs text-slate-500">
                        Paid: $
                        {Number(record.paid_amount).toFixed(2)}
                      </p>
                    </div>

                    <select
                      value={record.payment_status}
                      onChange={(event) =>
                        updatePayment(
                          record,
                          event.target.value as PaymentStatus,
                        )
                      }
                      className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-cyan-400"
                    >
                      <option value="Pending">Pending</option>
                      <option value="Partially Paid">
                        Partially Paid
                      </option>
                      <option value="Paid">Paid</option>
                    </select>

                    <button
                      type="button"
                      onClick={() => deleteRecord(record.id)}
                      className="rounded-lg border border-red-500/40 px-3 py-2 text-sm text-red-300 hover:bg-red-500/10"
                    >
                      Delete
                    </button>
                  </div>
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
}: {
  title: string;
  value: number | string;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
      <p className="text-sm text-slate-400">{title}</p>

      <p className="mt-2 text-3xl font-bold text-cyan-300">
        {value}
      </p>
    </div>
  );
}
