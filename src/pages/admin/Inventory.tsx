import { useState } from 'react';
import { useStore, type Product } from '../../store/useStore';
import { Plus, Edit2, Trash2, Search, X } from 'lucide-react';

export default function Inventory() {
  const { products, categories, storeSettings, addProduct, deleteProduct, updateProduct } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    barcode: '',
    purchase_price: 0,
    sale_price: 0,
    stock_quantity: 0,
    category_id: categories[0]?.id || ''
  });

  const filteredProducts = products.filter(p => p.name.includes(searchQuery) || p.barcode.includes(searchQuery));

  const handleDelete = (id: string, name: string) => {
    if (confirm(`هل أنت متأكد من حذف المنتج: ${name}؟`)) {
      deleteProduct(id);
    }
  };

  const handleEditStock = (product: Product) => {
    const newStock = prompt(`تعديل المخزون للمنتج (${product.name}):`, product.stock_quantity.toString());
    if (newStock !== null) {
      const parsed = parseInt(newStock, 10);
      if (!isNaN(parsed) && parsed >= 0) {
        updateProduct(product.id, { stock_quantity: parsed });
      }
    }
  };

  const handleEditPrice = (product: Product) => {
    const newPrice = prompt(`تعديل سعر البيع للمنتج (${product.name}):`, product.sale_price.toString());
    if (newPrice !== null) {
      const parsed = parseFloat(newPrice);
      if (!isNaN(parsed) && parsed >= 0) {
        updateProduct(product.id, { sale_price: parsed });
      }
    }
  };

  const submitProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.barcode) {
      alert("الرجاء ملء جميع الحقول المطلوبة (الاسم والباركود).");
      return;
    }
    
    addProduct({ ...formData });
    
    setShowAddModal(false);
    setFormData({
      name: '',
      barcode: '',
      purchase_price: 0,
      sale_price: 0,
      stock_quantity: 0,
      category_id: categories[0]?.id || ''
    });
  };

  return (
    <div className="p-8 relative">
      
      {/* ADD PRODUCT MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden border border-slate-200">
            <div className="p-6 border-b flex justify-between items-center bg-slate-50">
              <h2 className="text-xl font-bold text-slate-800">إضافة منتج جديد</h2>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 bg-white p-2 rounded-xl shadow-sm border border-slate-200">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={submitProduct} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-bold text-slate-700 mb-1">اسم المنتج</label>
                  <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-slate-50 border border-slate-200 py-3 px-4 rounded-xl focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-bold text-slate-700 mb-1">الباركود</label>
                  <input type="text" required dir="ltr" value={formData.barcode} onChange={e => setFormData({...formData, barcode: e.target.value})} className="w-full bg-slate-50 border border-slate-200 py-3 px-4 rounded-xl focus:ring-2 focus:ring-indigo-500 text-left" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">سعر الشراء</label>
                  <input type="number" min="0" step="0.01" required value={formData.purchase_price} onChange={e => setFormData({...formData, purchase_price: parseFloat(e.target.value) || 0})} className="w-full bg-slate-50 border border-slate-200 py-3 px-4 rounded-xl focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">سعر البيع</label>
                  <input type="number" min="0" step="0.01" required value={formData.sale_price} onChange={e => setFormData({...formData, sale_price: parseFloat(e.target.value) || 0})} className="w-full bg-slate-50 border border-slate-200 py-3 px-4 rounded-xl focus:ring-2 focus:ring-indigo-500 border-l-4 border-l-green-500" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">الكمية الافتتاحية للمخزون</label>
                  <input type="number" min="0" required value={formData.stock_quantity} onChange={e => setFormData({...formData, stock_quantity: parseInt(e.target.value) || 0})} className="w-full bg-slate-50 border border-slate-200 py-3 px-4 rounded-xl focus:ring-2 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">التصنيف</label>
                  <select value={formData.category_id} onChange={e => setFormData({...formData, category_id: e.target.value})} className="w-full bg-slate-50 border border-slate-200 py-3 px-4 rounded-xl focus:ring-2 focus:ring-indigo-500">
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="pt-4 mt-2 border-t">
                <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold transition shadow-lg shrink-0 flex items-center justify-center gap-2">
                  <Plus size={20} />
                  حفظ المنتج في قاعدة البيانات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DASHBOARD CONTENT */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-800">المخزون والمنتجات</h1>
          <p className="text-slate-500 mt-2">إدارة قاعدة بيانات المنتجات وتحديث الكميات</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold transition flex items-center gap-2 shadow-lg shadow-indigo-200">
          <Plus size={20} />
          إضافة منتج 
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden flex flex-col min-h-[500px]">
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="relative w-1/3 min-w-[300px]">
            <Search className="absolute right-4 top-3 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="ابحث باسم المنتج أو الباركود..."
              className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pr-12 pl-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="text-sm text-slate-500 font-bold bg-white px-4 py-2 border border-slate-200 rounded-xl">
            إجمالي المنتجات: {products.length}
          </div>
        </div>

        <div className="flex-1 overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-white border-b border-slate-100 text-slate-400 font-medium">
              <tr>
                <th className="p-4">الباركود</th>
                <th className="p-4">اسم المنتج</th>
                <th className="p-4">التصنيف</th>
                <th className="p-4 text-center">سعر الشراء</th>
                <th className="p-4 text-center border-x border-slate-100 bg-slate-50">سعر البيع</th>
                <th className="p-4 text-center border-l border-slate-100 bg-slate-50">المخزون المتوفر</th>
                <th className="p-4 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredProducts.map((product) => {
                const category = categories.find(c => c.id === product.category_id)?.name;
                const isLowStock = product.stock_quantity < 5;
                
                return (
                  <tr key={product.id} className="hover:bg-slate-50 transition">
                    <td className="p-4 font-mono text-slate-400">{product.barcode}</td>
                    <td className="p-4 font-bold">{product.name}</td>
                    <td className="p-4 text-slate-500">{category}</td>
                    <td className="p-4 text-center">{product.purchase_price} {storeSettings.currency}</td>
                    
                    <td className="p-4 text-center border-x border-slate-100 bg-slate-50/50">
                      <button onClick={() => handleEditPrice(product)} className="flex items-center justify-center gap-2 w-full hover:text-indigo-600 transition group font-black">
                        {product.sale_price} {storeSettings.currency}
                        <Edit2 size={14} className="opacity-0 group-hover:opacity-100" />
                      </button>
                    </td>

                    <td className="p-4 text-center border-l border-slate-100 bg-slate-50/50">
                      <button 
                        onClick={() => handleEditStock(product)} 
                        className={`flex items-center justify-center gap-2 w-full font-bold px-3 py-1.5 rounded-lg transition group ${isLowStock ? 'bg-red-50 text-red-600' : 'hover:bg-indigo-50 hover:text-indigo-600'}`}
                      >
                        {product.stock_quantity}
                        <Edit2 size={14} className="opacity-0 group-hover:opacity-100" />
                      </button>
                    </td>

                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => handleDelete(product.id, product.name)} className="p-2 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
