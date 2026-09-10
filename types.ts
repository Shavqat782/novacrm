
import { User as SupabaseUser } from '@supabase/supabase-js';

export type AuthUser = SupabaseUser;

export enum LeadSource {
  INSTAGRAM = 'Instagram',
  WEBSITE = 'Сайт',
  ADVERTISING = 'Реклама',
  COLD_CALL = 'Холодный звонок',
  TELEGRAM = 'Telegram'
}

export enum DealStage {
  NEW_LEAD = 'Новый лид',
  CONTACTED = 'Связались',
  NEEDS_ANALYSIS = 'Выявление нужд',
  PROPOSAL = 'Предложение',
  NEGOTIATION = 'Переговоры',
  CLOSED_WON = 'Оплачено',
  CLOSED_LOST = 'Отказ'
}

export interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  role: string;
  source: LeadSource;
  tags: string[];
  notes: string;
  lastContacted: string;
  status: 'Активен' | 'Неактивен' | 'Ожидание';
}

export interface Deal {
  id: string;
  title: string;
  amount: number;
  contactId: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  source?: LeadSource;
  stage: DealStage;
  expectedCloseDate: string;
  priority: 'Низкий' | 'Средний' | 'Высокий';
  items?: DealItem[];
  comments?: DealComment[];
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate: string;
  assignedTo?: string;
  assignedToId?: string;
  createdBy: string;
  createdById?: string;
  completed: boolean;
  priority: 'Низкий' | 'Средний' | 'Высокий';
  category?: 'Личная' | 'Командная';
}

export interface Message {
  id: string;
  sender: 'User' | 'AI' | 'Customer';
  text: string;
  timestamp: string;
}

export interface DealItem {
  id: string;
  dealId: string;
  productId: string;
  productName?: string;
  quantity: number;
  price: number;
  totalPrice: number;
}

export interface DealComment {
  id: string;
  dealId: string;
  userId: string;
  userName?: string;
  text: string;
  createdAt: string;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'Администратор' | 'Менеджер' | 'Аналитик';
  status: 'В сети' | 'Не в сети';
  dealsCount: number;
  conversion: string;
  avatar: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  image: string;
  category: string;
}

export interface Sale {
  id: string;
  productId: string;
  sellerId: string;
  quantity: number;
  totalAmount: number;
  date: string;
}
