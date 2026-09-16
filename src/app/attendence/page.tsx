"use client";

import { FormEvent, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { getMyWorkspaceId } from "@/lib/workspace";

type AttendanceStatus =
  | "Present"
  | "Absent"
  | "Late"
  | "Half Day"
  | "On Leave";

type AttendanceRecord = {
  id: string;
  workspace_id: string;
  employee_name: string;
  employee_email: string | null;
  attendance_date: string;
  attendance_status: AttendanceStatus;
  check_in: string | null;
  check_out: string | null;
  leave_type: string | null;
  leave_reason: string | null;
  notes: string | null;
  created_at: string;
};

const statuses: AttendanceStatus[] = [
  "Present",
  "Absent",
  "Late",
  "Half Day",
  "On Leave",
];

const leaveTypes = [
  "Sick Leave",
  "Annual Leave",
  "Casual Leave",
  "Unpaid Leave",
  "Other",
];

export default function AttendancePage() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [employeeName, setEmployeeName] = useState("");
  const [employeeEmail, setEmployeeEmail] = useState("");
  const [attendanceDate, setAttendanceDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [attendanceStatus, setAttendanceStatus] =
    useState<AttendanceStatus>("Present");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [leaveType, setLeaveType] = useState("");
  const [leaveReason, setLeaveReason] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    loadAttendance();
  }, []);

  async function loadAttendance() {
    setLoading(true);
    setMessage("");

    try {
      const workspaceId = await getMyWorkspaceId();

      const { data, error } = await supabase
        .from("staff_attendance")
        .select("*")
        .eq("workspace_id", workspaceId)
        .order("attendance_date", { ascending: false })
        .order("employee_name", { ascending: true });

      if (error) {
        throw new Error(error.message);
      }

      setRecords((data || []) as AttendanceRecord[]);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not load attendance records.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function addAttendance(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (
      !employeeName.trim() ||
      !employeeEmail.trim() ||
      !attendanceDate
    ) {
      setMessage(
        "Please enter employee name, email, and date.",
      );
      return;
    }

    if (
      attendanceStatus === "On Leave" &&
      (!leaveType || !leaveReason.trim())
    ) {
      setMessage(
        "Please select leave type and enter leave reason.",
      );
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const workspaceId = await getMyWorkspaceId();

      const { data: savedRecord, error } = await supabase
        .from("staff_attendance")
        .insert({
          workspace_id: workspaceId,
          employee_name: employeeName.trim(),
          employee_email: employeeEmail.trim().toLowerCase(),
          attendance_date: attendanceDate,
          attendance_status: attendanceStatus,
          check_in: checkIn || null,
          check_out: checkOut || null,
          leave_type:
            attendanceStatus === "On Leave"
              ? leaveType
              : null,
          leave_reason:
            attendanceStatus === "On Leave"
              ? leaveReason.trim()
              : null,
          notes: notes.trim() || null,
        })
        .select()
        .single();

      if (error || !savedRecord) {
        if (error?.code === "23505") {
          throw new Error(
            "Attendance for this employee and date already exists.",
          );
        }

        throw new Error(
          error?.message || "Could not save attendance.",
        );
      }

      let sheetMessage =
        "Attendance saved in Supabase and Google Sheets.";

      try {
        const sheetResponse = await fetch("/api/sheets", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "save",
            resource: "Attendance",
            record: {
              id: savedRecord.id,
              employeeName: savedRecord.employee_name,
              employeeEmail: savedRecord.employee_email || "",
              attendanceDate: savedRecord.attendance_date,
              attendanceStatus:
                savedRecord.attendance_status,
              checkIn: savedRecord.check_in || "",
              checkOut: savedRecord.check_out || "",
              leaveType: savedRecord.leave_type || "",
              leaveReason: savedRecord.leave_reason || "",
              notes: savedRecord.notes || "",
              createdAt: savedRecord.created_at,
            },
          }),
        });

        const sheetData = await sheetResponse.json();

        if (!sheetResponse.ok || !sheetData.success) {
          sheetMessage =
            "Attendance saved in Supabase, but Google Sheets backup failed.";
        }
      } catch {
        sheetMessage =
          "Attendance saved in Supabase, but Google Sheets backup failed.";
      }

      setRecords((currentRecords) => [
        savedRecord as AttendanceRecord,
        ...currentRecords,
      ]);

      clearForm();
      setMessage(sheetMessage);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not save attendance.",
      );
    } finally {
      setSaving(false);
    }
  }

  function clearForm() {
    setEmployeeName("");
    setEmployeeEmail("");
    setAttendanceDate(
      new Date().toISOString().slice(0, 10),
    );
    setAttendanceStatus("Present");
    setCheckIn("");
    setCheckOut("");
    setLeaveType("");
    setLeaveReason("");
    setNotes("");
  }

  async function updateStatus(
    record: AttendanceRecord,
    status: AttendanceStatus,
  ) {
    const workspaceId = await getMyWorkspaceId();

    const { data, error } = await supabase
      .from("staff_attendance")
      .update({
        attendance_status: status,
        leave_type: status === "On Leave"
          ? record.leave_type || "Other"
          : null,
        leave_reason: status === "On Leave"
          ? record.leave_reason || ""
          : null,
      })
      .eq("id", record.id)
      .eq("workspace_id", workspaceId)
      .select()
      .single();

    if (error || !data) {
      setMessage(
        error?.message || "Could not update attendance.",
      );
      return;
    }

    setRecords((currentRecords) =>
      currentRecords.map((item) =>
        item.id === record.id
          ? (data as AttendanceRecord)
          : item,
      ),
    );

    setMessage("Attendance status updated.");
  }

  async function deleteRecord(id: string) {
    const confirmed = window.confirm(
      "Delete this attendance record?",
    );

    if (!confirmed) {
      return;
    }

    const workspaceId = await getMyWorkspaceId();

    const { error } = await supabase
      .from("staff_attendance")
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

    setMessage("Attendance record deleted.");
  }

  const presentCount = records.filter(
    (record) => record.attendance_status === "Present",
  ).length;

  const absentCount = records.filter(
    (record) => record.attendance_status === "Absent",
  ).length;

  const leaveCount = records.filter(
    (record) => record.attendance_status === "On Leave",
  ).length;

  const lateCount = records.filter(
    (record) => record.attendance_status === "Late",
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
              Attendance & Leave
            </h1>

            <p className="mt-2 text-slate-400">
              Track staff attendance, working hours, and leave.
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
              href="/salary"
              className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:border-cyan-400"
            >
              Salary
            </a>

            <a
              href="/team"
              className="rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:border-cyan-400"
            >
              Team
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
            Add Attendance Record
          </h2>

          <form
            onSubmit={addAttendance}
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
              placeholder="Employee email *"
              required
              className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none placeholder:text-slate-500 focus:border-cyan-400"
            />

            <input
              type="date"
              value={attendanceDate}
              onChange={(event) =>
                setAttendanceDate(event.target.value)
              }
              required
              className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400"
            />

            <select
              value={attendanceStatus}
              onChange={(event) =>
                setAttendanceStatus(
                  event.target.value as AttendanceStatus,
                )
              }
              className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400"
            >
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>

            <input
              type="time"
              value={checkIn}
              onChange={(event) =>
                setCheckIn(event.target.value)
              }
              className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400"
            />

            <input
              type="time"
              value={checkOut}
              onChange={(event) =>
                setCheckOut(event.target.value)
              }
              className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400"
            />

            {attendanceStatus === "On Leave" && (
              <>
                <select
                  value={leaveType}
                  onChange={(event) =>
                    setLeaveType(event.target.value)
                  }
                  className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400"
                >
                  <option value="">Select leave type</option>

                  {leaveTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>

                <input
                  value={leaveReason}
                  onChange={(event) =>
                    setLeaveReason(event.target.value)
                  }
                  placeholder="Leave reason *"
                  className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none placeholder:text-slate-500 focus:border-cyan-400"
                />
              </>
            )}

            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Notes"
              rows={3}
              className="resize-none rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none placeholder:text-slate-500 focus:border-cyan-400 md:col-span-2"
            />

            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-cyan-400 px-5 py-3 font-bold text-slate-950 disabled:opacity-50 md:col-span-2"
            >
              {saving ? "Saving..." : "Save Attendance"}
            </button>
          </form>
        </section>

        <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard title="Present" value={presentCount} />
          <SummaryCard title="Absent" value={absentCount} />
          <SummaryCard title="Late" value={lateCount} />
          <SummaryCard title="On Leave" value={leaveCount} />
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
          <div className="border-b border-slate-800 px-6 py-5">
            <h2 className="text-2xl font-bold">
              Attendance Records
            </h2>
          </div>

          {loading ? (
            <p className="p-8 text-slate-400">
              Loading secure attendance records...
            </p>
          ) : records.length === 0 ? (
            <p className="p-8 text-slate-400">
              No attendance records yet.
            </p>
          ) : (
            <div className="divide-y divide-slate-800">
              {records.map((record) => (
                <article
                  key={record.id}
                  className="flex flex-col justify-between gap-4 px-6 py-5 lg:flex-row lg:items-center"
                >
                  <div>
                    <h3 className="text-lg font-bold">
                      {record.employee_name}
                    </h3>

                    <p className="mt-1 text-sm text-slate-400">
                      {record.employee_email}
                    </p>

                    <p className="mt-1 text-sm text-cyan-300">
                      {record.attendance_date}
                      {record.check_in
                        ? ` • In: ${record.check_in}`
                        : ""}
                      {record.check_out
                        ? ` • Out: ${record.check_out}`
                        : ""}
                    </p>

                    {record.leave_type && (
                      <p className="mt-1 text-sm text-yellow-300">
                        {record.leave_type}:{" "}
                        {record.leave_reason || "No reason"}
                      </p>
                    )}

                    {record.notes && (
                      <p className="mt-1 text-sm text-slate-500">
                        {record.notes}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <select
                      value={record.attendance_status}
                      onChange={(event) =>
                        updateStatus(
                          record,
                          event.target.value as AttendanceStatus,
                        )
                      }
                      className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-cyan-400"
                    >
                      {statuses.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
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
  value: number;
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
