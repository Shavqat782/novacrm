
import React from 'react';
import { HelpCircle, MessageSquare, AlertCircle, CheckCircle, Search, Filter } from 'lucide-react';

const TICKETS = [
  { id: '#4512', subject: 'Проблема с интеграцией 1С', status: 'В работе', priority: 'Критичный', user: 'Иван С.', date: '2 часа назад' },
  { id: '#4511', subject: 'Не приходят уведомления в Telegram', status: 'Открыт', priority: 'Средний', user: 'Анна М.', date: '4 часа назад' },
  { id: '#4510', subject: 'Смена тарифного плана', status: 'Решен', priority: 'Низкий', user: 'Сергей П.', date: 'Вчера' },
  { id: '#4509', subject: 'Ошибка при выгрузке Excel', status: 'В работе', priority: 'Высокий', user: 'Дмитрий В.', date: 'Вчера' },
];

const ServiceDesk: React.FC<{ isDark: boolean }> = ({ isDark }) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Служба поддержки</h2>
          <p className={isDark ? 'text-slate-400' : 'text-slate-500'}>Управление тикетами и обращениями клиентов.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm">
          Новый тикет
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className={`p-6 rounded-2xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'} text-center`}>
           <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-4"><HelpCircle /></div>
           <div className="text-2xl font-bold">12</div>
           <p className="text-sm text-slate-500 uppercase tracking-wider font-semibold">Новых тикетов</p>
        </div>
        <div className={`p-6 rounded-2xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'} text-center`}>
           <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center mx-auto mb-4"><MessageSquare /></div>
           <div className="text-2xl font-bold">8</div>
           <p className="text-sm text-slate-500 uppercase tracking-wider font-semibold">В работе</p>
        </div>
        <div className={`p-6 rounded-2xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'} text-center`}>
           <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center mx-auto mb-4"><CheckCircle /></div>
           <div className="text-2xl font-bold">145</div>
           <p className="text-sm text-slate-500 uppercase tracking-wider font-semibold">Решено всего</p>
        </div>
      </div>

      <div className={`rounded-xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} overflow-hidden`}>
        <div className="p-4 border-b dark:border-slate-800 flex flex-wrap gap-4 items-center">
           <div className="relative flex-1 min-w-[200px]">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
             <input type="text" placeholder="Поиск по ID или теме..." className={`w-full pl-10 pr-4 py-2 rounded-lg border text-sm outline-none ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`} />
           </div>
           <button className={`flex items-center gap-2 px-4 py-2 border rounded-lg text-sm ${isDark ? 'border-slate-700 text-slate-400' : 'border-slate-200 text-slate-500'}`}>
             <Filter size={16} /> Фильтры
           </button>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {TICKETS.map(ticket => (
            <div key={ticket.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
               <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-lg ${
                    ticket.status === 'Решен' ? 'bg-emerald-100 text-emerald-600' : 
                    ticket.status === 'В работе' ? 'bg-amber-100 text-amber-600' : 'bg-indigo-100 text-indigo-600'
                  }`}>
                    {ticket.status === 'Решен' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-slate-400">{ticket.id}</span>
                      <h4 className="text-sm font-bold">{ticket.subject}</h4>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">От: {ticket.user} • {ticket.date}</p>
                  </div>
               </div>
               <div className="flex items-center gap-3">
                 <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                   ticket.priority === 'Критичный' ? 'bg-rose-100 text-rose-600' : 
                   ticket.priority === 'Высокий' ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-600'
                 }`}>
                   {ticket.priority}
                 </span>
                 <button className="text-indigo-500 text-xs font-bold hover:underline">Открыть</button>
               </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Fix for default export error in App.tsx
export default ServiceDesk;
