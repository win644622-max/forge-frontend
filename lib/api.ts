import axios, { AxiosError } from "axios";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: `${API_BASE}/v1`,
  headers: { "Content-Type": "application/json" },
});

// Attach JWT to every request
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("forge_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Extract meaningful error messages from backend envelope
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiResponse<unknown>>) => {
    const msg =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Something went wrong";
    return Promise.reject(new Error(msg));
  }
);

// ---- Types ----

export interface User {
  id: string;
  email: string;
  role: "customer" | "maker" | "admin";
  reputation_score: number;
  created_at: string;
}

export interface Design {
  id: string;
  user_id: string;
  prompt: string;
  file_url: string | null;
  file_type: string | null;
  validation_status: "pending" | "valid" | "invalid";
  is_catalog: boolean;
  machine_type_required?: string | null;
  material_required?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Job {
  id: string;
  design_id: string;
  customer_id: string;
  node_id: string | null;
  state: string;
  material: string;
  color: string;
  quantity: number;
  customer_price: number | null;
  maker_payout: number | null;
  forge_margin: number | null;
  stripe_payment_intent: string | null;
  idempotency_key: string;
  tracking_number: string | null;
  created_at: string;
  updated_at: string;
  state_updated_at: string;
}

export interface JobStatus {
  job_id: string;
  current_state: string;
  valid_next_states: string[];
  history: {
    id: string;
    job_id: string;
    from_state: string | null;
    to_state: string;
    triggered_by: string;
    created_at: string;
  }[];
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  error: string | null;
  message: string;
}

// ---- Auth ----

export async function register(email: string, password: string) {
  const { data } = await api.post<ApiResponse<User>>("/auth/register", {
    email,
    password,
  });
  return data.data;
}

export async function login(email: string, password: string) {
  const { data } = await api.post<ApiResponse<{ token: string; user: User }>>(
    "/auth/login",
    { email, password }
  );
  if (data.data.token) {
    localStorage.setItem("forge_token", data.data.token);
  }
  return data.data;
}

export function logout() {
  localStorage.removeItem("forge_token");
}

export function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("forge_token");
}

// ---- Designs ----

export async function generateDesign(prompt: string) {
  const { data } = await api.post<ApiResponse<Design>>("/designs/generate", {
    prompt,
  });
  return data.data;
}

export async function getDesign(designId: string) {
  const { data } = await api.get<ApiResponse<Design>>(
    `/designs/${designId}`
  );
  return data.data;
}

export async function getDesignDownload(designId: string) {
  const { data } = await api.get<
    ApiResponse<{ download_url: string; expires_in: number }>
  >(`/designs/${designId}/download`);
  return data.data;
}

/** Generate design then immediately fetch the signed STL download URL */
export async function generateDesignWithUrl(prompt: string) {
  const design = await generateDesign(prompt);
  let stlUrl: string | null = null;
  if (design.file_url) {
    try {
      const dl = await getDesignDownload(design.id);
      stlUrl = dl.download_url;
    } catch {
      // file_url exists but download failed — non-fatal
    }
  }
  return { design, stlUrl };
}

// ---- Jobs ----

export async function createJob(
  designId: string,
  quantity: number,
  material: string,
  color: string
) {
  const { data } = await api.post<ApiResponse<Job>>("/jobs/create", {
    design_id: designId,
    quantity,
    material,
    color,
  });
  return data.data;
}

export async function getJob(jobId: string) {
  const { data } = await api.get<ApiResponse<Job>>(`/jobs/${jobId}`);
  return data.data;
}

export async function getJobStatus(jobId: string) {
  const { data } = await api.get<ApiResponse<JobStatus>>(
    `/jobs/${jobId}/status`
  );
  return data.data;
}

export async function getJobHistory() {
  const { data } = await api.get<ApiResponse<Job[]>>("/jobs/history/");
  return data.data;
}

export async function cancelJob(jobId: string) {
  const { data } = await api.post<ApiResponse<Job>>(`/jobs/${jobId}/cancel`);
  return data.data;
}

// ---- Payments ----

export async function createCheckout(jobId: string) {
  const { data } = await api.post<
    ApiResponse<{
      payment_intent_id: string;
      client_secret: string;
      amount: number;
      currency: string;
    }>
  >("/payments/checkout", { job_id: jobId });
  return data.data;
}

export default api;
