
import React, { useState } from 'react';
import { Search, Users, School, CreditCard, CalendarCheck } from 'lucide-react';
import { AppData, Student } from '../types';

interface ListSectionProps {
  data: AppData;
}

const ListSection: React.FC<ListSectionProps> = ({ data }) => {
  const [selectedClass, setSelectedClass] = useState<string>('Lop9');
  const [searchTerm, setSearchTerm] = useState('');

  const currentStudents = data.sheets[selectedClass]?.students || [];
  const filteredStudents = currentStudents.filter(s => 
    (s.name && s.name.toLowerCase().includes(searchTerm.toLowerCase())) || 
    (s.school && s.school.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex gap-2 flex-wrap">
          {["Lop9", "Lop10", "Lop11", "Lop12"].map(cls => {
            const studentCount = data.sheets[cls]?.students.length || 0;
            return (
              <button
                key={cls}
                onClick={() => setSelectedClass(cls)}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all border ${
                  selectedClass === cls 
                  ? 'bg-indigo-600 text-white shadow-md border-indigo-600' 
                  : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                }`}
              >
                {cls} <span className={`ml-1 px-1.5 py-0.5 rounded-md text-[10px] ${selectedClass === cls ? 'bg-white/20' : 'bg-slate-300 text-slate-700'}`}>{studentCount}</span>
              </button>
            );
          })}
        </div>
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text"
            placeholder="Tìm theo tên, trường..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredStudents.length > 0 ? filteredStudents.map((student) => {
          // Tính số buổi dựa trên giá trị 1 trong mảng điểm danh
          const attendedCount = student.attendance.filter(v => v === 1).length;
          return (
            <div key={student.phoneNumber + student.name} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all group border-l-4 border-l-transparent hover:border-l-indigo-500">
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center group-hover:bg-indigo-50 group-hover:text-indigo-500 transition-colors">
                  <Users size={24} />
                </div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{student.class}</span>
              </div>
              
              <h4 className="text-lg font-bold text-slate-800 mb-1">{student.name}</h4>
              <p className="text-sm text-slate-500 flex items-center gap-1 mb-4">
                <School size={14} /> {student.school || "Chưa cập nhật trường"}
              </p>

              <div className="grid grid-cols-2 gap-4 border-t border-slate-50 pt-4 mt-4">
                <div>
                  <p className="text-[10px] text-emerald-600 uppercase font-bold mb-1 flex items-center gap-1">
                    <CalendarCheck size={12} className="text-emerald-500" /> Số buổi học
                  </p>
                  <p className="font-bold text-slate-700">{attendedCount} buổi</p>
                </div>
                <div>
                  <p className="text-[10px] text-amber-600 uppercase font-bold mb-1 flex items-center gap-1">
                    <CreditCard size={12} className="text-amber-500" /> Học phí
                  </p>
                  <p className="font-bold text-indigo-600">{formatCurrency(student.totalAmount)}</p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-dashed border-slate-100">
                <div className="flex items-center justify-center gap-1 text-amber-600 font-bold text-xs bg-amber-50 py-2 rounded-lg border border-amber-100">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                  CHỜ THANH TOÁN
                </div>
              </div>
            </div>
          );
        }) : (
          <div className="col-span-full py-20 text-center text-slate-400 bg-white rounded-3xl border border-dashed border-slate-200">
            <Users size={48} className="mx-auto mb-4 opacity-10" />
            <p className="font-medium">Lớp hiện đang trống hoặc không tìm thấy kết quả</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ListSection;
