import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  Pencil,
  Trash2,
  Plus,
  Eye,
  EyeOff,
  X,
  CheckCircle2,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
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
  correct_answer: OptionLetter;
  supplemental_wrong_answer?: OptionLetter | null;
  supplemental_answer_changed_emergency?: boolean;
  difficulty: string;
  category: Category | null;
  is_active: boolean;
  licenses: License[];
}

type FormData = {
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: OptionLetter;
  supplemental_wrong_answer: OptionLetter | '';
  supplemental_answer_changed_emergency: boolean;
  difficulty: string;
  category: string;
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
    const headers = new Headers(init.headers || {});
    if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
    if (token) headers.set('Authorization', `Bearer ${token}`);
    const response = await fetch(`${API_BASE}${path}`, { ...init, headers });
    const payload = await response.json();
    if (!response.ok)
      return { data: null as T, error: { message: payload.detail || payload.message || 'Request failed' } };
    return { data: payload.data ?? payload, error: null };
  } catch (error) {
    return { data: null as T, error: { message: (error as Error).message } };
  }
}

// ─────────────────────────────────────────────────────────────────
// مكوّن إدخال الخيار (نص فقط)
// ─────────────────────────────────────────────────────────────────
interface OptionInputProps {
  letter: OptionLetter;
  text: string;
  isCorrect: boolean;
  onTextChange: (val: string) => void;
  onSelectCorrect: () => void;
}

const OptionInput = ({
  letter, text, isCorrect, onTextChange, onSelectCorrect,
}: OptionInputProps) => (
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
      className="text-sm"
    />
  </div>
);

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
  allSigns: TrafficSign[];
}

const PreviewCard = ({ formData, allSigns }: PreviewCardProps) => {
  const hasContent =
    formData.question_text.trim() ||
    formData.option_a.trim();

  if (!hasContent) {
    return (
      <div className="rounded-xl border-2 border-dashed border-muted-foreground/25 p-6 text-center text-sm text-muted-foreground">
        ابدأ الكتابة لرؤية المعاينة...
      </div>
    );
  }

  const signMap = new Map(allSigns.map((s) => [normalizeSignCode(s.sign_code), s]));

  const optionMap: Record<OptionLetter, string> = {
    A: formData.option_a,
    B: formData.option_b,
    C: formData.option_c,
    D: formData.option_d,
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
            const optText = optionMap[letter];
            const isCorrect = formData.correct_answer === letter;
            if (!optText.trim()) return null;

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
                <span className="truncate flex flex-wrap items-center gap-1">
                  {parseQuestionText(optText, signMap).map((part, idx) => {
                    if (part.type === 'text') return <span key={idx}>{part.value}</span>;
                    if (part.sign) return <SignTokenBadge key={idx} code={part.code} sign={part.sign} />;
                    return (
                      <span key={idx} className="text-muted-foreground font-mono">
                        [{part.code}]
                      </span>
                    );
                  })}
                </span>
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
    correct_answer: 'A',
    supplemental_wrong_answer: '',
    supplemental_answer_changed_emergency: false,
    difficulty: 'medium',
    category: '',
    license_ids: [],
  });

  const [formData, setFormData] = useState<FormData>(emptyForm());
  const [isEmergencyDialogOpen, setIsEmergencyDialogOpen] = useState(false);
  const [emergencyAnswerDraft, setEmergencyAnswerDraft] = useState('');

  const resolveSupplementalWrongLetter = (current: FormData): OptionLetter => {
    if (current.supplemental_wrong_answer && current.supplemental_wrong_answer !== current.correct_answer) {
      return current.supplemental_wrong_answer;
    }
    return OPTION_LETTERS.find((letter) => letter !== current.correct_answer) || 'A';
  };

  const openEmergencyDialog = () => {
    const wrongLetter = resolveSupplementalWrongLetter(formData);
    const wrongKey = `option_${wrongLetter.toLowerCase()}` as keyof FormData;
    setEmergencyAnswerDraft(String(formData[wrongKey] || ''));
    setIsEmergencyDialogOpen(true);
  };

  const applyEmergencyAnswer = () => {
    const nextText = emergencyAnswerDraft.trim();
    if (!nextText) {
      toast({
        title: 'خطأ',
        description: 'ادخل الجواب الجديد للاستكمالي',
        variant: 'destructive',
      });
      return;
    }

    const wrongLetter = resolveSupplementalWrongLetter(formData);
    const correctKey = `option_${formData.correct_answer.toLowerCase()}` as keyof FormData;
    const correctText = String(formData[correctKey] || '').trim();
    if (nextText === correctText) {
      toast({
        title: 'خطأ',
        description: 'الجواب الجديد للاستكمالي يجب أن يختلف عن نص الإجابة الصحيحة',
        variant: 'destructive',
      });
      return;
    }

    const wrongKey = `option_${wrongLetter.toLowerCase()}` as keyof FormData;
    setFormData((prev) => ({
      ...prev,
      [wrongKey]: nextText,
      supplemental_wrong_answer: wrongLetter,
      supplemental_answer_changed_emergency: true,
    }));
    setIsEmergencyDialogOpen(false);
  };

  const PAGE_SIZE = 20;
  const [searchText, setSearchText] = useState('');
  const [filterCategory, setFilterCategory] = useState('__all__');
  const [filterDifficulty, setFilterDifficulty] = useState('__all__');
  const [filterStatus, setFilterStatus] = useState('__all__');
  const [filterLicense, setFilterLicense] = useState('__all__');
  const [currentPage, setCurrentPage] = useState(1);

  const filteredQuestions = useMemo(() => {
    const needle = searchText.trim();
    const needleLower = needle.toLowerCase();
    return questions.filter((question) => {
      if (needle && !question.question_text.toLowerCase().includes(needleLower)) return false;
      if (filterCategory !== '__all__' && question.category !== filterCategory) return false;
      if (filterDifficulty !== '__all__' && question.difficulty !== filterDifficulty) return false;
      if (filterStatus === 'active' && !question.is_active) return false;
      if (filterStatus === 'inactive' && question.is_active) return false;
      if (
        filterLicense !== '__all__' &&
        !(question.licenses || []).some((l) => l.code === filterLicense)
      )
        return false;
      return true;
    });
  }, [questions, searchText, filterCategory, filterDifficulty, filterStatus, filterLicense]);

  const totalFiltered = filteredQuestions.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / PAGE_SIZE));
  const pageForSlice = Math.min(currentPage, totalPages);

  const paginatedQuestions = useMemo(() => {
    const start = (pageForSlice - 1) * PAGE_SIZE;
    return filteredQuestions.slice(start, start + PAGE_SIZE);
  }, [filteredQuestions, pageForSlice]);

  const hasActiveFilters =
    searchText.trim() !== '' ||
    filterCategory !== '__all__' ||
    filterDifficulty !== '__all__' ||
    filterStatus !== '__all__' ||
    filterLicense !== '__all__';

  const clearFilters = () => {
    setSearchText('');
    setFilterCategory('__all__');
    setFilterDifficulty('__all__');
    setFilterStatus('__all__');
    setFilterLicense('__all__');
    setCurrentPage(1);
  };

  const fetchQuestions = async () => {
    try {
      const { data, error } = await apiRequest<Question[]>('/questions');
      if (error) throw new Error(error.message);
      setQuestions(Array.isArray(data) ? data : []);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast({
        title: 'خطأ',
        description: msg.trim() ? msg : 'فشل في تحميل الأسئلة',
        variant: 'destructive',
      });
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

  const setOptionText = (letter: OptionLetter, value: string) => {
    const key = `option_${letter.toLowerCase()}` as keyof FormData;
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    for (const letter of OPTION_LETTERS) {
      const text = formData[`option_${letter.toLowerCase()}` as keyof FormData] as string;
      if (!text.trim()) {
        toast({
          title: 'خطأ',
          description: `الخيار ${letter} مطلوب`,
          variant: 'destructive',
        });
        return;
      }
    }

    if (!formData.supplemental_wrong_answer) {
      toast({
        title: 'خطأ',
        description: 'حدد الخيار الخاطئ للامتحان الاستكمالي',
        variant: 'destructive',
      });
      return;
    }

    if (formData.supplemental_wrong_answer === formData.correct_answer) {
      toast({
        title: 'خطأ',
        description: 'الخيار الخاطئ الاستكمالي يجب أن يختلف عن الإجابة الصحيحة',
        variant: 'destructive',
      });
      return;
    }

    try {
      const payload = {
        question_text: formData.question_text,
        option_a: formData.option_a,
        option_b: formData.option_b,
        option_c: formData.option_c,
        option_d: formData.option_d,
        correct_answer: formData.correct_answer,
        supplemental_wrong_answer: formData.supplemental_wrong_answer,
        supplemental_answer_changed_emergency: formData.supplemental_answer_changed_emergency,
        difficulty: formData.difficulty,
        category: formData.category || null,
        license_ids: formData.license_ids,
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
      correct_answer: question.correct_answer,
      supplemental_wrong_answer: question.supplemental_wrong_answer || '',
      supplemental_answer_changed_emergency: question.supplemental_answer_changed_emergency ?? false,
      difficulty: question.difficulty,
      category: question.category || '',
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

  useEffect(() => {
    setCurrentPage(1);
  }, [searchText, filterCategory, filterDifficulty, filterStatus, filterLicense]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

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

  const rangeStart = totalFiltered === 0 ? 0 : (pageForSlice - 1) * PAGE_SIZE + 1;
  const rangeEnd = totalFiltered === 0 ? 0 : Math.min(pageForSlice * PAGE_SIZE, totalFiltered);

  return (
    <TooltipProvider delayDuration={300}>
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
                        isCorrect={formData.correct_answer === letter}
                        onTextChange={(val) => setOptionText(letter, val)}
                        onSelectCorrect={() =>
                          setFormData((prev) => ({ ...prev, correct_answer: letter }))
                        }
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <Label>الخيار الخاطئ للامتحان الاستكمالي</Label>
                  <Select
                    value={formData.supplemental_wrong_answer || '__none__'}
                    onValueChange={(v) =>
                      setFormData({
                        ...formData,
                        supplemental_wrong_answer: v === '__none__' ? '' : (v as OptionLetter),
                      })
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="اختر خيارًا خاطئًا ثابتًا للاستكمالي..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">— اختر —</SelectItem>
                      {OPTION_LETTERS.map((letter) => (
                        <SelectItem key={letter} value={letter} disabled={letter === formData.correct_answer}>
                          {`الخيار ${letter}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formData.supplemental_wrong_answer === formData.correct_answer && (
                    <p className="mt-1 text-xs text-destructive">
                      لا يمكن أن يكون خيار الاستكمالي الخاطئ هو نفس الإجابة الصحيحة.
                    </p>
                  )}
                </div>

                <div className="flex items-start gap-3 rounded-lg border-2 border-amber-300 bg-amber-50 p-3">
                  <Checkbox
                    id="supplemental_emergency"
                    checked={formData.supplemental_answer_changed_emergency || isEmergencyDialogOpen}
                    onCheckedChange={(checked) => {
                      if (checked === true) {
                        openEmergencyDialog();
                        return;
                      }
                      setFormData((prev) => ({
                        ...prev,
                        supplemental_answer_changed_emergency: false,
                      }));
                    }}
                    className="mt-0.5"
                  />
                  <div className="flex flex-col gap-0.5">
                    <label
                      htmlFor="supplemental_emergency"
                      className="text-sm font-semibold text-amber-800 cursor-pointer"
                    >
                      تم تغيير جواب الاستكمالي — طوارئ
                    </label>
                    <p className="text-xs text-amber-700">
                      فعّل هذا الخيار إذا تغيّر الجواب في السؤال الاستكمالي. يؤثر على الامتحان الاستكمالي فقط دون تغيير الامتحان العادي.
                    </p>
                  </div>
                </div>
                <Dialog
                  open={isEmergencyDialogOpen}
                  onOpenChange={(open) => {
                    setIsEmergencyDialogOpen(open);
                  }}
                >
                  <DialogContent className="max-w-md" dir="rtl">
                    <DialogHeader>
                      <DialogTitle>ادخل الجواب الجديد</DialogTitle>
                      <DialogDescription>
                        اختر الجواب الجديد الذي سيظهر كخيار خاطئ في الامتحان الاستكمالي.
                      </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-3">
                      <Label>الجواب الجديد للاستكمالي</Label>
                      <Input
                        value={emergencyAnswerDraft}
                        onChange={(e) => setEmergencyAnswerDraft(e.target.value)}
                        placeholder="ادخل نص الجواب الجديد..."
                      />
                      <p className="text-xs text-muted-foreground">
                        سيتم حفظ هذا النص كخيار خاطئ للاستكمالي في السؤال الحالي.
                      </p>
                    </div>

                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setIsEmergencyDialogOpen(false);
                          setFormData((prev) => ({
                            ...prev,
                            supplemental_answer_changed_emergency: false,
                          }));
                        }}
                      >
                        إلغاء
                      </Button>
                      <Button type="button" onClick={applyEmergencyAnswer}>
                        حفظ الجواب الجديد
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                {/* ── معاينة مباشرة ── */}
                <div>
                  <Label className="block mb-2 text-primary font-semibold">معاينة السؤال</Label>
                  <PreviewCard formData={formData} allSigns={trafficSigns} />
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

      <CardContent className="space-y-4">
        {questions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">لا توجد أسئلة بعد</div>
        ) : (
          <>
            <div className="flex flex-col gap-3 rounded-lg border bg-muted/20 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-sm font-medium text-foreground">تصفية الأسئلة</span>
                {hasActiveFilters && (
                  <Button type="button" variant="ghost" size="sm" className="mr-auto" onClick={clearFilters}>
                    <X className="ml-1 h-4 w-4" />
                    مسح الفلاتر
                  </Button>
                )}
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                <div className="relative">
                  <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    dir="rtl"
                    className="pr-9"
                    placeholder="بحث في نص السؤال..."
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    aria-label="بحث في الأسئلة"
                  />
                </div>
                <div>
                  <Label className="sr-only">التصنيف</Label>
                  <Select value={filterCategory} onValueChange={setFilterCategory}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="التصنيف" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">كل التصنيفات</SelectItem>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="sr-only">الصعوبة</Label>
                  <Select value={filterDifficulty} onValueChange={setFilterDifficulty}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="الصعوبة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">كل المستويات</SelectItem>
                      <SelectItem value="easy">سهل</SelectItem>
                      <SelectItem value="medium">متوسط</SelectItem>
                      <SelectItem value="hard">صعب</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="sr-only">الحالة</Label>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="الحالة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">كل الحالات</SelectItem>
                      <SelectItem value="active">نشط</SelectItem>
                      <SelectItem value="inactive">غير نشط</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="sr-only">الرخصة</Label>
                  <Select value={filterLicense} onValueChange={setFilterLicense}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="الرخصة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">كل الرخص</SelectItem>
                      {licenses.map((l) => (
                        <SelectItem key={l.id} value={l.code}>
                          {l.name_ar} ({l.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                {totalFiltered === 0
                  ? 'لا توجد نتائج مطابقة للفلاتر'
                  : `عرض ${rangeStart}–${rangeEnd} من ${totalFiltered} سؤال${
                      totalFiltered !== questions.length ? ` (من ${questions.length} إجمالاً)` : ''
                    }`}
              </p>
            </div>

            {totalFiltered > 0 && (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">السؤال</TableHead>
                        <TableHead className="text-right">التصنيف</TableHead>
                        <TableHead className="text-right">الصعوبة</TableHead>
                        <TableHead className="text-right">الإجابة</TableHead>
                        <TableHead className="text-right">خاطئ استكمالي</TableHead>
                        <TableHead className="text-right">طوارئ</TableHead>
                        <TableHead className="text-right">الرخص</TableHead>
                        <TableHead className="text-right">الحالة</TableHead>
                        <TableHead className="text-right">الإجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedQuestions.map((question) => (
                        <TableRow key={question.id}>
                          <TableCell className="max-w-xs">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="cursor-default truncate">{question.question_text}</div>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="max-w-md text-right" dir="rtl">
                                <p className="whitespace-pre-wrap">{question.question_text}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TableCell>
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
                          <TableCell className="font-bold">
                            {question.supplemental_wrong_answer || '—'}
                          </TableCell>
                          <TableCell>
                            {question.supplemental_answer_changed_emergency ? (
                              <Badge variant="destructive" className="text-xs">طوارئ</Badge>
                            ) : (
                              <span className="text-muted-foreground text-xs">—</span>
                            )}
                          </TableCell>
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

                {totalPages > 1 && (
                  <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
                    <p className="text-sm text-muted-foreground">
                      الصفحة {pageForSlice} من {totalPages}
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={pageForSlice <= 1}
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      >
                        <ChevronRight className="ml-1 h-4 w-4" />
                        السابق
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={pageForSlice >= totalPages}
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      >
                        التالي
                        <ChevronLeft className="mr-1 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </CardContent>
    </Card>
    </TooltipProvider>
  );
};
