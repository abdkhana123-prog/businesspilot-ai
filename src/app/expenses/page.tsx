"use client";

import { FormEvent, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { getMyWorkspaceId } from "@/lib/workspace";

type ExpenseCategory =
  | "Software"
  | "Marketing"
  | "Office"
  | "Travel"
  | "Salary"
  | "Other";

type Expense = {
  id: string;
  workspace_id: string;
  title: string;
  category: ExpenseCategory;
  amount: number;
  expense_date: string;
  notes: string | null;
  created_at: string;
};

const categories: ExpenseCategory[] = [
  "Software",
  "Marketing",
  "Office",
  "Travel",
  "Salary",
  "Other",
];

const money = (value: number) => `$${value.toFixed(2)}`;

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [title, setTitle] = useState("");
  const [category, setCategory] =
    useState<ExpenseCategory>("Software");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    loadExpenses();
  }, []);

  async function loadExpenses() {
    setLoading(true);
    setMessage("");

    try {
      const workspaceId = await getMyWorkspaceId();

      const { data, error } = await supabase
        .from("expenses")
        .select("*")
        .eq("workspace_id", workspaceId)
        .order("expense_date", { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      setExpenses((data || []) as Expense[]);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not load expenses.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function addExpense(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const numericAmount = Number(amount);

    if (!title.trim() || numericAmount <= 0 || !date) {
      setMessage(
        "Please enter a title, valid amount, and date.",
      );
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const workspaceId = await getMyWorkspaceId();

      const { data: savedExpense, error } = await supabase
        .from("expenses")
        .insert({
          workspace_id: workspaceId,
          title: title.trim(),
          category,
          amount: numericAmount,
          expense_date: date,
          notes: notes.trim(),
        })
        .select()
        .single();

      if (error || !savedExpense) {
        throw new Error(
          error?.message || "Could not save expense.",
        );
      }

      let sheetMessage =
        "Expense saved in Supabase and Google Sheets.";

      try {
        const sheetResponse = await fetch("/api/sheets", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "save",
            resource: "Expenses",
            record: {
              id: savedExpense.id,
              title: savedExpense.title,
              category: savedExpense.category,
              amount: savedExpense.amount,
              date: savedExpense.expense_date,
              notes: savedExpense.notes || "",
            },
          }),
        });

        const sheetData = await sheetResponse.json();

        if (!sheetResponse.ok || !sheetData.success) {
          sheetMessage =
            "Expense saved in Supabase, but Google Sheets failed.";
        }
      } catch {
        sheetMessage =
          "Expense saved in Supabase, but Google Sheets failed.";
      }

      setExpenses((currentExpenses) => [
        savedExpense as Expense,
        ...currentExpenses,
      ]);

      setTitle("");
      setCategory("Software");
      setAmount("");
      setDate("");
      setNotes("");
      setMessage(sheetMessage);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not save expense.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteExpense(id: string) {
    const confirmed = window.confirm("Delete this expense?");

    if (!confirmed) {
      return;
    }

    const workspaceId = await getMyWorkspaceId();

    const { error } = await supabase
      .from("expenses")
      .delete()
      .eq("id", id)
      .eq("workspace_id", workspaceId);

    if (error) {
      setMessage(error.message);
      return;
    }

    setExpenses((currentExpenses) =>
      currentExpenses.filter((expense) => expense.id !== id),
    );

    setMessage("Expense deleted from secure database.");
  }

  const totalExpenses = expenses.reduce(
    (total, expense) => total + Number(expense.amount),
    0,
  );

  const currentMonth = new Date().toISOString().slice(0, 7);

  const monthlyExpenses = expenses
    .filter((expense) =>
      expense.expense_date.startsWith(currentMonth),
    )
    .reduce(
      (total, expense) => total + Number(expense.amount),
      0,
    );

  const categoryTotals = categories.map((expenseCategory) => ({
    category: expenseCategory,
    total: expenses
      .filter((expense) => expense.category === expenseCategory)
      .reduce(
        (total, expense) => total + Number(expense.amount),
        0,
      ),
  }));

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm uppercase tracking-widest text-cyan-400">
              BusinessPilot AI
            </p>

            <h1 className="mt-2 text-4xl font-bold">
              Expense Tracker
            </h1>

            <p className="mt-2 text-slate-400">
              Private expenses with Google Sheets backup.
            </p>
          </div>

          <a
            href="/"
            className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:border-cyan-400"
          >
            Back to Chat
          </a>
        </header>

        <section className="mb-8 rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="mb-5 text-2xl font-bold">
            Add an Expense
          </h2>

          <form onSubmit={addExpense} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Expense title *"
                required
                className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none placeholder:text-slate-500 focus:border-cyan-400"
              />

              <input
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                placeholder="Amount *"
                required
                className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none placeholder:text-slate-500 focus:border-cyan-400"
              />

              <select
                value={category}
                onChange={(event) =>
                  setCategory(
                    event.target.value as ExpenseCategory,
                  )
                }
                className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400"
              >
                {categories.map((expenseCategory) => (
                  <option
                    key={expenseCategory}
                    value={expenseCategory}
                  >
                    {expenseCategory}
                  </option>
                ))}
              </select>

              <input
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                required
                className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400"
              />
            </div>

            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Notes"
              rows={4}
              className="w-full resize-none rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none placeholder:text-slate-500 focus:border-cyan-400"
            />

            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-xl bg-cyan-400 px-5 py-3 font-bold text-slate-950 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Expense"}
            </button>
          </form>

          {message && (
            <p className="mt-4 rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-4 text-cyan-300">
              {message}
            </p>
          )}
        </section>

        <section className="mb-8 grid gap-4 sm:grid-cols-3">
          <SummaryCard
            title="Total Expenses"
            value={money(totalExpenses)}
          />

          <SummaryCard
            title="This Month"
            value={money(monthlyExpenses)}
          />

          <SummaryCard
            title="Expense Count"
            value={expenses.length}
          />
        </section>

        <section className="mb-8 rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="mb-5 text-2xl font-bold">
            Category Summary
          </h2>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categoryTotals.map((item) => (
              <div
                key={item.category}
                className="rounded-xl border border-slate-700 bg-slate-950 p-4"
              >
                <p className="text-sm text-slate-400">
                  {item.category}
                </p>

                <p className="mt-2 text-2xl font-bold text-cyan-300">
                  {money(item.total)}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
          <div className="border-b border-slate-800 px-6 py-5">
            <h2 className="text-2xl font-bold">
              Private Workspace Expenses
            </h2>
          </div>

          {loading ? (
            <p className="p-8 text-slate-400">
              Loading secure expenses...
            </p>
          ) : expenses.length === 0 ? (
            <p className="p-8 text-slate-400">
              No expenses yet. Add your first expense above.
            </p>
          ) : (
            <div className="divide-y divide-slate-800">
              {expenses.map((expense) => (
                <article
                  key={expense.id}
                  className="flex flex-col gap-4 px-6 py-5 lg:flex-row lg:items-center lg:justify-between"
                >
                  <div>
                    <h3 className="text-lg font-bold">
                      {expense.title}
                    </h3>

                    <p className="mt-1 text-sm text-cyan-300">
                      {expense.category} • {expense.expense_date}
                    </p>

                    {expense.notes && (
                      <p className="mt-2 whitespace-pre-wrap text-sm text-slate-400">
                        {expense.notes}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-4">
                    <p className="text-xl font-bold text-red-300">
                      {money(Number(expense.amount))}
                    </p>

                    <button
                      type="button"
                      onClick={() => deleteExpense(expense.id)}
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
