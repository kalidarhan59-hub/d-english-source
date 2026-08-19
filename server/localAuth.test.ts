import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./localAuth";

describe("local password security", () => {
  it("creates a non-reversible scrypt hash and verifies the original password", async () => {
    const password = "My-secure-password-2026";
    const hash = await hashPassword(password);

    expect(hash).toMatch(/^scrypt\$[a-f0-9]+\$[a-f0-9]+$/);
    expect(hash).not.toContain(password);
    await expect(verifyPassword(password, hash)).resolves.toBe(true);
  });

  it("rejects an incorrect password", async () => {
    const hash = await hashPassword("Correct-password-2026");
    await expect(verifyPassword("Incorrect-password", hash)).resolves.toBe(false);
  });
});
