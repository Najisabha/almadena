import { NavbarConfig } from "./navbar.types";

export const defaultNavbarConfig: NavbarConfig = {
  items: [
    { id: "home", kind: "menu", title: "الرئيسية", href: "/", iconKey: "Car", order: 1, isVisible: true },
    { id: "questions", kind: "menu", title: "أسئلة التووريا", href: "/questions", iconKey: "BookOpen", order: 2, isVisible: true },
    { id: "student-results", kind: "menu", title: "نتائج طلابنا", href: "/student-results", iconKey: "Trophy", order: 3, isVisible: true },
    { id: "instructors", kind: "menu", title: "مدربينا", href: "/instructors", iconKey: "Users", order: 4, isVisible: true },
    { id: "contact", kind: "menu", title: "اتصل بنا", href: "/contact", iconKey: "Phone", order: 5, isVisible: true },
    { id: "signs", kind: "menu", title: "الاشارات", href: "/signs", iconKey: "Car", order: 6, isVisible: true },

    {
      id: "license-requirements",
      kind: "inquiry",
      title: "متطلبات الرخصة",
      href: "/license-requirements",
      description: "تعرف على شروط ومتطلبات الحصول على الرخصة",
      order: 1,
      isVisible: true,
    },
    {
      id: "pricing",
      kind: "inquiry",
      title: "أسعار الدروس",
      href: "/pricing",
      description: "باقات وأسعار تدريب القيادة",
      order: 2,
      isVisible: true,
    },
    {
      id: "student-lookup-theory",
      kind: "inquiry",
      title: "استعلام عن النتائج",
      href: "/student-lookup",
      description: "استعلم عن نتائجك في التووريا أو الامتحان العملي",
      order: 3,
      isVisible: true,
    },
  ],
  badge: {
    enabled: true,
    count: 1,
    color: "destructive",
    targetHref: "/dashboard",
  },
};
