import { useState } from 'react';
import { useStore } from '../../store/useStore';
import { Search, FileText, Table as TableIcon } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function Customers() {
  const { customers, orders, storeSettings } = useStore();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCustomers = customers.filter(c => 
    c.name.includes(searchQuery) || c.phone.includes(searchQuery)
  );

  const exportExcel = () => {
    const wsData = [
      ['سجل العملاء', '', '', ''],
      ['التاريخ', new Date().toLocaleDateString(), '', ''],
      [''],
      ['الاسم', 'رقم الهاتف', 'عدد الطلبات', 'تاريخ التسجيل'],
      ...filteredCustomers.map(c => [
        c.name,
        c.phone,
        orders.filter(o => o.customer?.id === c.id).length,
        new Date(c.timestamp).toLocaleDateString('ar-SA')
      ])
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Customers');
    XLSX.writeFile(wb, `customers_report_${new Date().toLocaleDateString()}.xlsx`);
  };

  const exportPDF = async () => {
    const element = document.getElementById('customers-table');
    if (!element) return;
    const canvas = await html2canvas(element, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`customers_report_${new Date().toLocaleDateString()}.pdf`);
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-800">العملاء</h1>
          <p className="text-slate-500 mt-2">سجل بيانات العملاء وأرقام هواتفهم</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={exportExcel}
            className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-emerald-700 transition shadow-lg"
          >
            <TableIcon size={18} /> Excel
          </button>
          <button 
            onClick={exportPDF}
            className="flex items-center gap-2 bg-red-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-red-700 transition shadow-lg"
          >
            <FileText size={18} /> PDF
          </button>
        </div>
      </div>

      <div id="customers-table" className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden flex flex-col min-h-[500px]">
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="relative w-1/3 min-w-[300px]">
            <Search className="absolute right-4 top-3 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="ابحث باسم العميل أو رقم الهاتف..."
              style={{ '--tw-ring-color': storeSettings.themeColor + '40' } as any}
              className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pr-12 pl-4 text-sm focus:outline-none focus:ring-2 shadow-sm"
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
                      <td className="p-4 font-mono font-bold" style={{ color: storeSettings.themeColor }} dir="ltr">{customer.phone}</td>
                      <td className="p-4 font-bold">{customer.name}</td>
                      <td className="p-4 text-center">
                        <span style={{ backgroundColor: storeSettings.themeColor + '15', color: storeSettings.themeColor }} className="px-3 py-1 rounded-lg font-bold">
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
