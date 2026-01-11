
import React, { useState, useEffect } from 'react';
import { Save, Key, Database, DollarSign, RefreshCw, Loader2, Lock, ShieldCheck } from 'lucide-react';
import { AppData } from '../types';
import { fetchFromSheet, syncSettingsToSheet } from '../services/storage';

interface SettingsSectionProps {
  data: AppData;
  onUpdate: (data: AppData) => void;
}

const SettingsSection: React.FC<SettingsSectionProps> = ({ data, onUpdate }) => {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [unlockPassword, setUnlockPassword] = useState('');
  const [config, setConfig] = useState(data);
  const [testing, setTesting] = useState(false);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    setConfig(data);
  }, [data]);

  const handleUnlock = () => {
    // Nếu chưa có mật khẩu trong data (lần đầu), dùng 123456 làm mặc định
    const masterPass = data.passwordC2 || '123456';
    if (unlockPassword === masterPass) {
      setIsUnlocked(true);
    } else {
      alert('Mật khẩu không chính xác! (Mặc định: 123456 hoặc ô C2 sheet hocphi)');
    }
  };

  const handleSaveAll = async () => {
    onUpdate(config);
    
    if (config.sheetLink && window.confirm("Xác nhận cập nhật cấu hình lên Google Sheets?")) {
        setSyncing(true);
        try {
            await syncSettingsToSheet(config.sheetLink, config.passwordC2, config.fees);
            alert('Đã gửi yêu cầu cập nhật Cloud thành công!');
        } catch (err) {
            alert('Có lỗi khi gửi dữ liệu đồng bộ.');
        } finally {
            setSyncing(false);
        }
    } else {
        alert('Cấu hình đã được lưu cục bộ!');
    }
  };

  const handleTestConnection = async () => {
    if (!config.sheetLink) {
        alert("Vui lòng nhập link Web App!");
        return;
    }
    setTesting(true);
    try {
      const result = await fetchFromSheet(config.sheetLink);
      if (result) {
        const newConfig = { ...config };
        if (result.password) newConfig.passwordC2 = String(result.password);
        if (result.sheets) newConfig.sheets = result.sheets;
        setConfig(newConfig);
        onUpdate(newConfig);
        alert("Kết nối và nạp dữ liệu từ Cloud thành công!");
      }
    } catch (err) {
      alert("Lỗi kết nối! Kiểm tra link hoặc quyền truy cập của Web App.");
    } finally {
      setTesting(false);
    }
  };

  const updateFee = (className: string, fee: number) => {
    const newFees = config.fees.map(f => f.className === className ? { ...f, fee } : f);
    setConfig({ ...config, fees: newFees });
  };

  if (!isUnlocked) {
    return (
      <div className="max-w-md mx-auto mt-20 bg-white p-10 rounded-3xl shadow-2xl border border-slate-100 flex flex-col items-center animate-in zoom-in duration-300">
        <div className="w-20 h-20 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-8 shadow-inner">
          <ShieldCheck size={40} />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Cấu hình hệ thống</h2>
        <p className="text-slate-500 text-center mb-8 text-sm">Nhập mật khẩu (ô C2 sheet hocphi) để thiết lập.</p>
        <div className="w-full relative mb-6">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="password"
            value={unlockPassword}
            onChange={(e) => setUnlockPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
            placeholder="Mật khẩu..."
            className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 text-lg shadow-sm"
          />
        </div>
        <button 
          onClick={handleUnlock}
          className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 active:scale-95"
        >
          Truy cập cấu hình
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in duration-500">
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Key className="text-amber-500" /> Kết nối Google Sheet
          </h3>
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Mật khẩu quản lý (C2)</label>
              <input 
                  type="text" 
                  value={config.passwordC2}
                  onChange={(e) => setConfig({ ...config, passwordC2: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Google Apps Script URL</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={config.sheetLink}
                  onChange={(e) => setConfig({ ...config, sheetLink: e.target.value })}
                  placeholder="https://script.google.com/..."
                  className="flex-1 px-4 py-3 rounded-xl border border-slate-200 outline-none bg-slate-50 text-xs font-mono"
                />
                <button 
                  onClick={handleTestConnection}
                  disabled={testing}
                  title="Kiểm tra kết nối và nạp dữ liệu"
                  className="px-4 bg-blue-50 text-blue-600 rounded-xl border border-blue-100 hover:bg-blue-100 transition-colors"
                >
                  {testing ? <Loader2 size={20} className="animate-spin" /> : <RefreshCw size={20} />}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <DollarSign className="text-emerald-500" /> Biểu phí học tập (Cập nhật đúng dòng)
          </h3>
          <div className="space-y-3">
            {["Lop9", "Lop10", "Lop11", "Lop12"].map((name) => {
              const feeObj = config.fees.find(f => f.className === name) || { className: name, fee: 0 };
              return (
                <div key={name} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200">
                  <span className="font-bold text-slate-700">{name}</span>
                  <div className="flex items-center gap-3">
                    <input 
                      type="number" 
                      value={feeObj.fee}
                      onChange={(e) => updateFee(name, Number(e.target.value))}
                      className="w-32 px-4 py-2 text-right rounded-xl border border-slate-200 font-bold text-indigo-600 focus:ring-2 focus:ring-indigo-500"
                    />
                    <span className="text-xs font-bold text-slate-400 uppercase">đ/buổi</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="bg-white p-10 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center">
        <div className="w-24 h-24 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-8 shadow-inner">
          <Database size={48} />
        </div>
        <h3 className="text-2xl font-bold text-slate-800 mb-3">Lưu & Đồng bộ</h3>
        <p className="text-slate-500 mb-10 max-w-xs text-sm leading-relaxed">
          Xác nhận sẽ lưu cấu hình cục bộ và gửi tín hiệu đồng bộ lên Google Sheet. 
          Vui lòng đợi vài giây để hệ thống xử lý.
        </p>
        <button 
          onClick={handleSaveAll}
          disabled={syncing}
          className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-bold flex items-center justify-center gap-3 shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50"
        >
          {syncing ? <Loader2 size={24} className="animate-spin" /> : <Save size={24} />} 
          Xác nhận cập nhật hệ thống
        </button>
      </div>
    </div>
  );
};

export default SettingsSection;
