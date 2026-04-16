import { useState, useEffect, useCallback, useRef } from 'react';
import {
  api as apiClient,
  type AdminStudentManagementRow,
  type AdminUserPatchPayload,
} from '@/integrations/api/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Eye, Pin, Pencil, Trash2, Upload } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/features/auth/AuthProvider';

type Student = AdminStudentManagementRow;

const STATIC_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

function resolveProfileImageUrl(url: string | null | undefined): string {
  if (!url) return '';
  const clean = String(url).trim();
  if (!clean) return '';
  if (/^https?:\/\//i.test(clean)) return clean;
  if (clean.startsWith('//')) return `https:${clean}`;
  return `${STATIC_BASE}${clean.startsWith('/') ? '' : '/'}${clean}`;
}

const ID_IMAGE_STATUS_AR: Record<string, string> = {
  none: 'بدون صورة',
  pending: 'قيد المراجعة',
  waitlist: 'قائمة الانتظار',
  accepted: 'مقبولة',
  rejected: 'مرفوضة',
};

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

/** يوحّد قيمة profile.license_type إلى كود رخصة من الجدول عند الإمكان (مثل التسجيل بـ code). */
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

function formatLicenseDisplay(raw: string | null | undefined, pool: LicenseRow[]): string {
  if (!raw) return '—';
  const list = pool.length > 0 ? pool : FALLBACK_LICENSES;
  const code = mapProfileLicenseToCode(raw, list);
  const row = list.find((l) => l.code === code);
  if (row) return `${row.name_ar} (${row.code})`;
  return raw;
}

type FormState = {
  id_number: string;
  first_name: string;
  last_name: string;
  phone: string;
  license_type: string;
  city: string;
  town: string;
  full_address: string;
  date_of_birth: string;
  id_image_url: string;
  id_image_status: string;
  id_image_pinned: boolean;
  theory_score: string;
  practical_score: string;
  notes: string;
  is_admin: boolean;
};

const EMPTY_FORM: FormState = {
  id_number: '',
  first_name: '',
  last_name: '',
  phone: '',
  license_type: '',
  city: '',
  town: '',
  full_address: '',
  date_of_birth: '',
  id_image_url: '',
  id_image_status: 'none',
  id_image_pinned: false,
  theory_score: '',
  practical_score: '',
  notes: '',
  is_admin: false,
};

function studentToForm(s: Student): FormState {
  return {
    id_number: s.id_number ?? '',
    first_name: s.profiles?.first_name ?? '',
    last_name: s.profiles?.last_name ?? '',
    phone: s.profiles?.phone ?? '',
    license_type: s.profiles?.license_type ?? '',
    city: (s.profiles as any)?.city ?? '',
    town: (s.profiles as any)?.town ?? '',
    full_address: (s.profiles as any)?.full_address ?? '',
    date_of_birth: (s.profiles as any)?.date_of_birth ?? '',
    id_image_url: (s.profiles as any)?.id_image_url ?? '',
    id_image_status: (s.profiles as any)?.id_image_status ?? 'none',
    id_image_pinned: Boolean((s.profiles as any)?.id_image_pinned),
    theory_score: s.theory_score?.toString() ?? '',
    practical_score: s.practical_score?.toString() ?? '',
    notes: s.notes ?? '',
    is_admin: s.is_admin ?? false,
  };
}

function formToPayload(form: FormState, original: Student): AdminUserPatchPayload {
  const payload: AdminUserPatchPayload = {};

  if (form.id_number !== (original.id_number ?? '')) {
    payload.user = { id_number: form.id_number };
  }

  const p = original.profiles as any;
  const profilePatch: AdminUserPatchPayload['profile'] = {};
  if (form.first_name !== (p?.first_name ?? '')) profilePatch.first_name = form.first_name;
  if (form.last_name !== (p?.last_name ?? '')) profilePatch.last_name = form.last_name;
  if (form.phone !== (p?.phone ?? '')) profilePatch.phone = form.phone || null;
  if (form.license_type !== (p?.license_type ?? '')) profilePatch.license_type = form.license_type || null;
  if (form.city !== (p?.city ?? '')) profilePatch.city = form.city || null;
  if (form.town !== (p?.town ?? '')) profilePatch.town = form.town || null;
  if (form.full_address !== (p?.full_address ?? '')) profilePatch.full_address = form.full_address || null;
  if (form.date_of_birth !== (p?.date_of_birth ?? '')) profilePatch.date_of_birth = form.date_of_birth || null;
  if (form.id_image_url !== (p?.id_image_url ?? '')) {
    profilePatch.id_image_url = form.id_image_url || null;
    profilePatch.id_image_status = form.id_image_url ? 'pending' : 'none';
  } else {
    const origStatus = p?.id_image_status ?? 'none';
    if (form.id_image_status !== origStatus) {
      profilePatch.id_image_status = form.id_image_status;
    }
  }
  const origPinned = Boolean(p?.id_image_pinned);
  if (form.id_image_pinned !== origPinned) {
    profilePatch.id_image_pinned = form.id_image_pinned;
  }
  if (Object.keys(profilePatch).length > 0) payload.profile = profilePatch;

  const studentPatch: AdminUserPatchPayload['student'] = {};
  const newTheory = form.theory_score !== '' ? parseInt(form.theory_score, 10) : null;
  const newPractical = form.practical_score !== '' ? parseInt(form.practical_score, 10) : null;
  if (newTheory !== (original.theory_score ?? null)) studentPatch.theory_score = newTheory;
  if (newPractical !== (original.practical_score ?? null)) studentPatch.practical_score = newPractical;
  if (form.notes !== (original.notes ?? '')) studentPatch.notes = form.notes || null;
  if (Object.keys(studentPatch).length > 0) payload.student = studentPatch;

  if (form.is_admin !== (original.is_admin ?? false)) payload.is_admin = form.is_admin;

  return payload;
}

function buildFullPayload(form: FormState): AdminUserPatchPayload {
  return {
    user: { id_number: form.id_number },
    profile: {
      first_name: form.first_name,
      last_name: form.last_name,
      phone: form.phone || null,
      license_type: form.license_type || null,
      city: form.city || null,
      town: form.town || null,
      full_address: form.full_address || null,
      date_of_birth: form.date_of_birth || null,
      id_image_url: form.id_image_url || null,
      id_image_status: form.id_image_status,
      id_image_pinned: form.id_image_pinned,
    },
    student: {
      theory_score: form.theory_score !== '' ? parseInt(form.theory_score, 10) : null,
      practical_score: form.practical_score !== '' ? parseInt(form.practical_score, 10) : null,
      notes: form.notes || null,
    },
    is_admin: form.is_admin,
  };
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

export const AdminStudents = () => {
  const { user: authUser } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [formData, setFormData] = useState<FormState>(EMPTY_FORM);
  const [jsonText, setJsonText] = useState('');
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [licenses, setLicenses] = useState<LicenseRow[]>([]);
  const [idImagePreviewUrl, setIdImagePreviewUrl] = useState<string | null>(null);
  const [isUploadingIdDoc, setIsUploadingIdDoc] = useState(false);
  const idDocFileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const fetchLicenses = useCallback(async () => {
    try {
      const { data } = await apiClient.from('licenses').select().order('display_order', { ascending: true });
      const rows = (data as LicenseRow[] | null) || [];
      setLicenses(rows.length > 0 ? rows : FALLBACK_LICENSES);
    } catch {
      setLicenses(FALLBACK_LICENSES);
    }
  }, []);

  const fetchStudents = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const { data, error } = await apiClient.getAdminStudentsManagement();
      if (error) throw new Error(error.message);
      setStudents(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'فشل في تحميل بيانات الطلاب';
      setLoadError(message);
      setStudents([]);
      toast({ title: 'خطأ', description: message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);
  useEffect(() => { void fetchLicenses(); }, [fetchLicenses]);

  const openEditDialog = (student: Student) => {
    setEditingStudent(student);
    const form = studentToForm(student);
    form.license_type = mapProfileLicenseToCode(form.license_type, licenses.length > 0 ? licenses : FALLBACK_LICENSES);
    setFormData(form);
    setJsonText(JSON.stringify(buildFullPayload(form), null, 2));
    setJsonError(null);
    setIsDialogOpen(true);
  };

  const syncJsonFromForm = (updated: FormState) => {
    setJsonText(JSON.stringify(buildFullPayload(updated), null, 2));
    setJsonError(null);
  };

  const set = (field: keyof FormState, value: string | boolean) => {
    const updated = { ...formData, [field]: value } as FormState;
    setFormData(updated);
    syncJsonFromForm(updated);
  };

  async function applyProfileQuickPatch(profile: NonNullable<AdminUserPatchPayload['profile']>) {
    if (!editingStudent) return;
    setIsSaving(true);
    try {
      const { data, error } = await apiClient.patchAdminUser(editingStudent.user_id, { profile });
      if (error) throw new Error(error.message);
      if (data) {
        const row = data as Student;
        setEditingStudent(row);
        const form = studentToForm(row);
        form.license_type = mapProfileLicenseToCode(form.license_type, licenses.length > 0 ? licenses : FALLBACK_LICENSES);
        setFormData(form);
        syncJsonFromForm(form);
        void fetchStudents();
      }
      toast({ title: 'تم التحديث', description: 'تم حفظ بيانات صورة الهوية' });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'فشل التحديث';
      toast({ title: 'خطأ', description: message, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleIdDocFileSelected(file: File | undefined | null) {
    if (!file || !editingStudent) return;
    const idNum = (formData.id_number ?? editingStudent.id_number ?? '').trim();
    if (!idNum) {
      toast({
        title: 'خطأ',
        description: 'أدخل رقم الهوية أولاً لرفع صورة الهوية (يُستخدم لتسمية الملف)',
        variant: 'destructive',
      });
      return;
    }
    setIsUploadingIdDoc(true);
    try {
      const { data, error } = await apiClient.uploadAdminIdDocumentImage(file, idNum);
      if (error || !data?.url) throw new Error(error?.message || 'فشل رفع الصورة');
      const url = data.url.startsWith('/') ? data.url : `/${data.url}`;
      await applyProfileQuickPatch({ id_image_url: url, id_image_status: 'pending' });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'فشل الرفع';
      toast({ title: 'خطأ', description: message, variant: 'destructive' });
    } finally {
      setIsUploadingIdDoc(false);
      if (idDocFileInputRef.current) idDocFileInputRef.current.value = '';
    }
  }

  const handleJsonChange = (raw: string) => {
    setJsonText(raw);
    try {
      const parsed = JSON.parse(raw) as AdminUserPatchPayload;
      setJsonError(null);
      const merged: FormState = {
        ...formData,
        id_number: parsed.user?.id_number ?? formData.id_number,
        first_name: parsed.profile?.first_name ?? formData.first_name,
        last_name: parsed.profile?.last_name ?? formData.last_name,
        phone: parsed.profile?.phone ?? formData.phone,
        license_type: parsed.profile?.license_type ?? formData.license_type,
        city: parsed.profile?.city ?? formData.city,
        town: parsed.profile?.town ?? formData.town,
        full_address: parsed.profile?.full_address ?? formData.full_address,
        date_of_birth: parsed.profile?.date_of_birth ?? formData.date_of_birth,
        id_image_url: parsed.profile?.id_image_url ?? formData.id_image_url,
        id_image_status: parsed.profile?.id_image_status ?? formData.id_image_status,
        id_image_pinned: parsed.profile?.id_image_pinned ?? formData.id_image_pinned,
        theory_score: parsed.student?.theory_score?.toString() ?? formData.theory_score,
        practical_score: parsed.student?.practical_score?.toString() ?? formData.practical_score,
        notes: parsed.student?.notes ?? formData.notes,
        is_admin: parsed.is_admin ?? formData.is_admin,
      };
      setFormData(merged);
    } catch {
      setJsonError('JSON غير صالح — تحقق من الصياغة');
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!editingStudent) return;
    if (jsonError) {
      toast({ title: 'خطأ', description: 'صحّح أخطاء JSON أولًا', variant: 'destructive' });
      return;
    }
    setIsSaving(true);
    try {
      const payload = formToPayload(formData, editingStudent);
      if (Object.keys(payload).length === 0) {
        toast({ title: 'لا تغييرات', description: 'لم يتم تعديل أي حقل' });
        setIsDialogOpen(false);
        return;
      }
      const { error } = await apiClient.patchAdminUser(editingStudent.user_id, payload);
      if (error) throw new Error(error.message);
      toast({ title: 'تم التحديث', description: 'تم حفظ بيانات المستخدم بنجاح' });
      setIsDialogOpen(false);
      setEditingStudent(null);
      fetchStudents();
    } catch (err: any) {
      toast({ title: 'خطأ', description: err.message, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const deleteStudent = async (userId: string) => {
    if (
      !confirm(
        'هل أنت متأكد من حذف هذا الحساب بالكامل؟ سيتم حذف الملف الشخصي والأدوار وسجل الطالب وجميع محاولات الامتحان والإشعارات المرتبطة به.'
      )
    ) {
      return;
    }
    try {
      const { error } = await apiClient.deleteAdminUser(userId);
      if (error) throw new Error(error.message);
      toast({ title: 'تم الحذف', description: 'تم حذف الحساب بنجاح' });
      fetchStudents();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'فشل الحذف';
      toast({ title: 'خطأ', description: message, variant: 'destructive' });
    }
  };

  const effectiveLicenses = licenses.length > 0 ? licenses : FALLBACK_LICENSES;
  const licenseSelectOptions = effectiveLicenses.filter((l) => l.is_active !== false);
  const licenseSelectCodes = new Set(licenseSelectOptions.map((l) => l.code));
  const licenseSelectLegacy =
    formData.license_type &&
    !licenseSelectCodes.has(formData.license_type) &&
    formData.license_type !== '__none__'
      ? formData.license_type
      : null;
  const licenseSelectValue = formData.license_type ? formData.license_type : '__none__';
  const licenseItemValues = new Set<string>(['__none__', ...licenseSelectOptions.map((l) => l.code)]);
  if (licenseSelectLegacy) licenseItemValues.add(licenseSelectLegacy);
  const safeLicenseSelectValue = licenseItemValues.has(licenseSelectValue)
    ? licenseSelectValue
    : '__none__';

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
            <p className="mt-4 text-muted-foreground">جاري التحميل...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>إدارة الطلاب</CardTitle>
          <CardDescription>جميع المستخدمين بما فيهم المشرفون — يظهر رقم الهوية حتى لو لم يكتمل الملف الشخصي</CardDescription>
        </CardHeader>
        <CardContent>
          {loadError ? (
            <div className="text-center py-8 space-y-3">
              <p className="text-destructive">{loadError}</p>
              <p className="text-sm text-muted-foreground">
                غالباً الخادم يعمل بنسخة قديمة من الـ API. أوقف عملية Node على المنفذ 4000 ثم شغّل من مجلد{' '}
                <code className="text-xs bg-muted px-1 rounded">backend</code>:{' '}
                <code className="text-xs bg-muted px-1 rounded">npm run dev</code>
              </p>
              <Button variant="outline" onClick={() => void fetchStudents()}>إعادة المحاولة</Button>
            </div>
          ) : students.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">لا يوجد مستخدمون مسجلون بعد</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">الاسم</TableHead>
                    <TableHead className="text-right">الدور</TableHead>
                    <TableHead className="text-right">رقم الهوية</TableHead>
                    <TableHead className="text-right">رقم الهاتف</TableHead>
                    <TableHead className="text-right">نوع الرخصة</TableHead>
                    <TableHead className="text-right">علامة التيوريا</TableHead>
                    <TableHead className="text-right">علامة العملي</TableHead>
                    <TableHead className="text-right">عدد الامتحانات</TableHead>
                    <TableHead className="text-right">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student, rowIndex) => {
                    const displayName = [student.profiles?.first_name, student.profiles?.last_name]
                      .filter(Boolean).join(' ').trim();
                    const rowKey = student.user_id || `row-${rowIndex}`;
                    return (
                      <TableRow key={rowKey}>
                        <TableCell className="font-medium">{displayName || '—'}</TableCell>
                        <TableCell>
                          {student.is_admin
                            ? <Badge variant="secondary">مشرف</Badge>
                            : <Badge variant="outline">طالب</Badge>}
                        </TableCell>
                        <TableCell className="tabular-nums">{student.id_number ?? '—'}</TableCell>
                        <TableCell>{student.profiles?.phone || '-'}</TableCell>
                        <TableCell>{formatLicenseDisplay(student.profiles?.license_type ?? null, effectiveLicenses)}</TableCell>
                        <TableCell>{student.theory_score !== null ? student.theory_score : '-'}</TableCell>
                        <TableCell>{student.practical_score !== null ? student.practical_score : '-'}</TableCell>
                        <TableCell>{student.total_exams_taken}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => openEditDialog(student)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            {authUser && student.user_id && student.user_id !== authUser.id && (
                              <Button variant="outline" size="sm" onClick={() => deleteStudent(student.user_id!)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) setEditingStudent(null); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>تعديل بيانات المستخدم</DialogTitle>
            <DialogDescription>
              {editingStudent
                ? `تعديل: ${[editingStudent.profiles?.first_name, editingStudent.profiles?.last_name].filter(Boolean).join(' ') || editingStudent.id_number || editingStudent.user_id}`
                : ''}
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="form" className="w-full">
            <TabsList className="w-full">
              <TabsTrigger value="form" className="flex-1">النموذج</TabsTrigger>
              <TabsTrigger value="json" className="flex-1">JSON متقدم</TabsTrigger>
            </TabsList>

            {/* ── تبويب النموذج ── */}
            <TabsContent value="form" className="mt-4">
              <form id="edit-form" onSubmit={handleSubmit} className="space-y-5">

                {/* معلومات الحساب */}
                <section>
                  <p className="text-sm font-semibold mb-2">معلومات الحساب</p>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="رقم الهوية">
                      <Input
                        inputMode="numeric"
                        value={formData.id_number}
                        onChange={(e) => set('id_number', e.target.value)}
                        placeholder="رقم الهوية"
                      />
                    </Field>
                    <Field label="دور المشرف">
                      <div className="flex items-center gap-2 h-10">
                        <Switch
                          checked={formData.is_admin}
                          onCheckedChange={(checked) => set('is_admin', checked)}
                          id="is_admin"
                        />
                        <Label htmlFor="is_admin" className="text-sm cursor-pointer">
                          {formData.is_admin ? 'مشرف' : 'طالب'}
                        </Label>
                        {!formData.is_admin && editingStudent?.is_admin && (
                          <span className="text-xs text-destructive">سيُزال دور المشرف</span>
                        )}
                      </div>
                    </Field>
                  </div>
                </section>

                <Separator />

                {/* الملف الشخصي */}
                <section>
                  <p className="text-sm font-semibold mb-2">الملف الشخصي</p>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="الاسم الأول">
                      <Input value={formData.first_name} onChange={(e) => set('first_name', e.target.value)} placeholder="الاسم الأول" />
                    </Field>
                    <Field label="الاسم الأخير">
                      <Input value={formData.last_name} onChange={(e) => set('last_name', e.target.value)} placeholder="الاسم الأخير" />
                    </Field>
                    <Field label="رقم الهاتف">
                      <Input value={formData.phone} onChange={(e) => set('phone', e.target.value)} placeholder="05xxxxxxxx" />
                    </Field>
                    <Field label="نوع الرخصة">
                      <Select
                        value={safeLicenseSelectValue}
                        onValueChange={(v) => set('license_type', v === '__none__' ? '' : v)}
                      >
                        <SelectTrigger className="text-right">
                          <SelectValue placeholder="اختر نوع الرخصة" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__" className="text-right">
                            بدون تحديد
                          </SelectItem>
                          {licenseSelectLegacy ? (
                            <SelectItem
                              value={licenseSelectLegacy}
                              className="text-right text-amber-800 dark:text-amber-200"
                            >
                              {licenseSelectLegacy} (قيمة غير في القائمة)
                            </SelectItem>
                          ) : null}
                          {licenseSelectOptions.map((l) => (
                            <SelectItem key={l.id} value={l.code} className="text-right">
                              {l.name_ar} ({l.code})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field label="تاريخ الميلاد">
                      <Input type="date" value={formData.date_of_birth} onChange={(e) => set('date_of_birth', e.target.value)} />
                    </Field>
                    <Field label="المدينة">
                      <Input value={formData.city} onChange={(e) => set('city', e.target.value)} placeholder="المدينة" />
                    </Field>
                    <Field label="البلدة">
                      <Input value={formData.town} onChange={(e) => set('town', e.target.value)} placeholder="البلدة" />
                    </Field>
                    <Field label="العنوان الكامل">
                      <Input value={formData.full_address} onChange={(e) => set('full_address', e.target.value)} placeholder="العنوان" />
                    </Field>
                    <div className="col-span-2 space-y-3 rounded-lg border bg-muted/30 p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-sm font-semibold">صورة الهوية</span>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline">
                            {ID_IMAGE_STATUS_AR[formData.id_image_status] ?? formData.id_image_status}
                          </Badge>
                          {formData.id_image_pinned ? (
                            <Badge variant="secondary">مثبتة</Badge>
                          ) : null}
                        </div>
                      </div>
                      <Field label="رابط الصورة أو رفع ملف (jpg / png / webp / gif — حتى 5 ميجابايت)">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
                          <Input
                            value={formData.id_image_url ?? ''}
                            onChange={(e) => set('id_image_url', e.target.value)}
                            placeholder="https://... أو /uploads/id-documents/..."
                            dir="ltr"
                            className="text-left font-mono text-sm sm:flex-1"
                          />
                          <input
                            ref={idDocFileInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/gif"
                            className="sr-only"
                            onChange={(e) => void handleIdDocFileSelected(e.target.files?.[0])}
                          />
                          <Button
                            type="button"
                            variant="secondary"
                            className="shrink-0"
                            disabled={isSaving || isUploadingIdDoc || !editingStudent}
                            onClick={() => idDocFileInputRef.current?.click()}
                          >
                            <Upload className="ms-2 h-4 w-4" />
                            {isUploadingIdDoc ? 'جاري الرفع...' : 'رفع صورة'}
                          </Button>
                        </div>
                      </Field>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={isSaving || isUploadingIdDoc || !resolveProfileImageUrl(formData.id_image_url ?? '')}
                          onClick={() =>
                            setIdImagePreviewUrl(resolveProfileImageUrl(formData.id_image_url ?? '') || null)
                          }
                        >
                          <Eye className="ms-1 h-4 w-4" />
                          عرض
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="default"
                          disabled={isSaving || isUploadingIdDoc || !(formData.id_image_url ?? '').trim()}
                          onClick={() =>
                            void applyProfileQuickPatch({
                              id_image_url: (formData.id_image_url ?? '').trim() || null,
                              id_image_status: 'accepted',
                            })
                          }
                        >
                          قبول
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          disabled={isSaving || isUploadingIdDoc || !(formData.id_image_url ?? '').trim()}
                          onClick={() =>
                            void applyProfileQuickPatch({
                              id_image_url: (formData.id_image_url ?? '').trim() || null,
                              id_image_status: 'waitlist',
                            })
                          }
                        >
                          قائمة الانتظار
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={isSaving || isUploadingIdDoc}
                          onClick={() =>
                            void applyProfileQuickPatch({ id_image_pinned: !formData.id_image_pinned })
                          }
                        >
                          <Pin className="ms-1 h-4 w-4" />
                          {formData.id_image_pinned ? 'إلغاء التثبيت' : 'تثبيت'}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          disabled={isSaving || isUploadingIdDoc || !(formData.id_image_url ?? '').trim()}
                          onClick={() => {
                            if (!confirm('إزالة صورة الهوية من الملف؟')) return;
                            void applyProfileQuickPatch({ id_image_url: null, id_image_status: 'none' });
                          }}
                        >
                          <Trash2 className="ms-1 h-4 w-4" />
                          إزالة الصورة
                        </Button>
                      </div>
                    </div>
                  </div>
                </section>

                <Separator />

                {/* سجل الطالب */}
                <section>
                  <p className="text-sm font-semibold mb-2">سجل الطالب</p>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="علامة التيوريا">
                      <Input
                        type="number" min="0" max="100"
                        value={formData.theory_score}
                        onChange={(e) => set('theory_score', e.target.value)}
                        placeholder="0–100"
                      />
                    </Field>
                    <Field label="علامة العملي">
                      <Input
                        type="number" min="0" max="100"
                        value={formData.practical_score}
                        onChange={(e) => set('practical_score', e.target.value)}
                        placeholder="0–100"
                      />
                    </Field>
                    <div className="col-span-2">
                      <Field label="ملاحظات">
                        <Textarea
                          value={formData.notes}
                          onChange={(e) => set('notes', e.target.value)}
                          placeholder="ملاحظات عن الطالب..."
                          rows={3}
                        />
                      </Field>
                    </div>
                  </div>
                </section>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>إلغاء</Button>
                  <Button type="submit" disabled={isSaving}>
                    {isSaving ? 'جاري الحفظ...' : editingStudent?.id ? 'حفظ التغييرات' : 'إنشاء السجل وحفظ'}
                  </Button>
                </DialogFooter>
              </form>
            </TabsContent>

            {/* ── تبويب JSON ── */}
            <TabsContent value="json" className="mt-4 space-y-3">
              <p className="text-xs text-muted-foreground">
                تعديل الـ JSON مباشرة — أي تغيير يُزامن حقول النموذج أعلاه. البنية:{' '}
                <code className="bg-muted px-1 rounded text-xs">{'{ user?, profile?, student?, is_admin? }'}</code>
              </p>
              <Textarea
                className={`font-mono text-xs min-h-[350px] ${jsonError ? 'border-destructive' : ''}`}
                value={jsonText}
                onChange={(e) => handleJsonChange(e.target.value)}
                spellCheck={false}
                dir="ltr"
              />
              {jsonError && <p className="text-xs text-destructive">{jsonError}</p>}
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>إلغاء</Button>
                <Button disabled={!!jsonError || isSaving} onClick={() => void handleSubmit()}>
                  {isSaving ? 'جاري الحفظ...' : 'حفظ'}
                </Button>
              </DialogFooter>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      <Dialog open={!!idImagePreviewUrl} onOpenChange={(open) => { if (!open) setIdImagePreviewUrl(null); }}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>معاينة صورة الهوية</DialogTitle>
            <DialogDescription>عرض الصورة الحالية كما تُخزَّن في الرابط.</DialogDescription>
          </DialogHeader>
          {idImagePreviewUrl ? (
            <img
              src={idImagePreviewUrl}
              alt="صورة الهوية"
              className="max-h-[75vh] w-auto max-w-full rounded-md border object-contain mx-auto"
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
};
