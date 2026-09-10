import React, { useState, useEffect, Suspense, lazy } from 'react';
import { supabase } from './lib/supabase';
import { dealService, taskService, chatService, settingsService, teamService, dealItemService, productService } from './lib/database';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAppStore } from './store';
import Auth from './components/Auth';
import InvitePage from './components/InvitePage';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import Dashboard from './components/Dashboard';
import DealsBoard from './components/DealsBoard';
import TasksList from './components/TasksList';
import { Bot, X, Send, Sparkles, Loader } from 'lucide-react';
import { generateSmartResponse } from './services/geminiService';
import { Deal, Task, AuthUser, DealStage, LeadSource, Product, DealItem } from './types';
import { telegramService, TelegramChat } from './services/telegramService';

// Code-splitting: тяжёлые вьюхи грузятся лениво (уменьшает стартовый бандл)
const TeamView = lazy(() => import('./components/TeamView'));
const AnalyticsView = lazy(() => import('./components/AnalyticsView'));
const CommunicationsCenter = lazy(() => import('./components/CommunicationsCenter'));
const FinanceView = lazy(() => import('./components/FinanceView'));
const IntegrationsView = lazy(() => import('./components/IntegrationsView'));
const SettingsView = lazy(() => import('./components/SettingsView'));
const ServiceDesk = lazy(() => import('./components/ServiceDesk'));
const ProductsView = lazy(() => import('./components/ProductsView'));


const App: React.FC = () => {
  // Состояние аутентификации
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
  const [inviteCode, setInviteCode] = useState<string | null>(null);

  // Zustand store
  const {
    deals, tasks, team, products, sales,
    setDeals, setTasks,
    addDeal, deleteDeal, updateProduct, moveDealToStage,
    addTask, deleteTask,
    isDark, setIsDark,
    activeView, setActiveView,
    telegramBotToken, telegramBotName,
    upsertTelegramChat, addTelegramMessage, markTelegramChatAsCrm, setTelegramLastUpdateId,
    telegramLastUpdateId,
  } = useAppStore();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<{role: string, text: string}[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Проверка инвайта в URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('invite');
    if (code) {
      setInviteCode(code);
    }
  }, []);

  // Проверка сессии при загрузке
  useEffect(() => {
    const checkSession = async () => {
      try {
        const demoUser = localStorage.getItem('novacrm_demo_user');
        if (demoUser) {
          setUser(JSON.parse(demoUser));
          setAuthLoading(false);
          return;
        }

        const { data: { user: currentUser } } = await supabase.auth.getUser();
        setUser(currentUser || null);
      } catch (err) {
        console.error('Session check failed:', err);
      } finally {
        setAuthLoading(false);
      }
    };

    checkSession();

    // Слушаем изменения аутентификации
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session?.user) {
          setUser(session.user);
        }
      }
    );

    return () => subscription?.unsubscribe();
  }, []);

  // Загрузка данных через React Query (кэш, retry, refetch)
  const dealsQuery = useQuery({
    queryKey: ['deals', user?.id],
    queryFn: () => dealService.getAll(user!.id),
    enabled: !!user,
  });
  const tasksQuery = useQuery({
    queryKey: ['tasks', user?.id],
    queryFn: () => taskService.getAll(user!.id),
    enabled: !!user,
  });

  // Синхронизируем React Query -> Zustand
  useEffect(() => {
    if (dealsQuery.data && dealsQuery.data.length > 0) setDeals(dealsQuery.data as Deal[]);
    if (dealsQuery.isError) {
      console.warn('Supabase deals unavailable, using local data:', dealsQuery.error);
    }
    setLoading(dealsQuery.isLoading || tasksQuery.isLoading);
  }, [dealsQuery.data, dealsQuery.isLoading, dealsQuery.isError, tasksQuery.data, tasksQuery.isLoading]);

  useEffect(() => {
    if (tasksQuery.data && tasksQuery.data.length > 0) setTasks(tasksQuery.data as Task[]);
  }, [tasksQuery.data]);

  const queryClient = useQueryClient();

  // Команда из Supabase (реально работающие приглашения)
  const teamQuery = useQuery({
    queryKey: ['team', user?.id],
    queryFn: () => teamService.getTeam(user!.id),
    enabled: !!user,
  });
  useEffect(() => {
    if (teamQuery.data) useAppStore.getState().setTeam(teamQuery.data);
  }, [teamQuery.data]);

  // Товары из Supabase (для выбора в сделках)
  const productsQuery = useQuery({
    queryKey: ['products', user?.id],
    queryFn: () => productService.getAll(user!.id),
    enabled: !!user,
  });
  useEffect(() => {
    if (productsQuery.data) useAppStore.getState().setProducts(productsQuery.data as Product[]);
  }, [productsQuery.data]);

  // Товары сделок (items) из БД -> мержим в сделки
  useEffect(() => {
    if (!dealsQuery.data?.length) return;
    (async () => {
      try {
        const rows = await dealItemService.getAllByDeals(dealsQuery.data!.map(d => d.id));
        if (rows.length) {
          const byDeal = new Map<string, DealItem[]>();
          for (const r of rows) {
            const list = byDeal.get(r.deal_id) || [];
            list.push({
              id: r.id, dealId: r.deal_id, productId: r.product_id,
              quantity: r.quantity, price: Number(r.price), totalPrice: Number(r.total_price),
            });
            byDeal.set(r.deal_id, list);
          }
          for (const [dealId, items] of byDeal) {
            const deal = useAppStore.getState().deals.find(d => d.id === dealId);
            if (deal && (!deal.items || deal.items.length === 0)) {
              useAppStore.getState().updateDeal(dealId, { items });
            }
          }
        }
      } catch { /* deal_items могут отсутствовать в старой БД */ }
    })();
  }, [dealsQuery.data]);

  // Восстановление Telegram-токена из Supabase (работает на всех устройствах)
  useEffect(() => {
    if (!user || telegramBotToken) return;
    (async () => {
      try {
        const value = await settingsService.get(user.id, 'telegram');
        if (value && typeof value === 'object' && 'botToken' in value) {
          const { setTelegramBotToken } = useAppStore.getState();
          setTelegramBotToken((value as { botToken: string }).botToken);
        }
      } catch { /* Supabase недоступен — остаёмся на localStorage */ }
    })();
  }, [user, telegramBotToken]);

  // Realtime: живые обновления сделок и задач от Supabase
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('novacrm-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'deals' }, () => {
        void dealsQuery.refetch();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
        void tasksQuery.refetch();
      })
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [user, dealsQuery, tasksQuery]);

  // Сохранение Telegram-токена в Supabase (синхронизация между устройствами)
  useEffect(() => {
    if (!user || !telegramBotToken) return;
    void settingsService.set(user.id, 'telegram', { botToken: telegramBotToken }).catch(() => {});
  }, [user, telegramBotToken]);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  // === ГЛОБАЛЬНЫЙ Telegram polling ===
  const pollingRef = React.useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (!telegramBotToken) {
      if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null; }
      return;
    }
    telegramService.setToken(telegramBotToken);
    // Восстанавливаем offset из store
    if (telegramLastUpdateId > 0) {
      telegramService.lastUpdateId = telegramLastUpdateId;
    }
    const poll = async () => {
      const updates = await telegramService.getUpdates();
      if (!updates.length) return;
      updates.forEach(update => {
        const msg = update.message;
        if (!msg?.text) return;
        const chatId = msg.chat.id;
        const name = telegramService.formatName(msg.from);
        const time = telegramService.formatTime(msg.date);
        const newMessage = { id: `tg-${msg.message_id}`, text: msg.text, sender: 'contact' as const, time, date: msg.date };
        const existing = useAppStore.getState().telegramChats.find(c => c.chatId === chatId);
        if (existing) {
          addTelegramMessage(chatId, newMessage);
        } else {
          const newChat: TelegramChat = {
            chatId, userId: msg.from.id, name,
            username: msg.from.username,
            lastMessage: msg.text, lastTime: time,
            messages: [newMessage], addedToCrm: true,
          };
          upsertTelegramChat(newChat);
          const deal = {
            id: `tg-deal-${chatId}-${Date.now()}`,
            title: `Telegram: ${name}`,
            amount: 0, contactId: '', contactName: name,
            contactPhone: '', contactEmail: '',
            source: LeadSource.TELEGRAM,
            stage: DealStage.NEW_LEAD,
            expectedCloseDate: new Date(Date.now() + 7*24*60*60*1000).toISOString().split('T')[0],
            priority: 'Средний' as const, items: [], comments: [],
          };
          addDeal(deal);
          markTelegramChatAsCrm(chatId);
        }
        setTelegramLastUpdateId(update.update_id);
      });
    };
    poll();
    pollingRef.current = setInterval(poll, 3000);
    return () => { if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null; } };
  }, [telegramBotToken]);

  const handleSendMessage = async () => {
    if (!chatMessage.trim() || !user) return;
    
    const userMsg = chatMessage;
    setChatMessage('');
    setChatHistory(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsTyping(true);

    try {
      // Сохраняем в БД
      await chatService.saveMessage(user.id, 'user', userMsg);

      const response = await generateSmartResponse(JSON.stringify([...chatHistory, { role: 'user', text: userMsg }]));
      const aiResponse = response || "Извините, возникла ошибка при обработке запроса.";
      
      setChatHistory(prev => [...prev, { role: 'ai', text: aiResponse }]);
      
      // Сохраняем ответ AI в БД
      await chatService.saveMessage(user.id, 'ai', aiResponse);
    } catch (err: any) {
      setChatHistory(prev => [...prev, { role: 'ai', text: "Сервис временно недоступен." }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleDeleteDeal = async (id: string) => {
    try {
      await dealService.delete(id);
    } catch (err: any) {
      console.warn('Supabase delete failed, removing locally:', err.message);
    }
    deleteDeal(id);
  };

  const handleAddDeal = async (deal: Omit<Deal, 'id'>) => {
    if (!user) return;
    try {
      const newDeal = await dealService.create(user.id, deal);
      const saved = newDeal as Deal;
      // Сохраняем выбранный товар сделки в БД
      if (deal.items && deal.items.length > 0) {
        try {
          await dealItemService.createForDeal(user.id, saved.id, deal.items);
        } catch (err) {
          console.warn('deal_items save failed:', err);
        }
      }
      addDeal({ ...saved, items: deal.items });
      void queryClient.invalidateQueries({ queryKey: ['deals', user.id] });
    } catch (err: any) {
      // Если Supabase недоступен, сохраняем локально
      const localDeal: Deal = { ...deal, id: `local-${Date.now()}` } as Deal;
      addDeal(localDeal);
    }
  };

  // Перемещение сделки: при "Оплачено" списываем купленный товар со склада
  const handleMoveDeal = async (dealId: string, newStage: DealStage) => {
    const deal = useAppStore.getState().deals.find(d => d.id === dealId);
    moveDealToStage(dealId, newStage);

    if (newStage === DealStage.CLOSED_WON && user && deal?.items?.length) {
      for (const item of deal.items) {
        try {
          const newStock = await productService.decrementStock(user.id, item.productId, item.quantity);
          updateProduct(item.productId, { stock: newStock });
          console.log(`Списано: ${item.productName} × ${item.quantity}. Остаток: ${newStock}`);
        } catch (err) {
          console.warn('Stock decrement failed:', err);
        }
      }
      void queryClient.invalidateQueries({ queryKey: ['products', user.id] });
    }
  };

  const handleAddTask = async (task: Omit<Task, 'id'>) => {
    if (!user) return;
    try {
      const newTask = await taskService.create(user.id, task);
      addTask(newTask as Task);
    } catch (err: any) {
      const localTask: Task = { ...task, id: `local-${Date.now()}` } as Task;
      addTask(localTask);
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      await taskService.delete(id);
    } catch (err: any) {
      console.warn('Supabase delete failed, removing locally:', err.message);
    }
    deleteTask(id);
  };

  const renderView = () => {
    const props = { isDark };
    switch (activeView) {
      case 'dashboard': return <Dashboard {...props} contactsCount={0} dealsCount={deals.length} />;
      case 'deals': return <DealsBoard {...props} deals={deals} contacts={[]} products={products} onAdd={handleAddDeal} onDelete={handleDeleteDeal} onMove={handleMoveDeal} />;
      case 'products': return <ProductsView {...props} products={products} sales={sales} team={team} />;
      case 'tasks': return <TasksList {...props} tasks={tasks} team={team} onAdd={handleAddTask} onDelete={handleDeleteTask} />;
      case 'team': return <TeamView {...props} team={team} userId={user?.id} />;
      case 'analytics': return <AnalyticsView {...props} />;
      case 'communications': return <CommunicationsCenter {...props} />;
      case 'finance': return <FinanceView {...props} userId={user?.id} />;
      case 'integrations': return <IntegrationsView {...props} />;
      case 'servicedesk': return <ServiceDesk {...props} />;
      case 'settings': return <SettingsView {...props} />;
      default: return (
        <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-50">
          <Sparkles size={48} className="text-indigo-500" />
          <h2 className="text-xl font-bold">Модуль в разработке</h2>
        </div>
      );
    }
  };

  // Показываем Auth экран если нет пользователя
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-600 to-violet-700 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader className="animate-spin text-white" size={40} />
          <p className="text-white text-lg">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    if (inviteCode) {
      return <InvitePage inviteCode={inviteCode} onSuccess={() => window.location.href = '/'} />;
    }
    return <Auth onSuccess={() => {}} />;
  }

  return (
    <div className={`flex h-screen w-full transition-colors duration-200 ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      <Sidebar 
        activeView={activeView} 
        setActiveView={setActiveView} 
        isDark={isDark} 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <TopBar 
          isDark={isDark} 
          setIsDark={setIsDark} 
          toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          user={user}
        />
        
        {error && (
          <div className={`p-4 mx-4 mt-4 rounded-lg border-l-4 flex justify-between items-center ${
            isDark ? 'bg-rose-900/20 border-rose-600' : 'bg-rose-50 border-rose-600'
          }`}>
            <p className={isDark ? 'text-rose-200' : 'text-rose-800'}>{error}</p>
            <button onClick={() => setError(null)} className="text-rose-600 hover:text-rose-800">✕</button>
          </div>
        )}
        
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <Loader className="animate-spin text-indigo-600" size={40} />
              <p className={isDark ? 'text-slate-400' : 'text-slate-600'}>Загрузка данных...</p>
            </div>
          </div>
        ) : (
          <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
            <div className="max-w-7xl mx-auto h-full">
              <Suspense fallback={
                <div className="flex items-center justify-center h-full">
                  <Loader className="animate-spin text-indigo-500" size={32} />
                </div>
              }>
                {renderView()}
              </Suspense>
            </div>
          </main>
        )}

        <button 
          onClick={() => setIsAIChatOpen(!isAIChatOpen)}
          className="fixed bottom-8 right-8 w-14 h-14 bg-indigo-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-40 group"
        >
          {isAIChatOpen ? <X size={24} /> : <Bot size={24} />}
        </button>

        {isAIChatOpen && (
          <div className={`fixed bottom-24 right-8 w-full max-w-[calc(100%-2rem)] md:w-96 h-[500px] flex flex-col shadow-2xl rounded-2xl border z-50 overflow-hidden transition-all duration-300 animate-in slide-in-from-bottom-5 ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className="p-4 bg-indigo-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot size={20} />
                <span className="font-bold text-sm">Nova AI</span>
              </div>
              <Sparkles size={14} className="animate-pulse" />
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-slate-50 dark:bg-slate-900/50">
              {chatHistory.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                    msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none shadow-md' : `${isDark ? 'bg-slate-800' : 'bg-white'} border rounded-tl-none`
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {isTyping && <div className="text-xs text-slate-400 italic">Печатает...</div>}
            </div>

            <div className="p-4 border-t dark:border-slate-800">
              <div className="relative">
                <input 
                  type="text" 
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Задайте вопрос..."
                  className={`w-full pl-4 pr-12 py-3 rounded-xl border text-sm focus:ring-2 focus:ring-indigo-500 outline-none ${
                    isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
                  }`}
                />
                <button onClick={handleSendMessage} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-indigo-600 text-white rounded-lg flex items-center justify-center">
                  <Send size={16} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
