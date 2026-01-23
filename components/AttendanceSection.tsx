
import React, { useState } from 'react';
import { CheckSquare, Lock, Save, Search, CheckCircle2, XCircle, CloudUpload, Loader2 } from 'lucide-react';
import { AppData } from '../types';
import { calculateTotal, syncAttendanceToSheet } from '../services/storage';

interface AttendanceSectionProps {
  data: AppData;
  onUpdate: (data: AppData) => void;
  checkPassword: (pw: string) => boolean;
}

const AttendanceSection: React.FC<AttendanceSectionProps> = ({ data, onUpdate, checkPassword }) => {
  const [password, setPassword] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [attendanceMap, setAttendanceMap] = useState<{ [key: string]: boolean }>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [syncing, setSyncing] = useState(false);

  const handleAuth = () => {
    if (checkPassword(password)) {
      setIsAuthorized(true);
    } else {
      alert('Sai mật khẩu! Vui lòng kiểm tra ô C2 sheet hocphi.');
    }
  };

  const handleSelectClass = (className: string) => {
    setSelectedClass(className);
    const initialMap: { [key: string]: boolean } = {};
    data.sheets[className]?.students.forEach(s => {
      initialMap[s.phoneNumber + s.name] = true; // Mặc định là có mặt
    });
    setAttendanceMap(initialMap);
  };

  const toggleAttendance = (key: string) => {
    setAttendanceMap(prev => ({ ...prev, [key]: !prev[key] }));
  };

 const handleSave = async (syncCloud: boolean = false) => {
    if (!selectedClass) return;

    const newData = { ...data };
    const classSheet = newData.sheets[selectedClass];
    const feeConfig = data.fees.find(f => f.className === selectedClass);
    const currentFee = feeConfig ? feeConfig.fee : 0;

    const studentsToSync = classSheet.students.map(student => {
      const isPresent = attendanceMap[student.phoneNumber + student.name];
      const val = isPresent ? 1 : 0;
      
      const nextIdx = student.attendance.findIndex(v => v === null);
      if (nextIdx !== -1) {
        student.attendance[nextIdx] = val;
      } else {
        student.attendance[9] = val;
      }
      
      student.totalAmount = calculateTotal(student.attendance, currentFee);

      return {
        name: student.name,
        phoneNumber: student.phoneNumber,
        isPresent: isPresent,
        totalAmount: student.totalAmount,
        // THÊM DÒNG NÀY: Gửi ghi chú (tên sheet riêng) lên Script
        note: student.school // Giả sử trong App dữ liệu "Ghi chú" đang được lưu vào trường này hoặc s.note
      };
    });

    onUpdate(newData);
    if (syncCloud && data.sheetLink) {
        setSyncing(true);
        try {
            await syncAttendanceToSheet(data.sheetLink, selectedClass, studentsToSync);
            alert('Đã lưu và đồng bộ Google Sheet thành công!');
        } catch (err) {
            alert('Lỗi khi đồng bộ Cloud. Vui lòng thử lại.');
        } finally {
            setSyncing(false);
        }
    } else {
        alert('Đã lưu điểm danh cục bộ!');
    }
    
    setSelectedClass('');
  };

  if (!isAuthorized) {
    return (
      <div className="bg-white p-8 rounded-2xl shadow-md max-w-md mx-auto border border-slate-100 flex flex-col items-center">
        <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-4">
          <Lock size={32} />
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">Yêu cầu xác thực</h2>
        <p className="text-slate-500 text-center mb-6">Mật khẩu tại ô C2 sheet 'hocphi'</p>
        <input 
          type="password" 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Nhập mật khẩu..."
          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none mb-4"
        />
        <button 
          onClick={handleAuth}
          className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-100"
        >
          Xác nhận
        </button>
      </div>
    );
  }

  const currentStudents = data.sheets[selectedClass]?.students || [];
  const filteredStudents = currentStudents.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.class.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2 text-indigo-600">
          <CheckSquare /> Chọn lớp điểm danh hôm nay
        </h3>
        <div className="flex flex-wrap gap-3">
          {["Lop9", "Lop10", "Lop11", "Lop12"].map(className => (
            <button
              key={className}
              onClick={() => handleSelectClass(className)}
              className={`px-6 py-3 rounded-xl font-bold transition-all border ${
                selectedClass === className 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 border-indigo-600' 
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
              }`}
            >
              {className}
            </button>
          ))}
        </div>
      </div>

      {selectedClass && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden animate-in slide-in-from-bottom-4">
          <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-50/50">
            <div>
              <h3 className="text-xl font-bold text-slate-800">Lớp: {selectedClass}</h3>
              <p className="text-sm text-slate-500">Sĩ số: {currentStudents.length} học sinh</p>
            </div>
            <div className="flex items-center gap-4 w-full md:w-auto">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Tìm học sinh..."
                  className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 w-full text-sm"
                />
              </div>
              <button 
                  onClick={() => handleSave(true)}
                  disabled={syncing || !data.sheetLink}
                  className="bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-emerald-700 flex items-center gap-2 transition-all shadow-md shadow-emerald-100 disabled:opacity-50"
              >
                  {syncing ? <Loader2 size={18} className="animate-spin" /> : <CloudUpload size={18} />} 
                  Lưu & Đồng bộ
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-100 text-slate-600 text-xs uppercase tracking-wider font-bold">
                  <th className="px-6 py-4">STT</th>
                  <th className="px-6 py-4">Họ và Tên</th>
                  <th className="px-6 py-4">Lớp/Trường</th>
                  <th className="px-6 py-4 text-center">Trạng thái điểm danh</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.length > 0 ? filteredStudents.map((student, idx) => {
                  const key = student.phoneNumber + student.name;
                  const isPresent = attendanceMap[key];
                  return (
                    <tr key={key} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-6 py-4 text-slate-400 text-sm">{idx + 1}</td>
                      <td className="px-6 py-4 font-bold text-slate-800">{student.name}</td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-slate-700">{student.class}</p>
                        <p className="text-[10px] text-slate-400 uppercase font-medium">{student.school}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center">
                          <button 
                            onClick={() => toggleAttendance(key)}
                            className={`flex items-center gap-2 px-5 py-2 rounded-xl font-bold transition-all border-2 ${
                              isPresent 
                              ? 'text-emerald-600 bg-emerald-50 border-emerald-100 shadow-sm shadow-emerald-50' 
                              : 'text-slate-400 bg-slate-50 border-slate-200'
                            }`}
                          >
                            {isPresent ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
                            {isPresent ? "CÓ MẶT" : "VẮNG MẶT"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-20 text-center text-slate-400 italic bg-white">
                      Không tìm thấy học sinh nào.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceSection;
