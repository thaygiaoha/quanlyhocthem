
import React from 'react';
import { AppData, ClassSheet } from '../types';
import { Users, BookOpen, Wallet, Clock } from 'lucide-react';

interface DashboardProps {
  data: AppData;
}

const Dashboard: React.FC<DashboardProps> = ({ data }) => {
  // Tính toán sĩ số thực tế từ các học sinh hiện có
  const classSheets = Object.values(data.sheets) as ClassSheet[];
  
  // Tổng học sinh thực tế
  const totalStudents = classSheets.reduce((acc, sheet) => {
    return acc + (sheet.students ? sheet.students.length : 0);
  }, 0);

  // Số lớp thực tế có học sinh
  const activeClasses = Object.keys(data.sheets).filter(key => 
    data.sheets[key].students && data.sheets[key].students.length > 0
  );
  
  // Tính tổng tiền dựa trên số buổi điểm danh thực tế và biểu phí đã cài đặt
  // Đoạn code tính totalRevenue trong Dashboard.tsx
// Tính tổng tiền thông minh: Lấy số buổi điểm danh nhân với biểu phí từng lớp
  const totalRevenue = classSheets.reduce((acc, sheet) => {
    // Tìm đơn giá học phí của lớp này trong bảng fees
    const classConfig = data.fees.find(f => f.className === sheet.className);
    const unitFee = classConfig ? classConfig.fee : 0;

    const classTotal = sheet.students?.reduce((sAcc, s) => {
      // Đếm số buổi có giá trị là 1 trong mảng attendance của từng học sinh
      const attendedCount = s.attendance ? s.attendance.filter(v => v === 1).length : 0;
      return sAcc + (attendedCount * unitFee);
    }, 0) || 0;

    return acc + classTotal;
  }, 0);
  const stats = [
    { label: 'Tổng học sinh', value: totalStudents, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Số lớp học', value: activeClasses.length, icon: BookOpen, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Dự tính học phí', value: new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalRevenue), icon: Wallet, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Lớp hoạt động', value: activeClasses.length > 0 ? activeClasses.join(', ') : 'Trống', icon: Clock, color: 'text-purple-600', bg: 'bg-purple-50' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
              <div className={`${stat.bg} ${stat.color} p-4 rounded-xl`}>
                <Icon size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                <p className="text-xl font-bold text-slate-800">{stat.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Phân bổ học sinh thực tế</h3>
          <div className="space-y-4">
            {activeClasses.length > 0 ? 
              activeClasses.map((key) => {
              const classSheet = data.sheets[key];
              const count = classSheet.students.length;
              return (
                <div key={key} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-slate-700">{classSheet.className}</span>
                    <span className="text-slate-500 font-bold">{count} học sinh</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-indigo-500 h-full rounded-full transition-all duration-700" 
                      style={{ width: `${(count / (totalStudents || 1)) * 100}%` }}
                    ></div>
                  </div>
                </div>
              );
            }) : <p className="text-slate-400 text-center py-8 italic">Chưa có dữ liệu học sinh</p>}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Ghi chú & Trạng thái</h3>
          <div className="space-y-3">
            <div className="flex gap-3 p-3 bg-blue-50 border border-blue-100 rounded-xl">
              <div className="text-blue-500"><BookOpen size={20} /></div>
              <p className="text-sm text-blue-700">Dữ liệu sĩ số được cập nhật tức thì theo danh sách thực tế.</p>
            </div>
            <div className="flex gap-3 p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
              <div className="text-emerald-500"><Users size={20} /></div>
              <p className="text-sm text-emerald-700">Tự động loại bỏ dữ liệu không hợp lệ khi tải trang.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
