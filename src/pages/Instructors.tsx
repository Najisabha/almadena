import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Users, Star, GraduationCap, TrendingUp } from 'lucide-react';
import { api as apiClient } from '@/integrations/api/client';
import { cn } from '@/lib/utils';
import { parseInstructorStudentComments } from '@/lib/instructorStudentComments';

type InstructorPublic = {
  id: string;
  name_ar: string;
  role_ar: string | null;
  bio_ar: string | null;
  image_url: string | null;
  rating_stars?: number | string | null;
  students_trained?: number | string | null;
  success_rate?: number | string | null;
  student_comments?: string | null;
  display_order: number;
  is_visible: boolean;
};

const STATIC_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

function resolveImageUrl(url: string | null | undefined): string {
  if (!url) return '';
  const clean = String(url).trim();
  if (!clean) return '';
  if (/^https?:\/\//i.test(clean)) return clean;
  if (clean.startsWith('//')) return `https:${clean}`;
  return `${STATIC_BASE}${clean.startsWith('/') ? '' : '/'}${clean}`;
}

function toNum(v: unknown): number | null {
  if (v == null || v === '') return null;
  const n = typeof v === 'number' ? v : parseFloat(String(v).replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

function toInt(v: unknown): number | null {
  if (v == null || v === '') return null;
  const n = typeof v === 'number' ? Math.round(v) : parseInt(String(v), 10);
  return Number.isFinite(n) ? n : null;
}

function StarRatingDisplay({ value }: { value: number }) {
  const clamped = Math.min(5, Math.max(0, value));
  const starClass = 'w-5 h-5';
  return (
    <div className="inline-flex items-center gap-0.5" dir="ltr" aria-hidden>
      {[1, 2, 3, 4, 5].map((i) => {
        const full = clamped >= i;
        const half = !full && clamped >= i - 0.5;
        return (
          <span key={i} className={cn('relative inline-block', starClass)}>
            <Star className={cn(starClass, full ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/35')} />
            {half ? (
              <span className="absolute inset-0 overflow-hidden w-1/2">
                <Star className={cn(starClass, 'fill-yellow-400 text-yellow-400')} />
              </span>
            ) : null}
          </span>
        );
      })}
    </div>
  );
}

const Instructors = () => {
  const [list, setList] = useState<InstructorPublic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await apiClient
          .from('instructors')
          .select('*')
          .order('display_order', { ascending: true });
        if (error || cancelled) return;
        const rows = (data as InstructorPublic[]) || [];
        setList(rows.filter((r) => r.is_visible));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-muted/20 to-background">
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-primary opacity-5"></div>
        <div className="container mx-auto px-4 relative">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">فريق التدريب</Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
              تعرف على <span className="text-primary">مدربينا</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              نخبة من المدربين المعتمدين لمساعدتك على اجتياز التووريا والقيادة بثقة.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          {loading ? (
            <div className="text-center py-16 text-muted-foreground">جاري التحميل...</div>
          ) : list.length === 0 ? (
            <Card className="max-w-xl mx-auto border-border/50 bg-card/80 backdrop-blur-sm">
              <CardContent className="py-14 text-center space-y-4">
                <Users className="h-14 w-14 text-muted-foreground mx-auto" />
                <p className="text-muted-foreground">
                  لا توجد ملفات مدربين منشورة حالياً على الموقع.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
              {list.map((instructor) => {
                const stars = toNum(instructor.rating_stars);
                const students = toInt(instructor.students_trained);
                const rate = toNum(instructor.success_rate);
                const hasRating = stars != null && stars > 0;
                const hasStudents = students != null;
                const hasRate = rate != null;
                const hasMetrics = hasStudents || hasRate;
                const commentItems = parseInstructorStudentComments(instructor.student_comments);
                const hasBio = Boolean(instructor.bio_ar?.trim());
                const showHeaderRule = hasRating || hasMetrics;

                return (
                  <Card
                    key={instructor.id}
                    className="border-border/60 bg-card shadow-sm hover:shadow-md transition-shadow flex flex-col overflow-hidden rounded-2xl"
                    dir="rtl"
                  >
                    <div className="bg-gradient-to-b from-muted/50 to-transparent px-6 pt-8 pb-6 flex flex-col items-center text-center">
                      <div className="relative shrink-0">
                        <div className="h-32 w-32 rounded-full ring-4 ring-background shadow-md overflow-hidden bg-muted flex items-center justify-center">
                          {instructor.image_url ? (
                            <img
                              src={resolveImageUrl(instructor.image_url)}
                              alt=""
                              className="h-full w-full object-cover object-top"
                            />
                          ) : (
                            <Users className="h-14 w-14 text-muted-foreground/45" />
                          )}
                        </div>
                      </div>
                      <h2 className="mt-5 text-xl font-bold text-foreground tracking-tight">{instructor.name_ar}</h2>
                      {instructor.role_ar ? (
                        <p className="mt-1.5 text-sm font-medium text-primary/90 leading-snug max-w-[260px]">
                          {instructor.role_ar}
                        </p>
                      ) : null}
                    </div>

                    <CardContent className="p-0 flex flex-col flex-1">
                      {showHeaderRule ? (
                        <>
                          <Separator className="opacity-60" />
                          <div className="px-6 py-4 space-y-4">
                            {hasRating ? (
                              <div className="flex flex-col items-center gap-2">
                                <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                                  التقييم
                                </span>
                                <div className="flex flex-wrap items-center justify-center gap-2">
                                  <StarRatingDisplay value={stars!} />
                                  <span className="text-sm tabular-nums text-muted-foreground">
                                    {stars!.toLocaleString('ar-EG', { maximumFractionDigits: 1 })}
                                    <span className="text-muted-foreground/70">/5</span>
                                  </span>
                                </div>
                              </div>
                            ) : null}

                            {hasMetrics ? (
                              <div
                                className={cn(
                                  'grid gap-2',
                                  hasStudents && hasRate ? 'grid-cols-2' : 'grid-cols-1 max-w-[240px] mx-auto w-full'
                                )}
                              >
                                {hasStudents ? (
                                  <div className="rounded-xl border border-border/70 bg-muted/25 px-3 py-3 text-center">
                                    <div className="flex justify-center text-muted-foreground mb-1">
                                      <GraduationCap className="h-4 w-4" aria-hidden />
                                    </div>
                                    <p className="text-lg font-bold tabular-nums text-foreground leading-none">
                                      {students!.toLocaleString('ar-EG')}
                                    </p>
                                    <p className="text-[11px] text-muted-foreground mt-1.5 leading-tight">طلاب درّبهم</p>
                                  </div>
                                ) : null}
                                {hasRate ? (
                                  <div className="rounded-xl border border-primary/25 bg-primary/5 px-3 py-3 text-center">
                                    <div className="flex justify-center text-primary/80 mb-1">
                                      <TrendingUp className="h-4 w-4" aria-hidden />
                                    </div>
                                    <p className="text-lg font-bold tabular-nums text-primary leading-none">
                                      {rate!.toLocaleString('ar-EG', { maximumFractionDigits: 2 })}%
                                    </p>
                                    <p className="text-[11px] text-muted-foreground mt-1.5 leading-tight">نسبة النجاح</p>
                                  </div>
                                ) : null}
                              </div>
                            ) : null}
                          </div>
                        </>
                      ) : null}

                      {hasBio ? (
                        <>
                          <Separator className="opacity-60" />
                          <div className="px-6 py-4 text-right">
                            <p className="text-[11px] font-medium text-muted-foreground mb-2">نبذة</p>
                            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                              {instructor.bio_ar}
                            </p>
                          </div>
                        </>
                      ) : null}

                      {commentItems.length > 0 ? (
                        <>
                          <Separator className="opacity-60" />
                          <div className="px-6 py-4 mt-auto text-right space-y-3 flex-1 flex flex-col bg-muted/15">
                            <p className="text-xs font-semibold text-primary">تعليقات الطلاب</p>
                            <ul className="space-y-2.5 list-none p-0 m-0 flex-1">
                              {commentItems.map((item, idx) => (
                                <li
                                  key={`${instructor.id}-${idx}`}
                                  className="rounded-xl border border-border/60 bg-background/80 p-3 text-right shadow-sm"
                                >
                                  {item.student_name ? (
                                    <p className="text-sm font-semibold text-foreground mb-1.5">{item.student_name}</p>
                                  ) : null}
                                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap m-0">
                                    {item.comment}
                                  </p>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </>
                      ) : null}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Instructors;
