import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, HelpCircle, Info, Lightbulb, MoveRight, Triangle, Waves } from "lucide-react";
import { api as apiClient } from "@/integrations/api/client";

interface TrafficSign {
  id: string;
  section_key: string;
  sign_number: number;
  sign_code: string;
  title: string;
  description: string | null;
  image_url: string;
  is_active: boolean;
}

const SIGN_GROUPS = [
  { id: "warning",       title: "اشارات تحذير",           description: "تنبه السائق لوجود خطر محتمل على الطريق",                    icon: AlertTriangle, letter: "أ" },
  { id: "guidance",      title: "اشارات ارشاد",            description: "تعطي معلومات توجه السائق نحو الاتجاهات والخدمات",           icon: Info,          letter: "ب" },
  { id: "inquiry",       title: "اشارات استعلام",          description: "توضح نقاط الاستفسار والمعلومات العامة على الطريق",          icon: HelpCircle,    letter: "ج" },
  { id: "road-surface",  title: "اشارات على سطح الطريق",   description: "علامات مرسومة على الطريق لتنظيم حركة السير",               icon: Waves,         letter: "د" },
  { id: "traffic-lights",title: "اشارات الضوئية",          description: "إشارات ضوئية تتحكم في أولوية المرور عند التقاطعات",        icon: Lightbulb,     letter: "ه" },
  { id: "support",       title: "اشارات مساعدة",           description: "لوحات مساعدة إضافية تعزز السلامة وتوضح التنبيهات",         icon: Triangle,      letter: "و" },
];

const Signs = () => {
  const [signsBySection, setSignsBySection] = useState<Record<string, TrafficSign[]>>({});
  const [activeSigns, setActiveSigns] = useState<TrafficSign[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSigns = async () => {
      try {
        const { data } = await apiClient
          .from<TrafficSign>("traffic_signs")
          .select()
          .order("sign_number", { ascending: true });

        const all = (data as TrafficSign[] | null) || [];
        const active = all.filter((s) => s.is_active);

        const grouped: Record<string, TrafficSign[]> = {};
        active.forEach((sign) => {
          if (!grouped[sign.section_key]) grouped[sign.section_key] = [];
          grouped[sign.section_key].push(sign);
        });

        setActiveSigns(active);
        setSignsBySection(grouped);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSigns();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-subtle" dir="rtl">
      {/* Hero */}
      <section className="bg-gradient-primary text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <Badge className="mb-4 bg-white/20 text-white border-white/30">دليل إشارات المرور</Badge>
          <h1 className="text-4xl font-bold mb-4">الإشارات المرورية</h1>
          <p className="text-white/90 max-w-3xl mx-auto text-lg">
            صفحة مرجعية سريعة لتعلّم أهم الإشارات المتداولة في اختبار التووريا وفي القيادة اليومية.
          </p>
        </div>
      </section>

      {/* الأقسام الستة */}
      <section className="py-14">
        <div className="container mx-auto px-4">
          {isLoading ? (
            <div className="flex justify-center py-16">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {SIGN_GROUPS.map((group) => {
                const Icon = group.icon;
                const items = signsBySection[group.id] || [];
                return (
                  <Card key={group.id} className="border bg-white/80 backdrop-blur-sm">
                    <CardHeader className="pb-3">
                      <div className="p-2 rounded-lg bg-gradient-primary w-fit mb-2">
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      <CardTitle className="text-xl">{group.title}</CardTitle>
                      <CardDescription className="text-xs">{group.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-xs text-muted-foreground">عدد الشاخصات المتاحة: {items.length}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* معرض الشواخص المرئي */}
      {SIGN_GROUPS.map((group) => {
        const items = signsBySection[group.id] || [];
        if (items.length === 0) return null;
        const Icon = group.icon;
        return (
          <section key={group.id} className="pb-10">
            <div className="container mx-auto px-4">
              <Card className="border bg-white/80 backdrop-blur-sm">
                <CardHeader className="pb-3 border-b">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-gradient-primary">
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">شاخصات ({group.title})</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                    {items.map((sign) => (
                      <div key={sign.id} className="border rounded-lg overflow-hidden bg-background flex flex-col">
                        <div className="h-24 sm:h-28 bg-muted flex items-center justify-center p-1">
                          <img
                            src={sign.image_url}
                            alt={sign.title}
                            className="h-full w-full object-contain"
                            loading="lazy"
                          />
                        </div>
                        <div className="p-2 sm:p-2.5 text-center flex-1 flex flex-col justify-between gap-1">
                          <p className="text-[11px] sm:text-xs md:text-sm lg:text-base font-medium leading-tight text-black">
                            {sign.title}
                          </p>
                          {sign.description && (
                            <p className="text-[10px] sm:text-[11px] md:text-xs lg:text-sm leading-tight line-clamp-2 text-red-600">
                              {sign.description}
                            </p>
                          )}
                          <span className="text-[10px] sm:text-[11px] md:text-xs font-bold text-primary">[{sign.sign_code}]</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>
        );
      })}

      {/* قسم الشواخص الكاملة (كل الأقسام مجتمعة بالترتيب) */}
      {activeSigns.length > 0 && (
        <section className="pb-10">
          <div className="container mx-auto px-4">
            <Card className="border bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-xl">جميع الشواخص</CardTitle>
                <CardDescription className="text-xs">مرتبة أبجديًا حسب الكود (أ أولًا ثم باقي الحروف)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                  {[...activeSigns]
                    .sort((a, b) => {
                      const codeCmp = a.sign_code.localeCompare(b.sign_code, "ar", { sensitivity: "base", numeric: true });
                      if (codeCmp !== 0) return codeCmp;
                      return a.title.localeCompare(b.title, "ar", { sensitivity: "base", numeric: true });
                    })
                    .map((sign) => (
                    <div key={sign.id} className="border rounded-lg overflow-hidden bg-background flex flex-col">
                      <div className="h-24 sm:h-28 bg-muted flex items-center justify-center p-1">
                        <img
                          src={sign.image_url}
                          alt={sign.title}
                          className="h-full w-full object-contain"
                          loading="lazy"
                        />
                      </div>
                      <div className="p-2 sm:p-2.5 text-center flex-1 flex flex-col justify-between gap-1">
                        <p className="text-[11px] sm:text-xs md:text-sm lg:text-base font-medium leading-tight text-black">
                          {sign.title}
                        </p>
                        {sign.description && (
                          <p className="text-[10px] sm:text-[11px] md:text-xs lg:text-sm leading-tight line-clamp-2 text-red-600">
                            {sign.description}
                          </p>
                        )}
                        <span className="text-[10px] sm:text-[11px] md:text-xs font-bold text-primary">[{sign.sign_code}]</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      )}

      {/* نصيحة سريعة */}
      <section className="pb-16">
        <div className="container mx-auto px-4">
          <Card className="border-primary/20 bg-gradient-card">
            <CardHeader>
              <CardTitle className="flex items-center justify-center gap-2">
                <MoveRight className="h-5 w-5" />
                نصيحة سريعة للنجاح
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center text-muted-foreground">
              راجع الأقسام الستة بشكل يومي مع حل أسئلة التووريا، وركّز على الربط بين شكل الإشارة ومعناها لتتذكرها بسرعة.
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default Signs;
