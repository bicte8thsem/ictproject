-- ============================================
-- ACADEMIC MANAGEMENT SYSTEM - DATABASE SCHEMA
-- Enterprise-Grade PostgreSQL Schema
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ENUMS
-- ============================================

-- Program Type ENUM
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'program_type') THEN
        CREATE TYPE program_type AS ENUM ('BCA', 'BICTE');
    END IF;
END
$$;

-- Gender ENUM
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'gender_type') THEN
        CREATE TYPE gender_type AS ENUM ('Male', 'Female', 'Other');
    END IF;
END
$$;

-- Level ENUM
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'level_type') THEN
        CREATE TYPE level_type AS ENUM ('Bachelor', 'Master');
    END IF;
END
$$;

-- ============================================
-- CORE TABLES
-- ============================================

-- 0. PROGRAMS TABLE (Admin-managed list of programs)
CREATE TABLE IF NOT EXISTS programs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_programs_name ON programs(name);

-- Backfill programs table from enum values (safe for fresh + existing databases)
DO $$
BEGIN
    INSERT INTO programs (name)
    SELECT e.enumlabel
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'program_type'
    ON CONFLICT (name) DO NOTHING;
END
$$;

-- 1. STUDENTS TABLE (Main student record)
CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    college_enrollment_no VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    gender gender_type NOT NULL,
    religion VARCHAR(50),
    birthdate DATE NOT NULL,
    faculty VARCHAR(100) DEFAULT 'Computer Science',
    tu_regd_no VARCHAR(50) UNIQUE,
    level level_type DEFAULT 'Bachelor',
    symbol_no VARCHAR(50),
    mobile_no VARCHAR(20),
    email_id VARCHAR(100),
    residential_no VARCHAR(20),
    photo_url TEXT,
    program program_type NOT NULL,
    current_semester INTEGER NOT NULL DEFAULT 1 CHECK (current_semester >= 1 AND current_semester <= 8),
    status VARCHAR(20) DEFAULT 'Active' CHECK (status IN ('Active', 'Graduated', 'Dropped')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure new columns exist in already-created databases
ALTER TABLE students ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- Normalize legacy status values and enforce current allowed values
UPDATE students
SET status = 'Dropped'
WHERE status = 'Inactive';

ALTER TABLE students DROP CONSTRAINT IF EXISTS students_status_check;
ALTER TABLE students
    ADD CONSTRAINT students_status_check
    CHECK (status IN ('Active', 'Graduated', 'Dropped'));

CREATE INDEX IF NOT EXISTS idx_students_program ON students(program);
CREATE INDEX IF NOT EXISTS idx_students_current_semester ON students(current_semester);
CREATE INDEX IF NOT EXISTS idx_students_enrollment_no ON students(college_enrollment_no);
CREATE INDEX IF NOT EXISTS idx_students_name ON students(name);

-- 2. STUDENT ADDRESSES TABLE
CREATE TABLE IF NOT EXISTS student_addresses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    local_address TEXT NOT NULL,
    district VARCHAR(100),
    state VARCHAR(100),
    permanent_address TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_addresses_student_id ON student_addresses(student_id);

-- 3. PARENT DETAILS TABLE
CREATE TABLE IF NOT EXISTS parent_details (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    -- Father Details
    father_name VARCHAR(100) NOT NULL,
    father_occupation VARCHAR(100),
    father_mobile_no VARCHAR(20),
    -- Mother Details
    mother_name VARCHAR(100) NOT NULL,
    mother_occupation VARCHAR(100),
    mother_mobile_no VARCHAR(20),
    -- Local Guardian Details
    guardian_name VARCHAR(100),
    guardian_occupation VARCHAR(100),
    guardian_mobile_no VARCHAR(20),
    guardian_relation VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_parents_student_id ON parent_details(student_id);

-- 4. ACADEMIC HISTORY TABLE
CREATE TABLE IF NOT EXISTS academic_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    -- SLC/SEE Details
    slc_institution VARCHAR(200),
    slc_passed_year INTEGER CHECK (slc_passed_year >= 1990 AND slc_passed_year <= 2100),
    slc_symbol_no VARCHAR(50),
    slc_gpa DECIMAL(3,2) CHECK (slc_gpa >= 0 AND slc_gpa <= 4.0),
    -- Higher Secondary (+2) Details
    hs_institution VARCHAR(200),
    hs_passed_year INTEGER CHECK (hs_passed_year >= 1990 AND hs_passed_year <= 2100),
    hs_symbol_no VARCHAR(50),
    hs_gpa DECIMAL(3,2) CHECK (hs_gpa >= 0 AND hs_gpa <= 4.0),
    -- Major Subject
    major_subject VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_academic_history_student_id ON academic_history(student_id);

-- ============================================
-- SEMESTER & SUBJECT TABLES
-- ============================================

-- 5. SUBJECTS TABLE (Predefined subjects for each program and semester)
CREATE TABLE IF NOT EXISTS subjects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(20) NOT NULL,
    name VARCHAR(200) NOT NULL,
    subject_team VARCHAR(150),
    program program_type NOT NULL,
    semester INTEGER NOT NULL CHECK (semester >= 1 AND semester <= 8),
    credit_hours INTEGER DEFAULT 3,
    is_elective BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(code, program, semester)
);

ALTER TABLE subjects ADD COLUMN IF NOT EXISTS subject_team VARCHAR(150);

CREATE INDEX IF NOT EXISTS idx_subjects_program_semester ON subjects(program, semester);
CREATE INDEX IF NOT EXISTS idx_subjects_code ON subjects(code);

-- 6. STUDENT SEMESTERS TABLE (Tracks which semesters a student is enrolled in)
CREATE TABLE IF NOT EXISTS student_semesters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    semester INTEGER NOT NULL CHECK (semester >= 1 AND semester <= 8),
    status VARCHAR(20) DEFAULT 'Ongoing' CHECK (status IN ('Ongoing', 'Completed', 'Dropped')),
    enrolled_date DATE DEFAULT CURRENT_DATE,
    completed_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, semester)
);

CREATE INDEX IF NOT EXISTS idx_student_semesters_student_id ON student_semesters(student_id);
CREATE INDEX IF NOT EXISTS idx_student_semesters_semester ON student_semesters(semester);

-- ============================================
-- ACADEMIC RECORDS TABLES
-- ============================================

-- 7. ASSIGNMENT RECORDS TABLE
CREATE TABLE IF NOT EXISTS assignment_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    semester INTEGER NOT NULL CHECK (semester >= 1 AND semester <= 8),
    assignment_number INTEGER NOT NULL CHECK (assignment_number IN (1, 2)),
    due_date DATE,
    submitted_date DATE,
    evaluation DECIMAL(5,2) CHECK (evaluation >= 0 AND evaluation <= 100),
    signature VARCHAR(100),
    remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, subject_id, semester, assignment_number)
);

CREATE INDEX IF NOT EXISTS idx_assignment_records_student_id ON assignment_records(student_id);
CREATE INDEX IF NOT EXISTS idx_assignment_records_subject_id ON assignment_records(subject_id);
CREATE INDEX IF NOT EXISTS idx_assignment_records_semester ON assignment_records(semester);

-- 8. PRESENTATION RECORDS TABLE
CREATE TABLE IF NOT EXISTS presentation_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    semester INTEGER NOT NULL CHECK (semester >= 1 AND semester <= 8),
    topic VARCHAR(300),
    presented_date DATE,
    evaluation DECIMAL(5,2) CHECK (evaluation >= 0 AND evaluation <= 100),
    signature VARCHAR(100),
    remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, subject_id, semester)
);

CREATE INDEX IF NOT EXISTS idx_presentation_records_student_id ON presentation_records(student_id);
CREATE INDEX IF NOT EXISTS idx_presentation_records_subject_id ON presentation_records(subject_id);
CREATE INDEX IF NOT EXISTS idx_presentation_records_semester ON presentation_records(semester);

-- 9. EXAM RECORDS TABLE (Mid-Session and PreBoard)
CREATE TABLE IF NOT EXISTS exam_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    semester INTEGER NOT NULL CHECK (semester >= 1 AND semester <= 8),
    exam_type VARCHAR(20) NOT NULL CHECK (exam_type IN ('Mid-Session', 'PreBoard')),
    exam_date DATE,
    internal_marks DECIMAL(5,2) CHECK (internal_marks >= 0 AND internal_marks <= 100),
    practical_marks DECIMAL(5,2) CHECK (practical_marks >= 0 AND practical_marks >= 0),
    viva_marks DECIMAL(5,2) CHECK (viva_marks >= 0),
    signature VARCHAR(100),
    remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, subject_id, semester, exam_type)
);

CREATE INDEX IF NOT EXISTS idx_exam_records_student_id ON exam_records(student_id);
CREATE INDEX IF NOT EXISTS idx_exam_records_subject_id ON exam_records(subject_id);
CREATE INDEX IF NOT EXISTS idx_exam_records_semester ON exam_records(semester);
CREATE INDEX IF NOT EXISTS idx_exam_records_type ON exam_records(exam_type);

-- Keep enum and programs table in sync by allowing admins to add enum values from app.
CREATE OR REPLACE FUNCTION add_program_type(p_program_name TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_program_name TEXT;
BEGIN
    v_program_name := UPPER(TRIM(p_program_name));

    IF v_program_name IS NULL OR v_program_name = '' THEN
        RAISE EXCEPTION 'Program name is required';
    END IF;

    -- Add enum value only if it does not exist already.
    IF NOT EXISTS (
        SELECT 1
        FROM pg_enum e
        JOIN pg_type t ON t.oid = e.enumtypid
        WHERE t.typname = 'program_type'
          AND e.enumlabel = v_program_name
    ) THEN
        EXECUTE format('ALTER TYPE program_type ADD VALUE %L', v_program_name);
    END IF;

    INSERT INTO programs (name)
    VALUES (v_program_name)
    ON CONFLICT (name) DO NOTHING;

    RETURN v_program_name;
END;
$$;

CREATE OR REPLACE FUNCTION delete_program_type(p_program_name TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_program_name TEXT;
BEGIN
    v_program_name := UPPER(TRIM(p_program_name));

    IF v_program_name IS NULL OR v_program_name = '' THEN
        RAISE EXCEPTION 'Program name is required';
    END IF;

    IF EXISTS (SELECT 1 FROM subjects WHERE program::TEXT = v_program_name) THEN
        RAISE EXCEPTION 'Cannot delete program. Remove related subjects first.';
    END IF;

    IF EXISTS (SELECT 1 FROM students WHERE program::TEXT = v_program_name) THEN
        RAISE EXCEPTION 'Cannot delete program. Students are still assigned to this program.';
    END IF;

    DELETE FROM programs WHERE name = v_program_name;

    RETURN TRUE;
END;
$$;

-- ============================================
-- STORAGE SETUP (SUPABASE)
-- ============================================

-- Create student photo bucket if storage schema exists (Supabase)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'storage' AND table_name = 'buckets'
    ) THEN
        INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
        VALUES (
            'student-photos',
            'student-photos',
            true,
            2097152,
            ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
        )
        ON CONFLICT (id) DO UPDATE
        SET
            public = EXCLUDED.public,
            file_size_limit = EXCLUDED.file_size_limit,
            allowed_mime_types = EXCLUDED.allowed_mime_types;
    END IF;
END
$$;

-- Storage policies for student photo bucket
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'storage' AND table_name = 'objects'
    ) THEN
        DROP POLICY IF EXISTS student_photos_public_read ON storage.objects;
        CREATE POLICY student_photos_public_read ON storage.objects
            FOR SELECT TO public
            USING (bucket_id = 'student-photos');

        DROP POLICY IF EXISTS student_photos_authenticated_insert ON storage.objects;
        CREATE POLICY student_photos_authenticated_insert ON storage.objects
            FOR INSERT TO authenticated
            WITH CHECK (bucket_id = 'student-photos');

        DROP POLICY IF EXISTS student_photos_authenticated_update ON storage.objects;
        CREATE POLICY student_photos_authenticated_update ON storage.objects
            FOR UPDATE TO authenticated
            USING (bucket_id = 'student-photos')
            WITH CHECK (bucket_id = 'student-photos');

        DROP POLICY IF EXISTS student_photos_authenticated_delete ON storage.objects;
        CREATE POLICY student_photos_authenticated_delete ON storage.objects
            FOR DELETE TO authenticated
            USING (bucket_id = 'student-photos');
    END IF;
END
$$;

INSERT INTO programs (name) VALUES ('BCA') ON CONFLICT (name) DO NOTHING;
INSERT INTO programs (name) VALUES ('BICTE') ON CONFLICT (name) DO NOTHING;

-- ============================================
-- SEED DATA - BICTE SUBJECTS
-- ============================================

-- BICTE 1st Semester
INSERT INTO subjects (code, name, program, semester) VALUES
('Ed. 411', 'Fundamental of Education', 'BICTE', 1),
('ICT Ed. 415', 'Introduction to Information Technology', 'BICTE', 1),
('ICT Ed. 416', 'Programming Concept with C', 'BICTE', 1),
('Eng. Ed. 411', 'English Language-I', 'BICTE', 1),
('ने. शि. ४११', 'साधारण नेपाली-१', 'BICTE', 1),
('Math Ed. 416', 'Mathematics-I', 'BICTE', 1)
ON CONFLICT (code, program, semester) DO NOTHING;

-- BICTE 2nd Semester
INSERT INTO subjects (code, name, program, semester) VALUES
('Ed. 422', 'Developmental Psychology', 'BICTE', 2),
('ICT Ed. 425', 'Digital Logics', 'BICTE', 2),
('ICT Ed. 426', 'Object Oriented Programming with C++', 'BICTE', 2),
('Eng. Ed. 421', 'English Language-II', 'BICTE', 2),
('ने. शि. ४२१', 'साधारण नेपाली-२', 'BICTE', 2),
('Math Ed. 426', 'Mathematics-II', 'BICTE', 2)
ON CONFLICT (code, program, semester) DO NOTHING;

-- BICTE 3rd Semester
INSERT INTO subjects (code, name, program, semester) VALUES
('Ed. 432', 'Learning Psychology', 'BICTE', 3),
('ICT Ed. 438', '21st Century Skills', 'BICTE', 3),
('ICT Ed. 439', 'Computer Architecture and Organization', 'BICTE', 3),
('ICT Ed. 435', 'Data Structure and Algorithm', 'BICTE', 3),
('ICT Ed. 437', 'Web Technology', 'BICTE', 3),
('Math Ed. 436', 'Probability and Statistics', 'BICTE', 3)
ON CONFLICT (code, program, semester) DO NOTHING;

-- BICTE 4th Semester
INSERT INTO subjects (code, name, program, semester) VALUES
('Ed. 442', 'Fundamentals of Curriculum', 'BICTE', 4),
('ICT Ed. 444', 'Educational Leadership in Digital Era', 'BICTE', 4),
('ICT Ed. 447', 'System Analysis and Design', 'BICTE', 4),
('ICT Ed. 445', 'Operating System', 'BICTE', 4),
('ICT Ed. 446', 'Database Management System', 'BICTE', 4),
('Math Ed. 442', 'Numerical Analysis', 'BICTE', 4)
ON CONFLICT (code, program, semester) DO NOTHING;

-- BICTE 5th Semester
INSERT INTO subjects (code, name, program, semester) VALUES
('Ed. 452', 'Assessment and Evaluation', 'BICTE', 5),
('ICT Ed. 455', 'Java Programming', 'BICTE', 5),
('ICT Ed. 456', 'Data Communication and Network', 'BICTE', 5),
('ICT Ed. 457', 'Software Engineering and Project Management', 'BICTE', 5),
('Math Ed. 452', 'Discrete Math', 'BICTE', 5)
ON CONFLICT (code, program, semester) DO NOTHING;

-- BICTE 6th Semester
INSERT INTO subjects (code, name, program, semester) VALUES
('Ed. 462', 'Research Methods in Education', 'BICTE', 6),
('ICT Ed. 465', 'Visual Programming with C#', 'BICTE', 6),
('ICT Ed. 466', 'Computer Graphics', 'BICTE', 6),
('ICT Ed. 467', 'Digital Pedagogy and LMS', 'BICTE', 6),
('ICT Ed. 468', 'Network and Information Security', 'BICTE', 6)
ON CONFLICT (code, program, semester) DO NOTHING;

-- BICTE 7th Semester
INSERT INTO subjects (code, name, program, semester) VALUES
('Ed. 472', 'Research Project', 'BICTE', 7),
('ICT Ed. 477', 'Python Programming', 'BICTE', 7),
('ICT Ed. 478', 'Teaching Method in ICT', 'BICTE', 7),
('ICT Ed. 473', 'Geographical Information System (GIS)', 'BICTE', 7),
('ICT Ed. 474', 'Multimedia', 'BICTE', 7),
('ICT Ed. 479', 'Capstone Project', 'BICTE', 7)
ON CONFLICT (code, program, semester) DO NOTHING;

-- BICTE 8th Semester
INSERT INTO subjects (code, name, program, semester) VALUES
('ICT. Ed 482', 'Artificial Intelligence in Education', 'BICTE', 8),
('ICT. Ed. 486', 'System Administration using Linux', 'BICTE', 8),
('Ed 481', 'Classroom Pedagogy', 'BICTE', 8),
('ICT. Ed 484', 'Big Data and Data Analysis', 'BICTE', 8),
('ICT. Ed 483', 'Cloud Computing', 'BICTE', 8),
('ICT Ed 487', 'Teaching Practicum in ICT in Education', 'BICTE', 8)
ON CONFLICT (code, program, semester) DO NOTHING;

-- ============================================
-- SEED DATA - BCA SUBJECTS
-- ============================================

-- BCA 1st Semester
INSERT INTO subjects (code, name, program, semester) VALUES
('BCA101', 'Computer Fundamentals & Applications', 'BCA', 1),
('BCA102', 'Society and Technology', 'BCA', 1),
('BCA103', 'English I', 'BCA', 1),
('BCA104', 'Mathematics I', 'BCA', 1),
('BCA105', 'Digital Logic', 'BCA', 1)
ON CONFLICT (code, program, semester) DO NOTHING;

-- BCA 2nd Semester
INSERT INTO subjects (code, name, program, semester) VALUES
('BCA201', 'C Programming', 'BCA', 2),
('BCA202', 'Financial Accounting', 'BCA', 2),
('BCA203', 'English II', 'BCA', 2),
('BCA204', 'Mathematics II', 'BCA', 2),
('BCA205', 'Microprocessor and Computer Architecture', 'BCA', 2)
ON CONFLICT (code, program, semester) DO NOTHING;

-- BCA 3rd Semester
INSERT INTO subjects (code, name, program, semester) VALUES
('BCA301', 'Data Structures and Algorithms', 'BCA', 3),
('BCA302', 'Numerical Methods', 'BCA', 3),
('BCA303', 'Computer Graphics', 'BCA', 3),
('BCA304', 'Computer Organization', 'BCA', 3),
('BCA305', 'Statistics', 'BCA', 3)
ON CONFLICT (code, program, semester) DO NOTHING;

-- BCA 4th Semester
INSERT INTO subjects (code, name, program, semester) VALUES
('BCA401', 'Object Oriented Programming (Java)', 'BCA', 4),
('BCA402', 'Operating System', 'BCA', 4),
('BCA403', 'Database Management System', 'BCA', 4),
('BCA404', 'Software Engineering', 'BCA', 4),
('BCA405', 'Project I', 'BCA', 4)
ON CONFLICT (code, program, semester) DO NOTHING;

-- BCA 5th Semester
INSERT INTO subjects (code, name, program, semester) VALUES
('BCA501', 'Web Technology', 'BCA', 5),
('BCA502', 'System Analysis and Design', 'BCA', 5),
('BCA503', 'Java Programming', 'BCA', 5),
('BCA504', 'Computer Networks', 'BCA', 5),
('BCA505', 'Elective I', 'BCA', 5)
ON CONFLICT (code, program, semester) DO NOTHING;

-- BCA 6th Semester
INSERT INTO subjects (code, name, program, semester) VALUES
('BCA601', '.NET Technology', 'BCA', 6),
('BCA602', 'Applied Economics', 'BCA', 6),
('BCA603', 'Advanced Java Programming', 'BCA', 6),
('BCA604', 'Network Programming', 'BCA', 6),
('BCA605', 'Elective II', 'BCA', 6)
ON CONFLICT (code, program, semester) DO NOTHING;

-- BCA 7th Semester
INSERT INTO subjects (code, name, program, semester) VALUES
('BCA701', 'Cyber Law and Professional Ethics', 'BCA', 7),
('BCA702', 'Cloud Computing', 'BCA', 7),
('BCA703', 'Artificial Intelligence', 'BCA', 7),
('BCA704', 'Internship', 'BCA', 7)
ON CONFLICT (code, program, semester) DO NOTHING;

-- BCA 8th Semester
INSERT INTO subjects (code, name, program, semester) VALUES
('BCA801', 'Operation Research', 'BCA', 8),
('BCA802', 'Project II (Final Year Project)', 'BCA', 8),
('BCA803', 'Elective III', 'BCA', 8),
('BCA804', 'Elective IV', 'BCA', 8)
ON CONFLICT (code, program, semester) DO NOTHING;

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create update triggers for all tables
DROP TRIGGER IF EXISTS update_students_updated_at ON students;
CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_student_addresses_updated_at ON student_addresses;
CREATE TRIGGER update_student_addresses_updated_at BEFORE UPDATE ON student_addresses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_parent_details_updated_at ON parent_details;
CREATE TRIGGER update_parent_details_updated_at BEFORE UPDATE ON parent_details
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_academic_history_updated_at ON academic_history;
CREATE TRIGGER update_academic_history_updated_at BEFORE UPDATE ON academic_history
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_student_semesters_updated_at ON student_semesters;
CREATE TRIGGER update_student_semesters_updated_at BEFORE UPDATE ON student_semesters
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_assignment_records_updated_at ON assignment_records;
CREATE TRIGGER update_assignment_records_updated_at BEFORE UPDATE ON assignment_records
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_presentation_records_updated_at ON presentation_records;
CREATE TRIGGER update_presentation_records_updated_at BEFORE UPDATE ON presentation_records
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_exam_records_updated_at ON exam_records;
CREATE TRIGGER update_exam_records_updated_at BEFORE UPDATE ON exam_records
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE academic_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_semesters ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE presentation_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_records ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users (admin access)
DROP POLICY IF EXISTS admin_all_access ON students;
CREATE POLICY admin_all_access ON students
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS admin_all_access ON student_addresses;
CREATE POLICY admin_all_access ON student_addresses
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS admin_all_access ON parent_details;
CREATE POLICY admin_all_access ON parent_details
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS admin_all_access ON academic_history;
CREATE POLICY admin_all_access ON academic_history
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS admin_all_access ON programs;
CREATE POLICY admin_all_access ON programs
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS admin_all_access ON subjects;
CREATE POLICY admin_all_access ON subjects
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS admin_all_access ON student_semesters;
CREATE POLICY admin_all_access ON student_semesters
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS admin_all_access ON assignment_records;
CREATE POLICY admin_all_access ON assignment_records
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS admin_all_access ON presentation_records;
CREATE POLICY admin_all_access ON presentation_records
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS admin_all_access ON exam_records;
CREATE POLICY admin_all_access ON exam_records
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

-- Allow anonymous read access to subjects (for public reference)
DROP POLICY IF EXISTS anonymous_read_subjects ON subjects;
CREATE POLICY anonymous_read_subjects ON subjects
    FOR SELECT TO anon
    USING (true);

DROP POLICY IF EXISTS anonymous_read_programs ON programs;
CREATE POLICY anonymous_read_programs ON programs
    FOR SELECT TO anon
    USING (true);

GRANT EXECUTE ON FUNCTION add_program_type(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION delete_program_type(TEXT) TO authenticated;

-- ============================================
-- VIEWS FOR REPORTING
-- ============================================

-- Student summary view
CREATE OR REPLACE VIEW student_summary AS
SELECT 
    s.id,
    s.college_enrollment_no,
    s.name,
    s.gender,
    s.program,
    s.current_semester,
    s.status,
    s.mobile_no,
    s.email_id,
    sa.district,
    sa.state,
    pd.father_name,
    pd.mother_name,
    s.photo_url
FROM students s
LEFT JOIN student_addresses sa ON s.id = sa.student_id
LEFT JOIN parent_details pd ON s.id = pd.student_id;

-- Dashboard statistics view
CREATE OR REPLACE VIEW dashboard_stats AS
SELECT 
    (SELECT COUNT(*) FROM students WHERE status = 'Active') as total_students,
    (SELECT COUNT(*) FROM students WHERE program = 'BCA' AND status = 'Active') as total_bca_students,
    (SELECT COUNT(*) FROM students WHERE program = 'BICTE' AND status = 'Active') as total_bicte_students,
    (SELECT COUNT(*) FROM students WHERE current_semester = 1 AND status = 'Active') as semester_1_students,
    (SELECT COUNT(*) FROM students WHERE current_semester = 2 AND status = 'Active') as semester_2_students,
    (SELECT COUNT(*) FROM students WHERE current_semester = 3 AND status = 'Active') as semester_3_students,
    (SELECT COUNT(*) FROM students WHERE current_semester = 4 AND status = 'Active') as semester_4_students,
    (SELECT COUNT(*) FROM students WHERE current_semester = 5 AND status = 'Active') as semester_5_students,
    (SELECT COUNT(*) FROM students WHERE current_semester = 6 AND status = 'Active') as semester_6_students,
    (SELECT COUNT(*) FROM students WHERE current_semester = 7 AND status = 'Active') as semester_7_students,
    (SELECT COUNT(*) FROM students WHERE current_semester = 8 AND status = 'Active') as semester_8_students;

-- ============================================
-- STORED PROCEDURES
-- ============================================

-- Save complete student payload atomically (insert/update + related tables)
CREATE OR REPLACE FUNCTION save_complete_student(
    p_payload JSONB,
    p_student_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_student_payload JSONB := COALESCE(p_payload->'student', '{}'::JSONB);
    v_address_payload JSONB := p_payload->'address';
    v_parents_payload JSONB := p_payload->'parents';
    v_academic_payload JSONB := p_payload->'academic_history';
    v_student_id UUID := p_student_id;
    v_address_id UUID;
    v_parents_id UUID;
    v_academic_id UUID;
    v_is_new BOOLEAN := p_student_id IS NULL;
    v_current_semester INTEGER;
BEGIN
    IF v_student_payload = '{}'::JSONB THEN
        RAISE EXCEPTION 'student payload is required';
    END IF;

    IF v_is_new THEN
        INSERT INTO students (
            college_enrollment_no,
            name,
            gender,
            religion,
            birthdate,
            faculty,
            tu_regd_no,
            level,
            symbol_no,
            mobile_no,
            email_id,
            residential_no,
            photo_url,
            program,
            current_semester,
            status
        ) VALUES (
            v_student_payload->>'college_enrollment_no',
            v_student_payload->>'name',
            (v_student_payload->>'gender')::gender_type,
            NULLIF(v_student_payload->>'religion', ''),
            (v_student_payload->>'birthdate')::DATE,
            COALESCE(NULLIF(v_student_payload->>'faculty', ''), 'Computer Science'),
            NULLIF(v_student_payload->>'tu_regd_no', ''),
            COALESCE((NULLIF(v_student_payload->>'level', ''))::level_type, 'Bachelor'::level_type),
            NULLIF(v_student_payload->>'symbol_no', ''),
            NULLIF(v_student_payload->>'mobile_no', ''),
            NULLIF(v_student_payload->>'email_id', ''),
            NULLIF(v_student_payload->>'residential_no', ''),
            NULLIF(v_student_payload->>'photo_url', ''),
            (v_student_payload->>'program')::program_type,
            COALESCE((NULLIF(v_student_payload->>'current_semester', ''))::INTEGER, 1),
            COALESCE(NULLIF(v_student_payload->>'status', ''), 'Active')
        )
        RETURNING id, current_semester INTO v_student_id, v_current_semester;
    ELSE
        UPDATE students
        SET
            college_enrollment_no = v_student_payload->>'college_enrollment_no',
            name = v_student_payload->>'name',
            gender = (v_student_payload->>'gender')::gender_type,
            religion = NULLIF(v_student_payload->>'religion', ''),
            birthdate = (v_student_payload->>'birthdate')::DATE,
            faculty = COALESCE(NULLIF(v_student_payload->>'faculty', ''), 'Computer Science'),
            tu_regd_no = NULLIF(v_student_payload->>'tu_regd_no', ''),
            level = COALESCE((NULLIF(v_student_payload->>'level', ''))::level_type, 'Bachelor'::level_type),
            symbol_no = NULLIF(v_student_payload->>'symbol_no', ''),
            mobile_no = NULLIF(v_student_payload->>'mobile_no', ''),
            email_id = NULLIF(v_student_payload->>'email_id', ''),
            residential_no = NULLIF(v_student_payload->>'residential_no', ''),
            photo_url = NULLIF(v_student_payload->>'photo_url', ''),
            program = (v_student_payload->>'program')::program_type,
            current_semester = COALESCE((NULLIF(v_student_payload->>'current_semester', ''))::INTEGER, 1),
            status = COALESCE(NULLIF(v_student_payload->>'status', ''), 'Active'),
            updated_at = NOW()
        WHERE id = v_student_id
        RETURNING current_semester INTO v_current_semester;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'student not found for id %', v_student_id;
        END IF;
    END IF;

    IF v_address_payload IS NOT NULL AND v_address_payload <> 'null'::JSONB THEN
        SELECT id INTO v_address_id
        FROM student_addresses
        WHERE student_id = v_student_id
        ORDER BY created_at DESC
        LIMIT 1;

        IF v_address_id IS NULL THEN
            INSERT INTO student_addresses (
                student_id,
                local_address,
                district,
                state,
                permanent_address
            ) VALUES (
                v_student_id,
                COALESCE(v_address_payload->>'local_address', ''),
                NULLIF(v_address_payload->>'district', ''),
                NULLIF(v_address_payload->>'state', ''),
                COALESCE(v_address_payload->>'permanent_address', '')
            );
        ELSE
            UPDATE student_addresses
            SET
                local_address = COALESCE(v_address_payload->>'local_address', ''),
                district = NULLIF(v_address_payload->>'district', ''),
                state = NULLIF(v_address_payload->>'state', ''),
                permanent_address = COALESCE(v_address_payload->>'permanent_address', ''),
                updated_at = NOW()
            WHERE id = v_address_id;
        END IF;
    END IF;

    IF v_parents_payload IS NOT NULL AND v_parents_payload <> 'null'::JSONB THEN
        SELECT id INTO v_parents_id
        FROM parent_details
        WHERE student_id = v_student_id
        ORDER BY created_at DESC
        LIMIT 1;

        IF v_parents_id IS NULL THEN
            INSERT INTO parent_details (
                student_id,
                father_name,
                father_occupation,
                father_mobile_no,
                mother_name,
                mother_occupation,
                mother_mobile_no,
                guardian_name,
                guardian_occupation,
                guardian_mobile_no,
                guardian_relation
            ) VALUES (
                v_student_id,
                COALESCE(v_parents_payload->>'father_name', ''),
                NULLIF(v_parents_payload->>'father_occupation', ''),
                NULLIF(v_parents_payload->>'father_mobile_no', ''),
                COALESCE(v_parents_payload->>'mother_name', ''),
                NULLIF(v_parents_payload->>'mother_occupation', ''),
                NULLIF(v_parents_payload->>'mother_mobile_no', ''),
                NULLIF(v_parents_payload->>'guardian_name', ''),
                NULLIF(v_parents_payload->>'guardian_occupation', ''),
                NULLIF(v_parents_payload->>'guardian_mobile_no', ''),
                NULLIF(v_parents_payload->>'guardian_relation', '')
            );
        ELSE
            UPDATE parent_details
            SET
                father_name = COALESCE(v_parents_payload->>'father_name', ''),
                father_occupation = NULLIF(v_parents_payload->>'father_occupation', ''),
                father_mobile_no = NULLIF(v_parents_payload->>'father_mobile_no', ''),
                mother_name = COALESCE(v_parents_payload->>'mother_name', ''),
                mother_occupation = NULLIF(v_parents_payload->>'mother_occupation', ''),
                mother_mobile_no = NULLIF(v_parents_payload->>'mother_mobile_no', ''),
                guardian_name = NULLIF(v_parents_payload->>'guardian_name', ''),
                guardian_occupation = NULLIF(v_parents_payload->>'guardian_occupation', ''),
                guardian_mobile_no = NULLIF(v_parents_payload->>'guardian_mobile_no', ''),
                guardian_relation = NULLIF(v_parents_payload->>'guardian_relation', ''),
                updated_at = NOW()
            WHERE id = v_parents_id;
        END IF;
    END IF;

    IF v_academic_payload IS NOT NULL AND v_academic_payload <> 'null'::JSONB THEN
        SELECT id INTO v_academic_id
        FROM academic_history
        WHERE student_id = v_student_id
        ORDER BY created_at DESC
        LIMIT 1;

        IF v_academic_id IS NULL THEN
            INSERT INTO academic_history (
                student_id,
                slc_institution,
                slc_passed_year,
                slc_symbol_no,
                slc_gpa,
                hs_institution,
                hs_passed_year,
                hs_symbol_no,
                hs_gpa,
                major_subject
            ) VALUES (
                v_student_id,
                NULLIF(v_academic_payload->>'slc_institution', ''),
                (NULLIF(v_academic_payload->>'slc_passed_year', ''))::INTEGER,
                NULLIF(v_academic_payload->>'slc_symbol_no', ''),
                (NULLIF(v_academic_payload->>'slc_gpa', ''))::DECIMAL,
                NULLIF(v_academic_payload->>'hs_institution', ''),
                (NULLIF(v_academic_payload->>'hs_passed_year', ''))::INTEGER,
                NULLIF(v_academic_payload->>'hs_symbol_no', ''),
                (NULLIF(v_academic_payload->>'hs_gpa', ''))::DECIMAL,
                NULLIF(v_academic_payload->>'major_subject', '')
            );
        ELSE
            UPDATE academic_history
            SET
                slc_institution = NULLIF(v_academic_payload->>'slc_institution', ''),
                slc_passed_year = (NULLIF(v_academic_payload->>'slc_passed_year', ''))::INTEGER,
                slc_symbol_no = NULLIF(v_academic_payload->>'slc_symbol_no', ''),
                slc_gpa = (NULLIF(v_academic_payload->>'slc_gpa', ''))::DECIMAL,
                hs_institution = NULLIF(v_academic_payload->>'hs_institution', ''),
                hs_passed_year = (NULLIF(v_academic_payload->>'hs_passed_year', ''))::INTEGER,
                hs_symbol_no = NULLIF(v_academic_payload->>'hs_symbol_no', ''),
                hs_gpa = (NULLIF(v_academic_payload->>'hs_gpa', ''))::DECIMAL,
                major_subject = NULLIF(v_academic_payload->>'major_subject', ''),
                updated_at = NOW()
            WHERE id = v_academic_id;
        END IF;
    END IF;

    IF v_is_new THEN
        INSERT INTO student_semesters (
            student_id,
            semester,
            status,
            enrolled_date
        ) VALUES (
            v_student_id,
            COALESCE(v_current_semester, 1),
            'Ongoing',
            CURRENT_DATE
        )
        ON CONFLICT (student_id, semester) DO NOTHING;
    END IF;

    RETURN jsonb_build_object(
        'student_id', v_student_id,
        'is_new', v_is_new
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Promote student to next semester
CREATE OR REPLACE FUNCTION promote_student(p_student_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_current_semester INTEGER;
    v_new_semester INTEGER;
BEGIN
    -- Get current semester
    SELECT current_semester INTO v_current_semester
    FROM students WHERE id = p_student_id;
    
    IF v_current_semester IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Student not found');
    END IF;
    
    IF v_current_semester >= 8 THEN
        RETURN jsonb_build_object('success', false, 'message', 'Student is already in final semester');
    END IF;
    
    v_new_semester := v_current_semester + 1;
    
    -- Update student current semester
    UPDATE students 
    SET current_semester = v_new_semester,
        updated_at = NOW()
    WHERE id = p_student_id;
    
    -- Mark previous semester as completed
    UPDATE student_semesters
    SET status = 'Completed',
        completed_date = CURRENT_DATE,
        updated_at = NOW()
    WHERE student_id = p_student_id AND semester = v_current_semester;
    
    -- Insert new semester record
    INSERT INTO student_semesters (student_id, semester, status, enrolled_date)
    VALUES (p_student_id, v_new_semester, 'Ongoing', CURRENT_DATE)
    ON CONFLICT (student_id, semester) DO NOTHING;
    
    RETURN jsonb_build_object(
        'success', true, 
        'message', 'Student promoted successfully',
        'previous_semester', v_current_semester,
        'new_semester', v_new_semester
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get student complete profile
CREATE OR REPLACE FUNCTION get_student_profile(p_student_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'student', row_to_json(s),
        'address', row_to_json(sa),
        'parents', row_to_json(pd),
        'academic_history', row_to_json(ah),
        'semesters', (
            SELECT jsonb_agg(row_to_json(ss))
            FROM student_semesters ss
            WHERE ss.student_id = s.id
        )
    ) INTO v_result
    FROM students s
    LEFT JOIN student_addresses sa ON s.id = sa.student_id
    LEFT JOIN parent_details pd ON s.id = pd.student_id
    LEFT JOIN academic_history ah ON s.id = ah.student_id
    WHERE s.id = p_student_id;
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get semester academic records
CREATE OR REPLACE FUNCTION get_semester_records(p_student_id UUID, p_semester INTEGER)
RETURNS JSONB AS $$
DECLARE
    v_result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'assignments', (
            SELECT jsonb_agg(jsonb_build_object(
                'id', ar.id,
                'subject', row_to_json(sub),
                'assignment_number', ar.assignment_number,
                'due_date', ar.due_date,
                'submitted_date', ar.submitted_date,
                'evaluation', ar.evaluation,
                'signature', ar.signature,
                'remarks', ar.remarks
            ))
            FROM assignment_records ar
            JOIN subjects sub ON ar.subject_id = sub.id
            WHERE ar.student_id = p_student_id AND ar.semester = p_semester
        ),
        'presentations', (
            SELECT jsonb_agg(jsonb_build_object(
                'id', pr.id,
                'subject', row_to_json(sub),
                'topic', pr.topic,
                'presented_date', pr.presented_date,
                'evaluation', pr.evaluation,
                'signature', pr.signature,
                'remarks', pr.remarks
            ))
            FROM presentation_records pr
            JOIN subjects sub ON pr.subject_id = sub.id
            WHERE pr.student_id = p_student_id AND pr.semester = p_semester
        ),
        'exams', (
            SELECT jsonb_agg(jsonb_build_object(
                'id', er.id,
                'subject', row_to_json(sub),
                'exam_type', er.exam_type,
                'exam_date', er.exam_date,
                'internal_marks', er.internal_marks,
                'practical_marks', er.practical_marks,
                'viva_marks', er.viva_marks,
                'signature', er.signature,
                'remarks', er.remarks
            ))
            FROM exam_records er
            JOIN subjects sub ON er.subject_id = sub.id
            WHERE er.student_id = p_student_id AND er.semester = p_semester
        )
    ) INTO v_result;
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
