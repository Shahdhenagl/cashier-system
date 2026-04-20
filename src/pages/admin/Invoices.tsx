import { useState, useMemo } from 'react';
import { useStore } from '../../store/useStore';
import { ArrowRightLeft, Search, User } from 'lucide-react';

export default function Invoices() {
  const { orders, storeSettings } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [showReturnsOnly, setShowReturnsOnly] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');

  // Extract unique years from orders
  const years = useMemo(() => {
    const y = new Set<string>();
    orders.forEach(o => y.add(new Date(o.date).getFullYear().toString()));
    return Array.from(y).sort((a, b) => parseInt(b) - parseInt(a));
  }, [orders]);

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const orderDate = new Date(o.date);
      const matchesMonth = selectedMonth === 'all' || (orderDate.getMonth() + 1).toString() === selectedMonth;
      const matchesYear = selectedYear === 'all' || orderDate.getFullYear().toString() === selectedYear;
      const matchesReturns = showReturnsOnly ? o.items.some(i => i.returned_quantity > 0) : true;
      
      const searchStr = searchQuery.toLowerCase();
      const matchesSearch = 
        o.id.toLowerCase().includes(searchStr) || 
        (o.customer?.name || '').toLowerCase().includes(searchStr) ||
        (o.customer?.phone || '').includes(searchStr);

      return matchesMonth && matchesYear && matchesReturns && matchesSearch;
    });
  }, [orders, searchQuery, showReturnsOnly, selectedMonth, selectedYear]);

  return (
    <div className="p-8">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-800">الفواتير والمرتجعات</h1>
          <p className="text-slate-500 mt-2">مراجعة الفواتير وعمليات الاسترجاع مع الفلاتر المتقدمة</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden flex flex-col min-h-[500px]">
        {/* Advanced Filters */}
        <div className="p-5 border-b border-slate-100 bg-slate-50 grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
          <div className="relative md:col-span-2">
            <Search className="absolute right-4 top-3 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="ابحث برقم الفاتورة، اسم العميل، أو رقم الهاتف..."
              className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pr-12 pl-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm transition"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex gap-4 md:col-span-2 justify-end items-center">
            <select 
              value={selectedMonth} 
              onChange={e => setSelectedMonth(e.target.value)} 
              className="bg-white border border-slate-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="all">كل الشهور</option>
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i+1} value={(i+1).toString()}>{`شهر ${i+1}`}</option>
              ))}
            </select>

            <select 
              value={selectedYear} 
              onChange={e => setSelectedYear(e.target.value)} 
              className="bg-white border border-slate-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="all">كل السنوات</option>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>

        <div className="p-4 border-b border-slate-100 bg-white flex justify-between items-center">
           <label className="flex items-center gap-2 cursor-pointer text-sm font-bold text-slate-700 bg-slate-50 px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-100 transition">
              <input 
                type="checkbox" 
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                checked={showReturnsOnly}
                onChange={(e) => setShowReturnsOnly(e.target.checked)}
              />
              إظهار الفواتير المرتجعة فقط
            </label>
            <div className="text-sm text-slate-500 font-bold bg-indigo-50 text-indigo-600 px-5 py-2.5 border border-indigo-100 rounded-xl">
              إجمالي النتائج: {filteredOrders.length}
            </div>
        </div>

        <div className="flex-1 overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-400 font-medium">
              <tr>
                <th className="p-4">رقم الفاتورة</th>
                <th className="p-4">بيانات العميل</th>
                <th className="p-4">التاريخ والوقت</th>
                <th className="p-4">تفاصيل المنتجات</th>
                <th className="p-4 text-center border-x border-slate-100 bg-slate-100/50">الإجمالي</th>
                <th className="p-4 text-center">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-400 text-lg font-bold">
                    لا يوجد فواتير تطابق بحثك حالياً.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const hasReturns = order.items.some(i => i.returned_quantity > 0);
                  return (
                    <tr key={order.id} className={`hover:bg-slate-50 transition ${hasReturns ? 'bg-red-50/20' : ''}`}>
                      <td className="p-4 font-mono font-bold text-indigo-600">{order.id}</td>
                      <td className="p-4">
                        {order.customer ? (
                          <div className="flex flex-col">
                            <span className="font-bold flex items-center gap-1"><User size={14} className="text-indigo-400" /> {order.customer.name}</span>
                            <span className="text-xs text-slate-500 font-mono mt-1" dir="ltr">{order.customer.phone}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs font-bold bg-slate-100 px-2 py-1 rounded">عميل نقدي</span>
                        )}
                      </td>
                      <td className="p-4 text-slate-500">{new Date(order.date).toLocaleString('ar-SA')}</td>
                      <td className="p-4">
                        <ul className="space-y-1">
                          {order.items.map(i => (
                            <li key={i.id} className={`flex items-center gap-2 ${i.returned_quantity > 0 ? 'text-red-500' : ''}`}>
                              • {i.name} <span className="text-xs text-slate-400">(الكمية: {i.quantity})</span> 
                              {i.returned_quantity > 0 && <span className="font-bold text-[10px] bg-red-100 px-1.5 py-0.5 rounded text-red-600">مرتجع: {i.returned_quantity}</span>}
                            </li>
                          ))}
                        </ul>
                      </td>
                      <td className="p-4 text-center font-black border-x border-slate-100 bg-slate-50/50">
                        {order.total.toFixed(2)} {storeSettings.currency}
                      </td>
                      <td className="p-4 text-center">
                        {hasReturns ? (
                          <span className="inline-flex items-center gap-1 bg-red-100 text-red-600 px-3 py-1 rounded-lg text-xs font-bold">
                            <ArrowRightLeft size={14} /> مرتجع جزئي/كلي
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-green-100 text-green-600 px-3 py-1 rounded-lg text-xs font-bold">
                            فاتورة مكتملة
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
