import { useEffect, useState } from 'react';
import {
  FileText,
  Clock,
  CheckCircle2,
  Activity,
  GraduationCap,
  Trophy,
  User as UserIcon,
  Upload,
} from 'lucide-react';
import PortalLayout from '../../components/layout/PortalLayout';
import PortalHero from '../../components/layout/PortalHero';
import { useAuthStore } from '../../store/useAuthStore';
import { supabase } from '../../lib/supabase';
import { Button } from '@/components/ui/button';

const DEADLINE = new Date('2026-05-15');

const REQUIRED_DOCS = [
  { type: 'medical_clearance', label: 'Medical Clearance Certificate', icon: Activity },
  { type: 'academic_record', label: 'Academic Record / Grade Sheet', icon: GraduationCap },
  { type: 'parental_consent', label: 'Parental Consent Form', icon: FileText },
  { type: 'eligibility_form', label: 'Sports Eligibility Form', icon: Trophy },
  { type: 'id_photo', label: 'ID Photo (2x2)', icon: UserIcon },
] as const;

interface DocRow {
  doc_type: string;
  status: string;
}

export default function DocumentsPage() {
  const { user, profile } = useAuthStore();
  const [docs, setDocs] = useState<DocRow[]>([]);
  const [uploadingType, setUploadingType] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);

  const loadDocs = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('document_submissions')
      .select('doc_type, status')
      .eq('user_id', user.id);
    setDocs(data ?? []);
  };

  useEffect(() => {
    loadDocs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const isUploaded = (type: string) => docs.some((d) => d.doc_type === type && d.status !== 'missing');
  const uploadedCount = REQUIRED_DOCS.filter((d) => isUploaded(d.type)).length;

  const daysRemaining = Math.max(
    0,
    Math.ceil((DEADLINE.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  );

  const handleUpload = async (docType: string, file: File | undefined) => {
    if (!file || !user) return;
    setUploadError(null);

    if (file.type !== 'application/pdf') {
      setUploadError('Only PDF files are accepted.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Maximum file size is 5MB per document.');
      return;
    }

    setUploadingType(docType);
    const path = `${user.id}/${docType}.pdf`;

    const { error: uploadErr } = await supabase.storage
      .from('documents')
      .upload(path, file, { upsert: true });

    if (uploadErr) {
      setUploadError(uploadErr.message);
      setUploadingType(null);
      return;
    }

    await supabase.from('document_submissions').upsert(
      {
        user_id: user.id,
        doc_type: docType,
        file_path: path,
        status: 'uploaded',
        uploaded_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,doc_type' }
    );

    await loadDocs();
    setUploadingType(null);
  };

  const handleSubmit = () => {
    // No coach-review workflow is built yet — this just confirms locally
    // that everything required has been uploaded.
    setSubmitMessage('Documents submitted for coach review!');
  };

  return (
    <PortalLayout>
      <PortalHero profile={profile} />

      <div className="bg-white border border-neutral-200 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-1">
          <FileText className="w-4 h-4 text-orange-500" />
          <h2 className="font-semibold text-neutral-900">Required Documents</h2>
        </div>
        <p className="text-sm text-neutral-500 mb-4">
          Upload the documents required by your coach. All files must be in PDF format.
        </p>

        <div className="flex items-center gap-3 rounded-lg bg-orange-50 border border-orange-100 px-4 py-3 mb-4">
          <Clock className="w-8 h-8 text-orange-500 shrink-0" />
          <div>
            <p className="text-sm font-medium text-orange-800">
              Submission Deadline: {DEADLINE.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
            <p className="text-xs text-orange-700">
              {daysRemaining} days remaining · Don't miss the deadline!
            </p>
          </div>
        </div>

        <div className="rounded-lg bg-blue-50 border border-blue-100 px-4 py-3 mb-5">
          <p className="flex items-center gap-1.5 text-sm font-medium text-blue-800 mb-1.5">
            <CheckCircle2 className="w-4 h-4" />
            Coach Requirements:
          </p>
          <ul className="list-disc list-inside text-sm text-blue-700 space-y-0.5">
            {REQUIRED_DOCS.map((d) => (
              <li key={d.type}>{d.label}</li>
            ))}
          </ul>
        </div>

        <h3 className="text-sm font-semibold text-neutral-800 mb-2 flex items-center gap-1.5">
          <Upload className="w-4 h-4" />
          Upload Required Documents
        </h3>

        <div className="space-y-2 mb-4">
          {REQUIRED_DOCS.map(({ type, label, icon: Icon }) => {
            const uploaded = isUploaded(type);
            return (
              <div
                key={type}
                className="flex items-center justify-between px-3 py-2.5 rounded-lg border border-neutral-100 bg-neutral-50"
              >
                <span className="flex items-center gap-2 text-sm text-neutral-700">
                  <Icon className="w-4 h-4 text-neutral-400" />
                  {label} *
                </span>

                <label>
                  <input
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={(e) => handleUpload(type, e.target.files?.[0])}
                  />
                  <span
                    className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg cursor-pointer transition-colors ${
                      uploaded
                        ? 'bg-green-100 text-green-700'
                        : 'bg-orange-500 text-white hover:bg-orange-600'
                    }`}
                  >
                    {uploadingType === type ? (
                      'Uploading…'
                    ) : uploaded ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" /> Uploaded
                      </>
                    ) : (
                      <>
                        <Upload className="w-3.5 h-3.5" /> Upload
                      </>
                    )}
                  </span>
                </label>
              </div>
            );
          })}
        </div>

        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mb-2">
          Note: Only PDF files are accepted. Maximum file size: 5MB per document.
        </p>

        {uploadError && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-2">
            {uploadError}
          </p>
        )}

        {uploadedCount < 5 && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-4">
            All 5 required documents must be uploaded before submitting.
          </p>
        )}

        {submitMessage && (
          <p className="text-sm text-green-700 bg-green-50 border border-green-100 rounded-lg px-3 py-2 mb-4">
            {submitMessage}
          </p>
        )}

        <Button
          type="button"
          disabled={uploadedCount < 5}
          onClick={handleSubmit}
          className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-200"
        >
          <Upload className="w-4 h-4 mr-2" />
          Submit
        </Button>
      </div>

      {/* Submission status */}
      <div className="bg-white border border-neutral-200 rounded-xl p-6">
        <h2 className="font-semibold text-neutral-900 mb-3">Submission Status</h2>
        <div className="flex items-center justify-between rounded-lg bg-blue-50 border border-blue-100 px-4 py-3">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" />
            <div>
              <p className="text-sm font-medium text-blue-800">Documents Ready</p>
              <p className="text-xs text-blue-700">{uploadedCount} of 5 required documents uploaded</p>
            </div>
          </div>
          <span className="text-xs font-semibold border border-blue-200 text-blue-700 rounded-full px-2 py-0.5">
            {uploadedCount}/5
          </span>
        </div>
      </div>
    </PortalLayout>
  );
}
