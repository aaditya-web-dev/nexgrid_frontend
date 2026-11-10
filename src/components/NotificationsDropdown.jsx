import React, { useState, useEffect, useRef } from 'react';
import { notificationsApi } from '../api';

export const NotificationsDropdown = ({ workspaceId, incomingNotification }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await notificationsApi.list(workspaceId || null);
      setNotifications(res.data);
      setUnreadCount(res.data.filter((n) => !n.is_read).length);
    } catch (err) {
      console.warn('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [workspaceId]);

  // When a real-time notification arrives via WebSocket, prepend it
  useEffect(() => {
    if (incomingNotification) {
      setNotifications((prev) => [incomingNotification, ...prev]);
      setUnreadCount((prev) => prev + 1);
    }
  }, [incomingNotification]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  const handleMarkAllRead = async () => {
    try {
      await notificationsApi.markAllRead(workspaceId || null);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.warn('Failed to mark all notifications read:', err);
    }
  };

  const handleMarkOneRead = async (id) => {
    try {
      await notificationsApi.markRead([id]);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.warn('Failed to mark notification read:', err);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
        title="Notifications"
      >
        <span className="text-sm">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-indigo-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center animate-bounce">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-800 rounded-lg shadow-2xl z-50 overflow-hidden text-xs">
          <div className="p-3 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
            <span className="font-bold text-slate-200">Notifications</span>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-[11px] text-indigo-400 hover:text-indigo-300 cursor-pointer"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-72 overflow-y-auto divide-y divide-slate-800/60">
            {loading && notifications.length === 0 ? (
              <div className="p-4 text-center text-slate-500">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center text-slate-500">No notifications</div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => !n.is_read && handleMarkOneRead(n.id)}
                  className={`p-3 transition-colors cursor-pointer flex items-start gap-2 ${
                    n.is_read ? 'bg-slate-950/40 text-slate-400' : 'bg-slate-850 text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <span className="text-base shrink-0 mt-0.5">
                    {n.type === 'comment_added' ? '💬' : '📌'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="line-clamp-2">{n.message}</p>
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  {!n.is_read && (
                    <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0 mt-1" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
