import { supabase } from './supabase';
import { Contact, Deal, DealItem, Task, Product, Sale, TeamMember } from '../types';

// ============================================
// КОНТАКТЫ
// ============================================
export const contactService = {
  async getAll(userId: string) {
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data as Contact[];
  },

  async create(userId: string, contact: Omit<Contact, 'id' | 'lastContacted'>) {
    const { data, error } = await supabase
      .from('contacts')
      .insert({
        user_id: userId,
        name: contact.name,
        email: contact.email,
        phone: contact.phone,
        company: contact.company,
        role: contact.role,
        source: contact.source,
        tags: contact.tags,
        notes: contact.notes,
        status: contact.status,
        last_contacted: new Date().toISOString().split('T')[0]
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async update(contactId: string, updates: Partial<Contact>) {
    const { data, error } = await supabase
      .from('contacts')
      .update({
        name: updates.name,
        email: updates.email,
        phone: updates.phone,
        company: updates.company,
        role: updates.role,
        source: updates.source,
        tags: updates.tags,
        notes: updates.notes,
        status: updates.status,
      })
      .eq('id', contactId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async delete(contactId: string) {
    const { error } = await supabase
      .from('contacts')
      .delete()
      .eq('id', contactId);
    
    if (error) throw error;
  }
};

// ============================================
// СДЕЛКИ
// ============================================
export const dealService = {
  async getAll(userId: string) {
    const { data, error } = await supabase
      .from('deals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data as Deal[];
  },

  async create(userId: string, deal: Omit<Deal, 'id'>) {
    try {
      const { data, error } = await supabase
        .from('deals')
        .insert({
          user_id: userId,
          contact_id: deal.contactId || null,
          title: deal.title,
          amount: deal.amount,
          stage: deal.stage,
          expected_close_date: deal.expectedCloseDate,
          priority: deal.priority,
          contact_name: deal.contactName || null,
          contact_phone: deal.contactPhone || null,
          contact_email: deal.contactEmail || null,
          source: deal.source || null
        })
        .select()
        .single();
      
      if (error) {
        // Трай без новых полей если они не существуют
        if (error.message.includes('contact_name') || error.message.includes('contact_phone')) {
          const { data: fallbackData, error: fallbackError } = await supabase
            .from('deals')
            .insert({
              user_id: userId,
              contact_id: deal.contactId || null,
              title: deal.title,
              amount: deal.amount,
              stage: deal.stage,
              expected_close_date: deal.expectedCloseDate,
              priority: deal.priority
            })
            .select()
            .single();
          
          if (fallbackError) throw fallbackError;
          return { ...fallbackData, ...deal } as Deal;
        }
        throw error;
      }
      return { ...data, ...deal } as Deal;
    } catch (err) {
      throw err;
    }
  },

  async update(dealId: string, updates: Partial<Deal>) {
    const { data, error } = await supabase
      .from('deals')
      .update({
        title: updates.title,
        amount: updates.amount,
        stage: updates.stage,
        expected_close_date: updates.expectedCloseDate,
        priority: updates.priority
      })
      .eq('id', dealId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async delete(dealId: string) {
    const { error } = await supabase
      .from('deals')
      .delete()
      .eq('id', dealId);
    
    if (error) throw error;
  }
};

// ============================================
// ЗАДАЧИ
// ============================================
export const taskService = {
  async getAll(userId: string) {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .order('due_date', { ascending: true });
    
    if (error) throw error;
    return data as Task[];
  },

  async create(userId: string, task: Omit<Task, 'id'>) {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          user_id: userId,
          title: task.title,
          description: task.description || null,
          due_date: task.dueDate,
          assigned_to: task.assignedTo ? null : userId,
          completed: false,
          priority: task.priority,
          category: task.category || 'Личная'
        })
        .select()
        .single();
      
      if (error) {
        // Если колонка не существует, просто не передаём её
        if (error.message.includes('category')) {
          const { data: fallbackData, error: fallbackError } = await supabase
            .from('tasks')
            .insert({
              user_id: userId,
              title: task.title,
              due_date: task.dueDate,
              assigned_to: task.assignedTo ? null : userId,
              completed: false,
              priority: task.priority,
            })
            .select()
            .single();
          
          if (fallbackError) throw fallbackError;
          return { ...fallbackData, ...task, category: task.category || 'Личная' } as Task;
        }
        throw error;
      }
      return { ...data, ...task } as Task;
    } catch (err) {
      throw err;
    }
  },

  async update(taskId: string, updates: Partial<Task>) {
    const { data, error } = await supabase
      .from('tasks')
      .update({
        title: updates.title,
        due_date: updates.dueDate,
        completed: updates.completed,
        priority: updates.priority
      })
      .eq('id', taskId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async delete(taskId: string) {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId);
    
    if (error) throw error;
  }
};

// ============================================
// AI ЧАТ ИСТОРИЯ
// ============================================
export const chatService = {
  async saveMessage(userId: string, role: 'user' | 'ai', message: string) {
    const { error } = await supabase
      .from('chat_history')
      .insert({
        user_id: userId,
        role,
        message
      });
    
    if (error) throw error;
  },

  async getHistory(userId: string) {
    const { data, error } = await supabase
      .from('chat_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
      .limit(50); // Последние 50 сообщений
    
    if (error) throw error;
    return data;
  },

  async clearHistory(userId: string) {
    const { error } = await supabase
      .from('chat_history')
      .delete()
      .eq('user_id', userId);
    
    if (error) throw error;
  }
};

// ============================================
// ПРОДУКТЫ И ПРОДАЖИ
// ============================================
export const productService = {
  async getAll(userId: string) {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('user_id', userId);
    
    if (error) throw error;
    return data as Product[];
  },

  async create(userId: string, product: Omit<Product, 'id'>) {
    const { data, error } = await supabase
      .from('products')
      .insert({
        user_id: userId,
        name: product.name,
        price: product.price,
        stock: product.stock,
        category: product.category,
        image: product.image
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateStock(productId: string, newStock: number) {
    const { error } = await supabase
      .from('products')
      .update({ stock: Math.max(0, newStock) })
      .eq('id', productId);

    if (error) throw error;
  },

  // Уменьшает остаток товара на купленное количество (по одному запросу на списание)
  async decrementStock(userId: string, productId: string, quantity: number) {
    const { data: product, error: fetchError } = await supabase
      .from('products')
      .select('id, stock')
      .eq('id', productId)
      .eq('user_id', userId)
      .maybeSingle();

    if (fetchError) throw fetchError;
    if (!product) throw new Error('Товар не найден');

    const newStock = Math.max(0, (product.stock ?? 0) - quantity);
    await this.updateStock(productId, newStock);
    return newStock;
  }
};

// ============================================
// Товары в сделке (deal_items)
// ============================================
export interface DealItemRow {
  id: string;
  deal_id: string;
  product_id: string;
  quantity: number;
  price: number;
  total_price: number;
}

export const dealItemService = {
  async createForDeal(userId: string, dealId: string, items: DealItem[]) {
    if (!items.length) return;
    const rows = items.map(item => ({
      user_id: userId,
      deal_id: dealId,
      product_id: item.productId,
      quantity: item.quantity,
      price: item.price,
      total_price: item.totalPrice,
    }));
    const { error } = await supabase.from('deal_items').insert(rows);
    if (error) throw error;
  },

  async getAllByDeals(dealIds: string[]): Promise<DealItemRow[]> {
    if (!dealIds.length) return [];
    const { data, error } = await supabase
      .from('deal_items')
      .select('*')
      .in('deal_id', dealIds);
    if (error) throw error;
    return (data || []) as DealItemRow[];
  }
};

// ============================================
// КОМАНДА (через Supabase - работает между устройствами)
// ============================================
export const teamService = {
  // Загружает участников workspace: team_members + профили из users
  async getTeam(workspaceId: string): Promise<TeamMember[]> {
    const { data: members, error } = await supabase
      .from('team_members')
      .select('*')
      .eq('workspace_id', workspaceId);

    if (error) throw error;
    if (!members?.length) return [];

    const userIds = members.map((m: any) => m.id);
    const { data: profiles } = await supabase
      .from('users')
      .select('id, email, full_name, avatar_url')
      .in('id', userIds);

    const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));

    return members.map((m: any) => {
      const profile = profileMap.get(m.id);
      return {
        id: m.id,
        name: profile?.full_name || profile?.email || 'Сотрудник',
        email: profile?.email || '',
        role: m.role || 'Менеджер',
        status: m.status || 'Не в сети',
        dealsCount: m.deals_count ?? 0,
        conversion: m.conversion_rate ? `${m.conversion_rate}%` : '0%',
        avatar: profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.id}`,
      } as TeamMember;
    });
  },

  // Создаёт ссылку-приглашение в БД (workspace = аккаунт владельца)
  async createInvite(workspaceId: string, createdBy: string, role: string) {
    const code = Math.random().toString(36).substring(2, 12).toUpperCase();
    const { data, error } = await supabase
      .from('team_invites')
      .insert({
        workspace_id: workspaceId,
        invite_code: code,
        created_by: createdBy,
        role,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return { code, invite: data };
  },

  // Получает приглашение по коду (для страницы регистрации по ссылке)
  async getInviteByCode(code: string) {
    const { data, error } = await supabase
      .from('team_invites')
      .select('*')
      .eq('invite_code', code)
      .eq('used', false)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  // Помечает приглашение использованным
  async useInvite(code: string, userId: string) {
    const { error } = await supabase
      .from('team_invites')
      .update({ used: true, used_at: new Date().toISOString(), used_by: userId })
      .eq('invite_code', code);
    if (error) throw error;
  },

  // Добавляет нового сотрудника в workspace (вызывает InvitePage после регистрации)
  async addMemberToWorkspace(workspaceId: string, userId: string, role: string) {
    const { error } = await supabase
      .from('team_members')
      .upsert({
        id: userId,
        workspace_id: workspaceId,
        role,
        status: 'Не в сети',
        deals_count: 0,
        conversion_rate: 0,
      }, { onConflict: 'id' });

    if (error) throw error;
  },

  async removeMember(memberId: string) {
    const { error } = await supabase
      .from('team_members')
      .delete()
      .eq('id', memberId);
    if (error) throw error;
  }
};

export const saleService = {
  async getAll(userId: string) {
    const { data, error } = await supabase
      .from('sales')
      .select('*')
      .eq('user_id', userId);
    
    if (error) throw error;
    return data as Sale[];
  },

  async create(userId: string, sale: Omit<Sale, 'id'>) {
    const { data, error } = await supabase
      .from('sales')
      .insert({
        user_id: userId,
        product_id: sale.productId,
        seller_id: userId,
        quantity: sale.quantity,
        total_amount: sale.totalAmount,
        sale_date: sale.date
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};

// ============================================
// ТРАНЗАКЦИИ (финансы) - мигрировано из localStorage
// ============================================
export interface DbTransaction {
  id: string;
  desc: string;
  amount: number;
  type: 'in' | 'out';
  status: string;
  date: string;
}

export const transactionService = {
  async getAll(userId: string): Promise<DbTransaction[]> {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as DbTransaction[];
  },

  async create(userId: string, t: Omit<DbTransaction, 'id'>): Promise<DbTransaction> {
    const { data, error } = await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        desc: t.desc,
        amount: t.amount,
        type: t.type,
        status: t.status,
        date: t.date,
      })
      .select()
      .single();

    if (error) throw error;
    return data as DbTransaction;
  },

  async remove(transactionId: string) {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', transactionId);

    if (error) throw error;
  }
};

// ============================================
// НАСТРОЙКИ ПРИЛОЖЕНИЯ (Telegram-токен и др.)
// ============================================
export const settingsService = {
  async get(userId: string, key: string): Promise<unknown> {
    const { data, error } = await supabase
      .from('app_settings')
      .select('value')
      .eq('user_id', userId)
      .eq('key', key)
      .maybeSingle();

    if (error) throw error;
    return data?.value ?? null;
  },

  async set(userId: string, key: string, value: unknown) {
    const { error } = await supabase
      .from('app_settings')
      .upsert(
        { user_id: userId, key, value, updated_at: new Date().toISOString() },
        { onConflict: 'user_id,key' }
      );

    if (error) throw error;
  }
};
