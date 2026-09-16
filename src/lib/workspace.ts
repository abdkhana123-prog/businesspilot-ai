import { supabase } from "@/lib/supabase";

export async function getMyWorkspaceId() {
  const { data: userData, error: userError } =
    await supabase.auth.getUser();

  if (userError || !userData.user) {
    throw new Error("You must be logged in.");
  }

  const { data: rpcWorkspaceId, error: rpcError } =
    await supabase.rpc("ensure_my_workspace");

  if (rpcError) {
    throw new Error(rpcError.message);
  }

  if (rpcWorkspaceId) {
    return rpcWorkspaceId as string;
  }

  const { data: membership, error: membershipError } =
    await supabase
      .from("workspace_members")
      .select("workspace_id")
      .eq("user_id", userData.user.id)
      .limit(1)
      .maybeSingle();

  if (membershipError || !membership) {
    throw new Error("No workspace was found for this account.");
  }

  return membership.workspace_id as string;
}
