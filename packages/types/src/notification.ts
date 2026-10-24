export type NotificationFormat = 'modal' | 'toast';
export type NotificationTrigger = 'delay' | 'scroll' | 'immediate';
export type NotificationAudience = 'all' | 'guest' | 'authenticated';
export type NotificationFrequency = 'once_per_session' | 'once_per_week' | 'always';

export interface INotification {
  _id: string;
  title: string;
  message: string;
  imageUrl?: string;
  ctaText?: string;
  ctaUrl?: string;
  couponCode?: string;
  displayFormat: NotificationFormat;
  triggerType: NotificationTrigger;
  triggerValue: number; // seconds for delay (e.g. 8), percentage for scroll (e.g. 40)
  targetPages: string[]; // ['all'] or specific paths like ['/', '/products']
  targetAudience: NotificationAudience;
  frequencyCap: NotificationFrequency;
  priority: number; // 1-100, highest shown first
  startDate: string; // ISO 8601
  endDate: string; // ISO 8601
  isActive: boolean;
  metrics: {
    impressions: number;
    clicks: number;
    dismissals: number;
  };
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}
