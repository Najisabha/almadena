const HISTORY_KEY = 'almadena_mock_exam_history';

export interface ExamHistoryEntry {
  id: string;
  date: string;
  licenseCode: string;
  licenseName: string;
  examNumber: number;
  score: number;
  total: number;
  percentage: number;
  passed: boolean;
}

export function readExamHistory(): ExamHistoryEntry[] {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
  } catch {
    return [];
  }
}

export function appendExamHistory(entry: ExamHistoryEntry) {
  const existing = readExamHistory();
  const updated = [entry, ...existing].slice(0, 50);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
}

export function clearExamHistory() {
  localStorage.removeItem(HISTORY_KEY);
}
