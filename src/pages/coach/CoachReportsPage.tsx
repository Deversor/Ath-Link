import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FileText } from 'lucide-react';
import CoachPortalLayout from '../../components/layout/CoachPortalLayout';
import { useAuthStore } from '../../store/useAuthStore';
import { supabase } from '../../lib/supabase';
import { reportSchema, type ReportValues } from '../../lib/schemas/reportSchema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function CoachReportsPage() {
  const { user } = useAuthStore();
  const [files, setFiles] = useState<FileList | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ReportValues>({ resolver: zodResolver(reportSchema) });

  const onSubmit = async (values: ReportValues) => {
    if (!user) return;
    setSubmitError(null);
    setSubmitSuccess(false);

    const attachmentPaths: string[] = [];

    if (files) {
      for (const file of Array.from(files)) {
        const path = `${user.id}/${Date.now()}-${file.name}`;
        const { error: uploadErr } = await supabase.storage.from('reports').upload(path, file);
        if (uploadErr) {
          setSubmitError(uploadErr.message);
          return;
        }
        attachmentPaths.push(path);
      }
    }

    const { error } = await supabase.from('coach_reports').insert({
      coach_id: user.id,
      title: values.title,
      content: values.content,
      attachment_paths: attachmentPaths,
    });

    if (error) {
      setSubmitError(error.message);
      return;
    }

    setSubmitSuccess(true);
    reset();
    setFiles(null);
  };

  return (
    <CoachPortalLayout>
      <div className="bg-white border border-neutral-200 rounded-xl p-6 max-w-2xl">
        <h1 className="text-lg font-bold text-neutral-900 mb-1">Submit Report</h1>
        <p className="text-sm text-neutral-500 mb-5">Submit training reports and updates to administration</p>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <div>
            <Label htmlFor="title" className="mb-1.5 block">
              Report Title
            </Label>
            <Input id="title" placeholder="e.g., Monthly Training Report" {...register('title')} />
            {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title.message}</p>}
          </div>

          <div>
            <Label htmlFor="content" className="mb-1.5 block">
              Report Content
            </Label>
            <textarea
              id="content"
              rows={5}
              placeholder="Enter report details..."
              className="w-full px-3 py-2.5 rounded-lg bg-neutral-100 border border-transparent focus:border-orange-500 focus:bg-white outline-none text-sm transition-colors resize-none"
              {...register('content')}
            />
            {errors.content && <p className="mt-1 text-xs text-red-600">{errors.content.message}</p>}
          </div>

          <div>
            <Label htmlFor="attachments" className="mb-1.5 block">
              Attachments (Photos/Documents)
            </Label>
            <input
              id="attachments"
              type="file"
              multiple
              onChange={(e) => setFiles(e.target.files)}
              className="w-full text-sm px-3 py-2.5 rounded-lg bg-neutral-100 border border-transparent file:mr-3 file:px-3 file:py-1.5 file:rounded-lg file:border-0 file:bg-orange-500 file:text-white file:text-xs"
            />
          </div>

          {submitError && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {submitError}
            </p>
          )}
          {submitSuccess && (
            <p className="text-sm text-green-700 bg-green-50 border border-green-100 rounded-lg px-3 py-2">
              Report submitted to administration.
            </p>
          )}

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300"
          >
            <FileText className="w-4 h-4 mr-2" />
            {isSubmitting ? 'Submitting…' : 'Submit Report'}
          </Button>
        </form>
      </div>
    </CoachPortalLayout>
  );
}
