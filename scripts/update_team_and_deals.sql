-- ============================================
-- ОБНОВЛЕНИЕ: Командная работа через ссылки-приглашения
-- Запустите этот скрипт в Supabase SQL Editor (поверх основного supabase.sql)
-- ============================================

-- Политики для team_members (чтобы приглашённые попадали в CRM владельца)
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view workspace team" ON team_members;
CREATE POLICY "Users can view workspace team" ON team_members
    FOR SELECT USING (workspace_id::text = auth.uid()::text OR id = auth.uid());

DROP POLICY IF EXISTS "Users can join workspace via invite" ON team_members;
CREATE POLICY "Users can join workspace via invite" ON team_members
    FOR INSERT WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "Owner can manage team" ON team_members;
CREATE POLICY "Owner can manage team" ON team_members
    FOR ALL USING (workspace_id::text = auth.uid()::text);

-- Политики для team_invites: читать код может любой вошедший
-- (нужна для страницы регистрации по ссылке)
DROP POLICY IF EXISTS "Anyone can read valid invite" ON team_invites;
CREATE POLICY "Anyone can read valid invite" ON team_invites
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update team invites" ON team_invites;
CREATE POLICY "Users can update team invites" ON team_invites
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Политики для deal_items (товары в сделках)
ALTER TABLE deal_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view deal items" ON deal_items;
CREATE POLICY "Users can view own deal items" ON deal_items
    FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can create deal items" ON deal_items;
CREATE POLICY "Users can create own deal items" ON deal_items
    FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own deal items" ON deal_items;
CREATE POLICY "Users can delete own deal items" ON deal_items
    FOR DELETE USING (user_id = auth.uid());

-- deals: contact_id может быть пустым (сделка без привязки к контакту)
ALTER TABLE deals ALTER COLUMN contact_id DROP NOT NULL;

-- products: владелец может обновлять остатки
DROP POLICY IF EXISTS "Users can update own products" ON products;
CREATE POLICY "Users can update own products" ON products
    FOR UPDATE USING (user_id = auth.uid());

-- Готово! Теперь приглашения по ссылке реально добавляют людей в команду.