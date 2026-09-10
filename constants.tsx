
import React from 'react';
import { LayoutDashboard, Kanban, CheckSquare, BarChart3, MessageSquare, Settings, CreditCard, Package, UserPlus, ShoppingBag } from 'lucide-react';
import { LeadSource, DealStage, Contact, Deal, Task, TeamMember } from './types';

export const NAVIGATION = [
  { name: 'Панель управления', icon: <LayoutDashboard size={20} />, id: 'dashboard' },
  { name: 'Воронка продаж', icon: <Kanban size={20} />, id: 'deals' },
  { name: 'Товары', icon: <ShoppingBag size={20} />, id: 'products' },
  { name: 'Задачи', icon: <CheckSquare size={20} />, id: 'tasks' },
  { name: 'Команда', icon: <UserPlus size={20} />, id: 'team' },
  { name: 'Аналитика', icon: <BarChart3 size={20} />, id: 'analytics' },
  { name: 'Сообщения', icon: <MessageSquare size={20} />, id: 'communications' },
  { name: 'Финансы', icon: <CreditCard size={20} />, id: 'finance' },
  { name: 'Интеграции', icon: <Package size={20} />, id: 'integrations' },
  { name: 'Настройки', icon: <Settings size={20} />, id: 'settings' }
];
