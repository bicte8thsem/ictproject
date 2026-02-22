// ============================================
// STUDENT PROFILE PAGE
// ============================================

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { navigateTo } from '@/lib/router';
import { useStudentProfile, usePromoteStudent, useGraduateStudent, useStudentIdBySlug, useSemesterRecords } from '@/hooks/useApi';
import { useAutoHideHeader } from '@/hooks/useAutoHideHeader';
import logo from '../../logo.svg';
import { isUuid } from '@/lib/slug';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  LogOut, 
  User,
  MapPin,
  Users,
  GraduationCap,
  ChevronLeft,
  Edit,
  TrendingUp,
  Calendar,
  Phone,
  Mail,
  Award,
  BookOpen,
  Plus,
  Home
} from 'lucide-react';
import { toast } from 'sonner';
import type { ProgramType } from '@/types';

interface StudentProfilePageProps {
  studentId: string;
}

function isProfileData(data: unknown): data is {
  student: {
    id: string;
    name: string;
    college_enrollment_no: string;
    program: ProgramType;
    current_semester: number;
    status: string;
    gender: string;
    birthdate: string;
    religion?: string;
    faculty?: string;
    level?: string;
    tu_regd_no?: string;
    symbol_no?: string;
    mobile_no?: string;
    email_id?: string;
    residential_no?: string;
    photo_url?: string;
  };
  address?: {
    local_address: string;
    district?: string;
    state?: string;
    permanent_address: string;
  };
  parents?: {
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
  };
  academic_history?: {
    slc_institution?: string;
    slc_passed_year?: number;
    slc_symbol_no?: string;
    slc_gpa?: number;
    hs_institution?: string;
    hs_passed_year?: number;
    hs_symbol_no?: string;
    hs_gpa?: number;
    major_subject?: string;
  };
} {
  return !!data && typeof data === 'object' && 'student' in data;
}

function isSemesterRecordsData(data: unknown): data is {
  assignments?: Array<{ evaluation?: number | null }>;
  presentations?: unknown[];
  exams?: unknown[];
} {
  return !!data && typeof data === 'object';
}

function InfoRow({ label, value, icon: Icon }: { label: string; value?: string | null; icon?: React.ElementType }) {
  return (
    <div className="flex items-start gap-3 py-2">
      {Icon && <Icon className="w-4 h-4 text-muted-foreground/70 mt-0.5" />}
      <div className="flex-1">
        <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
        <p className="text-sm font-medium text-foreground">{value || '-'}</p>
      </div>
    </div>
  );
}

function SectionCard({ 
  title, 
  icon: Icon, 
  children 
}: { 
  title: string; 
  icon: React.ElementType; 
  children: React.ReactNode;
}) {
  return (
    <Card className="border-0 shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Icon className="w-5 h-5 text-primary" />
          <CardTitle className="text-lg text-foreground">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export function StudentProfilePage({ studentId }: StudentProfilePageProps) {
  const { logout } = useAuth();
  const isHeaderVisible = useAutoHideHeader();
  const [showPromoteDialog, setShowPromoteDialog] = useState(false);
  const [showGraduateDialog, setShowGraduateDialog] = useState(false);
  const [isLoadingTimedOut, setIsLoadingTimedOut] = useState(false);
  const isDirectUuid = isUuid(studentId);
  const { data: resolvedStudentId, isLoading: isResolvingStudentId } = useStudentIdBySlug(
    isDirectUuid ? undefined : studentId
  );
  const effectiveStudentId = isDirectUuid ? studentId : resolvedStudentId || '';
  
  const {
    data: profile,
    isLoading: isProfileLoading,
    isError: isProfileError,
  } = useStudentProfile(effectiveStudentId);
  const isLoading = isProfileLoading || (!isDirectUuid && isResolvingStudentId);
  
  useEffect(() => {
    setIsLoadingTimedOut(false);
  }, [studentId]);

  useEffect(() => {
    if (!isLoading) return;
    const timeoutId = window.setTimeout(() => {
      setIsLoadingTimedOut(true);
    }, 8000);
    return () => window.clearTimeout(timeoutId);
  }, [isLoading]);
  
  const student = isProfileData(profile) ? profile.student : null;
  const promoteMutation = usePromoteStudent();
  const graduateMutation = useGraduateStudent();
  const currentSemesterForSummary = student?.current_semester ?? 1;
  const { data: semesterRecords } = useSemesterRecords(effectiveStudentId, currentSemesterForSummary);

  const handleLogout = async () => {
    await logout();
    navigateTo({ page: 'login' });
  };

  const handlePromote = async () => {
    try {
      const result = await promoteMutation.mutateAsync(effectiveStudentId);
      if (result.success && result.new_semester) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error('Failed to promote student');
    } finally {
      setShowPromoteDialog(false);
    }
  };

  const handleGraduate = async () => {
    try {
      const result = await graduateMutation.mutateAsync(effectiveStudentId);
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error('Failed to graduate student');
    } finally {
      setShowGraduateDialog(false);
    }
  };

  const goToAcademicRecords = () => {
    window.requestAnimationFrame(() => {
      navigateTo({
        page: 'student-academic-records',
        studentId: effectiveStudentId,
        studentName: student?.name,
      });
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-secondary/10 text-secondary border-secondary/20';
      case 'Inactive': return 'bg-muted text-foreground border-border';
      case 'Graduated': return 'bg-primary/10 text-primary border-primary/20';
      case 'Dropped': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-muted text-foreground';
    }
  };

  const getProgramColor = (program: string) => {
    switch (program) {
      case 'BCA': return 'bg-primary/10 text-primary';
      case 'BICTE': return 'bg-purple-100 text-purple-700';
      default: return 'bg-muted text-foreground';
    }
  };

  if (isLoading && !isLoadingTimedOut) {
    return (
      <div className="min-h-screen bg-background">
        <header className={`bg-white border-b border-border sticky top-0 z-30 transition-transform duration-300 ${isHeaderVisible ? 'translate-y-0' : '-translate-y-full'}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <Skeleton className="h-10 w-48" />
              <Skeleton className="h-10 w-24" />
            </div>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Skeleton className="h-32 w-full mb-6" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Skeleton className="h-96" />
            <Skeleton className="h-96 lg:col-span-2" />
          </div>
        </main>
      </div>
    );
  }

  if (isLoadingTimedOut) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-foreground font-medium">Profile loading is taking too long</p>
          <p className="text-sm text-muted-foreground">Please retry. If this continues, check Supabase data/RLS.</p>
          <div className="flex items-center justify-center gap-2">
            <Button
              onClick={() =>
                navigateTo({
                  page: 'student-profile',
                  studentId: effectiveStudentId || studentId,
                })
              }
            >
              Retry
            </Button>
            <Button variant="outline" onClick={() => navigateTo({ page: 'students' })}>
              Back to Students
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (isProfileError || (!isDirectUuid && !isResolvingStudentId && !effectiveStudentId)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground font-medium">Unable to open student profile</p>
          <Button 
            onClick={() => navigateTo({ page: 'students' })}
            className="mt-4"
          >
            Back to Students
          </Button>
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground font-medium">Student not found</p>
          <Button 
            onClick={() => navigateTo({ page: 'students' })}
            className="mt-4"
          >
            Back to Students
          </Button>
        </div>
      </div>
    );
  }

  const address = isProfileData(profile) ? profile.address : null;
  const parents = isProfileData(profile) ? profile.parents : null;
  const academic_history = isProfileData(profile) ? profile.academic_history : null;
  const normalizedSummary = isSemesterRecordsData(semesterRecords) ? semesterRecords : null;
  const assignmentCount = normalizedSummary?.assignments?.length ?? 0;
  const presentationCount = normalizedSummary?.presentations?.length ?? 0;
  const examCount = normalizedSummary?.exams?.length ?? 0;
  const assignmentEvaluations = (normalizedSummary?.assignments ?? [])
    .map((a) => a.evaluation)
    .filter((v): v is number => typeof v === 'number');
  const assignmentAverage = assignmentEvaluations.length
    ? (assignmentEvaluations.reduce((sum, v) => sum + v, 0) / assignmentEvaluations.length).toFixed(2)
    : '-';

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className={`bg-white border-b border-border sticky top-0 z-30 transition-transform duration-300 ${isHeaderVisible ? 'translate-y-0' : '-translate-y-full'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 py-3">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigateTo({ page: 'students' })}
              >
                <ChevronLeft className="w-4 h-4" />
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
                <h1 className="text-base sm:text-lg font-bold text-foreground truncate">Student Profile</h1>
                <p className="text-xs text-muted-foreground hidden sm:block">Janamaitri Multiple Campus, Department of ICT, Student Record</p>
              </div>
            </div>
            
            <div className="ml-auto flex items-center gap-2 w-full lg:w-auto justify-end flex-nowrap overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateTo({ page: 'dashboard' })}
                className="shrink-0 w-9 px-0 xl:w-auto xl:px-3"
              >
                <Home className="w-4 h-4" />
                <span className="hidden xl:inline">Home</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={goToAcademicRecords}
                className="shrink-0 w-9 px-0 xl:w-auto xl:px-3"
              >
                <BookOpen className="w-4 h-4" />
                <span className="hidden 2xl:inline">Academic Records</span>
              </Button>
              <Button
                size="sm"
                onClick={() => navigateTo({ page: 'add-student' })}
                className="shrink-0 w-9 px-0 bg-primary hover:bg-primary/90 xl:w-auto xl:px-3"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden xl:inline">Add Student</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateTo({ page: 'edit-student', studentId: effectiveStudentId, studentName: student.name })}
                className="shrink-0 w-9 px-0 xl:w-auto xl:px-3"
              >
                <Edit className="w-4 h-4" />
                <span className="hidden xl:inline">Edit</span>
              </Button>
              {student.current_semester < 8 && student.status === 'Active' && (
                <Button
                  size="sm"
                  onClick={() => setShowPromoteDialog(true)}
                  className="shrink-0 w-9 px-0 bg-secondary hover:bg-secondary/90 xl:w-auto xl:px-3"
                >
                  <TrendingUp className="w-4 h-4" />
                  <span className="hidden xl:inline">Promote</span>
                </Button>
              )}
              {student.current_semester === 8 && student.status === 'Active' && (
                <Button
                  size="sm"
                  onClick={() => setShowGraduateDialog(true)}
                  className="shrink-0 w-9 px-0 bg-primary hover:bg-primary/90 xl:w-auto xl:px-3"
                >
                  <GraduationCap className="w-4 h-4" />
                  <span className="hidden xl:inline">Graduate</span>
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="shrink-0 w-9 px-0 text-muted-foreground hover:text-red-600 xl:w-auto xl:px-3"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden xl:inline">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <Card className="border-0 shadow-md mb-6 bg-gradient-to-r from-primary to-primary/90">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              <Avatar className="w-20 h-20 border border-white/30">
                <AvatarImage src={student.photo_url} alt={student.name} className="object-cover" />
                <AvatarFallback className="bg-white/20 text-white backdrop-blur-sm">
                  <User className="w-10 h-10 text-white" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <h2 className="text-2xl font-bold text-white">{student.name}</h2>
                  <Badge variant="outline" className={`${getStatusColor(student.status)} border-0`}>
                    {student.status}
                  </Badge>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-primary-foreground/80 text-sm">
                  <span className="flex items-center gap-1">
                    <Award className="w-4 h-4" />
                    {student.college_enrollment_no}
                  </span>
                  <span className="flex items-center gap-1">
                    <BookOpen className="w-4 h-4" />
                    <Badge className={`${getProgramColor(student.program)} border-0`}>
                      {student.program}
                    </Badge>
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {student.current_semester}
                    <sup>{['st', 'nd', 'rd', 'th', 'th', 'th', 'th', 'th'][student.current_semester - 1]}</sup> Semester
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Personal Info */}
          <div className="space-y-6">
            {/* Personal Details */}
            <SectionCard title="Personal Details" icon={User}>
              <div className="space-y-1">
                <InfoRow label="Full Name" value={student.name} icon={User} />
                <InfoRow label="Gender" value={student.gender} />
                <InfoRow label="Birthdate" value={student.birthdate} icon={Calendar} />
                <InfoRow label="Religion" value={student.religion} />
                <InfoRow label="Faculty" value={student.faculty} />
                <InfoRow label="Level" value={student.level} />
              </div>
              <Separator className="my-4" />
              <div className="space-y-1">
                <InfoRow label="College Enrollment No" value={student.college_enrollment_no} icon={Award} />
                <InfoRow label="TU Registration No" value={student.tu_regd_no} />
                <InfoRow label="Symbol No" value={student.symbol_no} />
              </div>
            </SectionCard>

            {/* Contact Details */}
            <SectionCard title="Contact Information" icon={Phone}>
              <div className="space-y-1">
                <InfoRow label="Mobile No" value={student.mobile_no} icon={Phone} />
                <InfoRow label="Email ID" value={student.email_id} icon={Mail} />
                <InfoRow label="Residential No" value={student.residential_no} />
              </div>
              <Separator className="my-4" />
              <div className="space-y-1">
                <InfoRow label="Local Address" value={address?.local_address} icon={MapPin} />
                <InfoRow label="District" value={address?.district} />
                <InfoRow label="State" value={address?.state} />
                <InfoRow label="Permanent Address" value={address?.permanent_address} icon={MapPin} />
              </div>
            </SectionCard>
          </div>

          {/* Right Column - Parents & Academic */}
          <div className="space-y-6 lg:col-span-2">
            {/* Parent Details */}
            <SectionCard title="Parent & Guardian Details" icon={Users}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                    <User className="w-4 h-4 text-primary" />
                    Father
                  </h4>
                  <div className="space-y-2">
                    <InfoRow label="Name" value={parents?.father_name} />
                    <InfoRow label="Occupation" value={parents?.father_occupation} />
                    <InfoRow label="Mobile No" value={parents?.father_mobile_no} />
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                    <User className="w-4 h-4 text-pink-500" />
                    Mother
                  </h4>
                  <div className="space-y-2">
                    <InfoRow label="Name" value={parents?.mother_name} />
                    <InfoRow label="Occupation" value={parents?.mother_occupation} />
                    <InfoRow label="Mobile No" value={parents?.mother_mobile_no} />
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Users className="w-4 h-4 text-secondary" />
                    Local Guardian
                  </h4>
                  <div className="space-y-2">
                    <InfoRow label="Name" value={parents?.guardian_name} />
                    <InfoRow label="Relation" value={parents?.guardian_relation} />
                    <InfoRow label="Occupation" value={parents?.guardian_occupation} />
                    <InfoRow label="Mobile No" value={parents?.guardian_mobile_no} />
                  </div>
                </div>
              </div>
            </SectionCard>

            {/* Academic History */}
            <SectionCard title="Academic History" icon={GraduationCap}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-3">SLC / SEE</h4>
                  <div className="space-y-2">
                    <InfoRow label="Institution" value={academic_history?.slc_institution} />
                    <InfoRow label="Passed Year" value={String(academic_history?.slc_passed_year || '')} />
                    <InfoRow label="Symbol No" value={academic_history?.slc_symbol_no} />
                    <InfoRow label="GPA" value={String(academic_history?.slc_gpa || '')} />
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-3">Higher Secondary (+2)</h4>
                  <div className="space-y-2">
                    <InfoRow label="Institution" value={academic_history?.hs_institution} />
                    <InfoRow label="Passed Year" value={String(academic_history?.hs_passed_year || '')} />
                    <InfoRow label="Symbol No" value={academic_history?.hs_symbol_no} />
                    <InfoRow label="GPA" value={String(academic_history?.hs_gpa || '')} />
                    <InfoRow label="Major Subject" value={academic_history?.major_subject} />
                  </div>
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Academic Summary" icon={BookOpen}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-md border p-3">
                  <p className="text-xs text-muted-foreground">Current Semester</p>
                  <p className="text-lg font-semibold text-foreground">
                    {student.current_semester}
                    <sup>{['st', 'nd', 'rd', 'th', 'th', 'th', 'th', 'th'][student.current_semester - 1]}</sup>
                  </p>
                </div>
                <div className="rounded-md border p-3">
                  <p className="text-xs text-muted-foreground">Avg Assignment Score</p>
                  <p className="text-lg font-semibold text-foreground">{assignmentAverage}</p>
                </div>
                <div className="rounded-md border p-3">
                  <p className="text-xs text-muted-foreground">Assignments Filled</p>
                  <p className="text-lg font-semibold text-foreground">{assignmentCount}</p>
                </div>
                <div className="rounded-md border p-3">
                  <p className="text-xs text-muted-foreground">Presentations Filled</p>
                  <p className="text-lg font-semibold text-foreground">{presentationCount}</p>
                </div>
                <div className="rounded-md border p-3 sm:col-span-2">
                  <p className="text-xs text-muted-foreground">Exams Filled</p>
                  <p className="text-lg font-semibold text-foreground">{examCount}</p>
                </div>
              </div>
              <div className="mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToAcademicRecords}
                >
                  Open Full Academic Records
                </Button>
              </div>
            </SectionCard>

          </div>
        </div>
      </main>

      {/* Promote Confirmation Dialog */}
      <AlertDialog open={showPromoteDialog} onOpenChange={setShowPromoteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Promote Student?</AlertDialogTitle>
            <AlertDialogDescription>
              This will promote <strong>{student.name}</strong> from 
              {' '}{student.current_semester}
              <sup>{['st', 'nd', 'rd', 'th', 'th', 'th', 'th', 'th'][student.current_semester - 1]}</sup> 
              {' '}to{' '}
              {student.current_semester + 1}
              <sup>{['st', 'nd', 'rd', 'th', 'th', 'th', 'th', 'th'][student.current_semester]}</sup> semester.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handlePromote}
              className="bg-secondary hover:bg-secondary/90"
            >
              Promote Student
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showGraduateDialog} onOpenChange={setShowGraduateDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Graduate Student?</AlertDialogTitle>
            <AlertDialogDescription>
              This will mark <strong>{student.name}</strong> as <strong>Graduated</strong> after completing
              {' '}8
              <sup>{['st', 'nd', 'rd', 'th', 'th', 'th', 'th', 'th'][7]}</sup> semester.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleGraduate}
              className="bg-primary hover:bg-primary/90"
            >
              Graduate Student
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
