import React, { useState } from 'react';
import { Search, Filter, Plus, X, Phone, Mail, Building2, Trash2, AlertCircle, Loader } from 'lucide-react';
import { analyzeLeadQuality } from '../services/geminiService';
import { Contact, LeadSource } from '../types';

interface ContactsListProps {
  isDark: boolean;
  contacts: Contact[];
  setContacts: React.Dispatch<React.SetStateAction<Contact[]>>;
  onAdd: (contact: Omit<Contact, 'id' | 'lastContacted'>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const ContactsList: React.FC<ContactsListProps> = ({ isDark, contacts, onAdd, onDelete }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [newContact, setNewContact] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    role: '',
    source: LeadSource.WEBSITE,
    status: 'Активен' as const,
    tags: [] as string[],
    notes: ''
  });

  const filteredContacts = contacts.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm)
  );

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!newContact.name.trim() || !newContact.phone.trim()) {
      setError('Заполните обязательные поля: Имя и Телефон');
      return;
    }

    setIsSubmitting(true);
    try {
      await onAdd({
        name: newContact.name,
        email: newContact.email,
        phone: newContact.phone,
        company: newContact.company,
        role: newContact.role,
        source: newContact.source,
        status: newContact.status,
        tags: newContact.tags.length > 0 ? newContact.tags : ['Новый'],
        notes: newContact.notes
      });

      setIsModalOpen(false);
      setNewContact({
        name: '',
        email: '',
        phone: '',
        company: '',
        role: '',
        source: LeadSource.WEBSITE,
        status: 'Активен',
        tags: [],
        notes: ''
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteContact = async (id: string) => {
    if (!confirm('Вы уверены, что хотите удалить этого клиента?')) return;

    try {
      await onDelete(id);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleAnalyze = async (contact: Contact) => {
    setAnalyzingId(contact.id);
    try {
      const result = await analyzeLeadQuality(JSON.stringify(contact));
      setAnalysisResult(result);
    } catch (err) {
      setError('Ошибка при анализе лида');
    } finally {
      setAnalyzingId(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>База клиентов</h2>
          <p className={isDark ? 'text-slate-400' : 'text-slate-500'}>Всего: {contacts.length} контактов</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/25 active:scale-95"
        >
          <Plus size={20} />
          <span className="font-bold">Добавить клиента</span>
        </button>
      </div>

      {error && (
        <div className={`p-4 rounded-xl border-l-4 flex justify-between items-center ${
          isDark ? 'bg-rose-900/20 border-rose-600' : 'bg-rose-50 border-rose-600'
        }`}>
          <div className="flex items-center gap-3">
            <AlertCircle className="text-rose-600 flex-shrink-0" size={18} />
            <p className={isDark ? 'text-rose-200' : 'text-rose-800'}>{error}</p>
          </div>
          <button onClick={() => setError(null)} className="text-rose-600 hover:text-rose-800">✕</button>
        </div>
      )}

      <div className={`p-4 rounded-2xl border flex flex-wrap gap-4 items-center ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className="flex-1 relative min-w-[280px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Поиск по имени, компании или телефону..." 
            className={`w-full pl-12 pr-4 py-3 rounded-xl border focus:ring-2 focus:ring-indigo-500 outline-none transition-all ${
              isDark ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500' : 'bg-slate-50 border-slate-200 placeholder:text-slate-400'
            }`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className={`flex items-center gap-2 px-5 py-3 rounded-xl border font-medium ${isDark ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
          <Filter size={18} /> Фильтры
        </button>
      </div>

      <div className={`rounded-2xl border overflow-hidden shadow-sm ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? 'bg-slate-800/50 text-slate-500' : 'bg-slate-50 text-slate-400'}`}>
              <tr>
                <th className="px-6 py-4">Клиент</th>
                <th className="px-6 py-4">Контакты</th>
                <th className="px-6 py-4">Статус / Источник</th>
                <th className="px-6 py-4 text-right">Действия</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-slate-800' : 'divide-slate-100'}`}>
              {filteredContacts.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <p className={isDark ? 'text-slate-400' : 'text-slate-500'}>
                      {contacts.length === 0 ? 'Нет контактов. Добавьте первого!' : 'Контакты не найдены'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredContacts.map(contact => (
                  <tr key={contact.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-indigo-500/20">
                          {contact.name[0]?.toUpperCase()}
                        </div>
                        <div>
                          <div className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>{contact.name}</div>
                          <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                            <Building2 size={12} /> {contact.company || 'N/A'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400">
                          <Phone size={12} className="text-indigo-500" /> {contact.phone}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-400">
                          <Mail size={12} /> {contact.email || 'N/A'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase w-fit ${
                          contact.status === 'Активен' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' :
                          contact.status === 'Неактивен' ? 'bg-slate-100 text-slate-700 dark:bg-slate-500/10 dark:text-slate-400' :
                          'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'
                        }`}>
                          {contact.status}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">📍 {contact.source}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleAnalyze(contact)}
                          disabled={analyzingId === contact.id}
                          className="p-2 text-slate-400 hover:text-indigo-600 transition-colors disabled:opacity-50"
                          title="Анализ качества лида"
                        >
                          {analyzingId === contact.id ? <Loader size={16} className="animate-spin" /> : <Plus size={16} />}
                        </button>
                        <button 
                          onClick={() => deleteContact(contact.id)}
                          className="p-2 text-slate-400 hover:text-rose-600 transition-colors"
                          title="Удалить"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className={`max-w-md w-full p-8 rounded-3xl border shadow-2xl animate-in zoom-in-95 duration-300 ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-100'}`}>
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-bold">Новый контакт</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleAddContact} className="space-y-4">
              <input 
                type="text" 
                placeholder="Имя *" 
                required
                value={newContact.name}
                onChange={(e) => setNewContact({...newContact, name: e.target.value})}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none ${
                  isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
                }`}
              />
              <input 
                type="tel" 
                placeholder="Телефон *" 
                required
                value={newContact.phone}
                onChange={(e) => setNewContact({...newContact, phone: e.target.value})}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none ${
                  isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
                }`}
              />
              <input 
                type="email" 
                placeholder="Email" 
                value={newContact.email}
                onChange={(e) => setNewContact({...newContact, email: e.target.value})}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none ${
                  isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
                }`}
              />
              <input 
                type="text" 
                placeholder="Компания" 
                value={newContact.company}
                onChange={(e) => setNewContact({...newContact, company: e.target.value})}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none ${
                  isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
                }`}
              />
              <input 
                type="text" 
                placeholder="Должность" 
                value={newContact.role}
                onChange={(e) => setNewContact({...newContact, role: e.target.value})}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none ${
                  isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
                }`}
              />

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting && <Loader size={18} className="animate-spin" />}
                {isSubmitting ? 'Добавление...' : 'Добавить контакт'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContactsList;
