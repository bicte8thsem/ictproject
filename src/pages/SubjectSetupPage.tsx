import { type FormEvent, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { navigateTo } from '@/lib/router';
import {
  useAllSubjects,
  useCreateProgramOption,
  useDeleteProgramOption,
  useCreateSubject,
  useDeleteSubject,
  useProgramOptions,
  useUpdateSubject,
} from '@/hooks/useApi';
import { useAutoHideHeader } from '@/hooks/useAutoHideHeader';
import type { ProgramType, Subject } from '@/types';
import logo from '../../logo.svg';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { BookOpen, Home, LogOut, Pencil, Save, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';

interface SubjectFormState {
  code: string;
  name: string;
  subject_team: string;
  program: ProgramType | '';
  semester: number;
}

const INITIAL_FORM: SubjectFormState = {
  code: '',
  name: '',
  subject_team: '',
  program: '',
  semester: 1,
};

function getErrorMessage(error: unknown) {
  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: unknown }).code === '23505'
  ) {
    return 'This subject code already exists for the selected program and semester.';
  }
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string' && message.trim().length > 0) return message;
  }
  return 'Request failed';
}

function subjectMatchesFilter(subject: Subject, program: ProgramType | 'all', semester: number | 'all') {
  if (program !== 'all' && subject.program !== program) return false;
  if (semester !== 'all' && subject.semester !== semester) return false;
  return true;
}

export function SubjectSetupPage() {
  const { logout } = useAuth();
  const isHeaderVisible = useAutoHideHeader();

  const { data: subjects = [], isLoading } = useAllSubjects();
  const { data: programOptions = ['BCA', 'BICTE'] } = useProgramOptions();
  const createProgram = useCreateProgramOption();
  const deleteProgram = useDeleteProgramOption();
  const createSubjectMutation = useCreateSubject();
  const updateSubjectMutation = useUpdateSubject();
  const deleteSubjectMutation = useDeleteSubject();

  const [form, setForm] = useState<SubjectFormState>(INITIAL_FORM);
  const [programName, setProgramName] = useState('');
  const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null);
  const [programFilter, setProgramFilter] = useState<ProgramType | 'all'>('all');
  const [semesterFilter, setSemesterFilter] = useState<number | 'all'>('all');

  const filteredSubjects = useMemo(
    () => subjects.filter((subject) => subjectMatchesFilter(subject, programFilter, semesterFilter)),
    [subjects, programFilter, semesterFilter]
  );

  const isSubmitting = createSubjectMutation.isPending || updateSubjectMutation.isPending;

  const handleLogout = async () => {
    await logout();
    navigateTo({ page: 'login' });
  };

  const resetForm = () => {
    setForm({
      ...INITIAL_FORM,
      program: programOptions[0] || '',
    });
    setEditingSubjectId(null);
  };

  const startEdit = (subject: Subject) => {
    setEditingSubjectId(subject.id);
    setForm({
      code: subject.code,
      name: subject.name,
      subject_team: subject.subject_team || '',
      program: subject.program,
      semester: subject.semester,
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const code = form.code.trim();
    const name = form.name.trim();
    const subjectTeam = form.subject_team.trim();

    const selectedProgram = form.program || programOptions[0] || '';
    const normalizedCode = code.toUpperCase();
    const duplicateInList = subjects.some((subject) => {
      if (editingSubjectId && subject.id === editingSubjectId) return false;
      return (
        subject.code.trim().toUpperCase() === normalizedCode &&
        subject.program === selectedProgram &&
        subject.semester === form.semester
      );
    });

    if (!code || !name || !subjectTeam || !selectedProgram) {
      toast.error('Subject code, subject name, subject teacher and program are required');
      return;
    }

    if (duplicateInList) {
      toast.error('This subject code already exists for the selected program and semester.');
      return;
    }

    try {
      const payload = {
        code: normalizedCode,
        name,
        subject_team: subjectTeam,
        program: selectedProgram,
        semester: form.semester,
      };

      if (editingSubjectId) {
        await updateSubjectMutation.mutateAsync({ id: editingSubjectId, data: payload });
        toast.success('Subject updated successfully');
      } else {
        await createSubjectMutation.mutateAsync(payload);
        toast.success('Subject created successfully');
      }

      resetForm();
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleDelete = async (id: string) => {
    const shouldDelete = window.confirm('Delete this subject? Existing linked academic records may block this action.');
    if (!shouldDelete) return;

    try {
      await deleteSubjectMutation.mutateAsync(id);
      if (editingSubjectId === id) {
        resetForm();
      }
      toast.success('Subject deleted successfully');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleCreateProgram = async () => {
    const normalizedName = programName.trim().toUpperCase();
    if (!normalizedName) {
      toast.error('Program name is required');
      return;
    }

    try {
      await createProgram.mutateAsync(normalizedName);
      setProgramName('');
      setForm((prev) => ({ ...prev, program: normalizedName }));
      toast.success('Program created successfully');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const handleDeleteProgram = async (name: string) => {
    const shouldDelete = window.confirm(
      `Delete program "${name}"? This will fail if subjects or students still use it.`
    );
    if (!shouldDelete) return;

    try {
      await deleteProgram.mutateAsync(name);
      if (form.program === name) {
        setForm((prev) => ({ ...prev, program: '' }));
      }
      toast.success('Program deleted successfully');
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className={`bg-white border-b border-border sticky top-0 z-30 transition-transform duration-300 ${isHeaderVisible ? 'translate-y-0' : '-translate-y-full'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-3 sm:py-0 sm:h-16">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => navigateTo({ page: 'dashboard' })}
                aria-label="Go to home"
              >
                <img src={logo} alt="Janamaitri Logo" className="h-10 w-auto" />
              </button>
              <div className="min-w-0">
                <h1 className="text-base sm:text-lg font-bold text-foreground truncate">Subject Setup</h1>
                <p className="text-xs text-muted-foreground hidden sm:block">Admin can create and manage subjects here</p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-end">
              <Button variant="outline" size="sm" onClick={() => navigateTo({ page: 'dashboard' })}>
                <Home className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Home</span>
              </Button>
              <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground hover:text-red-600">
                <LogOut className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="text-lg">Program Setup</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="program-name">Program Name</Label>
                <Input
                  id="program-name"
                  value={programName}
                  onChange={(e) => setProgramName(e.target.value)}
                  placeholder="e.g. BSC CSIT"
                />
              </div>
              <div className="flex items-end">
                <Button
                  type="button"
                  className="w-full"
                  onClick={handleCreateProgram}
                  disabled={createProgram.isPending}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Create Program
                </Button>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {programOptions.map((program) => (
                <div
                  key={program}
                  className="inline-flex items-center gap-2 rounded-md border px-2 py-1"
                >
                  <Badge variant="outline">{program}</Badge>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-red-600 hover:text-red-600"
                    onClick={() => handleDeleteProgram(program)}
                    disabled={deleteProgram.isPending}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BookOpen className="w-5 h-5 text-primary" />
              {editingSubjectId ? 'Edit Subject' : 'Create Subject'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4">
              <div className="space-y-2 lg:col-span-2">
                <Label htmlFor="subject-code">Subject Code</Label>
                <Input
                  id="subject-code"
                  value={form.code}
                  onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value }))}
                  placeholder="e.g. CACS101"
                />
              </div>

              <div className="space-y-2 lg:col-span-4">
                <Label htmlFor="subject-name">Subject Name</Label>
                <Input
                  id="subject-name"
                  value={form.name}
                  onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter subject name"
                />
              </div>

              <div className="space-y-2 lg:col-span-3">
                <Label htmlFor="subject-team">Subject Teacher</Label>
                <Input
                  id="subject-team"
                  value={form.subject_team}
                  onChange={(e) => setForm((prev) => ({ ...prev, subject_team: e.target.value }))}
                  placeholder="Teacher / team name"
                />
              </div>

              <div className="space-y-2 lg:col-span-2">
                <Label>Program</Label>
                <Select
                  value={(form.program || programOptions[0]) || undefined}
                  onValueChange={(value: ProgramType) => setForm((prev) => ({ ...prev, program: value }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select program" />
                  </SelectTrigger>
                  <SelectContent>
                    {programOptions.map((programName) => (
                      <SelectItem key={programName} value={programName}>
                        {programName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 lg:col-span-1">
                <Label>Semester</Label>
                <Select
                  value={String(form.semester)}
                  onValueChange={(value) => setForm((prev) => ({ ...prev, semester: parseInt(value, 10) }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 8 }, (_, i) => i + 1).map((sem) => (
                      <SelectItem key={sem} value={String(sem)}>
                        {sem}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-2 lg:col-span-12 flex flex-wrap items-end gap-2 pt-1">
                <Button type="submit" disabled={isSubmitting} className="bg-primary hover:bg-primary/90">
                  <Save className="w-4 h-4 mr-2" />
                  {editingSubjectId ? 'Update Subject' : 'Create Subject'}
                </Button>
                {editingSubjectId && (
                  <Button type="button" variant="outline" onClick={resetForm}>
                    <X className="w-4 h-4 mr-2" />
                    Cancel Edit
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader className="pb-3">
            <div className="flex flex-col md:flex-row md:items-end gap-3 md:justify-between">
              <CardTitle className="text-lg">Configured Subjects</CardTitle>
              <div className="flex gap-2">
                <Select
                  value={programFilter}
                  onValueChange={(value: ProgramType | 'all') => setProgramFilter(value)}
                >
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="Program" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Programs</SelectItem>
                    {programOptions.map((programName) => (
                      <SelectItem key={programName} value={programName}>
                        {programName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={semesterFilter === 'all' ? 'all' : String(semesterFilter)}
                  onValueChange={(value) => setSemesterFilter(value === 'all' ? 'all' : parseInt(value, 10))}
                >
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="Semester" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Semesters</SelectItem>
                    {Array.from({ length: 8 }, (_, i) => i + 1).map((sem) => (
                      <SelectItem key={sem} value={String(sem)}>
                        {sem}{['st', 'nd', 'rd', 'th', 'th', 'th', 'th', 'th'][sem - 1]} Semester
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : (
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-background">
                      <TableHead className="w-12">SN</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Subject Teacher</TableHead>
                      <TableHead>Program</TableHead>
                      <TableHead>Semester</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSubjects.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                          No subjects found for selected filters
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredSubjects.map((subject, index) => (
                        <TableRow key={subject.id}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell className="font-medium">{subject.code}</TableCell>
                          <TableCell>{subject.name}</TableCell>
                          <TableCell>{subject.subject_team || '-'}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{subject.program}</Badge>
                          </TableCell>
                          <TableCell>{subject.semester}</TableCell>
                          <TableCell className="text-right">
                            <div className="inline-flex gap-2">
                              <Button variant="outline" size="sm" onClick={() => startEdit(subject)}>
                                <Pencil className="w-4 h-4 mr-1" />
                                Edit
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600 hover:text-red-600"
                                onClick={() => handleDelete(subject.id)}
                                disabled={deleteSubjectMutation.isPending}
                              >
                                <Trash2 className="w-4 h-4 mr-1" />
                                Delete
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
