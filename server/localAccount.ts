import { hashPassword, verifyPassword } from "./localAuth";

export type LocalAccount = { id: number; username: string | null; name: string | null; passwordHash: string | null };
export type LocalAccountStore = {
  findByUsername: (username: string) => Promise<LocalAccount | undefined>;
  create: (input: { username: string; email: string; passwordHash: string }) => Promise<LocalAccount>;
};

export class LocalAccountError extends Error {
  constructor(public readonly reason: "username_taken" | "invalid_credentials") { super(reason); }
}

export function normalizeUsername(username: string) {
  return username.trim().toLowerCase();
}

export async function registerLocalAccount(input: { username: string; email: string; password: string }, store: LocalAccountStore) {
  const username = normalizeUsername(input.username);
  if (await store.findByUsername(username)) throw new LocalAccountError("username_taken");
  return store.create({ username, email: input.email.trim().toLowerCase(), passwordHash: await hashPassword(input.password) });
}

export async function loginLocalAccount(input: { username: string; password: string }, store: Pick<LocalAccountStore, "findByUsername">) {
  const user = await store.findByUsername(normalizeUsername(input.username));
  if (!user || !(await verifyPassword(input.password, user.passwordHash))) throw new LocalAccountError("invalid_credentials");
  return user;
}
