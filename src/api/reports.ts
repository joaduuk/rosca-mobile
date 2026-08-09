import apiClient from "./client";

export type GroupSummary = {
  total_collected?: number;
  total_paid_out?: number;
  balance?: number;
  total_cycles_completed?: number;
  current_cycle?: number;
  current_cycle_paid?: number;
  total_members?: number;
  current_cycle_pending?: number;
  next_payout_date?: string;
  [key: string]: any;
};

export type Payout = {
  id: string;
  cycle_number: number;
  recipient_name: string;
  amount: number;
  payout_date: string;
  status: "paid" | "scheduled" | string;
  paid_count: number;
  contributions_count: number;
  all_paid: boolean;
};

export async function getGroupSummary(groupId: string): Promise<GroupSummary | null> {
  try {
    const res = await apiClient.get(`/groups/${groupId}/summary`);
    return res.data;
  } catch {
    return null;
  }
}

export async function getPayoutSchedule(groupId: string): Promise<Payout[]> {
  try {
    const res = await apiClient.get(`/groups/${groupId}/payout-schedule`);
    return Array.isArray(res.data) ? res.data : [];
  } catch {
    return [];
  }
}