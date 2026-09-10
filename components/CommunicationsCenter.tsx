
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Phone, Video, Search, Image, Paperclip, MoreVertical, MessageCircle, Mail, X, Bot, Zap, Plus, UserPlus, CheckCircle } from 'lucide-react';
import { useAppStore } from '../store';
import { telegramService, TelegramChat } from '../services/telegramService';
import { DealStage, LeadSource } from '../types';

interface LocalChat {
  id: string;
  name: string;
  lastMsg: string;
  time: string;
  platform: 'Telegram' | 'WhatsApp' | 'Email';
  online: boolean;
  messages: { id: string; text: string; sender: 'user' | 'contact'; time: string }[];
  telegramChatId?: number;
  addedToCrm?: boolean;
}

const getInitialLocalChats = (): LocalChat[] => {
  const stored = localStorage.getItem('novacrm-local-chats');
  if (stored) { try { return JSON.parse(stored); } catch {} }
  return [
    { id: 'l1', name: 'Мария Петрова', lastMsg: 'Спасибо за звонок!', time: '10:20', platform: 'WhatsApp', online: false, messages: [
      { id: '1', text: 'Здравствуйте, Мария! Звоню по поводу вашего заказа.', sender: 'user', time: '10:10' },
      { id: '2', text: 'Спасибо за звонок!', sender: 'contact', time: '10:20' },
    ]},
    { id: 'l2', name: 'Дмитрий Соколов', lastMsg: 'Ок, договорились', time: 'Вчера', platform: 'Email', online: false, messages: [
      { id: '1', text: 'Ок, договорились', sender: 'contact', time: '16:30' },
    ]},
  ];
};

const CommunicationsCenter: React.FC<{ isDark: boolean }> = ({ isDark }) => {
  const {
    telegramBotToken, telegramChats, addDeal, markTelegramChatAsCrm,
    addTelegramMessage, upsertTelegramChat, setTelegramLastUpdateId, telegramLastUpdateId,
    telegramBotName, deals
  } = useAppStore();

  const [localChats, setLocalChats] = useState<LocalChat[]>(getInitialLocalChats);
  const [activeTab, setActiveTab] = useState<'all' | 'telegram'>('all');
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [pollingActive, setPollingActive] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // Объединяем Telegram-чаты и локальные чаты
  const allChats: LocalChat[] = [
    ...telegramChats.map(tc => ({
      id: `tg-${tc.chatId}`,
      name: tc.name,
      lastMsg: tc.lastMessage,
      time: tc.lastTime,
      platform: 'Telegram' as const,
      online: true,
      messages: tc.messages.map(m => ({ id: m.id, text: m.text, sender: m.sender, time: m.time })),
      telegramChatId: tc.chatId,
      addedToCrm: tc.addedToCrm,
    })),
    ...localChats,
  ];

  const filteredChats = allChats.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const activeChat = allChats.find(c => c.id === activeChatId) || filteredChats[0] || null;

  // Сохраняем локальные чаты
  useEffect(() => {
    localStorage.setItem('novacrm-local-chats', JSON.stringify(localChats));
  }, [localChats]);

  // Прокрутка к концу
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeChat?.messages]);

  // Telegram polling
  const startPolling = useCallback(() => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    if (!telegramBotToken) return;

    telegramService.setToken(telegramBotToken);
    setPollingActive(true);

    const poll = async () => {
      const updates = await telegramService.getUpdates();
      if (updates.length === 0) return;

      updates.forEach(update => {
        const msg = update.message;
        if (!msg || !msg.text) return;

        const chatId = msg.chat.id;
        const userId = msg.from.id;
        const name = telegramService.formatName(msg.from);
        const time = telegramService.formatTime(msg.date);
        const newMessage = {
          id: `tg-${msg.message_id}`,
          text: msg.text,
          sender: 'contact' as const,
          time,
          date: msg.date,
        };

        const existingChat = useAppStore.getState().telegramChats.find(c => c.chatId === chatId);

        if (existingChat) {
          addTelegramMessage(chatId, newMessage);
        } else {
          // Новый клиент из Telegram
          const newChat: TelegramChat = {
            chatId,
            userId,
            name,
            username: msg.from.username,
            lastMessage: msg.text,
            lastTime: time,
            messages: [newMessage],
            addedToCrm: false,
          };
          upsertTelegramChat(newChat);

          // Автоматически создаём сделку в воронке
          const deal = {
            id: `tg-deal-${chatId}-${Date.now()}`,
            title: `Telegram: ${name}`,
            amount: 0,
            contactId: '',
            contactName: name,
            contactPhone: '',
            contactEmail: '',
            source: LeadSource.TELEGRAM,
            stage: DealStage.NEW_LEAD,
            expectedCloseDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            priority: 'Средний' as const,
            items: [],
            comments: [],
          };
          addDeal(deal);
          markTelegramChatAsCrm(chatId);

          setNotification(`Новый клиент из Telegram: ${name} → добавлен в воронку!`);
          setTimeout(() => setNotification(null), 5000);
        }

        setTelegramLastUpdateId(update.update_id);
      });
    };

    poll(); // сразу
    pollingRef.current = setInterval(poll, 3000);
  }, [telegramBotToken]);

  useEffect(() => {
    if (telegramBotToken) {
      startPolling();
    }
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
      setPollingActive(false);
    };
  }, [telegramBotToken]);

  const handleSendMessage = async () => {
    if (!message.trim() || !activeChat) return;

    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const newMsg = { id: `m-${Date.now()}`, text: message, sender: 'user' as const, time: timeStr };

    if (activeChat.telegramChatId) {
      // Отправляем через Telegram Bot API
      const ok = await telegramService.sendMessage(activeChat.telegramChatId, message);
      if (ok) {
        addTelegramMessage(activeChat.telegramChatId, { ...newMsg, date: Math.floor(Date.now() / 1000) });
      }
    } else {
      // Локальный чат
      setLocalChats(prev => prev.map(c =>
        c.id === activeChat.id
          ? { ...c, messages: [...c.messages, newMsg], lastMsg: message, time: timeStr }
          : c
      ));
    }
    setMessage('');
  };

  const addToCrm = (chat: LocalChat) => {
    const deal = {
      id: `deal-${chat.id}-${Date.now()}`,
      title: `${chat.platform}: ${chat.name}`,
      amount: 0,
      contactId: '',
      contactName: chat.name,
      contactPhone: '',
      contactEmail: '',
      source: chat.platform === 'WhatsApp' ? LeadSource.TELEGRAM : LeadSource.INSTAGRAM,
      stage: DealStage.NEW_LEAD,
      expectedCloseDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      priority: 'Средний' as const,
      items: [], comments: [],
    };
    addDeal(deal);
    setLocalChats(prev => prev.map(c => c.id === chat.id ? { ...c, addedToCrm: true } : c));
    setNotification(`${chat.name} добавлен в воронку продаж!`);
    setTimeout(() => setNotification(null), 3000);
  };

  const platformColor = (platform: string) => {
    if (platform === 'Telegram') return 'bg-blue-500';
    if (platform === 'WhatsApp') return 'bg-emerald-500';
    return 'bg-rose-500';
  };

  return (
    <div className="flex flex-col gap-4 h-[calc(100vh-140px)]">
      {/* Уведомление */}
      {notification && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 animate-in slide-in-from-right-5">
          <CheckCircle size={18} />
          <span className="text-sm font-medium">{notification}</span>
        </div>
      )}

      {/* Статус Telegram */}
      {telegramBotToken && (
        <div className={`flex items-center gap-3 px-4 py-2 rounded-xl border text-sm ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-blue-50 border-blue-100'}`}>
          <div className={`w-2.5 h-2.5 rounded-full ${pollingActive ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></div>
          <Bot size={16} className="text-blue-500" />
          <span className={isDark ? 'text-slate-300' : 'text-blue-800'}>
            Telegram Bot <b>{telegramBotName}</b> {pollingActive ? '• Ожидание сообщений...' : '• Отключён'}
          </span>
          {!pollingActive && (
            <button onClick={startPolling} className="ml-auto text-xs px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Подключить
            </button>
          )}
        </div>
      )}

      {!telegramBotToken && (
        <div className={`flex items-center gap-3 px-4 py-2 rounded-xl border text-sm ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-amber-50 border-amber-100'}`}>
          <Zap size={16} className="text-amber-500" />
          <span className={isDark ? 'text-slate-400' : 'text-amber-800'}>
            Telegram не подключён. Настройте бота в разделе <b>Интеграции</b> или <b>Настройки</b>.
          </span>
        </div>
      )}

      <div className={`flex-1 flex rounded-2xl border overflow-hidden ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        {/* Список чатов */}
        <div className={`w-80 flex flex-col border-r ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
          <div className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Поиск чатов..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-10 pr-4 py-2 rounded-lg text-sm border focus:ring-2 focus:ring-indigo-500 outline-none ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {filteredChats.length === 0 && (
              <div className="p-6 text-center text-slate-400 text-sm">
                <MessageCircle size={32} className="mx-auto mb-2 opacity-30" />
                Нет чатов
              </div>
            )}
            {filteredChats.map(chat => (
              <button
                key={chat.id}
                onClick={() => setActiveChatId(chat.id)}
                className={`w-full p-4 flex items-center gap-3 transition-colors ${
                  activeChat?.id === chat.id
                    ? 'bg-indigo-50 dark:bg-indigo-900/20'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <div className="relative">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm ${platformColor(chat.platform)}`}>
                    {chat.name.charAt(0)}
                  </div>
                  {chat.online && <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900"></div>}
                </div>
                <div className="flex-1 text-left min-w-0">
                  <div className="flex justify-between items-center mb-0.5">
                    <h4 className="font-semibold text-sm truncate">{chat.name}</h4>
                    <span className="text-[10px] text-slate-400">{chat.time}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    {chat.platform === 'Telegram' && <Bot size={10} className="text-blue-500 shrink-0" />}
                    {chat.platform === 'WhatsApp' && <MessageCircle size={10} className="text-emerald-500 shrink-0" />}
                    {chat.platform === 'Email' && <Mail size={10} className="text-rose-500 shrink-0" />}
                    <span className="truncate">{chat.lastMsg}</span>
                  </div>
                </div>
                {chat.addedToCrm && (
                  <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" title="В воронке" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Область чата */}
        {activeChat ? (
          <div className="flex-1 flex flex-col bg-slate-50 dark:bg-slate-950/20">
            <div className={`p-4 flex items-center justify-between border-b ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm ${platformColor(activeChat.platform)}`}>
                  {activeChat.name.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-sm">{activeChat.name}</h4>
                  <span className="text-xs text-slate-400">{activeChat.platform}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!activeChat.addedToCrm && (
                  <button
                    onClick={() => addToCrm(activeChat)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition-colors"
                  >
                    <UserPlus size={14} />
                    В воронку
                  </button>
                )}
                {activeChat.addedToCrm && (
                  <span className="flex items-center gap-1 text-xs text-emerald-600 font-bold">
                    <CheckCircle size={14} />
                    В воронке
                  </span>
                )}
                <button className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"><Phone size={20} /></button>
                <button className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"><MoreVertical size={20} /></button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
              {activeChat.messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] p-3 rounded-2xl shadow-sm ${
                    msg.sender === 'user'
                      ? 'rounded-tr-none bg-indigo-600 text-white'
                      : `rounded-tl-none border ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-100 text-slate-800'}`
                  }`}>
                    <p className="text-sm">{msg.text}</p>
                    <span className={`text-[10px] mt-2 block ${msg.sender === 'user' ? 'text-indigo-200' : 'text-slate-400'}`}>{msg.time}</span>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <div className={`p-4 border-t ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  placeholder={activeChat.telegramChatId ? 'Ответить в Telegram...' : 'Написать сообщение...'}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  className={`flex-1 px-4 py-2 rounded-xl text-sm border focus:ring-2 focus:ring-indigo-500 outline-none ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}
                />
                <button
                  onClick={handleSendMessage}
                  className="p-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/20"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center flex-col gap-4 text-slate-400">
            <MessageCircle size={48} className="opacity-20" />
            <p className="text-sm">Выберите чат</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommunicationsCenter;
