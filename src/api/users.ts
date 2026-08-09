import apiClient from "./client";

export type UserProfile = {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  is_active: boolean;
  role: string;
  created_at: string;
  updated_at: string;
  [key: string]: any;
};

export async function getMyProfile(): Promise<UserProfile> {
  const res = await apiClient.get("/users/me");
  return res.data;
}

export async function updateMyProfile(fields: {
  full_name?: string;
  phone?: string;
  current_password?: string;
  new_password?: string;
}): Promise<UserProfile> {
  const res = await apiClient.put("/users/me", null, { params: fields });
  return res.data;
}

export async function uploadAvatar(uri: string): Promise<{ avatar_url?: string }> {
  const formData = new FormData();
  const filename = uri.split("/").pop() || "avatar.jpg";
  const match = /\.(\w+)$/.exec(filename);
  const type = match ? `image/${match[1]}` : "image";

  formData.append("file", { uri, name: filename, type } as any);

  const res = await apiClient.post("/users/me/avatar", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}
export async function lookupByInviteCode(inviteCode: string): Promise<any> {
  const res = await apiClient.get("/users/lookup", { params: { invite_code: inviteCode } });
  return res.data;
}