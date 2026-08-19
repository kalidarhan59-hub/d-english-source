import { describe, expect, it } from "vitest";
import { LocalAccountError, loginLocalAccount, registerLocalAccount, type LocalAccount } from "./localAccount";

function createStore() {
  const users = new Map<string, LocalAccount & { email: string }>();
  let id = 1;
  return {
    users,
    findByUsername: async (username: string) => users.get(username),
    create: async (input: { username: string; email: string; passwordHash: string }) => {
      const user = { id: id++, username: input.username, name: input.username, email: input.email, passwordHash: input.passwordHash };
      users.set(input.username, user);
      return user;
    },
  };
}

describe("local account workflow", () => {
  it("registers a new account and authenticates it by normalized login", async () => {
    const store = createStore();
    const user = await registerLocalAccount({ username: "Dasha_English", email: "dasha@example.com", password: "Strong-password-2026" }, store);
    const authenticated = await loginLocalAccount({ username: "dasha_english", password: "Strong-password-2026" }, store);
    expect(user.username).toBe("dasha_english");
    expect(authenticated.id).toBe(user.id);
  });

  it("rejects a duplicate username and a wrong password", async () => {
    const store = createStore();
    await registerLocalAccount({ username: "student", email: "first@example.com", password: "Strong-password-2026" }, store);
    await expect(registerLocalAccount({ username: "STUDENT", email: "second@example.com", password: "Strong-password-2026" }, store)).rejects.toMatchObject<Partial<LocalAccountError>>({ reason: "username_taken" });
    await expect(loginLocalAccount({ username: "student", password: "wrong-password" }, store)).rejects.toMatchObject<Partial<LocalAccountError>>({ reason: "invalid_credentials" });
  });
});
