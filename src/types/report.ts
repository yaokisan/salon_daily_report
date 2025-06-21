export interface Staff {
  id: string;
  name: string;
  created_at: string;
}

export interface VoiceResponse {
  question: string;
  answer: string;
  questionIndex: number;
}

export interface Report {
  id: string;
  staff_id: string;
  date: string;
  raw_responses: VoiceResponse[];
  formatted_report: string;
  created_at: string;
}

export interface ReportFormData {
  staffId: string;
  responses: VoiceResponse[];
}

export const REPORT_QUESTIONS = [
  "今日はどんなお客様の対応をしましたか？",
  "印象に残ったお客様はいらっしゃいましたか？", 
  "今日の売上目標の達成状況はいかがでしたか？",
  "何か困ったことや気になったことはありましたか？",
  "明日に向けて意気込みや目標があれば教えてください"
] as const;