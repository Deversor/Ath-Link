import { useEffect, useState } from 'react';
import { ShieldCheck, Plus, Upload, Trash2 } from 'lucide-react';
import StaffAdminPortalLayout from '../../components/layout/StaffAdminPortalLayout';
import { useAuthStore } from '../../store/useAuthStore';
import { supabase } from '../../lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface WhitelistEntry {
  id: string;
  email: string;
  used: boolean;
  created_at: string;
}

export default function StaffAdminWhitelistPage() {
  const { user } = useAuthStore();
  const [entries, setEntries] = useState<WhitelistEntry[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [bulkText, setBulkText] = useState('');
  const [showBulk, setShowBulk] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadEntries = async () => {
    const { data } = await supabase
      .from('athlete_whitelist')
      .select('id, email, used, created_at')
      .order('created_at', { ascending: false });
    setEntries(data ?? []);
  };

  useEffect(() => {
    loadEntries();
  }, []);

  const handleAddOne = async () => {
    if (!newEmail || !user) return;
    setError(null);

    const { error: insertError } = await supabase
      .from('athlete_whitelist')
      .insert({ email: newEmail.trim().toLowerCase(), added_by: user.id });

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setNewEmail('');
    loadEntries();
  };

  const handleBulkAdd = async () => {
    if (!bulkText.trim() || !user) return;
    setError(null);

    const emails = bulkText
      .split(/[\n,]/)
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);

    const { error: insertError } = await supabase
      .from('athlete_whitelist')
      .upsert(
        emails.map((email) => ({ email, added_by: user.id })),
        { onConflict: 'email', ignoreDuplicates: true }
      );

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setBulkText('');
    setShowBulk(false);
    loadEntries();
  };

  const handleRemove = async (id: string) => {
    await supabase.from('athlete_whitelist').delete().eq('id', id);
    loadEntries();
  };

  return (
    <StaffAdminPortalLayout>
      <div className="bg-white border border-neutral-200 rounded-xl p-6">
        <h1 className="flex items-center gap-2 text-lg font-bold text-neutral-900 mb-1">
          <ShieldCheck className="w-5 h-5 text-orange-500" />
          Athlete Email Whitelist
        </h1>
        <p className="text-sm text-neutral-500 mb-5">Manage authorized emails for athlete registration</p>

        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <Input
            placeholder="athlete@psu.edu"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            className="flex-1"
          />
          <Button
            type="button"
            onClick={handleAddOne}
            className="bg-orange-500 hover:bg-orange-600 shrink-0"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Add Email
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowBulk((v) => !v)}
            className="shrink-0"
          >
            <Upload className="w-4 h-4 mr-1.5" />
            Bulk Add
          </Button>
        </div>

        {showBulk && (
          <div className="mb-5 rounded-lg border border-neutral-200 p-4">
            <p className="text-sm font-medium text-neutral-800 mb-2">
              Paste multiple emails (one per line, or comma-separated)
            </p>
            <textarea
              rows={5}
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              placeholder={'athlete1@psu.edu\nathlete2@psu.edu\nathlete3@psu.edu'}
              className="w-full px-3 py-2.5 rounded-lg bg-neutral-100 border border-transparent focus:border-orange-500 focus:bg-white outline-none text-sm transition-colors resize-none mb-3"
            />
            <Button
              type="button"
              onClick={handleBulkAdd}
              className="bg-orange-500 hover:bg-orange-600"
            >
              Add All
            </Button>
          </div>
        )}

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-4">
            {error}
          </p>
        )}

        {entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-neutral-400">
            <ShieldCheck className="w-10 h-10 mb-3" />
            <p>No whitelisted emails yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between rounded-lg border border-neutral-100 bg-neutral-50 px-4 py-2.5"
              >
                <span className="text-sm text-neutral-700">{entry.email}</span>
                <div className="flex items-center gap-3">
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      entry.used ? 'bg-green-100 text-green-700' : 'bg-neutral-200 text-neutral-500'
                    }`}
                  >
                    {entry.used ? 'Registered' : 'Pending'}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemove(entry.id)}
                    aria-label="Remove"
                    className="text-neutral-400 hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </StaffAdminPortalLayout>
  );
}
