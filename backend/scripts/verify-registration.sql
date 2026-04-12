-- استخدم نفس قاعدة بيانات DATABASE_URL للخادم. استبدل رقم الهوية أو user_id حسب الحاجة.
-- SELECT id, id_number FROM users WHERE id_number = 'YOUR_ID_NUMBER';
-- SELECT user_id, role FROM user_roles WHERE user_id = 'USER_UUID';
-- SELECT id, user_id FROM students WHERE user_id = 'USER_UUID';

-- إن وُجد ملف شخصي ودور user لكن لا يوجد صف في students، تظهر لوحة الطالب لكن لا يظهر في إدارة الطلاب. أصلح بـ:
-- INSERT INTO students (user_id)
-- SELECT ur.user_id FROM user_roles ur
-- WHERE ur.role = 'user'
-- AND NOT EXISTS (SELECT 1 FROM students s WHERE s.user_id = ur.user_id);
