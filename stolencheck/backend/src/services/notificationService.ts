import { Expo, ExpoPushMessage } from 'expo-server-sdk';

const expo = new Expo();

export async function sendPushNotification(
  pushToken: string, title: string, body: string,
  data?: Record<string, any>,
  options?: { sound?: string | null; priority?: 'default' | 'normal' | 'high'; badge?: number }
): Promise<void> {
  if (!Expo.isExpoPushToken(pushToken)) {
    console.warn(`Invalid Expo push token: ${pushToken}`);
    return;
  }
  const message: ExpoPushMessage = {
    to: pushToken, title, body, data,
    sound: (options?.sound ?? 'default') as any,
    priority: options?.priority || 'default',
    badge: options?.badge,
  };
  try {
    const chunks = expo.chunkPushNotifications([message]);
    for (const chunk of chunks) await expo.sendPushNotificationsAsync(chunk);
  } catch (error) {
    console.error('Push notification error:', error);
  }
}
