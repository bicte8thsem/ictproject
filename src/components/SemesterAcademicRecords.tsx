// ============================================
// SEMESTER ACADEMIC RECORDS COMPONENT
// ============================================

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { 
  useAssignmentRecords, 
  usePresentationRecords, 
  useExamRecords,
  useUpsertAssignmentRecord,
  useUpsertPresentationRecord,
  useUpsertExamRecord
} from '@/hooks/useApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, Presentation, ClipboardList, Save, X, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import type { Subject, ProgramType, AssignmentRecord, PresentationRecord, ExamRecord } from '@/types';

interface SemesterAcademicRecordsProps {
  studentId: string;
  semester: number;
  program: ProgramType;
  subjects: Subject[];
}

interface FormData {
  due_date?: string;
  submitted_date?: string;
  evaluation?: number;
  signature?: string;
  remarks?: string;
  topic?: string;
  presented_date?: string;
  exam_date?: string;
  internal_marks?: number;
  practical_marks?: number;
  viva_marks?: number;
}

function toOptionalString(value?: string) {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function toOptionalNumber(value?: number) {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string' && message.trim().length > 0) return message;
  }
  return 'Failed to save record';
}

export function SemesterAcademicRecords({ 
  studentId, 
  semester, 
  subjects 
}: SemesterAcademicRecordsProps) {
  const [editingRecord, setEditingRecord] = useState<{
    type: 'assignment1' | 'assignment2' | 'presentation' | 'mid-session' | 'preboard';
    subjectId: string;
    record?: AssignmentRecord | PresentationRecord | ExamRecord;
  } | null>(null);

  const { data: assignmentRecords } = useAssignmentRecords(studentId, semester);
  const { data: presentationRecords } = usePresentationRecords(studentId, semester);
  const { data: examRecords } = useExamRecords(studentId, semester);

  const upsertAssignment = useUpsertAssignmentRecord(studentId, semester);
  const upsertPresentation = useUpsertPresentationRecord(studentId, semester);
  const upsertExam = useUpsertExamRecord(studentId, semester);

  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<FormData>();

  useEffect(() => {
    if (editingRecord?.record) {
      const record = editingRecord.record;
      reset({
        due_date: (record as AssignmentRecord).due_date ?? '',
        submitted_date: (record as AssignmentRecord).submitted_date ?? '',
        evaluation: record.evaluation ?? undefined,
        signature: record.signature ?? '',
        remarks: record.remarks ?? '',
        topic: (record as PresentationRecord).topic ?? '',
        presented_date: (record as PresentationRecord).presented_date ?? '',
        exam_date: (record as ExamRecord).exam_date ?? '',
        internal_marks: (record as ExamRecord).internal_marks ?? undefined,
        practical_marks: (record as ExamRecord).practical_marks ?? undefined,
        viva_marks: (record as ExamRecord).viva_marks ?? undefined,
      });
    } else {
      reset({});
    }
  }, [editingRecord, reset]);

  const getAssignmentRecord = (subjectId: string, assignmentNumber: number): AssignmentRecord | undefined => {
    return assignmentRecords?.find(
      r => r.subject_id === subjectId && r.assignment_number === assignmentNumber
    );
  };

  const getPresentationRecord = (subjectId: string): PresentationRecord | undefined => {
    return presentationRecords?.find(r => r.subject_id === subjectId);
  };

  const getExamRecord = (subjectId: string, examType: 'Mid-Session' | 'PreBoard'): ExamRecord | undefined => {
    return examRecords?.find(r => r.subject_id === subjectId && r.exam_type === examType);
  };

  const onSubmit = async (data: FormData) => {
    if (!editingRecord) return;

    try {
      const baseData = {
        student_id: studentId,
        subject_id: editingRecord.subjectId,
        semester,
        signature: toOptionalString(data.signature),
        remarks: toOptionalString(data.remarks),
      };

      if (editingRecord.type === 'assignment1' || editingRecord.type === 'assignment2') {
        await upsertAssignment.mutateAsync({
          ...baseData,
          evaluation: toOptionalNumber(data.evaluation),
          assignment_number: editingRecord.type === 'assignment1' ? 1 : 2,
          due_date: toOptionalString(data.due_date),
          submitted_date: toOptionalString(data.submitted_date),
        });
        toast.success('Assignment record saved successfully');
      } else if (editingRecord.type === 'presentation') {
        await upsertPresentation.mutateAsync({
          ...baseData,
          evaluation: toOptionalNumber(data.evaluation),
          topic: toOptionalString(data.topic),
          presented_date: toOptionalString(data.presented_date),
        });
        toast.success('Presentation record saved successfully');
      } else {
        await upsertExam.mutateAsync({
          ...baseData,
          exam_type: editingRecord.type === 'mid-session' ? 'Mid-Session' : 'PreBoard',
          exam_date: toOptionalString(data.exam_date),
          internal_marks: toOptionalNumber(data.internal_marks),
          practical_marks: toOptionalNumber(data.practical_marks),
          viva_marks: toOptionalNumber(data.viva_marks),
        });
        toast.success('Exam record saved successfully');
      }

      setEditingRecord(null);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const getEvaluationBadge = (evaluation?: number | null) => {
    if (evaluation === undefined || evaluation === null) return <span className="text-muted-foreground/70">-</span>;
    if (evaluation >= 80) return <Badge className="bg-secondary/10 text-secondary">{evaluation}</Badge>;
    if (evaluation >= 60) return <Badge className="bg-primary/10 text-primary">{evaluation}</Badge>;
    if (evaluation >= 40) return <Badge className="bg-yellow-100 text-yellow-700">{evaluation}</Badge>;
    return <Badge className="bg-red-100 text-red-700">{evaluation}</Badge>;
  };

  const getActionLabel = (hasRecord: boolean) => (hasRecord ? 'Edit' : 'Add');

  const renderRecordDialog = () => {
    if (!editingRecord) return null;

    const subject = subjects.find(s => s.id === editingRecord.subjectId);
    const isAssignment = editingRecord.type === 'assignment1' || editingRecord.type === 'assignment2';
    const isPresentation = editingRecord.type === 'presentation';
    const isExam = editingRecord.type === 'mid-session' || editingRecord.type === 'preboard';

    return (
      <Dialog open={!!editingRecord} onOpenChange={() => setEditingRecord(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {isAssignment && <FileText className="w-5 h-5 text-primary" />}
              {isPresentation && <Presentation className="w-5 h-5 text-purple-600" />}
              {isExam && <ClipboardList className="w-5 h-5 text-secondary" />}
              {isAssignment && `Assignment ${editingRecord.type === 'assignment1' ? '1' : '2'}`}
              {isPresentation && 'Presentation'}
              {isExam && `${editingRecord.type === 'mid-session' ? 'Mid-Session' : 'PreBoard'} Exam`}
            </DialogTitle>
          </DialogHeader>
          
          <div className="mb-4 p-3 bg-background rounded-lg">
            <p className="text-sm text-muted-foreground">Subject</p>
            <p className="font-medium text-foreground">{subject?.code}: {subject?.name}</p>
          </div>

          <ScrollArea className="max-h-[60vh]">
            <form id="record-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4 pr-4">
              {isAssignment && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Due Date</Label>
                      <Input type="date" {...register('due_date')} />
                    </div>
                    <div className="space-y-2">
                      <Label>Submitted Date</Label>
                      <Input type="date" {...register('submitted_date')} />
                    </div>
                  </div>
                </>
              )}

              {isPresentation && (
                <>
                  <div className="space-y-2">
                    <Label>Topic</Label>
                    <Input {...register('topic')} placeholder="Enter presentation topic" />
                  </div>
                  <div className="space-y-2">
                    <Label>Presented Date</Label>
                    <Input type="date" {...register('presented_date')} />
                  </div>
                </>
              )}

              {isExam && (
                <>
                  <div className="space-y-2">
                    <Label>Exam Date</Label>
                    <Input type="date" {...register('exam_date')} />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Internal Marks</Label>
                      <Input 
                        type="number" 
                        step="0.01"
                        min="0"
                        max="100"
                        {...register('internal_marks', { valueAsNumber: true })} 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Practical Marks</Label>
                      <Input 
                        type="number" 
                        step="0.01"
                        min="0"
                        {...register('practical_marks', { valueAsNumber: true })} 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>VIVA Marks</Label>
                      <Input 
                        type="number" 
                        step="0.01"
                        min="0"
                        {...register('viva_marks', { valueAsNumber: true })} 
                      />
                    </div>
                  </div>
                </>
              )}

              {!isExam && (
                <div className="space-y-2">
                  <Label>Evaluation / Marks</Label>
                  <Input 
                    type="number" 
                    step="0.01"
                    min="0"
                    max="100"
                    {...register('evaluation', { valueAsNumber: true })} 
                    placeholder="Enter evaluation score"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label>Signature</Label>
                <Input {...register('signature')} placeholder="Enter signature" />
              </div>

              <div className="space-y-2">
                <Label>Remarks</Label>
                <Input {...register('remarks')} placeholder="Enter remarks" />
              </div>
            </form>
          </ScrollArea>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingRecord(null)}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button 
              type="submit" 
              form="record-form"
              disabled={isSubmitting}
              className="bg-primary hover:bg-primary/90"
            >
              {isSubmitting ? (
                <>
                  <Save className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Record
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="assignments" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="assignments" className="text-xs sm:text-sm">
            <FileText className="w-4 h-4 mr-2 hidden sm:inline" />
            Assignments
          </TabsTrigger>
          <TabsTrigger value="presentations" className="text-xs sm:text-sm">
            <Presentation className="w-4 h-4 mr-2 hidden sm:inline" />
            Presentations
          </TabsTrigger>
          <TabsTrigger value="mid-session" className="text-xs sm:text-sm">
            <ClipboardList className="w-4 h-4 mr-2 hidden sm:inline" />
            Mid-Session
          </TabsTrigger>
          <TabsTrigger value="preboard" className="text-xs sm:text-sm">
            <CheckCircle className="w-4 h-4 mr-2 hidden sm:inline" />
            PreBoard
          </TabsTrigger>
        </TabsList>

        {/* Assignments Tab */}
        <TabsContent value="assignments">
          <div className="rounded-md border bg-card overflow-hidden">
            <div className="px-4 py-3 border-b">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Assignment Records
              </h3>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-background">
                    <TableHead className="w-12">SN</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead className="text-center">Assignment 1</TableHead>
                    <TableHead className="text-center">Assignment 2</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subjects.map((subject, index) => {
                    const assignment1 = getAssignmentRecord(subject.id, 1);
                    const assignment2 = getAssignmentRecord(subject.id, 2);
                    
                    return (
                      <TableRow key={subject.id}>
                        <TableCell className="font-medium">{index + 1}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-foreground">{subject.name}</p>
                            <p className="text-xs text-muted-foreground">{subject.code}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-2">
                            {getEvaluationBadge(assignment1?.evaluation)}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setEditingRecord({ 
                                type: 'assignment1', 
                                subjectId: subject.id,
                                record: assignment1
                              })}
                            >
                              {getActionLabel(!!assignment1)}
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-2">
                            {getEvaluationBadge(assignment2?.evaluation)}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setEditingRecord({ 
                                type: 'assignment2', 
                                subjectId: subject.id,
                                record: assignment2
                              })}
                            >
                              {getActionLabel(!!assignment2)}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>

        {/* Presentations Tab */}
        <TabsContent value="presentations">
          <div className="rounded-md border bg-card overflow-hidden">
            <div className="px-4 py-3 border-b">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Presentation className="w-5 h-5 text-primary" />
                Presentation Records
              </h3>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-background">
                    <TableHead className="w-12">SN</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Topic</TableHead>
                    <TableHead>Presented Date</TableHead>
                    <TableHead className="text-center">Evaluation</TableHead>
                    <TableHead className="w-24">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subjects.map((subject, index) => {
                    const record = getPresentationRecord(subject.id);
                    
                    return (
                      <TableRow key={subject.id}>
                        <TableCell className="font-medium">{index + 1}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-foreground">{subject.name}</p>
                            <p className="text-xs text-muted-foreground">{subject.code}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{record?.topic || '-'}</TableCell>
                        <TableCell className="text-muted-foreground">{record?.presented_date || '-'}</TableCell>
                        <TableCell className="text-center">
                          {getEvaluationBadge(record?.evaluation)}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingRecord({ 
                              type: 'presentation', 
                              subjectId: subject.id,
                              record
                            })}
                          >
                            {getActionLabel(!!record)}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>

        {/* Mid-Session Tab */}
        <TabsContent value="mid-session">
          <div className="rounded-md border bg-card overflow-hidden">
            <div className="px-4 py-3 border-b">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-secondary" />
                Mid-Session Examination
              </h3>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-background">
                    <TableHead className="w-12">SN</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Exam Date</TableHead>
                    <TableHead className="text-center">Internal</TableHead>
                    <TableHead className="text-center">Practical</TableHead>
                    <TableHead className="text-center">VIVA</TableHead>
                    <TableHead className="w-24">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subjects.map((subject, index) => {
                    const record = getExamRecord(subject.id, 'Mid-Session');
                    
                    return (
                      <TableRow key={subject.id}>
                        <TableCell className="font-medium">{index + 1}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-foreground">{subject.name}</p>
                            <p className="text-xs text-muted-foreground">{subject.code}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{record?.exam_date || '-'}</TableCell>
                        <TableCell className="text-center">{record?.internal_marks ?? '-'}</TableCell>
                        <TableCell className="text-center">{record?.practical_marks ?? '-'}</TableCell>
                        <TableCell className="text-center">{record?.viva_marks ?? '-'}</TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingRecord({ 
                              type: 'mid-session', 
                              subjectId: subject.id,
                              record
                            })}
                          >
                            {getActionLabel(!!record)}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>

        {/* PreBoard Tab */}
        <TabsContent value="preboard">
          <div className="rounded-md border bg-card overflow-hidden">
            <div className="px-4 py-3 border-b">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-orange-600" />
                PreBoard Examination
              </h3>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-background">
                    <TableHead className="w-12">SN</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Exam Date</TableHead>
                    <TableHead className="text-center">Internal</TableHead>
                    <TableHead className="text-center">Practical</TableHead>
                    <TableHead className="text-center">VIVA</TableHead>
                    <TableHead className="w-24">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subjects.map((subject, index) => {
                    const record = getExamRecord(subject.id, 'PreBoard');
                    
                    return (
                      <TableRow key={subject.id}>
                        <TableCell className="font-medium">{index + 1}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-foreground">{subject.name}</p>
                            <p className="text-xs text-muted-foreground">{subject.code}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{record?.exam_date || '-'}</TableCell>
                        <TableCell className="text-center">{record?.internal_marks ?? '-'}</TableCell>
                        <TableCell className="text-center">{record?.practical_marks ?? '-'}</TableCell>
                        <TableCell className="text-center">{record?.viva_marks ?? '-'}</TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingRecord({ 
                              type: 'preboard', 
                              subjectId: subject.id,
                              record
                            })}
                          >
                            {getActionLabel(!!record)}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {renderRecordDialog()}
    </div>
  );
}
