import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const EXAM_COUNT = 25;

const PrivateTheoryExamList = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Header */}
      <section className="bg-gradient-primary text-white py-12">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-3">
            أسئلة<br />تؤوريا خصوصي
          </h1>
        </div>
      </section>

      {/* Exam tiles grid */}
      <section className="py-10">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
            {Array.from({ length: EXAM_COUNT }, (_, i) => {
              const examNumber = i + 1;
              return (
                <button
                  key={examNumber}
                  onClick={() =>
                    navigate(`/mock-exam?license=B&exam=${examNumber}&difficulty=medium`)
                  }
                  className={cn(
                    'flex items-center justify-between gap-2 px-4 py-3 rounded-lg border-2 text-sm font-bold transition-all duration-200 text-right',
                    'bg-primary text-primary-foreground border-primary hover:brightness-110 hover:scale-[1.02] shadow-sm'
                  )}
                >
                  <span>تؤوريا خصوصي</span>
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-white/20 text-white text-xs font-bold flex-shrink-0">
                    {examNumber}
                  </span>
                </button>
              );
            })}
          </div>

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
