import {
  AuthResponse,
  UrlCreateRequest,
  UrlItem,
  UrlListResponse,
  UrlUpdateRequest,
  User,
} from "./types";

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  const contentType = res.headers.get("content-type");
  const isJson = contentType && contentType.includes("application/json");
  const data = isJson ? await res.json() : null;

  if (!res.ok) {
    let message = "An error occurred";
    if (data?.detail) {
      if (typeof data.detail === "string") {
        message = data.detail;
      } else if (Array.isArray(data.detail) && data.detail.length > 0) {
        message = data.detail.map((d: { msg?: string }) => d.msg || "Invalid field").join(", ");
      }
    } else if (data?.message) {
      message = data.message;
    }
    throw new ApiError(message, res.status);
  }

  return data as T;
}

export const apiClient = {
  // Auth
  async login(payload: { email_id: string; password: string }): Promise<AuthResponse> {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return handleResponse<AuthResponse>(res);
  },

  async signup(payload: { email_id: string; fullname: string; password: string }): Promise<AuthResponse> {
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return handleResponse<AuthResponse>(res);
  },

  async logout(): Promise<{ success: boolean }> {
    const res = await fetch("/api/auth/logout", {
      method: "POST",
    });
    return handleResponse<{ success: boolean }>(res);
  },

  async getMe(): Promise<{ user: User | null }> {
    const res = await fetch("/api/auth/me", {
      method: "GET",
      cache: "no-store",
    });
    return handleResponse<{ user: User | null }>(res);
  },

  // URLs
  async createUrl(data: UrlCreateRequest): Promise<UrlItem> {
    const idempotencyKey = crypto.randomUUID();
    const res = await fetch("/api/url", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": idempotencyKey,
      },
      body: JSON.stringify(data),
    });
    return handleResponse<UrlItem>(res);
  },

  async getUrls(params: {
    page?: number;
    is_active?: boolean;
    alias?: string;
  } = {}): Promise<UrlListResponse> {
    const query = new URLSearchParams();
    if (params.page !== undefined) query.set("page", String(params.page));
    if (params.is_active !== undefined) query.set("is_active", String(params.is_active));
    if (params.alias && params.alias.trim()) query.set("alias", params.alias.trim());

    const queryString = query.toString();
    const endpoint = queryString ? `/api/url?${queryString}` : "/api/url";

    const res = await fetch(endpoint, {
      method: "GET",
      cache: "no-store",
    });
    return handleResponse<UrlListResponse>(res);
  },

  async updateUrl(id: number, data: UrlUpdateRequest): Promise<UrlItem> {
    const res = await fetch(`/api/url/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse<UrlItem>(res);
  },

  async checkHealth(): Promise<{ status: string }> {
    try {
      const res = await fetch("/api/health", { cache: "no-store" });
      if (!res.ok) return { status: "offline" };
      const data = await res.json();
      return { status: data["server-health"] || "ok" };
    } catch {
      return { status: "offline" };
    }
  },
};

