"use client";

import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";
import { supabase } from "@/lib/supabase";
import { getMyWorkspaceId } from "@/lib/workspace";

type Task = {
  id: string;
  title: string;
  description: string | null;
  priority: string | null;
  due_date: string | null;
  completed: boolean;
  created_at: string;
};

type TaskForm = {
  title: string;
  description: string;
  priority: string;
  dueDate: string;
};

const emptyForm: TaskForm = {
  title: "",
  description: "",
  priority: "Medium",
  dueDate: "",
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [form, setForm] = useState<TaskForm>(emptyForm);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadTasks();
  }, []);

  async function loadTasks() {
    setLoading(true);
    setError("");

    try {
      const workspaceId = await getMyWorkspaceId();

      const { data, error: loadError } = await supabase
        .from("tasks")
        .select(
          "id, title, description, priority, due_date, completed, created_at",
        )
        .eq("workspace_id", workspaceId)
        .order("completed", { ascending: true })
        .order("due_date", { ascending: true });

      if (loadError) {
        throw new Error(loadError.message);
      }

      setTasks((data || []) as Task[]);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Tasks could not be loaded.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function saveToSheets(task: Task) {
    try {
      const response = await fetch("/api/sheets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "save",
          resource: "Tasks",
          record: {
            id: task.id,
            title: task.title,
            description: task.description || "",
            priority: task.priority || "",
            dueDate: task.due_date || "",
            completed: task.completed,
            createdAt: task.created_at,
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

    if (!form.title.trim()) {
      setError("Task title is required.");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const workspaceId = await getMyWorkspaceId();

      const { data, error: insertError } = await supabase
        .from("tasks")
        .insert({
          workspace_id: workspaceId,
          title: form.title.trim(),
          description: form.description.trim(),
          priority: form.priority,
          due_date: form.dueDate || null,
          completed: false,
        })
        .select()
        .single();

      if (insertError || !data) {
        throw new Error(
          insertError?.message || "Task could not be saved.",
        );
      }

      const task = data as Task;
      const backupWorked = await saveToSheets(task);

      setTasks((current) => [task, ...current]);
      setForm(emptyForm);
      setShowForm(false);

      setMessage(
        backupWorked
          ? "Task saved securely and backed up to Google Sheets."
          : "Task saved in Supabase, but Google Sheets backup failed.",
      );
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Task could not be saved.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function toggleTask(task: Task) {
    setError("");
    setMessage("");

    const nextCompleted = !task.completed;

    const { data, error: updateError } = await supabase
      .from("tasks")
      .update({
        completed: nextCompleted,
      })
      .eq("id", task.id)
      .select()
      .single();

    if (updateError || !data) {
      setError(
        updateError?.message || "Task could not be updated.",
      );
      return;
    }

    setTasks((current) =>
      current.map((item) =>
        item.id === task.id ? (data as Task) : item,
      ),
    );

    setMessage(
      nextCompleted
        ? "Task marked as completed."
        : "Task moved back to pending.",
    );
  }

  async function deleteTask(taskId: string) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this task?",
    );

    if (!confirmed) {
      return;
    }

    const { error: deleteError } = await supabase
      .from("tasks")
      .delete()
      .eq("id", taskId);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    setTasks((current) =>
      current.filter((task) => task.id !== taskId),
    );

    setMessage("Task deleted successfully.");
  }

  const filteredTasks = useMemo(() => {
    const query = search.trim().toLowerCase();

    return tasks.filter((task) => {
      const matchesSearch =
        !query ||
        task.title.toLowerCase().includes(query) ||
        task.description?.toLowerCase().includes(query);

      const matchesStatus =
        filter === "All" ||
        (filter === "Pending" && !task.completed) ||
        (filter === "Completed" && task.completed);

      const matchesPriority =
        priorityFilter === "All" ||
        task.priority === priorityFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesPriority
      );
    });
  }, [tasks, search, filter, priorityFilter]);

  const pendingTasks = tasks.filter(
    (task) => !task.completed,
  ).length;

  const completedTasks = tasks.filter(
    (task) => task.completed,
  ).length;

  const highPriorityTasks = tasks.filter(
    (task) =>
      !task.completed &&
      task.priority?.toLowerCase() === "high",
  ).length;

  return (
    <main className="min-h-screen bg-[#050816] px-4 py-6 text-white sm:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-300 via-blue-500 to-violet-600 text-xl font-black text-slate-950 shadow-lg shadow-cyan-500/20">
                ✓
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-[0.25em] text-cyan-300">
                  Operations workspace
                </p>

                <h1 className="mt-1 text-3xl font-black tracking-tight sm:text-4xl">
                  Tasks
                </h1>
              </div>
            </div>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-500">
              Organize priorities, keep work moving, and make sure
              nothing important gets missed.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setShowForm((current) => !current);
              setError("");
              setMessage("");
            }}
            className="rounded-xl bg-gradient-to-r from-cyan-300 to-blue-500 px-5 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-cyan-500/10 transition hover:from-cyan-200 hover:to-blue-400"
          >
            {showForm ? "Close form" : "+ Create task"}
          </button>
        </header>

        <section className="mt-8 grid gap-4 sm:grid-cols-3">
          <SummaryCard
            label="Pending tasks"
            value={pendingTasks}
            icon="◷"
            tone="cyan"
          />

          <SummaryCard
            label="Completed"
            value={completedTasks}
            icon="✓"
            tone="emerald"
          />

          <SummaryCard
            label="High priority"
            value={highPriorityTasks}
            icon="!"
            tone="rose"
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
          <section className="mt-6 rounded-3xl border border-cyan-400/20 bg-gradient-to-br from-cyan-400/[0.1] to-white/[0.04] p-6 shadow-2xl shadow-black/20 sm:p-8">
            <div className="mb-6">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">
                New work item
              </p>

              <h2 className="mt-2 text-2xl font-black">
                Create a task
              </h2>
            </div>

            <form
              onSubmit={handleSubmit}
              className="grid gap-4 md:grid-cols-2"
            >
              <Field
                label="Task title"
                value={form.title}
                placeholder="Follow up with client"
                onChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    title: value,
                  }))
                }
              />

              <label className="block">
                <span className="mb-2 block text-xs font-semibold text-slate-400">
                  Priority
                </span>

                <select
                  value={form.priority}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      priority: event.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400/50"
                >
                  <option className="bg-slate-900">
                    Low
                  </option>

                  <option className="bg-slate-900">
                    Medium
                  </option>

                  <option className="bg-slate-900">
                    High
                  </option>
                </select>
              </label>

              <label className="block md:col-span-2">
                <span className="mb-2 block text-xs font-semibold text-slate-400">
                  Description
                </span>

                <textarea
                  value={form.description}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  rows={3}
                  placeholder="Explain what needs to be done..."
                  className="w-full resize-none rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-cyan-400/50"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-semibold text-slate-400">
                  Due date
                </span>

                <input
                  type="date"
                  value={form.dueDate}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      dueDate: event.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400/50"
                />
              </label>

              <div className="flex items-end gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-cyan-300 px-5 py-3 text-sm font-bold text-slate-950 disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save task"}
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
                Work management
              </p>

              <h2 className="mt-2 text-2xl font-black">
                Your task board
              </h2>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search tasks..."
                className="rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-cyan-400/50"
              />

              <select
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
                className="rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-slate-300 outline-none focus:border-cyan-400/50"
              >
                <option className="bg-slate-900">All</option>
                <option className="bg-slate-900">Pending</option>
                <option className="bg-slate-900">Completed</option>
              </select>

              <select
                value={priorityFilter}
                onChange={(event) =>
                  setPriorityFilter(event.target.value)
                }
                className="rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-slate-300 outline-none focus:border-cyan-400/50"
              >
                <option className="bg-slate-900">All</option>
                <option className="bg-slate-900">High</option>
                <option className="bg-slate-900">Medium</option>
                <option className="bg-slate-900">Low</option>
              </select>
            </div>
          </div>

          <div className="mt-6">
            {loading ? (
              <LoadingRows />
            ) : filteredTasks.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 p-10 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-400/10 text-2xl text-cyan-300">
                  ✓
                </div>

                <h3 className="mt-5 font-bold text-slate-200">
                  No tasks found
                </h3>

                <p className="mt-2 text-sm text-slate-600">
                  Create a task or change your filters.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                {filteredTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onToggle={() => toggleTask(task)}
                    onDelete={() => deleteTask(task.id)}
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
  tone,
}: {
  label: string;
  value: number;
  icon: string;
  tone: "cyan" | "emerald" | "rose";
}) {
  const colors = {
    cyan: "bg-cyan-400/10 text-cyan-300",
    emerald: "bg-emerald-400/10 text-emerald-300",
    rose: "bg-rose-400/10 text-rose-300",
  };

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
      <div
        className={`flex h-11 w-11 items-center justify-center rounded-2xl text-lg ${colors[tone]}`}
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

function TaskCard({
  task,
  onToggle,
  onDelete,
}: {
  task: Task;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const isHigh =
    task.priority?.toLowerCase() === "high";

  const isMedium =
    task.priority?.toLowerCase() === "medium";

  const priorityClass = isHigh
    ? "bg-rose-400/10 text-rose-300"
    : isMedium
      ? "bg-amber-400/10 text-amber-300"
      : "bg-cyan-400/10 text-cyan-300";

  const overdue =
    task.due_date &&
    !task.completed &&
    new Date(task.due_date) < new Date();

  return (
    <article
      className={`rounded-3xl border p-5 transition ${
        task.completed
          ? "border-emerald-400/15 bg-emerald-400/[0.04]"
          : "border-white/10 bg-slate-950/30 hover:border-cyan-400/30 hover:bg-cyan-400/[0.04]"
      }`}
    >
      <div className="flex items-start gap-4">
        <button
          type="button"
          onClick={onToggle}
          aria-label={
            task.completed
              ? "Mark task as pending"
              : "Mark task as completed"
          }
          className={`mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border text-sm font-bold transition ${
            task.completed
              ? "border-emerald-300 bg-emerald-300 text-slate-950"
              : "border-white/20 text-transparent hover:border-cyan-300"
          }`}
        >
          ✓
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3
              className={`font-bold ${
                task.completed
                  ? "text-slate-500 line-through"
                  : "text-slate-100"
              }`}
            >
              {task.title}
            </h3>

            <span
              className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${priorityClass}`}
            >
              {task.priority || "Medium"}
            </span>
          </div>

          {task.description && (
            <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-500">
              {task.description}
            </p>
          )}

          <div className="mt-5 flex flex-wrap items-center gap-3 text-xs">
            {task.due_date ? (
              <span
                className={
                  overdue
                    ? "font-semibold text-rose-300"
                    : "text-slate-600"
                }
              >
                Due {formatDate(task.due_date)}
                {overdue ? " · Overdue" : ""}
              </span>
            ) : (
              <span className="text-slate-700">
                No due date
              </span>
            )}

            <span
              className={
                task.completed
                  ? "text-emerald-300"
                  : "text-cyan-300"
              }
            >
              {task.completed ? "Completed" : "In progress"}
            </span>
          </div>
        </div>

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

function Field({
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
    <label className="block">
      <span className="mb-2 block text-xs font-semibold text-slate-400">
        {label}
      </span>

      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-cyan-400/50"
      />
    </label>
  );
}

function formatDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString(
    "en-US",
    {
      month: "short",
      day: "numeric",
      year: "numeric",
    },
  );
}

function LoadingRows() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {[1, 2, 3, 4].map((item) => (
        <div
          key={item}
          className="h-48 animate-pulse rounded-3xl bg-white/[0.05]"
        />
      ))}
    </div>
  );
}
