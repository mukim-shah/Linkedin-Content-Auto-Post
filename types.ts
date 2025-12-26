
export type Platform = 'Instagram' | 'LinkedIn';
export type Tone = 'Professional' | 'Viral' | 'Funny';

export interface PostFormData {
  platform: Platform;
  content: string;
  tone: Tone;
  postDate: string;
  postTime: string;
}

export interface WebhookResponse {
  success: boolean;
  message?: string;
}
