import { useState } from 'react';
import { useStore } from '../../store/useStore';
import { Search } from 'lucide-react';

export default function Customers() {
  const { customers, orders } = useStore();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCustomers = customers.filter(c => 
    c.name.includes(searchQuery) || c.phone.includes(searchQuery)
  );

  return (
    <div className="p-8">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-800">العملاء</h1>
          <p className="text-slate-500 mt-2">سجل بيانات العملاء وأرقام هواتفهم</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden flex flex-col min-h-[500px]">
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="relative w-1/3 min-w-[300px]">
            <Search className="absolute right-4 top-3 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="ابحث باسم العميل أو رقم الهاتف..."
              className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pr-12 pl-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="text-sm text-slate-500 font-bold bg-white px-4 py-2 border border-slate-200 rounded-xl">
            إجمالي العملاء: {filteredCustomers.length}
          </div>
        </div>

        <div className="flex-1 overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-white border-b border-slate-100 text-slate-400 font-medium">
              <tr>
                <th className="p-4">رقم الهاتف</th>
                <th className="p-4">اسم العميل</th>
                <th className="p-4 text-center">عدد الطلبات السابقة</th>
                <th className="p-4 text-center">تاريخ التسجيل</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-12 text-center text-slate-400 text-lg font-bold">
                    لا يوجد عملاء مسجلين بالنظام حالياً.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => {
                  const customerOrders = orders.filter(o => o.customer?.id === customer.id).length;
                  return (
                    <tr key={customer.id} className="hover:bg-slate-50 transition">
                      <td className="p-4 font-mono font-bold text-indigo-600" dir="ltr">{customer.phone}</td>
                      <td className="p-4 font-bold">{customer.name}</td>
                      <td className="p-4 text-center">
                        <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-lg font-bold">
                          {customerOrders} طلب
                        </span>
                      </td>
                      <td className="p-4 text-center text-slate-500">
                        {new Date(customer.timestamp).toLocaleDateString('ar-SA')}
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
