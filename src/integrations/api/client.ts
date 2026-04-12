type QueryFilter = { field: string; value: unknown };

type AuthUser = {
  id: string;
  idNumber: string;
};

type Session = {
  access_token: string;
  user: AuthUser;
};

type ApiResponse<T> = {
  data: T;
  error: { message: string } | null;
};

const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:4000") + "/api";
const TOKEN_KEY = "almadena_token";
const USER_KEY = "almadena_user";

type AuthListener = (_event: string, session: Session | null) => void;
const listeners = new Set<AuthListener>();

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function getCachedUser(): AuthUser | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

function setSession(token: string, user: AuthUser) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  const session: Session = { access_token: token, user };
  listeners.forEach((listener) => listener("SIGNED_IN", session));
}

function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  listeners.forEach((listener) => listener("SIGNED_OUT", null));
}

async function request<T>(path: string, init: RequestInit = {}): Promise<ApiResponse<T>> {
  try {
    const token = getToken();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(init.headers as Record<string, string> || {}),
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    const response = await fetch(`${API_BASE}${path}`, { ...init, headers });
    const payload = await response.json();
    if (!response.ok) {
      return { data: null as T, error: { message: payload.message || "Request failed" } };
    }
    return { data: payload.data ?? payload, error: null };
  } catch (error) {
    return { data: null as T, error: { message: (error as Error).message } };
  }
}

class QueryBuilder<T = any> {
  private table: string;
  private action: "select" | "insert" | "update" | "delete" = "select";
  private filters: QueryFilter[] = [];
  private orderByField: string | null = null;
  private ascending = true;
  private rowLimit: number | null = null;
  private singleResult = false;
  private maybeSingleResult = false;
  private payload: any = null;
  private inFilter: { field: string; values: unknown[] } | null = null;

  constructor(table: string) {
    this.table = table;
  }

  select(): this {
    this.action = "select";
    return this;
  }

  insert(payload: any[]): this {
    this.action = "insert";
    this.payload = payload;
    return this;
  }

  update(payload: Record<string, unknown>): this {
    this.action = "update";
    this.payload = payload;
    return this;
  }

  delete(): this {
    this.action = "delete";
    return this;
  }

  eq(field: string, value: unknown): this {
    this.filters.push({ field, value });
    return this;
  }

  in(field: string, values: unknown[]): this {
    this.inFilter = { field, values };
    return this;
  }

  order(field: string, opts: { ascending: boolean } = { ascending: true }): this {
    this.orderByField = field;
    this.ascending = opts.ascending;
    return this;
  }

  limit(value: number): this {
    this.rowLimit = value;
    return this;
  }

  single(): this {
    this.singleResult = true;
    return this;
  }

  maybeSingle(): this {
    this.maybeSingleResult = true;
    return this;
  }

  private async exec(): Promise<ApiResponse<T>> {
    if (this.action === "select") {
      const params = new URLSearchParams();
      this.filters.forEach((filter) => params.append(filter.field, String(filter.value)));
      if (this.orderByField) {
        params.set("orderBy", this.orderByField);
        params.set("ascending", String(this.ascending));
      }
      if (this.rowLimit !== null) {
        params.set("limit", String(this.rowLimit));
      }
      if (this.singleResult) {
        params.set("single", "true");
      }
      if (this.maybeSingleResult) {
        params.set("maybeSingle", "true");
      }
      if (this.inFilter) {
        params.set("inField", this.inFilter.field);
        params.set("inValues", this.inFilter.values.map(String).join(","));
      }
      return request<T>(`/table/${this.table}?${params.toString()}`);
    }

    if (this.action === "insert") {
      return request<T>(`/table/${this.table}`, {
        method: "POST",
        body: JSON.stringify(this.payload),
      });
    }

    if (this.action === "update") {
      return request<T>(`/table/${this.table}`, {
        method: "PATCH",
        body: JSON.stringify({ payload: this.payload, filters: this.filters }),
      });
    }

    return request<T>(`/table/${this.table}`, {
      method: "DELETE",
      body: JSON.stringify({ filters: this.filters }),
    });
  }

  then<TResult1 = ApiResponse<T>, TResult2 = never>(
    onfulfilled?: ((value: ApiResponse<T>) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ) {
    return this.exec().then(onfulfilled, onrejected);
  }
}

export const api = {
  auth: {
    async getSession() {
      const token = getToken();
      const user = getCachedUser();
      const session = token && user ? ({ access_token: token, user } as Session) : null;
      return { data: { session }, error: null };
    },

    async getUser() {
      const token = getToken();
      const user = getCachedUser();
      if (!token || !user) {
        return { data: { user: null }, error: null };
      }
      const response = await request<{ user: AuthUser }>("/auth/session");
      if (response.error || !response.data?.user) {
        clearSession();
        return { data: { user: null }, error: null };
      }
      localStorage.setItem(USER_KEY, JSON.stringify(response.data.user));
      return { data: { user: response.data.user }, error: null };
    },

    onAuthStateChange(callback: AuthListener) {
      listeners.add(callback);
      return {
        data: {
          subscription: {
            unsubscribe: () => listeners.delete(callback),
          },
        },
      };
    },

    async signInWithPassword({ idNumber, password }: { idNumber: string; password: string }) {
      const response = await request<{ token: string; user: AuthUser }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ idNumber, password }),
      });
      if (response.error) {
        return { data: null, error: response.error };
      }
      setSession(response.data.token, response.data.user);
      return { data: { session: { access_token: response.data.token, user: response.data.user } }, error: null };
    },

    async signUp({
      idNumber,
      password,
      options,
    }: {
      idNumber: string;
      password: string;
      options?: { data?: Record<string, unknown> };
    }) {
      const response = await request<{ token: string; user: AuthUser }>("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          idNumber,
          password,
          profile: options?.data || {},
        }),
      });
      if (response.error) {
        return { data: null, error: response.error };
      }
      setSession(response.data.token, response.data.user);
      return { data: { user: response.data.user }, error: null };
    },

    async signOut() {
      clearSession();
      return { error: null };
    },
  },

  from<T = any>(table: string) {
    return new QueryBuilder<T>(table);
  },

  /** Student dashboard aggregated payload */
  async getDashboard() {
    return request<{
      theory_score: number | null;
      practical_score: number | null;
      total_exams: number;
      passed_exams: number;
      avg_percentage: number;
      recent_attempts: ExamAttempt[];
      rank: number | null;
      total_students: number;
    }>("/dashboard");
  },

  /** Student notifications */
  async getNotifications() {
    return request<StudentNotification[]>("/notifications");
  },

  /** Mark a notification as read */
  async markNotificationRead(id: string) {
    return request<{ ok: boolean }>(`/notifications/${id}/read`, { method: "PATCH" });
  },

  /** Record a completed mock exam attempt */
  async postExamAttempt(attempt: {
    license_code: string;
    license_name_ar: string;
    exam_number: number;
    score: number;
    total_questions: number;
    percentage: number;
    passed: boolean;
  }) {
    return request<ExamAttempt>("/exam-attempts", {
      method: "POST",
      body: JSON.stringify(attempt),
    });
  },

  /** Admin: send notification to a specific student */
  async sendAdminNotification(user_id: string, message: string) {
    return request<StudentNotification>("/admin/notifications", {
      method: "POST",
      body: JSON.stringify({ user_id, message }),
    });
  },

  /** Admin: list all students for notification UI */
  async getAdminStudentsList() {
    return request<AdminStudent[]>("/admin/students-list");
  },

  /** Admin: students table + profile fields for إدارة الطلاب */
  async getAdminStudentsManagement() {
    return request<AdminStudentManagementRow[]>("/admin/students");
  },
};

export type ExamAttempt = {
  id: string;
  user_id: string;
  license_code: string;
  license_name_ar: string;
  exam_number: number;
  score: number;
  total_questions: number;
  percentage: number;
  passed: boolean;
  created_at: string;
};

export type StudentNotification = {
  id: string;
  message: string;
  is_read: boolean;
  created_at: string;
};

export type AdminStudent = {
  /** صف students؛ قد يكون null إن لم يُنشأ بعد */
  id: string | null;
  user_id: string;
  first_name: string;
  last_name: string;
  license_type: string | null;
  id_number?: string | null;
  is_admin?: boolean;
};

export type AdminStudentManagementRow = {
  /** معرّف صف جدول students؛ null حتى يُنشأ السجل */
  id: string | null;
  user_id: string;
  id_number?: string | null;
  is_admin?: boolean;
  theory_score: number | null;
  practical_score: number | null;
  total_exams_taken: number;
  last_exam_date: string | null;
  notes: string | null;
  profiles: {
    first_name: string;
    last_name: string;
    phone: string | null;
    license_type: string | null;
  };
};
