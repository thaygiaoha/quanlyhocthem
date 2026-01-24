
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
  const [data, setData] = useState<AppData>(() => {
  // 1. Kiểm tra xem trong "ổ cứng" trình duyệt có dữ liệu cũ không
  const saved = localStorage.getItem('hocphi_data');
  
  if (saved) {
    try {
      // 2. Nếu có, đọc ra và dùng luôn (sẽ có đầy đủ Lop10.1, 10.5...)
      return JSON.parse(saved);
    } catch (e) {
      console.error("Lỗi dữ liệu:", e);
    }
  }
  
  // 3. Nếu không có (lần đầu dùng), thì mới dùng hàm getAppData() cũ của thầy
  return getAppData(); 
});

  useEffect(() => {
    saveAppData(data);
  }, [data]);

  const handleUpdateData = (newData: AppData) => {
    localStorage.setItem('hocphi_data', JSON.stringify(newData));
};
    setData(newData);
  };

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
