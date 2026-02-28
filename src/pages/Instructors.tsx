import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, Award, Users, Calendar, Quote } from 'lucide-react';

const Instructors = () => {
  const instructors = [
    {
      id: 1,
      name: 'المدرب أحمد الخالدي',
      image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Instructor1',
      specialty: 'مدرب رخصة خاصة وأجرة',
      experience: '15 سنة خبرة',
      rating: 4.9,
      totalReviews: 342,
      successRate: '98%',
      reviews: [
        { student: 'محمد العتيبي', comment: 'مدرب محترف جداً وصبور، يشرح بطريقة سهلة ومفهومة' },
        { student: 'فاطمة السليمان', comment: 'أفضل مدرب! نجحت من أول مرة بفضل توجيهاته' }
      ]
    },
    {
      id: 2,
      name: 'المدربة سارة النجار',
      image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Instructor2',
      specialty: 'مدربة رخصة خاصة للسيدات',
      experience: '10 سنوات خبرة',
      rating: 5.0,
      totalReviews: 289,
      successRate: '97%',
      reviews: [
        { student: 'نورة القحطاني', comment: 'مدربة رائعة ومتفهمة، بيئة تعليم مريحة جداً' },
        { student: 'ريم المطيري', comment: 'احترافية عالية وأسلوب تدريس ممتاز' }
      ]
    },
    {
      id: 3,
      name: 'المدرب خالد الشهري',
      image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Instructor3',
      specialty: 'مدرب رخصة شاحنة ومعدات',
      experience: '20 سنة خبرة',
      rating: 4.8,
      totalReviews: 156,
      successRate: '96%',
      reviews: [
        { student: 'عبدالله الدوسري', comment: 'خبرة كبيرة في تعليم قيادة الشاحنات' },
        { student: 'سعود الغامدي', comment: 'مدرب متمكن ويعطي نصائح قيمة' }
      ]
    },
    {
      id: 4,
      name: 'المدرب عبدالرحمن الحربي',
      image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Instructor4',
      specialty: 'مدرب رخصة دراجة نارية',
      experience: '8 سنوات خبرة',
      rating: 4.9,
      totalReviews: 198,
      successRate: '95%',
      reviews: [
        { student: 'يوسف العمري', comment: 'يفهم متطلبات رخصة الدراجات بشكل ممتاز' },
        { student: 'طلال الشمري', comment: 'مدرب محترف وملتزم بالمواعيد' }
      ]
    },
    {
      id: 5,
      name: 'المدربة منى الزهراني',
      image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Instructor5',
      specialty: 'مدربة رخصة خاصة للسيدات',
      experience: '12 سنة خبرة',
      rating: 4.9,
      totalReviews: 267,
      successRate: '97%',
      reviews: [
        { student: 'هند القرشي', comment: 'صبورة ومتفهمة، تساعدك حتى تتقني القيادة' },
        { student: 'لينا الجهني', comment: 'أسلوب تدريس رائع ونتائج ممتازة' }
      ]
    },
    {
      id: 6,
      name: 'المدرب ناصر العتيبي',
      image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Instructor6',
      specialty: 'مدرب رخصة خاصة وأجرة',
      experience: '18 سنة خبرة',
      rating: 4.8,
      totalReviews: 312,
      successRate: '96%',
      reviews: [
        { student: 'فهد الشهري', comment: 'مدرب محترف ويعطي وقت كافي للتدريب' },
        { student: 'خالد الدوسري', comment: 'خبرة طويلة ومعلومات قيمة' }
      ]
    }
  ];

  const stats = [
    { label: 'مدرب مؤهل', value: '25+', icon: Users },
    { label: 'سنوات خبرة', value: '15+', icon: Calendar },
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
              فريق محترف ومتميز
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
              تعرف على <span className="text-primary">مدربينا</span> المحترفين
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              مدربون ذوو خبرة عالية وشهادات معتمدة، مكرسون لتقديم أفضل تجربة تعليمية
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

      {/* Instructors Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {instructors.map((instructor) => (
              <Card key={instructor.id} className="group hover:shadow-elevated transition-all duration-300 border-border/50 bg-card/80 backdrop-blur-sm overflow-hidden">
                <CardHeader className="text-center pb-4">
                  <div className="relative mx-auto mb-4">
                    <div className="w-32 h-32 rounded-full bg-gradient-primary p-1 mx-auto">
                      <img 
                        src={instructor.image} 
                        alt={instructor.name}
                        className="w-full h-full rounded-full bg-background object-cover"
                      />
                    </div>
                    <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-primary text-primary-foreground shadow-lg whitespace-nowrap">
                        <Award className="h-3 w-3 ml-1" />
                        معتمد
                      </Badge>
                    </div>
                  </div>
                  <CardTitle className="text-xl mb-2">{instructor.name}</CardTitle>
                  <p className="text-sm text-muted-foreground mb-2">{instructor.specialty}</p>
                  <p className="text-xs text-muted-foreground">{instructor.experience}</p>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Stats Row */}
                  <div className="grid grid-cols-3 gap-2 pb-4 border-b border-border/30">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-bold text-foreground">{instructor.rating}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">التقييم</p>
                    </div>
                    <div className="text-center border-x border-border/30">
                      <div className="font-bold text-foreground mb-1">{instructor.totalReviews}</div>
                      <p className="text-xs text-muted-foreground">مقيّم</p>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-foreground mb-1">{instructor.successRate}</div>
                      <p className="text-xs text-muted-foreground">نجاح</p>
                    </div>
                  </div>

                  {/* Reviews */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                      <Quote className="h-4 w-4 text-primary" />
                      <span>آراء الطلاب</span>
                    </div>
                    {instructor.reviews.map((review, idx) => (
                      <div key={idx} className="bg-muted/50 rounded-lg p-3 border border-border/30">
                        <p className="text-xs text-muted-foreground mb-2 leading-relaxed">
                          "{review.comment}"
                        </p>
                        <p className="text-xs font-semibold text-foreground">- {review.student}</p>
                      </div>
                    ))}
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
              <h2 className="text-3xl font-bold mb-4">تدرب مع أفضل المدربين</h2>
              <p className="text-white/90 mb-8 max-w-2xl mx-auto">
                احجز موعدك الآن واستفد من خبرة مدربينا المحترفين لتحقيق حلمك في الحصول على رخصة القيادة
              </p>
              <a 
                href="/contact" 
                className="inline-flex items-center gap-2 bg-white text-primary px-8 py-3 rounded-lg font-semibold hover:bg-white/90 transition-all shadow-lg"
              >
                احجز موعد
                <Calendar className="h-5 w-5" />
              </a>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default Instructors;