import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Car, CreditCard, Lock, User, Phone, CheckCircle2, Home } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { api as apiClient } from '@/integrations/api/client';

// Palestinian cities and their towns
const palestinianCities: Record<string, string[]> = {
  'القدس': ['القدس القديمة', 'شعفاط', 'العيزرية', 'أبو دبس', 'السواحرة', 'سلوان', 'الطور', 'صور باهر'],
  'رام الله': ['رام الله', 'البيرة', 'بيتونيا', 'بيت لقيا', 'دير عمار', 'عين يبرود', 'سلواد', 'ترمسعيا'],
  'الخليل': ['الخليل', 'دورا', 'يطا', 'حلحول', 'السموع', 'بني نعيم', 'سعير', 'تفوح', 'ذهرية'],
  'بيت لحم': ['بيت لحم', 'بيت جالا', 'بيت ساحور', 'الخضر', 'تقوع', 'العبيدية', 'الدوحة'],
  'نابلس': ['نابلس', 'حوارة', 'بيتا', 'عصيرة الشمالية', 'رفيديا', 'بلاطة', 'عسكر', 'عقربا'],
  'جنين': ['جنين', 'يعبد', 'عرابة', 'قباطية', 'برقين', 'سيلة الحارثية', 'الزبابدة', 'جلبون'],
  'طولكرم': ['طولكرم', 'قلقيلية', 'عزون', 'جيوس', 'بلعا', 'علار', 'ذنابة', 'عنبتا'],
  'قلقيلية': ['قلقيلية', 'عزون', 'حبلة', 'كفر ثلث', 'جيوس', 'النبي إلياس'],
  'سلفيت': ['سلفيت', 'بديا', 'كفل حارس', 'ديرستيا', 'حارس', 'قيرة', 'الزاوية'],
  'أريحا': ['أريحا', 'العوجا', 'فصايل', 'مرج نعجة', 'عين السلطان'],
  'غزة': ['غزة', 'جباليا', 'بيت حانون', 'بيت لاهيا', 'الشجاعية', 'الزيتون', 'النصيرات'],
  'خان يونس': ['خان يونس', 'بني سهيلا', 'عبسان', 'القرارة', 'خزاعة', 'المعن'],
  'رفح': ['رفح', 'الشوكة', 'البيوك', 'تل السلطان'],
  'دير البلح': ['دير البلح', 'الزوايدة', 'المغازي', 'البريج'],
  'الشمال': ['جباليا', 'بيت لاهيا', 'بيت حانون', 'العطاطرة', 'أم النصر'],
};

/** يطابق صفوف جدول `licenses` في قاعدة البيانات (init-db) */
type SignupLicense = {
  id: string;
  code: string;
  name_ar: string;
  display_order: number;
  is_active?: boolean;
};

function licenseTypeEmoji(code: string): string {
  const c = code.trim().toUpperCase();
  if (c === 'B') return '🚗';
  if (c === 'C1') return '🚚';
  if (c === 'C') return '🚛';
  if (c === 'D1' || c === 'D') return '🚌';
  if (c === 'A') return '🏍️';
  if (c === 'T' || c === 'F') return '🚜';
  return '📋';
}

/** نفس ترتيب وأسماء seed في `backend/src/scripts/init-db.js` */
const LICENSES_SEED_FALLBACK: SignupLicense[] = [
  { id: 'seed-b', code: 'B', name_ar: 'خصوصي', display_order: 1 },
  { id: 'seed-c1', code: 'C1', name_ar: 'شحن خفيف', display_order: 2 },
  { id: 'seed-c', code: 'C', name_ar: 'شحن ثقيل', display_order: 3 },
  { id: 'seed-d1', code: 'D1', name_ar: 'عمومي', display_order: 4 },
  { id: 'seed-a', code: 'A', name_ar: 'دراجة نارية', display_order: 5 },
  { id: 'seed-t', code: 'T', name_ar: 'تراكتور', display_order: 6 },
];

function digitsOnly(value: string, maxLen: number) {
  return value.replace(/\D/g, '').slice(0, maxLen);
}

function parseBirthDateParts(day: string, month: string, year: string): Date | null {
  if (!day || !month || year.length !== 4) return null;
  const d = Number(day);
  const m = Number(month);
  const y = Number(year);
  if (!Number.isInteger(d) || !Number.isInteger(m) || !Number.isInteger(y)) return null;
  if (m < 1 || m > 12 || d < 1 || d > 31) return null;
  const date = new Date(y, m - 1, d);
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) return null;
  const min = new Date(1940, 0, 1);
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  if (date < min || date > today) return null;
  return date;
}

const Auth = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [loginData, setLoginData] = useState({ idNumber: '', password: '' });
  const [signupData, setSignupData] = useState({
    firstName: '',
    lastName: '',
    birthDay: '',
    birthMonth: '',
    birthYear: '',
    idNumber: '',
    phone: '',
    city: '',
    town: '',
    fullAddress: '',
    password: '',
    confirmPassword: '',
    idImage: null as File | null,
    licenseType: '',
  });
  const [availableTowns, setAvailableTowns] = useState<string[]>([]);
  const [licenses, setLicenses] = useState<SignupLicense[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await apiClient
        .from('licenses')
        .select()
        .order('display_order', { ascending: true });
      if (cancelled) return;
      const rows = (Array.isArray(data) ? data : []) as SignupLicense[];
      const active = rows.filter((l) => l?.is_active !== false);
      setLicenses(active.length > 0 ? active : LICENSES_SEED_FALLBACK);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Check if user is already logged in
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await apiClient.auth.getSession();
      if (session) {
        navigate('/');
      }
    };
    checkUser();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await apiClient.auth.signInWithPassword({
        idNumber: loginData.idNumber,
        password: loginData.password,
      });

      if (error) throw error;

      toast({
        title: "تم تسجيل الدخول بنجاح!",
        description: "مرحباً بك في أكاديمية المدينة",
      });

      navigate('/');
    } catch (error: any) {
      toast({
        title: "خطأ في تسجيل الدخول",
        description: error.message || "رقم الهوية أو كلمة المرور غير صحيحة",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCityChange = (city: string) => {
    setSignupData({ ...signupData, city, town: '' });
    setAvailableTowns(palestinianCities[city] || []);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Validation
      if (signupData.password !== signupData.confirmPassword) {
        toast({
          title: "خطأ",
          description: "كلمتا المرور غير متطابقتين",
          variant: "destructive"
        });
        setLoading(false);
        return;
      }
      
      const birthDate = parseBirthDateParts(
        signupData.birthDay,
        signupData.birthMonth,
        signupData.birthYear
      );
      if (!birthDate) {
        toast({
          title: "خطأ",
          description: "يرجى إدخال تاريخ ميلاد صحيح (اليوم، الشهر، السنة)",
          variant: "destructive"
        });
        setLoading(false);
        return;
      }
      
      const selectedLicense = licenses.find((l) => l.code === signupData.licenseType);
      const licenseTypeForProfile = selectedLicense
        ? `${selectedLicense.name_ar} (${selectedLicense.code})`
        : signupData.licenseType || null;

      const { data, error } = await apiClient.auth.signUp({
        idNumber: signupData.idNumber,
        password: signupData.password,
        options: {
          data: {
            first_name: signupData.firstName,
            last_name: signupData.lastName,
            date_of_birth: format(birthDate, 'yyyy-MM-dd'),
            phone: signupData.phone,
            city: signupData.city,
            town: signupData.town,
            full_address: signupData.fullAddress,
            license_type: licenseTypeForProfile,
          }
        }
      });

      if (error) throw error;
      
      toast({
        title: "تم إنشاء الحساب بنجاح!",
        description: "مرحباً بك في أكاديمية المدينة",
      });

      // Auto login after signup
      navigate('/');
    } catch (error: any) {
      toast({
        title: "خطأ في إنشاء الحساب",
        description: error.message || "حدث خطأ أثناء إنشاء الحساب",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const features = [
    'الوصول الكامل لبنك الأسئلة',
    'امتحانات تجريبية غير محدودة',
    'تتبع التقدم والنتائج',
    'دعم فني متواصل'
  ];

  return (
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center py-12 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Side - Info */}
          <div className="text-center lg:text-right space-y-8">
            <Link to="/" className="inline-flex items-center space-x-4 rtl:space-x-reverse group">
              <div className="bg-gradient-primary p-3 rounded-xl shadow-button group-hover:scale-105 transition-transform duration-300">
                <Car className="h-8 w-8 text-white" />
              </div>
              <div className="text-right">
                <h1 className="text-3xl font-bold text-foreground">أكاديمية المدينة</h1>
                <p className="text-sm text-muted-foreground">لتعليم القيادة الحديثة</p>
              </div>
            </Link>

            <div className="space-y-4">
              <h2 className="text-4xl font-bold text-foreground">
                انضم إلى أكثر من <span className="text-primary">10,000</span> طالب ناجح
              </h2>
              <p className="text-xl text-muted-foreground">
                ابدأ رحلتك نحو الحصول على رخصة القيادة بأفضل الأدوات التعليمية
              </p>
            </div>

            <div className="space-y-4">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center gap-3 justify-center lg:justify-end">
                  <span className="text-muted-foreground text-lg">{feature}</span>
                  <div className="p-2 rounded-lg bg-primary/10">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-6">
              <div className="text-center p-4 rounded-xl bg-white shadow-card">
                <div className="text-2xl font-bold text-primary">95%</div>
                <div className="text-xs text-muted-foreground">نسبة النجاح</div>
              </div>
              <div className="text-center p-4 rounded-xl bg-white shadow-card">
                <div className="text-2xl font-bold text-primary">2000+</div>
                <div className="text-xs text-muted-foreground">سؤال</div>
              </div>
              <div className="text-center p-4 rounded-xl bg-white shadow-card">
                <div className="text-2xl font-bold text-primary">24/7</div>
                <div className="text-xs text-muted-foreground">دعم</div>
              </div>
            </div>
          </div>

          {/* Right Side - Auth Forms */}
          <Card className="border-2 border-primary/20 shadow-elevated bg-white/80 backdrop-blur-sm">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">مرحباً بك</CardTitle>
              <CardDescription>سجل دخولك أو أنشئ حساب جديد للبدء</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-8">
                  <TabsTrigger value="login" className="text-base">تسجيل الدخول</TabsTrigger>
                  <TabsTrigger value="signup" className="text-base">إنشاء حساب</TabsTrigger>
                </TabsList>

                {/* Login Tab */}
                <TabsContent value="login">
                  <form onSubmit={handleLogin} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="login-id" className="text-right block">رقم الهوية</Label>
                      <div className="relative">
                        <CreditCard className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                          id="login-id"
                          type="text"
                          placeholder="أدخل رقم الهوية"
                          value={loginData.idNumber}
                          onChange={(e) => setLoginData({ ...loginData, idNumber: e.target.value })}
                          required
                          className="pr-10 text-right"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="login-password" className="text-right block">كلمة المرور</Label>
                      <div className="relative">
                        <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                          id="login-password"
                          type="password"
                          placeholder="••••••••"
                          value={loginData.password}
                          onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                          required
                          className="pr-10 text-right"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <Link to="/forgot-password" className="text-primary hover:underline">نسيت كلمة المرور؟</Link>
                    </div>

                    <Button type="submit" className="w-full" size="lg" disabled={loading}>
                      {loading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
                    </Button>
                  </form>
                </TabsContent>

                {/* Signup Tab */}
                <TabsContent value="signup">
                  <form onSubmit={handleSignup} className="space-y-4 max-h-[600px] overflow-y-auto px-2">
                    {/* Name Fields */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="signup-lastname" className="text-right block">الاسم الأخير</Label>
                        <div className="relative">
                          <User className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="signup-lastname"
                            placeholder="الاسم الأخير"
                            value={signupData.lastName}
                            onChange={(e) => setSignupData({ ...signupData, lastName: e.target.value })}
                            required
                            className="pr-10 text-right"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-firstname" className="text-right block">الاسم الأول</Label>
                        <div className="relative">
                          <User className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="signup-firstname"
                            placeholder="الاسم الأول"
                            value={signupData.firstName}
                            onChange={(e) => setSignupData({ ...signupData, firstName: e.target.value })}
                            required
                            className="pr-10 text-right"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Date of Birth — يوم / شهر / سنة (صف واحد، ارتفاع مثل باقي الحقول) */}
                    <div className="space-y-2">
                      <Label className="text-right block">تاريخ الميلاد</Label>
                      <div
                        className="grid w-full grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.25fr)] gap-2 sm:gap-3"
                        dir="rtl"
                      >
                        {(
                          [
                            { key: 'birthDay' as const, label: 'اليوم', maxLen: 2, placeholder: '16', autoComplete: 'bday-day' as const },
                            { key: 'birthMonth' as const, label: 'الشهر', maxLen: 2, placeholder: '04', autoComplete: 'bday-month' as const },
                            { key: 'birthYear' as const, label: 'السنة', maxLen: 4, placeholder: '2005', autoComplete: 'bday-year' as const },
                          ] as const
                        ).map(({ key, label, maxLen, placeholder, autoComplete }) => (
                          <div key={key} className="flex min-w-0 flex-col gap-1">
                            <span className="text-xs text-muted-foreground text-center">{label}</span>
                            <Input
                              inputMode="numeric"
                              autoComplete={autoComplete}
                              aria-label={label}
                              placeholder={placeholder}
                              value={signupData[key]}
                              onChange={(e) =>
                                setSignupData({
                                  ...signupData,
                                  [key]: digitsOnly(e.target.value, maxLen),
                                })
                              }
                              className="h-10 w-full min-w-0 px-2 text-center tabular-nums sm:px-3"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Contact Info */}
                    <div className="space-y-2">
                      <Label htmlFor="signup-phone" className="text-right block">رقم الهاتف</Label>
                      <div className="relative">
                        <Phone className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="signup-phone"
                          type="tel"
                          placeholder="05xxxxxxxx"
                          value={signupData.phone}
                          onChange={(e) => setSignupData({ ...signupData, phone: e.target.value })}
                          required
                          className="pr-10 text-right"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-id-number" className="text-right block">رقم الهوية</Label>
                      <div className="relative">
                        <CreditCard className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="signup-id-number"
                          type="text"
                          placeholder="أدخل رقم الهوية"
                          value={signupData.idNumber}
                          onChange={(e) => setSignupData({ ...signupData, idNumber: e.target.value })}
                          required
                          className="pr-10 text-right"
                        />
                      </div>
                    </div>

                    {/* Location */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="signup-town" className="text-right block">اسم البلدة</Label>
                        <Select 
                          value={signupData.town} 
                          onValueChange={(value) => setSignupData({ ...signupData, town: value })}
                          disabled={!signupData.city}
                        >
                          <SelectTrigger className="text-right">
                            <SelectValue placeholder="اختر البلدة" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableTowns.map((town) => (
                              <SelectItem key={town} value={town}>{town}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-city" className="text-right block">اسم المدينة</Label>
                        <Select value={signupData.city} onValueChange={handleCityChange}>
                          <SelectTrigger className="text-right">
                            <SelectValue placeholder="اختر المدينة" />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.keys(palestinianCities).map((city) => (
                              <SelectItem key={city} value={city}>{city}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-address" className="text-right block">العنوان الكامل</Label>
                      <div className="relative">
                        <Home className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="signup-address"
                          placeholder="أدخل عنوانك الكامل"
                          value={signupData.fullAddress}
                          onChange={(e) => setSignupData({ ...signupData, fullAddress: e.target.value })}
                          required
                          className="pr-10 text-right"
                        />
                      </div>
                    </div>

                    {/* License Type */}
                    <div className="space-y-2">
                      <Label htmlFor="signup-license" className="text-right block">نوع الرخصة</Label>
                      <Select
                        value={signupData.licenseType || undefined}
                        onValueChange={(value) => setSignupData({ ...signupData, licenseType: value })}
                        disabled={licenses.length === 0}
                      >
                        <SelectTrigger id="signup-license" className="text-right">
                          <SelectValue
                            placeholder={
                              licenses.length === 0 ? 'جاري تحميل أنواع الرخصة…' : 'اختر نوع الرخصة'
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {licenses.map((l) => (
                            <SelectItem
                              key={l.id}
                              value={l.code}
                              textValue={`${l.name_ar} (${l.code})`}
                              className="text-right"
                            >
                              <span
                                className="inline-flex w-full items-center justify-end gap-2"
                                dir="rtl"
                              >
                                <span>
                                  {l.name_ar} ({l.code})
                                </span>
                                <span aria-hidden className="shrink-0 text-base leading-none">
                                  {licenseTypeEmoji(l.code)}
                                </span>
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* ID Image Upload */}
                    <div className="space-y-2">
                      <Label htmlFor="signup-id-image" className="text-right block">صورة الهوية (اختياري)</Label>
                      <div className="relative">
                        <Input
                          id="signup-id-image"
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0] || null;
                            setSignupData({ ...signupData, idImage: file });
                          }}
                          className="text-right cursor-pointer file:ml-4 file:rounded-md file:border-0 file:bg-primary file:text-white file:px-4 file:py-2"
                        />
                      </div>
                      {signupData.idImage && (
                        <p className="text-sm text-muted-foreground text-right">
                          تم اختيار: {signupData.idImage.name}
                        </p>
                      )}
                    </div>

                    {/* Password Fields */}
                    <div className="space-y-2">
                      <Label htmlFor="signup-password" className="text-right block">كلمة المرور</Label>
                      <div className="relative">
                        <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="signup-password"
                          type="password"
                          placeholder="••••••••"
                          value={signupData.password}
                          onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                          required
                          className="pr-10 text-right"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-confirm-password" className="text-right block">تأكيد كلمة المرور</Label>
                      <div className="relative">
                        <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="signup-confirm-password"
                          type="password"
                          placeholder="••••••••"
                          value={signupData.confirmPassword}
                          onChange={(e) => setSignupData({ ...signupData, confirmPassword: e.target.value })}
                          required
                          className="pr-10 text-right"
                        />
                      </div>
                    </div>

                    <Button type="submit" className="w-full" size="lg" disabled={loading}>
                      {loading ? 'جاري إنشاء الحساب...' : 'إنشاء حساب'}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Auth;