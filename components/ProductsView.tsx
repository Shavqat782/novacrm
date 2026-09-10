
import React, { useState, useRef } from 'react';
import { ShoppingBag, Plus, X, DollarSign, Package, User, TrendingUp, Search, Trash2, ShoppingCart, Image as ImageIcon, Upload } from 'lucide-react';
import { Product, Sale, TeamMember } from '../types';
import { useAppStore } from '../store';

interface ProductsViewProps {
  isDark: boolean;
  products: Product[];
  sales: Sale[];
  team: TeamMember[];
}

const ProductsView: React.FC<ProductsViewProps> = ({ isDark, products, sales, team }) => {
  const { addProduct, deleteProduct: storeDeleteProduct, addSale, setProducts } = useAppStore();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [newProduct, setNewProduct] = useState({
    name: '',
    price: 0,
    stock: 0,
    category: '',
    image: ''
  });

  const [newSale, setNewSale] = useState({
    sellerId: '',
    quantity: 1
  });

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const product: Product = {
      ...newProduct,
      id: `p${Date.now()}`,
      image: newProduct.image || `https://picsum.photos/seed/${newProduct.name}/400/300`
    };
    addProduct(product);
    setIsAddModalOpen(false);
    setNewProduct({ name: '', price: 0, stock: 0, category: '', image: '' });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewProduct(prev => ({ ...prev, image: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSellProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    const sale: Sale = {
      id: `s${Date.now()}`,
      productId: selectedProduct.id,
      sellerId: newSale.sellerId,
      quantity: newSale.quantity,
      totalAmount: selectedProduct.price * newSale.quantity,
      date: new Date().toISOString()
    };

    addSale(sale);
    setProducts(products.map(p => 
      p.id === selectedProduct.id ? { ...p, stock: p.stock - newSale.quantity } : p
    ));
    setIsSaleModalOpen(false);
    setNewSale({ sellerId: '', quantity: 1 });
  };

  const deleteProduct = (id: string) => {
    if (confirm('Удалить этот товар?')) {
      storeDeleteProduct(id);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalRevenue = sales.reduce((acc, sale) => acc + sale.totalAmount, 0);
  const totalItemsSold = sales.reduce((acc, sale) => acc + sale.quantity, 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Каталог товаров</h2>
          <p className={isDark ? 'text-slate-400' : 'text-slate-500'}>Управление ассортиментом и учет продаж</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/25 active:scale-95"
        >
          <Plus size={20} />
          <span className="font-bold">Добавить товар</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className={`p-6 rounded-3xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'}`}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <DollarSign size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Общая выручка</p>
              <p className={`text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{totalRevenue.toLocaleString()} ₽</p>
            </div>
          </div>
        </div>
        <div className={`p-6 rounded-3xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'}`}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
              <ShoppingCart size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Продано товаров</p>
              <p className={`text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{totalItemsSold} шт.</p>
            </div>
          </div>
        </div>
        <div className={`p-6 rounded-3xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'}`}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500">
              <Package size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Товаров в наличии</p>
              <p className={`text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{products.reduce((acc, p) => acc + p.stock, 0)} шт.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className={`p-4 rounded-2xl border flex items-center gap-4 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Поиск товаров по названию или категории..." 
            className={`w-full pl-12 pr-4 py-3 rounded-xl border focus:ring-2 focus:ring-indigo-500 outline-none transition-all ${
              isDark ? 'bg-slate-800 border-slate-700 text-white placeholder:text-slate-500' : 'bg-slate-50 border-slate-200 placeholder:text-slate-400'
            }`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredProducts.map(product => {
          const productSales = sales.filter(s => s.productId === product.id);
          const productRevenue = productSales.reduce((acc, s) => acc + s.totalAmount, 0);
          
          return (
            <div key={product.id} className={`group relative rounded-3xl border overflow-hidden transition-all hover:shadow-xl ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
              <div className="aspect-[4/3] relative overflow-hidden">
                <img src={product.image} alt={product.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                <div className="absolute top-4 right-4 flex gap-2">
                  <button 
                    onClick={() => deleteProduct(product.id)}
                    className="p-2 bg-white/90 dark:bg-slate-900/90 text-rose-500 rounded-xl shadow-lg hover:bg-rose-500 hover:text-white transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="absolute bottom-4 left-4">
                  <span className="px-3 py-1 bg-indigo-600 text-white text-[10px] font-bold uppercase rounded-lg shadow-lg">
                    {product.category || 'Без категории'}
                  </span>
                </div>
              </div>
              
              <div className="p-5">
                <div className="flex justify-between items-start mb-2">
                  <h3 className={`font-bold text-lg truncate pr-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>{product.name}</h3>
                  <p className="text-indigo-600 font-black whitespace-nowrap">{product.price.toLocaleString()} ₽</p>
                </div>
                
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Package size={14} />
                    <span>Остаток: <span className={`font-bold ${product.stock < 5 ? 'text-rose-500' : 'text-slate-700 dark:text-slate-300'}`}>{product.stock} шт.</span></span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-emerald-500 font-bold">
                    <TrendingUp size={14} />
                    <span>{productRevenue.toLocaleString()} ₽</span>
                  </div>
                </div>

                <button 
                  onClick={() => {
                    setSelectedProduct(product);
                    setIsSaleModalOpen(true);
                  }}
                  disabled={product.stock <= 0}
                  className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                    product.stock <= 0 
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                    : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-500/20 active:scale-95'
                  }`}
                >
                  <ShoppingCart size={18} />
                  Продать
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Product Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in">
          <div className={`max-w-md w-full p-8 rounded-3xl border shadow-2xl animate-in zoom-in-95 ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-100'}`}>
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-bold">Новый товар</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleAddProduct} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Название товара</label>
                <input 
                  required
                  placeholder="Напр: MacBook Pro 14" 
                  className={`w-full p-3.5 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}
                  value={newProduct.name}
                  onChange={e => setNewProduct({...newProduct, name: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase ml-1">Цена (₽)</label>
                  <input 
                    required
                    type="number"
                    placeholder="0" 
                    className={`w-full p-3.5 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}
                    value={newProduct.price}
                    onChange={e => setNewProduct({...newProduct, price: Number(e.target.value)})}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase ml-1">Количество</label>
                  <input 
                    required
                    type="number"
                    placeholder="0" 
                    className={`w-full p-3.5 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}
                    value={newProduct.stock}
                    onChange={e => setNewProduct({...newProduct, stock: Number(e.target.value)})}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Категория</label>
                <input 
                  placeholder="Напр: Электроника" 
                  className={`w-full p-3.5 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}
                  value={newProduct.category}
                  onChange={e => setNewProduct({...newProduct, category: e.target.value})}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Фото товара</label>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative aspect-video rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden ${
                    isDark ? 'border-slate-700 hover:border-indigo-500 bg-slate-800/50' : 'border-slate-200 hover:border-indigo-500 bg-slate-50'
                  }`}
                >
                  {newProduct.image ? (
                    <>
                      <img src={newProduct.image} alt="Preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <Upload className="text-white" size={32} />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-12 h-12 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-500 mb-2">
                        <Plus size={24} />
                      </div>
                      <p className="text-xs font-bold text-slate-500">Нажмите, чтобы добавить фото</p>
                    </>
                  )}
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/*"
                    className="hidden"
                  />
                </div>
              </div>
              <button className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-500/30 active:scale-95">
                Добавить в каталог
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Sell Product Modal */}
      {isSaleModalOpen && selectedProduct && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in">
          <div className={`max-w-md w-full p-8 rounded-3xl border shadow-2xl animate-in zoom-in-95 ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-100'}`}>
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-2xl font-bold">Оформить продажу</h3>
                <p className="text-sm text-slate-500">{selectedProduct.name}</p>
              </div>
              <button onClick={() => setIsSaleModalOpen(false)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSellProduct} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Кто продал?</label>
                <select 
                  required
                  className={`w-full p-3.5 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}
                  value={newSale.sellerId}
                  onChange={e => setNewSale({...newSale, sellerId: e.target.value})}
                >
                  <option value="">Выберите сотрудника</option>
                  {team.map(member => (
                    <option key={member.id} value={member.id}>{member.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Количество (макс: {selectedProduct.stock})</label>
                <input 
                  required
                  type="number"
                  min="1"
                  max={selectedProduct.stock}
                  className={`w-full p-3.5 rounded-xl border text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}
                  value={newSale.quantity}
                  onChange={e => setNewSale({...newSale, quantity: Number(e.target.value)})}
                />
              </div>
              <div className={`p-4 rounded-2xl ${isDark ? 'bg-indigo-900/20' : 'bg-indigo-50'}`}>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-indigo-500">Итого к оплате:</span>
                  <span className="text-xl font-black text-indigo-600">{(selectedProduct.price * newSale.quantity).toLocaleString()} ₽</span>
                </div>
              </div>
              <button className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-500/30 active:scale-95">
                Подтвердить продажу
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductsView;
