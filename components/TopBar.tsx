import React from 'react';
import { Bell, Search, Moon, Sun, Globe, Menu, LogOut } from 'lucide-react';
import { signOut } from '../lib/supabase';
import { User as AuthUser } from '@supabase/supabase-js';

interface TopBarProps {
  isDark: boolean;
  setIsDark: (val: boolean) => void;
  toggleSidebar: () => void;
  user?: AuthUser;
}

const TopBar: React.FC<TopBarProps> = ({ isDark, setIsDark, toggleSidebar, user }) => {
  const handleLogout = async () => {
    try {
      localStorage.removeItem('novacrm_demo_user');
      await signOut();
    } catch (err) {
      console.error('Logout failed:', err);
    } finally {
      window.location.reload();
    }
  };

  return (
    <header className={`h-16 flex items-center justify-between px-6 border-b transition-colors duration-200 ${
      isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
    }`}>
      <div className="flex items-center gap-4">
        <button 
          onClick={toggleSidebar}
          className={`p-2 rounded-lg hover:${isDark ? 'bg-slate-800' : 'bg-slate-100'} transition-colors flex items-center gap-2`}
          title="Открыть меню"
        >
          <Menu size={24} className={isDark ? 'text-slate-400' : 'text-slate-600'} />
        </button>
        
        <div className="flex-1 max-w-md relative hidden lg:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Глобальный поиск контактов, сделок..." 
            className={`w-full pl-10 pr-4 py-2 rounded-lg border text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all ${
              isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
            }`}
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-1 border-r border-slate-200 dark:border-slate-800 pr-4 h-8">
           <Globe size={16} className="text-slate-400" />
           <span className="text-xs font-semibold uppercase text-slate-500">RU</span>
        </div>

        <button 
          onClick={() => setIsDark(!isDark)}
          className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-600'}`}
        >
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        <button className={`p-2 rounded-lg relative transition-colors ${isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-600'}`}>
          <Bell size={20} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-rose-600 rounded-full"></span>
        </button>

        {/* User Info */}
        {user && (
          <div className="flex items-center gap-3 border-l border-slate-200 dark:border-slate-800 pl-4">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-semibold text-slate-900 dark:text-white">
                {user.email?.split('@')[0] || 'User'}
              </p>
              <p className="text-xs text-slate-500">Администратор</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-sm font-bold">
              {user.email?.[0].toUpperCase() || 'U'}
            </div>
            <button
              onClick={handleLogout}
              className={`p-2 rounded-lg transition-colors ml-2 ${isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-rose-500' : 'hover:bg-slate-100 text-slate-600 hover:text-rose-600'}`}
              title="Выход"
            >
              <LogOut size={18} />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default TopBar;
