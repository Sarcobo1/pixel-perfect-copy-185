// Legacy file — email verification is handled by Replit Auth.
export async function verifyUserEmail(_email: string) {
  return { success: false, error: "Use Replit Auth" };
}
