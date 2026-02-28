import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search, CheckCircle2, XCircle, Calendar, Award, User, IdCard } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const StudentLookup = () => {
  const [idNumber, setIdNumber] = useState('');
  const [searchResult, setSearchResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // بيانات تجريبية للتوضيح
  const mockData: Record<string, any> = {
    '1234567890': {
      name: 'أحمد محمد الشمري',
      idNumber: '1234567890',
      licenseType: 'رخصة خاصة',
      theoryResult: {
        status: 'ناجح',
        score: 88,
        totalQuestions: 30,
        correctAnswers: 27,
        date: '2024-09-10',
        attempts: 1
      },
      practicalResult: {
        status: 'ناجح',
        score: 92,
        date: '2024-09-20',
        attempts: 1,
        examiner: 'المدرب أحمد الخالدي'
      }
    },
    '9876543210': {
      name: 'فاطمة علي الزهراني',
      idNumber: '9876543210',
      licenseType: 'رخصة خاصة',
      theoryResult: {
        status: 'ناجح',
        score: 93,
        totalQuestions: 30,
        correctAnswers: 28,
        date: '2024-09-05',
        attempts: 1
      },
      practicalResult: {
        status: 'قيد الانتظار',
        scheduledDate: '2024-10-15'
      }
    },
    '5555555555': {
      name: 'خالد سعد العتيبي',
      idNumber: '5555555555',
      licenseType: 'رخصة شاحنة',
      theoryResult: {
        status: 'راسب',
        score: 65,
        totalQuestions: 30,
        correctAnswers: 20,
        date: '2024-09-01',
        attempts: 1,
        nextAttemptDate: '2024-10-05'
      },
      practicalResult: null
    }
  };

  const handleSearch = () => {
    if (!idNumber) {
      toast({
        title: 'خطأ',
        description: 'الرجاء إدخال رقم الهوية',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    
    // محاكاة استدعاء API
    setTimeout(() => {
      const result = mockData[idNumber];
      if (result) {
        setSearchResult(result);
        toast({
          title: 'تم العثور على النتائج',
          description: 'تم جلب نتائج الطالب بنجاح'
        });
      } else {
        setSearchResult(null);
        toast({
          title: 'لم يتم العثور على نتائج',
          description: 'الرجاء التأكد من رقم الهوية المدخل',
          variant: 'destructive'
        });
      }
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-muted/20 to-background">
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-primary opacity-5"></div>
        <div className="container mx-auto px-4 relative">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
              استعلام سريع وآمن
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
              الاستعلام عن <span className="text-primary">نتائج الطلاب</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              تحقق من نتائجك في التووريا والفحص العملي باستخدام رقم الهوية الوطنية
            </p>
          </div>
        </div>
      </section>

      {/* Search Form */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <Card className="max-w-2xl mx-auto border-border/50 bg-card/80 backdrop-blur-sm shadow-elevated">
            <CardHeader>
              <CardTitle className="text-center flex items-center justify-center gap-2">
                <Search className="h-6 w-6 text-primary" />
                <span>ابحث عن نتائجك</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="idNumber" className="text-right block">
                    رقم الهوية الوطنية
                  </Label>
                  <Input
                    id="idNumber"
                    type="text"
                    placeholder="أدخل رقم الهوية الوطنية (10 أرقام)"
                    value={idNumber}
                    onChange={(e) => setIdNumber(e.target.value)}
                    maxLength={10}
                    className="text-center text-lg"
                    dir="ltr"
                  />
                  <p className="text-xs text-muted-foreground text-center">
                    للتجربة، استخدم: 1234567890 أو 9876543210 أو 5555555555
                  </p>
                </div>

                <Button 
                  onClick={handleSearch}
                  disabled={isLoading}
                  className="w-full bg-gradient-primary shadow-button"
                  size="lg"
                >
                  {isLoading ? (
                    'جاري البحث...'
                  ) : (
                    <>
                      <Search className="ml-2 h-5 w-5" />
                      بحث عن النتائج
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Results Display */}
      {searchResult && (
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Student Info */}
              <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
                <CardHeader className="bg-gradient-to-r from-primary/10 to-transparent border-b border-border/30">
                  <CardTitle className="flex items-center gap-3">
                    <User className="h-6 w-6 text-primary" />
                    <span>معلومات الطالب</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                      <User className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <div className="text-sm text-muted-foreground">الاسم</div>
                        <div className="font-semibold text-foreground">{searchResult.name}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <IdCard className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <div className="text-sm text-muted-foreground">رقم الهوية</div>
                        <div className="font-semibold text-foreground" dir="ltr">{searchResult.idNumber}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Award className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <div className="text-sm text-muted-foreground">نوع الرخصة</div>
                        <div className="font-semibold text-foreground">{searchResult.licenseType}</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Theory Test Results */}
              {searchResult.theoryResult && (
                <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
                  <CardHeader className="bg-gradient-to-r from-primary/10 to-transparent border-b border-border/30">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-3">
                        <Award className="h-6 w-6 text-primary" />
                        <span>نتيجة الفحص النظري (التووريا)</span>
                      </CardTitle>
                      <Badge 
                        className={`${
                          searchResult.theoryResult.status === 'ناجح' 
                            ? 'bg-green-500' 
                            : searchResult.theoryResult.status === 'راسب'
                            ? 'bg-red-500'
                            : 'bg-yellow-500'
                        } text-white border-0`}
                      >
                        {searchResult.theoryResult.status === 'ناجح' && <CheckCircle2 className="h-4 w-4 ml-1" />}
                        {searchResult.theoryResult.status === 'راسب' && <XCircle className="h-4 w-4 ml-1" />}
                        {searchResult.theoryResult.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="text-center p-4 bg-muted/50 rounded-lg border border-border/30">
                        <div className="text-2xl font-bold text-primary">{searchResult.theoryResult.score}%</div>
                        <div className="text-sm text-muted-foreground">النتيجة</div>
                      </div>
                      {searchResult.theoryResult.correctAnswers && (
                        <>
                          <div className="text-center p-4 bg-muted/50 rounded-lg border border-border/30">
                            <div className="text-2xl font-bold text-foreground">{searchResult.theoryResult.correctAnswers}</div>
                            <div className="text-sm text-muted-foreground">إجابات صحيحة</div>
                          </div>
                          <div className="text-center p-4 bg-muted/50 rounded-lg border border-border/30">
                            <div className="text-2xl font-bold text-foreground">{searchResult.theoryResult.totalQuestions}</div>
                            <div className="text-sm text-muted-foreground">إجمالي الأسئلة</div>
                          </div>
                        </>
                      )}
                      <div className="text-center p-4 bg-muted/50 rounded-lg border border-border/30">
                        <div className="text-2xl font-bold text-foreground">{searchResult.theoryResult.attempts}</div>
                        <div className="text-sm text-muted-foreground">المحاولات</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>تاريخ الامتحان: {searchResult.theoryResult.date}</span>
                    </div>
                    {searchResult.theoryResult.nextAttemptDate && (
                      <div className="mt-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                        <p className="text-sm text-foreground">
                          يمكنك إعادة الامتحان في: {searchResult.theoryResult.nextAttemptDate}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Practical Test Results */}
              {searchResult.practicalResult && (
                <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
                  <CardHeader className="bg-gradient-to-r from-primary/10 to-transparent border-b border-border/30">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-3">
                        <Award className="h-6 w-6 text-primary" />
                        <span>نتيجة الفحص العملي</span>
                      </CardTitle>
                      <Badge 
                        className={`${
                          searchResult.practicalResult.status === 'ناجح' 
                            ? 'bg-green-500' 
                            : searchResult.practicalResult.status === 'راسب'
                            ? 'bg-red-500'
                            : 'bg-yellow-500'
                        } text-white border-0`}
                      >
                        {searchResult.practicalResult.status === 'ناجح' && <CheckCircle2 className="h-4 w-4 ml-1" />}
                        {searchResult.practicalResult.status === 'راسب' && <XCircle className="h-4 w-4 ml-1" />}
                        {searchResult.practicalResult.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    {searchResult.practicalResult.score ? (
                      <>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                          <div className="text-center p-4 bg-muted/50 rounded-lg border border-border/30">
                            <div className="text-2xl font-bold text-primary">{searchResult.practicalResult.score}%</div>
                            <div className="text-sm text-muted-foreground">النتيجة</div>
                          </div>
                          <div className="text-center p-4 bg-muted/50 rounded-lg border border-border/30">
                            <div className="text-2xl font-bold text-foreground">{searchResult.practicalResult.attempts}</div>
                            <div className="text-sm text-muted-foreground">المحاولات</div>
                          </div>
                          <div className="text-center p-4 bg-muted/50 rounded-lg border border-border/30 md:col-span-1 col-span-2">
                            <div className="text-lg font-bold text-foreground">{searchResult.practicalResult.examiner}</div>
                            <div className="text-sm text-muted-foreground">الفاحص</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>تاريخ الامتحان: {searchResult.practicalResult.date}</span>
                        </div>
                      </>
                    ) : (
                      <div className="text-center p-6 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                        <Calendar className="h-12 w-12 text-yellow-500 mx-auto mb-3" />
                        <p className="font-semibold text-foreground mb-2">الامتحان العملي قيد الانتظار</p>
                        {searchResult.practicalResult.scheduledDate && (
                          <p className="text-sm text-muted-foreground">
                            موعد الامتحان المقرر: {searchResult.practicalResult.scheduledDate}
                          </p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Info Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <Card className="max-w-3xl mx-auto border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-center">معلومات مهمة</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span>يتم تحديث النتائج فوراً بعد الامتحان</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span>في حالة الرسوب، يمكن إعادة الامتحان بعد 7 أيام</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span>للاستفسارات، تواصل معنا عبر صفحة الاتصال</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default StudentLookup;