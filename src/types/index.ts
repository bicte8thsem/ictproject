// ============================================
// ACADEMIC MANAGEMENT SYSTEM - TYPE DEFINITIONS
// ============================================

// Enums
export type ProgramType = string;
export type GenderType = 'Male' | 'Female' | 'Other';
export type LevelType = 'Bachelor' | 'Master';
export type StudentStatus = 'Active' | 'Inactive' | 'Graduated' | 'Dropped';
export type SemesterStatus = 'Ongoing' | 'Completed' | 'Dropped';
export type ExamType = 'Mid-Session' | 'PreBoard';

// ============================================
// STUDENT TYPES
// ============================================

export interface Student {
  id: string;
  college_enrollment_no: string;
  name: string;
  gender: GenderType;
  religion?: string;
  birthdate: string;
  faculty?: string;
  tu_regd_no?: string;
  level?: LevelType;
  symbol_no?: string;
  mobile_no?: string;
  email_id?: string;
  residential_no?: string;
  photo_url?: string;
  program: ProgramType;
  current_semester: number;
  status: StudentStatus;
  created_at?: string;
  updated_at?: string;
}

export interface StudentAddress {
  id: string;
  student_id: string;
  local_address: string;
  district?: string;
  state?: string;
  permanent_address: string;
  created_at?: string;
  updated_at?: string;
}

export interface ParentDetails {
  id: string;
  student_id: string;
  father_name: string;
  father_occupation?: string;
  father_mobile_no?: string;
  mother_name: string;
  mother_occupation?: string;
  mother_mobile_no?: string;
  guardian_name?: string;
  guardian_occupation?: string;
  guardian_mobile_no?: string;
  guardian_relation?: string;
  created_at?: string;
  updated_at?: string;
}

export interface AcademicHistory {
  id: string;
  student_id: string;
  slc_institution?: string;
  slc_passed_year?: number;
  slc_symbol_no?: string;
  slc_gpa?: number;
  hs_institution?: string;
  hs_passed_year?: number;
  hs_symbol_no?: string;
  hs_gpa?: number;
  major_subject?: string;
  created_at?: string;
  updated_at?: string;
}

// ============================================
// SEMESTER & SUBJECT TYPES
// ============================================

export interface Subject {
  id: string;
  code: string;
  name: string;
  subject_team?: string;
  program: ProgramType;
  semester: number;
  credit_hours?: number;
  is_elective?: boolean;
  created_at?: string;
}

export interface StudentSemester {
  id: string;
  student_id: string;
  semester: number;
  status: SemesterStatus;
  enrolled_date?: string;
  completed_date?: string;
  created_at?: string;
  updated_at?: string;
}

// ============================================
// ACADEMIC RECORDS TYPES
// ============================================

export interface AssignmentRecord {
  id: string;
  student_id: string;
  subject_id: string;
  semester: number;
  assignment_number: number;
  due_date?: string;
  submitted_date?: string;
  evaluation?: number;
  signature?: string;
  remarks?: string;
  created_at?: string;
  updated_at?: string;
  // Joined data
  subject?: Subject;
}

export interface PresentationRecord {
  id: string;
  student_id: string;
  subject_id: string;
  semester: number;
  topic?: string;
  presented_date?: string;
  evaluation?: number;
  signature?: string;
  remarks?: string;
  created_at?: string;
  updated_at?: string;
  // Joined data
  subject?: Subject;
}

export interface ExamRecord {
  id: string;
  student_id: string;
  subject_id: string;
  semester: number;
  exam_type: ExamType;
  exam_date?: string;
  internal_marks?: number;
  practical_marks?: number;
  viva_marks?: number;
  evaluation?: number;
  signature?: string;
  remarks?: string;
  created_at?: string;
  updated_at?: string;
  // Joined data
  subject?: Subject;
}

// ============================================
// COMPOSITE TYPES
// ============================================

export interface StudentProfile {
  student: Student;
  address?: StudentAddress;
  parents?: ParentDetails;
  academic_history?: AcademicHistory;
  semesters?: StudentSemester[];
}

export interface SemesterRecords {
  assignments: AssignmentRecord[];
  presentations: PresentationRecord[];
  exams: ExamRecord[];
}

export interface StudentWithDetails extends Student {
  address?: StudentAddress;
  parents?: ParentDetails;
  academic_history?: AcademicHistory;
}

// ============================================
// DASHBOARD TYPES
// ============================================

export interface DashboardStats {
  total_students: number;
  total_bca_students: number;
  total_bicte_students: number;
  semester_1_students: number;
  semester_2_students: number;
  semester_3_students: number;
  semester_4_students: number;
  semester_5_students: number;
  semester_6_students: number;
  semester_7_students: number;
  semester_8_students: number;
}

// ============================================
// FORM TYPES
// ============================================

export interface StudentFormData {
  // Personal Details
  college_enrollment_no: string;
  name: string;
  gender: GenderType;
  religion?: string;
  birthdate: string;
  faculty?: string;
  tu_regd_no?: string;
  level?: LevelType;
  symbol_no?: string;
  mobile_no?: string;
  email_id?: string;
  residential_no?: string;
  photo_url?: string;
  program: ProgramType;
  current_semester: number;
  
  // Address
  local_address: string;
  district?: string;
  state?: string;
  permanent_address: string;
  
  // Parents
  father_name: string;
  father_occupation?: string;
  father_mobile_no?: string;
  mother_name: string;
  mother_occupation?: string;
  mother_mobile_no?: string;
  guardian_name?: string;
  guardian_occupation?: string;
  guardian_mobile_no?: string;
  guardian_relation?: string;
  
  // Academic History
  slc_institution?: string;
  slc_passed_year?: number;
  slc_symbol_no?: string;
  slc_gpa?: number;
  hs_institution?: string;
  hs_passed_year?: number;
  hs_symbol_no?: string;
  hs_gpa?: number;
  major_subject?: string;
}

export interface AssignmentFormData {
  subject_id: string;
  due_date?: string;
  submitted_date?: string;
  evaluation?: number;
  signature?: string;
  remarks?: string;
}

export interface PresentationFormData {
  subject_id: string;
  topic?: string;
  presented_date?: string;
  evaluation?: number;
  signature?: string;
  remarks?: string;
}

export interface ExamFormData {
  subject_id: string;
  exam_type: ExamType;
  exam_date?: string;
  internal_marks?: number;
  practical_marks?: number;
  viva_marks?: number;
  signature?: string;
  remarks?: string;
}

// ============================================
// SEARCH & FILTER TYPES
// ============================================

export interface StudentSearchFilters {
  searchQuery?: string;
  program?: ProgramType | 'all';
  semester?: number | 'all';
  status?: StudentStatus | 'all';
}

// ============================================
// AUTH TYPES
// ============================================

export interface User {
  id: string;
  email: string;
  role: 'admin';
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}
