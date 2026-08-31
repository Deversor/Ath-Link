import { useEffect, useState } from 'react';
import { Trophy, Plus, Pencil, Trash2, Search } from 'lucide-react';
import SuperAdminPortalLayout from '../../components/layout/SuperAdminPortalLayout';
import { supabase } from '../../lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Sport {
  id: string;
  name: string;
  sport_type: 'team' | 'individual';
  description: string | null;
  active: boolean;
  created_at: string;
}

export default function SuperAdminSportProgramsPage() {
  const [sports, setSports] = useState<Sport[]>([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingSport, setEditingSport] = useState<Sport | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = async () => {
    const { data } = await supabase.from('sports').select('*').order('name');
    setSports(data ?? []);
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = sports.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()));
  const teamCount = sports.filter((s) => s.sport_type === 'team').length;
  const individualCount = sports.filter((s) => s.sport_type === 'individual').length;

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('sports').delete().eq('id', id);
    if (error) {
      setMessage(
        "Couldn't delete — this sport likely still has athletes, coaches, or schedules attached. Try marking it inactive instead."
      );
      return;
    }
    load();
  };

  return (
    <SuperAdminPortalLayout>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-lg font-bold text-neutral-900">
            <Trophy className="w-5 h-5 text-orange-500" />
            Sport Programs
          </h1>
          <p className="text-sm text-neutral-500">
            Manage all sport programs offered by PalawanSU Sports Division ({sports.length} programs)
          </p>
        </div>
        <Button
          type="button"
          className="bg-orange-500 hover:bg-orange-600"
          onClick={() => {
            setEditingSport(null);
            setShowModal(true);
          }}
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Add Sport
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
        <Input
          placeholder="Search sport programs..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white border border-neutral-200 rounded-xl p-4">
          <p className="text-sm text-neutral-500">Team Sports</p>
          <p className="text-2xl font-bold text-orange-600 mt-1">{teamCount}</p>
        </div>
        <div className="bg-white border border-neutral-200 rounded-xl p-4">
          <p className="text-sm text-neutral-500">Individual Sports</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{individualCount}</p>
        </div>
      </div>

      {message && (
        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
          {message}
        </p>
      )}

      <div className="bg-white border border-neutral-200 rounded-xl p-6">
        <h2 className="font-semibold text-neutral-900 mb-4">All Sport Programs</h2>
        <div className="space-y-3">
          {filtered.map((sport) => (
            <div
              key={sport.id}
              className="flex items-center justify-between rounded-lg border border-neutral-100 bg-neutral-50 px-4 py-3"
            >
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                  <Trophy className="w-4 h-4 text-orange-500" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-neutral-900">{sport.name}</p>
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        sport.sport_type === 'team' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {sport.sport_type === 'team' ? 'Team Sport' : 'Individual Sport'}
                    </span>
                    {!sport.active && (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-neutral-200 text-neutral-500">
                        Inactive
                      </span>
                    )}
                  </div>
                  {sport.description && <p className="text-sm text-neutral-600">{sport.description}</p>}
                  <p className="text-xs text-neutral-400">
                    Added: {new Date(sport.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  className="h-8 text-xs"
                  onClick={() => {
                    setEditingSport(sport);
                    setShowModal(true);
                  }}
                >
                  <Pencil className="w-3.5 h-3.5 mr-1" />
                  Edit
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-8 text-xs border-red-200 text-red-600 hover:bg-red-50"
                  onClick={() => handleDelete(sport.id)}
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1" />
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showModal && (
        <SportModal
          sport={editingSport}
          onClose={() => setShowModal(false)}
          onSaved={() => {
            setShowModal(false);
            load();
          }}
        />
      )}
    </SuperAdminPortalLayout>
  );
}

function SportModal({
  sport,
  onClose,
  onSaved,
}: {
  sport: Sport | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(sport?.name ?? '');
  const [sportType, setSportType] = useState<'team' | 'individual'>(sport?.sport_type ?? 'team');
  const [description, setDescription] = useState(sport?.description ?? '');
  const [active, setActive] = useState(sport?.active ?? true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('Sport name is required.');
      return;
    }
    setIsSubmitting(true);

    const payload = { name: name.trim(), sport_type: sportType, description: description || null, active };
    const { error: saveError } = sport
      ? await supabase.from('sports').update(payload).eq('id', sport.id)
      : await supabase.from('sports').insert(payload);

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
      <div className="relative w-full max-w-md rounded-xl bg-white shadow-xl p-6">
        <h3 className="font-semibold text-neutral-900 mb-4">{sport ? 'Edit Sport' : 'Add Sport'}</h3>

        <div className="space-y-3">
          <Input placeholder="Sport name" value={name} onChange={(e) => setName(e.target.value)} />
          <select
            value={sportType}
            onChange={(e) => setSportType(e.target.value as 'team' | 'individual')}
            className="w-full px-3 py-2.5 rounded-lg bg-neutral-100 border border-transparent focus:border-orange-500 outline-none text-sm"
          >
            <option value="team">Team Sport</option>
            <option value="individual">Individual Sport</option>
          </select>
          <textarea
            rows={2}
            placeholder="Short description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg bg-neutral-100 border border-transparent focus:border-orange-500 outline-none text-sm resize-none"
          />
          <label className="flex items-center gap-2 text-sm text-neutral-700">
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
            Active (visible during sign-up)
          </label>
        </div>

        {error && <p className="text-sm text-red-600 mt-3">{error}</p>}

        <div className="flex gap-3 mt-4">
          <Button type="button" className="flex-1 bg-orange-500 hover:bg-orange-600" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Saving…' : sport ? 'Save Changes' : 'Add Sport'}
          </Button>
          <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
