
import React, { useState } from 'react';
import { Bot, CheckCircle, X, ExternalLink, MessageCircle, Zap, Globe, Mail, BarChart2, ShoppingCart, Plus, ChevronRight, Phone } from 'lucide-react';
import { useAppStore } from '../store';

interface Integration {
  id: string;
  name: string;
  desc: string;
  icon: React.ReactNode;
  color: string;
  connected: boolean;
  badge?: string;
}

const IntegrationsView: React.FC<{ isDark: boolean }> = ({ isDark }) => {
  const { telegramBotToken, telegramBotName, setActiveView } = useAppStore();
  const [connectedIds, setConnectedIds] = useState<Set<string>>(new Set());
  const [showTelegramHelp, setShowTelegramHelp] = useState(false);

  const integrations: Integration[] = [
    {
      id: 'telegram',
      name: 'Telegram Bot',
      desc: 'Получайте сообщения клиентов прямо в CRM. Клиенты автоматически попадают в воронку продаж.',
      icon: <Bot size={28} />,
      color: 'bg-blue-500',
      connected: !!telegramBotToken,
      badge: 'Бесплатно'
    },
    {
      id: 'whatsapp',
      name: 'WhatsApp Business',
      desc: 'Официальный WhatsApp API через Meta Cloud API. Требует верификации бизнеса.',
      icon: <MessageCircle size={28} />,
      color: 'bg-emerald-500',
      connected: connectedIds.has('whatsapp'),
      badge: 'Требует верификации'
    },
    {
      id: 'instagram',
      name: 'Instagram Direct',
      desc: 'Автоматически получайте сообщения из Direct прямо в CRM.',
      icon: <Globe size={28} />,
      color: 'bg-pink-500',
      connected: connectedIds.has('instagram'),
    },
    {
      id: 'email',
      name: 'Почта (IMAP/SMTP)',
      desc: 'Подключите вашу корпоративную почту и управляйте перепиской с клиентами.',
      icon: <Mail size={28} />,
      color: 'bg-rose-500',
      connected: connectedIds.has('email'),
    },
    {
      id: 'analytics',
      name: 'Google Analytics',
      desc: 'Отслеживайте путь клиента от первого касания до закрытой сделки.',
      icon: <BarChart2 size={28} />,
      color: 'bg-amber-500',
      connected: connectedIds.has('analytics'),
    },
    {
      id: 'shop',
      name: 'Интернет-магазин',
      desc: 'Импортируйте заказы из Shopify, WooCommerce или 1С и создавайте сделки автоматически.',
      icon: <ShoppingCart size={28} />,
      color: 'bg-violet-500',
      connected: connectedIds.has('shop'),
    },
  ];

  const toggle = (id: string) => {
    if (id === 'telegram') {
      setActiveView('settings');
      return;
    }
    setConnectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const connected = integrations.filter(i => i.connected);
  const available = integrations.filter(i => !i.connected);

  return (
    <div className="space-y-8">
      <div>
        <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Интеграции</h2>
        <p className={isDark ? 'text-slate-400' : 'text-slate-500'}>Подключите сторонние сервисы для автоматизации продаж.</p>
      </div>

      {/* Telegram Hero Card */}
      <div className={`relative overflow-hidden rounded-3xl p-8 bg-gradient-to-r from-blue-600 to-blue-700 text-white`}>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Bot size={32} />
              <h3 className="text-2xl font-black">Telegram Bot</h3>
              <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs font-bold uppercase">Бесплатно</span>
            </div>
            {telegramBotToken ? (
              <p className="text-blue-100 text-sm">
                ✅ Бот <b>{telegramBotName}</b> подключён — ждёт сообщений от клиентов
              </p>
            ) : (
              <p className="text-blue-100 text-sm max-w-lg">
                Создайте бесплатного Telegram-бота через @BotFather, внесите токен в Настройки — и все сообщения клиентов сразу появятся в CRM. Новые клиенты автоматически попадают в воронку «Новый лид».
              </p>
            )}
          </div>
          <div className="flex flex-col gap-3 shrink-0">
            {telegramBotToken ? (
              <button
                onClick={() => setActiveView('settings')}
                className="px-6 py-3 bg-white text-blue-700 font-bold rounded-xl hover:bg-blue-50 transition-colors"
              >
                Настройки бота
              </button>
            ) : (
              <>
                <button
                  onClick={() => setActiveView('settings')}
                  className="px-6 py-3 bg-white text-blue-700 font-bold rounded-xl hover:bg-blue-50 transition-colors flex items-center gap-2"
                >
                  <Zap size={18} />
                  Подключить бота
                </button>
                <button
                  onClick={() => setShowTelegramHelp(!showTelegramHelp)}
                  className="px-6 py-3 bg-blue-500/40 text-white font-bold rounded-xl hover:bg-blue-500/60 transition-colors text-sm"
                >
                  Инструкция
                </button>
              </>
            )}
          </div>
        </div>

        {showTelegramHelp && (
          <div className="relative z-10 mt-6 bg-white/10 rounded-2xl p-5">
            <h4 className="font-bold mb-3">Как подключить за 2 минуты:</h4>
            <ol className="space-y-2 text-sm text-blue-100">
              <li className="flex gap-2"><span className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center text-xs font-bold shrink-0">1</span> Откройте Telegram → найдите <b>@BotFather</b> → /newbot</li>
              <li className="flex gap-2"><span className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center text-xs font-bold shrink-0">2</span> Придумайте имя боту (например: MySalesBot)</li>
              <li className="flex gap-2"><span className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center text-xs font-bold shrink-0">3</span> Скопируйте токен вида <code className="bg-white/20 px-1 rounded">1234567890:ABC-xxx</code></li>
              <li className="flex gap-2"><span className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center text-xs font-bold shrink-0">4</span> Перейдите в <b>Настройки → Telegram Bot</b> и вставьте токен</li>
              <li className="flex gap-2"><span className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center text-xs font-bold shrink-0">5</span> Готово! Отправьте своему боту сообщение и посмотрите на раздел Сообщения</li>
            </ol>
          </div>
        )}
      </div>

      {/* WhatsApp info card */}
      <div className={`rounded-2xl border p-6 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shrink-0">
            <MessageCircle size={24} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-bold">WhatsApp Business API</h3>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isDark ? 'bg-amber-900/30 text-amber-400' : 'bg-amber-100 text-amber-700'}`}>Требует регистрации</span>
            </div>
            <p className={`text-sm mb-3 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Бесплатный тариал через Meta Cloud API. Необходима верификация бизнеса. Первые 1,000 разговоров/месяц — бесплатно.
            </p>
            <a href="https://business.whatsapp.com/products/business-platform" target="_blank" rel="noopener noreferrer"
               className="inline-flex items-center gap-1.5 text-sm font-bold text-emerald-600 hover:underline">
              <ExternalLink size={14} /> Перейти на Meta Business
            </a>
          </div>
        </div>
      </div>

      {/* Other integrations */}
      {connected.length > 0 && (
        <div>
          <h3 className={`font-bold mb-4 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>✅ Подключённые</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {connected.filter(i => i.id !== 'telegram').map(int => (
              <IntCard key={int.id} int={int} isDark={isDark} onToggle={toggle} />
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className={`font-bold mb-4 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Доступные интеграции</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {available.filter(i => i.id !== 'telegram').map(int => (
            <IntCard key={int.id} int={int} isDark={isDark} onToggle={toggle} />
          ))}
        </div>
      </div>
    </div>
  );
};

const IntCard: React.FC<{ int: any; isDark: boolean; onToggle: (id: string) => void }> = ({ int, isDark, onToggle }) => (
  <div className={`p-5 rounded-2xl border transition-all hover:shadow-md ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
    <div className="flex items-start justify-between mb-3">
      <div className={`w-12 h-12 ${int.color} rounded-2xl flex items-center justify-center text-white`}>
        {int.icon}
      </div>
      {int.badge && (
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-600'}`}>
          {int.badge}
        </span>
      )}
    </div>
    <h4 className="font-bold mb-1">{int.name}</h4>
    <p className={`text-xs mb-4 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{int.desc}</p>
    <button
      onClick={() => onToggle(int.id)}
      className={`w-full py-2 rounded-xl font-bold text-sm transition-all ${
        int.connected
          ? 'bg-emerald-100 text-emerald-700 hover:bg-rose-100 hover:text-rose-700 dark:bg-emerald-900/30 dark:text-emerald-400'
          : 'bg-indigo-600 text-white hover:bg-indigo-700'
      }`}
    >
      {int.connected ? '✓ Подключён' : 'Подключить'}
    </button>
  </div>
);

export default IntegrationsView;
