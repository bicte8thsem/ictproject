// ============================================
// STUDENT ACADEMIC RECORDS PAGE
// ============================================

import { useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { navigateTo } from '@/lib/router';
import { useAllSubjects, useStudentIdBySlug, useStudentProfile } from '@/hooks/useApi';
import { useAutoHideHeader } from '@/hooks/useAutoHideHeader';
import { isUuid } from '@/lib/slug';
import logo from '../../logo.svg';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { SemesterAcademicRecords } from '@/components/SemesterAcademicRecords';
import { ChevronLeft, LogOut, BookOpen, User, Plus, Home } from 'lucide-react';
import type { ProgramType } from '@/types';

interface StudentAcademicRecordsPageProps {
  studentId: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isProfileData(data: any): data is {
  student: {
    id: string;
    name: string;
    program: ProgramType;
    current_semester: number;
  };
} {
  return data && typeof data === 'object' && 'student' in data;
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

  const semesterSubjects = useMemo(() => {
    if (!student || !allSubjects) return [];
    return allSubjects.filter(
      (subject) => subject.program === student.program && subject.semester === activeSemester
    );
  }, [allSubjects, student, activeSemester]);

  const handleLogout = async () => {
    await logout();
    navigateTo({ page: 'login' });
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
      <header className={`bg-white border-b border-border sticky top-0 z-30 transition-transform duration-300 ${isHeaderVisible ? 'translate-y-0' : '-translate-y-full'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-3 sm:py-0 sm:h-16">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  navigateTo({
                    page: 'student-profile',
                    studentId: effectiveStudentId,
                    studentName: student.name,
                  })
                }
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
              <img src={logo} alt="Janamaitri Logo" className="h-10 w-auto" />
              <div className="min-w-0">
                <h1 className="text-base sm:text-lg font-bold text-foreground truncate">Academic Records</h1>
                <p className="text-xs text-muted-foreground hidden sm:block">{student.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 justify-end">
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                    subjects={sem === activeSemester ? semesterSubjects : []}
                  />
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
