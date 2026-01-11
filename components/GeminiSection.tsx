
import React, { useState } from 'react';
import { Sparkles, BrainCircuit, MessageSquare, Zap, Loader2 } from 'lucide-react';
import { AppData } from '../types';
import { analyzeAttendance } from '../services/geminiService';

interface GeminiSectionProps {
  data: AppData;
}

const GeminiSection: React.FC<GeminiSectionProps> = ({ data }) => {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    setLoading(true);
    try {
      const result = await analyzeAttendance(data);
      setAnalysis(result);
    } catch (err) {
      alert("Lỗi khi kết nối với AI");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-700 p-8 rounded-3xl text-white shadow-xl shadow-indigo-200">
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="w-24 h-24 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center animate-pulse">
            <BrainCircuit size={48} />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-3xl font-bold mb-2 flex items-center justify-center md:justify-start gap-2">
              Trợ lý AI Gemini <Sparkles size={28} className="text-yellow-300" />
            </h2>
            <p className="text-indigo-100 text-lg mb-6">
              Sử dụng trí tuệ nhân tạo để phân tích dữ liệu điểm danh, tình hình học tập và đưa ra gợi ý giảng dạy tối ưu.
            </p>
            <button 
              onClick={handleAnalyze}
              disabled={loading}
              className="bg-white text-indigo-700 px-8 py-3 rounded-xl font-bold hover:bg-indigo-50 transition-all shadow-lg flex items-center gap-2 mx-auto md:mx-0 disabled:opacity-70"
            >
              {loading ? <Loader2 className="animate-spin" /> : <Zap size={20} />}
              Bắt đầu phân tích ngay
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 min-h-[400px]">
          <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
            <MessageSquare className="text-indigo-500" /> Kết quả phân tích
          </h3>
          {analysis ? (
            <div className="prose prose-slate max-w-none">
              <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl text-slate-700 whitespace-pre-wrap leading-relaxed">
                {analysis}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 py-12">
              <Sparkles size={48} className="mb-4 opacity-20" />
              <p>Chưa có phân tích nào. Hãy nhấn nút để bắt đầu.</p>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h4 className="font-bold text-slate-800 mb-3">AI Có thể giúp gì?</h4>
            <ul className="text-sm text-slate-600 space-y-3">
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0"></div>
                Nhận diện học sinh nghỉ học thường xuyên.
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0"></div>
                Ước tính doanh thu học phí tháng tới.
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0"></div>
                Gợi ý phương pháp ổn định sĩ số lớp.
              </li>
            </ul>
          </div>
          <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100">
             <p className="text-xs font-bold text-indigo-600 uppercase mb-2">Thông tin công nghệ</p>
             <p className="text-sm text-indigo-800 italic">"Ứng dụng đang sử dụng mô hình Gemini 3.0 Flash để xử lý dữ liệu với tốc độ cao nhất."</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeminiSection;
