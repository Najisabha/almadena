import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { ChevronRight, ChevronLeft, Clock, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { api as apiClient } from '@/integrations/api/client';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

interface QuestionLicense {
  id: string;
  code: string;
  name_ar: string;
}

interface TrafficSign {
  sign_code: string;
  title: string;
  image_url: string;
  is_active?: boolean;
}

interface Question {
  id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string | null;
  option_a_image_url?: string | null;
  option_b_image_url?: string | null;
  option_c_image_url?: string | null;
  option_d_image_url?: string | null;
  correct_answer: string;
  image_url: string | null;
  created_at?: string;
  licenses?: QuestionLicense[];
}

type LoadState = 'loading' | 'out-of-range' | 'empty' | 'ready';
type TextPart = { type: 'text'; value: string };
type SignPart = { type: 'sign'; code: string; sign: TrafficSign | null };
type QuestionPart = TextPart | SignPart;

function resolveUrl(url?: string | null): string {
  if (!url) return '';
  const clean = String(url).trim();
  if (/^https?:\/\//i.test(clean)) return clean;
  if (clean.startsWith('//')) return `https:${clean}`;
  return `${API_BASE}${clean.startsWith('/') ? '' : '/'}${clean}`;
}

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

const MockExam = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Support both license-based (new) and category-based (old) params
  const licenseParam = searchParams.get('license') || '';
  const categoryParam = searchParams.get('category') || '';
  const examNumber = Math.max(1, Number(searchParams.get('exam') || '1'));
  const perPage = Math.max(1, Number(searchParams.get('perPage') || '30'));

  const [questions, setQuestions] = useState<Question[]>([]);
  const [trafficSigns, setTrafficSigns] = useState<TrafficSign[]>([]);
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [checkedQuestions, setCheckedQuestions] = useState<Record<number, boolean>>({});
  const [autoNext, setAutoNext] = useState(false);
  const [timeLeft, setTimeLeft] = useState(40 * 60);

  useEffect(() => {
    const fetchQuestions = async () => {
      setLoadState('loading');
      setCurrentIndex(0);
      setAnswers({});
      setCheckedQuestions({});

      try {
        const res = await fetch(`${API_BASE}/api/questions`);
        if (!res.ok) throw new Error('failed');
        const payload = await res.json();
        let all: Question[] = payload?.data || [];

        if (licenseParam) {
          // Filter by license code
          all = all.filter((q) =>
            (q.licenses || []).some(
              (l) => l.code.toUpperCase() === licenseParam.toUpperCase()
            )
          );
          // Sort newest first
          all.sort((a, b) => {
            const da = a.created_at ? new Date(a.created_at).getTime() : 0;
            const db = b.created_at ? new Date(b.created_at).getTime() : 0;
            return db - da;
          });
        } else if (categoryParam) {
          // Legacy: filter by category
          all = all.filter(
            (q: any) => q.category === categoryParam && q.is_active
          );
          all.sort((a: any, b: any) =>
            (a.display_order ?? 0) - (b.display_order ?? 0)
          );
        } else {
          // Fallback: all active
          all = all.filter((q: any) => q.is_active);
        }

        if (all.length === 0) {
          setLoadState('empty');
          return;
        }

        // Slice the requested exam chunk
        const start = (examNumber - 1) * perPage;
        if (start >= all.length) {
          setLoadState('out-of-range');
          return;
        }
        const slice = all.slice(start, start + perPage);
        setQuestions(slice);
        setLoadState('ready');
      } catch {
        setLoadState('empty');
      }
    };

    fetchQuestions();
  }, [licenseParam, categoryParam, examNumber, perPage]);

  useEffect(() => {
    const fetchSigns = async () => {
      try {
        const { data } = await apiClient.from('traffic_signs').select().order('sign_number', { ascending: true });
        const signs = ((data as TrafficSign[] | null) || []).filter((s) => s.is_active !== false);
        setTrafficSigns(signs);
      } catch {
        setTrafficSigns([]);
      }
    };
    fetchSigns();
  }, []);

  // Timer — reset when questions load
  useEffect(() => {
    setTimeLeft(40 * 60);
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0) { clearInterval(timer); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [questions]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const currentQuestion = questions[currentIndex];
  const answeredCount = Object.keys(answers).length;
  const progress = questions.length > 0 ? (answeredCount / questions.length) * 100 : 0;

  const selectAnswer = useCallback(
    (key: string) => {
      setAnswers((prev) => ({ ...prev, [currentIndex]: key }));
      if (autoNext && currentIndex < questions.length - 1) {
        setTimeout(() => setCurrentIndex((prev) => prev + 1), 300);
      }
    },
    [autoNext, currentIndex, questions.length]
  );

  const checkAnswer = () => {
    setCheckedQuestions((prev) => ({ ...prev, [currentIndex]: true }));
  };

  const isChecked = checkedQuestions[currentIndex];
  const selectedAnswer = answers[currentIndex];
  const isCorrect = selectedAnswer === currentQuestion?.correct_answer?.toLowerCase();

  const getOptionStyle = (key: string) => {
    if (!isChecked) {
      return selectedAnswer === key
        ? 'bg-primary/10 border-primary ring-2 ring-primary/30'
        : 'bg-card hover:bg-muted/50 border-border';
    }
    const correctKey = currentQuestion.correct_answer?.toLowerCase();
    if (key === correctKey) return 'bg-green-50 border-green-500 text-green-800';
    if (selectedAnswer === key) return 'bg-red-50 border-red-500 text-red-800';
    return 'bg-card border-border opacity-60';
  };

  const getSquareStyle = (i: number) => {
    if (i === currentIndex) return 'bg-primary text-primary-foreground ring-2 ring-primary/50';
    if (checkedQuestions[i]) {
      const correctKey = questions[i]?.correct_answer?.toLowerCase();
      return answers[i] === correctKey
        ? 'bg-green-500 text-white'
        : 'bg-red-500 text-white';
    }
    if (answers[i]) return 'bg-muted-foreground/70 text-white';
    return 'bg-muted-foreground/30 text-foreground';
  };

  const optionLabels = ['أ', 'ب', 'ج', 'د'];
  const optionKeys = ['a', 'b', 'c', 'd'];

  const backUrl = licenseParam === 'B' ? '/questions/private' : '/questions';

  // ─── loading state ───
  if (loadState === 'loading') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" dir="rtl">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground">جاري تحميل الأسئلة...</p>
        </div>
      </div>
    );
  }

  // ─── empty state ───
  if (loadState === 'empty') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" dir="rtl">
        <div className="text-center space-y-4 max-w-sm">
          <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto" />
          <p className="text-lg font-semibold text-foreground">لا توجد أسئلة</p>
          <p className="text-muted-foreground text-sm">لم يتم العثور على أسئلة لهذه الرخصة.</p>
          <Button onClick={() => navigate(backUrl)}>العودة لقائمة الامتحانات</Button>
        </div>
      </div>
    );
  }

  // ─── out-of-range state ───
  if (loadState === 'out-of-range') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" dir="rtl">
        <div className="text-center space-y-4 max-w-sm">
          <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto" />
          <p className="text-lg font-semibold text-foreground">الامتحان غير موجود</p>
          <p className="text-muted-foreground text-sm">
            رقم الامتحان ({examNumber}) خارج النطاق المتاح.
          </p>
          <Button onClick={() => navigate(backUrl)}>العودة لقائمة الامتحانات</Button>
        </div>
      </div>
    );
  }

  // ─── ready ───
  if (!currentQuestion) return null;

  const optionValues = [
    { text: currentQuestion.option_a, img: currentQuestion.option_a_image_url },
    { text: currentQuestion.option_b, img: currentQuestion.option_b_image_url },
    { text: currentQuestion.option_c, img: currentQuestion.option_c_image_url },
    { text: currentQuestion.option_d, img: currentQuestion.option_d_image_url },
  ].filter((o) => o.text || o.img);

  const correctKey = currentQuestion.correct_answer?.toLowerCase();
  const signMap = new Map(trafficSigns.map((s) => [normalizeSignCode(s.sign_code), s]));
  const questionParts = parseQuestionText(currentQuestion.question_text, signMap);

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Top question numbers bar */}
      <div className="bg-muted border-b border-border overflow-x-auto">
        <div className="flex gap-1 p-2 justify-center flex-wrap max-w-5xl mx-auto">
          {questions.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              className={cn(
                'w-9 h-9 rounded-md text-sm font-bold flex items-center justify-center transition-all cursor-pointer hover:scale-110',
                getSquareStyle(i)
              )}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <div className="lg:w-64 space-y-4 order-2 lg:order-1">
          {/* Progress */}
          <div className="bg-card rounded-xl border border-border p-4 space-y-3">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>التقدم الحالي:</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Timer */}
          <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-3">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <span className="font-bold text-lg font-mono">{formatTime(timeLeft)}</span>
          </div>

          {/* Auto-next toggle */}
          <div className="bg-card rounded-xl border border-border p-4 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">الانتقال التلقائي</span>
            <Switch checked={autoNext} onCheckedChange={setAutoNext} />
          </div>

          {/* Question grid */}
          <div className="bg-card rounded-xl border border-border p-4">
            <div className="grid grid-cols-5 gap-2">
              {questions.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentIndex(i)}
                  className={cn(
                    'w-full aspect-square rounded-md text-xs font-bold flex items-center justify-center transition-all cursor-pointer',
                    getSquareStyle(i)
                  )}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </div>

          {/* Back button */}
          <Button variant="outline" className="w-full" onClick={() => navigate(backUrl)}>
            العودة لقائمة الامتحانات
          </Button>
        </div>

        {/* Main question area */}
        <div className="flex-1 order-1 lg:order-2">
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            {/* Question header */}
            <div className="bg-muted/50 p-6 text-center space-y-4">
              {currentQuestion.image_url ? (
                <img
                  src={resolveUrl(currentQuestion.image_url)}
                  alt="صورة السؤال"
                  className="mx-auto max-h-48 object-contain rounded-lg"
                />
              ) : null}
              <h2 className="text-4xl font-bold text-foreground leading-relaxed flex flex-wrap items-center justify-center gap-2">
                {questionParts.map((part, i) => {
                  if (part.type === 'text') {
                    return <span key={i}>{part.value}</span>;
                  }
                  if (!part.sign) {
                    return <span key={i}>[{part.code}]</span>;
                  }
                  return (
                    <span
                      key={i}
                      className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-md px-2 py-1"
                      title={part.sign.title}
                    >
                      <img
                        src={resolveUrl(part.sign.image_url)}
                        alt={part.sign.title}
                        className="h-24 w-24 object-contain rounded bg-white"
                      />
                    </span>
                  );
                })}
              </h2>
            </div>

            {/* Options */}
            <div className="p-4 space-y-3">
              {optionValues.map((option, idx) => (
                <button
                  key={idx}
                  onClick={() => !isChecked && selectAnswer(optionKeys[idx])}
                  disabled={isChecked}
                  className={cn(
                    'w-full flex items-center gap-4 p-4 rounded-lg border-2 transition-all text-right',
                    getOptionStyle(optionKeys[idx]),
                    !isChecked && 'cursor-pointer'
                  )}
                >
                  {option.img ? (
                    <img
                      src={resolveUrl(option.img)}
                      alt={`خيار ${optionLabels[idx]}`}
                      className="h-14 w-auto object-contain rounded"
                    />
                  ) : (
                    <span className="text-base flex-1 flex flex-wrap items-center gap-2">
                      {parseQuestionText(option.text || '', signMap).map((part, partIdx) => {
                        if (part.type === 'text') return <span key={partIdx}>{part.value}</span>;
                        if (!part.sign) return <span key={partIdx}>[{part.code}]</span>;
                        return (
                          <span
                            key={partIdx}
                            className="inline-flex items-center gap-1 bg-amber-50 border border-amber-200 rounded-md px-1.5 py-0.5"
                            title={part.sign.title}
                          >
                            <img
                              src={resolveUrl(part.sign.image_url)}
                              alt={part.sign.title}
                              className="h-20 w-20 object-contain rounded bg-white"
                            />
                          </span>
                        );
                      })}
                    </span>
                  )}
                  <span className="w-8 h-8 rounded-full bg-muted flex items-center justify-center font-bold text-sm flex-shrink-0">
                    {optionLabels[idx]}
                  </span>
                </button>
              ))}
            </div>

            {/* Result indicator */}
            {isChecked && (
              <div
                className={cn(
                  'mx-4 mb-4 p-3 rounded-lg flex items-center gap-2 text-sm font-medium',
                  isCorrect ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                )}
              >
                {isCorrect ? (
                  <><CheckCircle2 className="h-5 w-5" /> إجابة صحيحة!</>
                ) : (
                  <>
                    <XCircle className="h-5 w-5" />
                    إجابة خاطئة - الإجابة الصحيحة هي:{' '}
                    {optionLabels[optionKeys.indexOf(correctKey ?? '')]}
                  </>
                )}
              </div>
            )}

            {/* Navigation buttons */}
            <div className="flex items-center justify-between p-4 border-t border-border">
              <Button
                variant="secondary"
                onClick={() => setCurrentIndex((prev) => Math.min(prev + 1, questions.length - 1))}
                disabled={currentIndex >= questions.length - 1}
              >
                <span>التالي</span>
                <ChevronLeft className="mr-1 h-4 w-4" />
              </Button>

              <Button
                onClick={checkAnswer}
                disabled={!selectedAnswer || isChecked}
                className="px-8"
              >
                تحقق من الإجابة
              </Button>

              <Button
                variant="secondary"
                onClick={() => setCurrentIndex((prev) => Math.max(prev - 1, 0))}
                disabled={currentIndex <= 0}
              >
                <ChevronRight className="ml-1 h-4 w-4" />
                <span>السابق</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MockExam;
