
import React from 'react';
import {
  CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, AreaChart, Area, XAxis, YAxis, PieChart, Pie, Cell, Legend
} from 'recharts';
import { TrendingUp, DollarSign, Target, Users, Zap } from 'lucide-react';
import { useAppStore } from '../store';
import { DealStage } from '../types';

const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6'];

const AnalyticsView: React.FC<{ isDark: boolean }> = ({ isDark }) => {
  const { deals, tasks, team, sales, products } = useAppStore();

  // Реальная статистика из store
  const totalRevenue = deals.reduce((acc, d) => acc + (d.amount || 0), 0);
  const closedDeals = deals.filter(d => d.stage === DealStage.CLOSED_WON);
  const activeDeals = deals.filter(d => d.stage !== DealStage.CLOSED_WON && d.stage !== DealStage.CLOSED_LOST);
  const conversionRate = deals.length > 0 ? Math.round((closedDeals.length / deals.length) * 100) : 0;
  const completedTasks = tasks.filter(t => t.completed).length;

  // Данные воронки по этапам
  const stageData = [
    { name: 'Новый лид', value: deals.filter(d => d.stage === DealStage.NEW_LEAD).length },
    { name: 'Связались', value: deals.filter(d => d.stage === DealStage.CONTACTED).length },
    { name: 'Выявление нужд', value: deals.filter(d => d.stage === DealStage.NEEDS_ANALYSIS).length },
    { name: 'Предложение', value: deals.filter(d => d.stage === DealStage.PROPOSAL).length },
    { name: 'Переговоры', value: deals.filter(d => d.stage === DealStage.NEGOTIATION).length },
    { name: 'Оплачено', value: deals.filter(d => d.stage === DealStage.CLOSED_WON).length },
  ].filter(s => s.value > 0);

  // Данные продаж товаров по дням (последние 7 дней)
  const last7days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dayName = d.toLocaleDateString('ru-RU', { weekday: 'short' });
    const dateStr = d.toISOString().split('T')[0];
    const daySales = sales.filter(s => s.date.startsWith(dateStr));
    return {
      name: dayName,
      revenue: daySales.reduce((acc, s) => acc + s.totalAmount, 0),
      deals: deals.filter(d => d.expectedCloseDate === dateStr).length,
    };
  });

  // Данные по приоритету задач
  const taskPriorityData = [
    { name: 'Высокий', value: tasks.filter(t => t.priority === 'Высокий').length },
    { name: 'Средний', value: tasks.filter(t => t.priority === 'Средний').length },
    { name: 'Низкий', value: tasks.filter(t => t.priority === 'Низкий').length },
  ].filter(t => t.value > 0);

  const statCards = [
    { title: 'Всего сделок', value: deals.length.toString(), sub: `${activeDeals.length} активных`, icon: <Zap size={22} />, color: 'indigo' },
    { title: 'Выручка (план)', value: `₽${(totalRevenue / 1000).toFixed(0)}к`, sub: `${closedDeals.length} закрыто`, icon: <DollarSign size={22} />, color: 'emerald' },
    { title: 'Конверсия', value: `${conversionRate}%`, sub: 'закрытые / все', icon: <Target size={22} />, color: 'amber' },
    { title: 'Команда', value: team.length.toString(), sub: `${completedTasks} задач выполнено`, icon: <Users size={22} />, color: 'violet' },
  ];

  const colorMap: Record<string, string> = {
    indigo: 'bg-indigo-500/10 text-indigo-500',
    emerald: 'bg-emerald-500/10 text-emerald-500',
    amber: 'bg-amber-500/10 text-amber-500',
    violet: 'bg-violet-500/10 text-violet-500',
  };

  const gridCard = `rounded-2xl border p-6 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`;

  return (
    <div className="space-y-6">
      <header>
        <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Аналитика</h1>
        <p className={isDark ? 'text-slate-400' : 'text-slate-500'}>Реальные показатели на основе ваших данных.</p>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <div key={i} className={gridCard}>
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-3 ${colorMap[card.color]}`}>
              {card.icon}
            </div>
            <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{card.title}</p>
            <p className={`text-2xl font-black mb-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>{card.value}</p>
            <p className="text-xs text-slate-500">{card.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* График продаж */}
        <div className={gridCard}>
          <h3 className={`text-base font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-800'}`}>Выручка по дням (₽)</h3>
          {last7days.some(d => d.revenue > 0) ? (
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={last7days}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#334155' : '#f1f5f9'} />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: isDark ? '#1e293b' : '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                  <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-60 flex items-center justify-center flex-col text-slate-400">
              <TrendingUp size={40} className="opacity-20 mb-2" />
              <p className="text-sm">Нет данных о продажах за эту неделю</p>
              <p className="text-xs mt-1">Добавьте товары и оформите продажи</p>
            </div>
          )}
        </div>

        {/* Воронка */}
        <div className={gridCard}>
          <h3 className={`text-base font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-800'}`}>Сделки по этапам</h3>
          {stageData.length > 0 ? (
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stageData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={isDark ? '#334155' : '#f1f5f9'} />
                  <XAxis type="number" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} width={80} />
                  <Tooltip contentStyle={{ backgroundColor: isDark ? '#1e293b' : '#fff', borderRadius: '12px', border: 'none' }} />
                  <Bar dataKey="value" fill="#6366f1" radius={[0, 6, 6, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-60 flex items-center justify-center flex-col text-slate-400">
              <Target size={40} className="opacity-20 mb-2" />
              <p className="text-sm">Нет сделок в воронке</p>
              <p className="text-xs mt-1">Добавьте сделки в разделе «Воронка продаж»</p>
            </div>
          )}
        </div>

        {/* Приоритеты задач */}
        <div className={gridCard}>
          <h3 className={`text-base font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-800'}`}>Приоритеты задач</h3>
          {taskPriorityData.length > 0 ? (
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={taskPriorityData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={4} dataKey="value">
                    {taskPriorityData.map((_, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: isDark ? '#1e293b' : '#fff', borderRadius: '12px', border: 'none' }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-60 flex items-center justify-center flex-col text-slate-400">
              <Target size={40} className="opacity-20 mb-2" />
              <p className="text-sm">Нет задач</p>
            </div>
          )}
        </div>

        {/* Статистика команды */}
        <div className={gridCard}>
          <h3 className={`text-base font-bold mb-4 ${isDark ? 'text-white' : 'text-slate-800'}`}>Результаты команды</h3>
          {team.length > 0 ? (
            <div className="space-y-3 overflow-y-auto max-h-60">
              {team.map(member => (
                <div key={member.id} className={`flex items-center gap-3 p-3 rounded-xl ${isDark ? 'bg-slate-800' : 'bg-slate-50'}`}>
                  <img src={member.avatar} alt={member.name} className="w-9 h-9 rounded-xl bg-slate-100" />
                  <div className="flex-1">
                    <p className="text-sm font-bold">{member.name}</p>
                    <p className="text-xs text-slate-500">{member.role}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-indigo-500">{member.dealsCount} сделок</p>
                    <p className="text-xs text-emerald-500 font-bold">{member.conversion}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-60 flex items-center justify-center flex-col text-slate-400">
              <Users size={40} className="opacity-20 mb-2" />
              <p className="text-sm">Команда пуста</p>
              <p className="text-xs mt-1">Добавьте сотрудников в разделе «Команда»</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsView;
