
import React, { useState } from 'react';
import { User, Shield, Bell, Zap, Database, CreditCard, ChevronRight, Bot, CheckCircle, X, Loader, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAppStore } from '../store';
import { telegramService } from '../services/telegramService';

const SettingsView: React.FC<{ isDark: boolean }> = ({ isDark }) => {
  const { telegramBotToken, telegramBotName, setTelegramBotToken, clearTelegramBot } = useAppStore();
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [botToken, setBotToken] = useState(telegramBotToken);
  const [showToken, setShowToken] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [tokenSuccess, setTokenSuccess] = useState(false);

  const sections = [
    { id: 'telegram', icon: <Bot size={20} />, title: 'Telegram Bot', desc: telegramBotToken ? `Подключён: ${telegramBotName}` : 'Настройте бота для получения сообщений в CRM.', color: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' },
    { id: 'profile', icon: <User size={20} />, title: 'Профиль сотрудника', desc: 'Фото, имя, должность и контактные данные.', color: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400' },
    { id: 'security', icon: <Shield size={20} />, title: 'Безопасность', desc: 'Пароль, двухфакторная аутентификация и сессии.', color: 'bg-violet-50 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400' },
    { id: 'notifications', icon: <Bell size={20} />, title: 'Уведомления', desc: 'Push, Email и уведомления в Telegram.', color: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' },
    { id: 'data', icon: <Database size={20} />, title: 'Данные системы', desc: 'Экспорт/Импорт, валюта, поля контактов.', color: 'bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-400' },
    { id: 'billing', icon: <CreditCard size={20} />, title: 'Тариф и оплата', desc: 'Ваш текущий план: Enterprise.', color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' },
  ];

  const handleValidateToken = async () => {
    if (!botToken.trim()) return;
    setIsValidating(true);
    setTokenError(null);
    setTokenSuccess(false);

    const result = await telegramService.validateToken(botToken.trim());
    
    if (result.ok) {
      setTelegramBotToken(botToken.trim(), result.botName);
      setTokenSuccess(true);
      setTimeout(() => setTokenSuccess(false), 3000);
    } else {
      setTokenError(result.error || 'Ошибка');
    }
    setIsValidating(false);
  };

  const handleDisconnect = () => {
    if (confirm('Отключить Telegram Bot?')) {
      clearTelegramBot();
      setBotToken('');
      setTokenError(null);
    }
  };

  const cardClass = `${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div>
        <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Настройки системы</h2>
        <p className={isDark ? 'text-slate-400' : 'text-slate-500'}>Персонализация NovaCRM под ваши бизнес-процессы.</p>
      </div>

      <div className={`rounded-2xl border overflow-hidden ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
        {sections.map((section, idx) => (
          <div key={section.id}>
            {idx > 0 && <div className="h-px bg-slate-100 dark:bg-slate-800" />}
            <button
              onClick={() => setActiveSection(activeSection === section.id ? null : section.id)}
              className="w-full flex items-center gap-4 p-6 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-left group"
            >
              <div className={`p-3 rounded-xl ${section.color}`}>
                {section.icon}
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-sm">{section.title}</h4>
                <p className="text-xs text-slate-500 mt-0.5">{section.desc}</p>
              </div>
              {section.id === 'telegram' && telegramBotToken && (
                <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-full">
                  <CheckCircle size={12} /> Подключён
                </span>
              )}
              <ChevronRight className={`text-slate-300 group-hover:text-indigo-500 transition-all ${activeSection === section.id ? 'rotate-90' : ''}`} size={20} />
            </button>

            {/* Telegram Bot настройки */}
            {activeSection === 'telegram' && section.id === 'telegram' && (
              <div className={`px-6 pb-6 border-t ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                <div className="pt-4 space-y-4">
                  {/* Инструкция */}
                  <div className={`p-4 rounded-xl text-sm space-y-2 ${isDark ? 'bg-blue-900/20 border border-blue-800' : 'bg-blue-50 border border-blue-100'}`}>
                    <p className="font-bold text-blue-600 flex items-center gap-2"><Bot size={16}/>Как подключить Telegram Bot (бесплатно)</p>
                    <ol className="space-y-1.5 text-slate-600 dark:text-slate-400 pl-4 list-decimal text-xs">
                      <li>Откройте Telegram и найдите <b>@BotFather</b></li>
                      <li>Отправьте команду <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">/newbot</code></li>
                      <li>Введите имя и username для бота (например: <code>MyShopBot</code>)</li>
                      <li>Скопируйте токен вида <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">1234567890:ABC-...</code></li>
                      <li>Вставьте токен ниже и нажмите «Подключить»</li>
                      <li><b>Напишите своему боту любое сообщение</b> — клиент автоматически появится в воронке!</li>
                    </ol>
                  </div>

                  {/* Ввод токена */}
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase block mb-2">Токен бота (Bot Token)</label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input
                          type={showToken ? 'text' : 'password'}
                          value={botToken}
                          onChange={(e) => { setBotToken(e.target.value); setTokenError(null); }}
                          placeholder="1234567890:ABCDEFGHijklmnopqrstuvwxyz"
                          className={`w-full pr-10 px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-mono ${
                            isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                          } ${tokenError ? 'border-rose-500' : ''}`}
                        />
                        <button onClick={() => setShowToken(!showToken)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                          {showToken ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                      <button
                        onClick={handleValidateToken}
                        disabled={isValidating || !botToken.trim()}
                        className="px-5 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2 text-sm whitespace-nowrap"
                      >
                        {isValidating && <Loader size={16} className="animate-spin" />}
                        {tokenSuccess ? '✓ Подключён!' : 'Подключить'}
                      </button>
                    </div>
                    {tokenError && (
                      <div className="flex items-center gap-2 mt-2 text-rose-600 text-sm">
                        <AlertCircle size={14} />{tokenError}
                      </div>
                    )}
                  </div>

                  {telegramBotToken && (
                    <div className={`p-4 rounded-xl flex items-center justify-between ${isDark ? 'bg-emerald-900/20 border border-emerald-800' : 'bg-emerald-50 border border-emerald-100'}`}>
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></div>
                        <span className="text-sm font-bold text-emerald-600">Бот <i>{telegramBotName}</i> активен — ждёт сообщений</span>
                      </div>
                      <button onClick={handleDisconnect} className="text-rose-500 hover:text-rose-700 text-xs flex items-center gap-1">
                        <X size={14}/> Отключить
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Профиль */}
            {activeSection === 'profile' && section.id === 'profile' && (
              <div className={`px-6 pb-6 space-y-4 border-t ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                <div className="pt-4 grid grid-cols-2 gap-4">
                  {['Имя', 'Фамилия', 'Email', 'Должность'].map(field => (
                    <div key={field}>
                      <label className="text-xs font-bold text-slate-500 uppercase block mb-1">{field}</label>
                      <input
                        type="text"
                        placeholder={`Введите ${field.toLowerCase()}...`}
                        className={`w-full px-4 py-2.5 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}
                      />
                    </div>
                  ))}
                </div>
                <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 transition-colors">
                  Сохранить изменения
                </button>
              </div>
            )}

            {/* Уведомления */}
            {activeSection === 'notifications' && section.id === 'notifications' && (
              <div className={`px-6 pb-6 space-y-3 border-t ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                <div className="pt-4 space-y-3">
                  {[
                    'Новые сделки в воронке',
                    'Сообщения из Telegram',
                    'Задачи с истекающим сроком',
                    'Действия команды',
                    'Еженедельный отчёт',
                  ].map(notif => (
                    <label key={notif} className="flex items-center justify-between py-2 cursor-pointer group">
                      <span className="text-sm font-medium group-hover:text-indigo-500 transition-colors">{notif}</span>
                      <div className="relative">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:bg-indigo-600 transition-colors"></div>
                        <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 left-0.5 peer-checked:translate-x-5 transition-transform shadow"></div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className={`p-6 rounded-2xl border ${isDark ? 'bg-rose-500/5 border-rose-500/20' : 'bg-rose-50 border-rose-100'}`}>
        <h4 className="text-rose-600 font-bold mb-1">Опасная зона</h4>
        <p className="text-sm text-rose-600/70 mb-4">Удаление аккаунта компании приведёт к безвозвратной потере всех сделок и данных.</p>
        <button
          onClick={() => {
            if (confirm('Очистить все данные CRM? Это действие невозможно отменить!')) {
              localStorage.removeItem('novacrm-storage');
              window.location.reload();
            }
          }}
          className="px-4 py-2 bg-rose-600 text-white rounded-lg text-xs font-bold hover:bg-rose-700 transition-colors"
        >
          Удалить данные CRM
        </button>
      </div>
    </div>
  );
};

export default SettingsView;
