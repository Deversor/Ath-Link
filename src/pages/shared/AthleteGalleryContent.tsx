import { useEffect, useState } from 'react';
import { Mail, Eye, CheckCircle2, Download, Send, Users } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Button } from '@/components/ui/button';

interface AthleteRow {
  id: string;
  full_name: string;
  email: string;
  sport: string | null;
  document_compile_status: string;
  updated_at: string;
}

interface SportGroup {
  sport: string;
  coachName: string;
  athletes: AthleteRow[];
  latestUpdate: string;
}

export function AthleteGalleryContent() {
  const [athletes, setAthletes] = useState<AthleteRow[]>([]);
  const [coachBySport, setCoachBySport] = useState<Record<string, string>>({});
  const [expandedSport, setExpandedSport] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, email, sport, document_compile_status, updated_at')
      .eq('role', 'student')
      .in('document_compile_status', ['submitted_to_admin', 'staff_approved', 'sent_to_registrar']);
    setAthletes(data ?? []);

    const { data: coaches } = await supabase.from('profiles').select('sport, full_name').eq('role', 'coach');
    setCoachBySport(Object.fromEntries((coaches ?? []).filter((c) => c.sport).map((c) => [c.sport as string, c.full_name])));
  };

  useEffect(() => {
    load();
  }, []);

  const groupBySport = (status: string): SportGroup[] => {
    const filtered = athletes.filter((a) => a.document_compile_status === status);
    const bySport = new Map<string, AthleteRow[]>();
    filtered.forEach((a) => {
      const sport = a.sport ?? 'Unknown';
      if (!bySport.has(sport)) bySport.set(sport, []);
      bySport.get(sport)!.push(a);
    });
    return Array.from(bySport.entries()).map(([sport, list]) => ({
      sport,
      coachName: coachBySport[sport] ?? 'Unassigned',
      athletes: list,
      latestUpdate: list.reduce((max, a) => (a.updated_at > max ? a.updated_at : max), list[0]?.updated_at ?? ''),
    }));
  };

  const pendingGroups = groupBySport('submitted_to_admin');
  const compiledGroups = groupBySport('staff_approved');
  const sentGroups = groupBySport('sent_to_registrar');

  const handleApproveSport = async (athleteIds: string[]) => {
    await supabase.from('profiles').update({ document_compile_status: 'staff_approved' }).in('id', athleteIds);
    setMessage('Approved — moved to the compiled gallery.');
    setExpandedSport(null);
    load();
  };

  const handleApproveOne = async (athleteId: string) => {
    await supabase.from('profiles').update({ document_compile_status: 'staff_approved' }).eq('id', athleteId);
    load();
  };

  const handleDownloadGallery = (group: SportGroup) => {
    const rows = [
      ['Name', 'Email', 'Sport'],
      ...group.athletes.map((a) => [a.full_name, a.email, a.sport ?? '']),
    ];
    const csv = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${group.sport}-athlete-gallery.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const readyToSendCount = compiledGroups.reduce((sum, g) => sum + g.athletes.length, 0);
  const readyToSendSports = compiledGroups.length;

  const handleSendToRegistrar = async () => {
    const ids = compiledGroups.flatMap((g) => g.athletes.map((a) => a.id));
    if (ids.length === 0) return;
    await supabase.from('profiles').update({ document_compile_status: 'sent_to_registrar' }).in('id', ids);
    setMessage(`Sent ${ids.length} athlete(s) to the Registrar for final review.`);
    load();
  };

  return (
    <>
      <div>
        <h1 className="text-lg font-bold text-neutral-900">Athletes Gallery</h1>
        <p className="text-sm text-neutral-500">Manage athlete galleries submitted by sport coaches</p>
      </div>

      {message && (
        <p className="text-sm text-green-700 bg-green-50 border border-green-100 rounded-lg px-3 py-2">
          {message}
        </p>
      )}

      {/* Pending submissions from coaches */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
        <h2 className="flex items-center gap-2 font-semibold text-amber-900 mb-1">
          <Mail className="w-4 h-4" />
          Pending Submissions from Coaches
        </h2>
        <p className="text-sm text-amber-700 mb-4">Review and approve athlete galleries from sport coaches</p>

        {pendingGroups.length === 0 ? (
          <p className="text-sm text-neutral-400 text-center py-6">No pending submissions.</p>
        ) : (
          <div className="space-y-3">
            {pendingGroups.map((g) => (
              <div key={g.sport} className="bg-white border border-amber-100 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-semibold text-neutral-900">{g.sport} Team</p>
                    <p className="text-xs text-neutral-500">
                      Coach: {g.coachName} · {g.athletes.length} athletes · Submitted{' '}
                      {g.latestUpdate ? new Date(g.latestUpdate).toLocaleDateString() : ''}
                    </p>
                  </div>
                  <span className="text-xs font-medium bg-amber-100 text-amber-700 rounded-full px-2 py-0.5">
                    Pending Review
                  </span>
                </div>

                {expandedSport === g.sport ? (
                  <div className="space-y-2 mt-3">
                    {g.athletes.map((a) => (
                      <div key={a.id} className="flex items-center justify-between text-sm bg-neutral-50 rounded-lg px-3 py-2">
                        <span>{a.full_name} — {a.email}</span>
                        <Button
                          type="button"
                          className="h-7 text-xs bg-green-600 hover:bg-green-700"
                          onClick={() => handleApproveOne(a.id)}
                        >
                          Approve
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      className="w-full bg-orange-500 hover:bg-orange-600 mt-2"
                      onClick={() => handleApproveSport(g.athletes.map((a) => a.id))}
                    >
                      Approve All & Move to Compiled Gallery
                    </Button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    className="text-xs h-8"
                    onClick={() => setExpandedSport(g.sport)}
                  >
                    <Eye className="w-3.5 h-3.5 mr-1.5" />
                    Review Submissions
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Compiled gallery */}
      <div className="bg-white border border-neutral-200 rounded-xl p-6">
        <h2 className="font-semibold text-neutral-900 mb-1">Compiled Athletes Gallery</h2>
        <p className="text-sm text-neutral-500 mb-4">All approved athletes categorized by sport</p>

        {compiledGroups.length === 0 && sentGroups.length === 0 ? (
          <p className="text-sm text-neutral-400 text-center py-6">Nothing compiled yet.</p>
        ) : (
          <div className="space-y-3">
            {[...compiledGroups, ...sentGroups].map((g) => {
              const isSent = sentGroups.includes(g);
              return (
                <div
                  key={g.sport + (isSent ? '-sent' : '')}
                  className="flex items-center justify-between rounded-lg border border-neutral-100 bg-neutral-50 px-4 py-3"
                >
                  <div>
                    <p className="font-medium text-neutral-800">{g.sport}</p>
                    <p className="text-xs text-neutral-500">{g.athletes.length} athletes • Complete documentation</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-medium rounded-full px-2 py-0.5 ${
                        isSent ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'
                      }`}
                    >
                      {isSent ? 'Sent to Registrar' : `${g.athletes.length}/${g.athletes.length} Approved`}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={() => setExpandedSport(expandedSport === g.sport ? null : g.sport)}
                    >
                      <Users className="w-3.5 h-3.5 mr-1" />
                      View
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={() => handleDownloadGallery(g)}
                    >
                      <Download className="w-3.5 h-3.5 mr-1" />
                      Download
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Send to registrar */}
      <div className="bg-orange-50 border border-orange-200 rounded-xl p-6">
        <h2 className="flex items-center gap-2 font-semibold text-orange-900 mb-1">
          <CheckCircle2 className="w-4 h-4" />
          Send to Registrar for Final Review
        </h2>
        <p className="text-sm text-orange-700 mb-4">Submit complete athletes gallery to registrar office</p>

        <div className="rounded-lg bg-white border border-orange-100 px-4 py-3 mb-4">
          <p className="text-sm font-medium text-neutral-800">
            Ready to send: {readyToSendCount} athletes from {readyToSendSports} sports with complete profiles and documentation
          </p>
          <p className="text-xs text-neutral-500 mt-1">
            All athlete galleries will be sent to the Registrar for final GWA verification and approval.
          </p>
        </div>

        <Button
          type="button"
          disabled={readyToSendCount === 0}
          onClick={handleSendToRegistrar}
          className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-200"
        >
          <Send className="w-4 h-4 mr-2" />
          Send Athletes Gallery to Registrar
        </Button>
      </div>
    </>
  );
}
