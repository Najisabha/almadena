import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Pencil, Trash2, Plus, Eye, EyeOff, ImagePlus, X, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { api as apiClient } from '@/integrations/api/client';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:4000') + '/api';
const STATIC_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

function resolveImageUrl(url?: string | null): string {
  if (!url) return '';
  const clean = String(url).trim();
  if (!clean) return '';
  if (/^https?:\/\//i.test(clean)) return clean;
  if (clean.startsWith('//')) return `https:${clean}`;
  return `${STATIC_BASE}${clean.startsWith('/') ? '' : '/'}${clean}`;
}

const CATEGORIES = ['اشارات مرور', 'قوانين', 'ميكانيك'] as const;
type Category = (typeof CATEGORIES)[number];

const OPTION_LETTERS = ['A', 'B', 'C', 'D'] as const;
type OptionLetter = (typeof OPTION_LETTERS)[number];

const FALLBACK_LICENSES: License[] = [
  { id: 'fallback-B', code: 'B', name_ar: 'خصوصي', is_active: true, display_order: 1 },
  { id: 'fallback-C1', code: 'C1', name_ar: 'شحن خفيف', is_active: true, display_order: 2 },
  { id: 'fallback-C', code: 'C', name_ar: 'شحن ثقيل', is_active: true, display_order: 3 },
  { id: 'fallback-D1', code: 'D1', name_ar: 'عمومي', is_active: true, display_order: 4 },
  { id: 'fallback-A', code: 'A', name_ar: 'دراجة نارية', is_active: true, display_order: 5 },
];

interface License {
  id: string;
  code: string;
  name_ar: string;
  is_active: boolean;
  display_order: number;
}

interface TrafficSign {
  sign_code: string;
  title: string;
  image_url: string;
}

interface Question {
  id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  option_a_image_url: string | null;
  option_b_image_url: string | null;
  option_c_image_url: string | null;
  option_d_image_url: string | null;
  correct_answer: OptionLetter;
  difficulty: string;
  category: Category | null;
  sign_code: string | null;
  image_url: string | null;
  is_active: boolean;
  licenses: License[];
}

type FormData = {
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  option_a_image_url: string;
  option_b_image_url: string;
  option_c_image_url: string;
  option_d_image_url: string;
  correct_answer: OptionLetter;
  difficulty: string;
  category: string;
  sign_code: string;
  license_ids: string[];
};

function getToken() {
  return localStorage.getItem('almadena_token');
}

async function apiRequest<T>(
  path: string,
  init: RequestInit = {}
): Promise<{ data: T; error: { message: string } | null }> {
  try {
    const token = getToken();
    const headers: HeadersInit = { 'Content-Type': 'application/json', ...(init.headers || {}) };
    if (token) headers.Authorization = `Bearer ${token}`;
    const response = await fetch(`${API_BASE}${path}`, { ...init, headers });
    const payload = await response.json();
    if (!response.ok)
      return { data: null as T, error: { message: payload.detail || payload.message || 'Request failed' } };
    return { data: payload.data ?? payload, error: null };
  } catch (error) {
    return { data: null as T, error: { message: (error as Error).message } };
  }
}

async function uploadOptionImage(file: File): Promise<string> {
  const token = getToken();
  const fd = new FormData();
  fd.append('image', file);
  const response = await fetch(`${API_BASE}/upload/options`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: fd,
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'فشل رفع الصورة');
  return data.url as string;
}

// ─────────────────────────────────────────────────────────────────
// Combobox الشواخص — مبني بـ React خالص، بدون Radix Portal
// حتى لا يتعارض مع Dialog
// ─────────────────────────────────────────────────────────────────
interface SignComboboxProps {
  signs: TrafficSign[];
  value: string;
  onChange: (code: string) => void;
}

const SignCombobox = ({ signs, value, onChange }: SignComboboxProps) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = signs.find((s) => s.sign_code === value) ?? null;

  const filtered = query.trim()
    ? signs.filter(
        (s) =>
          s.sign_code.toLowerCase().includes(query.toLowerCase()) ||
          s.title.toLowerCase().includes(query.toLowerCase())
      )
    : signs;

  const handleSelect = useCallback(
    (code: string) => {
      onChange(code);
      setQuery('');
      setOpen(false);
    },
    [onChange]
  );

  // إغلاق عند الضغط خارج المكوّن
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative mt-1">
      {/* حقل بحث مباشر بدون زر */}
      <div className="relative">
        <input
          ref={inputRef}
          value={query}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          placeholder={selected ? `[${selected.sign_code}] ${selected.title}` : 'ابحث عن شاخصة...'}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      {/* القائمة المنسدلة */}
      {open && (
        <div className="absolute z-[200] mt-1 w-full rounded-md border bg-popover shadow-lg overflow-hidden">
          <div className="max-h-64 overflow-y-auto">
            {/* بدون شاخصة */}
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); handleSelect(''); }}
              className="w-full text-right px-3 py-2 text-sm text-muted-foreground hover:bg-accent transition-colors"
            >
              — بدون شاخصة —
            </button>

            {filtered.length === 0 && (
              <p className="px-3 py-4 text-center text-sm text-muted-foreground">لا توجد نتائج</p>
            )}

            {filtered.map((s) => (
              <button
                key={s.sign_code}
                type="button"
                onMouseDown={(e) => { e.preventDefault(); handleSelect(s.sign_code); }}
                className={`w-full flex items-center gap-3 px-3 py-2 text-sm text-right hover:bg-accent transition-colors ${
                  s.sign_code === value ? 'bg-accent/60 font-semibold' : ''
                }`}
              >
                <img
                  src={resolveImageUrl(s.image_url)}
                  alt={s.title}
                  className="h-8 w-8 object-contain rounded border bg-white shrink-0"
                />
                <span className="truncate">
                  <span className="text-primary font-mono text-xs ml-1">[{s.sign_code}]</span>
                  {s.title}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────
// مكوّن إدخال الخيار (نص + صورة)
// ─────────────────────────────────────────────────────────────────
interface OptionInputProps {
  letter: OptionLetter;
  text: string;
  imageUrl: string;
  isCorrect: boolean;
  onTextChange: (val: string) => void;
  onImageChange: (url: string) => void;
  onSelectCorrect: () => void;
}

const OptionInput = ({
  letter, text, imageUrl, isCorrect, onTextChange, onImageChange, onSelectCorrect,
}: OptionInputProps) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadOptionImage(file);
      onImageChange(url);
    } catch (err: any) {
      toast({ title: 'خطأ', description: err.message, variant: 'destructive' });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <div
      className={`relative rounded-xl border-2 p-3 transition-all ${
        isCorrect ? 'border-green-500 bg-green-50 dark:bg-green-950/20' : 'border-border bg-card'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <span
          className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-bold ${
            isCorrect ? 'bg-green-500 text-white' : 'bg-muted text-muted-foreground'
          }`}
        >
          {letter}
        </span>
        <button
          type="button"
          title="اضغط لتعيين هذا الخيار كإجابة صحيحة"
          onClick={onSelectCorrect}
          className={`text-xs flex items-center gap-1 px-2 py-1 rounded-lg transition-colors ${
            isCorrect
              ? 'bg-green-500 text-white'
              : 'bg-muted text-muted-foreground hover:bg-green-100 hover:text-green-700'
          }`}
        >
          <CheckCircle2 className="w-3 h-3" />
          {isCorrect ? 'صحيح ✓' : 'صحيح'}
        </button>
      </div>

      <Input
        placeholder={`نص الخيار ${letter}...`}
        value={text}
        onChange={(e) => onTextChange(e.target.value)}
        className="mb-2 text-sm"
      />

      {imageUrl ? (
        <div className="relative inline-block">
          <img
            src={resolveImageUrl(imageUrl)}
            alt={`خيار ${letter}`}
            className="h-16 w-auto rounded-lg border object-contain"
          />
          <button
            type="button"
            onClick={() => onImageChange('')}
            className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-0.5"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
        >
          <ImagePlus className="w-4 h-4" />
          {uploading ? 'جاري الرفع...' : 'إضافة صورة'}
        </button>
      )}
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────
// دالة تحليل نص السؤال: تُعيد مصفوفة من أجزاء (نص | رمز شاخصة)
// ─────────────────────────────────────────────────────────────────
type TextPart = { type: 'text'; value: string };
type SignPart = { type: 'sign'; code: string; sign: TrafficSign | null };
type QuestionPart = TextPart | SignPart;

function normalizeSignCode(code: string): string {
  return code.replace(/\s+/g, '').replace(/[–—]/g, '-').trim();
}

function getCodeVariants(code: string): string[] {
  const normalized = normalizeSignCode(code);
  const variants = new Set<string>([normalized]);
  const parts = normalized.split('-').filter(Boolean);
  if (parts.length === 2) {
    variants.add(`${parts[1]}-${parts[0]}`);
  }
  return Array.from(variants);
}

function parseQuestionText(text: string, signMap: Map<string, TrafficSign>): QuestionPart[] {
  const parts: QuestionPart[] = [];
  const regex = /\[([^\]]+)\]/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', value: text.slice(lastIndex, match.index) });
    }
    const rawCode = match[1];
    const variants = getCodeVariants(rawCode);
    const found = variants.map((v) => signMap.get(v)).find(Boolean) ?? null;
    parts.push({ type: 'sign', code: rawCode, sign: found });
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push({ type: 'text', value: text.slice(lastIndex) });
  }

  return parts;
}

const SignTokenBadge = ({ code, sign }: { code: string; sign: TrafficSign }) => {
  const [imageFailed, setImageFailed] = useState(false);

  if (!sign.image_url || imageFailed) {
    return (
      <span className="inline-flex items-center gap-1 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 rounded-md px-1.5 py-0.5">
        <span className="text-xs text-amber-700 font-mono">[{code}]</span>
        <span className="text-xs text-muted-foreground">صورة غير متوفرة</span>
      </span>
    );
  }

  return (
    <span
      className="inline-flex items-center gap-1 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 rounded-md px-1.5 py-0.5"
      title={sign.title}
    >
      <img
        src={resolveImageUrl(sign.image_url)}
        alt={sign.title}
        className="h-8 w-8 object-contain rounded bg-white"
        onError={() => setImageFailed(true)}
      />
      <span className="text-xs text-amber-700 font-mono">[{code}]</span>
    </span>
  );
};

// ─────────────────────────────────────────────────────────────────
// بطاقة المعاينة
// ─────────────────────────────────────────────────────────────────
interface PreviewCardProps {
  formData: FormData;
  sign: TrafficSign | null;
  allSigns: TrafficSign[];
}

const PreviewCard = ({ formData, sign, allSigns }: PreviewCardProps) => {
  const hasContent =
    formData.question_text.trim() ||
    formData.option_a.trim() ||
    formData.option_a_image_url;

  if (!hasContent) {
    return (
      <div className="rounded-xl border-2 border-dashed border-muted-foreground/25 p-6 text-center text-sm text-muted-foreground">
        ابدأ الكتابة لرؤية المعاينة...
      </div>
    );
  }

  // بناء خريطة البحث السريع sign_code → sign
  const signMap = new Map(allSigns.map((s) => [normalizeSignCode(s.sign_code), s]));

  const optionMap: Record<OptionLetter, { text: string; image: string }> = {
    A: { text: formData.option_a, image: formData.option_a_image_url },
    B: { text: formData.option_b, image: formData.option_b_image_url },
    C: { text: formData.option_c, image: formData.option_c_image_url },
    D: { text: formData.option_d, image: formData.option_d_image_url },
  };

  // تقسيم نص السؤال لاستبدال رموز [] بصور
  const questionParts = parseQuestionText(formData.question_text, signMap);

  return (
    <div className="rounded-xl border-2 border-primary/20 bg-card shadow-sm overflow-hidden">
      {/* رأس المعاينة */}
      <div className="bg-primary/5 border-b px-4 py-2 flex items-center gap-2">
        <span className="text-xs font-semibold text-primary uppercase tracking-wide">معاينة السؤال</span>
      </div>

      <div className="p-4 space-y-4" dir="rtl">
        {/* الشاخصة المختارة من الحقل */}
        {sign && (
          <div className="flex items-center gap-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 rounded-lg p-3">
            <img
              src={resolveImageUrl(sign.image_url)}
              alt={sign.title}
              className="h-14 w-14 object-contain rounded-md border bg-white"
            />
            <div>
              <p className="text-xs text-muted-foreground">الشاخصة المرتبطة</p>
              <p className="text-sm font-semibold">[{sign.sign_code}] {sign.title}</p>
            </div>
          </div>
        )}

        {/* نص السؤال مع استبدال [رمز] بصورة الشاخصة */}
        {formData.question_text && (
          <p className="text-sm font-semibold leading-relaxed text-foreground flex flex-wrap items-center gap-1">
            {questionParts.map((part, i) => {
              if (part.type === 'text') {
                return <span key={i}>{part.value}</span>;
              }
              if (part.sign) return <SignTokenBadge key={i} code={part.code} sign={part.sign} />;
              // رمز غير موجود في قاعدة البيانات → يبقى نصًا
              return (
                <span key={i} className="text-muted-foreground font-mono">
                  [{part.code}]
                </span>
              );
            })}
          </p>
        )}

        {/* الخيارات */}
        <div className="grid grid-cols-2 gap-2">
          {OPTION_LETTERS.map((letter) => {
            const opt = optionMap[letter];
            const isCorrect = formData.correct_answer === letter;
            const hasOpt = opt.text.trim() || opt.image;
            if (!hasOpt) return null;

            return (
              <div
                key={letter}
                className={`flex items-center gap-2 rounded-lg border p-2 text-sm transition-colors ${
                  isCorrect
                    ? 'border-green-500 bg-green-50 dark:bg-green-950/20 font-semibold text-green-700 dark:text-green-400'
                    : 'border-border bg-muted/30'
                }`}
              >
                <span
                  className={`shrink-0 inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                    isCorrect ? 'bg-green-500 text-white' : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {letter}
                </span>
                {opt.image ? (
                  <img
                    src={resolveImageUrl(opt.image)}
                    alt={`خيار ${letter}`}
                    className="h-10 w-auto object-contain rounded"
                  />
                ) : (
                  <span className="truncate">{opt.text}</span>
                )}
                {isCorrect && <CheckCircle2 className="shrink-0 w-4 h-4 text-green-500 ml-auto" />}
              </div>
            );
          })}
        </div>

        {/* التصنيف + الصعوبة */}
        <div className="flex flex-wrap gap-2 pt-1">
          {formData.category && (
            <Badge variant="outline" className="text-xs">{formData.category}</Badge>
          )}
          <Badge variant="secondary" className="text-xs">
            {formData.difficulty === 'easy' ? 'سهل' : formData.difficulty === 'medium' ? 'متوسط' : 'صعب'}
          </Badge>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────
// المكوّن الرئيسي
// ─────────────────────────────────────────────────────────────────
export const AdminQuestions = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [licenses, setLicenses] = useState<License[]>([]);
  const [usingFallbackLicenses, setUsingFallbackLicenses] = useState(false);
  const [trafficSigns, setTrafficSigns] = useState<TrafficSign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const { toast } = useToast();

  const emptyForm = (): FormData => ({
    question_text: '',
    option_a: '', option_b: '', option_c: '', option_d: '',
    option_a_image_url: '', option_b_image_url: '', option_c_image_url: '', option_d_image_url: '',
    correct_answer: 'A',
    difficulty: 'medium',
    category: '',
    sign_code: '',
    license_ids: [],
  });

  const [formData, setFormData] = useState<FormData>(emptyForm());

  const selectedSign = trafficSigns.find((s) => s.sign_code === formData.sign_code) ?? null;

  const fetchQuestions = async () => {
    try {
      const { data, error } = await apiRequest<Question[]>('/questions');
      if (error) throw new Error(error.message);
      setQuestions(data || []);
    } catch {
      toast({ title: 'خطأ', description: 'فشل في تحميل الأسئلة', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLicenses = async () => {
    try {
      const { data } = await apiClient.from('licenses').select().order('display_order', { ascending: true });
      const allLicenses = (data as License[] | null) || [];
      if (allLicenses.length > 0) {
        setLicenses(allLicenses);
        setUsingFallbackLicenses(false);
      } else {
        setLicenses(FALLBACK_LICENSES);
        setUsingFallbackLicenses(true);
      }
    } catch {
      setLicenses(FALLBACK_LICENSES);
      setUsingFallbackLicenses(true);
    }
  };

  const fetchTrafficSigns = async () => {
    try {
      const { data } = await apiClient.from('traffic_signs').select().order('sign_number', { ascending: true });
      const active = ((data as TrafficSign[] | null) || []).filter((s: any) => s.is_active) as TrafficSign[];
      setTrafficSigns(active);
    } catch { /* غير حرج */ }
  };

  const setOption = (letter: OptionLetter, field: 'text' | 'image', value: string) => {
    const key =
      field === 'text'
        ? (`option_${letter.toLowerCase()}` as keyof FormData)
        : (`option_${letter.toLowerCase()}_image_url` as keyof FormData);
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    for (const letter of OPTION_LETTERS) {
      const text = formData[`option_${letter.toLowerCase()}` as keyof FormData] as string;
      const img = formData[`option_${letter.toLowerCase()}_image_url` as keyof FormData] as string;
      if (!text.trim() && !img.trim()) {
        toast({
          title: 'خطأ',
          description: `الخيار ${letter} مطلوب (أدخل نصًا أو أرفق صورة)`,
          variant: 'destructive',
        });
        return;
      }
    }

    try {
      const payload = {
        ...formData,
        sign_code: formData.sign_code || null,
        category: formData.category || null,
        option_a_image_url: formData.option_a_image_url || null,
        option_b_image_url: formData.option_b_image_url || null,
        option_c_image_url: formData.option_c_image_url || null,
        option_d_image_url: formData.option_d_image_url || null,
      };

      if (editingQuestion) {
        const { error } = await apiRequest(`/questions/${editingQuestion.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
        if (error) throw new Error(error.message);
        toast({ title: 'تم التحديث', description: 'تم تحديث السؤال بنجاح' });
      } else {
        const { error } = await apiRequest('/questions', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        if (error) throw new Error(error.message);
        toast({ title: 'تمت الإضافة', description: 'تمت إضافة السؤال بنجاح' });
      }

      setIsDialogOpen(false);
      setEditingQuestion(null);
      setFormData(emptyForm());
      fetchQuestions();
    } catch (error: any) {
      toast({ title: 'خطأ', description: error.message, variant: 'destructive' });
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await apiRequest(`/questions/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ is_active: !currentStatus }),
      });
      if (error) throw new Error(error.message);
      toast({ title: 'تم التحديث', description: `تم ${!currentStatus ? 'تفعيل' : 'إلغاء تفعيل'} السؤال` });
      fetchQuestions();
    } catch (error: any) {
      toast({ title: 'خطأ', description: error.message, variant: 'destructive' });
    }
  };

  const deleteQuestion = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا السؤال؟')) return;
    try {
      const { error } = await apiRequest(`/questions/${id}`, { method: 'DELETE' });
      if (error) throw new Error(error.message);
      toast({ title: 'تم الحذف', description: 'تم حذف السؤال بنجاح' });
      fetchQuestions();
    } catch (error: any) {
      toast({ title: 'خطأ', description: error.message, variant: 'destructive' });
    }
  };

  const openEditDialog = (question: Question) => {
    setEditingQuestion(question);
    setFormData({
      question_text: question.question_text,
      option_a: question.option_a,
      option_b: question.option_b,
      option_c: question.option_c,
      option_d: question.option_d || '',
      option_a_image_url: question.option_a_image_url || '',
      option_b_image_url: question.option_b_image_url || '',
      option_c_image_url: question.option_c_image_url || '',
      option_d_image_url: question.option_d_image_url || '',
      correct_answer: question.correct_answer,
      difficulty: question.difficulty,
      category: question.category || '',
      sign_code: question.sign_code || '',
      license_ids: (question.licenses || []).map((l) => l.id),
    });
    setIsDialogOpen(true);
  };

  const toggleLicense = (licenseId: string) => {
    if (usingFallbackLicenses) return;
    setFormData((prev) => ({
      ...prev,
      license_ids: prev.license_ids.includes(licenseId)
        ? prev.license_ids.filter((id) => id !== licenseId)
        : [...prev.license_ids, licenseId],
    }));
  };

  useEffect(() => {
    fetchQuestions();
    fetchLicenses();
    fetchTrafficSigns();
  }, []);

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
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>إدارة الأسئلة</CardTitle>
            <CardDescription>إضافة وتعديل وحذف أسئلة الامتحانات</CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  setFormData(emptyForm());
                  setEditingQuestion(null);
                }}
              >
                <Plus className="ml-2 h-4 w-4" />
                إضافة سؤال
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto" dir="rtl">
              <DialogHeader>
                <DialogTitle>
                  {editingQuestion ? 'تعديل سؤال' : 'إضافة سؤال جديد (MCQ)'}
                </DialogTitle>
                <DialogDescription>
                  اختر من متعدد — حدد الإجابة الصحيحة بالضغط على الخيار
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* ── نص السؤال ── */}
                <div>
                  <Label htmlFor="question_text">نص السؤال</Label>
                  <Textarea
                    id="question_text"
                    value={formData.question_text}
                    onChange={(e) => setFormData({ ...formData, question_text: e.target.value })}
                    required
                    rows={3}
                    className="mt-1"
                    placeholder="اكتب نص السؤال... يمكن استخدام [SIGN_CODE] لإدراج صورة شاخصة مثل [أ-14]"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    يمكن استخدام [CODE] لإدراج شاخصة في أي مكان في النص.
                  </p>
                </div>

                {/* ── الخيارات ── */}
                <div>
                  <Label className="block mb-2">
                    الخيارات
                    <span className="text-xs text-muted-foreground mr-2">
                      (اضغط على الخيار لتعيينه صحيحًا)
                    </span>
                  </Label>
                  <div className="grid grid-cols-2 gap-3">
                    {OPTION_LETTERS.map((letter) => (
                      <OptionInput
                        key={letter}
                        letter={letter}
                        text={formData[`option_${letter.toLowerCase()}` as keyof FormData] as string}
                        imageUrl={
                          formData[`option_${letter.toLowerCase()}_image_url` as keyof FormData] as string
                        }
                        isCorrect={formData.correct_answer === letter}
                        onTextChange={(val) => setOption(letter, 'text', val)}
                        onImageChange={(url) => setOption(letter, 'image', url)}
                        onSelectCorrect={() =>
                          setFormData((prev) => ({ ...prev, correct_answer: letter }))
                        }
                      />
                    ))}
                  </div>
                </div>

                {/* ── معاينة مباشرة ── */}
                <div>
                  <Label className="block mb-2 text-primary font-semibold">معاينة السؤال</Label>
                  <PreviewCard
                    formData={formData}
                    sign={selectedSign}
                    allSigns={trafficSigns}
                  />
                </div>

                <Separator />

                {/* ── الصعوبة + التصنيف ── */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>مستوى الصعوبة</Label>
                    <Select
                      value={formData.difficulty}
                      onValueChange={(v) => setFormData({ ...formData, difficulty: v })}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="easy">سهل</SelectItem>
                        <SelectItem value="medium">متوسط</SelectItem>
                        <SelectItem value="hard">صعب</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>التصنيف</Label>
                    <Select
                      value={formData.category || '__none__'}
                      onValueChange={(v) =>
                        setFormData({ ...formData, category: v === '__none__' ? '' : v })
                      }
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="اختر تصنيفًا..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">— بدون تصنيف —</SelectItem>
                        {CATEGORIES.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* ── الرخص المرتبطة ── */}
                <div>
                  <Label className="block mb-2">الرخص المرتبطة (يمكن اختيار أكثر من رخصة)</Label>
                  {licenses.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2 rounded-lg border bg-muted/20 p-2">
                      {licenses.map((license) => (
                        <button
                          key={license.id}
                          type="button"
                          disabled={usingFallbackLicenses}
                          onClick={() => toggleLicense(license.id)}
                          className={`w-full rounded-md border px-3 py-2 text-sm transition-colors text-right ${
                            usingFallbackLicenses
                              ? 'cursor-not-allowed opacity-70 border-border bg-background text-muted-foreground'
                              : formData.license_ids.includes(license.id)
                              ? 'border-primary bg-primary/10 text-primary font-semibold'
                              : 'border-border bg-background text-foreground hover:bg-accent'
                          }`}
                          title={`اختيار رخصة ${license.name_ar}`}
                        >
                          <span className="inline-flex items-center gap-1">
                            {license.name_ar}
                            <span className="text-xs text-muted-foreground">({license.code})</span>
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-lg border border-dashed bg-muted/20 px-3 py-4 text-sm text-muted-foreground text-center">
                      لا توجد رخص محمّلة. شغّل تهيئة قاعدة البيانات من مجلد الـ backend أو راجع صفحة «الرخص المعتمدة» في الإدارة.
                    </div>
                  )}
                  {usingFallbackLicenses && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      هذه رخص افتراضية للعرض فقط. شغّل تهيئة قاعدة البيانات لتفعيل اختيارها وربطها بالسؤال.
                    </p>
                  )}
                </div>

                <DialogFooter className="pt-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    إلغاء
                  </Button>
                  <Button type="submit">
                    {editingQuestion ? 'تحديث السؤال' : 'إضافة السؤال'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent>
        {questions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">لا توجد أسئلة بعد</div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">السؤال</TableHead>
                  <TableHead className="text-right">التصنيف</TableHead>
                  <TableHead className="text-right">الصعوبة</TableHead>
                  <TableHead className="text-right">الإجابة</TableHead>
                  <TableHead className="text-right">الرخص</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="text-right">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {questions.map((question) => (
                  <TableRow key={question.id}>
                    <TableCell className="max-w-xs truncate">{question.question_text}</TableCell>
                    <TableCell>
                      {question.category ? (
                        <Badge variant="outline">{question.category}</Badge>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {question.difficulty === 'easy'
                        ? 'سهل'
                        : question.difficulty === 'medium'
                        ? 'متوسط'
                        : 'صعب'}
                    </TableCell>
                    <TableCell className="font-bold">{question.correct_answer}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {(question.licenses || []).length > 0 ? (
                          question.licenses.map((l) => (
                            <Badge key={l.id} variant="secondary" className="text-xs">
                              {l.code}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={question.is_active ? 'default' : 'secondary'}>
                        {question.is_active ? 'نشط' : 'غير نشط'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleActive(question.id, question.is_active)}
                        >
                          {question.is_active ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(question)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteQuestion(question.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
