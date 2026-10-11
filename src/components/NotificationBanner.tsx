import React, { useEffect, useState } from 'react';
import { GameNotification, notificationManager } from '../utils/notifications';
import { Bell, X } from 'lucide-react';

export const NotificationBanner: React.FC = () => {
  const [notifications, setNotifications] = useState<GameNotification[]>([]);

  useEffect(() => {
    const unsubscribe = notificationManager.subscribe((notif) => {
      setNotifications((prev) => [notif, ...prev.slice(0, 2)]);
      // Auto-remove after 4 seconds
      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== notif.id));
      }, 4000);
    });
    return unsubscribe;
  }, []);

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-14 left-1/2 transform -translate-x-1/2 z-50 flex flex-col gap-2 w-full max-w-sm px-3 pointer-events-none">
      {notifications.map((notif) => (
        <div
          key={notif.id}
          className="pointer-events-auto bg-amber-950/95 border-2 border-yellow-400 text-amber-100 p-3 rounded-2xl shadow-2xl flex items-center justify-between gap-3 animate-bounce"
        >
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">{notif.icon}</span>
            <div>
              <h5 className="font-black text-xs text-yellow-300 leading-tight">
                {notif.title}
              </h5>
              <p className="text-[11px] text-amber-200 font-medium">
                {notif.message}
              </p>
            </div>
          </div>
          <button
            onClick={() =>
              setNotifications((prev) => prev.filter((n) => n.id !== notif.id))
            }
            className="text-amber-400 hover:text-white text-xs p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
