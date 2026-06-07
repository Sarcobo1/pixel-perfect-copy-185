import { getWebRequest } from "@tanstack/react-start/server";

export interface ReplitUser {
  id: string;
  name: string;
  profileImage?: string;
  bio?: string;
  url?: string;
  roles?: string[];
  teams?: string[];
}

export async function getRequestUser(): Promise<ReplitUser | null> {
  try {
    const request = getWebRequest();
    const cookie = request.headers.get("cookie") ?? "";

    const response = await fetch(
      `https://${process.env.REPLIT_DOMAINS?.split(",")[0] ?? ""}/api/auth/user`,
      {
        headers: { cookie },
        credentials: "include",
      },
    );

    if (!response.ok) return null;
    const data = await response.json() as { user?: ReplitUser };
    return data.user ?? null;
  } catch {
    return null;
  }
}
