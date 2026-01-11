
import { GoogleGenAI } from "@google/genai";
import { AppData } from "../types";

export const analyzeAttendance = async (data: AppData): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Prepare a summary of data for Gemini
  const summary = Object.values(data.sheets).map(sheet => {
    return {
      class: sheet.className,
      studentCount: sheet.students.length,
      averageAttendance: sheet.students.reduce((acc, s) => {
        const count = s.attendance.filter(v => v === 1).length;
        return acc + count;
      }, 0) / (sheet.students.length || 1)
    };
  });

  const prompt = `
    Dưới đây là dữ liệu điểm danh của các lớp học thêm:
    ${JSON.stringify(summary)}
    
    Hãy đóng vai một trợ lý quản lý giáo dục chuyên nghiệp.
    Dựa trên dữ liệu trên, hãy phân tích tình hình học tập và đưa ra 3 lời khuyên ngắn gọn để tối ưu hóa việc dạy và học.
    Trả lời bằng tiếng Việt, súc tích, chuyên nghiệp.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "Không thể phân tích dữ liệu lúc này.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Có lỗi xảy ra khi kết nối với AI.";
  }
};
