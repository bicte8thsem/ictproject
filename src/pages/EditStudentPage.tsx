// ============================================
// EDIT STUDENT PAGE
// ============================================

import { useEffect, useState, type ChangeEvent } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { MAX_STUDENT_PHOTO_SIZE_BYTES, studentFormSchema } from '@/lib/validations';
import { useAuth } from '@/contexts/AuthContext';
import { navigateTo } from '@/lib/router';
import { useStudentIdBySlug, useStudentProfile, useUpdateStudent } from '@/hooks/useApi';
import { useAutoHideHeader } from '@/hooks/useAutoHideHeader';
import { uploadStudentPhoto } from '@/lib/api';
import { isUuid } from '@/lib/slug';
import { handleError } from '@/lib/supabase';
import logo from '../../logo.svg';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  LogOut, 
  User,
  MapPin,
  Users,
  GraduationCap,
  ChevronLeft,
  Save,
  Loader2,
  Camera,
  Home
} from 'lucide-react';
import { toast } from 'sonner';

interface EditStudentPageProps {
  studentId: string;
}

function isProfileData(data: unknown): data is {
  student: {
    id: string;
    college_enrollment_no: string;
    name: string;
    gender: 'Male' | 'Female' | 'Other';
    religion?: string;
    birthdate: string;
    faculty?: string;
    tu_regd_no?: string;
    level?: 'Bachelor' | 'Master';
    symbol_no?: string;
    mobile_no?: string;
    email_id?: string;
    residential_no?: string;
    photo_url?: string;
    program: 'BCA' | 'BICTE';
    current_semester: number;
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

export function EditStudentPage({ studentId }: EditStudentPageProps) {
  const { logout } = useAuth();
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
  const updateStudent = useUpdateStudent();
  const isLoading = isProfileLoading || (!isDirectUuid && isResolvingStudentId);
  const isHeaderVisible = useAutoHideHeader();
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [photoError, setPhotoError] = useState('');

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(studentFormSchema),
    defaultValues: {
      college_enrollment_no: '',
      name: '',
      gender: 'Male',
      birthdate: '',
      program: 'BCA',
      current_semester: 1,
      faculty: 'Computer Science',
      level: 'Bachelor',
      local_address: '',
      permanent_address: '',
      father_name: '',
      mother_name: '',
    },
  });

  const formatDateForInput = (value?: string | null) => {
    if (!value) return '';
    const normalized = String(value).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) return normalized;
    const parsed = new Date(normalized);
    if (Number.isNaN(parsed.getTime())) return '';
    return parsed.toISOString().split('T')[0];
  };

  // Populate form with existing data
  useEffect(() => {
    if (profile && isProfileData(profile)) {
      const { student, address, parents, academic_history } = profile;
      reset({
        college_enrollment_no: student.college_enrollment_no,
        name: student.name,
        gender: student.gender,
        religion: student.religion || '',
        birthdate: formatDateForInput(student.birthdate),
        faculty: student.faculty || 'Computer Science',
        tu_regd_no: student.tu_regd_no || '',
        level: student.level || 'Bachelor',
        symbol_no: student.symbol_no || '',
        mobile_no: student.mobile_no || '',
        email_id: student.email_id || '',
        residential_no: student.residential_no || '',
        program: student.program,
        current_semester: student.current_semester,
        local_address: address?.local_address || '',
        district: address?.district || '',
        state: address?.state || '',
        permanent_address: address?.permanent_address || '',
        father_name: parents?.father_name || '',
        father_occupation: parents?.father_occupation || '',
        father_mobile_no: parents?.father_mobile_no || '',
        mother_name: parents?.mother_name || '',
        mother_occupation: parents?.mother_occupation || '',
        mother_mobile_no: parents?.mother_mobile_no || '',
        guardian_name: parents?.guardian_name || '',
        guardian_occupation: parents?.guardian_occupation || '',
        guardian_mobile_no: parents?.guardian_mobile_no || '',
        guardian_relation: parents?.guardian_relation || '',
        slc_institution: academic_history?.slc_institution || '',
        slc_passed_year: academic_history?.slc_passed_year,
        slc_symbol_no: academic_history?.slc_symbol_no || '',
        slc_gpa: academic_history?.slc_gpa,
        hs_institution: academic_history?.hs_institution || '',
        hs_passed_year: academic_history?.hs_passed_year,
        hs_symbol_no: academic_history?.hs_symbol_no || '',
        hs_gpa: academic_history?.hs_gpa,
        major_subject: academic_history?.major_subject || '',
      });
      setPhotoPreview(student.photo_url || '');
    }
  }, [profile, reset]);

  const onInvalidSubmit = () => {
    toast.error('Please fix the highlighted fields and try again.');
  };

  useEffect(() => {
    return () => {
      if (photoPreview.startsWith('blob:')) {
        URL.revokeObjectURL(photoPreview);
      }
    };
  }, [photoPreview]);

  const handleLogout = async () => {
    await logout();
    navigateTo({ page: 'login' });
  };

  const handlePhotoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setPhotoError('');

    if (!file) {
      setPhotoFile(null);
      setPhotoPreview(isProfileData(profile) ? profile.student.photo_url || '' : '');
      return;
    }

    if (!file.type.startsWith('image/')) {
      setPhotoError('Only image files are allowed');
      setPhotoFile(null);
      event.target.value = '';
      return;
    }

    if (file.size > MAX_STUDENT_PHOTO_SIZE_BYTES) {
      setPhotoError('Photo must be 2MB or smaller');
      setPhotoFile(null);
      event.target.value = '';
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setPhotoFile(file);
    setPhotoPreview(previewUrl);
  };

  const optionalNumber = (value: unknown) => {
    if (value === '' || value === null || typeof value === 'undefined') {
      return undefined;
    }
    const parsed = Number(value);
    return Number.isNaN(parsed) ? undefined : parsed;
  };

  const onSubmit = async (rawData: unknown) => {
    try {
      const data = studentFormSchema.parse(rawData);
      if (!effectiveStudentId) {
        toast.error('Student ID is missing. Please reload and try again.');
        return;
      }

      let photoUrl = isProfileData(profile) ? profile.student.photo_url || '' : '';
      if (photoFile) {
        try {
          photoUrl = await uploadStudentPhoto(photoFile, data.college_enrollment_no);
        } catch (photoError) {
          const message = handleError(photoError).message || 'Photo upload failed';
          toast.error(`${message}. Student will be updated without changing photo.`);
        }
      }

      const studentData: Record<string, unknown> = {
        college_enrollment_no: data.college_enrollment_no,
        name: data.name,
        gender: data.gender,
        religion: data.religion,
        birthdate: data.birthdate,
        faculty: data.faculty,
        tu_regd_no: data.tu_regd_no,
        level: data.level,
        symbol_no: data.symbol_no,
        mobile_no: data.mobile_no,
        email_id: data.email_id,
        residential_no: data.residential_no,
        program: data.program,
        current_semester: data.current_semester,
      };

      // Keep old flow compatible: only send photo field when relevant.
      if (photoFile) {
        studentData.photo_url = photoUrl;
      } else if (isProfileData(profile) && Object.prototype.hasOwnProperty.call(profile.student, 'photo_url')) {
        studentData.photo_url = profile.student.photo_url || null;
      }

      await updateStudent.mutateAsync({
        id: effectiveStudentId,
        data: {
          student: studentData,
          address: {
            local_address: data.local_address,
            district: data.district,
            state: data.state,
            permanent_address: data.permanent_address,
          },
          parents: {
            father_name: data.father_name,
            father_occupation: data.father_occupation,
            father_mobile_no: data.father_mobile_no,
            mother_name: data.mother_name,
            mother_occupation: data.mother_occupation,
            mother_mobile_no: data.mother_mobile_no,
            guardian_name: data.guardian_name,
            guardian_occupation: data.guardian_occupation,
            guardian_mobile_no: data.guardian_mobile_no,
            guardian_relation: data.guardian_relation,
          },
          academicHistory: {
            slc_institution: data.slc_institution,
            slc_passed_year: data.slc_passed_year,
            slc_symbol_no: data.slc_symbol_no,
            slc_gpa: data.slc_gpa,
            hs_institution: data.hs_institution,
            hs_passed_year: data.hs_passed_year,
            hs_symbol_no: data.hs_symbol_no,
            hs_gpa: data.hs_gpa,
            major_subject: data.major_subject,
          },
        },
      });

      toast.success('Student updated successfully');
      navigateTo({
        page: 'student-profile',
        studentId: effectiveStudentId,
        studentName: data.name,
      });
    } catch (error) {
      const message = handleError(error).message || 'Failed to update student';
      toast.error(message);
    }
  };

  if (isLoading) {
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
          <Skeleton className="h-96 w-full" />
        </main>
      </div>
    );
  }

  if (isProfileError || (!isDirectUuid && !isResolvingStudentId && !effectiveStudentId)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground font-medium">Unable to open student details</p>
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

  if (!profile) {
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
                onClick={() =>
                  navigateTo({
                    page: 'student-profile',
                    studentId: effectiveStudentId,
                    studentName: isProfileData(profile) ? profile.student.name : undefined,
                  })
                }
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
              <img src={logo} alt="Janamaitri Logo" className="h-10 w-auto" />
              <div className="min-w-0">
                <h1 className="text-base sm:text-lg font-bold text-foreground truncate">Edit Student</h1>
                <p className="text-xs text-muted-foreground hidden sm:block">Janamaitri Multiple Campus, Department of ICT, Student Record</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateTo({ page: 'dashboard' })}
              >
                <Home className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Home</span>
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

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit(onSubmit, onInvalidSubmit)} className="space-y-6">
          {/* Personal Details */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                <CardTitle className="text-lg text-foreground">Personal Details</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="college_enrollment_no">College Enrollment No *</Label>
                  <Input
                    id="college_enrollment_no"
                    {...register('college_enrollment_no')}
                    className={errors.college_enrollment_no ? 'border-red-500' : ''}
                  />
                  {errors.college_enrollment_no && (
                    <p className="text-sm text-red-500">{String(errors.college_enrollment_no.message)}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    {...register('name')}
                    className={errors.name ? 'border-red-500' : ''}
                  />
                  {errors.name && (
                    <p className="text-sm text-red-500">{String(errors.name.message)}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gender">Gender *</Label>
                  <Select 
                    value={watch('gender')} 
                    onValueChange={(v) => setValue('gender', v as 'Male' | 'Female' | 'Other', { shouldValidate: true, shouldDirty: true })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="photo">Student Photo</Label>
                  <Input
                    id="photo"
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                  />
                  <p className="text-xs text-muted-foreground">Max file size: 2MB</p>
                  {photoError && (
                    <p className="text-sm text-red-500">{photoError}</p>
                  )}
                  {photoPreview ? (
                    <div className="w-16 h-16 rounded-full overflow-hidden border border-border">
                      <img src={photoPreview} alt="Student preview" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                      <Camera className="w-6 h-6 text-muted-foreground/70" />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="birthdate">Birthdate *</Label>
                  <Input
                    id="birthdate"
                    type="date"
                    {...register('birthdate')}
                    className={errors.birthdate ? 'border-red-500' : ''}
                  />
                  {errors.birthdate && (
                    <p className="text-sm text-red-500">{String(errors.birthdate.message)}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="religion">Religion</Label>
                  <Input id="religion" {...register('religion')} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="program">Program *</Label>
                  <Select 
                    value={watch('program')} 
                    onValueChange={(v) => setValue('program', v as 'BCA' | 'BICTE', { shouldValidate: true, shouldDirty: true })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BCA">BCA</SelectItem>
                      <SelectItem value="BICTE">BICTE</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="current_semester">Current Semester *</Label>
                  <Select 
                    value={String(watch('current_semester'))} 
                    onValueChange={(v) => setValue('current_semester', parseInt(v, 10), { shouldValidate: true, shouldDirty: true })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 8 }, (_, i) => (
                        <SelectItem key={i + 1} value={String(i + 1)}>
                          {i + 1}{['st', 'nd', 'rd', 'th', 'th', 'th', 'th', 'th'][i]} Semester
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tu_regd_no">TU Registration No</Label>
                  <Input id="tu_regd_no" {...register('tu_regd_no')} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="symbol_no">Symbol No</Label>
                  <Input id="symbol_no" {...register('symbol_no')} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mobile_no">Mobile No</Label>
                  <Input id="mobile_no" {...register('mobile_no')} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email_id">Email ID</Label>
                  <Input id="email_id" type="email" {...register('email_id')} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="residential_no">Residential No</Label>
                  <Input id="residential_no" {...register('residential_no')} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Address Details */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-secondary" />
                <CardTitle className="text-lg text-foreground">Address Details</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="local_address">Local Address *</Label>
                  <Input
                    id="local_address"
                    {...register('local_address')}
                    className={errors.local_address ? 'border-red-500' : ''}
                  />
                  {errors.local_address && (
                    <p className="text-sm text-red-500">{String(errors.local_address.message)}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="district">District</Label>
                  <Input id="district" {...register('district')} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input id="state" {...register('state')} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="permanent_address">Permanent Address *</Label>
                  <Input
                    id="permanent_address"
                    {...register('permanent_address')}
                    className={errors.permanent_address ? 'border-red-500' : ''}
                  />
                  {errors.permanent_address && (
                    <p className="text-sm text-red-500">{String(errors.permanent_address.message)}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Parent Details */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-600" />
                <CardTitle className="text-lg text-foreground">Parent & Guardian Details</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Father */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-foreground">Father</h4>
                  <div className="space-y-2">
                    <Label htmlFor="father_name">Name *</Label>
                    <Input
                      id="father_name"
                      {...register('father_name')}
                      className={errors.father_name ? 'border-red-500' : ''}
                    />
                    {errors.father_name && (
                      <p className="text-sm text-red-500">{String(errors.father_name.message)}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="father_occupation">Occupation</Label>
                    <Input id="father_occupation" {...register('father_occupation')} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="father_mobile_no">Mobile No</Label>
                    <Input id="father_mobile_no" {...register('father_mobile_no')} />
                  </div>
                </div>

                {/* Mother */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-foreground">Mother</h4>
                  <div className="space-y-2">
                    <Label htmlFor="mother_name">Name *</Label>
                    <Input
                      id="mother_name"
                      {...register('mother_name')}
                      className={errors.mother_name ? 'border-red-500' : ''}
                    />
                    {errors.mother_name && (
                      <p className="text-sm text-red-500">{String(errors.mother_name.message)}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mother_occupation">Occupation</Label>
                    <Input id="mother_occupation" {...register('mother_occupation')} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mother_mobile_no">Mobile No</Label>
                    <Input id="mother_mobile_no" {...register('mother_mobile_no')} />
                  </div>
                </div>

                {/* Guardian */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-foreground">Local Guardian</h4>
                  <div className="space-y-2">
                    <Label htmlFor="guardian_name">Name</Label>
                    <Input id="guardian_name" {...register('guardian_name')} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="guardian_relation">Relation</Label>
                    <Input id="guardian_relation" {...register('guardian_relation')} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="guardian_occupation">Occupation</Label>
                    <Input id="guardian_occupation" {...register('guardian_occupation')} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="guardian_mobile_no">Mobile No</Label>
                    <Input id="guardian_mobile_no" {...register('guardian_mobile_no')} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Academic History */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-orange-600" />
                <CardTitle className="text-lg text-foreground">Academic History</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* SLC/SEE */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-foreground">SLC / SEE</h4>
                  <div className="space-y-2">
                    <Label htmlFor="slc_institution">Institution</Label>
                    <Input id="slc_institution" {...register('slc_institution')} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="slc_passed_year">Passed Year</Label>
                    <Input 
                      id="slc_passed_year" 
                      type="number"
                      {...register('slc_passed_year', { setValueAs: optionalNumber })} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="slc_symbol_no">Symbol No</Label>
                    <Input id="slc_symbol_no" {...register('slc_symbol_no')} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="slc_gpa">GPA</Label>
                    <Input 
                      id="slc_gpa" 
                      type="number"
                      step="0.01"
                      min="0"
                      max="4"
                      {...register('slc_gpa', { setValueAs: optionalNumber })} 
                    />
                  </div>
                </div>

                {/* Higher Secondary */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-foreground">Higher Secondary (+2)</h4>
                  <div className="space-y-2">
                    <Label htmlFor="hs_institution">Institution</Label>
                    <Input id="hs_institution" {...register('hs_institution')} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hs_passed_year">Passed Year</Label>
                    <Input 
                      id="hs_passed_year" 
                      type="number"
                      {...register('hs_passed_year', { setValueAs: optionalNumber })} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hs_symbol_no">Symbol No</Label>
                    <Input id="hs_symbol_no" {...register('hs_symbol_no')} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hs_gpa">GPA</Label>
                    <Input 
                      id="hs_gpa" 
                      type="number"
                      step="0.01"
                      min="0"
                      max="4"
                      {...register('hs_gpa', { setValueAs: optionalNumber })} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="major_subject">Major Subject</Label>
                    <Input id="major_subject" {...register('major_subject')} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submit Buttons */}
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 sm:gap-4">
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() =>
                navigateTo({
                  page: 'student-profile',
                  studentId: effectiveStudentId,
                  studentName: isProfileData(profile) ? profile.student.name : undefined,
                })
              }
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-primary hover:bg-primary/90 w-full sm:w-auto"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Update Student
                </>
              )}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
