// ============================================
// STUDENT ACADEMIC RECORDS PAGE
// ============================================

import { useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { navigateTo } from '@/lib/router';
import {
  useAllSubjects,
  useAssignmentRecords,
  useExamRecords,
  usePresentationRecords,
  useStudentIdBySlug,
  useStudentProfile,
} from '@/hooks/useApi';
import { useAutoHideHeader } from '@/hooks/useAutoHideHeader';
import { isUuid } from '@/lib/slug';
import logo from '../../logo.svg';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { SemesterAcademicRecords } from '@/components/SemesterAcademicRecords';
import { ChevronLeft, LogOut, BookOpen, User, Plus, Home, Edit, Eye, Printer } from 'lucide-react';
import type { AssignmentRecord, ExamRecord, PresentationRecord, ProgramType, Subject } from '@/types';

interface StudentAcademicRecordsPageProps {
  studentId: string;
}

function isProfileData(data: unknown): data is {
  student: {
    id: string;
    name: string;
    symbol_no?: string;
    tu_regd_no?: string;
    college_enrollment_no: string;
    photo_url?: string;
    program: ProgramType;
    current_semester: number;
  };
} {
  return !!data && typeof data === 'object' && 'student' in data;
}

export function StudentAcademicRecordsPage({ studentId }: StudentAcademicRecordsPageProps) {
  const { logout } = useAuth();
  const isHeaderVisible = useAutoHideHeader();
  const [selectedSemester, setSelectedSemester] = useState<number | null>(null);
  const isDirectUuid = isUuid(studentId);

  const { data: resolvedStudentId, isLoading: isResolvingStudentId } = useStudentIdBySlug(
    isDirectUuid ? undefined : studentId
  );
  const effectiveStudentId = isDirectUuid ? studentId : resolvedStudentId || '';

  const { data: profile, isLoading: isProfileLoading, isError } = useStudentProfile(effectiveStudentId);
  const { data: allSubjects, isLoading: isSubjectsLoading } = useAllSubjects();
  const isLoading = isProfileLoading || (!isDirectUuid && isResolvingStudentId);

  const student = isProfileData(profile) ? profile.student : null;

  const activeSemester = selectedSemester ?? student?.current_semester ?? 1;

  const subjectsBySemester = useMemo(() => {
    const grouped = new Map<number, Subject[]>();
    if (!student || !allSubjects) return grouped;

    for (let sem = 1; sem <= 8; sem += 1) {
      grouped.set(
        sem,
        allSubjects.filter(
          (subject) => subject.program === student.program && subject.semester === sem
        )
      );
    }

    return grouped;
  }, [allSubjects, student]);

  const { data: assignmentRecords = [] } = useAssignmentRecords(effectiveStudentId, activeSemester);
  const { data: presentationRecords = [] } = usePresentationRecords(effectiveStudentId, activeSemester);
  const { data: examRecords = [] } = useExamRecords(effectiveStudentId, activeSemester);

  const assignmentRecordMap = useMemo(() => {
    const map = new Map<string, AssignmentRecord>();
    assignmentRecords.forEach((record) => {
      map.set(`${record.subject_id}:${record.assignment_number}`, record);
    });
    return map;
  }, [assignmentRecords]);

  const presentationRecordMap = useMemo(() => {
    const map = new Map<string, PresentationRecord>();
    presentationRecords.forEach((record) => {
      map.set(record.subject_id, record);
    });
    return map;
  }, [presentationRecords]);

  const examRecordMap = useMemo(() => {
    const map = new Map<string, ExamRecord>();
    examRecords.forEach((record) => {
      map.set(`${record.subject_id}:${record.exam_type}`, record);
    });
    return map;
  }, [examRecords]);

  const getOrdinal = (value: number) => {
    const suffixes = ['st', 'nd', 'rd', 'th', 'th', 'th', 'th', 'th'];
    return `${value}${suffixes[value - 1] ?? 'th'}`;
  };

  const formatCell = (value?: string | number | null) => {
    if (value === undefined || value === null) return '';
    return String(value);
  };

  const formatDate = (value?: string) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString('en-CA');
  };

  const formatNumber = (value?: number | null) => {
    if (value === undefined || value === null) return '';
    return Number.isInteger(value) ? String(value) : value.toFixed(2);
  };

  const formatSubject = (subject?: Subject) => {
    if (!subject) return '';
    const team = subject.subject_team?.trim();
    return team ? `${subject.code}: ${subject.name} (${team})` : `${subject.code}: ${subject.name}`;
  };

  const getPreferredSignature = (subject?: Subject, savedSignature?: string | null) => {
    const team = subject?.subject_team?.trim();
    if (team) return team;
    const signature = typeof savedSignature === 'string' ? savedSignature.trim() : '';
    return signature;
  };

  const printableSubjectRows = useMemo(() => {
    const semesterSubjects = subjectsBySemester.get(activeSemester) ?? [];
    const rows: Array<Subject | undefined> = [...semesterSubjects];
    while (rows.length < 6) rows.push(undefined);
    return rows;
  }, [subjectsBySemester, activeSemester]);

  const handleLogout = async () => {
    await logout();
    navigateTo({ page: 'login' });
  };

  const handleBack = () => {
    if (window.history.length > 1) {
      window.history.back();
      return;
    }
    navigateTo({
      page: 'student-profile',
      studentId: effectiveStudentId,
      studentName: student?.name,
    });
  };

  if (isLoading || isSubjectsLoading) {
    return (
      <div className="min-h-screen bg-background">
        <header className={`bg-white border-b border-border sticky top-0 z-30 transition-transform duration-300 ${isHeaderVisible ? 'translate-y-0' : '-translate-y-full'}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-10 w-20" />
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Skeleton className="h-16 w-full mb-4" />
          <Skeleton className="h-[520px] w-full" />
        </main>
      </div>
    );
  }

  if (isError || !student || !effectiveStudentId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-muted-foreground font-medium">Unable to open academic records</p>
          <Button onClick={() => navigateTo({ page: 'students' })}>Back to Students</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className={`no-print bg-white border-b border-border sticky top-0 z-30 transition-transform duration-300 ${isHeaderVisible ? 'translate-y-0' : '-translate-y-full'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-3 sm:py-0 sm:h-16">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
              <button
                type="button"
                onClick={() => navigateTo({ page: 'dashboard' })}
                aria-label="Go to home"
              >
                <img src={logo} alt="Janamaitri Logo" className="h-10 w-auto" />
              </button>
              <div className="min-w-0">
                <h1 className="text-base sm:text-lg font-bold text-foreground truncate">Academic Records</h1>
                <p className="text-xs text-muted-foreground hidden sm:block">{student.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateTo({ page: 'dashboard' })}
              >
                <Home className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Home</span>
              </Button>
              <Button
                size="sm"
                onClick={() => navigateTo({ page: 'add-student' })}
                className="bg-primary hover:bg-primary/90"
              >
                <Plus className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Add Student</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateTo({ page: 'subject-setup' })}
              >
                <BookOpen className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Subject Setup</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  navigateTo({
                    page: 'student-profile',
                    studentId: effectiveStudentId,
                    studentName: student.name,
                  })
                }
              >
                <Eye className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">View Profile</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.print()}
              >
                <Printer className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Print Report</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  navigateTo({
                    page: 'edit-student',
                    studentId: effectiveStudentId,
                    studentName: student.name,
                  })
                }
              >
                <Edit className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Edit</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-muted-foreground hover:text-red-600"
              >
                <LogOut className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="no-print max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="border-0 shadow-md mb-4">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg text-foreground">
                {student.name} ({student.program})
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={String(activeSemester)} onValueChange={(v) => setSelectedSemester(parseInt(v, 10))}>
              <TabsList className="flex w-full overflow-x-auto">
                {Array.from({ length: 8 }, (_, i) => i + 1).map((sem) => (
                  <TabsTrigger
                    key={sem}
                    value={String(sem)}
                    disabled={sem > student.current_semester}
                    className="text-xs sm:text-sm min-w-12"
                  >
                    {sem}
                    <sup>{['st', 'nd', 'rd', 'th', 'th', 'th', 'th', 'th'][sem - 1]}</sup>
                  </TabsTrigger>
                ))}
              </TabsList>
              {Array.from({ length: 8 }, (_, i) => i + 1).map((sem) => (
                <TabsContent key={sem} value={String(sem)} className="mt-6">
                  <div className="flex items-center gap-2 mb-4">
                    <BookOpen className="w-5 h-5 text-primary" />
                    <h2 className="font-semibold text-foreground">
                      {sem}
                      <sup>{['st', 'nd', 'rd', 'th', 'th', 'th', 'th', 'th'][sem - 1]}</sup> Semester Records
                    </h2>
                  </div>
                  <SemesterAcademicRecords
                    studentId={effectiveStudentId}
                    semester={sem}
                    program={student.program}
                    subjects={subjectsBySemester.get(sem) ?? []}
                  />
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      </main>

      <main className="print-only">
        <section className="print-page">
          <div className="print-head">
            <h1>Academic Semester Report</h1>
            <p>Janamaitri Multiple Campus, Department of ICT</p>
          </div>

          <div className="print-student-head">
            <div className="print-meta-grid">
              <div><strong>Name of Student:</strong> {student.name}</div>
              <div><strong>Semester:</strong> {getOrdinal(activeSemester)} Semester</div>
              <div><strong>College Enrollment No:</strong> {student.college_enrollment_no}</div>
              <div><strong>Program:</strong> {student.program}</div>
              <div><strong>TU Registration No:</strong> {formatCell(student.tu_regd_no)}</div>
              <div><strong>Symbol No:</strong> {formatCell(student.symbol_no)}</div>
              <div><strong>Report:</strong> {getOrdinal(activeSemester)} Semester Academic Record</div>
              <div><strong>Generated:</strong> {new Date().toLocaleString('en-GB')}</div>
            </div>
            <div className="print-photo-box">
              {student.photo_url ? (
                <img src={student.photo_url} alt={`${student.name} photo`} className="print-student-photo" />
              ) : (
                <div className="print-photo-placeholder">No Photo</div>
              )}
            </div>
          </div>

          <h2 className="print-section-title">Assignment #1 Records</h2>
          <table className="print-table">
            <thead>
              <tr>
                <th>SN</th>
                <th>Subject</th>
                <th>Assignment Due Date</th>
                <th>Submitted Date</th>
                <th>Evaluation</th>
                <th>Signature</th>
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody>
              {printableSubjectRows.map((subject, index) => {
                const a1 = subject ? assignmentRecordMap.get(`${subject.id}:1`) : undefined;
                return (
                  <tr key={`print-assignment-1-${subject?.id ?? index}`}>
                    <td>{index + 1}</td>
                    <td>{formatSubject(subject)}</td>
                    <td>{formatDate(a1?.due_date)}</td>
                    <td>{formatDate(a1?.submitted_date)}</td>
                    <td>{formatNumber(a1?.evaluation)}</td>
                    <td>{formatCell(getPreferredSignature(subject, a1?.signature))}</td>
                    <td>{formatCell(a1?.remarks)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <h2 className="print-section-title">Assignment #2 Records</h2>
          <table className="print-table">
            <thead>
              <tr>
                <th>SN</th>
                <th>Subject</th>
                <th>Assignment Due Date</th>
                <th>Submitted Date</th>
                <th>Evaluation</th>
                <th>Signature</th>
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody>
              {printableSubjectRows.map((subject, index) => {
                const a2 = subject ? assignmentRecordMap.get(`${subject.id}:2`) : undefined;
                return (
                  <tr key={`print-assignment-2-${subject?.id ?? index}`}>
                    <td>{index + 1}</td>
                    <td>{formatSubject(subject)}</td>
                    <td>{formatDate(a2?.due_date)}</td>
                    <td>{formatDate(a2?.submitted_date)}</td>
                    <td>{formatNumber(a2?.evaluation)}</td>
                    <td>{formatCell(getPreferredSignature(subject, a2?.signature))}</td>
                    <td>{formatCell(a2?.remarks)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <h2 className="print-section-title">Presentation Records</h2>
          <table className="print-table">
            <thead>
              <tr>
                <th>SN</th>
                <th>Subject</th>
                <th>Presentation Topics</th>
                <th>Presented Date</th>
                <th>Evaluation</th>
                <th>Signature</th>
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody>
              {printableSubjectRows.map((subject, index) => {
                const record = subject ? presentationRecordMap.get(subject.id) : undefined;
                return (
                  <tr key={`print-presentation-${subject?.id ?? index}`}>
                    <td>{index + 1}</td>
                    <td>{formatSubject(subject)}</td>
                    <td>{formatCell(record?.topic)}</td>
                    <td>{formatDate(record?.presented_date)}</td>
                    <td>{formatNumber(record?.evaluation)}</td>
                    <td>{formatCell(getPreferredSignature(subject, record?.signature))}</td>
                    <td>{formatCell(record?.remarks)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <h2 className="print-section-title">Mid-Session Examination Records</h2>
          <table className="print-table">
            <thead>
              <tr>
                <th>SN</th>
                <th>Subject</th>
                <th>Exam Date</th>
                <th>Int Marks</th>
                <th>Practical Marks</th>
                <th>VIVA Marks</th>
                <th>Signature</th>
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody>
              {printableSubjectRows.map((subject, index) => {
                const mid = subject ? examRecordMap.get(`${subject.id}:Mid-Session`) : undefined;
                return (
                  <tr key={`print-exam-mid-${subject?.id ?? index}`}>
                    <td>{index + 1}</td>
                    <td>{formatSubject(subject)}</td>
                    <td>{formatDate(mid?.exam_date)}</td>
                    <td>{formatNumber(mid?.internal_marks)}</td>
                    <td>{formatNumber(mid?.practical_marks)}</td>
                    <td>{formatNumber(mid?.viva_marks)}</td>
                    <td>{formatCell(getPreferredSignature(subject, mid?.signature))}</td>
                    <td>{formatCell(mid?.remarks)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <h2 className="print-section-title">PreBoard Examination Records</h2>
          <table className="print-table">
            <thead>
              <tr>
                <th>SN</th>
                <th>Subject</th>
                <th>Exam Date</th>
                <th>Int Marks</th>
                <th>Practical Marks</th>
                <th>VIVA Marks</th>
                <th>Signature</th>
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody>
              {printableSubjectRows.map((subject, index) => {
                const pre = subject ? examRecordMap.get(`${subject.id}:PreBoard`) : undefined;
                return (
                  <tr key={`print-exam-pre-${subject?.id ?? index}`}>
                    <td>{index + 1}</td>
                    <td>{formatSubject(subject)}</td>
                    <td>{formatDate(pre?.exam_date)}</td>
                    <td>{formatNumber(pre?.internal_marks)}</td>
                    <td>{formatNumber(pre?.practical_marks)}</td>
                    <td>{formatNumber(pre?.viva_marks)}</td>
                    <td>{formatCell(getPreferredSignature(subject, pre?.signature))}</td>
                    <td>{formatCell(pre?.remarks)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      </main>
    </div>
  );
}
