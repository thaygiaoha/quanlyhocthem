
export interface Student {
  stt: number;
  name: string;
  class: string;
  school: string;
  phoneNumber: string;
  attendance: (number | null)[];
  totalAmount: number;
}

export interface ClassSheet {
  className: string;
  students: Student[];
}

export interface FeeConfig {
  className: string;
  fee: number;
}

export interface AppData {
  sheets: { [key: string]: ClassSheet };
  fees: FeeConfig[];
  passwordC2: string;
  sheetLink: string;
}

export enum ViewMode {
  DASHBOARD = 'dashboard',
  IMPORT = 'import',
  LIST = 'list',
  ATTENDANCE = 'attendance',
  SETTINGS = 'settings',
  GEMINI_AI = 'gemini'
}
