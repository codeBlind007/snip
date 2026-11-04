export interface User {
  id: number;
  email_id: string;
  fullname: string;
}

export interface UrlItem {
  id: number;
  short_url: string;
  long_url: string;
  max_clicks: number | null;
  click_count: number;
  expire_time: string | null;
  is_active: boolean;
  user_id: number;
  created_at: string;
}

export interface UrlListResponse {
  urls: UrlItem[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface UrlCreateRequest {
  long_url: string;
  custom_alias?: string | null;
  max_clicks?: number | null;
  expire_time?: string | null;
}

export interface UrlUpdateRequest {
  max_clicks?: number | null;
  expire_time?: string | null;
  is_active?: boolean | null;
}

export interface AuthResponse {
  user: User;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  status: number;
}

