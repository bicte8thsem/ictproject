// ============================================
// STUDENTS LIST PAGE
// ============================================

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { navigateTo } from '@/lib/router';
import { useStudents, useDeleteStudent } from '@/hooks/useApi';
import { useAutoHideHeader } from '@/hooks/useAutoHideHeader';
import logo from '../../logo.svg';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { 
  Search, 
  Plus, 
  LogOut, 
  MoreVertical, 
  Eye, 
  Edit, 
  Trash2,
  User,
  Filter,
  ChevronLeft,
  BookOpen,
  Home
} from 'lucide-react';
import { toast } from 'sonner';
import type { ProgramType } from '@/types';

const PROGRAM_OPTIONS: { value: ProgramType | 'all'; label: string }[] = [
  { value: 'all', label: 'All Programs' },
  { value: 'BCA', label: 'BCA' },
  { value: 'BICTE', label: 'BICTE' },
];

const SEMESTER_OPTIONS = [
  { value: 'all', label: 'All Semesters' },
  ...Array.from({ length: 8 }, (_, i) => ({ 
    value: String(i + 1), 
    label: `${i + 1}${['st', 'nd', 'rd', 'th', 'th', 'th', 'th', 'th'][i]} Semester` 
  })),
];

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'Active', label: 'Active' },
  { value: 'Inactive', label: 'Inactive' },
  { value: 'Graduated', label: 'Graduated' },
  { value: 'Dropped', label: 'Dropped' },
];

const STUDENTS_PER_PAGE = 10;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isStudentWithDetails(student: any): student is {
  id: string;
  name: string;
  college_enrollment_no: string;
  program: ProgramType;
  current_semester: number;
  status: string;
  mobile_no?: string;
  email_id?: string;
  photo_url?: string;
} {
  return student && typeof student === 'object' && 'id' in student && 'name' in student;
}

function StudentRow({ 
  student,
  onDelete,
}: { 
  student: {
    id: string;
    name: string;
    college_enrollment_no: string;
    program: ProgramType;
    current_semester: number;
    status: string;
    mobile_no?: string;
    email_id?: string;
    photo_url?: string;
  };
  onDelete: (id: string) => void;
}) {
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

  const openStudentProfile = () => {
    window.requestAnimationFrame(() => {
      navigateTo({
        page: 'student-profile',
        studentId: student.id,
        studentName: student.name,
      });
    });
  };

  const openAcademicRecords = () => {
    window.requestAnimationFrame(() => {
      navigateTo({
        page: 'student-academic-records',
        studentId: student.id,
        studentName: student.name,
      });
    });
  };

  return (
    <TableRow className="hover:bg-muted/50">
      <TableCell className="font-medium">
        <div className="flex items-center gap-3">
          <Avatar className="w-8 h-8">
            <AvatarImage src={student.photo_url} alt={student.name} className="object-cover" />
            <AvatarFallback className="bg-gradient-to-br from-primary to-primary text-white">
              <User className="w-4 h-4 text-white" />
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-foreground">{student.name}</p>
            <p className="text-xs text-muted-foreground">{student.college_enrollment_no}</p>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <Badge variant="outline" className={getProgramColor(student.program)}>
          {student.program}
        </Badge>
      </TableCell>
      <TableCell>
        <span className="text-foreground">
          {student.current_semester}
          <sup>{['st', 'nd', 'rd', 'th', 'th', 'th', 'th', 'th'][student.current_semester - 1]}</sup>
        </span>
      </TableCell>
      <TableCell>
        <Badge variant="outline" className={getStatusColor(student.status)}>
          {student.status}
        </Badge>
      </TableCell>
      <TableCell className="text-muted-foreground">{student.mobile_no || '-'}</TableCell>
      <TableCell className="text-muted-foreground">{student.email_id || '-'}</TableCell>
      <TableCell>
        <Button variant="outline" size="sm" onClick={openAcademicRecords}>
          <BookOpen className="w-4 h-4 mr-2" />
          Add Academic
        </Button>
      </TableCell>
      <TableCell onClick={(e) => e.stopPropagation()}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault();
                openStudentProfile();
              }}
            >
              <Eye className="w-4 h-4 mr-2" />
              View Profile
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => {
                navigateTo({ page: 'edit-student', studentId: student.id, studentName: student.name });
              }}
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => {
                onDelete(student.id);
              }}
              className="text-red-600 focus:text-red-600"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}

export function StudentsPage() {
  const { logout } = useAuth();
  const isHeaderVisible = useAutoHideHeader();
  const [searchQuery, setSearchQuery] = useState('');
  const [program, setProgram] = useState<ProgramType | 'all'>('all');
  const [semester, setSemester] = useState<number | 'all'>('all');
  const [status, setStatus] = useState<string>('all');
  const [studentToDelete, setStudentToDelete] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const { data: studentsResult, isLoading } = useStudents({
    searchQuery: searchQuery || undefined,
    program,
    semester,
    status: status !== 'all' ? status : undefined,
    page: currentPage,
    pageSize: STUDENTS_PER_PAGE,
  });

  const deleteMutation = useDeleteStudent();
  const totalStudents = studentsResult?.total || 0;
  const totalPages = Math.max(1, Math.ceil(totalStudents / STUDENTS_PER_PAGE));
  const startIndex = (currentPage - 1) * STUDENTS_PER_PAGE;
  const endIndex = startIndex + STUDENTS_PER_PAGE;
  const paginatedStudents = (studentsResult?.items || []).filter(isStudentWithDetails);
  const showingFrom = totalStudents === 0 ? 0 : startIndex + 1;
  const showingTo = Math.min(endIndex, totalStudents);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, program, semester, status]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const handleLogout = async () => {
    await logout();
    navigateTo({ page: 'login' });
  };

  const handleDelete = async () => {
    if (!studentToDelete) return;
    
    try {
      await deleteMutation.mutateAsync(studentToDelete);
      toast.success('Student deleted successfully');
    } catch {
      toast.error('Failed to delete student');
    } finally {
      setStudentToDelete(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className={`bg-white border-b border-border sticky top-0 z-30 transition-transform duration-300 ${isHeaderVisible ? 'translate-y-0' : '-translate-y-full'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-3 sm:py-0 sm:h-16">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigateTo({ page: 'dashboard' })}
                className="mr-1 sm:mr-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </Button>
              <img src={logo} alt="Janamaitri Logo" className="h-10 w-auto" />
              <div className="min-w-0">
                <h1 className="text-base sm:text-lg font-bold text-foreground truncate">Student Management</h1>
                <p className="text-xs text-muted-foreground hidden sm:block">Janamaitri Multiple Campus, Department of ICT, Student Record</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateTo({ page: 'dashboard' })}
                className="w-9 px-0 sm:w-auto sm:px-3"
              >
                <Home className="w-4 h-4" />
                <span className="hidden sm:inline">Home</span>
              </Button>
              <Button
                onClick={() => navigateTo({ page: 'add-student' })}
                size="sm"
                className="w-9 px-0 bg-primary hover:bg-primary/90 sm:w-auto sm:px-3"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Add Student</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="w-9 px-0 text-muted-foreground hover:text-red-600 sm:w-auto sm:px-3"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <Card className="border-0 shadow-sm mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/70" />
                <Input
                  placeholder="Search by name or enrollment number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-muted-foreground/70" />
                  <Select value={program} onValueChange={(v) => setProgram(v as ProgramType | 'all')}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Program" />
                    </SelectTrigger>
                    <SelectContent>
                      {PROGRAM_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Select 
                  value={String(semester)} 
                  onValueChange={(v) => setSemester(v === 'all' ? 'all' : parseInt(v))}
                >
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Semester" />
                  </SelectTrigger>
                  <SelectContent>
                    {SEMESTER_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Count */}
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {isLoading ? (
              'Loading students...'
            ) : (
              <>
                Showing <span className="font-medium text-foreground">{showingFrom}-{showingTo}</span> of{' '}
                <span className="font-medium text-foreground">{totalStudents}</span> students
              </>
            )}
          </p>
        </div>

        {/* Students Table */}
        <Card className="border-0 shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold text-foreground">Student</TableHead>
                  <TableHead className="font-semibold text-foreground">Program</TableHead>
                  <TableHead className="font-semibold text-foreground">Semester</TableHead>
                  <TableHead className="font-semibold text-foreground">Status</TableHead>
                  <TableHead className="font-semibold text-foreground">Contact</TableHead>
                  <TableHead className="font-semibold text-foreground">Email</TableHead>
                  <TableHead className="font-semibold text-foreground">Academic</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-10 w-48" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-12" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-28" /></TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  ))
                ) : totalStudents === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                          <Search className="w-8 h-8 text-muted-foreground/70" />
                        </div>
                        <div>
                          <p className="text-muted-foreground font-medium">No students found</p>
                          <p className="text-muted-foreground/70 text-sm">Try adjusting your search or filters</p>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedStudents.map((student) => (
                    <StudentRow 
                      key={student.id} 
                      student={student}
                      onDelete={setStudentToDelete}
                    />
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>

        {!isLoading && totalStudents > STUDENTS_PER_PAGE && (
          <div className="mt-6">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    aria-disabled={currentPage === 1}
                    className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                    onClick={(e) => {
                      e.preventDefault();
                      if (currentPage > 1) setCurrentPage(currentPage - 1);
                    }}
                  />
                </PaginationItem>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <PaginationItem key={page}>
                    <PaginationLink
                      href="#"
                      isActive={page === currentPage}
                      onClick={(e) => {
                        e.preventDefault();
                        setCurrentPage(page);
                      }}
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                ))}

                <PaginationItem>
                  <PaginationNext
                    href="#"
                    aria-disabled={currentPage === totalPages}
                    className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
                    onClick={(e) => {
                      e.preventDefault();
                      if (currentPage < totalPages) setCurrentPage(currentPage + 1);
                    }}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </main>

      <AlertDialog open={!!studentToDelete} onOpenChange={() => setStudentToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the student
              and all associated records from the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
