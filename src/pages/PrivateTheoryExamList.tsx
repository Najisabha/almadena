import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';
const PER_EXAM = 30;
const LICENSE_CODE = 'B';

interface QuestionLicense {
  id: string;
  code: string;
  name_ar: string;
}

interface RawQuestion {
  id: string;
  licenses?: QuestionLicense[];
}

const PrivateTheoryExamList = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [examCount, setExamCount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [resolvedLicenseName, setResolvedLicenseName] = useState('');

  const selectedLicenseCode = (searchParams.get('license') || LICENSE_CODE).toUpperCase();
  const selectedLicenseName = searchParams.get('name') || '';
  const examMode = searchParams.get('examMode') === 'supplemental' ? 'supplemental' : 'regular';

  const pageTitle = useMemo(() => {
    const baseName = selectedLicenseName || resolvedLicenseName || selectedLicenseCode;
    if (examMode === 'supplemental') {
      return `امتحانات استكمالي ${baseName}`;
    }
    return `أسئلة تؤوريا ${baseName}`;
  }, [examMode, resolvedLicenseName, selectedLicenseCode, selectedLicenseName]);

  const tileLabel = useMemo(() => {
    const baseName = selectedLicenseName || resolvedLicenseName || selectedLicenseCode;
    return examMode === 'supplemental' ? `استكمالي ${baseName}` : `تؤوريا ${baseName}`;
  }, [examMode, resolvedLicenseName, selectedLicenseCode, selectedLicenseName]);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/questions`);
        if (!res.ok) throw new Error('failed');
        const payload = await res.json();
        const all: RawQuestion[] = payload?.data || [];
        const filtered = all.filter((q) =>
          (q.licenses || []).some(
            (l) => l.code.toUpperCase() === selectedLicenseCode
          )
        );
        if (!selectedLicenseName) {
          const fromQuestions = filtered
            .flatMap((q) => q.licenses || [])
            .find((l) => l.code.toUpperCase() === selectedLicenseCode)?.name_ar;
          setResolvedLicenseName(fromQuestions || '');
        } else {
          setResolvedLicenseName(selectedLicenseName);
        }
        setExamCount(Math.ceil(filtered.length / PER_EXAM));
      } catch {
        setExamCount(0);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCount();
  }, [selectedLicenseCode, selectedLicenseName]);

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Header */}
      <section className="bg-gradient-primary text-white py-12">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-3">
            {pageTitle}
          </h1>
        </div>
      </section>

      {/* Exam tiles grid */}
      <section className="py-10">
        <div className="container mx-auto px-4 max-w-4xl">
          {isLoading && (
            <div className="text-center py-16 text-muted-foreground">
              جاري تحميل الامتحانات...
            </div>
          )}

          {!isLoading && examCount === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              لا توجد أسئلة مرتبطة بهذه الرخصة حالياً.
            </div>
          )}

          {!isLoading && examCount !== null && examCount > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
              {Array.from({ length: examCount }, (_, i) => {
                const examNumber = i + 1;
                return (
                  <button
                    key={examNumber}
                    onClick={() =>
                      navigate(
                        `/mock-exam?license=${selectedLicenseCode}&exam=${examNumber}&perPage=${PER_EXAM}${examMode === 'supplemental' ? '&examMode=supplemental' : ''}`
                      )
                    }
                    className={cn(
                      'flex items-center justify-between gap-2 px-4 py-3 rounded-lg border-2 text-sm font-bold transition-all duration-200 text-right',
                      'bg-primary text-primary-foreground border-primary hover:brightness-110 hover:scale-[1.02] shadow-sm'
                    )}
                  >
                    <span>{tileLabel}</span>
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-white/20 text-white text-xs font-bold flex-shrink-0">
                      {examNumber}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Back button */}
          <div className="mt-8 flex justify-center">
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => navigate('/questions')}
            >
              <ChevronRight className="h-4 w-4" />
              العودة لاختيار الرخصة
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default PrivateTheoryExamList;
