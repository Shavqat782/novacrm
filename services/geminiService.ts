// Gemini Service
// Dev-режим: запросы идут через Vite-прокси /gemini-api, ключ подставляется
// на сервере (см. vite.config.ts плагин 'gemini-server-auth') и НЕ попадает в браузер.
// Продакшн: используется VITE_GEMINI_API_KEY напрямую (рекомендуется перенести в Edge Functions).

const MODEL = 'gemini-flash-latest';

const isDev = typeof window !== 'undefined' && window.location.hostname === 'localhost';
const prodKey = import.meta.env.VITE_GEMINI_API_KEY || '';

if (!isDev && !prodKey) {
  console.warn('VITE_GEMINI_API_KEY не установлен. AI функции будут недоступны.');
}

interface GeminiPart { text?: string }
interface GeminiResponse { candidates?: { content?: { parts?: GeminiPart[] } }[] }

async function callGemini(prompt: string, jsonSchema?: object): Promise<string | null> {
  const url = isDev
    ? '/gemini-api/v1beta/models/' + MODEL + ':generateContent'
    : 'https://generativelanguage.googleapis.com/v1beta/models/' + MODEL + ':generateContent';

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (!isDev && prodKey) headers['x-goog-api-key'] = prodKey;

  const body: Record<string, unknown> = {
    contents: [{ parts: [{ text: prompt }] }],
  };
  if (jsonSchema) {
    body.generationConfig = {
      responseMimeType: 'application/json',
      responseSchema: jsonSchema,
    };
  }

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error('Gemini API error: ' + res.status);
  const data: GeminiResponse = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.map(p => p.text || '').join('') ?? null;
  return text;
}

export const analyzeLeadQuality = async (contactData: string) => {
  try {
    const text = await callGemini(
      `Проанализируй данные этого лида в CRM и предоставь оценку качества (0-100), краткое резюме и 3 конкретных совета для менеджера по продажам.
      ОТВЕТ ДОЛЖЕН БЫТЬ ТОЛЬКО НА РУССКОМ ЯЗЫКЕ В ФОРМАТЕ JSON.
      Данные лида: ${contactData}`,
      {
        type: 'OBJECT',
        properties: {
          score: { type: 'NUMBER' },
          summary: { type: 'STRING' },
          tips: { type: 'ARRAY', items: { type: 'STRING' } }
        },
        required: ['score', 'summary', 'tips']
      }
    );
    return text ? JSON.parse(text) : null;
  } catch (error) {
    console.error("Gemini Lead Analysis failed:", error);
    return { score: 50, summary: "Не удалось провести анализ.", tips: ["Проверьте данные вручную"] };
  }
};

export const generateSmartResponse = async (chatHistory: string) => {
  try {
    const text = await callGemini(
      `Ты - AI ассистент по продажам в CRM системе NovaCRM. Твоя задача - помогать менеджеру общаться с клиентами.
      На основе истории чата предложи профессиональный и вежливый ответ на РУССКОМ ЯЗЫКЕ, который поможет продвинуть сделку вперед.
      История: ${chatHistory}`
    );
    return text || "Извините, я не смог сгенерировать ответ.";
  } catch (error) {
    console.error("Gemini smart response failed:", error);
    return "Сервис временно недоступен.";
  }
};
