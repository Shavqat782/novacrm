
import React, { useState } from 'react';
import { UserPlus, Mail, MoreVertical, TrendingUp, ShieldCheck, X, BadgeCheck, Phone, MapPin, Trash2, Copy, Link2, MessageCircle } from 'lucide-react';
import { TeamMember } from '../types';
import { useAppStore } from '../store';
import { teamService } from '../lib/database';

interface TeamViewProps {
  isDark: boolean;
  team: TeamMember[];
}

interface InviteLink {
  id: string;
  code: string;
  link: string;
}

const TeamView: React.FC<TeamViewProps & { userId?: string }> = ({ isDark, team, userId }) => {
  const { addTeamMember, deleteTeamMember } = useAppStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [inviteMethod, setInviteMethod] = useState<'email' | 'whatsapp' | 'link'>('email');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [inviteLinks, setInviteLinks] = useState<InviteLink[]>([]);

  const [newMember, setNewMember] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'Менеджер' as 'Администратор' | 'Менеджер' | 'Аналитик'
  });

  const generateInviteLink = async (): Promise<InviteLink | null> => {
    try {
      if (!userId) {
        alert('Войдите в аккаунт, чтобы создавать приглашения');
        return null;
      }
      // Создаём приглашение в Supabase (работает между устройствами)
      const { code } = await teamService.createInvite(userId, userId, newMember.role);
      const baseUrl = window.location.origin;
      const link = `${baseUrl}/?invite=${code}`;

      const newLink: InviteLink = {
        id: `link_${Date.now()}`,
        code,
        link
      };

      setInviteLinks(prev => [newLink, ...prev]);
      return newLink;
    } catch (err) {
      console.error('Error generating invite link:', err);
      alert('Ошибка при создании ссылки приглашения. Проверьте подключение к Supabase.');
      return null;
    }
  };

  // Отправка приглашения в WhatsApp: открывает чат с готовым текстом и ссылкой
  const sendWhatsAppInvite = async () => {
    const link = await generateInviteLink();
    if (!link) return;

    let phone = newMember.phone.replace(/[^\d]/g, '');
    // Если номер без кода страны — предполагаем Россию/Казахстан (+7)
    if (phone.length === 10) phone = '7' + phone;

    const text = encodeURIComponent(
      `Здравствуйте${newMember.name ? ', ' + newMember.name : ''}! ` +
      `Вас приглашают в команду NovaCRM в роли "${newMember.role}". ` +
      `Зарегистрируйтесь по ссылке: ${link}`
    );
    window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMember.name || (inviteMethod === 'email' && !newMember.email) || (inviteMethod === 'whatsapp' && !newMember.phone)) {
      return;
    }

    // Генерируем приглашение в БД и показываем ссылку
    const link = await generateInviteLink();

    const member: TeamMember = {
      id: `pending-${Date.now()}`,
      name: newMember.name,
      email: newMember.email || '',
      role: newMember.role,
      status: 'Не в сети',
      dealsCount: 0,
      conversion: '0%',
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${newMember.name}`
    };

    // Показываем в списке как "ожидает регистрации"
    addTeamMember(member);
    setIsModalOpen(false);
    setNewMember({ name: '', email: '', phone: '', role: 'Менеджер' });
    setInviteMethod('email');
  };

  const removeMember = async (id: string) => {
    if (!confirm('Отозвать доступ у сотрудника?')) return;
    // Сотрудники из Supabase (не pending) удаляются из БД
    if (!id.startsWith('pending-') && userId) {
      try { await teamService.removeMember(id); } catch (err) { console.warn('Supabase remove failed:', err); }
    }
    deleteTeamMember(id);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Управление командой</h2>
          <p className={isDark ? 'text-slate-400' : 'text-slate-500'}>Приглашайте сотрудников по email, WhatsApp или ссылке</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
        >
          <UserPlus size={20} />
          <span className="font-bold">Пригласить в команду</span>
        </button>
      </div>

      {/* Ссылки приглашения */}
      {inviteLinks.length > 0 && (
        <div className={`p-6 rounded-2xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <Link2 size={18} className="text-indigo-600" />
            Активные ссылки приглашения
          </h3>
          <div className="space-y-2">
            {inviteLinks.slice(0, 3).map(link => (
              <div key={link.id} className={`p-4 rounded-lg border flex items-center justify-between gap-4 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                <code className="text-xs font-mono text-slate-600 dark:text-slate-400 truncate flex-1">{link.code}</code>
                <button
                  onClick={() => copyToClipboard(link.link, link.id)}
                  className={`p-2 rounded-lg transition-all flex items-center gap-1 text-xs font-medium ${
                    copiedId === link.id 
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                      : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 hover:bg-indigo-200'
                  }`}
                >
                  <Copy size={14} />
                  {copiedId === link.id ? 'Скопировано!' : 'Копировать'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {team.map(member => (
          <div key={member.id} className={`group relative p-6 rounded-3xl border transition-all hover:shadow-xl ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
            <div className="flex justify-between items-start mb-6">
              <div className="relative">
                <img src={member.avatar} className="w-16 h-16 rounded-2xl object-cover bg-slate-100 p-1" alt={member.name} />
                <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 ${isDark ? 'border-slate-900' : 'border-white'} ${member.status === 'В сети' ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
              </div>
              <div className="flex gap-1">
                <button 
                  onClick={() => removeMember(member.id)}
                  className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={18} />
                </button>
                <button className="p-2 text-slate-400 hover:text-indigo-500 transition-colors">
                  <MoreVertical size={20} />
                </button>
              </div>
            </div>

            <div className="mb-6">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg">{member.name}</h3>
                {member.role === 'Администратор' && <BadgeCheck size={16} className="text-indigo-500" />}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-indigo-500 font-bold mt-1 uppercase tracking-widest">
                <ShieldCheck size={14} />
                {member.role}
              </div>
            </div>
            
            <div className="space-y-2 mb-8">
              {member.email && (
                <div className="flex items-center gap-2 text-sm text-slate-500 truncate">
                  <Mail size={14} className="shrink-0" /> {member.email}
                </div>
              )}
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <MapPin size={14} className="shrink-0" /> Удаленно / Офис
              </div>
            </div>

            <div className={`grid grid-cols-2 gap-4 p-4 rounded-2xl ${isDark ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
              <div className="text-center border-r dark:border-slate-700">
                <p className="text-[10px] uppercase font-bold text-slate-500 mb-1">Сделок</p>
                <p className="font-bold text-xl">{member.dealsCount}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] uppercase font-bold text-slate-500 mb-1">Конверсия</p>
                <div className="flex items-center justify-center gap-1">
                  <p className="font-bold text-xl text-emerald-500">{member.conversion}</p>
                  <TrendingUp size={14} className="text-emerald-500" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300 overflow-y-auto">
          <div className={`max-w-md w-full p-8 rounded-3xl border shadow-2xl animate-in zoom-in-95 duration-300 my-8 ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-100'}`}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold">Пригласить в команду</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className={`p-2 rounded-xl hover:${isDark ? 'bg-slate-800' : 'bg-slate-50'} transition-colors`}
              >
                <X size={24} />
              </button>
            </div>

            {/* Методы приглашения */}
            <div className="flex gap-2 mb-6">
              {(['email', 'whatsapp', 'link'] as const).map(method => (
                <button
                  key={method}
                  onClick={() => setInviteMethod(method)}
                  className={`flex-1 py-2 px-3 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-1.5 ${
                    inviteMethod === method
                      ? 'bg-indigo-600 text-white'
                      : isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {method === 'email' && <Mail size={14} />}
                  {method === 'whatsapp' && <MessageCircle size={14} />}
                  {method === 'link' && <Link2 size={14} />}
                  {method === 'email' ? 'Email' : method === 'whatsapp' ? 'WhatsApp' : 'Ссылка'}
                </button>
              ))}
            </div>

            <form onSubmit={handleAddMember} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase block mb-1.5">Имя и фамилия</label>
                <input 
                  required
                  placeholder="Антон Смирнов" 
                  className={`w-full p-3.5 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}
                  value={newMember.name}
                  onChange={e => setNewMember({...newMember, name: e.target.value})}
                />
              </div>

              {inviteMethod === 'email' && (
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase block mb-1.5">Рабочий Email</label>
                  <input 
                    required
                    type="email"
                    placeholder="name@company.ru" 
                    className={`w-full p-3.5 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}
                    value={newMember.email}
                    onChange={e => setNewMember({...newMember, email: e.target.value})}
                  />
                </div>
              )}

              {inviteMethod === 'whatsapp' && (
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase block mb-1.5">Номер WhatsApp</label>
                  <input 
                    required
                    type="tel"
                    placeholder="+7 (999) 123-45-67" 
                    className={`w-full p-3.5 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}
                    value={newMember.phone}
                    onChange={e => setNewMember({...newMember, phone: e.target.value})}
                  />
                </div>
              )}

              {inviteMethod === 'link' && (
                <div className={`p-4 rounded-lg border-2 border-dashed ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">Скопируйте ссылку и передайте её новому сотруднику:</p>
                  <button
                    type="button"
                    onClick={async () => {
                      const link = await generateInviteLink();
                      if (link) copyToClipboard(link.link, link.id);
                    }}
                    className="w-full py-2 px-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all text-sm font-medium flex items-center justify-center gap-2"
                  >
                    <Link2 size={14} />
                    Создать ссылку приглашения
                  </button>
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase block mb-1.5">Роль и права доступа</label>
                <select 
                  className={`w-full p-3.5 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}
                  value={newMember.role}
                  onChange={e => setNewMember({...newMember, role: e.target.value as any})}
                >
                  <option value="Менеджер">Менеджер по продажам</option>
                  <option value="Аналитик">Аналитик данных</option>
                  <option value="Администратор">Администратор системы</option>
                </select>
              </div>

              <button
                type={inviteMethod === 'whatsapp' ? 'button' : 'submit'}
                onClick={inviteMethod === 'whatsapp' ? sendWhatsAppInvite : undefined}
                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-500/30 active:scale-95"
              >
                {inviteMethod === 'link' ? 'Создать ссылку-приглашение'
                  : inviteMethod === 'whatsapp' ? 'Отправить в WhatsApp'
                  : 'Отправить приглашение'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamView;
