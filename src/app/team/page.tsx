"use client";

import { FormEvent, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type TeamRole = {
  id: string;
  workspace_id: string;
  user_id: string;
  display_name: string;
  role:
    | "Owner"
    | "Manager"
    | "Salesperson"
    | "Accountant"
    | "Staff";
  active: boolean;
  created_at: string;
};

type Invitation = {
  id: string;
  email: string;
  role: "Manager" | "Salesperson" | "Accountant" | "Staff";
  status: "pending" | "accepted" | "cancelled" | "expired";
  expires_at: string;
  created_at: string;
};

type InviteResult = {
  invitation_id: string;
  email: string;
  role: string;
  token: string;
  expires_at: string;
};

const inviteRoles = [
  "Manager",
  "Salesperson",
  "Accountant",
  "Staff",
] as const;

export default function TeamPage() {
  const [myRole, setMyRole] = useState<TeamRole | null>(null);
  const [members, setMembers] = useState<TeamRole[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>(
    [],
  );

  const [email, setEmail] = useState("");
  const [role, setRole] =
    useState<(typeof inviteRoles)[number]>("Staff");

  const [loading, setLoading] = useState(true);
  const [creatingProfile, setCreatingProfile] = useState(false);
  const [sendingInvite, setSendingInvite] = useState(false);
  const [message, setMessage] = useState("");
  const [inviteLink, setInviteLink] = useState("");

  useEffect(() => {
    loadTeam();
  }, []);

  async function loadTeam() {
    setLoading(true);
    setMessage("");

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error("Please log in first.");
      }

      const { data: roleData, error: roleError } =
        await supabase
          .from("team_roles")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

      if (roleError) {
        throw new Error(roleError.message);
      }

      if (!roleData) {
        setMyRole(null);
        setMembers([]);
        setInvitations([]);
        return;
      }

      const currentRole = roleData as TeamRole;
      setMyRole(currentRole);

      const { data: teamData, error: teamError } =
        await supabase
          .from("team_roles")
          .select("*")
          .eq("workspace_id", currentRole.workspace_id)
          .order("created_at", { ascending: true });

      if (teamError) {
        throw new Error(teamError.message);
      }

      setMembers((teamData || []) as TeamRole[]);

      if (currentRole.role === "Owner") {
        const { data: invitationData, error: invitationError } =
          await supabase
            .from("team_invitations")
            .select(
              "id, email, role, status, expires_at, created_at",
            )
            .eq("workspace_id", currentRole.workspace_id)
            .order("created_at", { ascending: false });

        if (invitationError) {
          throw new Error(invitationError.message);
        }

        setInvitations((invitationData || []) as Invitation[]);
      }
    } catch (error) {
  console.error("Invitation error:", error);

  const actualError =
    error &&
    typeof error === "object" &&
    "message" in error
      ? String(
          (error as { message?: unknown }).message ||
            "Unknown invitation error",
        )
      : String(error);

  setMessage(`Invitation failed: ${actualError}`);
} finally {

      setLoading(false);
    }
  }

  async function createMyTeamProfile() {
    setCreatingProfile(true);
    setMessage("");

    try {
      const { data, error } = await supabase.rpc(
        "ensure_my_team_role",
      );

      if (error) {
        throw new Error(error.message);
      }

      if (!data) {
        throw new Error("Team profile was not created.");
      }

      setMessage("Your team profile was created successfully.");
      await loadTeam();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not create team profile.",
      );
    } finally {
      setCreatingProfile(false);
    }
  }

  async function createInvitation(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!email.trim()) {
      setMessage("Please enter the member email.");
      return;
    }

    setSendingInvite(true);
    setMessage("");
    setInviteLink("");

    try {
      const { data, error } = await supabase.rpc(
        "create_team_invitation",
        {
          invitation_email: email.trim(),
          invitation_role: role,
        },
      );

      if (error) {
        throw new Error(error.message);
      }

      const result = data as InviteResult;

      if (!result?.token) {
        throw new Error("Invitation token was not returned.");
      }

      const link = `${window.location.origin}/invite?token=${encodeURIComponent(
        result.token,
      )}&email=${encodeURIComponent(result.email)}`;

      setInviteLink(link);
      setEmail("");
      setRole("Staff");
      setMessage(
        `Invitation created for ${result.email}. Copy the link and send it to the team member.`,
      );

      await loadTeam();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not create invitation.",
      );
    } finally {
      setSendingInvite(false);
    }
  }

  async function copyInviteLink() {
    if (!inviteLink) {
      return;
    }

    await navigator.clipboard.writeText(inviteLink);
    setMessage("Invitation link copied.");
  }

  async function cancelInvitation(id: string) {
    const confirmed = window.confirm(
      "Cancel this invitation?",
    );

    if (!confirmed) {
      return;
    }

    const { error } = await supabase
      .from("team_invitations")
      .update({ status: "cancelled" })
      .eq("id", id)
      .eq("status", "pending");

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Invitation cancelled.");
    await loadTeam();
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 p-8 text-white">
        <p className="text-slate-400">
          Loading team workspace...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm uppercase tracking-widest text-cyan-400">
              BusinessPilot AI
            </p>

            <h1 className="mt-2 text-4xl font-bold">
              Team Management
            </h1>

            <p className="mt-2 text-slate-400">
              Manage workspace members and invitations.
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

        {message && (
          <div className="mb-6 rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-4 text-cyan-300">
            {message}
          </div>
        )}

        {!myRole ? (
          <section className="rounded-2xl border border-slate-800 bg-slate-900 p-8">
            <h2 className="text-2xl font-bold">
              Create your team profile
            </h2>

            <p className="mt-3 text-slate-400">
              You must create your workspace profile before managing
              team members.
            </p>

            <button
              type="button"
              onClick={createMyTeamProfile}
              disabled={creatingProfile}
              className="mt-6 rounded-xl bg-cyan-400 px-5 py-3 font-bold text-slate-950 disabled:opacity-50"
            >
              {creatingProfile
                ? "Creating profile..."
                : "Create My Team Profile"}
            </button>
          </section>
        ) : (
          <>
            <section className="mb-8 rounded-2xl border border-cyan-500/30 bg-cyan-500/10 p-6">
              <p className="text-sm text-slate-400">
                Your role
              </p>

              <div className="mt-2 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <h2 className="text-2xl font-bold">
                  {myRole.display_name}
                </h2>

                <span className="w-fit rounded-full bg-cyan-400 px-4 py-2 text-sm font-bold text-slate-950">
                  {myRole.role}
                </span>
              </div>
            </section>

            {myRole.role === "Owner" && (
              <section className="mb-8 rounded-2xl border border-slate-800 bg-slate-900 p-6">
                <h2 className="text-2xl font-bold">
                  Invite Team Member
                </h2>

                <p className="mt-2 text-sm text-slate-400">
                  Create a secure invitation link. The link expires
                  after 7 days.
                </p>

                <form
                  onSubmit={createInvitation}
                  className="mt-5 grid gap-4 md:grid-cols-[1fr_220px_auto]"
                >
                  <input
                    type="email"
                    value={email}
                    onChange={(event) =>
                      setEmail(event.target.value)
                    }
                    placeholder="member@example.com"
                    required
                    className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none placeholder:text-slate-500 focus:border-cyan-400"
                  />

                  <select
                    value={role}
                    onChange={(event) =>
                      setRole(
                        event.target.value as (typeof inviteRoles)[number],
                      )
                    }
                    className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400"
                  >
                    {inviteRoles.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>

                  <button
                    type="submit"
                    disabled={sendingInvite}
                    className="rounded-xl bg-cyan-400 px-5 py-3 font-bold text-slate-950 disabled:opacity-50"
                  >
                    {sendingInvite
                      ? "Creating..."
                      : "Create Invite"}
                  </button>
                </form>

                {inviteLink && (
                  <div className="mt-5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
                    <p className="text-sm font-semibold text-emerald-300">
                      Invite link ready
                    </p>

                    <input
                      readOnly
                      value={inviteLink}
                      className="mt-3 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-300"
                    />

                    <button
                      type="button"
                      onClick={copyInviteLink}
                      className="mt-3 rounded-lg border border-emerald-500/40 px-4 py-2 text-sm text-emerald-300 hover:bg-emerald-500/10"
                    >
                      Copy Invite Link
                    </button>
                  </div>
                )}
              </section>
            )}

            <section className="mb-8 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
              <div className="border-b border-slate-800 px-6 py-5">
                <h2 className="text-2xl font-bold">
                  Workspace Team
                </h2>
              </div>

              {members.length === 0 ? (
                <p className="p-8 text-slate-400">
                  No team members found.
                </p>
              ) : (
                <div className="divide-y divide-slate-800">
                  {members.map((member) => (
                    <article
                      key={member.id}
                      className="flex flex-col justify-between gap-3 px-6 py-5 sm:flex-row sm:items-center"
                    >
                      <div>
                        <h3 className="font-bold">
                          {member.display_name}
                        </h3>

                        <p className="mt-1 text-xs text-slate-500">
                          Joined{" "}
                          {new Date(
                            member.created_at,
                          ).toLocaleDateString()}
                        </p>
                      </div>

                      <span className="w-fit rounded-full bg-emerald-500/10 px-3 py-1 text-xs text-emerald-300">
                        {member.role} •{" "}
                        {member.active ? "Active" : "Inactive"}
                      </span>
                    </article>
                  ))}
                </div>
              )}
            </section>

            {myRole.role === "Owner" && (
              <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
                <div className="border-b border-slate-800 px-6 py-5">
                  <h2 className="text-2xl font-bold">
                    Invitations
                  </h2>
                </div>

                {invitations.length === 0 ? (
                  <p className="p-8 text-slate-400">
                    No invitations created yet.
                  </p>
                ) : (
                  <div className="divide-y divide-slate-800">
                    {invitations.map((invitation) => (
                      <article
                        key={invitation.id}
                        className="flex flex-col justify-between gap-4 px-6 py-5 sm:flex-row sm:items-center"
                      >
                        <div>
                          <p className="font-semibold">
                            {invitation.email}
                          </p>

                          <p className="mt-1 text-sm text-cyan-300">
                            {invitation.role} •{" "}
                            {invitation.status}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            Expires:{" "}
                            {new Date(
                              invitation.expires_at,
                            ).toLocaleDateString()}
                          </p>
                        </div>

                        {invitation.status === "pending" && (
                          <button
                            type="button"
                            onClick={() =>
                              cancelInvitation(invitation.id)
                            }
                            className="rounded-lg border border-red-500/40 px-3 py-2 text-sm text-red-300 hover:bg-red-500/10"
                          >
                            Cancel
                          </button>
                        )}
                      </article>
                    ))}
                  </div>
                )}
              </section>
            )}
          </>
        )}
      </div>
    </main>
  );
}
