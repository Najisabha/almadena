import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, Award, Car, Truck, TramFront, Tractor, Bike } from 'lucide-react';

const StudentResults = () => {
  const students = [
    {
      id: 1,
      name: 'أحمد محمد الشمري',
      image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ahmed',
      licenseType: 'رخصة خاصة',
      licenseIcon: Car,
      rating: 5,
      review: 'أكاديمية ممتازة جداً، المدربون محترفون والمواد التعليمية شاملة. نجحت من أول مرة بفضل التدريب الجيد.',
      passDate: '2024-09-15'
    },
    {
      id: 2,
      name: 'فاطمة علي الزهراني',
      image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Fatima',
      licenseType: 'رخصة خاصة',
      licenseIcon: Car,
      rating: 5,
      review: 'تجربة رائعة! الأساتذة صبورين ويشرحون بطريقة سهلة ومفهومة. أنصح الجميع بالتسجيل هنا.',
      passDate: '2024-09-20'
    },
    {
      id: 3,
      name: 'خالد سعد العتيبي',
      image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Khalid',
      licenseType: 'رخصة شاحنة',
      licenseIcon: Truck,
      rating: 5,
      review: 'أفضل أكاديمية لتعليم القيادة. حصلت على رخصة الشاحنة بسهولة بفضل التدريب العملي المكثف.',
      passDate: '2024-08-10'
    },
    {
      id: 4,
      name: 'نورة عبدالله القحطاني',
      image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Noura',
      licenseType: 'رخصة خاصة',
      licenseIcon: Car,
      rating: 5,
      review: 'المدربات محترفات جداً وبيئة التعليم مريحة. الأسعار معقولة والخدمة ممتازة.',
      passDate: '2024-09-25'
    },
    {
      id: 5,
      name: 'محمد عبدالعزيز الدوسري',
      image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mohammed',
      licenseType: 'رخصة أجرة',
      licenseIcon: TramFront,
      rating: 4,
      review: 'تجربة جيدة جداً. المدربون لديهم خبرة كبيرة في التعامل مع امتحانات الأجرة.',
      passDate: '2024-08-28'
    },
    {
      id: 6,
      name: 'سارة يوسف الغامدي',
      image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sara',
      licenseType: 'رخصة خاصة',
      licenseIcon: Car,
      rating: 5,
      review: 'أكاديمية احترافية من جميع النواحي. التدريب النظري والعملي على أعلى مستوى.',
      passDate: '2024-09-05'
    },
    {
      id: 7,
      name: 'عبدالرحمن ناصر الحربي',
      image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Abdulrahman',
      licenseType: 'رخصة دراجة نارية',
      licenseIcon: Bike,
      rating: 5,
      review: 'المدربون يفهمون متطلبات رخصة الدراجات النارية جيداً. نصائحهم كانت قيّمة جداً.',
      passDate: '2024-09-12'
    },
    {
      id: 8,
      name: 'ريم فهد المطيري',
      image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Reem',
      licenseType: 'رخصة خاصة',
      licenseIcon: Car,
      rating: 5,
      review: 'شكراً لكل المدربين على الصبر والاحتراف. نجحت بتفوق بفضل تعليماتهم الواضحة.',
      passDate: '2024-09-18'
    }
  ];

  const stats = [
    { label: 'معدل النجاح', value: '96%', icon: Award },
    { label: 'خريج ناجح', value: '3,450+', icon: Star },
    { label: 'تقييم عام', value: '4.9/5', icon: Star }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-muted/20 to-background">
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-primary opacity-5"></div>
        <div className="container mx-auto px-4 relative">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
              قصص نجاح ملهمة
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
              نتائج <span className="text-primary">طلابنا</span> المميزة
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              استمع لتجارب طلابنا الناجحين وكيف ساعدناهم في تحقيق حلمهم بالحصول على رخصة القيادة
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-16">
            {stats.map((stat, index) => (
              <Card key={index} className="bg-card/50 backdrop-blur-sm border-primary/10 hover:shadow-elevated transition-all duration-300">
                <CardContent className="flex flex-col items-center justify-center p-6">
                  <stat.icon className="h-12 w-12 text-primary mb-3" />
                  <div className="text-3xl font-bold text-foreground mb-1">{stat.value}</div>
                  <div className="text-muted-foreground">{stat.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Students Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {students.map((student) => (
              <Card key={student.id} className="group hover:shadow-elevated transition-all duration-300 border-border/50 bg-card/80 backdrop-blur-sm overflow-hidden">
                <CardHeader className="text-center pb-4">
                  <div className="relative mx-auto mb-4">
                    <div className="w-24 h-24 rounded-full bg-gradient-primary p-1 mx-auto">
                      <img 
                        src={student.image} 
                        alt={student.name}
                        className="w-full h-full rounded-full bg-background object-cover"
                      />
                    </div>
                    <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-primary text-primary-foreground shadow-lg">
                        <Award className="h-3 w-3 ml-1" />
                        ناجح
                      </Badge>
                    </div>
                  </div>
                  <CardTitle className="text-xl mb-2">{student.name}</CardTitle>
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <student.licenseIcon className="h-4 w-4" />
                    <span className="text-sm">{student.licenseType}</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Rating */}
                  <div className="flex items-center justify-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-5 w-5 ${
                          i < student.rating
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>

                  {/* Review */}
                  <div className="bg-muted/50 rounded-lg p-4 border border-border/30">
                    <p className="text-sm text-muted-foreground leading-relaxed text-center">
                      "{student.review}"
                    </p>
                  </div>

                  {/* Pass Date */}
                  <div className="text-center text-xs text-muted-foreground pt-2 border-t border-border/30">
                    تاريخ النجاح: {student.passDate}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <Card className="bg-gradient-primary text-white border-0 shadow-elevated">
            <CardContent className="p-12 text-center">
              <h2 className="text-3xl font-bold mb-4">هل أنت مستعد لتكون أحد قصص نجاحنا؟</h2>
              <p className="text-white/90 mb-8 max-w-2xl mx-auto">
                انضم إلى آلاف الطلاب الذين حققوا حلمهم في الحصول على رخصة القيادة معنا
              </p>
              <a 
                href="/auth" 
                className="inline-flex items-center gap-2 bg-white text-primary px-8 py-3 rounded-lg font-semibold hover:bg-white/90 transition-all shadow-lg"
              >
                سجل الآن
                <Award className="h-5 w-5" />
              </a>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default StudentResults;