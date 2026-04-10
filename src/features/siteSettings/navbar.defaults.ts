import { NavbarConfig } from "./navbar.types";

export const defaultNavbarConfig: NavbarConfig = {
  items: [
    { id: "home", kind: "menu", title: "الرئيسية", href: "/", iconKey: "Car", order: 1, isVisible: true },
    { id: "questions", kind: "menu", title: "أسئلة التووري", href: "/questions", iconKey: "BookOpen", order: 2, isVisible: true },
    { id: "student-results", kind: "menu", title: "نتائج طلابنا", href: "/student-results", iconKey: "Trophy", order: 3, isVisible: true },
    { id: "instructors", kind: "menu", title: "مدربينا", href: "/instructors", iconKey: "Users", order: 4, isVisible: true },
    { id: "mock-exams", kind: "menu", title: "الامتحانات التجريبية", href: "/mock-exams", iconKey: "Award", order: 5, isVisible: true },
    { id: "contact", kind: "menu", title: "اتصل بنا", href: "/contact", iconKey: "Phone", order: 6, isVisible: true },
    { id: "signs", kind: "menu", title: "الاشارات", href: "/signs", iconKey: "Car", order: 7, isVisible: true },

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
      title: "نتائج طلاب التووريا",
      href: "/student-lookup",
      description: "استعلم عن نتائجك في التووريا",
      order: 3,
      isVisible: true,
    },
    {
      id: "student-lookup-practical",
      kind: "inquiry",
      title: "نتائج طلاب العملي",
      href: "/student-lookup",
      description: "استعلم عن نتائجك في الامتحان العملي",
      order: 4,
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
