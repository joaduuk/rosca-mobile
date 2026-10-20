import apiClient from "./client";

export type Contribution = {
  id: string;
  group_id: string;
  membership_id: string;
  round_number: number;
  cycle_number: number;
  amount: number;
  currency: string;
  due_date: string;
  status: "pending" | "paid" | string;
  payment_method?: string;
  notes?: string;
  transaction_reference?: string;
  paid_date?: string | null;
  created_at: string;
  exchange_rate?: number;
  base_currency_amount?: number;
  member_name?: string;
  member_email?: string;
};

export type RecordContributionInput = {
  membership_id: string;
  cycle_number: number;
  amount: number;
  currency: string;
  due_date: string;
  status: string;
  payment_method?: string;
  notes?: string;
  transaction_reference?: string;
};

export async function listContributions(
  groupId: string,
  opts?: { cycleNumber?: number; membershipId?: string }
): Promise<Contribution[]> {
  const res = await apiClient.get(`/groups/${groupId}/contributions`, {
    params: {
      cycle_number: opts?.cycleNumber,
      member_id: opts?.membershipId,
    },
  });
  return res.data;
}

export async function recordContribution(
  groupId: string,
  input: RecordContributionInput
): Promise<Contribution> {
  const res = await apiClient.post(`/groups/${groupId}/contributions`, input);
  return res.data;
}

export async function processPayout(groupId: string, cycleNumber: number): Promise<void> {
  await apiClient.post(`/groups/${groupId}/process-payout/${cycleNumber}`);
}