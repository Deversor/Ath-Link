import { useEffect, useRef, useState } from 'react';
import { Bell } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/useAuthStore';

interface Notification {
  id: string;
  message: string;
  read: boolean;
  created_at: string;
}

export default function NotificationsBell() {
  const { user } = useAuthStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('notifications')
      .select('id, message, read, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);
    setNotifications(data ?? []);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleOpen = async () => {
    const opening = !open;
    setOpen(opening);
    if (opening && unreadCount > 0 && user) {
      const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
      await supabase.from('notifications').update({ read: true }).in('id', unreadIds);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    }
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        aria-label="Notifications"
        onClick={handleOpen}
        className="relative w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto bg-white border border-neutral-200 rounded-xl shadow-lg z-50 text-left">
          <div className="px-4 py-3 border-b border-neutral-100">
            <p className="text-sm font-semibold text-neutral-800">Notifications</p>
          </div>
          {notifications.length === 0 ? (
            <p className="text-sm text-neutral-400 text-center py-8">No notifications yet.</p>
          ) : (
            <div className="divide-y divide-neutral-100">
              {notifications.map((n) => (
                <div key={n.id} className={`px-4 py-3 text-sm ${n.read ? 'bg-white' : 'bg-orange-50'}`}>
                  <p className="text-neutral-700">{n.message}</p>
                  <p className="text-xs text-neutral-400 mt-1">{new Date(n.created_at).toLocaleString()}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
