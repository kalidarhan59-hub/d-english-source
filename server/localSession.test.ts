import { describe, expect, it } from "vitest";
import type { Request, Response } from "express";
import { LOCAL_SESSION_COOKIE, setLocalSession } from "./localAuth";

describe("local session cookie", () => {
  it("writes an HTTP-only cookie with the local session name", async () => {
    process.env.JWT_SECRET = "unit-test-session-secret";
    const written: Array<{ name: string; value: string; options: Record<string, unknown> }> = [];
    const req = { protocol: "https", headers: {} } as Request;
    const res = { cookie: (name: string, value: string, options: Record<string, unknown>) => written.push({ name, value, options }) } as unknown as Response;
    await setLocalSession(req, res, 77);
    expect(written[0]?.name).toBe(LOCAL_SESSION_COOKIE);
    expect(written[0]?.value).toMatch(/^ey/);
    expect(written[0]?.options).toMatchObject({ httpOnly: true, secure: true, sameSite: "none" });
  });
});
