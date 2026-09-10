// Telegram Bot API Service
// Использует Vite-прокси (/telegram-api) во время разработки, чтобы обойти CORS

export interface TelegramMessage {
  update_id: number;
  message?: {
    message_id: number;
    from: {
      id: number;
      first_name: string;
      last_name?: string;
      username?: string;
    };
    chat: {
      id: number;
      type: string;
      first_name?: string;
    };
    date: number;
    text?: string;
  };
}

export interface TelegramChat {
  chatId: number;
  userId: number;
  name: string;
  username?: string;
  lastMessage: string;
  lastTime: string;
  messages: TelegramChatMessage[];
  addedToCrm: boolean;
}

export interface TelegramChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'contact';
  time: string;
  date: number;
}

class TelegramService {
  private token: string = '';
  public lastUpdateId: number = 0;

  // Детектируем среду: dev-режим использует прокси, продакшн — прямой URL
  private baseUrl(): string {
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
      return `/telegram-api/bot${this.token}`;
    }
    return `https://api.telegram.org/bot${this.token}`;
  }

  setToken(token: string) {
    this.token = token;
  }

  resetOffset() {
    this.lastUpdateId = 0;
  }

  getToken(): string {
    return this.token;
  }

  async validateToken(token: string): Promise<{ ok: boolean; botName?: string; error?: string }> {
    try {
      const base = window.location.hostname === 'localhost'
        ? `/telegram-api/bot${token}`
        : `https://api.telegram.org/bot${token}`;
      const response = await fetch(`${base}/getMe`);
      const data = await response.json();
      if (data.ok) {
        return { ok: true, botName: data.result.first_name };
      }
      return { ok: false, error: 'Неверный токен. Проверьте правильность.' };
    } catch {
      return { ok: false, error: 'Ошибка подключения. Проверьте интернет.' };
    }
  }

  async getUpdates(): Promise<TelegramMessage[]> {
    if (!this.token) return [];
    try {
      const url = `${this.baseUrl()}/getUpdates?offset=${this.lastUpdateId + 1}&timeout=0&limit=100`;
      const response = await fetch(url);
      const data = await response.json();

      if (!data.ok || !data.result?.length) return [];

      const updates: TelegramMessage[] = data.result;
      if (updates.length > 0) {
        this.lastUpdateId = updates[updates.length - 1].update_id;
      }
      return updates;
    } catch {
      return [];
    }
  }

  async sendMessage(chatId: number, text: string): Promise<boolean> {
    if (!this.token) return false;
    try {
      const response = await fetch(`${this.baseUrl()}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text }),
      });
      const data = await response.json();
      return data.ok;
    } catch {
      return false;
    }
  }

  formatTime(unixTs: number): string {
    const date = new Date(unixTs * 1000);
    const h = date.getHours().toString().padStart(2, '0');
    const m = date.getMinutes().toString().padStart(2, '0');
    return `${h}:${m}`;
  }

  formatName(from: NonNullable<TelegramMessage['message']>['from']): string {
    const parts = [from.first_name, from.last_name].filter(Boolean);
    return parts.join(' ') || from.username || `User ${from.id}`;
  }
}

export const telegramService = new TelegramService();
