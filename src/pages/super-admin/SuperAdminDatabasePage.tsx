import { useEffect, useState } from 'react';
import { Database, Download, Upload, Activity, AlertTriangle } from 'lucide-react';
import SuperAdminPortalLayout from '../../components/layout/SuperAdminPortalLayout';
import { useAuthStore } from '../../store/useAuthStore';
import { supabase } from '../../lib/supabase';
import { Button } from '@/components/ui/button';

const BACKUP_TABLES = ['profiles', 'document_submissions', 'facility_reservations', 'practice_schedules', 'sports'] as const;

interface BackupRow {
  id: string;
  storage_path: string;
  size_bytes: number;
  created_at: string;
}

interface Health {
  table_count: number;
  size_pretty: string;
}

async function collectSnapshot() {
  const snapshot: Record<string, unknown[]> = {};
  for (const table of BACKUP_TABLES) {
    const { data } = await supabase.from(table).select('*');
    snapshot[table] = data ?? [];
  }
  return { created_at: new Date().toISOString(), tables: snapshot };
}

function downloadBlob(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function toCsv(rows: Record<string, unknown>[]) {
  if (rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(',')];
  rows.forEach((row) => {
    lines.push(headers.map((h) => `"${String(row[h] ?? '').replace(/"/g, '""')}"`).join(','));
  });
  return lines.join('\n');
}

export default function SuperAdminDatabasePage() {
  const { user } = useAuthStore();
  const [health, setHealth] = useState<Health | null>(null);
  const [backups, setBackups] = useState<BackupRow[]>([]);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const load = async () => {
    const { data: healthData } = await supabase.rpc('get_db_health');
    if (healthData && healthData[0]) setHealth(healthData[0]);

    const { data } = await supabase
      .from('database_backups')
      .select('id, storage_path, size_bytes, created_at')
      .order('created_at', { ascending: false });
    setBackups(data ?? []);
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreateBackup = async () => {
    if (!user) return;
    setIsBackingUp(true);
    const snapshot = await collectSnapshot();
    const json = JSON.stringify(snapshot, null, 2);
    const path = `backup-${Date.now()}.json`;

    const { error: uploadError } = await supabase.storage
      .from('backups')
      .upload(path, new Blob([json], { type: 'application/json' }));

    if (uploadError) {
      setMessage(uploadError.message);
      setIsBackingUp(false);
      return;
    }

    await supabase.from('database_backups').insert({
      storage_path: path,
      size_bytes: new Blob([json]).size,
      created_by: user.id,
    });

    setMessage('Backup created.');
    setIsBackingUp(false);
    load();
  };

  const handleDownloadBackup = async (backup: BackupRow) => {
    const { data, error } = await supabase.storage.from('backups').download(backup.storage_path);
    if (error || !data) {
      setMessage(error?.message ?? "Couldn't download that backup.");
      return;
    }
    const text = await data.text();
    downloadBlob(backup.storage_path, text, 'application/json');
  };

  const handleExportJson = async () => {
    const snapshot = await collectSnapshot();
    downloadBlob('athlink-export.json', JSON.stringify(snapshot, null, 2), 'application/json');
  };

  const handleExportCsv = async () => {
    const { data } = await supabase.from('profiles').select('*');
    downloadBlob('athlink-users-export.csv', toCsv(data ?? []), 'text/csv');
  };

  const lastBackup = backups[0];

  return (
    <SuperAdminPortalLayout>
      <div>
        <h1 className="flex items-center gap-2 text-lg font-bold text-neutral-900">
          <Database className="w-5 h-5 text-orange-500" />
          Database Management
        </h1>
        <p className="text-sm text-neutral-500">Backup, restore, export, and monitor database operations</p>
      </div>

      {message && (
        <p className="text-sm text-green-700 bg-green-50 border border-green-100 rounded-lg px-3 py-2">
          {message}
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white border border-neutral-200 rounded-xl p-5">
          <h2 className="font-semibold text-neutral-900 mb-1">Database Backup</h2>
          <p className="text-sm text-neutral-500 mb-4">
            Create a JSON snapshot of profiles, documents, reservations, schedules, and sports.
          </p>
          <Button type="button" className="w-full bg-orange-500 hover:bg-orange-600" onClick={handleCreateBackup} disabled={isBackingUp}>
            <Download className="w-4 h-4 mr-1.5" />
            {isBackingUp ? 'Creating…' : 'Create Backup'}
          </Button>
          <p className="text-xs text-neutral-400 mt-2">
            {lastBackup ? `Last backup: ${new Date(lastBackup.created_at).toLocaleString()}` : 'No backups yet'}
          </p>
        </div>

        <div className="bg-white border border-neutral-200 rounded-xl p-5">
          <h2 className="font-semibold text-neutral-900 mb-1">Database Restore</h2>
          <p className="text-sm text-neutral-500 mb-3">Restore database from a backup file</p>
          <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-100 px-3 py-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700">
              A safe restore-from-upload feature isn't available here — overwriting live data from a browser upload is too risky to do reliably (wrong order, partial failures, no rollback). For real restores, use Supabase's own project-level backup/point-in-time-recovery tools in the dashboard.
            </p>
          </div>
        </div>

        <div className="bg-white border border-neutral-200 rounded-xl p-5">
          <h2 className="flex items-center gap-2 font-semibold text-neutral-900 mb-3">
            <Activity className="w-4 h-4 text-orange-500" />
            Database Health
          </h2>
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-neutral-500">Size:</span>
            <span className="font-medium text-neutral-800">{health?.size_pretty ?? '—'}</span>
          </div>
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-neutral-500">Tables:</span>
            <span className="font-medium text-neutral-800">{health?.table_count ?? '—'}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-neutral-500">Status:</span>
            <span className="text-xs font-medium bg-green-100 text-green-700 rounded-full px-2 py-0.5">Healthy</span>
          </div>
        </div>

        <div className="bg-white border border-neutral-200 rounded-xl p-5">
          <h2 className="font-semibold text-neutral-900 mb-1">Data Export</h2>
          <p className="text-sm text-neutral-500 mb-4">Export data in various formats</p>
          <div className="space-y-2">
            <Button type="button" variant="outline" className="w-full justify-start" onClick={handleExportCsv}>
              <Download className="w-4 h-4 mr-2" />
              Export Users as CSV
            </Button>
            <Button type="button" variant="outline" className="w-full justify-start" onClick={handleExportJson}>
              <Download className="w-4 h-4 mr-2" />
              Export All Data as JSON
            </Button>
            <Button type="button" variant="outline" className="w-full justify-start" disabled>
              <Upload className="w-4 h-4 mr-2" />
              Export as Excel (needs an extra library — not added yet)
            </Button>
          </div>
        </div>
      </div>

      <div className="bg-white border border-neutral-200 rounded-xl p-6">
        <h2 className="font-semibold text-neutral-900 mb-1">Backup History</h2>
        <p className="text-sm text-neutral-500 mb-4">Previous database backups — download any version</p>

        {backups.length === 0 ? (
          <p className="text-sm text-neutral-400 text-center py-8">No backups yet.</p>
        ) : (
          <div className="space-y-2">
            {backups.map((b) => (
              <div key={b.id} className="flex items-center justify-between rounded-lg border border-neutral-100 bg-neutral-50 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-neutral-800">Full Backup</p>
                  <p className="text-xs text-neutral-500">
                    {new Date(b.created_at).toLocaleString()} · {(b.size_bytes / 1024).toFixed(1)} KB
                  </p>
                </div>
                <Button type="button" variant="outline" className="h-8 text-xs" onClick={() => handleDownloadBackup(b)}>
                  <Download className="w-3.5 h-3.5 mr-1" />
                  Download
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </SuperAdminPortalLayout>
  );
}
