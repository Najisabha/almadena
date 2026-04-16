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
      const detail =
        typeof payload.detail === "string" && payload.detail.trim() !== ""
          ? payload.detail.trim()
          : "";
      const base = payload.message || "Request failed";
      return {
        data: null as T,
        error: { message: detail ? `${base} — ${detail}` : base },
      };
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
      idImageFile,
    }: {
      idNumber: string;
      password: string;
      options?: { data?: Record<string, unknown> };
      idImageFile?: File | null;
    }) {
      const profile = options?.data || {};

      if (idImageFile) {
        try {
          const form = new FormData();
          form.append("idNumber", idNumber);
          form.append("password", password);
          form.append("profile", JSON.stringify(profile));
          form.append("idImage", idImageFile);
          const response = await fetch(`${API_BASE}/auth/register`, {
            method: "POST",
            body: form,
          });
          const payload = await response.json().catch(() => ({}));
          if (!response.ok) {
            return {
              data: null,
              error: { message: (payload as { message?: string }).message || "Request failed" },
            };
          }
          const data = payload as { token?: string; user?: AuthUser };
          if (!data.token || !data.user) {
            return { data: null, error: { message: "Invalid response" } };
          }
          setSession(data.token, data.user);
          return { data: { user: data.user }, error: null };
        } catch (error) {
          return { data: null, error: { message: (error as Error).message } };
        }
      }

      const response = await request<{ token: string; user: AuthUser }>("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          idNumber,
          password,
          profile,
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

  /** Admin: تحديث بيانات مستخدم كاملة (users + profiles + students + is_admin) في معاملة واحدة */
  async patchAdminUser(userId: string, body: AdminUserPatchPayload) {
    return request<AdminStudentManagementRow>(`/admin/users/${userId}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
  },

  /** Admin: جلب بيانات مستخدم واحد كاملة */
  async getAdminUser(userId: string) {
    return request<AdminUserFullRow>(`/admin/users/${userId}`);
  },

  /** Admin: حذف حساب مستخدم بالكامل */
  async deleteAdminUser(userId: string) {
    return request<{ message: string }>(`/admin/users/${userId}`, { method: "DELETE" });
  },

  /** هل المستخدم الحالي (JWT) لديه دور مشرف */
  async checkIsAdmin(): Promise<boolean> {
    const { data, error } = await request<{ isAdmin: boolean }>("/admin/me/is-admin");
    if (error || data == null) return false;
    return Boolean(data.isAdmin);
  },

  /** رفع صورة مدرب → يُعاد مسارًا نسبيًا مثل /uploads/instructors/... */
  async uploadInstructorImage(file: File): Promise<ApiResponse<{ url: string }>> {
    try {
      const token = getToken();
      const form = new FormData();
      form.append("image", file);
      const response = await fetch(`${API_BASE}/upload/instructors`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: form,
      });
      const payload = await response.json();
      if (!response.ok) {
        const detail =
          typeof payload.detail === "string" && payload.detail.trim() !== ""
            ? payload.detail.trim()
            : "";
        const base = payload.message || "فشل رفع الصورة";
        return { data: null as { url: string }, error: { message: detail ? `${base} — ${detail}` : base } };
      }
      const inner = payload.data ?? payload;
      const url = typeof inner?.url === "string" ? inner.url : "";
      if (!url) {
        return { data: null as { url: string }, error: { message: "لم يُرجع الرابط من الخادم" } };
      }
      return { data: { url }, error: null };
    } catch (error) {
      return { data: null as { url: string }, error: { message: (error as Error).message } };
    }
  },

  /** رفع صورة لقصة نجاح → يُعاد مسارًا نسبيًا مثل /uploads/success-stories/... */
  async uploadSuccessStoryImage(file: File): Promise<ApiResponse<{ url: string }>> {
    try {
      const token = getToken();
      const form = new FormData();
      form.append("image", file);
      const response = await fetch(`${API_BASE}/upload/success-stories`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: form,
      });
      const payload = await response.json();
      if (!response.ok) {
        const detail =
          typeof payload.detail === "string" && payload.detail.trim() !== ""
            ? payload.detail.trim()
            : "";
        const base = payload.message || "فشل رفع الصورة";
        return { data: null as { url: string }, error: { message: detail ? `${base} — ${detail}` : base } };
      }
      const inner = payload.data ?? payload;
      const url = typeof inner?.url === "string" ? inner.url : "";
      if (!url) {
        return { data: null as { url: string }, error: { message: "لم يُرجع الرابط من الخادم" } };
      }
      return { data: { url }, error: null };
    } catch (error) {
      return { data: null as { url: string }, error: { message: (error as Error).message } };
    }
  },

  /** مشرف: رفع ملف صورة هوية → يُعاد مسارًا نسبيًا مثل /uploads/id-documents/... */
  async uploadAdminIdDocumentImage(
    file: File,
    idNumber: string
  ): Promise<ApiResponse<{ url: string }>> {
    try {
      const token = getToken();
      const form = new FormData();
      form.append("image", file);
      form.append("id_number", idNumber.trim());
      const response = await fetch(`${API_BASE}/upload/id-document`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: form,
      });
      const payload = await response.json();
      if (!response.ok) {
        const detail =
          typeof payload.detail === "string" && payload.detail.trim() !== ""
            ? payload.detail.trim()
            : "";
        const base = payload.message || "فشل رفع الصورة";
        return { data: null as { url: string }, error: { message: detail ? `${base} — ${detail}` : base } };
      }
      const inner = payload.data ?? payload;
      const url = typeof inner?.url === "string" ? inner.url : "";
      if (!url) {
        return { data: null as { url: string }, error: { message: "لم يُرجع الرابط من الخادم" } };
      }
      return { data: { url }, error: null };
    } catch (error) {
      return { data: null as { url: string }, error: { message: (error as Error).message } };
    }
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
  /** تاريخ الميلاد من الملف الشخصي (لحساب العمر في الواجهة) */
  date_of_birth: string | null;
  /** تاريخ إنشاء حساب المستخدم (تاريخ التسجيل بالموقع) */
  registered_at: string;
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
    city?: string | null;
    town?: string | null;
    full_address?: string | null;
    date_of_birth?: string | null;
    id_image_url?: string | null;
    id_image_status?: string | null;
    id_image_pinned?: boolean;
    avatar_url?: string | null;
  };
};

/** عقد جسم الطلب لـ PATCH /api/admin/users/:userId */
export type AdminUserPatchPayload = {
  user?: { id_number?: string };
  profile?: {
    first_name?: string;
    last_name?: string;
    phone?: string | null;
    license_type?: string | null;
    city?: string | null;
    town?: string | null;
    full_address?: string | null;
    date_of_birth?: string | null;
    id_image_url?: string | null;
    id_image_status?: string | null;
    id_image_pinned?: boolean;
    avatar_url?: string | null;
  };
  student?: {
    theory_score?: number | null;
    practical_score?: number | null;
    notes?: string | null;
    total_exams_taken?: number;
    last_exam_date?: string | null;
  };
  is_admin?: boolean;
};

/** صف مستخدم كامل يُعاد من GET /api/admin/users/:userId */
export type AdminUserFullRow = {
  user_id: string;
  id_number: string | null;
  is_admin: boolean;
  student: {
    id: string | null;
    theory_score: number | null;
    practical_score: number | null;
    total_exams_taken: number;
    last_exam_date: string | null;
    notes: string | null;
  };
  profile: {
    first_name: string;
    last_name: string;
    phone: string | null;
    license_type: string | null;
    city: string | null;
    town: string | null;
    full_address: string | null;
    date_of_birth: string | null;
    id_image_url: string | null;
    id_image_status: string | null;
    id_image_pinned: boolean;
    avatar_url: string | null;
  };
};
