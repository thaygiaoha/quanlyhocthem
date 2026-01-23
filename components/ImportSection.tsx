
import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { Upload, Plus, FileSpreadsheet, Lock, Loader2, Download, Trash2 } from 'lucide-react';
import { AppData, Student } from '../types';
import { extractGradeFromClassName } from '../services/storage';

interface ImportSectionProps {
  data: AppData;
  onUpdate: (data: AppData) => void;
  checkPassword: (pw: string) => boolean;
}

const ImportSection: React.FC<ImportSectionProps> = ({ data, onUpdate, checkPassword }) => {
  const [password, setPassword] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [manualStudent, setManualStudent] = useState({
    name: '', class: '', school: '', phoneNumber: ''
  });

  const handleAuth = () => {
    if (checkPassword(password)) {
      setIsAuthorized(true);
    } else {
      alert('Sai mật khẩu! Vui lòng kiểm tra ô C2 sheet hocphi.');
    }
  };

  const handleClearData = () => {
    if (window.confirm("XÓA TOÀN BỘ học sinh trong ứng dụng? (Hành động này không xóa trên Google Sheets)")) {
      const emptySheets: { [key: string]: any } = {
        "Lop9": { className: "Lop9", students: [] },
        "Lop10": { className: "Lop10", students: [] },
        "Lop11": { className: "Lop11", students: [] },
        "Lop12": { className: "Lop12", students: [] }
      };
      const newData = { ...data, sheets: emptySheets };
      onUpdate(newData);
      alert("Đã làm sạch toàn bộ danh sách lớp!");
    }
  };

  const downloadTemplate = () => {
    const templateData = [
      { "STT": 1, "Họ và Tên": "Nguyễn Văn A", "Lớp": "9A1", "Trường": "THCS Chu Văn An", "Số điện thoại": "0912345678" }
    ];
    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "DanhSachHocSinh");
    XLSX.writeFile(workbook, "Mau_Danh_Sach_Hoc_Sinh.xlsx");
  };

  const syncToCloud = async (students: any[]) => {
    if (!data.sheetLink) return;
    setSyncing(true);
    try {
      await fetch(data.sheetLink, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: "importStudents",
          data: students
        })
      });
      alert("Đồng bộ thành công lên Google Sheets!");
    } catch (err) {
      alert('Lỗi đồng bộ Cloud!');
    } finally {
      setSyncing(false);
    }
  };

  const processExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(ws, { header: 'A' }) as any[];

      const newData = { ...data };
      const flatList: any[] = [];
      const tempSheets: { [key: string]: Student[] } = { "Lop9": [], "Lop10": [], "Lop11": [], "Lop12": [] };

      jsonData.slice(1).forEach((row: any) => {
        const studentName = String(row['B'] || '').trim();
        // Lọc bỏ rác
        if (!studentName || studentName.includes("68686868")) return;

        const studentClass = String(row['C'] || '');
        const gradeKey = extractGradeFromClassName(studentClass);
        if (!tempSheets[gradeKey]) return;

        const newStudent: Student = {
          stt: tempSheets[gradeKey].length + 1,
          name: studentName,
          class: studentClass,
          school: String(row['D'] || ''),
          phoneNumber: String(row['E'] || ''),
          note: String(row['F'] || '').trim(),
          attendance: Array(10).fill(null), // Import mới sẽ làm mới mảng điểm danh
          totalAmount: 0
         };
        tempSheets[gradeKey].push(newStudent);
        flatList.push({ ...newStudent, gradeKey });
      });

      // Cập nhật state
      Object.keys(tempSheets).forEach(grade => {
        newData.sheets[grade] = { className: grade, students: tempSheets[grade] };
      });
      
      onUpdate(newData);
      if (data.sheetLink && window.confirm("Đã nhập xong. Bạn có muốn cập nhật Cloud ngay không? (Hành động này sẽ làm mới danh sách điểm danh trên Sheet)")) {
        await syncToCloud(flatList);
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = '';
  };

  const handleManualAdd = async () => {
    if (!manualStudent.name || !manualStudent.class) {
      alert('Vui lòng nhập tên và lớp!');
      return;
    }

    const gradeKey = extractGradeFromClassName(manualStudent.class);
    if (!["Lop9", "Lop10", "Lop11", "Lop12"].includes(gradeKey)) {
        alert("Lớp phải thuộc khối 9, 10, 11 hoặc 12 (VD: 9A1)");
        return;
    }

    const newData = { ...data };
    if (!newData.sheets[gradeKey]) {
      newData.sheets[gradeKey] = { className: gradeKey, students: [] };
    }

    const newStudent: Student = {
      stt: newData.sheets[gradeKey].students.length + 1,
      name: manualStudent.name,
      class: manualStudent.class,
      school: manualStudent.school,
      phoneNumber: manualStudent.phoneNumber,
      note: manualStudent.note || '',
      attendance: Array(10).fill(null),
      totalAmount: 0
    };

    newData.sheets[gradeKey].students.push(newStudent);
    onUpdate(newData);

    setManualStudent({ name: '', class: '', school: '', phoneNumber: '' });
    
    if (data.sheetLink && window.confirm(`Đã thêm ${newStudent.name}. Cập nhật Cloud?`)) {
      const flatData: any[] = [];
      Object.keys(newData.sheets).forEach(gk => {
        newData.sheets[gk].students.forEach(s => flatData.push({...s, gradeKey: gk}));
      });
      await syncToCloud(flatData);
    }
  };

  if (!isAuthorized) {
    return (
      <div className="bg-white p-8 rounded-2xl shadow-md max-w-md mx-auto border border-slate-100 flex flex-col items-center">
        <Lock className="text-amber-500 mb-4" size={32} />
        <h2 className="text-xl font-bold text-slate-800 mb-6">Xác thực quyền nhập liệu</h2>
        <input 
          type="password" 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Mật khẩu (ô C2 sheet hocphi)..."
          className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none mb-4 focus:ring-2 focus:ring-indigo-500"
        />
        <button onClick={handleAuth} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">Xác nhận</button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-100">
        <p className="text-sm text-slate-500 italic font-medium">Lưu ý: Nhập Excel sẽ ghi đè danh sách học sinh của khối tương ứng.</p>
        <button 
          onClick={handleClearData}
          className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors border border-red-100 text-sm font-bold shadow-sm"
        >
          <Trash2 size={16} /> Làm sạch danh sách
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <FileSpreadsheet className="text-indigo-500" /> Nhập từ Excel
            </h3>
            <button onClick={downloadTemplate} className="text-indigo-600 text-sm font-bold flex items-center gap-1 hover:text-indigo-800">
              <Download size={16} /> Tải mẫu Excel
            </button>
          </div>
          <div className="border-3 border-dashed border-slate-100 rounded-3xl p-10 flex flex-col items-center bg-slate-50/50 hover:bg-indigo-50/30 transition-all">
            {syncing ? (
              <Loader2 className="animate-spin text-indigo-500" size={40} />
            ) : (
              <>
                <div className="w-20 h-20 bg-indigo-100 text-indigo-500 rounded-full flex items-center justify-center mb-6 shadow-inner">
                   <Upload size={40} />
                </div>
                <input type="file" accept=".xlsx, .xls" onChange={processExcel} className="hidden" id="excel-upload" />
                <label htmlFor="excel-upload" className="cursor-pointer bg-indigo-600 text-white px-10 py-4 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">Chọn tệp danh sách</label>
                <p className="text-xs text-slate-400 mt-6 font-medium">Hỗ trợ các khối: 9, 10, 11, 12</p>
              </>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
  <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
    <Plus className="text-emerald-500" /> Thêm học sinh thủ công
  </h3>
  <div className="space-y-4">
    {/* Họ và tên */}
    <div>
       <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Họ và tên</label>
       <input 
        type="text" placeholder="Nguyễn Văn A" value={manualStudent.name}
        onChange={(e) => setManualStudent({...manualStudent, name: e.target.value})}
        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none bg-slate-50/50"
       />
    </div>

    <div className="grid grid-cols-2 gap-4">
      {/* Lớp */}
      <div>
         <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Lớp (VD: 9A1)</label>
         <input 
          type="text" placeholder="9A1" value={manualStudent.class}
          onChange={(e) => setManualStudent({...manualStudent, class: e.target.value})}
          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none bg-slate-50/50"
         />
      </div>
      {/* Số điện thoại */}
      <div>
         <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Số điện thoại</label>
         <input 
          type="text" placeholder="09xxx" value={manualStudent.phoneNumber}
          onChange={(e) => setManualStudent({...manualStudent, phoneNumber: e.target.value})}
          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none bg-slate-50/50"
         />
      </div>
    </div>

    {/* Trường học */}
    <div>
      <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Trường học</label>
      <input 
        type="text" placeholder="THPT Chuyên..." value={manualStudent.school}
        onChange={(e) => setManualStudent({...manualStudent, school: e.target.value})}
        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none bg-slate-50/50"
      />
    </div>

   {/* PHẦN THÊM MỚI: Ghi chú / Nhóm lớp */}
    <div>
      <label className="text-xs font-bold text-indigo-500 uppercase mb-1 block flex justify-between">
        Ghi chú (Tên Sheet riêng để điểm danh)
        <span className="text-[9px] text-slate-400 normal-case font-normal italic">* Ví dụ: Lop10.1</span>
      </label>
      <input 
        type="text" 
        placeholder="Để trống nếu thuộc sheet mặc định" 
        value={manualStudent.note || ''}
        onChange={(e) => setManualStudent({...manualStudent, note: e.target.value})}
        className="w-full px-4 py-3 rounded-xl border border-indigo-100 focus:ring-2 focus:ring-indigo-500 outline-none bg-indigo-50/30 font-bold text-indigo-600 placeholder:font-normal"
      />
    </div>

    {/* 1. Sổ chọn danh sách trường */}
    <div className="pt-2">
      <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Chọn trường học nhanh</label>
      <select 
        value={
          ["THPT Yên Dũng số 2", "THPT Yên Dũng số 1", "THCS Xuân Phú"].includes(manualStudent.school) 
          ? manualStudent.school 
          : (manualStudent.school === "" ? "" : "other")
        }
        onChange={(e) => {
          const val = e.target.value;
          if (val === "other") {
            setManualStudent({...manualStudent, school: "Trường khác"}); 
          } else {
            setManualStudent({...manualStudent, school: val});
          }
        }}
        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none bg-slate-50/50"
      >
        <option value="">-- Chọn trường của bạn --</option>
        <option value="THPT Yên Dũng số 2">THPT Yên Dũng số 2</option>
        <option value="THPT Yên Dũng số 1">THPT Yên Dũng số 1</option>
        <option value="THCS Xuân Phú">THCS Xuân Phú</option>
        <option value="other">Trường khác...</option>
      </select>
    </div>

    {/* 2. Ô nhập tay trường khác */}
    {(!["THPT Yên Dũng số 2", "THPT Yên Dũng số 1", "THCS Xuân Phú", ""].includes(manualStudent.school) || manualStudent.school === "Trường khác") && (
      <div className="animate-in fade-in slide-in-from-top-2 duration-300">
        <input 
          type="text" 
          placeholder="Nhập tên trường của bạn..." 
          value={manualStudent.school === "Trường khác" ? "" : manualStudent.school}
          onChange={(e) => setManualStudent({...manualStudent, school: e.target.value})}
          className="w-full px-4 py-3 rounded-xl border-2 border-emerald-100 focus:ring-2 focus:ring-emerald-500 outline-none bg-white shadow-inner"
          autoFocus
        />
        <p className="text-[10px] text-emerald-600 mt-1 ml-1 font-medium italic">* Thầy cô vui lòng nhập đầy đủ tên trường.</p>
      </div>
    )}

    {/* Nút bấm lưu học sinh */}
    <button 
      onClick={handleManualAdd} 
      className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 mt-2"
    >
      Thêm và cập nhật
    </button>
  </div> {/* Đóng space-y-4 */}
</div> {/* Đóng khung trắng bg-white p-6 */}
      </div> 
    </div>
  );
};

export default ImportSection;
