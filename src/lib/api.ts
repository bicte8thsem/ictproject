// ============================================
// API SERVICES - DATABASE OPERATIONS
// ============================================

import { supabase } from './supabase';
import { normalizeStudentLookupKey, slugifyStudentName } from './slug';
import type { 
  Subject,
  AssignmentRecord,
  PresentationRecord,
  ExamRecord,
  DashboardStats,
  ProgramType
} from '@/types';

const STUDENT_PHOTO_BUCKET = 'student-photos';
const MAX_STUDENT_PHOTO_SIZE_BYTES = 2 * 1024 * 1024; // 2MB

export interface StudentsQueryParams {
  searchQuery?: string;
  program?: ProgramType | 'all';
  semester?: number | 'all';
  status?: string;
  page?: number;
  pageSize?: number;
}

export interface StudentsQueryResult {
  items: unknown[];
  total: number;
}

function escapeIlike(input: string): string {
  return input.replace(/[%_\\]/g, '\\$&');
}

// ============================================
// DASHBOARD API
// ============================================

export async function getDashboardStats(): Promise<DashboardStats> {
  const { data, error } = await supabase
    .from('dashboard_stats')
    .select('*')
    .single();
  
  if (error) throw error;
  return data as unknown as DashboardStats;
}

// ============================================
// STUDENTS API
// ============================================

export async function getStudents(params?: StudentsQueryParams): Promise<StudentsQueryResult> {
  const page = Math.max(1, params?.page ?? 1);
  const pageSize = Math.max(1, Math.min(100, params?.pageSize ?? 10));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('students')
    .select(`
      *,
      address:student_addresses(*),
      parents:parent_details(*),
      academic_history:academic_history(*)
    `, { count: 'exact' });

  if (params?.searchQuery) {
    const safeQuery = escapeIlike(params.searchQuery.trim());
    query = query.or(`name.ilike.%${safeQuery}%,college_enrollment_no.ilike.%${safeQuery}%`);
  }

  if (params?.program && params.program !== 'all') {
    query = query.eq('program', params.program);
  }

  if (params?.semester && params.semester !== 'all') {
    query = query.eq('current_semester', params.semester);
  }

  if (params?.status && params.status !== 'all') {
    query = query.eq('status', params.status);
  }

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(from, to);
  
  if (error) throw error;
  return {
    items: (data || []) as unknown[],
    total: count ?? 0,
  };
}

export async function getStudentById(id: string): Promise<unknown> {
  // Primary path: RPC
  const { data, error } = await supabase
    .rpc('get_student_profile', { p_student_id: id });

  if (!error && data) {
    return data as unknown;
  }

  // Fallback path: direct table queries (helps when RPC is missing/blocked)
  const [studentRes, addressRes, parentsRes, historyRes] = await Promise.all([
    supabase.from('students').select('*').eq('id', id).maybeSingle(),
    supabase.from('student_addresses').select('*').eq('student_id', id).maybeSingle(),
    supabase.from('parent_details').select('*').eq('student_id', id).maybeSingle(),
    supabase.from('academic_history').select('*').eq('student_id', id).maybeSingle(),
  ]);

  if (studentRes.error) throw studentRes.error;
  if (!studentRes.data) return null;
  if (addressRes.error) throw addressRes.error;
  if (parentsRes.error) throw parentsRes.error;
  if (historyRes.error) throw historyRes.error;

  return {
    student: studentRes.data,
    address: addressRes.data ?? null,
    parents: parentsRes.data ?? null,
    academic_history: historyRes.data ?? null,
    semesters: null,
  } as unknown;
}

export async function getStudentIdBySlug(slug: string): Promise<string | null> {
  const normalizedSlug = slug.toLowerCase().trim();
  if (!normalizedSlug) return null;
  const normalizedLookupKey = normalizeStudentLookupKey(normalizedSlug);

  const { data, error } = await supabase
    .from('students')
    .select('id, name, college_enrollment_no, tu_regd_no')
    .order('created_at', { ascending: false });

  if (error) throw error;
  if (!data || data.length === 0) return null;

  const byExactSlug = data.find((student) => {
    const nameSlug = slugifyStudentName(student.name || '');
    const enrollmentSlug = slugifyStudentName(student.college_enrollment_no || '');
    const tuRegSlug = slugifyStudentName(student.tu_regd_no || '');
    return nameSlug === normalizedSlug || enrollmentSlug === normalizedSlug || tuRegSlug === normalizedSlug;
  });
  if (byExactSlug?.id) return byExactSlug.id as string;

  const byNormalizedKey = data.find((student) => {
    const nameKey = normalizeStudentLookupKey(student.name || '');
    const enrollmentKey = normalizeStudentLookupKey(student.college_enrollment_no || '');
    const tuRegKey = normalizeStudentLookupKey(student.tu_regd_no || '');
    return (
      nameKey === normalizedLookupKey ||
      enrollmentKey === normalizedLookupKey ||
      tuRegKey === normalizedLookupKey
    );
  });
  if (byNormalizedKey?.id) return byNormalizedKey.id as string;

  return null;
}

export async function createStudent(studentData: Record<string, unknown>): Promise<unknown> {
  const { data, error } = await supabase
    .from('students')
    .insert(studentData)
    .select()
    .single();
  
  if (error) throw error;
  return data as unknown;
}

export async function updateStudent(id: string, studentData: Record<string, unknown>): Promise<unknown> {
  const { data, error } = await supabase
    .from('students')
    .update(studentData)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data as unknown;
}

export async function deleteStudent(id: string): Promise<void> {
  const { error } = await supabase
    .from('students')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}

export async function uploadStudentPhoto(file: File, enrollmentNo: string): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Only image files are allowed');
  }

  if (file.size > MAX_STUDENT_PHOTO_SIZE_BYTES) {
    throw new Error('Photo size must be 2MB or less');
  }

  const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const normalizedEnrollmentNo = enrollmentNo
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-');

  const filePath = `${normalizedEnrollmentNo}-${Date.now()}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from(STUDENT_PHOTO_BUCKET)
    .upload(filePath, file, { upsert: true });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage
    .from(STUDENT_PHOTO_BUCKET)
    .getPublicUrl(filePath);

  if (!data.publicUrl) {
    throw new Error('Unable to generate photo URL');
  }

  return data.publicUrl;
}

// ============================================
// STUDENT DETAILS API
// ============================================

export async function createStudentAddress(addressData: Record<string, unknown>): Promise<unknown> {
  const { data, error } = await supabase
    .from('student_addresses')
    .insert(addressData)
    .select()
    .single();
  
  if (error) throw error;
  return data as unknown;
}

export async function updateStudentAddress(id: string, addressData: Record<string, unknown>): Promise<unknown> {
  const { data, error } = await supabase
    .from('student_addresses')
    .update(addressData)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data as unknown;
}

export async function createParentDetails(parentData: Record<string, unknown>): Promise<unknown> {
  const { data, error } = await supabase
    .from('parent_details')
    .insert(parentData)
    .select()
    .single();
  
  if (error) throw error;
  return data as unknown;
}

export async function updateParentDetails(id: string, parentData: Record<string, unknown>): Promise<unknown> {
  const { data, error } = await supabase
    .from('parent_details')
    .update(parentData)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data as unknown;
}

export async function createAcademicHistory(historyData: Record<string, unknown>): Promise<unknown> {
  const { data, error } = await supabase
    .from('academic_history')
    .insert(historyData)
    .select()
    .single();
  
  if (error) throw error;
  return data as unknown;
}

export async function updateAcademicHistory(id: string, historyData: Record<string, unknown>): Promise<unknown> {
  const { data, error } = await supabase
    .from('academic_history')
    .update(historyData)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data as unknown;
}

// ============================================
// SUBJECTS API
// ============================================

export async function getSubjects(program: ProgramType, semester: number): Promise<Subject[]> {
  const { data, error } = await supabase
    .from('subjects')
    .select('*')
    .eq('program', program)
    .eq('semester', semester)
    .order('code');
  
  if (error) throw error;
  return (data || []) as Subject[];
}

export async function getAllSubjects(): Promise<Subject[]> {
  const { data, error } = await supabase
    .from('subjects')
    .select('*')
    .order('program')
    .order('semester')
    .order('code');
  
  if (error) throw error;
  return (data || []) as Subject[];
}

// ============================================
// SEMESTER RECORDS API
// ============================================

export async function getSemesterRecords(studentId: string, semester: number): Promise<unknown> {
  const { data, error } = await supabase
    .rpc('get_semester_records', { p_student_id: studentId, p_semester: semester });
  
  if (error) throw error;
  return data as unknown;
}

// ============================================
// ASSIGNMENT RECORDS API
// ============================================

export async function getAssignmentRecords(studentId: string, semester: number): Promise<AssignmentRecord[]> {
  const { data, error } = await supabase
    .from('assignment_records')
    .select(`
      *,
      subject:subjects(*)
    `)
    .eq('student_id', studentId)
    .eq('semester', semester);
  
  if (error) throw error;
  return (data || []) as AssignmentRecord[];
}

export async function upsertAssignmentRecord(record: Record<string, unknown>): Promise<AssignmentRecord> {
  const { data, error } = await supabase
    .from('assignment_records')
    .upsert(record, {
      onConflict: 'student_id,subject_id,semester,assignment_number'
    })
    .select()
    .single();
  
  if (error) throw error;
  return data as AssignmentRecord;
}

export async function deleteAssignmentRecord(id: string): Promise<void> {
  const { error } = await supabase
    .from('assignment_records')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}

// ============================================
// PRESENTATION RECORDS API
// ============================================

export async function getPresentationRecords(studentId: string, semester: number): Promise<PresentationRecord[]> {
  const { data, error } = await supabase
    .from('presentation_records')
    .select(`
      *,
      subject:subjects(*)
    `)
    .eq('student_id', studentId)
    .eq('semester', semester);
  
  if (error) throw error;
  return (data || []) as PresentationRecord[];
}

export async function upsertPresentationRecord(record: Record<string, unknown>): Promise<PresentationRecord> {
  const { data, error } = await supabase
    .from('presentation_records')
    .upsert(record, {
      onConflict: 'student_id,subject_id,semester'
    })
    .select()
    .single();
  
  if (error) throw error;
  return data as PresentationRecord;
}

export async function deletePresentationRecord(id: string): Promise<void> {
  const { error } = await supabase
    .from('presentation_records')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}

// ============================================
// EXAM RECORDS API
// ============================================

export async function getExamRecords(studentId: string, semester: number): Promise<ExamRecord[]> {
  const { data, error } = await supabase
    .from('exam_records')
    .select(`
      *,
      subject:subjects(*)
    `)
    .eq('student_id', studentId)
    .eq('semester', semester);
  
  if (error) throw error;
  return (data || []) as ExamRecord[];
}

export async function upsertExamRecord(record: Record<string, unknown>): Promise<ExamRecord> {
  const { data, error } = await supabase
    .from('exam_records')
    .upsert(record, {
      onConflict: 'student_id,subject_id,semester,exam_type'
    })
    .select()
    .single();
  
  if (error) throw error;
  return data as ExamRecord;
}

export async function deleteExamRecord(id: string): Promise<void> {
  const { error } = await supabase
    .from('exam_records')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}

// ============================================
// PROMOTION API
// ============================================

export async function promoteStudent(studentId: string): Promise<{ success: boolean; message: string; previous_semester?: number; new_semester?: number }> {
  const { data, error } = await supabase
    .rpc('promote_student', { p_student_id: studentId });
  
  if (error) throw error;
  return data as unknown as { success: boolean; message: string; previous_semester?: number; new_semester?: number };
}

export async function graduateStudent(studentId: string): Promise<{ success: boolean; message: string; semester?: number }> {
  const { data: rpcData, error: rpcError } = await supabase
    .rpc('graduate_student', { p_student_id: studentId });

  if (!rpcError) {
    return rpcData as { success: boolean; message: string; semester?: number };
  }

  // Fallback if RPC is not available in DB yet
  const rpcCode = (rpcError as { code?: string }).code;
  if (rpcCode !== 'PGRST202' && rpcCode !== '42883') {
    throw rpcError;
  }

  const { data: student, error: studentError } = await supabase
    .from('students')
    .select('current_semester,status')
    .eq('id', studentId)
    .single();

  if (studentError) throw studentError;
  if (!student) throw new Error('Student not found');

  const currentSemester = Number((student as { current_semester?: unknown }).current_semester ?? 0);
  const currentStatus = String((student as { status?: unknown }).status ?? '');

  if (currentStatus !== 'Active') {
    return { success: false, message: 'Only active students can be graduated' };
  }

  if (currentSemester !== 8) {
    return { success: false, message: 'Student must be in 8th semester to graduate' };
  }

  const today = new Date().toISOString().split('T')[0];

  const { error: updateStudentError } = await supabase
    .from('students')
    .update({ status: 'Graduated' })
    .eq('id', studentId);

  if (updateStudentError) throw updateStudentError;

  const { error: updateSemesterError } = await supabase
    .from('student_semesters')
    .update({ status: 'Completed', completed_date: today })
    .eq('student_id', studentId)
    .eq('semester', 8);

  if (updateSemesterError) throw updateSemesterError;

  return { success: true, message: 'Student graduated successfully', semester: 8 };
}

// ============================================
// COMPLETE STUDENT SAVE (TRANSACTION)
// ============================================

export interface CompleteStudentData {
  student: Record<string, unknown>;
  address?: Record<string, unknown>;
  parents?: Record<string, unknown>;
  academicHistory?: Record<string, unknown>;
}

function isNoRowsError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const code = (error as { code?: string }).code;
  return code === 'PGRST116';
}

function isFunctionMissingError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const code = (error as { code?: string }).code;
  return code === 'PGRST202' || code === '42883';
}

export async function saveCompleteStudent(data: CompleteStudentData, studentId?: string): Promise<unknown> {
  const { data: rpcData, error: rpcError } = await supabase.rpc('save_complete_student', {
    p_payload: {
      student: data.student,
      address: data.address ?? null,
      parents: data.parents ?? null,
      academic_history: data.academicHistory ?? null,
    },
    p_student_id: studentId ?? null,
  });

  if (!rpcError) {
    return rpcData as unknown;
  }

  if (!isFunctionMissingError(rpcError)) {
    throw rpcError;
  }

  const isNewStudent = !studentId;
  // Start by saving/updating the student
  let student: unknown;
  
  if (!isNewStudent && studentId) {
    student = await updateStudent(studentId, data.student);
  } else {
    student = await createStudent(data.student);
    studentId = (student as { id: string }).id;
  }
  
  // Save address
  if (data.address) {
    const addressData = { ...data.address, student_id: studentId };
    
    // Check if address exists
    const { data: existingAddress, error: existingAddressError } = await supabase
      .from('student_addresses')
      .select('id')
      .eq('student_id', studentId)
      .maybeSingle();

    if (existingAddressError && !isNoRowsError(existingAddressError)) {
      throw existingAddressError;
    }
    
    if (existingAddress) {
      await updateStudentAddress((existingAddress as { id: string }).id, addressData);
    } else {
      await createStudentAddress(addressData);
    }
  }
  
  // Save parent details
  if (data.parents) {
    const parentData = { ...data.parents, student_id: studentId };
    
    // Check if parent details exist
    const { data: existingParents, error: existingParentsError } = await supabase
      .from('parent_details')
      .select('id')
      .eq('student_id', studentId)
      .maybeSingle();

    if (existingParentsError && !isNoRowsError(existingParentsError)) {
      throw existingParentsError;
    }
    
    if (existingParents) {
      await updateParentDetails((existingParents as { id: string }).id, parentData);
    } else {
      await createParentDetails(parentData);
    }
  }
  
  // Save academic history
  if (data.academicHistory) {
    const historyData = { ...data.academicHistory, student_id: studentId };
    
    // Check if academic history exists
    const { data: existingHistory, error: existingHistoryError } = await supabase
      .from('academic_history')
      .select('id')
      .eq('student_id', studentId)
      .maybeSingle();

    if (existingHistoryError && !isNoRowsError(existingHistoryError)) {
      throw existingHistoryError;
    }
    
    if (existingHistory) {
      await updateAcademicHistory((existingHistory as { id: string }).id, historyData);
    } else {
      await createAcademicHistory(historyData);
    }
  }
  
  // Create initial semester record only for new student
  if (isNewStudent) {
    const currentSemester = Number((student as { current_semester?: unknown }).current_semester ?? 1);
    const validSemester = Number.isFinite(currentSemester) && currentSemester >= 1 && currentSemester <= 8
      ? currentSemester
      : 1;

    const { error: semesterError } = await supabase
      .from('student_semesters')
      .upsert({
        student_id: (student as { id: string }).id,
        semester: validSemester,
        status: 'Ongoing',
        enrolled_date: new Date().toISOString().split('T')[0],
      }, {
        onConflict: 'student_id,semester',
      });
    if (semesterError) throw semesterError;
  }
  
  return student;
}
