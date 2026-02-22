// ============================================
// REACT QUERY HOOKS
// ============================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  Subject,
  AssignmentRecord,
  PresentationRecord,
  ExamRecord,
  DashboardStats,
  ProgramType,
} from '@/types';
import * as api from '@/lib/api';

// ============================================
// QUERY KEYS
// ============================================

export const queryKeys = {
  dashboard: ['dashboard'] as const,
  students: ['students'] as const,
  student: (id: string) => ['students', id] as const,
  studentSlug: (slug: string) => ['students', 'slug', slug] as const,
  studentProfile: (id: string) => ['students', id, 'profile'] as const,
  subjects: (program: ProgramType, semester: number) => ['subjects', program, semester] as const,
  allSubjects: ['subjects', 'all'] as const,
  semesterRecords: (studentId: string, semester: number) => 
    ['semesterRecords', studentId, semester] as const,
  assignmentRecords: (studentId: string, semester: number) => 
    ['assignmentRecords', studentId, semester] as const,
  presentationRecords: (studentId: string, semester: number) => 
    ['presentationRecords', studentId, semester] as const,
  examRecords: (studentId: string, semester: number) => 
    ['examRecords', studentId, semester] as const,
};

// ============================================
// DASHBOARD HOOKS
// ============================================

export function useDashboardStats() {
  return useQuery<DashboardStats>({
    queryKey: queryKeys.dashboard,
    queryFn: api.getDashboardStats,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// ============================================
// STUDENT HOOKS
// ============================================

export function useStudents(params?: {
  searchQuery?: string;
  program?: ProgramType | 'all';
  semester?: number | 'all';
  status?: string;
  page?: number;
  pageSize?: number;
}) {
  return useQuery<api.StudentsQueryResult>({
    queryKey: [...queryKeys.students, params],
    queryFn: () => api.getStudents(params),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useStudentProfile(id: string) {
  return useQuery({
    queryKey: queryKeys.studentProfile(id),
    queryFn: () => api.getStudentById(id),
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  });
}

export function useStudentIdBySlug(slug?: string) {
  return useQuery<string | null>({
    queryKey: queryKeys.studentSlug(slug || ''),
    queryFn: () => api.getStudentIdBySlug(slug || ''),
    enabled: !!slug,
    staleTime: 2 * 60 * 1000,
  });
}

export function useCreateStudent() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: api.CompleteStudentData) => api.saveCompleteStudent(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.students });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}

export function useUpdateStudent(defaultId?: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id?: string; data: api.CompleteStudentData }) => {
      const targetId = id ?? defaultId;
      if (!targetId) {
        throw new Error('Student ID is required for update');
      }
      return api.saveCompleteStudent(data, targetId);
    },
    onSuccess: (_, variables) => {
      const targetId = variables.id ?? defaultId;
      queryClient.invalidateQueries({ queryKey: queryKeys.students });
      if (targetId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.student(targetId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.studentProfile(targetId) });
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}

export function useDeleteStudent() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => api.deleteStudent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.students });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}

// ============================================
// SUBJECT HOOKS
// ============================================

export function useSubjects(program: ProgramType, semester: number) {
  return useQuery<Subject[]>({
    queryKey: queryKeys.subjects(program, semester),
    queryFn: () => api.getSubjects(program, semester),
    enabled: !!program && !!semester,
    staleTime: 10 * 60 * 1000, // 10 minutes - subjects don't change often
  });
}

export function useAllSubjects() {
  return useQuery<Subject[]>({
    queryKey: queryKeys.allSubjects,
    queryFn: api.getAllSubjects,
    staleTime: 10 * 60 * 1000,
  });
}

// ============================================
// SEMESTER RECORDS HOOKS
// ============================================

export function useSemesterRecords(studentId: string, semester: number) {
  return useQuery({
    queryKey: queryKeys.semesterRecords(studentId, semester),
    queryFn: () => api.getSemesterRecords(studentId, semester),
    enabled: !!studentId && !!semester,
    staleTime: 1 * 60 * 1000,
  });
}

// ============================================
// ASSIGNMENT RECORDS HOOKS
// ============================================

export function useAssignmentRecords(studentId: string, semester: number) {
  return useQuery<AssignmentRecord[]>({
    queryKey: queryKeys.assignmentRecords(studentId, semester),
    queryFn: () => api.getAssignmentRecords(studentId, semester),
    enabled: !!studentId && !!semester,
    staleTime: 1 * 60 * 1000,
  });
}

export function useUpsertAssignmentRecord(studentId: string, semester: number) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (record: Record<string, unknown>) => api.upsertAssignmentRecord(record),
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.assignmentRecords(studentId, semester) 
      });
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.semesterRecords(studentId, semester) 
      });
    },
  });
}

// ============================================
// PRESENTATION RECORDS HOOKS
// ============================================

export function usePresentationRecords(studentId: string, semester: number) {
  return useQuery<PresentationRecord[]>({
    queryKey: queryKeys.presentationRecords(studentId, semester),
    queryFn: () => api.getPresentationRecords(studentId, semester),
    enabled: !!studentId && !!semester,
    staleTime: 1 * 60 * 1000,
  });
}

export function useUpsertPresentationRecord(studentId: string, semester: number) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (record: Record<string, unknown>) => api.upsertPresentationRecord(record),
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.presentationRecords(studentId, semester) 
      });
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.semesterRecords(studentId, semester) 
      });
    },
  });
}

// ============================================
// EXAM RECORDS HOOKS
// ============================================

export function useExamRecords(studentId: string, semester: number) {
  return useQuery<ExamRecord[]>({
    queryKey: queryKeys.examRecords(studentId, semester),
    queryFn: () => api.getExamRecords(studentId, semester),
    enabled: !!studentId && !!semester,
    staleTime: 1 * 60 * 1000,
  });
}

export function useUpsertExamRecord(studentId: string, semester: number) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (record: Record<string, unknown>) => api.upsertExamRecord(record),
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.examRecords(studentId, semester) 
      });
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.semesterRecords(studentId, semester) 
      });
    },
  });
}

// ============================================
// PROMOTION HOOKS
// ============================================

export function usePromoteStudent() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (studentId: string) => api.promoteStudent(studentId),
    onSuccess: (_, studentId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.students });
      queryClient.invalidateQueries({ queryKey: queryKeys.student(studentId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.studentProfile(studentId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });
}
