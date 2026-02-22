// ============================================
// ACADEMIC MANAGEMENT SYSTEM - ZOD VALIDATIONS
// ============================================

import { z } from 'zod';

export const MAX_STUDENT_PHOTO_SIZE_BYTES = 2 * 1024 * 1024; // 2MB

// ============================================
// ENUM VALIDATIONS
// ============================================

export const programTypeSchema = z.enum(['BCA', 'BICTE']);
export const genderTypeSchema = z.enum(['Male', 'Female', 'Other']);
export const levelTypeSchema = z.enum(['Bachelor', 'Master']);
export const examTypeSchema = z.enum(['Mid-Session', 'PreBoard']);

// ============================================
// STUDENT VALIDATIONS
// ============================================

export const studentFormSchema = z.object({
  // Personal Details
  college_enrollment_no: z.string()
    .min(1, 'College Enrollment No is required')
    .max(50, 'Maximum 50 characters allowed'),
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Maximum 100 characters allowed'),
  gender: genderTypeSchema,
  religion: z.string().max(50, 'Maximum 50 characters allowed').optional().or(z.literal('')),
  birthdate: z.string()
    .min(1, 'Birthdate is required')
    .refine((date) => !isNaN(Date.parse(date)), 'Invalid date format'),
  faculty: z.string().max(100).default('Computer Science'),
  tu_regd_no: z.string().max(50, 'Maximum 50 characters allowed').optional().or(z.literal('')),
  level: levelTypeSchema.default('Bachelor'),
  symbol_no: z.string().max(50, 'Maximum 50 characters allowed').optional().or(z.literal('')),
  mobile_no: z.string()
    .max(20, 'Maximum 20 characters allowed')
    .optional()
    .or(z.literal('')),
  email_id: z.string()
    .email('Invalid email address')
    .max(100, 'Maximum 100 characters allowed')
    .optional()
    .or(z.literal('')),
  residential_no: z.string().max(20, 'Maximum 20 characters allowed').optional().or(z.literal('')),
  photo_url: z.string().url('Invalid photo URL').optional().or(z.literal('')),
  program: programTypeSchema,
  current_semester: z.number()
    .int('Semester must be a whole number')
    .min(1, 'Minimum semester is 1')
    .max(8, 'Maximum semester is 8'),
  // Address
  local_address: z.string()
    .min(1, 'Local address is required')
    .max(500, 'Maximum 500 characters allowed'),
  district: z.string().max(100, 'Maximum 100 characters allowed').optional().or(z.literal('')),
  state: z.string().max(100, 'Maximum 100 characters allowed').optional().or(z.literal('')),
  permanent_address: z.string()
    .min(1, 'Permanent address is required')
    .max(500, 'Maximum 500 characters allowed'),
  // Parents
  father_name: z.string()
    .min(1, 'Father\'s name is required')
    .max(100, 'Maximum 100 characters allowed'),
  father_occupation: z.string().max(100, 'Maximum 100 characters allowed').optional().or(z.literal('')),
  father_mobile_no: z.string()
    .max(20, 'Maximum 20 characters allowed')
    .optional()
    .or(z.literal('')),
  mother_name: z.string()
    .min(1, 'Mother\'s name is required')
    .max(100, 'Maximum 100 characters allowed'),
  mother_occupation: z.string().max(100, 'Maximum 100 characters allowed').optional().or(z.literal('')),
  mother_mobile_no: z.string()
    .max(20, 'Maximum 20 characters allowed')
    .optional()
    .or(z.literal('')),
  guardian_name: z.string().max(100, 'Maximum 100 characters allowed').optional().or(z.literal('')),
  guardian_occupation: z.string().max(100, 'Maximum 100 characters allowed').optional().or(z.literal('')),
  guardian_mobile_no: z.string()
    .max(20, 'Maximum 20 characters allowed')
    .optional()
    .or(z.literal('')),
  guardian_relation: z.string().max(50, 'Maximum 50 characters allowed').optional().or(z.literal('')),
  // Academic History
  slc_institution: z.string().max(200, 'Maximum 200 characters allowed').optional().or(z.literal('')),
  slc_passed_year: z.number()
    .int('Year must be a whole number')
    .min(1990, 'Year must be after 1990')
    .max(2100, 'Year must be before 2100')
    .optional(),
  slc_symbol_no: z.string().max(50, 'Maximum 50 characters allowed').optional().or(z.literal('')),
  slc_gpa: z.number()
    .min(0, 'GPA cannot be negative')
    .max(4, 'GPA cannot exceed 4.0')
    .optional(),
  hs_institution: z.string().max(200, 'Maximum 200 characters allowed').optional().or(z.literal('')),
  hs_passed_year: z.number()
    .int('Year must be a whole number')
    .min(1990, 'Year must be after 1990')
    .max(2100, 'Year must be before 2100')
    .optional(),
  hs_symbol_no: z.string().max(50, 'Maximum 50 characters allowed').optional().or(z.literal('')),
  hs_gpa: z.number()
    .min(0, 'GPA cannot be negative')
    .max(4, 'GPA cannot exceed 4.0')
    .optional(),
  major_subject: z.string().max(100, 'Maximum 100 characters allowed').optional().or(z.literal('')),
});

export type StudentFormSchema = z.infer<typeof studentFormSchema>;

// ============================================
// ASSIGNMENT VALIDATIONS
// ============================================

export const assignmentRecordSchema = z.object({
  subject_id: z.string().uuid('Invalid subject ID'),
  due_date: z.string()
    .refine((date) => !date || !isNaN(Date.parse(date)), 'Invalid date format')
    .optional()
    .or(z.literal('')),
  submitted_date: z.string()
    .refine((date) => !date || !isNaN(Date.parse(date)), 'Invalid date format')
    .optional()
    .or(z.literal('')),
  evaluation: z.number()
    .min(0, 'Evaluation cannot be negative')
    .max(100, 'Evaluation cannot exceed 100')
    .optional(),
  signature: z.string().max(100, 'Maximum 100 characters allowed').optional().or(z.literal('')),
  remarks: z.string().max(500, 'Maximum 500 characters allowed').optional().or(z.literal('')),
});

export type AssignmentRecordSchema = z.infer<typeof assignmentRecordSchema>;

// ============================================
// PRESENTATION VALIDATIONS
// ============================================

export const presentationRecordSchema = z.object({
  subject_id: z.string().uuid('Invalid subject ID'),
  topic: z.string().max(300, 'Maximum 300 characters allowed').optional().or(z.literal('')),
  presented_date: z.string()
    .refine((date) => !date || !isNaN(Date.parse(date)), 'Invalid date format')
    .optional()
    .or(z.literal('')),
  evaluation: z.number()
    .min(0, 'Evaluation cannot be negative')
    .max(100, 'Evaluation cannot exceed 100')
    .optional(),
  signature: z.string().max(100, 'Maximum 100 characters allowed').optional().or(z.literal('')),
  remarks: z.string().max(500, 'Maximum 500 characters allowed').optional().or(z.literal('')),
});

export type PresentationRecordSchema = z.infer<typeof presentationRecordSchema>;

// ============================================
// EXAM VALIDATIONS
// ============================================

export const examRecordSchema = z.object({
  subject_id: z.string().uuid('Invalid subject ID'),
  exam_type: examTypeSchema,
  exam_date: z.string()
    .refine((date) => !date || !isNaN(Date.parse(date)), 'Invalid date format')
    .optional()
    .or(z.literal('')),
  internal_marks: z.number()
    .min(0, 'Marks cannot be negative')
    .max(100, 'Marks cannot exceed 100')
    .optional(),
  practical_marks: z.number()
    .min(0, 'Marks cannot be negative')
    .optional(),
  viva_marks: z.number()
    .min(0, 'Marks cannot be negative')
    .optional(),
  signature: z.string().max(100, 'Maximum 100 characters allowed').optional().or(z.literal('')),
  remarks: z.string().max(500, 'Maximum 500 characters allowed').optional().or(z.literal('')),
});

export type ExamRecordSchema = z.infer<typeof examRecordSchema>;

// ============================================
// AUTH VALIDATIONS
// ============================================

export const loginSchema = z.object({
  email: z.string()
    .min(1, 'Email is required')
    .email('Invalid email address'),
  password: z.string()
    .min(6, 'Password must be at least 6 characters')
    .max(100, 'Maximum 100 characters allowed'),
});

export type LoginSchema = z.infer<typeof loginSchema>;

// ============================================
// SEARCH & FILTER VALIDATIONS
// ============================================

export const studentSearchSchema = z.object({
  searchQuery: z.string().max(100).optional(),
  program: z.enum(['BCA', 'BICTE', 'all']).optional().default('all'),
  semester: z.union([z.number().int().min(1).max(8), z.literal('all')]).optional().default('all'),
  status: z.enum(['Active', 'Inactive', 'Graduated', 'Dropped', 'all']).optional().default('all'),
});

export type StudentSearchSchema = z.infer<typeof studentSearchSchema>;

// ============================================
// PROMOTION VALIDATIONS
// ============================================

export const promotionSchema = z.object({
  student_id: z.string().uuid('Invalid student ID'),
  confirm: z.boolean().refine((val) => val === true, 'You must confirm the promotion'),
});

export type PromotionSchema = z.infer<typeof promotionSchema>;
