
import React from 'react';
import { NAVIGATION } from '../constants';
import { LogOut, Rocket, X } from 'lucide-react';

interface SidebarProps {
  activeView: string;
  setActiveView: (view: string) => void;
  isDark: boolean;
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView, isDark, isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <>
      {/* Overlay backdrop */}
      <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] transition-opacity"
        onClick={onClose}
      />
      
      <aside className={`fixed left-0 top-0 bottom-0 w-72 flex flex-col z-[70] shadow-2xl transition-all duration-300 animate-in slide-in-from-left border-r ${
        isDark ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-600'
      }`}>
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
              <Rocket size={24} />
            </div>
            <span className={`text-xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>NovaCRM</span>
          </div>
          <button 
            onClick={onClose}
            className={`p-2 rounded-lg hover:${isDark ? 'bg-slate-800' : 'bg-slate-100'} transition-colors`}
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto custom-scrollbar">
          {NAVIGATION.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveView(item.id);
                onClose();
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                activeView === item.id
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                  : `hover:${isDark ? 'bg-slate-800 text-white' : 'bg-slate-50 text-slate-900'}`
              }`}
            >
              {item.icon}
              {item.name}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800">
          <button className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors">
            <LogOut size={20} />
            Выйти из системы
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
