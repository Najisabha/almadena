import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Car, Truck, Bus, Bike, Tractor, ArrowRight, Zap, BarChart3, Flame, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

const licenseTypes = [
  { id: 'private', title: 'خصوصي', icon: Car, exams: 25 },
  { id: 'truck', title: 'شحن خفيف', icon: Truck, exams: 25 },
  { id: 'taxi', title: 'عمومي', icon: Bus, exams: 25 },
  { id: 'motorcycle', title: 'دراجة نارية', icon: Bike, exams: 25 },
  { id: 'tractor', title: 'تراكتور', icon: Tractor, exams: 25 },
];

const difficultyLevels = [
  { id: 'easy', label: 'سهل', icon: Zap, description: 'أسئلة أساسية للمبتدئين', color: 'bg-green-500' },
  { id: 'medium', label: 'متوسط', icon: BarChart3, description: 'مزيج من الأسئلة المتنوعة', color: 'bg-yellow-500' },
  { id: 'hard', label: 'صعب', icon: Flame, description: 'أسئلة متقدمة للتحدي', color: 'bg-red-500' },
  { id: 'traditional', label: 'امتحان تقليدي', icon: BookOpen, description: 'محاكاة كاملة للامتحان الرسمي', color: 'bg-primary' },
];

const MockExamSelector = () => {
  const navigate = useNavigate();
  const [selectedLicense, setSelectedLicense] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);

  const handleStart = () => {
    if (selectedLicense && selectedDifficulty) {
      navigate(`/mock-exam?category=${selectedLicense}&difficulty=${selectedDifficulty}&exam=1`);
    }
  };

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Header */}
      <section className="bg-gradient-hero text-white py-14">
        <div className="container mx-auto px-4 text-center">
          <Badge className="mb-4 bg-white/20 text-white border-white/30">الامتحانات التجريبية</Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-3">اختبر نفسك الآن</h1>
          <p className="text-lg text-white/80 max-w-2xl mx-auto">
            اختر نوع الرخصة ومستوى الصعوبة وابدأ الامتحان التجريبي
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12 max-w-5xl space-y-12">
        {/* Step 1: License Selection */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <span className="w-9 h-9 rounded-full bg-primary text-primary-foreground font-bold flex items-center justify-center text-lg">1</span>
            <h2 className="text-2xl font-bold text-foreground">اختر نوع الرخصة</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {licenseTypes.map((license) => {
              const Icon = license.icon;
              const isSelected = selectedLicense === license.id;
              return (
                <button
                  key={license.id}
                  onClick={() => setSelectedLicense(license.id)}
                  className={cn(
                    'flex flex-col items-center gap-3 p-5 rounded-xl border-2 transition-all duration-200',
                    isSelected
                      ? 'border-primary bg-primary/10 shadow-lg scale-[1.03]'
                      : 'border-border bg-card hover:border-primary/40 hover:shadow-md'
                  )}
                >
                  <div className={cn(
                    'p-3 rounded-xl transition-colors',
                    isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  )}>
                    <Icon className="h-7 w-7" />
                  </div>
                  <span className={cn('font-bold text-sm', isSelected ? 'text-primary' : 'text-foreground')}>
                    {license.title}
                  </span>
                  <Badge variant="secondary" className="text-xs">{license.exams} امتحان</Badge>
                </button>
              );
            })}
          </div>
        </section>

        {/* Step 2: Difficulty Selection */}
        <section className={cn('transition-opacity duration-300', selectedLicense ? 'opacity-100' : 'opacity-40 pointer-events-none')}>
          <div className="flex items-center gap-3 mb-6">
            <span className="w-9 h-9 rounded-full bg-primary text-primary-foreground font-bold flex items-center justify-center text-lg">2</span>
            <h2 className="text-2xl font-bold text-foreground">اختر مستوى الصعوبة</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {difficultyLevels.map((level) => {
              const Icon = level.icon;
              const isSelected = selectedDifficulty === level.id;
              return (
                <button
                  key={level.id}
                  onClick={() => setSelectedDifficulty(level.id)}
                  className={cn(
                    'flex flex-col items-center gap-3 p-6 rounded-xl border-2 transition-all duration-200 text-center',
                    isSelected
                      ? 'border-primary bg-primary/10 shadow-lg scale-[1.03]'
                      : 'border-border bg-card hover:border-primary/40 hover:shadow-md'
                  )}
                >
                  <div className={cn('w-12 h-12 rounded-full flex items-center justify-center text-white', level.color)}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <span className="font-bold text-lg text-foreground">{level.label}</span>
                  <p className="text-sm text-muted-foreground">{level.description}</p>
                </button>
              );
            })}
          </div>
        </section>

        {/* Start Button */}
        <div className={cn(
          'flex justify-center transition-opacity duration-300',
          selectedLicense && selectedDifficulty ? 'opacity-100' : 'opacity-40 pointer-events-none'
        )}>
          <Button
            size="lg"
            className="text-lg px-12 py-6 shadow-button hover:shadow-elevated transition-all duration-300"
            onClick={handleStart}
          >
            <ArrowRight className="ml-2 h-5 w-5" />
            ابدأ الامتحان
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MockExamSelector;
