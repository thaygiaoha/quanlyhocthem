import React, { useState, useEffect } from 'react';
import { ViewMode, AppData } from './types';
import { getAppData, saveAppData } from './services/storage';
import { Users } from 'lucide-react';

// Components
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import ImportSection from './components/ImportSection';
import AttendanceSection from './components/AttendanceSection';
import SettingsSection from './components/SettingsSection';
import GeminiSection from './components/GeminiSection';
import ListSection from './components/ListSection';

const App: React.FC = () => {
  const [view, setView] = useState<ViewMode>(ViewMode.DASHBOARD);
  
  // 1. Khởi tạo dữ liệu: Ưu tiên lấy từ LocalStorage
  const [data, setData] = useState<AppData>(() => {
    const saved = localStorage.getItem('hocphi_data');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Lỗi dữ liệu LocalStorage:", e);
      }
    }
    return getAppData(); 
  });

  // 2. Hàm kéo dữ liệu từ tất cả các Sheet về App
  const refreshDataFromCloud = async (link: string) => {
    try {
      // Gọi fetch trực tiếp đến link script (Script của thầy trả về JSON cho toàn bộ các lớp)
      const response = await fetch(link);
      const cloudData = await response.json();
      
      if (cloudData && cloudData.sheets) {
        const updatedData = { 
          ...data, 
          sheets: cloudData.sheets, 
          passwordC2: cloudData.password || data.passwordC2,
          sheetLink: link 
        };
        setData(updatedData);
        localStorage.setItem('hocphi_data', JSON.stringify(updatedData));
        alert("Đồng bộ thành công! Đã tải dữ liệu các lớp từ Google Sheets.");
      }
    } catch (err) {
      console.error("Lỗi đồng bộ:", err);
      alert("Không thể tải dữ liệu. Thầy kiểm tra lại Link Script đã Deploy đúng chưa nhé.");
    }
  };

  // 3. Hàm cập nhật dữ liệu khi Settings hoặc Attendance thay đổi
  const handleUpdateData = async (newData: AppData) => {
    // Nếu vừa đổi link ở Settings, tự động hỏi để kéo dữ liệu
    if (newData.sheetLink && newData.sheetLink !== data.sheetLink) {
      setData(newData);
      localStorage.setItem('hocphi_data', JSON.stringify(newData));
      if (window.confirm("Phát hiện Link Script mới. Tải dữ liệu từ Google Sheets về máy này?")) {
        await refreshDataFromCloud(newData.sheetLink);
      }
    } else {
      setData(newData);
      localStorage.setItem('hocphi_data', JSON.stringify(newData));
    }
  };

  // 4. Tự động lưu dữ liệu mỗi khi state data thay đổi
  useEffect(() => {
    saveAppData(data);
  }, [data]);

  // 5. Tự động đồng bộ nhẹ khi vừa mở App nếu đã có Link
  useEffect(() => {
    if (data.sheetLink) {
      // Thầy có thể gọi refreshDataFromCloud ở đây nếu muốn mở App là tự cập nhật
      // refreshDataFromCloud(data.sheetLink); 
    }
  }, []);

  const checkPassword = (input: string): boolean => {
    return input === data.passwordC2;
  };

  const renderContent = () => {
    switch (view) {
      case ViewMode.DASHBOARD:
        return <Dashboard data={data} />;
      case ViewMode.IMPORT:
        return <ImportSection data={data} onUpdate={handleUpdateData} checkPassword={checkPassword} />;
      case ViewMode.LIST:
        return <ListSection data={data} />;
      case ViewMode.ATTENDANCE:
        return <AttendanceSection data={data} onUpdate={handleUpdateData} checkPassword={checkPassword} />;
      case ViewMode.SETTINGS:
        return <SettingsSection data={data} onUpdate={handleUpdateData} />;
      case ViewMode.GEMINI_AI:
        return <GeminiSection data={data} />;
      default:
        return <Dashboard data={data} />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar currentView={view} setView={setView} />
      
      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">SmartEdu Pro</h1>
            <p className="text-slate-500">Quản lý dạy thêm học thêm chuyên nghiệp</p>
          </div>
          <div className="flex items-center gap-3">
             <div className="hidden md:block text-right">
                <p className="text-sm font-medium text-slate-700">Trạng thái Google</p>
                <p className={`text-xs font-mono ${data.sheetLink ? 'text-green-500' : 'text-amber-500'}`}>
                  {data.sheetLink ? 'Đã kết nối Cloud' : 'Chế độ Local'}
                </p>
             </div>
             <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-200">
                <Users size={20} />
             </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;
