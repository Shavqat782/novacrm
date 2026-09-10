# 🏗️ Архитектура NovaCRM

Документация структуры приложения и всех интеграций

---

## 📊 Диаграмма системы

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React 19)                      │
│                                                              │
│  ┌───────────────────┐         ┌────────────────────────┐  │
│  │   Components      │         │   Pages/Views          │  │
│  │ - Dashboard       │         │ - Auth (Login/Signup)  │  │
│  │ - ContactsList    │◄────────┤ - Contacts             │  │
│  │ - DealsBoard      │         │ - Deals                │  │
│  │ - TasksList       │         │ - Tasks                │  │
│  │ - etc (8 more)    │         │ - Team, Finance, etc   │  │
│  └───────────────────┘         └────────────────────────┘  │
│           ▲                              ▲                   │
└───────────┼──────────────────────────────┼───────────────────┘
            │                              │
            │ useEffect, requests          │ useState, Props
            │                              │
    ┌───────▼──────────────────────────────▼────────┐
    │         Services Layer (lib/)                  │
    │                                                │
    │  ┌─────────────────┐    ┌──────────────────┐  │
    │  │ supabase.ts     │    │ database.ts      │  │
    │  │ - Auth Client   │    │ - contactService │  │
    │  │ - signUp()      │    │ - dealService    │  │
    │  │ - signIn()      │    │ - taskService    │  │
    │  │ - signOut()     │    │ - chatService    │  │
    │  └─────────────────┘    └──────────────────┘  │
    │          ▲                      ▲              │
    │          │ REST API             │  REST API    │
    │          │                      │              │
    └──────────┼──────────────────────┼──────────────┘
               │                      │
    ┌──────────▼──────────────────────▼──────────────┐
    │  Backend Services (External)                   │
    │                                                │
    │  ┌──────────────────────────────────────────┐ │
    │  │  Supabase Cloud                          │ │
    │  │  - PostgreSQL Database                   │ │
    │  │  - Authentication (JWT)                  │ │
    │  │  - Row Level Security (RLS)              │ │
    │  │  - Real-time API                         │ │
    │  │  - Storage (for files)                   │ │
    │  └──────────────────────────────────────────┘ │
    │  ┌──────────────────────────────────────────┐ │
    │  │  Google Gemini API                       │ │
    │  │  - Lead Quality Analysis                 │ │
    │  │  - Smart Response Generation             │ │
    │  │  - AI Chat                               │ │
    │  └──────────────────────────────────────────┘ │
    │                                                │
    └────────────────────────────────────────────────┘
```

---

## 📁 Структура файлов

```
novacrm/
│
├── src/
│   ├── components/              # React компоненты
│   │   ├── Auth.tsx             # Форма логина/регистрации
│   │   ├── Dashboard.tsx        # Главный дашборд с метриками
│   │   ├── ContactsList.tsx     # Управление контактами
│   │   ├── DealsBoard.tsx       # Kanban доска сделок
│   │   ├── TasksList.tsx        # Управление задачами
│   │   ├── TeamView.tsx         # Управление командой
│   │   ├── TopBar.tsx           # Верхняя панель (user, theme)
│   │   ├── Sidebar.tsx          # Левое меню навигации
│   │   ├── ErrorBoundary.tsx    # Обработчик ошибок React
│   │   ├── AnalyticsView.tsx    # Аналитика (заглушка)
│   │   ├── CommunicationsCenter.tsx  # Чаты (заглушка)
│   │   ├── FinanceView.tsx      # Финансы (заглушка)
│   │   ├── ServiceDesk.tsx      # Поддержка (заглушка)
│   │   ├── IntegrationsView.tsx # Интеграции (заглушка)
│   │   ├── ProductsView.tsx     # Товары и продажи (заглушка)
│   │   └── SettingsView.tsx     # Настройки приложения
│   │
│   ├── lib/                     # Утилиты и сервисы
│   │   ├── supabase.ts          # Supabase клиент и auth
│   │   └── database.ts          # CRUD операции для всех таблиц
│   │
│   ├── services/                #外 services (API)
│   │   └── geminiService.ts     # Google Gemini AI интеграция
│   │
│   ├── App.tsx                  # Главное приложение
│   ├── index.tsx                # Точка входа React
│   ├── index.css                # Глобальные стили
│   ├── index.html               # HTML шаблон
│   ├── types.ts                 # TypeScript интерфейсы
│   ├── constants.tsx            # Константы и mock данные
│   ├── vite.config.ts           # Vite конфигурация
│   └── tsconfig.json            # TypeScript конфигурация
│
├── scripts/
│   └── supabase.sql             # SQL для создания БД структуры
│
├── .env.local                   # Переменные окружения
├── package.json                 # Зависимости и скрипты
├── README.md                    # Главная документация
├── SETUP_GUIDE.md              # Пошаговая установка
├── ARCHITECTURE.md             # Эта файл
│
└── dist/                        # Собранное приложение (после npm run build)
    ├── index.html
    ├── assets/
    └── ...
```

---

## 🔄 Поток данных

### 1. Аутентификация

```
1. User заполняет форму Auth → signUp() или signIn()
2. Запрос идёт в Supabase Auth API
3. Supabase создаёт сессию (JWT token)
4. Token сохраняется в localStorage автоматически
5. User перенаправляется на Dashboard
6. App.tsx проверяет очередных пользователя через getCurrentUser()
```

### 2. Загрузка данных

```
1. User логинится → App.tsx detectирует user
2. useEffect вызывает:
   - contactService.getAll(userId)
   - dealService.getAll(userId)
   - taskService.getAll(userId)
3. Запросы идут в Supabase REST API
4. Supabase проверяет RLS политики (только свои данные)
5. Данные загружаются в React state
6. UI обновляется с реальными данными
```

### 3. Создание контакта

```
1. User нажимает "Добавить клиента"
2. Заполняет форму в модальном окне
3. Нажимает "Добавить"
4. handleAddContact() вызывает contactService.create()
5. CREATE запрос идёт в Supabase
6. Supabase:
   - Проверяет RLS (user_id = auth.uid())
   - Вставляет запись в таблицу contacts
   - Возвращает новый контакт с id
7. Frontend добавляет в state: setContacts([newContact, ...prev])
8. UI обновляется, контакт видно в таблице
```

### 4. Обновление UI через Supabase Realtime

```
# В будущем:
1. User A добавляет контакт
2. Supabase broadcast event через WebSocket
3. User B получает evento в реальном времени
4. UI обновляется без перезагрузки

# Текущая версия:
- Используется polling (перезагрузка каждые N секунд)
- Или manual refresh кнопка
```

---

## 🗄️ Структура базы данных

### Таблица: users
```sql
id (UUID) - Первичный ключ, связь с auth.users
email (TEXT) - Email пользователя
full_name (TEXT) - ФИО
avatar_url (TEXT) - URL аватара
created_at (TIMESTAMP) - Время создания
updated_at (TIMESTAMP) - Время обновления
```

### Таблица: contacts
```sql
id (TEXT) - Первичный ключ
user_id (UUID) - Связь с users (владелец)
name (TEXT) - Имя контакта
email (TEXT) - Email
phone (TEXT) - Телефон
company (TEXT) - Компания
role (TEXT) - Должность
source (TEXT) - Источник лида
tags (TEXT[]) - Массив тегов
notes (TEXT) - Заметки
status (TEXT) - Активен/Неактивен/Ожидание
last_contacted (DATE) - Дата последнего контакта
created_at (TIMESTAMP)
updated_at (TIMESTAMP)
```

### Таблица: deals
```sql
id (TEXT) - Первичный ключ
user_id (UUID) - Связь с users
contact_id (TEXT) - Связь с contacts
title (TEXT) - Название сделки
amount (DECIMAL) - Сумма
stage (TEXT) - Этап воронки (NEW_LEAD, NEGOTIATION, CLOSED_WON и т.д.)
expected_close_date (DATE) - Ожидаемая дата закрытия
priority (TEXT) - Низкий/Средний/Высокий
created_at (TIMESTAMP)
updated_at (TIMESTAMP)
```

### Таблица: tasks
```sql
id (TEXT) - Первичный ключ
user_id (UUID) - Связь с users
title (TEXT) - Название задачи
due_date (DATE) - Дата выполнения
assigned_to (UUID) - Кому назначена (связь с users)
completed (BOOLEAN) - Выполнена ли
priority (TEXT) - Приоритет
created_at (TIMESTAMP)
updated_at (TIMESTAMP)
```

### Таблица: chat_history
```sql
id (UUID) - Первичный ключ
user_id (UUID) - Связь с users
role (TEXT) - 'user' или 'ai'
message (TEXT) - Текст сообщения
created_at (TIMESTAMP) - Когда отправлено
```

---

## 🔐 Безопасность (RLS)

### Как работает Row Level Security (RLS)

```sql
-- Пример RLS политики для contacts:

CREATE POLICY "Users can view own contacts" ON contacts
    FOR SELECT USING (user_id = auth.uid());

-- Что это означает:
-- 1. User может SELECT только строки где user_id = его UUID
-- 2. Даже если знает SQL, не может указать другой user_id
-- 3. Supabase автоматически фильтрует результаты
```

### RLS политики в проекте

| Таблица | SELECT | INSERT | UPDATE | DELETE |
|---------|--------|--------|--------|--------|
| contacts | Свои | Может | Свои | Свои |
| deals | Свои | Может | Свои | Свои |
| tasks | Свои | Может | Свои | Свои |
| chat_history | Свои | Может | ❌ | ❌ |

---

## 🚀 API Endpoints

### Supabase REST API

Используется автоматически через `@supabase/supabase-js` клиент.

#### Примеры запросов (из database.ts):

```typescript
// GET все контакты пользователя
GET /rest/v1/contacts?select=*&user_id=eq.UUID&order_by=created_at.desc

// POST новый контакт
POST /rest/v1/contacts
{
  "user_id": "UUID",
  "name": "Иван Иванов",
  "email": "ivan@example.com",
  ...
}

// PATCH обновление
PATCH /rest/v1/contacts?id=eq.contact_id
{
  "name": "Новое имя"
}

// DELETE удаление
DELETE /rest/v1/contacts?id=eq.contact_id
```

### Google Gemini API

```javascript
// analyzeLeadQuality(contactData)
POST https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=API_KEY

// Запрос:
{
  "contents": [
    {
      "parts": [
        {
          "text": "Проанализируй лида: {contact data}"
        }
      ]
    }
  ]
}

// Ответ (JSON схема):
{
  "score": 85,           // 0-100
  "summary": "Горячий лид",
  "tips": ["...", "...", "..."]
}
```

---

## 🎯 State Management

### Текущая архитектура: React useState

**Процесс:**
```tsx
// App.tsx главное состояние:
const [contacts, setContacts] = useState<Contact[]>([]);
const [deals, setDeals] = useState<Deal[]>([]);
const [tasks, setTasks] = useState<Task[]>([]);

// Props drilling в компоненты:
<ContactsList contacts={contacts} setContacts={setContacts} onAdd={handleAddContact} />
```

**Плюсы:**
- Просто и внятно
- Нет дополнительных библиотек

**Минусы:**
- Prop drilling на глубину 3+ уровней
- Re-render при каждом изменении
- Сложно масштабировать

### Будущее: Context API + Zustand

```tsx
// Рекомендуемая архитектура для масштабирования:
<AppProvider>
  <App />
</AppProvider>

// Использование в компонентах:
const { contacts, addContact } = useAppStore();
```

---

## 🔄 Жизненный цикл компонента

### ContactsList:

```
1. Mount:
   - Render форма пустая
   - Props имеет contacts array
   - Render таблицу с контактами

2. Update:
   - User добавляет контакт
   - onAdd(contact) → handleAddContact() → contactService.create()
   - Supabase возвращает новый контакт
   - setContacts добавляет его
   - Component re-render
   - Таблица обновляется

3. Unmount:
   - Удаляется из DOM
   - Состояние забывается (для этого нужна БД!)
```

---

## 📊 Performance Optimization

### Текущие оптимизации:
- React 19 с автоматической оптимизацией
- Tailwind CSS (только используемые стили)
- Lazy loading компонентов (в будущем)
- Оптимистичные обновления (в future)

### Рекомендуемые улучшения:
```tsx
// 1. Memo для предотвращения re-render
const ContactsList = React.memo(({ contacts }) => {...});

// 2. useCallback для стабилизации функций
const handleAddContact = useCallback(async (contact) => {...}, []);

// 3. Pagination для больших списков
const [page, setPage] = useState(1);
const contacts = useQuery(['contacts', page], () => fetchPage(page));

// 4. Infinite scroll
<InfiniteScroll
  dataLength={contacts.length}
  next={fetchMore}
  hasMore={hasMore}
>
  {contacts.map(c => <Contact key={c.id} />)}
</InfiniteScroll>
```

---

## 🧪 Тестирование

### Рекомендуемая стратегия:

```
Unit Tests (40%): Components, services
├─ Jest + React Testing Library
├─ Тестируют: props, state, events

Integration Tests (40%): Flows, API
├─ MSW (Mock Service Worker)
├─ Тестируют: add contact → save to DB → display

E2E Tests (20%): Full user journey
├─ Cypress or Playwright
├─ Тестируют: login → create deal → analytics
```

---

## 🚢 Deployment

### На Vercel (рекомендуется):
```bash
# 1. Push на GitHub
git push origin main

# 2. Подключить репо в Vercel dashboard
# 3. Установить environment variables:
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
VITE_GEMINI_API_KEY=...

# 4. Vercel автоматически выполнит:
npm install
npm run build
# И задеплоит dist/ folder
```

### На Netlify:
```bash
# Похоже на Vercel, но с netlify.toml конфигом
```

---

## 📈 Масштабирование (Scaling)

### Database:
```
Сейчас: 1 PostgreSQL (Supabase)
→ Будущее: Database Replication, Caching Layer
```

### UI:
```
Сейчас: Все в одном Redux-less store
→ Будущее: Zustand/Jotai для state management
```

### Backend:
```
Сейчас: Serverless functions (Supabase)
→ Будущее: Edge computing, CDN для статики
```

---

## 🔧 Debugging

### Chrome DevTools:
1. F12 → Console (ошибки)
2. Network tab (API запросы)
3. Application → Storage (localStorage)

### Supabase Dashboard:
1. SQL Editor (query результаты)
2. Database → Logs (все операции)
3. Authentication → Users (кто залогинен)

### VS Code:
```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "chrome",
      "request": "launch",
      "name": "Launch Chrome",
      "url": "http://localhost:3000",
      "webRoot": "${workspaceFolder}"
    }
  ]
}
```

---

Последняя обновление: **March 17, 2026**
