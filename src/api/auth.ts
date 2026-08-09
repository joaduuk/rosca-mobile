import apiClient from "./client";

export async function forgotPassword(email: string): Promise<void> {
  await apiClient.post("/auth/forgot-password", null, { params: { email } });
}

export async function verifyResetToken(token: string): Promise<boolean> {
  try {
    await apiClient.get("/auth/verify-reset-token", { params: { token } });
    return true;
  } catch {
    return false;
  }
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  await apiClient.post("/auth/reset-password", null, {
    params: { token, new_password: newPassword },
  });
}

export async function resendVerification(email: string): Promise<void> {
  await apiClient.post("/auth/resend-verification", null, { params: { email } });
}