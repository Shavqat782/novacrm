
import React, { useState, useEffect } from 'react';
import { CreditCard, ArrowUpRight, ArrowDownRight, Download, Plus, FileText, X, AlertCircle, Loader, TrendingUp, Wallet } from 'lucide-react';
import { transactionService } from '../lib/database';

interface Transaction {
  id: string;
  desc: string;
  amount: string;
  status: string;
  date: string;
  type: 'in' | 'out';
}

// Демо-данные, если Supabase недоступен
const demoTransactions = (): Transaction[] => [
  { id: '1', desc: 'Оплата тарифа "Enterprise"', amount: '+ ₽450,000', status: 'Завершено', date: '20.11.2023', type: 'in' },
  { id: '2', desc: 'Маркетинговые услуги (FB Ads)', amount: '- ₽120,000', status: 'Завершено', date: '18.11.2023', type: 'out' },
  { id: '3', desc: 'Аренда офиса', amount: '- ₽85,000', status: 'Ожидание', date: '15.11.2023', type: 'out' },
  { id: '4', desc: 'Продажа: Консалтинг', amount: '+ ₽15,000', status: 'Завершено', date: '12.11.2023', type: 'in' },
];

const formatAmount = (amount: number, type: 'in' | 'out') =>
  `${type === 'in' ? '+' : '-'} ₽${Math.abs(amount).toLocaleString('ru-RU')}`;

const FinanceView: React.FC<{ isDark: boolean; userId?: string }> = ({ isDark, userId }) => {
  const [transactions, setTransactions] = useState<Transaction[]>(demoTransactions);
  const [loading, setLoading] = useState(!!userId);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTransaction, setNewTransaction] = useState({
    desc: '',
    amount: '',
    type: 'in' as 'in' | 'out',
  });

  // Загрузка из Supabase (fallback: localStorage от предыдущей версии)
  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    let cancelled = false;
    (async () => {
      try {
        const rows = await transactionService.getAll(userId);
        if (cancelled) return;
        if (rows.length > 0) {
          setTransactions(rows.map(t => ({
            id: t.id,
            desc: t.desc,
            amount: formatAmount(t.amount, t.type),
            status: t.status,
            date: t.date,
            type: t.type,
          })));
        } else {
          // Миграция старых localStorage-данных в БД (однократно)
          const stored = localStorage.getItem('novacrm-transactions');
          if (stored) {
            try {
              const local: Transaction[] = JSON.parse(stored);
              for (const t of local) {
                const num = parseFloat(t.amount.replace(/[^\d.-]/g, ''));
                if (isNaN(num)) continue;
                await transactionService.create(userId, {
                  desc: t.desc, amount: num, type: t.type, status: t.status, date: t.date,
                });
              }
              const migrated = await transactionService.getAll(userId);
              if (!cancelled && migrated.length > 0) {
                setTransactions(migrated.map(t => ({
                  id: t.id, desc: t.desc, amount: formatAmount(t.amount, t.type),
                  status: t.status, date: t.date, type: t.type,
                })));
              }
              localStorage.removeItem('novacrm-transactions');
            } catch { /* ignore migration errors */ }
          }
        }
      } catch (err) {
        console.warn('Supabase transactions unavailable, using demo data:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [userId]);

  const totalIncome = transactions
    .filter(t => t.type === 'in')
    .reduce((acc, t) => acc + parseFloat(t.amount.replace(/[^\d.-]/g, '')), 0);

  const totalExpense = transactions
    .filter(t => t.type === 'out')
    .reduce((acc, t) => acc + Math.abs(parseFloat(t.amount.replace(/[^\d.-]/g, ''))), 0);

  const balance = totalIncome - totalExpense;

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTransaction.desc.trim() || !newTransaction.amount.trim()) return;

    const amount = parseFloat(newTransaction.amount);
    const today = new Date();
    const dateStr = `${today.getDate().toString().padStart(2, '0')}.${(today.getMonth() + 1).toString().padStart(2, '0')}.${today.getFullYear()}`;

    const transaction: Transaction = {
      id: `local-${Date.now()}`,
      desc: newTransaction.desc,
      amount: `${newTransaction.type === 'in' ? '+' : '-'} ₽${amount.toLocaleString('ru-RU')}`,
      status: 'Завершено',
      date: dateStr,
      type: newTransaction.type,
    };

    setTransactions(prev => [transaction, ...prev]);
    setIsModalOpen(false);
    setNewTransaction({ desc: '', amount: '', type: 'in' });

    // Сохраняем в Supabase (если доступен)
    if (userId && !isNaN(amount)) {
      try {
        const saved = await transactionService.create(userId, {
          desc: transaction.desc, amount, type: transaction.type,
          status: 'Завершено', date: dateStr,
        });
        setTransactions(prev => prev.map(t => t.id === transaction.id ? {
          ...t, id: saved.id, amount: formatAmount(saved.amount, saved.type),
        } : t));
      } catch (err) {
        console.warn('Supabase save failed, kept locally:', err);
      }
    }
  };

  const deleteTransaction = async (id: string) => {
    if (!confirm('Удалить транзакцию?')) return;
    setTransactions(prev => prev.filter(t => t.id !== id));
    if (userId && !id.startsWith('local-') && !/^\d+$/.test(id)) {
      try { await transactionService.remove(id); } catch (err) { console.warn('Supabase delete failed:', err); }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Финансы</h2>
          <p className={isDark ? 'text-slate-400' : 'text-slate-500'}>Контроль денежных потоков и выставление счетов.</p>
        </div>
        <div className="flex gap-3">
          <button className={`flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
            <Download size={18} />
            Отчет
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus size={18} />
            Добавить запись
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className={`p-6 rounded-2xl border ${isDark ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-indigo-600 border-indigo-500 text-white'}`}>
           <div className="flex justify-between items-start mb-4">
             <CreditCard size={32} />
             <span className="text-xs font-bold uppercase tracking-wider opacity-70">Баланс системы</span>
           </div>
           <div className="text-3xl font-bold mb-1">₽{balance.toLocaleString()}</div>
           <p className="text-sm opacity-70">Доходы минус расходы</p>
        </div>
        <div className={`p-6 rounded-2xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
           <div className="flex justify-between items-start mb-4">
             <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg"><ArrowUpRight size={24} /></div>
             <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Доходы</span>
           </div>
           <div className="text-2xl font-bold mb-1">₽{totalIncome.toLocaleString()}</div>
           <p className="text-xs text-emerald-500 font-medium">{transactions.filter(t => t.type === 'in').length} транзакций</p>
        </div>
        <div className={`p-6 rounded-2xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
           <div className="flex justify-between items-start mb-4">
             <div className="p-2 bg-rose-100 text-rose-600 rounded-lg"><ArrowDownRight size={24} /></div>
             <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Расходы</span>
           </div>
           <div className="text-2xl font-bold mb-1">₽{totalExpense.toLocaleString()}</div>
           <p className="text-xs text-rose-500 font-medium">{transactions.filter(t => t.type === 'out').length} транзакций</p>
        </div>
      </div>

      <div className={`rounded-2xl border overflow-hidden ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className="p-4 border-b dark:border-slate-800 flex justify-between items-center">
          <h3 className="font-bold">Все транзакции</h3>
          <span className="text-xs text-slate-500">{transactions.length} записей</span>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {transactions.map(tr => (
            <div key={tr.id} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
              <div className="flex items-center gap-4">
                <div className={`p-2 rounded-lg ${tr.type === 'in' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                  {tr.type === 'in' ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
                </div>
                <div>
                  <p className="text-sm font-semibold">{tr.desc}</p>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider">{tr.date}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className={`text-sm font-bold ${tr.type === 'in' ? 'text-emerald-500' : 'text-rose-500'}`}>{tr.amount}</p>
                  <div className="flex items-center justify-end gap-1.5 mt-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${tr.status === 'Завершено' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                    <span className="text-[10px] text-slate-500">{tr.status}</span>
                  </div>
                </div>
                <button 
                  onClick={() => deleteTransaction(tr.id)} 
                  className="p-1 text-slate-400 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal Add Transaction */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className={`max-w-md w-full p-8 rounded-3xl border shadow-2xl animate-in zoom-in-95 duration-300 ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-100'}`}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold">Новая запись</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleAddTransaction} className="space-y-4">
              {/* Тип */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setNewTransaction(p => ({...p, type: 'in'}))}
                  className={`flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                    newTransaction.type === 'in' 
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20' 
                      : isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  <ArrowUpRight size={18} /> Доход
                </button>
                <button
                  type="button"
                  onClick={() => setNewTransaction(p => ({...p, type: 'out'}))}
                  className={`flex-1 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                    newTransaction.type === 'out' 
                      ? 'bg-rose-600 text-white shadow-lg shadow-rose-500/20' 
                      : isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  <ArrowDownRight size={18} /> Расход
                </button>
              </div>

              <input 
                type="text" 
                placeholder="Описание *" 
                required
                value={newTransaction.desc}
                onChange={e => setNewTransaction(p => ({...p, desc: e.target.value}))}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm ${
                  isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
                }`}
              />

              <input 
                type="number" 
                placeholder="Сумма (₽) *" 
                required
                value={newTransaction.amount}
                onChange={e => setNewTransaction(p => ({...p, amount: e.target.value}))}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm ${
                  isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
                }`}
              />

              <button
                type="submit"
                className={`w-full py-3 rounded-xl font-bold transition-all text-white ${
                  newTransaction.type === 'in' 
                    ? 'bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-500/20' 
                    : 'bg-rose-600 hover:bg-rose-700 shadow-lg shadow-rose-500/20'
                }`}
              >
                Добавить {newTransaction.type === 'in' ? 'доход' : 'расход'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinanceView;
