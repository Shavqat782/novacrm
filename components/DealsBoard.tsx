import React, { useState } from 'react';
import { DealStage, Deal, Contact, DealComment, LeadSource, Product } from '../types';
import { useAppStore } from '../store';
import { MoreHorizontal, Plus, Calendar, DollarSign, X, AlertCircle, Loader, MessageSquare, Trash2, Phone, Mail, Tag, GripVertical, Package } from 'lucide-react';

const STAGES = [
  DealStage.NEW_LEAD,
  DealStage.CONTACTED,
  DealStage.NEEDS_ANALYSIS,
  DealStage.PROPOSAL,
  DealStage.NEGOTIATION,
  DealStage.CLOSED_WON,
  DealStage.CLOSED_LOST
];

interface DealsBoardProps {
  isDark: boolean;
  deals: Deal[];
  contacts: Contact[];
  products?: Product[];
  onAdd: (deal: Omit<Deal, 'id'>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onMove?: (dealId: string, newStage: DealStage) => void | Promise<void>;
}

const DealsBoard: React.FC<DealsBoardProps> = ({ isDark, deals, contacts, products = [], onAdd, onDelete, onMove }) => {
  const { moveDealToStage, dealComments, addDealComment, deleteDealComment } = useAppStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newDeal, setNewDeal] = useState({
    title: '',
    amount: '',
    contactName: '',
    contactPhone: '',
    contactEmail: '',
    source: LeadSource.WEBSITE,
    contactId: '',
    stage: DealStage.NEW_LEAD,
    expectedCloseDate: '',
    priority: 'Средний' as 'Низкий' | 'Средний' | 'Высокий',
    productId: '',
    quantity: '1'
  });

  const [commentText, setCommentText] = useState<{[key: string]: string}>({});

  // Drag & Drop состояние
  const [draggedDeal, setDraggedDeal] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);

  const getStageColor = (stage: DealStage) => {
    switch (stage) {
      case DealStage.NEW_LEAD: return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400';
      case DealStage.CONTACTED: return 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400';
      case DealStage.NEEDS_ANALYSIS: return 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400';
      case DealStage.PROPOSAL: return 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400';
      case DealStage.NEGOTIATION: return 'bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400';
      case DealStage.CLOSED_WON: return 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400';
      case DealStage.CLOSED_LOST: return 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  // === Drag & Drop handlers ===
  const handleDragStart = (e: React.DragEvent, dealId: string) => {
    setDraggedDeal(dealId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', dealId);
    // Добавляем прозрачность к перетаскиваемому элементу
    const target = e.target as HTMLElement;
    setTimeout(() => target.style.opacity = '0.4', 0);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    setDraggedDeal(null);
    setDragOverStage(null);
    const target = e.target as HTMLElement;
    target.style.opacity = '1';
  };

  const handleDragOver = (e: React.DragEvent, stage: DealStage) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverStage(stage);
  };

  const handleDragLeave = () => {
    setDragOverStage(null);
  };

  const handleDrop = (e: React.DragEvent, targetStage: DealStage) => {
    e.preventDefault();
    const dealId = e.dataTransfer.getData('text/plain');
    
    if (dealId) {
      const deal = deals.find(d => d.id === dealId);
      if (deal && deal.stage !== targetStage) {
        // Списание товара и обновление через onMove (если передан), иначе локально
        if (onMove) {
          void onMove(dealId, targetStage);
        } else {
          moveDealToStage(dealId, targetStage);
        }
      }
    }
    
    setDraggedDeal(null);
    setDragOverStage(null);
  };

  const handleAddDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!newDeal.title.trim() || (!newDeal.contactId && !newDeal.contactName.trim())) {
      setError('Заполните обязательные поля: Название и Клиент');
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedProduct = products.find(p => p.id === newDeal.productId);
      const quantity = Math.max(1, parseInt(newDeal.quantity) || 1);
      const items = selectedProduct ? [{
        id: `item-${Date.now()}`,
        dealId: '',
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        quantity,
        price: selectedProduct.price,
        totalPrice: selectedProduct.price * quantity,
      }] : [];

      await onAdd({
        title: newDeal.title,
        amount: selectedProduct ? selectedProduct.price * quantity : (Number(newDeal.amount) || 0),
        contactId: newDeal.contactId || '',
        contactName: newDeal.contactName,
        contactPhone: newDeal.contactPhone,
        contactEmail: newDeal.contactEmail,
        source: newDeal.source,
        stage: newDeal.stage,
        expectedCloseDate: newDeal.expectedCloseDate || new Date().toISOString().split('T')[0],
        priority: newDeal.priority,
        items,
        comments: []
      });

      setIsModalOpen(false);
      setNewDeal({
        title: '',
        amount: '',
        contactName: '',
        contactPhone: '',
        contactEmail: '',
        source: LeadSource.WEBSITE,
        contactId: '',
        stage: DealStage.NEW_LEAD,
        expectedCloseDate: '',
        priority: 'Средний',
        productId: '',
        quantity: '1'
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddComment = (dealId: string) => {
    if (!commentText[dealId]?.trim()) return;
    
    const newComment: DealComment = {
      id: Date.now().toString(),
      dealId,
      userId: 'current-user',
      userName: 'Вы',
      text: commentText[dealId],
      createdAt: new Date().toISOString()
    };
    
    addDealComment(dealId, newComment);
    
    setCommentText(prev => ({
      ...prev,
      [dealId]: ''
    }));
  };

  const handleDeleteComment = (dealId: string, commentId: string) => {
    deleteDealComment(dealId, commentId);
  };

  const openModalWithStage = (stage: DealStage) => {
    setNewDeal(prev => ({ ...prev, stage }));
    setIsModalOpen(true);
    setError(null);
  };

  const handleDeleteDeal = async (id: string) => {
    if (!confirm('Удалить сделку?')) return;
    try {
      await onDelete(id);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="h-full overflow-x-auto custom-scrollbar flex gap-6 pb-6 animate-in fade-in duration-500">
      {STAGES.map((stage) => (
        <div key={stage} className="flex-shrink-0 w-96 flex flex-col">
          <div className="flex items-center justify-between mb-4 px-2">
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md ${getStageColor(stage)}`}>
                {stage}
              </span>
              <span className={`text-xs font-medium ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                ({deals.filter(d => d.stage === stage).length})
              </span>
            </div>
            <button 
              onClick={() => openModalWithStage(stage)}
              className={`p-1 rounded hover:${isDark ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-900'} transition-colors text-slate-400`}
            >
              <Plus size={16} />
            </button>
          </div>

          <div 
            className={`flex-1 rounded-2xl p-2 space-y-3 kanban-column min-h-[400px] border-2 border-dashed overflow-y-auto transition-all duration-200 ${
              dragOverStage === stage 
                ? 'border-indigo-500 bg-indigo-50/30 dark:bg-indigo-900/10' 
                : isDark ? 'bg-slate-900/30 border-slate-800' : 'bg-slate-100/30 border-slate-200'
            }`}
            onDragOver={(e) => handleDragOver(e, stage)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, stage)}
          >
            {deals.filter(d => d.stage === stage).map((deal) => (
              <div 
                key={deal.id}
                draggable
                onDragStart={(e) => handleDragStart(e, deal.id)}
                onDragEnd={handleDragEnd}
                className={`p-4 rounded-xl border shadow-sm transition-all hover:shadow-md cursor-grab active:cursor-grabbing ${
                  draggedDeal === deal.id ? 'opacity-40 scale-95' : ''
                } ${
                  isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200'
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2 flex-1">
                    <GripVertical size={14} className="text-slate-400 flex-shrink-0" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm line-clamp-2 hover:text-indigo-500 transition-colors">{deal.title}</h4>
                      {deal.contactName && (
                        <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium mt-1">{deal.contactName}</p>
                      )}
                    </div>
                  </div>
                  <button 
                    onClick={() => handleDeleteDeal(deal.id)}
                    className="text-slate-400 hover:text-rose-600 flex-shrink-0 p-1"
                  >
                    <X size={14} />
                  </button>
                </div>

                <div className="flex flex-col gap-2 mb-4 text-xs">
                  {deal.contactPhone && (
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <Phone size={12} className="text-blue-500" />
                      <span className="text-slate-700 dark:text-slate-300">{deal.contactPhone}</span>
                    </div>
                  )}
                  {deal.contactEmail && (
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <Mail size={12} className="text-sky-500" />
                      <span className="text-slate-700 dark:text-slate-300 truncate">{deal.contactEmail}</span>
                    </div>
                  )}
                  {deal.source && (
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <Tag size={12} className="text-purple-500" />
                      <span className="text-slate-700 dark:text-slate-300">{deal.source}</span>
                    </div>
                  )}
                  {deal.items && deal.items.length > 0 && deal.items.map(item => (
                    <div key={item.id} className="flex items-center gap-1.5">
                      <Package size={12} className="text-emerald-500 flex-shrink-0" />
                      <span className={`text-[11px] px-1.5 py-0.5 rounded font-medium ${
                        isDark ? 'bg-emerald-900/30 text-emerald-300' : 'bg-emerald-50 text-emerald-700'
                      }`}>
                        {item.productName} × {item.quantity}
                      </span>
                    </div>
                  ))}
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <DollarSign size={12} className="text-emerald-500" />
                    <span className="font-bold text-slate-700 dark:text-slate-300">₽{deal.amount.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <Calendar size={12} />
                    <span>{deal.expectedCloseDate}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <div className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    deal.priority === 'Высокий' ? 'bg-rose-100 text-rose-600' : 
                    deal.priority === 'Средний' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'
                  }`}>
                    {deal.priority}
                  </div>
                  {(dealComments[deal.id] || []).length > 0 && (
                    <div className="flex items-center gap-1 text-xs text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                      <MessageSquare size={10} />
                      <span>{(dealComments[deal.id] || []).length}</span>
                    </div>
                  )}
                </div>

                <button 
                  onClick={() => setIsDetailsOpen(isDetailsOpen === deal.id ? null : deal.id)}
                  className="w-full text-xs py-2 rounded-lg bg-indigo-600/10 text-indigo-600 hover:bg-indigo-600/20 transition-colors font-medium"
                >
                  {isDetailsOpen === deal.id ? 'Скрыть детали' : 'Показать детали'}
                </button>

                {isDetailsOpen === deal.id && (
                  <div className={`mt-4 p-3 rounded-lg border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                    <div className="space-y-3">
                      {/* Comments */}
                      <div>
                        <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">Комментарии</p>
                        <div className="space-y-2 max-h-40 overflow-y-auto mb-2">
                          {(dealComments[deal.id] || []).map(comment => (
                            <div key={comment.id} className={`p-2 rounded text-xs ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                              <div className="flex justify-between items-start mb-1">
                                <span className="font-medium text-slate-600 dark:text-slate-400">{comment.userName}</span>
                                <button 
                                  onClick={() => handleDeleteComment(deal.id, comment.id)}
                                  className="text-slate-400 hover:text-rose-600 p-0.5"
                                >
                                  <X size={12} />
                                </button>
                              </div>
                              <p className="text-slate-700 dark:text-slate-300">{comment.text}</p>
                            </div>
                          ))}
                        </div>
                        <div className="flex gap-1">
                          <input 
                            type="text"
                            placeholder="Добавить комментарий..."
                            value={commentText[deal.id] || ''}
                            onChange={(e) => setCommentText({...commentText, [deal.id]: e.target.value})}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddComment(deal.id)}
                            className={`flex-1 text-xs px-2 py-1 rounded border focus:ring-1 focus:ring-indigo-500 outline-none ${
                              isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
                            }`}
                          />
                          <button 
                            onClick={() => handleAddComment(deal.id)}
                            className="text-xs bg-indigo-600 text-white px-2 py-1 rounded hover:bg-indigo-700 transition-colors"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
            
            <button 
              onClick={() => openModalWithStage(stage)}
              className="w-full py-3 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-center text-slate-400 text-xs hover:border-indigo-500 hover:text-indigo-500 transition-all group"
            >
              <Plus size={14} className="mr-1 group-hover:scale-110 transition-transform" /> Добавить
            </button>
          </div>
        </div>
      ))}

      {/* Modal Add Deal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300 overflow-y-auto">
          <div className={`max-w-lg w-full p-8 rounded-3xl border shadow-2xl animate-in zoom-in-95 duration-300 my-8 ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-100'}`}>
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-bold">Создать сделку</h3>
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

            <form onSubmit={handleAddDeal} className="space-y-4 max-h-[70vh] overflow-y-auto">
              <input 
                type="text" 
                placeholder="Название сделки *" 
                required
                value={newDeal.title}
                onChange={(e) => setNewDeal({...newDeal, title: e.target.value})}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm ${
                  isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
                }`}
              />

              <div className={`p-3 rounded-lg border ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">Информация о клиенте:</p>
                <input 
                  type="text" 
                  placeholder="Имя клиента *" 
                  value={newDeal.contactName}
                  onChange={(e) => setNewDeal({...newDeal, contactName: e.target.value})}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm mb-2 ${
                    isDark ? 'bg-slate-700 border-slate-600' : 'bg-white border-slate-300'
                  }`}
                />
                <input 
                  type="tel" 
                  placeholder="Номер телефона" 
                  value={newDeal.contactPhone}
                  onChange={(e) => setNewDeal({...newDeal, contactPhone: e.target.value})}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm mb-2 ${
                    isDark ? 'bg-slate-700 border-slate-600' : 'bg-white border-slate-300'
                  }`}
                />
                <input 
                  type="email" 
                  placeholder="Email" 
                  value={newDeal.contactEmail}
                  onChange={(e) => setNewDeal({...newDeal, contactEmail: e.target.value})}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm mb-2 ${
                    isDark ? 'bg-slate-700 border-slate-600' : 'bg-white border-slate-300'
                  }`}
                />
                <select 
                  value={newDeal.source}
                  onChange={(e) => setNewDeal({...newDeal, source: e.target.value as LeadSource})}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm ${
                    isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-300'
                  }`}
                >
                  {Object.values(LeadSource).map(source => (
                    <option key={source} value={source}>{source}</option>
                  ))}
                </select>
              </div>

              {/* Выбор товара из каталога */}
              {products.length > 0 && (
                <div className={`p-3 rounded-lg border ${isDark ? 'bg-indigo-900/20 border-indigo-800' : 'bg-indigo-50/50 border-indigo-200'}`}>
                  <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-2 flex items-center gap-1.5">
                    <Package size={14} /> Товар из каталога (необязательно):
                  </p>
                  <select
                    value={newDeal.productId}
                    onChange={(e) => setNewDeal({...newDeal, productId: e.target.value})}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm mb-2 ${
                      isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-300'
                    }`}
                  >
                    <option value="">— Без товара (указать сумму вручную) —</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id} disabled={p.stock <= 0}>
                        {p.name} — ₽{p.price.toLocaleString('ru-RU')} (осталось: {p.stock})
                      </option>
                    ))}
                  </select>
                  {newDeal.productId && (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        placeholder="Кол-во"
                        value={newDeal.quantity}
                        onChange={(e) => setNewDeal({...newDeal, quantity: e.target.value})}
                        className={`w-24 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm ${
                          isDark ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-300'
                        }`}
                      />
                      <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                        Итого: ₽{(() => {
                          const p = products.find(pr => pr.id === newDeal.productId);
                          const q = Math.max(1, parseInt(newDeal.quantity) || 1);
                          return p ? (p.price * q).toLocaleString('ru-RU') : '0';
                        })()}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {products.length === 0 && (
                <input
                  type="number"
                  placeholder="Сумма (₽)"
                  value={newDeal.amount}
                  onChange={(e) => setNewDeal({...newDeal, amount: e.target.value})}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm ${
                    isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
                  }`}
                />
              )}

              <input 
                type="date" 
                value={newDeal.expectedCloseDate}
                onChange={(e) => setNewDeal({...newDeal, expectedCloseDate: e.target.value})}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm ${
                  isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
                }`}
              />

              <select 
                value={newDeal.priority}
                onChange={(e) => setNewDeal({...newDeal, priority: e.target.value as any})}
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
                {isSubmitting ? 'Создание...' : 'Создать сделку'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DealsBoard;
