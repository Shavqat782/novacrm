import React, { useState } from 'react';
import { CheckCircle2, Circle, Plus, X, Calendar, User, Trash2, AlertCircle, Loader, Users } from 'lucide-react';
import { Task, TeamMember } from '../types';

interface TasksListProps {
  isDark: boolean;
  tasks: Task[];
  team: TeamMember[];
  onAdd: (task: Omit<Task, 'id'>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const TasksList: React.FC<TasksListProps> = ({ isDark, tasks, team, onAdd, onDelete }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'Личная' | 'Командная'>('all');
  const [taskType, setTaskType] = useState<'Личная' | 'Командная'>('Личная');

  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    dueDate: '',
    assignedTo: '',
    priority: 'Средний' as 'Низкий' | 'Средний' | 'Высокий'
  });

  const filteredTasks = tasks.filter(t => {
    let statusMatch = true;
    let categoryMatch = true;

    if (statusFilter === 'active') statusMatch = !t.completed;
    if (statusFilter === 'completed') statusMatch = t.completed;
    
    if (categoryFilter === 'Личная') categoryMatch = t.category === 'Личная';
    if (categoryFilter === 'Командная') categoryMatch = t.category === 'Командная';

    return statusMatch && categoryMatch;
  });

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!newTask.title.trim()) {
      setError('Заполните название задачи');
      return;
    }

    if (taskType === 'Командная' && !newTask.assignedTo) {
      setError('Выберите члена команды для командной задачи');
      return;
    }

    setIsSubmitting(true);
    try {
      await onAdd({
        title: newTask.title,
        description: newTask.description,
        dueDate: newTask.dueDate || new Date().toISOString().split('T')[0],
        assignedTo: newTask.assignedTo || undefined,
        createdBy: 'current-user',
        completed: false,
        priority: newTask.priority,
        category: taskType
      });

      setIsModalOpen(false);
      setNewTask({ title: '', description: '', dueDate: '', assignedTo: '', priority: 'Средний' });
      setTaskType('Личная');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (!confirm('Удалить задачу?')) return;
    try {
      await onDelete(id);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const getTaskStats = () => {
    const personal = tasks.filter(t => t.category === 'Личная');
    const team = tasks.filter(t => t.category === 'Командная');
    return {
      personalActive: personal.filter(t => !t.completed).length,
      personalDone: personal.filter(t => t.completed).length,
      teamActive: team.filter(t => !t.completed).length,
      teamDone: team.filter(t => t.completed).length,
    };
  };

  const stats = getTaskStats();

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Задачи</h2>
          <p className={isDark ? 'text-slate-400' : 'text-slate-500'}>
            Мои: {stats.personalActive} активных • {stats.personalDone} выполнено | 
            Команда: {stats.teamActive} активных • {stats.teamDone} выполнено
          </p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/25 active:scale-95"
        >
          <Plus size={20} />
          <span className="font-bold">Добавить задачу</span>
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

      {/* Фильтры */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="flex gap-2">
          {(['all', 'active', 'completed'] as const).map(filter => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                statusFilter === filter
                  ? 'bg-indigo-600 text-white'
                  : isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {filter === 'all' ? 'Все' : filter === 'active' ? 'Активные' : 'Выполненные'}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          {(['all', 'Личная', 'Командная'] as const).map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat === 'all' ? 'all' : cat)}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-1 ${
                categoryFilter === cat
                  ? 'bg-amber-600 text-white'
                  : isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat === 'Командная' && <Users size={14} />}
              {cat === 'all' ? 'Все задачи' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Задачи */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <div className={`p-8 rounded-2xl border text-center ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
            <p className={isDark ? 'text-slate-400' : 'text-slate-500'}>
              {tasks.length === 0 ? 'Нет задач. Создайте первую!' : 'Нет задач по этому фильтру'}
            </p>
          </div>
        ) : (
          filteredTasks.map(task => (
            <div
              key={task.id}
              className={`p-5 rounded-2xl border transition-all group hover:shadow-md ${
                isDark 
                  ? `${task.completed ? 'bg-slate-800 border-slate-700' : 'bg-slate-900 border-slate-800'}` 
                  : `${task.completed ? 'bg-slate-50 border-slate-100' : 'bg-white border-slate-200'}`
              }`}
            >
              <div className="flex items-start gap-4">
                <button
                  className="mt-1 flex-shrink-0 text-slate-400 hover:text-indigo-600 transition-colors"
                >
                  {task.completed ? (
                    <CheckCircle2 size={24} className="text-emerald-600" />
                  ) : (
                    <Circle size={24} />
                  )}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2 mb-1">
                    <h3 className={`font-semibold ${
                      isDark ? 'text-white' : 'text-slate-900'
                    } ${task.completed ? 'line-through opacity-60' : ''}`}>
                      {task.title}
                    </h3>
                    {task.category === 'Командная' && (
                      <span className={`text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1 whitespace-nowrap ${
                        isDark ? 'bg-purple-900/30 text-purple-300' : 'bg-purple-100 text-purple-700'
                      }`}>
                        <Users size={12} /> Команде
                      </span>
                    )}
                    {task.category === 'Личная' && (
                      <span className={`text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap ${
                        isDark ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-700'
                      }`}>
                        Личная
                      </span>
                    )}
                  </div>

                  {task.description && (
                    <p className={`text-sm mb-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      {task.description}
                    </p>
                  )}

                  <div className="flex items-center gap-4 flex-wrap text-xs">
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                      <Calendar size={14} />
                      {task.dueDate}
                    </div>

                    {task.assignedTo && (
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                        <User size={14} />
                        {task.assignedTo}
                      </div>
                    )}

                    <div className={`font-bold px-2 py-1 rounded ${
                      task.priority === 'Высокий' ? 'bg-rose-100 text-rose-600' : 
                      task.priority === 'Средний' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'
                    }`}>
                      {task.priority}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleDeleteTask(task.id)}
                  className="p-2 text-slate-400 hover:text-rose-600 transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300 overflow-y-auto">
          <div className={`max-w-md w-full p-8 rounded-3xl border shadow-2xl animate-in zoom-in-95 duration-300 my-8 ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-100'}`}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold">Новая задача</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-rose-100 dark:bg-rose-900/30 border border-rose-300 dark:border-rose-700 rounded-lg flex items-center gap-2">
                <AlertCircle size={16} className="text-rose-600" />
                <p className="text-xs text-rose-600 dark:text-rose-300">{error}</p>
              </div>
            )}

            <form onSubmit={handleAddTask} className="space-y-4">
              {/* Тип задачи */}
              <div className="flex gap-2">
                {(['Личная', 'Командная'] as const).map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setTaskType(type)}
                    className={`flex-1 py-2 px-3 rounded-lg font-medium text-sm transition-all ${
                      taskType === type
                        ? 'bg-indigo-600 text-white'
                        : isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {type === 'Командная' && <Users size={14} className="inline mr-1" />}
                    {type}
                  </button>
                ))}
              </div>

              <input 
                type="text" 
                placeholder="Название задачи *" 
                required
                value={newTask.title}
                onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm ${
                  isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
                }`}
              />

              <textarea 
                placeholder="Описание (опционально)" 
                rows={3}
                value={newTask.description}
                onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm resize-none ${
                  isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
                }`}
              />

              {taskType === 'Командная' && (
                <select 
                  value={newTask.assignedTo}
                  onChange={(e) => setNewTask({...newTask, assignedTo: e.target.value})}
                  required
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <option value="">Выберите члена команды *</option>
                  {team.map(member => (
                    <option key={member.id} value={member.name}>{member.name} ({member.role})</option>
                  ))}
                </select>
              )}

              <input 
                type="date" 
                value={newTask.dueDate}
                onChange={(e) => setNewTask({...newTask, dueDate: e.target.value})}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm ${
                  isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
                }`}
              />

              <select 
                value={newTask.priority}
                onChange={(e) => setNewTask({...newTask, priority: e.target.value as any})}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm ${
                  isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <option value="Низкий">Низкий приоритет</option>
                <option value="Средний">Средний приоритет</option>
                <option value="Высокий">Высокий приоритет</option>
              </select>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting && <Loader size={18} className="animate-spin" />}
                {isSubmitting ? 'Создание...' : 'Создать задачу'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TasksList;
