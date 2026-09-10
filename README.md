# NovaCRM - AI-Powered Business OS

> 🔴 **Live demo:** [novacrm-phi.vercel.app](https://novacrm-phi.vercel.app)

Профессиональная CRM система с искусственным интеллектом для управления продажами, контактами и аналитикой.

**Возможности:** Kanban-воронка сделок с товарами и автосписанием со склада • Приглашение команды по ссылке/WhatsApp (работает между устройствами) • Gemini AI • Telegram-чат с клиентами • Финансы • Realtime • Тёмная тема

![NovaCRM](https://img.shields.io/badge/React-19-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue) ![Supabase](https://img.shields.io/badge/Database-Supabase-green) ![License](https://img.shields.io/badge/License-Free-green)

## ⚡ Возможности

✅ **Управление контактами** - Полная база клиентов с историей взаимодействия  
✅ **Доска сделок** - Kanban при на основе воронки продаж  
✅ **Управление задачами** - Распределение и отслеживание  
✅ **AI Аналитика** - Google Gemini для анализа качества лидов  
✅ **AI Чат** - Виртуальный помощник для консультаций  
✅ **Безопасная аутентификация** - Бесплатный Supabase Auth  
✅ **PostgreSQL БД** - Надёжное хранилище данных  
✅ **Dark Mode** - Полная поддержка тёмной темы  
✅ **Адаптивный дизайн** - Работает на desktop и мобиль  

---

## 🚀 Быстрый старт (3 шага)

### Шаг 1: Клонируйте проект и установите зависимости

\`\`\`bash
cd novacrm---intelligent-business-os
npm install
\`\`\`

### Шаг 2: Создайте бесплатный Supabase проект

1. Перейдите на [supabase.com](https://supabase.com)
2. Нажмите **Sign Up** → создайте аккаунт (бесплатно)
3. Создайте новый проект (выберите бесплатный tier)
4. Дождитесь инициализации (2-3 минуты)

### Шаг 3: Запустите SQL скрипт для создания таблиц

1. В Supabase перейдите в **SQL Editor**
2. Откройте файл [scripts/supabase.sql](scripts/supabase.sql)
3. Скопируйте всё содержимое и вставьте в SQL Editor
4. Нажмите **Run** (зелёная кнопка)

### Шаг 4: Получите API ключи и настройте .env.local

1. В Supabase перейдите в **Settings → API**
2. Скопируйте:
   - **Project URL** → в `VITE_SUPABASE_URL`
   - **Project API keys → anon public** → в `VITE_SUPABASE_ANON_KEY`
3. Получите Google Gemini API ключ на [ai.google.dev](https://ai.google.dev) → в `VITE_GEMINI_API_KEY`

Отредактируйте [.env.local](.env.local):

\`\`\`env
# Supabase
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...

# Google Gemini (опционально для AI функций)
VITE_GEMINI_API_KEY=AIza...
\`\`\`

### Шаг 5: Запустите приложение

\`\`\`bash
npm run dev
\`\`\`

Откройте http://localhost:3000

---

## 📝 Первое использование

1. **Регистрация** - Создайте аккаунт с email и паролем
2. **Добавьте контакты** - Нажмите "Добавить клиента"
3. **Создайте сделки** - Перемещайте карточки по воронке
4. **Используйте AI** - Нажмите кнопку чата внизу справа

---

## 🏗️ Архитектура проекта

\`\`\`
src/
├── components/          # React компоненты
│   ├── Dashboard.tsx    # Главный дашборд
│   ├── Auth.tsx         # Форма логина/регистрации
│   ├── ContactsList.tsx # Управление контактами
│   ├── DealsBoard.tsx   # Доска сделок (Kanban)
│   ├── TasksList.tsx    # Управление задачами
│   └── ... (ещё 8 компонентов)
├── lib/
│   ├── supabase.ts      # Supabase клиент и auth
│   └── database.ts      # CRUD операции для всех таблиц
├── services/
│   └── geminiService.ts # Интеграция Google Gemini AI
├── types.ts             # TypeScript интерфейсы
├── constants.tsx        # Приложение данные и конфиги
├── App.tsx              # Главное приложение
├── index.tsx            # Точка входа
└── index.html           # HTML шаблон

scripts/
└── supabase.sql         # SQL для создания БД
\`\`\`

---

## 🗄️ Структура базы данных

| Таблица | Назначение |
|---------|-----------|
| `users` | Профили пользователей |
| `contacts` | Клиенты и лиды |
| `deals` | Коммерческие сделки |
| `tasks` | Задачи команды |
| `chat_history` | История AI чата |
| `products` | Товары/услуги |
| `sales` | История продаж |
| `team_members` | Сотрудники |

Все таблицы имеют **Row Level Security (RLS)** - каждый пользователь видит только свои данные.

---

## 🔑 Ключевые переменные окружения

| Переменная | Описание | Источник |
|------------|---------|---------|
| `VITE_SUPABASE_URL` | URL базы данных | Supabase Settings → API |
| `VITE_SUPABASE_ANON_KEY` | Публичный ключ | Supabase Settings → API |
| `VITE_GEMINI_API_KEY` | Ключ Google Gemini | [ai.google.dev](https://ai.google.dev) |

---

## 📦 Технологический стек

- **Frontend**: React 19 + TypeScript
- **Styling**: Tailwind CSS
- **Build**: Vite
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **AI**: Google Gemini 1.5 Flash
- **Icons**: Lucide React
- **Charts**: Recharts

---

## 🔐 Безопасность

✅ Row Level Security (RLS) - автоматическое разграничение доступа  
✅ OAuth с Supabase - зашифрованные пароли  
✅ HTTPS только для API  
✅ No sensitive data in frontend - API ключи не видны в коде  

---

## ⚠️ Ограничения бесплатного плана

| Ресурс | Лимит |
|--------|-------|
| **Хранилище БД** | 500 MB |
| **Пропускная способность** | 2 GB/месяц |
| **Одновременные соединения** | 10 |
| **Auth запросы** | 50,000/месяц |

> Для бизнеса рекомендуется перейти на Pro ($25/месяц) при росте.

---

## 🛠️ Разработка

### Запуск в development режиме

\`\`\`bash
npm run dev
\`\`\`

Горячая перезагрузка работает автоматически.

### Сборка для production

\`\`\`bash
npm run build
\`\`\`

Оптимизированные файлы в папке `dist/`

### Preview production сборки локально

\`\`\`bash
npm run preview
\`\`\`

---

## 📚 Структура компонентов

### ContactsList
- Поиск, фильтрация контактов
- Добавление/удаление
- AI анализ качества лида (Gemini)

### DealsBoard
- Kanban с 7 этапами воронки
- Перемещение карточек
- Отслеживание сумм по этапам

### TasksList
- Фильтрация по статусу
- Распределение между командой
- Приоритизация

### Dashboard
- KPI и метрики
- Графики выручки и лидов
- Real-time статистика

### SettingsView
- Настройки профиля
- Интеграции
- План и оплата

---

## 🐛 Известные ограничения

- Drag & Drop в Kanban - только визуально, без сохранения порядка
- Финансовый отчёт - заглушка (требует интеграции с платёжными системами)
- Коммуникационный центр - заглушка (требует интеграции WhatsApp/Telegram)
- Service Desk - заглушка (требует системы тикетов)

---

## 🚀 Roadmap

- [ ] Real drag & drop в Kanban
- [ ] Интеграция с WhatsApp API
- [ ] Aмезон интеграция (WooCommerce, Shopify)
- [ ] Mobile приложение (React Native)
- [ ] Расширенная аналитика
- [ ] Email маркетинг интеграция
- [ ] Автоматизация по триггерам
- [ ] Экспорт в PDF

---

## 💬 Поддержка

- 📖 Документация: В разработке
- 🐛 Issues: GitHub Issues
- 💡 Suggestions: GitHub Discussions
- 📧 Email: support@novacrm.local

---

## 📄 Лицензия

Проект распространяется **бесплатно** для частного и коммерческого использования.

---

## 👨‍💻 Автор

**NovaCRM** - Системы управления для современного менеджера

Сделан с ❤️ на React + AI

---

## 📞 Контакты

- 🌐 Website: (в разработке)
- 📱 Telegram: (в разработке)
- 💼 LinkedIn: (в разработке)
