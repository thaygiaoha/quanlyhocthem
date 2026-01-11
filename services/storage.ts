
import { AppData, Student, FeeConfig } from '../types';

const STORAGE_KEY = 'quan_ly_hoc_them_data';
const MY_SHEET_LINK = 'https://script.google.com/macros/s/AKfycbxU1gFzMDIzYbWxAh70658gBw6czUAhyhud7VqbZWMD1OYlZfqDR5M7W7wfxz831e3gXA/exec';

const DEFAULT_DATA: AppData = {
  sheets: {},
  fees: [
    { className: 'Lop9', fee: 60000 },
    { className: 'Lop10', fee: 60000 },
    { className: 'Lop11', fee: 60000 },
    { className: 'Lop12', fee: 70000 },
  ],
  passwordC2: '',
  sheetLink: MY_SHEET_LINK
};

export const getAppData = (): AppData => {
  const stored = localStorage.getItem(STORAGE_KEY);
  let data: AppData;
  
  if (!stored) {
    data = DEFAULT_DATA;
  } else {
    try {
      data = JSON.parse(stored);
      // Luôn đảm bảo có link cloud mặc định
      if (!data.sheetLink || data.sheetLink.trim() === '') {
        data.sheetLink = MY_SHEET_LINK;
      }
      // Đồng bộ danh mục phí nếu thiếu
      const classNames = ['Lop9', 'Lop10', 'Lop11', 'Lop12'];
      classNames.forEach(name => {
        if (!data.fees.find(f => f.className === name)) {
          const def = DEFAULT_DATA.fees.find(f => f.className === name);
          if (def) data.fees.push(def);
        }
      });
    } catch (e) {
      data = DEFAULT_DATA;
    }
  }

  // Làm sạch dữ liệu rác và đảm bảo cấu trúc
  const cleanSheets: { [key: string]: any } = {};
  const validGrades = ["Lop9", "Lop10", "Lop11", "Lop12"];
  
  validGrades.forEach(grade => {
    if (data.sheets[grade]) {
      const students = (data.sheets[grade].students || []).filter((s: Student) => 
        s.name && 
        !s.name.includes("68686868") && 
        !String(s.phoneNumber).includes("68686868")
      );
      cleanSheets[grade] = { ...data.sheets[grade], students };
    } else {
      cleanSheets[grade] = { className: grade, students: [] };
    }
  });
  
  data.sheets = cleanSheets;
  return data;
};

export const saveAppData = (data: AppData) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

export const extractGradeFromClassName = (className: string): string => {
  const match = className.match(/\d+/);
  if (!match) return 'LopKhac';
  return `Lop${match[0]}`;
};

export const calculateTotal = (attendance: (number | null)[], fee: number): number => {
  const attendedCount = attendance.filter(val => val === 1).length;
  return attendedCount * fee;
};

// Hàm hỗ trợ fetch với xử lý lỗi CORS và Redirect của Apps Script
const securePost = async (url: string, payload: any) => {
  // Sử dụng mode: 'no-cors' và Content-Type: 'text/plain' để tránh lỗi CORS Preflight trên Vercel
  return fetch(url, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify(payload)
  });
};

export const fetchFromSheet = async (url: string): Promise<any> => {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Lỗi mạng');
    const result = await response.json();
    
    if (result.sheets) {
      const cleanSheets: any = {};
      ["Lop9", "Lop10", "Lop11", "Lop12"].forEach(key => {
        if (result.sheets[key]) {
          const students = result.sheets[key].students.filter((s: any) => 
            s.name && !s.name.includes("68686868")
          );
          cleanSheets[key] = { ...result.sheets[key], students };
        } else {
          cleanSheets[key] = { className: key, students: [] };
        }
      });
      result.sheets = cleanSheets;
    }
    return result;
  } catch (error) {
    console.error("Fetch error:", error);
    throw error;
  }
};

export const syncSettingsToSheet = async (url: string, password: string, fees?: FeeConfig[]): Promise<any> => {
  try {
    await securePost(url, { action: 'updateSettings', password, fees });
    return { success: true };
  } catch (error) {
    throw error;
  }
};

export const syncAttendanceToSheet = async (url: string, className: string, students: any[]): Promise<any> => {
  try {
    await securePost(url, { 
      action: 'updateAttendance', 
      className, 
      students 
    });
    return { success: true };
  } catch (error) {
    throw error;
  }
};
