import { useEffect, useState } from 'react';
import { Settings, Globe, ShieldCheck, Bell, Key } from 'lucide-react';
import SuperAdminPortalLayout from '../../components/layout/SuperAdminPortalLayout';
import { supabase } from '../../lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface SettingsRow {
  key: string;
  value: string | null;
}

export default function SuperAdminSystemSettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [showKeysModal, setShowKeysModal] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const load = async () => {
    const { data } = await supabase.from('system_settings').select('key, value');
    const map: Record<string, string> = {};
    ((data as SettingsRow[]) ?? []).forEach((s) => {
      map[s.key] = s.value ?? '';
    });
    setSettings(map);
  };

  useEffect(() => {
    load();
  }, []);

  const saveSetting = async (key: string, value: string) => {
    await supabase.from('system_settings').upsert({ key, value, updated_at: new Date().toISOString() });
    setEditingKey(null);
    load();
  };

  const toggleMaintenance = async () => {
    const next = settings.maintenance_mode === 'true' ? 'false' : 'true';
    await saveSetting('maintenance_mode', next);
    setMessage(
      next === 'true'
        ? 'Maintenance mode is now ON — everyone except Super Admin will be locked out of the portals.'
        : 'Maintenance mode is now OFF.'
    );
  };

  return (
    <SuperAdminPortalLayout>
      <div>
        <h1 className="flex items-center gap-2 text-lg font-bold text-neutral-900">
          <Settings className="w-5 h-5 text-orange-500" />
          System Configuration
        </h1>
        <p className="text-sm text-neutral-500">Configure system-wide settings and preferences</p>
      </div>

      {message && (
        <p className="text-sm text-green-700 bg-green-50 border border-green-100 rounded-lg px-3 py-2">
          {message}
        </p>
      )}

      {/* General Settings — fully real */}
      <section className="bg-white border border-neutral-200 rounded-xl p-6">
        <h2 className="flex items-center gap-2 font-semibold text-neutral-900 mb-4">
          <Globe className="w-4 h-4 text-orange-500" />
          General Settings
        </h2>

        <SettingRow
          title="Maintenance Mode"
          description={
            settings.maintenance_mode === 'true'
              ? 'ON — non-Super-Admin users are currently locked out'
              : 'Temporarily disable public access'
          }
        >
          <Button
            type="button"
            className={settings.maintenance_mode === 'true' ? 'bg-red-600 hover:bg-red-700' : ''}
            variant={settings.maintenance_mode === 'true' ? undefined : 'outline'}
            onClick={toggleMaintenance}
          >
            {settings.maintenance_mode === 'true' ? 'Turn Off' : 'Configure'}
          </Button>
        </SettingRow>

        <SettingRow title="System Name" description={settings.system_name || 'Not set'}>
          {editingKey === 'system_name' ? (
            <InlineEditor
              defaultValue={settings.system_name ?? ''}
              onCancel={() => setEditingKey(null)}
              onSave={(v) => saveSetting('system_name', v)}
            />
          ) : (
            <Button type="button" variant="outline" onClick={() => setEditingKey('system_name')}>
              Edit
            </Button>
          )}
        </SettingRow>

        <SettingRow title="Time Zone" description={settings.time_zone || 'Not set'}>
          {editingKey === 'time_zone' ? (
            <InlineEditor
              defaultValue={settings.time_zone ?? ''}
              onCancel={() => setEditingKey(null)}
              onSave={(v) => saveSetting('time_zone', v)}
            />
          ) : (
            <Button type="button" variant="outline" onClick={() => setEditingKey('time_zone')}>
              Change
            </Button>
          )}
        </SettingRow>
      </section>

      {/* Security & Authentication — Admin Login Keys is real, rest are stored-but-not-enforced */}
      <section className="bg-white border border-neutral-200 rounded-xl p-6">
        <h2 className="flex items-center gap-2 font-semibold text-neutral-900 mb-4">
          <ShieldCheck className="w-4 h-4 text-orange-500" />
          Security & Authentication
        </h2>

        <SettingRow title="Admin Login Keys" description="Manage keys for all admin roles">
          <Button type="button" className="bg-orange-500 hover:bg-orange-600" onClick={() => setShowKeysModal(true)}>
            <Key className="w-4 h-4 mr-1.5" />
            Manage Keys
          </Button>
        </SettingRow>

        <SettingRow
          title="Password Policy"
          description="Minimum 8 characters (enforced at sign-up) — additional rules below are saved but not yet enforced"
        >
          {editingKey === 'password_policy' ? (
            <InlineEditor
              defaultValue={settings.password_policy ?? 'Minimum 8 characters, 1 special char'}
              onCancel={() => setEditingKey(null)}
              onSave={(v) => saveSetting('password_policy', v)}
            />
          ) : (
            <Button type="button" variant="outline" onClick={() => setEditingKey('password_policy')}>
              Configure
            </Button>
          )}
        </SettingRow>

        <SettingRow title="Session Timeout" description="Saved value only — not yet enforced app-wide">
          {editingKey === 'session_timeout' ? (
            <InlineEditor
              defaultValue={settings.session_timeout ?? '30 minutes of inactivity'}
              onCancel={() => setEditingKey(null)}
              onSave={(v) => saveSetting('session_timeout', v)}
            />
          ) : (
            <Button type="button" variant="outline" onClick={() => setEditingKey('session_timeout')}>
              Configure
            </Button>
          )}
        </SettingRow>

        <SettingRow title="Two-Factor Authentication" description="Not built — the admin login-key step is the current second factor">
          <Button type="button" variant="outline" disabled>
            Not Available
          </Button>
        </SettingRow>
      </section>

      {/* Notifications & Email — placeholders, no real email server connected */}
      <section className="bg-white border border-neutral-200 rounded-xl p-6">
        <h2 className="flex items-center gap-2 font-semibold text-neutral-900 mb-1">
          <Bell className="w-4 h-4 text-orange-500" />
          Notifications & Email
        </h2>
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mb-4">
          No email server is connected yet — these settings save a value but don't send real emails. Real email delivery would need a separate backend email service.
        </p>

        <SettingRow title="Email Notifications" description="Send system notifications via email">
          <Button type="button" variant="outline" disabled>
            Not Connected
          </Button>
        </SettingRow>
        <SettingRow title="SMTP Settings" description="Email server configuration">
          <Button type="button" variant="outline" disabled>
            Not Connected
          </Button>
        </SettingRow>
        <SettingRow title="Notification Templates" description="Customize email templates">
          <Button type="button" variant="outline" disabled>
            Not Connected
          </Button>
        </SettingRow>
      </section>

      {showKeysModal && <AdminKeysModal onClose={() => setShowKeysModal(false)} onSaved={setMessage} />}
    </SuperAdminPortalLayout>
  );
}

function SettingRow({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-neutral-100 last:border-0">
      <div>
        <p className="text-sm font-medium text-neutral-800">{title}</p>
        <p className="text-xs text-neutral-500">{description}</p>
      </div>
      {children}
    </div>
  );
}

function InlineEditor({
  defaultValue,
  onSave,
  onCancel,
}: {
  defaultValue: string;
  onSave: (value: string) => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState(defaultValue);
  return (
    <div className="flex items-center gap-2">
      <Input value={value} onChange={(e) => setValue(e.target.value)} className="h-9 w-48" />
      <Button type="button" className="h-9 bg-orange-500 hover:bg-orange-600" onClick={() => onSave(value)}>
        Save
      </Button>
      <Button type="button" variant="outline" className="h-9" onClick={onCancel}>
        Cancel
      </Button>
    </div>
  );
}

function AdminKeysModal({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const [role, setRole] = useState<'staff_admin' | 'registrar' | 'superadmin'>('staff_admin');
  const [newKey, setNewKey] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSave = async () => {
    if (!newKey.trim()) {
      setError('Enter a new key.');
      return;
    }
    setIsSubmitting(true);
    const { data, error: rpcError } = await supabase.rpc('set_admin_key', {
      p_role: role,
      p_new_key: newKey,
    });
    setIsSubmitting(false);

    if (rpcError || !data) {
      setError(rpcError?.message ?? "Couldn't update the key.");
      return;
    }
    onClose();
    onSaved(
      `Login key for ${role.replace('_', ' ')} has been updated. Share the new key with that role's admins directly — it won't be shown again here.`
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-xl bg-white shadow-xl p-6">
        <h3 className="font-semibold text-neutral-900 mb-1">Manage Admin Login Keys</h3>
        <p className="text-xs text-neutral-500 mb-4">
          Keys are never shown once set — only replaced. Pick a role and set its new key.
        </p>

        <div className="space-y-3">
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as typeof role)}
            className="w-full px-3 py-2.5 rounded-lg bg-neutral-100 border border-transparent focus:border-orange-500 outline-none text-sm"
          >
            <option value="staff_admin">Staff Admin</option>
            <option value="registrar">Registrar</option>
            <option value="superadmin">Super Admin</option>
          </select>
          <Input placeholder="New login key" value={newKey} onChange={(e) => setNewKey(e.target.value)} />
        </div>

        {error && <p className="text-sm text-red-600 mt-3">{error}</p>}

        <div className="flex gap-3 mt-4">
          <Button type="button" className="flex-1 bg-orange-500 hover:bg-orange-600" onClick={handleSave} disabled={isSubmitting}>
            {isSubmitting ? 'Saving…' : 'Update Key'}
          </Button>
          <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
