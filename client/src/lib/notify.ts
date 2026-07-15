/**
 * Thin wrapper over the browser Notification API. Alerts are notify-only;
 * this surfaces a triggered alert as an OS notification when the user has
 * opted in. Never used for anything that acts on a market.
 */
export type NotifyPermission = 'granted' | 'denied' | 'default' | 'unsupported';

export function notificationsSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function notificationPermission(): NotifyPermission {
  if (!notificationsSupported()) return 'unsupported';
  return Notification.permission as NotifyPermission;
}

export async function requestNotificationPermission(): Promise<NotifyPermission> {
  if (!notificationsSupported()) return 'unsupported';
  try {
    return (await Notification.requestPermission()) as NotifyPermission;
  } catch {
    return notificationPermission();
  }
}

export function notify(title: string, body: string): void {
  if (notificationPermission() !== 'granted') return;
  try {
    new Notification(title, { body, tag: 'market-terminal-alert' });
  } catch {
    /* some browsers throw if constructed outside a SW; ignore */
  }
}
