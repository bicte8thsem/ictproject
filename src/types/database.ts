// ============================================
// SUPABASE DATABASE TYPES
// ============================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      students: {
        Row: {
          id: string;
          college_enrollment_no: string;
          name: string;
          gender: 'Male' | 'Female' | 'Other';
          religion: string | null;
          birthdate: string;
          faculty: string | null;
          tu_regd_no: string | null;
          level: 'Bachelor' | 'Master' | null;
          symbol_no: string | null;
          mobile_no: string | null;
          email_id: string | null;
          residential_no: string | null;
          photo_url: string | null;
          program: 'BCA' | 'BICTE';
          current_semester: number;
          status: string;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          college_enrollment_no: string;
          name: string;
          gender: 'Male' | 'Female' | 'Other';
          religion?: string | null;
          birthdate: string;
          faculty?: string | null;
          tu_regd_no?: string | null;
          level?: 'Bachelor' | 'Master' | null;
          symbol_no?: string | null;
          mobile_no?: string | null;
          email_id?: string | null;
          residential_no?: string | null;
          photo_url?: string | null;
          program: 'BCA' | 'BICTE';
          current_semester?: number;
          status?: string;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          college_enrollment_no?: string;
          name?: string;
          gender?: 'Male' | 'Female' | 'Other';
          religion?: string | null;
          birthdate?: string;
          faculty?: string | null;
          tu_regd_no?: string | null;
          level?: 'Bachelor' | 'Master' | null;
          symbol_no?: string | null;
          mobile_no?: string | null;
          email_id?: string | null;
          residential_no?: string | null;
          photo_url?: string | null;
          program?: 'BCA' | 'BICTE';
          current_semester?: number;
          status?: string;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      student_addresses: {
        Row: {
          id: string;
          student_id: string;
          local_address: string;
          district: string | null;
          state: string | null;
          permanent_address: string;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          student_id: string;
          local_address: string;
          district?: string | null;
          state?: string | null;
          permanent_address: string;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          student_id?: string;
          local_address?: string;
          district?: string | null;
          state?: string | null;
          permanent_address?: string;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      parent_details: {
        Row: {
          id: string;
          student_id: string;
          father_name: string;
          father_occupation: string | null;
          father_mobile_no: string | null;
          mother_name: string;
          mother_occupation: string | null;
          mother_mobile_no: string | null;
          guardian_name: string | null;
          guardian_occupation: string | null;
          guardian_mobile_no: string | null;
          guardian_relation: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          student_id: string;
          father_name: string;
          father_occupation?: string | null;
          father_mobile_no?: string | null;
          mother_name: string;
          mother_occupation?: string | null;
          mother_mobile_no?: string | null;
          guardian_name?: string | null;
          guardian_occupation?: string | null;
          guardian_mobile_no?: string | null;
          guardian_relation?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          student_id?: string;
          father_name?: string;
          father_occupation?: string | null;
          father_mobile_no?: string | null;
          mother_name?: string;
          mother_occupation?: string | null;
          mother_mobile_no?: string | null;
          guardian_name?: string | null;
          guardian_occupation?: string | null;
          guardian_mobile_no?: string | null;
          guardian_relation?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      academic_history: {
        Row: {
          id: string;
          student_id: string;
          slc_institution: string | null;
          slc_passed_year: number | null;
          slc_symbol_no: string | null;
          slc_gpa: number | null;
          hs_institution: string | null;
          hs_passed_year: number | null;
          hs_symbol_no: string | null;
          hs_gpa: number | null;
          major_subject: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          student_id: string;
          slc_institution?: string | null;
          slc_passed_year?: number | null;
          slc_symbol_no?: string | null;
          slc_gpa?: number | null;
          hs_institution?: string | null;
          hs_passed_year?: number | null;
          hs_symbol_no?: string | null;
          hs_gpa?: number | null;
          major_subject?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          student_id?: string;
          slc_institution?: string | null;
          slc_passed_year?: number | null;
          slc_symbol_no?: string | null;
          slc_gpa?: number | null;
          hs_institution?: string | null;
          hs_passed_year?: number | null;
          hs_symbol_no?: string | null;
          hs_gpa?: number | null;
          major_subject?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      subjects: {
        Row: {
          id: string;
          code: string;
          name: string;
          program: 'BCA' | 'BICTE';
          semester: number;
          credit_hours: number | null;
          is_elective: boolean | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          code: string;
          name: string;
          program: 'BCA' | 'BICTE';
          semester: number;
          credit_hours?: number | null;
          is_elective?: boolean | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          code?: string;
          name?: string;
          program?: 'BCA' | 'BICTE';
          semester?: number;
          credit_hours?: number | null;
          is_elective?: boolean | null;
          created_at?: string | null;
        };
      };
      student_semesters: {
        Row: {
          id: string;
          student_id: string;
          semester: number;
          status: string;
          enrolled_date: string | null;
          completed_date: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          student_id: string;
          semester: number;
          status?: string;
          enrolled_date?: string | null;
          completed_date?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          student_id?: string;
          semester?: number;
          status?: string;
          enrolled_date?: string | null;
          completed_date?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      assignment_records: {
        Row: {
          id: string;
          student_id: string;
          subject_id: string;
          semester: number;
          assignment_number: number;
          due_date: string | null;
          submitted_date: string | null;
          evaluation: number | null;
          signature: string | null;
          remarks: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          student_id: string;
          subject_id: string;
          semester: number;
          assignment_number: number;
          due_date?: string | null;
          submitted_date?: string | null;
          evaluation?: number | null;
          signature?: string | null;
          remarks?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          student_id?: string;
          subject_id?: string;
          semester?: number;
          assignment_number?: number;
          due_date?: string | null;
          submitted_date?: string | null;
          evaluation?: number | null;
          signature?: string | null;
          remarks?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      presentation_records: {
        Row: {
          id: string;
          student_id: string;
          subject_id: string;
          semester: number;
          topic: string | null;
          presented_date: string | null;
          evaluation: number | null;
          signature: string | null;
          remarks: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          student_id: string;
          subject_id: string;
          semester: number;
          topic?: string | null;
          presented_date?: string | null;
          evaluation?: number | null;
          signature?: string | null;
          remarks?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          student_id?: string;
          subject_id?: string;
          semester?: number;
          topic?: string | null;
          presented_date?: string | null;
          evaluation?: number | null;
          signature?: string | null;
          remarks?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
      exam_records: {
        Row: {
          id: string;
          student_id: string;
          subject_id: string;
          semester: number;
          exam_type: string;
          exam_date: string | null;
          internal_marks: number | null;
          practical_marks: number | null;
          viva_marks: number | null;
          signature: string | null;
          remarks: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          student_id: string;
          subject_id: string;
          semester: number;
          exam_type: string;
          exam_date?: string | null;
          internal_marks?: number | null;
          practical_marks?: number | null;
          viva_marks?: number | null;
          signature?: string | null;
          remarks?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          student_id?: string;
          subject_id?: string;
          semester?: number;
          exam_type?: string;
          exam_date?: string | null;
          internal_marks?: number | null;
          practical_marks?: number | null;
          viva_marks?: number | null;
          signature?: string | null;
          remarks?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
      };
    };
    Views: {
      student_summary: {
        Row: {
          id: string;
          college_enrollment_no: string;
          name: string;
          gender: string;
          program: string;
          current_semester: number;
          status: string;
          mobile_no: string | null;
          email_id: string | null;
          district: string | null;
          state: string | null;
          father_name: string;
          mother_name: string;
        };
      };
      dashboard_stats: {
        Row: {
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
        };
      };
    };
    Functions: {
      promote_student: {
        Args: { p_student_id: string };
        Returns: Json;
      };
      get_student_profile: {
        Args: { p_student_id: string };
        Returns: Json;
      };
      get_semester_records: {
        Args: { p_student_id: string; p_semester: number };
        Returns: Json;
      };
    };
    Enums: {
      program_type: 'BCA' | 'BICTE';
      gender_type: 'Male' | 'Female' | 'Other';
      level_type: 'Bachelor' | 'Master';
    };
  };
}
