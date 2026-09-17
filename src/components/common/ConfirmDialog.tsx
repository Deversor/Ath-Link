import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ConfirmDialogProps {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'default';
  isLoading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export default function ConfirmDialog({
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  isLoading = false,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-xl bg-white shadow-xl p-6">
        {variant === 'danger' && (
          <div className="w-11 h-11 rounded-full bg-red-100 flex items-center justify-center mb-3">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
        )}
        <h3 className="font-semibold text-neutral-900 mb-1">{title}</h3>
        <p className="text-sm text-neutral-500 mb-5">{description}</p>
        <div className="flex gap-3">
          <Button
            type="button"
            className={`flex-1 ${variant === 'danger' ? 'bg-red-600 hover:bg-red-700' : 'bg-orange-500 hover:bg-orange-600'}`}
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? 'Please wait…' : confirmLabel}
          </Button>
          <Button type="button" variant="outline" className="flex-1" onClick={onClose} disabled={isLoading}>
            {cancelLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
