import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { ChevronRight, ChevronLeft, Clock, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { api as apiClient } from '@/integrations/api/client';
import { cn } from '@/lib/utils';

interface Question {
  id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string | null;
  correct_answer: string;
  image_url: string | null;
}

const DEMO_QUESTIONS: Question[] = Array.from({ length: 30 }, (_, i) => ({
  id: `demo-${i + 1}`,
  question_text: `${i + 1} - تعني الشاخصة التالية:`,
  option_a: 'خط وقوف على سطح الطريق.',
  option_b: 'ملتقى تفرع طرق إلى اليسار.',
  option_c: 'مفترق تفرع طرق إلى اليمين.',
  option_d: 'ممنوع الاستدارة إلى اليمين.',
  correct_answer: 'c',
  image_url: null,
}));

const MockExam = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const category = searchParams.get('category') || 'private';

  const [questions, setQuestions] = useState<Question[]>(DEMO_QUESTIONS);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [checkedQuestions, setCheckedQuestions] = useState<Record<number, boolean>>({});
  const [autoNext, setAutoNext] = useState(false);
  const [timeLeft, setTimeLeft] = useState(40 * 60); // 40 minutes

  // Load from DB if available
  useEffect(() => {
    const fetchQuestions = async () => {
      const { data } = await apiClient
        .from('questions')
        .select('*')
        .eq('is_active', true)
        .eq('category', category)
        .order('display_order')
        .limit(30);
      if (data && data.length > 0) {
        setQuestions(data);
      }
    };
    fetchQuestions();
  }, [category]);

  // Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 0) { clearInterval(timer); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const currentQuestion = questions[currentIndex];
  const answeredCount = Object.keys(answers).length;
  const progress = (answeredCount / questions.length) * 100;

  const selectAnswer = useCallback((key: string) => {
    setAnswers(prev => ({ ...prev, [currentIndex]: key }));
    if (autoNext && currentIndex < questions.length - 1) {
      setTimeout(() => setCurrentIndex(prev => prev + 1), 300);
    }
  }, [autoNext, currentIndex, questions.length]);

  const checkAnswer = () => {
    setCheckedQuestions(prev => ({ ...prev, [currentIndex]: true }));
  };

  const isChecked = checkedQuestions[currentIndex];
  const selectedAnswer = answers[currentIndex];
  const isCorrect = selectedAnswer === currentQuestion?.correct_answer;

  const getOptionStyle = (key: string) => {
    if (!isChecked) {
      return selectedAnswer === key
        ? 'bg-primary/10 border-primary ring-2 ring-primary/30'
        : 'bg-card hover:bg-muted/50 border-border';
    }
    if (key === currentQuestion.correct_answer) return 'bg-green-50 border-green-500 text-green-800';
    if (selectedAnswer === key) return 'bg-red-50 border-red-500 text-red-800';
    return 'bg-card border-border opacity-60';
  };

  const getSquareStyle = (i: number) => {
    if (i === currentIndex) return 'bg-primary text-primary-foreground ring-2 ring-primary/50';
    if (checkedQuestions[i]) {
      return answers[i] === questions[i]?.correct_answer
        ? 'bg-green-500 text-white'
        : 'bg-red-500 text-white';
    }
    if (answers[i]) return 'bg-muted-foreground/70 text-white';
    return 'bg-muted-foreground/30 text-foreground';
  };

  const optionLabels = ['أ', 'ب', 'ج', 'د'];
  const optionKeys = ['a', 'b', 'c', 'd'];

  if (!currentQuestion) return null;

  const optionValues = [
    currentQuestion.option_a,
    currentQuestion.option_b,
    currentQuestion.option_c,
    currentQuestion.option_d,
  ].filter(Boolean) as string[];

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
          <Button variant="outline" className="w-full" onClick={() => navigate('/questions')}>
            العودة لاختيار الفئة
          </Button>
        </div>

        {/* Main question area */}
        <div className="flex-1 order-1 lg:order-2">
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            {/* Question header with image */}
            <div className="bg-muted/50 p-6 text-center space-y-4">
              {currentQuestion.image_url && (
                <img
                  src={currentQuestion.image_url}
                  alt="صورة السؤال"
                  className="mx-auto max-h-48 object-contain rounded-lg"
                />
              )}
              {!currentQuestion.image_url && (
                <div className="mx-auto w-32 h-32 bg-muted rounded-xl flex items-center justify-center">
                  <AlertTriangle className="h-16 w-16 text-destructive" />
                </div>
              )}
              <h2 className="text-xl font-bold text-foreground">
                {currentQuestion.question_text}
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
                  <span className="text-base flex-1">{option}</span>
                  <span className="w-8 h-8 rounded-full bg-muted flex items-center justify-center font-bold text-sm flex-shrink-0">
                    {optionLabels[idx]}
                  </span>
                </button>
              ))}
            </div>

            {/* Result indicator */}
            {isChecked && (
              <div className={cn(
                'mx-4 mb-4 p-3 rounded-lg flex items-center gap-2 text-sm font-medium',
                isCorrect ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
              )}>
                {isCorrect ? (
                  <><CheckCircle2 className="h-5 w-5" /> إجابة صحيحة!</>
                ) : (
                  <><XCircle className="h-5 w-5" /> إجابة خاطئة - الإجابة الصحيحة هي: {optionLabels[optionKeys.indexOf(currentQuestion.correct_answer)]}</>
                )}
              </div>
            )}

            {/* Navigation buttons */}
            <div className="flex items-center justify-between p-4 border-t border-border">
              <Button
                variant="secondary"
                onClick={() => setCurrentIndex(prev => Math.min(prev + 1, questions.length - 1))}
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
                onClick={() => setCurrentIndex(prev => Math.max(prev - 1, 0))}
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
