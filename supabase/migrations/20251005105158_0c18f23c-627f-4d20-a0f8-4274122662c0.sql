-- Create questions table for exam questions management
CREATE TABLE public.questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_text TEXT NOT NULL,
    option_a TEXT NOT NULL,
    option_b TEXT NOT NULL,
    option_c TEXT NOT NULL,
    option_d TEXT,
    correct_answer CHAR(1) NOT NULL CHECK (correct_answer IN ('A', 'B', 'C', 'D')),
    question_type TEXT DEFAULT 'theory' CHECK (question_type IN ('theory', 'practical')),
    difficulty TEXT DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
    image_url TEXT,
    category TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

-- Questions policies
CREATE POLICY "Anyone can view active questions"
ON public.questions
FOR SELECT
USING (is_active = TRUE OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert questions"
ON public.questions
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update questions"
ON public.questions
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete questions"
ON public.questions
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Create trigger for updated_at
CREATE TRIGGER update_questions_updated_at
BEFORE UPDATE ON public.questions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create pricing table for managing course prices
CREATE TABLE public.pricing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    package_name TEXT NOT NULL,
    package_name_ar TEXT NOT NULL,
    description TEXT,
    description_ar TEXT,
    price DECIMAL(10, 2) NOT NULL,
    currency TEXT DEFAULT 'ILS',
    lessons_count INTEGER,
    duration_hours INTEGER,
    license_type TEXT,
    features JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.pricing ENABLE ROW LEVEL SECURITY;

-- Pricing policies
CREATE POLICY "Anyone can view active pricing"
ON public.pricing
FOR SELECT
USING (is_active = TRUE OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage pricing"
ON public.pricing
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Create trigger for updated_at
CREATE TRIGGER update_pricing_updated_at
BEFORE UPDATE ON public.pricing
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create site_settings table for managing website information
CREATE TABLE public.site_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key TEXT UNIQUE NOT NULL,
    setting_value TEXT,
    setting_type TEXT DEFAULT 'text' CHECK (setting_type IN ('text', 'number', 'email', 'phone', 'url', 'json')),
    description TEXT,
    is_public BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Site settings policies
CREATE POLICY "Anyone can view public settings"
ON public.site_settings
FOR SELECT
USING (is_public = TRUE OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage settings"
ON public.site_settings
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Create trigger for updated_at
CREATE TRIGGER update_site_settings_updated_at
BEFORE UPDATE ON public.site_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create appointments table for student scheduling
CREATE TABLE public.appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
    appointment_type TEXT NOT NULL CHECK (appointment_type IN ('theory_exam', 'practical_exam', 'lesson', 'consultation')),
    appointment_date TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_minutes INTEGER DEFAULT 60,
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no_show')),
    instructor_name TEXT,
    location TEXT,
    notes TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Appointments policies
CREATE POLICY "Students can view their own appointments"
ON public.appointments
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.students
        WHERE students.id = appointments.student_id
        AND students.user_id = auth.uid()
    )
    OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can manage all appointments"
ON public.appointments
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Create trigger for updated_at
CREATE TRIGGER update_appointments_updated_at
BEFORE UPDATE ON public.appointments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create study_materials table
CREATE TABLE public.study_materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    title_ar TEXT NOT NULL,
    description TEXT,
    description_ar TEXT,
    material_type TEXT NOT NULL CHECK (material_type IN ('video', 'pdf', 'zoom', 'article', 'quiz')),
    content_url TEXT,
    zoom_meeting_id TEXT,
    zoom_password TEXT,
    scheduled_date TIMESTAMP WITH TIME ZONE,
    duration_minutes INTEGER,
    thumbnail_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.study_materials ENABLE ROW LEVEL SECURITY;

-- Study materials policies
CREATE POLICY "Authenticated users can view active materials"
ON public.study_materials
FOR SELECT
USING (
    (is_active = TRUE AND auth.uid() IS NOT NULL)
    OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can manage materials"
ON public.study_materials
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Create trigger for updated_at
CREATE TRIGGER update_study_materials_updated_at
BEFORE UPDATE ON public.study_materials
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default site settings
INSERT INTO public.site_settings (setting_key, setting_value, setting_type, description, is_public) VALUES
('site_phone', '050-1234567', 'phone', 'رقم هاتف المدرسة', TRUE),
('site_email', 'info@almadina-academy.com', 'email', 'البريد الإلكتروني', TRUE),
('site_address', 'المدينة، فلسطين', 'text', 'عنوان المدرسة', TRUE),
('whatsapp_number', '972501234567', 'phone', 'رقم واتساب', TRUE),
('facebook_url', 'https://facebook.com/almadina', 'url', 'رابط صفحة فيسبوك', TRUE),
('instagram_url', 'https://instagram.com/almadina', 'url', 'رابط حساب انستغرام', TRUE);