import { describe, it, expect, vi } from "vitest";
import {
  buildAuthUrl,
  mapAccountType,
  TRUELAYER_AUTH_URL,
} from "@/lib/truelayer";

describe("buildAuthUrl", () => {
  it("includes the client_id", () => {
    const url = buildAuthUrl("sandbox-financetrack-5e0687", "http://localhost:3000/api/truelayer/callback");
    expect(url).toContain("client_id=sandbox-financetrack-5e0687");
  });

  it("includes required scopes", () => {
    const url = buildAuthUrl("test-id", "http://localhost/callback");
    expect(url).toContain("accounts");
    expect(url).toContain("balance");
    expect(url).toContain("transactions");
  });

  it("includes the redirect_uri", () => {
    const callback = "http://localhost:3000/api/truelayer/callback";
    const url = buildAuthUrl("test-id", callback);
    expect(url).toContain(encodeURIComponent(callback));
  });

  it("includes the sandbox mock provider", () => {
    const url = buildAuthUrl("test-id", "http://localhost/callback");
    expect(url).toContain("providers=mock");
  });

  it("points to the sandbox auth domain", () => {
    const url = buildAuthUrl("test-id", "http://localhost/callback");
    expect(url).toContain(TRUELAYER_AUTH_URL);
  });
});

describe("mapAccountType", () => {
  it.each([
    ["TRANSACTION", "checking"],
    ["SAVINGS", "savings"],
    ["CREDIT", "credit"],
    ["BUSINESS_TRANSACTION", "checking"],
    ["BUSINESS_SAVINGS", "savings"],
    ["UNKNOWN", "checking"],   // fallback
    ["transaction", "checking"], // case-insensitive
  ])("maps %s → %s", (input, expected) => {
    expect(mapAccountType(input)).toBe(expected);
  });
});

describe("exchangeCode", () => {
  it("sends correct form body to token endpoint", async () => {
    const fetched: { url: string; body: string }[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string, init?: RequestInit) => {
        fetched.push({ url: url as string, body: init?.body?.toString() ?? "" });
        return new Response(JSON.stringify({ access_token: "tok_abc" }), { status: 200 });
      })
    );

    const { exchangeCode } = await import("@/lib/truelayer");
    const token = await exchangeCode("mycode", "client-id", "client-secret", "http://localhost/cb");

    expect(token).toBe("tok_abc");
    expect(fetched[0].url).toContain("/connect/token");
    expect(fetched[0].body).toContain("code=mycode");
    expect(fetched[0].body).toContain("client_id=client-id");
    expect(fetched[0].body).toContain("grant_type=authorization_code");
  });

  it("throws on non-200 response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("Bad Request", { status: 400 }))
    );

    const { exchangeCode } = await import("@/lib/truelayer");
    await expect(
      exchangeCode("bad-code", "id", "secret", "http://localhost/cb")
    ).rejects.toThrow("token exchange failed");
  });
});

describe("getAccounts", () => {
  it("returns results array", async () => {
    const mockAccounts = [{ account_id: "acc1", display_name: "Current", account_type: "TRANSACTION" }];
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ results: mockAccounts }), { status: 200 }))
    );

    const { getAccounts } = await import("@/lib/truelayer");
    const result = await getAccounts("access-token");
    expect(result).toEqual(mockAccounts);
  });

  it("passes Bearer token in Authorization header", async () => {
    const calls: RequestInit[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_url: string, init?: RequestInit) => {
        calls.push(init ?? {});
        return new Response(JSON.stringify({ results: [] }), { status: 200 });
      })
    );

    const { getAccounts } = await import("@/lib/truelayer");
    await getAccounts("my-access-token");
    expect((calls[0].headers as Record<string, string>)?.Authorization).toBe("Bearer my-access-token");
  });
});
