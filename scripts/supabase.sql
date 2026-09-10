-- ============================================
-- NovaCRM Database Schema for Supabase
-- ============================================
-- Выполните этот скрипт в: https://app.supabase.com -> SQL Editor

-- Таблица пользователей (extends Supabase Auth)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Таблица контактов
CREATE TABLE IF NOT EXISTS contacts (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    company TEXT,
    role TEXT,
    source TEXT, -- 'Instagram', 'Сайт', 'Реклама', 'Холодный звонок', 'Telegram'
    tags TEXT[] DEFAULT '{}',
    notes TEXT,
    status TEXT DEFAULT 'Активен', -- 'Активен', 'Неактивен', 'Ожидание'
    last_contacted DATE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Таблица сделок
CREATE TABLE IF NOT EXISTS deals (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    contact_id TEXT NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    amount DECIMAL(12, 2),
    stage TEXT DEFAULT 'Новый лид', -- DealStage enum
    expected_close_date DATE,
    priority TEXT DEFAULT 'Средний',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Таблица задач
CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    due_date DATE,
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    completed BOOLEAN DEFAULT FALSE,
    priority TEXT DEFAULT 'Средний',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Таблица команды (члены)
CREATE TABLE IF NOT EXISTS team_members (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    workspace_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'Менеджер', -- 'Администратор', 'Менеджер', 'Аналитик'
    status TEXT DEFAULT 'В сети',
    deals_count INT DEFAULT 0,
    conversion_rate DECIMAL(5, 2) DEFAULT 0,
    avatar_url TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Таблица AI истории чата
CREATE TABLE IF NOT EXISTS chat_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role TEXT NOT NULL, -- 'user', 'ai'
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Таблица продуктов
CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    price DECIMAL(12, 2),
    stock INT DEFAULT 0,
    category TEXT,
    image_url TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Таблица продаж
CREATE TABLE IF NOT EXISTS sales (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity INT NOT NULL,
    total_amount DECIMAL(12, 2),
    seller_id UUID REFERENCES users(id) ON DELETE SET NULL,
    sale_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Таблица сообщений (для переписки клиентов)
CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    contact_id TEXT NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    sender_type TEXT DEFAULT 'user', -- 'user', 'contact', 'system'
    message_text TEXT NOT NULL,
    attachments TEXT[] DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Таблица комментариев к сделкам
CREATE TABLE IF NOT EXISTS deal_comments (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    deal_id TEXT NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    comment_text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Таблица товаров в сделке
CREATE TABLE IF NOT EXISTS deal_items (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    deal_id TEXT NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
    product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity INT NOT NULL,
    price DECIMAL(12, 2),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Таблица источников клиентов
CREATE TABLE IF NOT EXISTS lead_sources (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    source_name TEXT NOT NULL,
    channel TEXT, -- 'WhatsApp', 'Telegram', 'Email', 'Phone', 'Site'
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Таблица приглашений в команду (для WhatsApp/ссылки)
CREATE TABLE IF NOT EXISTS team_invites (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    workspace_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    invite_code TEXT UNIQUE NOT NULL,
    whatsapp_number TEXT,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    used BOOLEAN DEFAULT FALSE,
    used_at TIMESTAMP,
    used_by UUID REFERENCES users(id) ON DELETE SET NULL,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Таблица интеграций
CREATE TABLE IF NOT EXISTS integrations (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    integration_type TEXT NOT NULL, -- 'whatsapp', 'telegram', 'instagram', 'email'
    api_key TEXT,
    webhook_url TEXT,
    config JSONB DEFAULT '{}',
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Таблица AI помощников
CREATE TABLE IF NOT EXISTS ai_assistants (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    role TEXT, -- 'sales', 'support', 'analytics'
    system_prompt TEXT,
    enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- Индексы для оптимизации
-- ============================================
CREATE INDEX idx_contacts_user_id ON contacts(user_id);
CREATE INDEX idx_contacts_status ON contacts(status);
CREATE INDEX idx_deals_user_id ON deals(user_id);
CREATE INDEX idx_deals_contact_id ON deals(contact_id);
CREATE INDEX idx_deals_stage ON deals(stage);
CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX idx_chat_history_user_id ON chat_history(user_id);
CREATE INDEX idx_messages_user_id ON messages(user_id);
CREATE INDEX idx_messages_contact_id ON messages(contact_id);
CREATE INDEX idx_deal_comments_deal_id ON deal_comments(deal_id);
CREATE INDEX idx_deal_items_deal_id ON deal_items(deal_id);
CREATE INDEX idx_team_invites_workspace_id ON team_invites(workspace_id);
CREATE INDEX idx_integrations_user_id ON integrations(user_id);
CREATE INDEX idx_ai_assistants_user_id ON ai_assistants(user_id);

-- ============================================
-- Row Level Security (RLS) - Безопасность
-- ============================================
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_assistants ENABLE ROW LEVEL SECURITY;

-- Пользователь может видеть только свои контакты
CREATE POLICY "Users can view own contacts" ON contacts
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create contacts" ON contacts
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own contacts" ON contacts
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own contacts" ON contacts
    FOR DELETE USING (user_id = auth.uid());

-- То же для сделок
CREATE POLICY "Users can view own deals" ON deals
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create deals" ON deals
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own deals" ON deals
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own deals" ON deals
    FOR DELETE USING (user_id = auth.uid());

-- То же для задач
CREATE POLICY "Users can view own tasks" ON tasks
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create tasks" ON tasks
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own tasks" ON tasks
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own tasks" ON tasks
    FOR DELETE USING (user_id = auth.uid());

-- То же для чата
CREATE POLICY "Users can view own chat history" ON chat_history
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create chat messages" ON chat_history
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Политики для сообщений
CREATE POLICY "Users can view own messages" ON messages
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create messages" ON messages
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Политики для комментариев к сделкам
CREATE POLICY "Users can view deal comments" ON deal_comments
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create deal comments" ON deal_comments
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Политики для товаров в сделке
CREATE POLICY "Users can view deal items" ON deal_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM deals WHERE deals.id = deal_items.deal_id AND deals.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create deal items" ON deal_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM deals WHERE deals.id = deal_items.deal_id AND deals.user_id = auth.uid()
        )
    );

-- Политики для источников
CREATE POLICY "Users can view own lead sources" ON lead_sources
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create lead sources" ON lead_sources
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Политики для приглашений в команду
CREATE POLICY "Users can view team invites" ON team_invites
    FOR SELECT USING (
        workspace_id::uuid = auth.uid() OR created_by = auth.uid()
    );

CREATE POLICY "Users can create team invites" ON team_invites
    FOR INSERT WITH CHECK (created_by = auth.uid());

-- Политики для интеграций
CREATE POLICY "Users can view own integrations" ON integrations
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create integrations" ON integrations
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own integrations" ON integrations
    FOR UPDATE USING (user_id = auth.uid());

-- Политики для AI помощников
CREATE POLICY "Users can view own ai assistants" ON ai_assistants
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create ai assistants" ON ai_assistants
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- ============================================
-- НОВОЕ: Транзакции (финансы) - раньше были в localStorage
-- ============================================
CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    desc TEXT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    type TEXT NOT NULL DEFAULT 'in', -- 'in' | 'out'
    status TEXT DEFAULT 'Завершено',
    date TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- НОВОЕ: Настройки приложения (Telegram-токен и др.)
-- ============================================
CREATE TABLE IF NOT EXISTS app_settings (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    key TEXT NOT NULL,
    value JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (user_id, key)
);

-- Политики для транзакций
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own transactions" ON transactions
    FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create transactions" ON transactions
    FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own transactions" ON transactions
    FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own transactions" ON transactions
    FOR DELETE USING (user_id = auth.uid());

-- Политики для настроек
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own settings" ON app_settings
    FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can manage own settings" ON app_settings
    FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ============================================
-- Функция для обновления created_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Триггер для обновления updated_at
CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON contacts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_deals_updated_at BEFORE UPDATE ON deals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
