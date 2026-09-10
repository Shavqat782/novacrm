
import React from 'react';
import { 
  CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, AreaChart, Area, XAxis, YAxis
} from 'recharts';
import { Users, DollarSign, Target, Zap } from 'lucide-react';

const data = [
  { name: 'Пн', leads: 40, revenue: 24000 },
  { name: 'Вт', leads: 30, revenue: 13980 },
  { name: 'Ср', leads: 20, revenue: 98000 },
  { name: 'Чт', leads: 27, revenue: 39080 },
  { name: 'Пт', leads: 18, revenue: 48000 },
  { name: 'Сб', leads: 23, revenue: 38000 },
  { name: 'Вс', leads: 34, revenue: 43000 },
];

const StatCard = ({ title, value, change, icon: Icon, color, isDark }: any) => (
  <div className={`p-6 rounded-2xl shadow-sm border transition-all hover:shadow-md ${
    isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-100'
  }`}>
    <div className="flex items-center justify-between mb-4">
      <div className={`p-2 rounded-lg ${color} bg-opacity-10`}>
        <Icon className={color.replace('bg-', 'text-')} size={24} />
      </div>
      <span className={`text-xs font-medium px-2 py-1 rounded-full ${
        change.startsWith('+') ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
      }`}>
        {change}
      </span>
    </div>
    <p className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{title}</p>
    <p className="text-2xl font-bold mt-1">{value}</p>
  </div>
);

// Fix: Updated Dashboard props to include contactsCount and dealsCount passed from App.tsx
const Dashboard: React.FC<{ isDark: boolean; contactsCount: number; dealsCount: number }> = ({ isDark, contactsCount, dealsCount }) => {
  return (
    <div className="space-y-6">
      <header>
        <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Бизнес-аналитика</h1>
        <p className={`${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Показатели эффективности и обзор продаж в реальном времени.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Fix: Use the dynamic contactsCount prop */}
        <StatCard title="Всего лидов" value={contactsCount.toLocaleString()} change="+12.5%" icon={Users} color="bg-indigo-500" isDark={isDark} />
        <StatCard title="Выручка" value="₽4,250,000" change="+8.2%" icon={DollarSign} color="bg-emerald-500" isDark={isDark} />
        <StatCard title="Конверсия" value="3.2%" change="-1.4%" icon={Target} color="bg-amber-500" isDark={isDark} />
        {/* Fix: Use the dynamic dealsCount prop */}
        <StatCard title="Активные сделки" value={dealsCount.toLocaleString()} change="+4.1%" icon={Zap} color="bg-violet-500" isDark={isDark} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={`p-6 rounded-2xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
          <h3 className={`text-lg font-semibold mb-6 ${isDark ? 'text-white' : 'text-slate-800'}`}>Рост выручки</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#334155' : '#f1f5f9'} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  labelFormatter={(v) => `День: ${v}`}
                  contentStyle={{ backgroundColor: isDark ? '#1e293b' : '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ color: '#6366f1' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={`p-6 rounded-2xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
          <h3 className={`text-lg font-semibold mb-6 ${isDark ? 'text-white' : 'text-slate-800'}`}>Лиды по дням</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#334155' : '#f1f5f9'} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  labelFormatter={(v) => `День: ${v}`}
                  contentStyle={{ backgroundColor: isDark ? '#1e293b' : '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="leads" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
