
import React from 'react';
import { ViewMode } from '../types';
import { 
  LayoutDashboard, 
  UserPlus, 
  CheckSquare, 
  Settings, 
  Sparkles,
  GraduationCap,
  ListOrdered
} from 'lucide-react';

interface SidebarProps {
  currentView: ViewMode;
  setView: (view: ViewMode) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView }) => {
  const menuItems = [
    { id: ViewMode.DASHBOARD, label: 'Tổng quan', icon: LayoutDashboard },
    { id: ViewMode.IMPORT, label: 'Nhập danh sách', icon: UserPlus },
    { id: ViewMode.LIST, label: 'Xem danh sách', icon: ListOrdered },
    { id: ViewMode.ATTENDANCE, label: 'Điểm danh', icon: CheckSquare },
    { id: ViewMode.GEMINI_AI, label: 'Trợ lý Gemini', icon: Sparkles },
    { id: ViewMode.SETTINGS, label: 'Cấu hình hệ thống', icon: Settings },
  ];

  return (
    <aside className="w-20 md:w-64 bg-white border-r border-slate-200 flex flex-col transition-all duration-300">
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
          <GraduationCap size={24} />
        </div>
        <span className="hidden md:block font-bold text-slate-800 text-lg">SmartEdu</span>
      </div>

      <nav className="flex-1 px-3 space-y-2 mt-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 ${
                isActive 
                  ? 'bg-indigo-50 text-indigo-600 font-medium shadow-sm border border-indigo-100' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
              }`}
            >
              <Icon size={22} />
              <span className="hidden md:block">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-100">
        <div className="hidden md:block bg-gradient-to-br from-indigo-500 to-purple-600 p-4 rounded-xl text-white shadow-md">
          <p className="text-xs font-semibold uppercase opacity-80 mb-1">Phiên bản Pro</p>
          <p className="text-sm">Đã kích hoạt AI</p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
