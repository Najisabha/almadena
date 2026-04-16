import { useState, useEffect, useMemo, useCallback } from 'react';
import { api as apiClient, AdminStudent } from '@/integrations/api/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bell, Send } from 'lucide-react';

type LicenseRow = {
  id: string;
  code: string;
  name_ar: string;
  is_active?: boolean;
  display_order?: number;
};

const FALLBACK_LICENSES: LicenseRow[] = [
  { id: 'fallback-B', code: 'B', name_ar: 'خصوصي', is_active: true, display_order: 1 },
  { id: 'fallback-C1', code: 'C1', name_ar: 'شحن خفيف', is_active: true, display_order: 2 },
  { id: 'fallback-C', code: 'C', name_ar: 'شحن ثقيل', is_active: true, display_order: 3 },
  { id: 'fallback-D1', code: 'D1', name_ar: 'عمومي', is_active: true, display_order: 4 },
  { id: 'fallback-A', code: 'A', name_ar: 'دراجة نارية', is_active: true, display_order: 5 },
];

function mapProfileLicenseToCode(raw: string | null | undefined, licenses: LicenseRow[]): string {
  if (!raw || !String(raw).trim()) return '';
  const t = String(raw).trim();
  if (licenses.some((l) => l.code === t)) return t;
  const m = t.match(/\(([A-Z0-9]+)\)\s*$/i);
  if (m) {
    const c = m[1].toUpperCase();
    if (licenses.some((l) => l.code === c)) return c;
  }
  const byName = licenses.find((l) => t === l.name_ar || t.startsWith(`${l.name_ar} `));
  if (byName) return byName.code;
  return t;
}

function toLocalYmd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function registeredAtLocalYmd(iso: string | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return toLocalYmd(d);
}

/** عمر بالسنوات: السنة الحالية − سنة الميلاد (دون اعتبار اليوم/الشهر). */
function ageYearDiffFromDob(dobStr: string | null | undefined): number | null {
  if (!dobStr) return null;
  const dob = new Date(dobStr);
  if (Number.isNaN(dob.getTime())) return null;
  return new Date().getFullYear() - dob.getFullYear();
}

function matchesNameQuery(s: AdminStudent, q: string): boolean {
  const t = q.trim().toLowerCase();
  if (!t) return true;
  const full = `${s.first_name} ${s.last_name} ${s.id_number ?? ''}`.toLowerCase();
  return full.includes(t);
}

function matchesAge(s: AdminStudent, ageStr: string): boolean {
  const t = ageStr.trim();
  if (!t) return true;
  const want = parseInt(t, 10);
  if (Number.isNaN(want)) return true;
  const a = ageYearDiffFromDob(s.date_of_birth);
  if (a === null) return false;
  return a === want;
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

type YmdParts = { y: number; m?: number; d?: number };

/** يُرجع null إن لم تُدخل سنة؛ يتجاهل شهر/يوم غير صالحين */
function parseYmdParts(yStr: string, mStr: string, dStr: string): YmdParts | null {
  const yt = yStr.trim();
  if (!yt) return null;
  const y = parseInt(yt, 10);
  if (!Number.isFinite(y) || y < 1000 || y > 9999) return null;
  const mt = mStr.trim();
  const dt = dStr.trim();
  if (!mt) return { y };
  const m = parseInt(mt, 10);
  if (!Number.isFinite(m) || m < 1 || m > 12) return null;
  if (!dt) return { y, m };
  const d = parseInt(dt, 10);
  if (!Number.isFinite(d) || d < 1 || d > 31) return null;
  return { y, m, d };
}

/** أول يوم ضمن النطاق (سنة فقط → ١ يناير؛ سنة+شهر → أول الشهر؛ كامل → اليوم مع تقييد بأيام الشهر) */
function inclusiveFromYmd(parts: YmdParts | null): string | null {
  if (!parts) return null;
  if (parts.m == null) return `${parts.y}-01-01`;
  const dim = daysInMonth(parts.y, parts.m);
  const d = parts.d == null ? 1 : Math.min(parts.d, dim);
  return `${parts.y}-${pad2(parts.m)}-${pad2(d)}`;
}

/** آخر يوم ضمن النطاق (سنة فقط → ٣١ ديسمبر؛ سنة+شهر → آخر الشهر؛ كامل → اليوم مع التقييد) */
function inclusiveToYmd(parts: YmdParts | null): string | null {
  if (!parts) return null;
  if (parts.m == null) return `${parts.y}-12-31`;
  const dim = daysInMonth(parts.y, parts.m);
  const d = parts.d == null ? dim : Math.min(parts.d, dim);
  return `${parts.y}-${pad2(parts.m)}-${pad2(d)}`;
}

function matchesEnrollment(s: AdminStudent, from: string | null, to: string | null): boolean {
  const ymd = registeredAtLocalYmd(s.registered_at);
  if (!ymd) return true;
  if (from && ymd < from) return false;
  if (to && ymd > to) return false;
  return true;
}

function digitsOnly(value: string, maxLen: number): string {
  return value.replace(/\D/g, '').slice(0, maxLen);
}

function matchesLicense(s: AdminStudent, code: string, pool: LicenseRow[]): boolean {
  if (!code) return true;
  const effective = pool.length > 0 ? pool : FALLBACK_LICENSES;
  const studentCode = mapProfileLicenseToCode(s.license_type, effective);
  return studentCode === code;
}

const LICENSE_FILTER_ALL = '__all__';
const NAME_AUTOFILL_DEBOUNCE_MS = 350;

export const AdminStudentNotifications = () => {
  const [students, setStudents] = useState<AdminStudent[]>([]);
  const [licenses, setLicenses] = useState<LicenseRow[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const [nameQuery, setNameQuery] = useState('');
  const [ageQuery, setAgeQuery] = useState('');
  const [enrollFromY, setEnrollFromY] = useState('');
  const [enrollFromM, setEnrollFromM] = useState('');
  const [enrollFromD, setEnrollFromD] = useState('');
  const [enrollToY, setEnrollToY] = useState('');
  const [enrollToM, setEnrollToM] = useState('');
  const [enrollToD, setEnrollToD] = useState('');
  const [licenseFilter, setLicenseFilter] = useState<string>(LICENSE_FILTER_ALL);

  const { toast } = useToast();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await apiClient.from('licenses').select().order('display_order', { ascending: true });
        const rows = (data as LicenseRow[] | null) || [];
        if (!cancelled) setLicenses(rows.length > 0 ? rows : FALLBACK_LICENSES);
      } catch {
        if (!cancelled) setLicenses(FALLBACK_LICENSES);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setLoadingStudents(true);
    apiClient
      .getAdminStudentsList()
      .then(({ data, error }) => {
        if (error) throw new Error(error.message);
        setStudents(data ?? []);
      })
      .catch(() => {
        toast({
          title: 'خطأ',
          description: 'فشل تحميل قائمة الطلاب',
          variant: 'destructive',
        });
      })
      .finally(() => setLoadingStudents(false));
  }, []);

  const effectiveLicenses = licenses.length > 0 ? licenses : FALLBACK_LICENSES;
  const licenseSelectOptions = effectiveLicenses.filter((l) => l.is_active !== false);

  const applyFilterFieldsFromStudent = useCallback(
    (s: AdminStudent) => {
      const fullName = [s.first_name, s.last_name].filter(Boolean).join(' ').trim();
      setNameQuery(fullName || String(s.id_number ?? '').trim());

      const age = ageYearDiffFromDob(s.date_of_birth);
      setAgeQuery(age != null ? String(age) : '');

      const pool = effectiveLicenses.filter((l) => l.is_active !== false);
      const code = mapProfileLicenseToCode(s.license_type, effectiveLicenses);
      const codeOk = Boolean(code && pool.some((l) => l.code === code));
      setLicenseFilter(codeOk ? code : LICENSE_FILTER_ALL);

      const ymd = registeredAtLocalYmd(s.registered_at);
      if (ymd) {
        const [y, m, d] = ymd.split('-');
        setEnrollFromY(y);
        setEnrollFromM(m);
        setEnrollFromD(d);
        setEnrollToY(y);
        setEnrollToM(m);
        setEnrollToD(d);
      } else {
        setEnrollFromY('');
        setEnrollFromM('');
        setEnrollFromD('');
        setEnrollToY('');
        setEnrollToM('');
        setEnrollToD('');
      }
    },
    [effectiveLicenses]
  );

  useEffect(() => {
    const t = nameQuery.trim();
    if (!t) return;

    const timer = window.setTimeout(() => {
      const matches = students.filter((s) => matchesNameQuery(s, t));
      if (matches.length !== 1) return;
      const s = matches[0];
      applyFilterFieldsFromStudent(s);
      setSelectedUserId(s.user_id);
    }, NAME_AUTOFILL_DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [nameQuery, students, applyFilterFieldsFromStudent]);

  const handleStudentDropdownChange = (userId: string) => {
    setSelectedUserId(userId);
    const s = students.find((x) => x.user_id === userId);
    if (s) applyFilterFieldsFromStudent(s);
  };

  const enrollFromBound = useMemo(
    () => inclusiveFromYmd(parseYmdParts(enrollFromY, enrollFromM, enrollFromD)),
    [enrollFromY, enrollFromM, enrollFromD]
  );
  const enrollToBound = useMemo(
    () => inclusiveToYmd(parseYmdParts(enrollToY, enrollToM, enrollToD)),
    [enrollToY, enrollToM, enrollToD]
  );

  const filteredStudents = useMemo(() => {
    const code = licenseFilter === LICENSE_FILTER_ALL ? '' : licenseFilter;
    return students.filter(
      (s) =>
        matchesNameQuery(s, nameQuery) &&
        matchesAge(s, ageQuery) &&
        matchesEnrollment(s, enrollFromBound, enrollToBound) &&
        matchesLicense(s, code, effectiveLicenses)
    );
  }, [
    students,
    nameQuery,
    ageQuery,
    enrollFromBound,
    enrollToBound,
    licenseFilter,
    effectiveLicenses,
  ]);

  useEffect(() => {
    if (!selectedUserId) return;
    if (!filteredStudents.some((x) => x.user_id === selectedUserId)) {
      setSelectedUserId('');
    }
  }, [filteredStudents, selectedUserId]);

  const handleSend = async () => {
    if (!selectedUserId) {
      toast({ title: 'تنبيه', description: 'يرجى اختيار طالب أولاً', variant: 'destructive' });
      return;
    }
    if (!message.trim()) {
      toast({ title: 'تنبيه', description: 'يرجى كتابة نص الإشعار', variant: 'destructive' });
      return;
    }

    setSending(true);
    const { error } = await apiClient.sendAdminNotification(selectedUserId, message);
    setSending(false);

    if (error) {
      toast({ title: 'خطأ', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'تم الإرسال', description: 'تم إرسال الإشعار إلى الطالب بنجاح' });
      setMessage('');
      setSelectedUserId('');
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          <CardTitle>إرسال إشعار للطالب</CardTitle>
        </div>
        <CardDescription>
          اختر طالباً وأرسل له رسالة مباشرة تظهر في لوحة التحكم الخاصة به
        </CardDescription>
      </CardHeader>
      <CardContent className="w-full space-y-6">
        <div className="w-full min-w-0 rounded-lg border border-border bg-muted/30 p-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-medium text-foreground">تصفية الطلاب</p>
            <p className="text-xs text-muted-foreground">
              العمر يُحسب كالفرق بين السنة الحالية وسنة الميلاد
            </p>
          </div>
          <div
            className="-mx-3 mb-3 mt-2 border-b border-border sm:mt-3"
            aria-hidden
          />
          <div className="flex w-full min-w-0 flex-wrap items-end gap-3 overflow-x-auto pb-1">
            <div className="min-w-0 flex-[1_1_200px] space-y-1.5">
              <Label htmlFor="filter-name" className="text-xs sm:text-sm">
                الاسم أو رقم الهوية
              </Label>
              <Input
                id="filter-name"
                value={nameQuery}
                onChange={(e) => setNameQuery(e.target.value)}
                placeholder="ابحث في الاسم أو رقم الهوية..."
                dir="rtl"
                className="min-w-[12rem]"
              />
            </div>
            <div className="w-[5.5rem] shrink-0 space-y-1.5">
              <Label htmlFor="filter-age" className="text-xs sm:text-sm">
                العمر
              </Label>
              <Input
                id="filter-age"
                type="number"
                min={0}
                max={120}
                inputMode="numeric"
                value={ageQuery}
                onChange={(e) => setAgeQuery(e.target.value)}
                placeholder="25"
                dir="ltr"
                className="tabular-nums"
              />
            </div>
            <div className="w-[min(100%,11rem)] min-w-[9rem] shrink-0 space-y-1.5">
              <Label htmlFor="filter-license" className="text-xs sm:text-sm">
                درجة الرخصة
              </Label>
              <Select value={licenseFilter} onValueChange={setLicenseFilter}>
                <SelectTrigger id="filter-license" className="w-full">
                  <SelectValue placeholder="الكل" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={LICENSE_FILTER_ALL}>الكل</SelectItem>
                  {licenseSelectOptions.map((l) => (
                    <SelectItem key={l.id} value={l.code}>
                      {l.name_ar} ({l.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex shrink-0 flex-col gap-1.5">
              <span className="text-xs font-medium text-foreground sm:text-sm">الالتحاق من</span>
              <div className="flex items-end gap-1.5" dir="ltr">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] text-muted-foreground">سنة</span>
                  <Input
                    id="filter-enroll-from-y"
                    inputMode="numeric"
                    value={enrollFromY}
                    onChange={(e) => setEnrollFromY(digitsOnly(e.target.value, 4))}
                    placeholder="YYYY"
                    className="h-9 w-[4.25rem] tabular-nums"
                    maxLength={4}
                  />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] text-muted-foreground">شهر</span>
                  <Input
                    id="filter-enroll-from-m"
                    inputMode="numeric"
                    value={enrollFromM}
                    onChange={(e) => setEnrollFromM(digitsOnly(e.target.value, 2))}
                    placeholder="MM"
                    className="h-9 w-[2.75rem] tabular-nums"
                    maxLength={2}
                  />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] text-muted-foreground">يوم</span>
                  <Input
                    id="filter-enroll-from-d"
                    inputMode="numeric"
                    value={enrollFromD}
                    onChange={(e) => setEnrollFromD(digitsOnly(e.target.value, 2))}
                    placeholder="DD"
                    className="h-9 w-[2.75rem] tabular-nums"
                    maxLength={2}
                  />
                </div>
              </div>
            </div>
            <div className="flex shrink-0 flex-col gap-1.5">
              <span className="text-xs font-medium text-foreground sm:text-sm">الالتحاق إلى</span>
              <div className="flex items-end gap-1.5" dir="ltr">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] text-muted-foreground">سنة</span>
                  <Input
                    id="filter-enroll-to-y"
                    inputMode="numeric"
                    value={enrollToY}
                    onChange={(e) => setEnrollToY(digitsOnly(e.target.value, 4))}
                    placeholder="YYYY"
                    className="h-9 w-[4.25rem] tabular-nums"
                    maxLength={4}
                  />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] text-muted-foreground">شهر</span>
                  <Input
                    id="filter-enroll-to-m"
                    inputMode="numeric"
                    value={enrollToM}
                    onChange={(e) => setEnrollToM(digitsOnly(e.target.value, 2))}
                    placeholder="MM"
                    className="h-9 w-[2.75rem] tabular-nums"
                    maxLength={2}
                  />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] text-muted-foreground">يوم</span>
                  <Input
                    id="filter-enroll-to-d"
                    inputMode="numeric"
                    value={enrollToD}
                    onChange={(e) => setEnrollToD(digitsOnly(e.target.value, 2))}
                    placeholder="DD"
                    className="h-9 w-[2.75rem] tabular-nums"
                    maxLength={2}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full min-w-0 space-y-2">
          <Label htmlFor="student-select">الطالب</Label>
          {loadingStudents ? (
            <p className="text-sm text-muted-foreground">جاري التحميل...</p>
          ) : students.length === 0 ? (
            <p className="text-sm text-muted-foreground">لا يوجد طلاب مسجلون بعد</p>
          ) : filteredStudents.length === 0 ? (
            <p className="text-sm text-muted-foreground">لا يوجد طلاب يطابقون معايير البحث</p>
          ) : (
            <Select value={selectedUserId} onValueChange={handleStudentDropdownChange}>
              <SelectTrigger id="student-select">
                <SelectValue placeholder="اختر طالباً..." />
              </SelectTrigger>
              <SelectContent>
                {filteredStudents.map((s) => {
                  const label = [s.first_name, s.last_name].filter(Boolean).join(' ').trim();
                  const primary = label || s.id_number || s.user_id.slice(0, 8);
                  const roleSuffix = s.is_admin ? ' (مشرف)' : '';
                  return (
                    <SelectItem key={s.user_id} value={s.user_id}>
                      {primary}
                      {roleSuffix}
                      {s.license_type ? ` — ${s.license_type}` : ''}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          )}
        </div>

        <div className="w-full min-w-0 space-y-2">
          <Label htmlFor="notif-message">نص الإشعار</Label>
          <Textarea
            id="notif-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="اكتب رسالتك للطالب هنا..."
            rows={4}
            dir="rtl"
          />
        </div>

        <Button onClick={handleSend} disabled={sending || loadingStudents} className="gap-2">
          <Send className="h-4 w-4" />
          {sending ? 'جاري الإرسال...' : 'إرسال الإشعار'}
        </Button>
      </CardContent>
    </Card>
  );
};
