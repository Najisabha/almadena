import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { appendExamHistory } from '@/lib/examHistory';
import { api as apiClient } from '@/integrations/api/client';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  ChevronRight,
  ChevronLeft,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Send,
  Trophy,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

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
  difficulty?: string | null;
  is_active?: boolean;
  display_order?: number | null;
  created_at?: string;
  licenses?: QuestionLicense[];
}

function shuffleArray<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

interface ExamResult {
  score: number;
  total: number;
  percentage: number;
  passed: boolean;
  wrongIndices: number[];
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

const EXAM_DURATION = 60 * 60; // 1 hour in seconds

const MockExam = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const licenseParam = searchParams.get('license') || '';
  const categoryParam = searchParams.get('category') || '';
  const examNumber = Math.max(1, Number(searchParams.get('exam') || '1'));
  const perPage = Math.max(1, Number(searchParams.get('perPage') || '30'));
  const practiceMode = searchParams.get('practice') === '1';
  const difficultyParam = searchParams.get('difficulty') || '';

  const [questions, setQuestions] = useState<Question[]>([]);
  const [trafficSigns, setTrafficSigns] = useState<TrafficSign[]>([]);
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [checkedQuestions, setCheckedQuestions] = useState<Record<number, boolean>>({});
  const [autoNext, setAutoNext] = useState(false);
  const [timeLeft, setTimeLeft] = useState(EXAM_DURATION);
  const [examSubmitted, setExamSubmitted] = useState(false);
  const [examResult, setExamResult] = useState<ExamResult | null>(null);
  const [showResultDialog, setShowResultDialog] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const fetchQuestions = async () => {
      setLoadState('loading');
      setCurrentIndex(0);
      setAnswers({});
      setCheckedQuestions({});
      setExamSubmitted(false);
      setExamResult(null);

      try {
        const res = await fetch(`${API_BASE}/api/questions`);
        if (!res.ok) throw new Error('failed');
        const payload = await res.json();
        let all: Question[] = payload?.data || [];

        if (practiceMode && licenseParam) {
          // Practice exam: filter by license + active, optionally filter by difficulty, then shuffle and cap at 30
          all = all.filter(
            (q) =>
              q.is_active !== false &&
              (q.licenses || []).some(
                (l) => l.code.toUpperCase() === licenseParam.toUpperCase()
              )
          );
          if (difficultyParam && difficultyParam !== 'random') {
            all = all.filter((q) => q.difficulty === difficultyParam);
          }
          all = shuffleArray(all).slice(0, 30);
        } else if (licenseParam) {
          all = all.filter((q) =>
            (q.licenses || []).some(
              (l) => l.code.toUpperCase() === licenseParam.toUpperCase()
            )
          );
          all.sort((a, b) => {
            const da = a.created_at ? new Date(a.created_at).getTime() : 0;
            const db = b.created_at ? new Date(b.created_at).getTime() : 0;
            return db - da;
          });
        } else if (categoryParam) {
          all = all.filter(
            (q: any) => q.category === categoryParam && q.is_active
          );
          all.sort((a: any, b: any) =>
            (a.display_order ?? 0) - (b.display_order ?? 0)
          );
        } else {
          all = all.filter((q: any) => q.is_active);
        }

        if (all.length === 0) {
          setLoadState('empty');
          return;
        }

        if (practiceMode) {
          // No pagination in practice mode — questions are already sliced
          setQuestions(all);
          setLoadState('ready');
          return;
        }

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
  }, [licenseParam, categoryParam, examNumber, perPage, practiceMode, difficultyParam]);

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

  // Timer — reset when questions load, freeze on submit
  useEffect(() => {
    if (loadState !== 'ready') return;
    setTimeLeft(EXAM_DURATION);

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [questions, loadState]);

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) {
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const currentQuestion = questions[currentIndex];
  const answeredCount = Object.keys(answers).length;
  const progress = questions.length > 0 ? (answeredCount / questions.length) * 100 : 0;
  const allAnswered = answeredCount >= questions.length && questions.length > 0;

  // Whether to show feedback (correct/wrong) for question at index i
  const feedbackVisibleFor = (i: number) => Boolean(checkedQuestions[i] || examSubmitted);

  const selectAnswer = useCallback(
    (key: string) => {
      if (examSubmitted || feedbackVisibleFor(currentIndex)) return;
      setAnswers((prev) => ({ ...prev, [currentIndex]: key }));
      if (autoNext && currentIndex < questions.length - 1) {
        setTimeout(() => setCurrentIndex((prev) => prev + 1), 300);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [autoNext, currentIndex, questions.length, examSubmitted, checkedQuestions]
  );

  const checkAnswer = () => {
    setCheckedQuestions((prev) => ({ ...prev, [currentIndex]: true }));
  };

  const submitExam = () => {
    const score = questions.reduce((acc, q, i) => {
      return answers[i]?.toLowerCase() === q.correct_answer?.toLowerCase() ? acc + 1 : acc;
    }, 0);
    const total = questions.length;
    const percentage = total > 0 ? (score / total) * 100 : 0;
    const wrongIndices = questions.reduce<number[]>((acc, q, i) => {
      if (answers[i]?.toLowerCase() !== q.correct_answer?.toLowerCase()) acc.push(i);
      return acc;
    }, []);

    const result: ExamResult = {
      score,
      total,
      percentage,
      passed: percentage >= 80,
      wrongIndices,
    };

    setExamResult(result);
    setExamSubmitted(true);
    setShowResultDialog(true);
    stopTimer();

    // Derive license display name from the first question's licenses array
    const licenseCode = licenseParam || categoryParam || 'عام';
    const licenseNameAr =
      questions[0]?.licenses?.find(
        (l) => l.code.toUpperCase() === licenseParam.toUpperCase()
      )?.name_ar ||
      licenseParam ||
      categoryParam ||
      'امتحان';

    // Persist to localStorage (offline fallback)
    appendExamHistory({
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      date: new Date().toISOString(),
      licenseCode,
      licenseName: licenseNameAr,
      examNumber,
      score: result.score,
      total: result.total,
      percentage: result.percentage,
      passed: result.passed,
    });

    // Persist to server (async — fire and forget, errors are non-fatal)
    apiClient
      .postExamAttempt({
        license_code: licenseCode,
        license_name_ar: licenseNameAr,
        exam_number: examNumber,
        score: result.score,
        total_questions: result.total,
        percentage: Math.round(result.percentage * 100) / 100,
        passed: result.passed,
      })
      .catch(() => {/* silent — offline or unauthenticated users still have localStorage */});

    // Mark all questions as feedback-visible
    setCheckedQuestions((prev) => {
      const next = { ...prev };
      questions.forEach((_, i) => { next[i] = true; });
      return next;
    });
  };

  const isFeedbackActive = feedbackVisibleFor(currentIndex);
  const selectedAnswer = answers[currentIndex];
  const correctKey = currentQuestion?.correct_answer?.toLowerCase();
  const isCorrect = selectedAnswer === correctKey;

  const getOptionStyle = (key: string) => {
    if (!isFeedbackActive) {
      return selectedAnswer === key
        ? 'bg-primary/10 border-primary ring-2 ring-primary/30'
        : 'bg-card hover:bg-muted/50 border-border';
    }
    if (key === correctKey) return 'bg-green-50 border-green-500 text-green-800';
    if (selectedAnswer === key) return 'bg-red-50 border-red-500 text-red-800';
    return 'bg-card border-border opacity-60';
  };

  const getSquareStyle = (i: number) => {
    if (i === currentIndex) return 'bg-primary text-primary-foreground ring-2 ring-primary/50';
    if (feedbackVisibleFor(i)) {
      const cKey = questions[i]?.correct_answer?.toLowerCase();
      return answers[i] === cKey
        ? 'bg-green-500 text-white'
        : 'bg-red-500 text-white';
    }
    if (answers[i]) return 'bg-muted-foreground/70 text-white';
    return 'bg-muted-foreground/30 text-foreground';
  };

  const optionLabels = ['أ', 'ب', 'ج', 'د'];
  const optionKeys = ['a', 'b', 'c', 'd'];

  const backUrl =
    licenseParam.toUpperCase() === 'B' || categoryParam === 'private'
      ? '/questions/private'
      : '/questions';

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

  const signMap = new Map(trafficSigns.map((s) => [normalizeSignCode(s.sign_code), s]));
  const questionParts = parseQuestionText(currentQuestion.question_text, signMap);

  const unansweredCount = questions.length - answeredCount;

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
          <div className={cn(
            'bg-card rounded-xl border border-border p-4 flex items-center gap-3',
            timeLeft <= 300 && !examSubmitted && 'border-red-400 bg-red-50'
          )}>
            <Clock className={cn('h-5 w-5', timeLeft <= 300 && !examSubmitted ? 'text-red-500' : 'text-muted-foreground')} />
            <span className={cn(
              'font-bold text-lg font-mono',
              timeLeft <= 300 && !examSubmitted && 'text-red-600'
            )}>
              {formatTime(timeLeft)}
            </span>
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

          {/* Submit exam button */}
          <Button
            className="w-full"
            onClick={submitExam}
            disabled={!allAnswered || examSubmitted}
            title={
              examSubmitted
                ? 'تم تسليم الامتحان'
                : !allAnswered
                ? `يجب الإجابة على جميع الأسئلة (${unansweredCount} سؤال متبقٍ)`
                : ''
            }
          >
            <Send className="ml-2 h-4 w-4" />
            تسليم الامتحان
            {!allAnswered && !examSubmitted && (
              <span className="mr-2 text-xs opacity-80">({unansweredCount} متبقٍ)</span>
            )}
          </Button>

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
                  onClick={() => !isFeedbackActive && selectAnswer(optionKeys[idx])}
                  disabled={isFeedbackActive}
                  className={cn(
                    'w-full flex items-center gap-4 p-4 rounded-lg border-2 transition-all text-right',
                    getOptionStyle(optionKeys[idx]),
                    !isFeedbackActive && 'cursor-pointer'
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
            {isFeedbackActive && (
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
                disabled={!selectedAnswer || isFeedbackActive || examSubmitted}
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

      {/* Result dialog */}
      <Dialog open={showResultDialog} onOpenChange={setShowResultDialog}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-center text-xl">نتيجة الامتحان</DialogTitle>
          </DialogHeader>

          {examResult && (
            <div className="space-y-6">
              {/* Score summary */}
              <div className={cn(
                'rounded-xl p-6 text-center space-y-3',
                examResult.passed ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
              )}>
                {examResult.passed ? (
                  <Trophy className="h-12 w-12 text-green-500 mx-auto" />
                ) : (
                  <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
                )}
                <p className={cn(
                  'text-2xl font-bold',
                  examResult.passed ? 'text-green-700' : 'text-red-700'
                )}>
                  {examResult.passed ? 'نجحت!' : 'راسب'}
                </p>
                <p className="text-4xl font-bold text-foreground">
                  {Math.round(examResult.percentage)}%
                </p>
                <p className="text-muted-foreground text-sm">
                  {examResult.score} صح من أصل {examResult.total} سؤال
                </p>
                <p className="text-xs text-muted-foreground">
                  علامة النجاح: 80% فأكثر
                </p>
              </div>

              {/* Wrong questions list */}
              {examResult.wrongIndices.length > 0 && (
                <div className="space-y-2">
                  <p className="font-semibold text-sm text-foreground flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-500" />
                    الأسئلة التي أجبت عنها بشكل خاطئ ({examResult.wrongIndices.length})
                  </p>
                  <div className="max-h-48 overflow-y-auto space-y-1 rounded-lg border border-border p-2">
                    {examResult.wrongIndices.map((idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setCurrentIndex(idx);
                          setShowResultDialog(false);
                        }}
                        className="w-full text-right text-sm p-2 rounded-md hover:bg-muted transition-colors flex items-start gap-2 group"
                      >
                        <span className="w-6 h-6 rounded-full bg-red-100 text-red-700 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <span className="text-muted-foreground group-hover:text-foreground line-clamp-2 flex-1">
                          {questions[idx]?.question_text?.replace(/\[[^\]]+\]/g, '[إشارة]') || `سؤال ${idx + 1}`}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {examResult.wrongIndices.length === 0 && (
                <p className="text-center text-sm text-green-600 font-medium">
                  أحسنت! أجبت على جميع الأسئلة بشكل صحيح.
                </p>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => navigate(backUrl)}
                >
                  العودة لقائمة الامتحانات
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => setShowResultDialog(false)}
                >
                  مراجعة الإجابات
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MockExam;
