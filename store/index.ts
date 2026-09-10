import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Deal, Task, TeamMember, Product, Sale, DealComment } from '../types';
import type { TelegramChat } from '../services/telegramService';

export interface AppState {
  // Данные
  deals: Deal[];
  tasks: Task[];
  team: TeamMember[];
  products: Product[];
  sales: Sale[];
  dealComments: Record<string, DealComment[]>;

  // Telegram
  telegramBotToken: string;
  telegramBotName: string;
  telegramChats: TelegramChat[];
  telegramLastUpdateId: number;

  // UI состояние
  activeView: string;
  isDark: boolean;

  // Сделки
  setDeals: (deals: Deal[]) => void;
  addDeal: (deal: Deal) => void;
  updateDeal: (id: string, updates: Partial<Deal>) => void;
  deleteDeal: (id: string) => void;
  moveDealToStage: (dealId: string, newStage: string) => void;

  // Задачи
  setTasks: (tasks: Task[]) => void;
  addTask: (task: Task) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;

  // Команда
  setTeam: (team: TeamMember[]) => void;
  addTeamMember: (member: TeamMember) => void;
  updateTeamMember: (id: string, updates: Partial<TeamMember>) => void;
  deleteTeamMember: (id: string) => void;

  // Товары
  setProducts: (products: Product[]) => void;
  addProduct: (product: Product) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;

  // Продажи
  setSales: (sales: Sale[]) => void;
  addSale: (sale: Sale) => void;

  // Комментарии к сделкам
  addDealComment: (dealId: string, comment: DealComment) => void;
  deleteDealComment: (dealId: string, commentId: string) => void;

  // Telegram
  setTelegramBotToken: (token: string, botName?: string) => void;
  clearTelegramBot: () => void;
  upsertTelegramChat: (chat: TelegramChat) => void;
  addTelegramMessage: (chatId: number, message: TelegramChat['messages'][0]) => void;
  markTelegramChatAsCrm: (chatId: number) => void;
  setTelegramLastUpdateId: (id: number) => void;

  // UI
  setActiveView: (view: string) => void;
  setIsDark: (dark: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Начальные данные
      deals: [],
      tasks: [],
      team: [],
      products: [],
      sales: [],
      dealComments: {},

      telegramBotToken: '',
      telegramBotName: '',
      telegramChats: [],
      telegramLastUpdateId: 0,

      activeView: 'dashboard',
      isDark: false,

      // === Сделки ===
      setDeals: (deals) => set({ deals }),
      addDeal: (deal) => set((s) => ({ deals: [...s.deals, deal] })),
      updateDeal: (id, updates) =>
        set((s) => ({
          deals: s.deals.map((d) => (d.id === id ? { ...d, ...updates } : d)),
        })),
      deleteDeal: (id) =>
        set((s) => ({ deals: s.deals.filter((d) => d.id !== id) })),
      moveDealToStage: (dealId, newStage) =>
        set((s) => ({
          deals: s.deals.map((d) =>
            d.id === dealId ? { ...d, stage: newStage as Deal['stage'] } : d
          ),
        })),

      // === Задачи ===
      setTasks: (tasks) => set({ tasks }),
      addTask: (task) => set((s) => ({ tasks: [task, ...s.tasks] })),
      updateTask: (id, updates) =>
        set((s) => ({
          tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
        })),
      deleteTask: (id) =>
        set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) })),

      // === Команда ===
      setTeam: (team) => set({ team }),
      addTeamMember: (member) => set((s) => ({ team: [...s.team, member] })),
      updateTeamMember: (id, updates) =>
        set((s) => ({
          team: s.team.map((m) => (m.id === id ? { ...m, ...updates } : m)),
        })),
      deleteTeamMember: (id) =>
        set((s) => ({ team: s.team.filter((m) => m.id !== id) })),

      // === Товары ===
      setProducts: (products) => set({ products }),
      addProduct: (product) =>
        set((s) => ({ products: [...s.products, product] })),
      updateProduct: (id, updates) =>
        set((s) => ({
          products: s.products.map((p) => (p.id === id ? { ...p, ...updates } : p)),
        })),
      deleteProduct: (id) =>
        set((s) => ({ products: s.products.filter((p) => p.id !== id) })),

      // === Продажи ===
      setSales: (sales) => set({ sales }),
      addSale: (sale) => set((s) => ({ sales: [...s.sales, sale] })),

      // === Комментарии к сделкам ===
      addDealComment: (dealId, comment) =>
        set((s) => ({
          dealComments: {
            ...s.dealComments,
            [dealId]: [...(s.dealComments[dealId] || []), comment],
          },
        })),
      deleteDealComment: (dealId, commentId) =>
        set((s) => ({
          dealComments: {
            ...s.dealComments,
            [dealId]: (s.dealComments[dealId] || []).filter(
              (c) => c.id !== commentId
            ),
          },
        })),

      // === Telegram ===
      setTelegramBotToken: (token, botName = '') =>
        set({ telegramBotToken: token, telegramBotName: botName, telegramLastUpdateId: 0 }),
      clearTelegramBot: () =>
        set({ telegramBotToken: '', telegramBotName: '', telegramLastUpdateId: 0 }),
      upsertTelegramChat: (chat) =>
        set((s) => {
          const existing = s.telegramChats.find((c) => c.chatId === chat.chatId);
          if (existing) {
            return {
              telegramChats: s.telegramChats.map((c) =>
                c.chatId === chat.chatId ? { ...c, ...chat } : c
              ),
            };
          }
          return { telegramChats: [...s.telegramChats, chat] };
        }),
      addTelegramMessage: (chatId, message) =>
        set((s) => ({
          telegramChats: s.telegramChats.map((c) =>
            c.chatId === chatId
              ? {
                  ...c,
                  messages: [...c.messages, message],
                  lastMessage: message.text,
                  lastTime: message.time,
                }
              : c
          ),
        })),
      markTelegramChatAsCrm: (chatId) =>
        set((s) => ({
          telegramChats: s.telegramChats.map((c) =>
            c.chatId === chatId ? { ...c, addedToCrm: true } : c
          ),
        })),
      setTelegramLastUpdateId: (id) => set({ telegramLastUpdateId: id }),

      // === UI ===
      setActiveView: (view) => set({ activeView: view }),
      setIsDark: (dark) => set({ isDark: dark }),
    }),
    {
      name: 'novacrm-storage',
      partialize: (state) => ({
        deals: state.deals,
        tasks: state.tasks,
        team: state.team,
        products: state.products,
        sales: state.sales,
        dealComments: state.dealComments,
        isDark: state.isDark,
        telegramBotToken: state.telegramBotToken,
        telegramBotName: state.telegramBotName,
        telegramChats: state.telegramChats,
        telegramLastUpdateId: state.telegramLastUpdateId,
      }),
    }
  )
);
