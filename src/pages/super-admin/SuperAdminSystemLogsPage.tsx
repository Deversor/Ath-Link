import { useEffect, useState } from 'react';
import { Clock, Building2, LogIn, UserPlus, Download } from 'lucide-react';
import SuperAdminPortalLayout from '../../components/layout/SuperAdminPortalLayout';
import { supabase } from '../../lib/supabase';

interface LogEntry {
  id: string;
  action_type: string;
  entity_type: string | null;
  description: string;
  actor_label: string | null;
  created_at: string;
}

const ENTITY_ICON: Record<string, typeof Clock> = {
  facility: Building2,
  auth: LogIn,
  user: UserPlus,
};

const ENTITY_BADGE: Record<string, string> = {
  facility: 'bg-green-100 text-green-700',
  auth: 'bg-blue-100 text-blue-700',
  user: 'bg-purple-100 text-purple-700',
};

const ACTION_LABEL: Record<string, string> = {
  user_login: 'User Login',
  user_created: 'User Created',
  reservation_approved: 'Reservation Approved',
  reservation_rejected: 'Reservation Rejected',
  reservation_stage1_approved: 'Reservation Initially Approved',
  reservation_confirmed: 'Reservation Confirmed',
};

export default function SuperAdminSystemLogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('system_logs')
        .select('id, action_type, entity_type, description, actor_label, created_at')
        .order('created_at', { ascending: false })
        .limit(200);
      setLogs(data ?? []);
    }
    load();
  }, []);

  const entityTypes = Array.from(new Set(logs.map((l) => l.entity_type).filter(Boolean))) as string[];
  const filtered = filter === 'all' ? logs : logs.filter((l) => l.entity_type === filter);

  const handleExport = () => {
    const rows = [
      ['Timestamp', 'Action', 'Entity', 'Description', 'Actor'],
      ...filtered.map((l) => [
        new Date(l.created_at).toLocaleString(),
        ACTION_LABEL[l.action_type] ?? l.action_type,
        l.entity_type ?? '',
        l.description,
        l.actor_label ?? '',
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'system-logs.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <SuperAdminPortalLayout>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-neutral-900">System Activity Logs</h1>
          <p className="text-sm text-neutral-500">Monitor all system activities and changes</p>
        </div>
        <div className="flex gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-neutral-200 text-sm text-neutral-600"
          >
            <option value="all">All Logs</option>
            {entityTypes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleExport}
            className="flex items-center gap-1.5 text-sm border border-neutral-200 rounded-lg px-3 py-2 hover:bg-neutral-50"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white border border-neutral-200 rounded-xl p-16 text-center text-neutral-400">
          <Clock className="w-10 h-10 mx-auto mb-3" />
          <p>No activity logged yet.</p>
          <p className="text-xs mt-1">
            Logging currently covers logins, new account sign-ups, and facility reservation decisions.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((log) => {
            const Icon = ENTITY_ICON[log.entity_type ?? ''] ?? Clock;
            return (
              <div key={log.id} className="bg-white border border-neutral-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-neutral-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-neutral-900">{ACTION_LABEL[log.action_type] ?? log.action_type}</p>
                      {log.entity_type && (
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ENTITY_BADGE[log.entity_type] ?? 'bg-neutral-100 text-neutral-500'}`}>
                          {log.entity_type}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-neutral-600 mt-0.5">{log.description}</p>
                    <p className="text-xs text-neutral-400 mt-1">
                      {new Date(log.created_at).toLocaleString()} · By {log.actor_label ?? 'system'}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </SuperAdminPortalLayout>
  );
}