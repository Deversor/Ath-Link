import { useEffect, useState } from 'react';
import { Users, Search, Plus, Pencil, Trash2, Power } from 'lucide-react';
import SuperAdminPortalLayout from '../../components/layout/SuperAdminPortalLayout';
import { useAuthStore } from '../../store/useAuthStore';
import { supabase } from '../../lib/supabase';
import { useSports } from '../../hooks/useSports';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface UserRow {
  id: string;
  full_name: string;
  email: string;
  role: string;
  sport: string | null;
  department: string | null;
  is_active: boolean;
  created_at: string;
}

const ROLE_TABS = [
  { value: 'all', label: 'All Users' },
  { value: 'student', label: 'Student Athletes' },
  { value: 'coach', label: 'Coaches' },
  { value: 'staff_admin', label: 'Staff Admin' },
  { value: 'registrar', label: 'Registrar' },
  { value: 'superadmin', label: 'Super Admin' },
] as const;

const ROLE_BADGE: Record<string, string> = {
  student: 'bg-orange-100 text-orange-700',
  coach: 'bg-blue-100 text-blue-700',
  staff_admin: 'bg-purple-100 text-purple-700',
  registrar: 'bg-green-100 text-green-700',
  superadmin: 'bg-red-100 text-red-700',
};

export default function SuperAdminUserManagementPage() {
  const { user: currentUser } = useAuthStore();
  const sports = useSports();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRow | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, email, role, sport, department, is_active, created_at')
      .order('created_at', { ascending: false });
    setUsers(data ?? []);
  };

  useEffect(() => {
    load();
  }, []);

  const counts = ROLE_TABS.reduce<Record<string, number>>((acc, tab) => {
    acc[tab.value] = tab.value === 'all' ? users.length : users.filter((u) => u.role === tab.value).length;
    return acc;
  }, {});

  const filtered = users.filter((u) => {
    if (activeTab !== 'all' && u.role !== activeTab) return false;
    const q = search.toLowerCase();
    if (!q) return true;
    return (
      u.full_name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.sport?.toLowerCase().includes(q) ||
      u.department?.toLowerCase().includes(q)
    );
  });

  const handleToggleActive = async (u: UserRow) => {
    await supabase.from('profiles').update({ is_active: !u.is_active }).eq('id', u.id);
    setMessage(`${u.full_name} has been ${u.is_active ? 'deactivated' : 'reactivated'}.`);
    load();
  };

  const handleDelete = async (u: UserRow) => {
    if (u.id === currentUser?.id) {
      setMessage("You can't remove your own account.");
      return;
    }
    await supabase.from('profiles').delete().eq('id', u.id);
    setMessage(
      `${u.full_name}'s profile was removed — they can no longer access any portal. (Their login credentials still technically exist in the auth system; fully deleting those requires server-side access we don't expose here.)`
    );
    load();
  };

  return (
    <SuperAdminPortalLayout>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-lg font-bold text-neutral-900">
            <Users className="w-5 h-5 text-orange-500" />
            User Management
          </h1>
          <p className="text-sm text-neutral-500">Manage all system users by role category ({users.length} total)</p>
        </div>
        <Button type="button" className="bg-orange-500 hover:bg-orange-600" onClick={() => setShowAddModal(true)}>
          <Plus className="w-4 h-4 mr-1.5" />
          Add New User
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
        <Input
          placeholder="Search by name, email, sport or department..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
        {ROLE_TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setActiveTab(tab.value)}
            className={`rounded-xl border p-3 text-center transition-colors ${
              activeTab === tab.value ? 'bg-orange-500 border-orange-500 text-white' : 'bg-white border-neutral-200 text-neutral-600'
            }`}
          >
            <p className="text-xl font-bold">{counts[tab.value]}</p>
            <p className="text-xs">{tab.label}</p>
          </button>
        ))}
      </div>

      {message && (
        <p className="text-sm text-green-700 bg-green-50 border border-green-100 rounded-lg px-3 py-2">
          {message}
        </p>
      )}

      <div className="bg-white border border-neutral-200 rounded-xl p-6">
        <h2 className="font-semibold text-neutral-900 mb-4">
          {ROLE_TABS.find((t) => t.value === activeTab)?.label} ({filtered.length} results)
        </h2>

        {filtered.length === 0 ? (
          <p className="text-sm text-neutral-400 text-center py-8">No users match your search.</p>
        ) : (
          <div className="space-y-2">
            {filtered.map((u) => (
              <div
                key={u.id}
                className="flex items-center justify-between rounded-lg border border-neutral-100 bg-neutral-50 px-4 py-3"
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center shrink-0 font-semibold text-orange-600">
                    {u.full_name?.[0] ?? '?'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-neutral-900">{u.full_name}</p>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${ROLE_BADGE[u.role] ?? 'bg-neutral-200 text-neutral-600'}`}>
                        {u.role.replace('_', ' ')}
                      </span>
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          u.is_active ? 'bg-green-100 text-green-700' : 'bg-neutral-200 text-neutral-500'
                        }`}
                      >
                        {u.is_active ? 'active' : 'inactive'}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-500">{u.email}</p>
                    <p className="text-xs text-neutral-400">
                      {u.department ? `Dept: ${u.department} · ` : u.sport ? `Sport: ${u.sport} · ` : ''}
                      Joined {new Date(u.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button type="button" variant="outline" className="h-8 text-xs" onClick={() => handleToggleActive(u)}>
                    <Power className="w-3.5 h-3.5 mr-1" />
                    {u.is_active ? 'Deactivate' : 'Activate'}
                  </Button>
                  <Button type="button" variant="outline" className="h-8 w-8 p-0" onClick={() => setEditingUser(u)}>
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-8 w-8 p-0 border-red-200 text-red-600 hover:bg-red-50"
                    onClick={() => handleDelete(u)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {editingUser && (
        <EditUserModal user={editingUser} onClose={() => setEditingUser(null)} onSaved={() => { setEditingUser(null); load(); }} />
      )}

      {showAddModal && (
        <AddUserModal sports={sports} onClose={() => setShowAddModal(false)} onDone={(msg) => { setShowAddModal(false); setMessage(msg); }} />
      )}
    </SuperAdminPortalLayout>
  );
}

function EditUserModal({ user, onClose, onSaved }: { user: UserRow; onClose: () => void; onSaved: () => void }) {
  const [fullName, setFullName] = useState(user.full_name);
  const [department, setDepartment] = useState(user.department ?? '');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSave = async () => {
    setIsSubmitting(true);
    const { error: saveError } = await supabase
      .from('profiles')
      .update({ full_name: fullName, department: department || null })
      .eq('id', user.id);
    setIsSubmitting(false);
    if (saveError) {
      setError(saveError.message);
      return;
    }
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-xl bg-white shadow-xl p-6">
        <h3 className="font-semibold text-neutral-900 mb-4">Edit User</h3>
        <div className="space-y-3">
          <Input placeholder="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          <Input placeholder="Department (admin roles only)" value={department} onChange={(e) => setDepartment(e.target.value)} />
        </div>
        {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
        <div className="flex gap-3 mt-4">
          <Button type="button" className="flex-1 bg-orange-500 hover:bg-orange-600" onClick={handleSave} disabled={isSubmitting}>
            {isSubmitting ? 'Saving…' : 'Save'}
          </Button>
          <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}

function AddUserModal({
  sports,
  onClose,
  onDone,
}: {
  sports: string[];
  onClose: () => void;
  onDone: (message: string) => void;
}) {
  const { user } = useAuthStore();
  const [kind, setKind] = useState<'athlete' | 'coach' | 'admin'>('athlete');
  const [email, setEmail] = useState('');
  const [sport, setSport] = useState(sports[0] ?? '');
  const [adminRole, setAdminRole] = useState<'staff_admin' | 'registrar' | 'superadmin'>('staff_admin');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim() || !user) {
      setError('Email is required.');
      return;
    }
    setIsSubmitting(true);
    const cleanEmail = email.trim().toLowerCase();
    let err;

    if (kind === 'athlete') {
      ({ error: err } = await supabase.from('athlete_whitelist').insert({ email: cleanEmail, added_by: user.id }));
    } else if (kind === 'coach') {
      ({ error: err } = await supabase.from('coach_whitelist').insert({ email: cleanEmail, sport, added_by: user.id }));
    } else {
      ({ error: err } = await supabase.from('admin_whitelist').insert({ email: cleanEmail, role: adminRole, invited_by: user.id }));
    }

    setIsSubmitting(false);
    if (err) {
      setError(err.message);
      return;
    }
    onDone(`${cleanEmail} can now register through the sign-up page as ${kind === 'admin' ? adminRole : kind}.`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-xl bg-white shadow-xl p-6">
        <h3 className="font-semibold text-neutral-900 mb-1">Add New User</h3>
        <p className="text-xs text-neutral-500 mb-4">
          Accounts can't be created directly — this authorizes an email to self-register through sign-up.
        </p>

        <div className="space-y-3">
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value as typeof kind)}
            className="w-full px-3 py-2.5 rounded-lg bg-neutral-100 border border-transparent focus:border-orange-500 outline-none text-sm"
          >
            <option value="athlete">Student Athlete</option>
            <option value="coach">Coach</option>
            <option value="admin">Admin (Staff Admin / Registrar / Super Admin)</option>
          </select>

          <Input placeholder="email@psu.edu" value={email} onChange={(e) => setEmail(e.target.value)} />

          {kind === 'coach' && (
            <select
              value={sport}
              onChange={(e) => setSport(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg bg-neutral-100 border border-transparent focus:border-orange-500 outline-none text-sm"
            >
              {sports.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          )}

          {kind === 'admin' && (
            <select
              value={adminRole}
              onChange={(e) => setAdminRole(e.target.value as typeof adminRole)}
              className="w-full px-3 py-2.5 rounded-lg bg-neutral-100 border border-transparent focus:border-orange-500 outline-none text-sm"
            >
              <option value="staff_admin">Staff Admin</option>
              <option value="registrar">Registrar</option>
              <option value="superadmin">Super Admin</option>
            </select>
          )}
        </div>

        {error && <p className="text-sm text-red-600 mt-3">{error}</p>}

        <div className="flex gap-3 mt-4">
          <Button type="button" className="flex-1 bg-orange-500 hover:bg-orange-600" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Adding…' : 'Add'}
          </Button>
          <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
