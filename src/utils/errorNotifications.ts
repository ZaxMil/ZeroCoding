// Error notification utilities
import { toast } from '@/hooks/use-toast';

export interface NotificationConfig {
  enableToasts: boolean;
  enableBrowserNotifications: boolean;
  maxNotificationsPerHour: number;
}

class ErrorNotificationManager {
  private config: NotificationConfig;
  private notificationCount: number = 0;
  private lastResetTime: number = Date.now();
  private readonly HOUR_IN_MS = 60 * 60 * 1000;

  constructor(config: Partial<NotificationConfig> = {}) {
    this.config = {
      enableToasts: config.enableToasts ?? true,
      enableBrowserNotifications: config.enableBrowserNotifications ?? false,
      maxNotificationsPerHour: config.maxNotificationsPerHour ?? 10
    };
  }

  // Show error notification
  notifyError(message: string, level: 'error' | 'warning' | 'info' = 'error'): void {
    if (!this.canShowNotification()) return;

    // Toast notification
    if (this.config.enableToasts && level === 'error') {
      toast({
        title: "An error occurred",
        description: message,
        variant: "destructive",
      });
      this.incrementNotificationCount();
    }

    // Browser notification (if permission granted)
    if (this.config.enableBrowserNotifications && this.hasBrowserNotificationPermission()) {
      this.showBrowserNotification(message, level);
      this.incrementNotificationCount();
    }
  }

  // Check if we can show more notifications
  private canShowNotification(): boolean {
    const now = Date.now();
    
    // Reset counter if an hour has passed
    if (now - this.lastResetTime > this.HOUR_IN_MS) {
      this.notificationCount = 0;
      this.lastResetTime = now;
    }

    return this.notificationCount < this.config.maxNotificationsPerHour;
  }

  // Increment notification counter
  private incrementNotificationCount(): void {
    this.notificationCount++;
  }

  // Check browser notification permission
  private hasBrowserNotificationPermission(): boolean {
    return typeof window !== 'undefined' && 
           'Notification' in window && 
           Notification.permission === 'granted';
  }

  // Request browser notification permission
  async requestBrowserNotificationPermission(): Promise<boolean> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission === 'denied') {
      return false;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  // Show browser notification
  private showBrowserNotification(message: string, level: 'error' | 'warning' | 'info'): void {
    const icons = {
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    };

    const notification = new Notification(`${icons[level]} Application ${level}`, {
      body: message,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: 'app-error',
      requireInteraction: level === 'error'
    });

    // Auto-close after 5 seconds for non-errors
    if (level !== 'error') {
      setTimeout(() => notification.close(), 5000);
    }
  }

  // Update configuration
  updateConfig(newConfig: Partial<NotificationConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  // Get current stats
  getStats(): {
    notificationsShown: number;
    remainingNotifications: number;
    timeUntilReset: number;
  } {
    const now = Date.now();
    const timeUntilReset = this.HOUR_IN_MS - (now - this.lastResetTime);
    
    return {
      notificationsShown: this.notificationCount,
      remainingNotifications: Math.max(0, this.config.maxNotificationsPerHour - this.notificationCount),
      timeUntilReset: Math.max(0, timeUntilReset)
    };
  }
}

export const errorNotificationManager = new ErrorNotificationManager();