import apiClient from "./client";

export type Group = {
  id: string;
  name: string;
  description: string;
  contribution_amount: number;
  contribution_period: "daily" | "weekly" | "monthly" | string;
  member_count: number;
  rosca_type: string;
  currency: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  current_cycle: number;
  total_cycles_completed: number;
  next_payout_date: string;
  total_collected: number;
  total_paid_out: number;
  is_active: boolean;
  group_status: "active" | "paused" | "ended" | "pending_decision" | string;
  cycle_decision: string;
  cycle_decision_note: string;
};

export type Member = {
  id: string;
  group_id: string;
  user_id: string | null;
  is_admin: boolean;
  payout_order: number;
  guarantor_id: string | null;
  joined_at: string;
  is_active: boolean;
  member_status: "registered" | "offline" | string;
  membership_status?: "active" | "exit_requested" | "exited" | string;
  user_email: string | null;
  user_name: string | null;
  guarantor_email: string | null;
  guarantor_name: string | null;
};

export type CreateGroupInput = {
  name: string;
  description: string;
  contribution_amount: number;
  contribution_period: string;
  member_count: number;
  rosca_type: string;
  currency: string;
};

export type ExitRequest = {
  membership_id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  exit_requested_at: string;
  exit_reason: string;
  exit_approved: boolean | null;
};

export type WaitlistEntry = {
  membership_id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  waitlist_requested_at: string;
  waitlist_note: string;
  waitlist_approved: boolean | null;
};

export async function listGroups(): Promise<Group[]> {
  const res = await apiClient.get("/groups/");
  return res.data;
}

export async function getGroup(groupId: string): Promise<Group> {
  const res = await apiClient.get(`/groups/${groupId}`);
  return res.data;
}

export async function listMembers(groupId: string): Promise<Member[]> {
  const res = await apiClient.get(`/groups/${groupId}/members`);
  return res.data;
}

export async function createGroup(input: CreateGroupInput): Promise<Group> {
  const res = await apiClient.post("/groups/", input);
  return res.data;
}

export async function addOfflineMember(
  groupId: string,
  input: { name: string; email?: string; phone?: string }
): Promise<Member> {
  const res = await apiClient.post(`/groups/${groupId}/members/offline`, input);
  return res.data;
}

export async function addRegisteredMember(
  groupId: string,
  userId: string,
  opts?: { guarantorUserId?: string; isAdmin?: boolean }
): Promise<Member> {
  const res = await apiClient.post(`/groups/${groupId}/members/${userId}`, null, {
    params: {
      guarantor_user_id: opts?.guarantorUserId,
      is_admin: opts?.isAdmin ?? false,
    },
  });
  return res.data;
}

export async function removeMember(groupId: string, membershipId: string): Promise<void> {
  await apiClient.delete(`/groups/${groupId}/members/${membershipId}`);
}

export async function reorderMember(
  groupId: string,
  membershipId: string,
  direction: "up" | "down"
): Promise<void> {
  await apiClient.put(`/groups/${groupId}/members/${membershipId}/reorder`, null, {
    params: { direction },
  });
}

// ── Cycle Decision ──────────────────────────────────────────────
export async function makeCycleDecision(
  groupId: string,
  decision: "continue" | "pause" | "end",
  note?: string
): Promise<void> {
  await apiClient.post(`/groups/${groupId}/cycle-decision`, { decision, note });
}

export async function resumeGroup(groupId: string): Promise<void> {
  await apiClient.post(`/groups/${groupId}/resume`);
}

// ── Exit Requests ────────────────────────────────────────────────
export async function requestExit(groupId: string, reason?: string): Promise<void> {
  await apiClient.post(`/groups/${groupId}/request-exit`, { reason });
}

export async function cancelExit(groupId: string): Promise<void> {
  await apiClient.delete(`/groups/${groupId}/cancel-exit`);
}

export async function listExitRequests(groupId: string): Promise<ExitRequest[]> {
  const res = await apiClient.get(`/groups/${groupId}/exit-requests`);
  return res.data;
}

export async function decideExitRequest(
  groupId: string,
  userId: string,
  approved: boolean,
  note?: string
): Promise<void> {
  await apiClient.put(`/groups/${groupId}/exit-requests/${userId}`, { approved, note });
}

// ── Waitlist ─────────────────────────────────────────────────────
export async function listWaitlist(groupId: string): Promise<WaitlistEntry[]> {
  const res = await apiClient.get(`/groups/${groupId}/waitlist`);
  return res.data;
}

export async function decideWaitlist(groupId: string, userId: string, approved: boolean): Promise<void> {
  await apiClient.put(`/groups/${groupId}/waitlist/${userId}`, { approved });
}