export interface GameNotification {
  id: string;
  title: string;
  message: string;
  type: 'harvest' | 'animal' | 'artisan' | 'market' | 'clan' | 'reward';
  icon: string;
  timestamp: number;
}

type NotificationListener = (notification: GameNotification) => void;

class NotificationManager {
  private listeners: Set<NotificationListener> = new Set();
  private hasNativePermission: boolean = false;
  private shownTimers: Set<string> = new Set();

  constructor() {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      this.hasNativePermission = Notification.permission === 'granted';
    }
  }

  async requestPermission(): Promise<boolean> {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const res = await Notification.requestPermission();
        this.hasNativePermission = res === 'granted';
        return this.hasNativePermission;
      } catch {
        return false;
      }
    }
    return false;
  }

  subscribe(listener: NotificationListener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  send(notification: Omit<GameNotification, 'id' | 'timestamp'> & { dedupeKey?: string }) {
    if (notification.dedupeKey) {
      if (this.shownTimers.has(notification.dedupeKey)) return;
      this.shownTimers.add(notification.dedupeKey);
      // clear dedupe after 30 seconds
      setTimeout(() => {
        this.shownTimers.delete(notification.dedupeKey!);
      }, 30000);
    }

    const fullNotif: GameNotification = {
      ...notification,
      id: 'notif_' + Math.random().toString(36).substring(2, 9),
      timestamp: Date.now(),
    };

    // Emit to in-app listeners
    this.listeners.forEach((listener) => listener(fullNotif));

    // Emit to Web Browser push notification if permitted
    if (this.hasNativePermission && typeof window !== 'undefined' && 'Notification' in window) {
      try {
        new Notification(fullNotif.title, {
          body: fullNotif.message,
          icon: '/favicon.ico',
          tag: fullNotif.type,
        });
      } catch {
        // Fallback for iframe restrictions
      }
    }
  }
}

export const notificationManager = new NotificationManager();
