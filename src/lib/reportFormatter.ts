import { VoiceResponse } from '@/types/report';

export function formatReport(responses: VoiceResponse[], staffName: string, date: string): string {
  const formatDate = new Date(date).toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'numeric', 
    day: 'numeric',
    weekday: 'short'
  });

  const sections = {
    performance: responses[0]?.answer || '',
    customer: responses[1]?.answer || '',
    sales: responses[2]?.answer || '',
    issues: responses[3]?.answer || '',
    goals: responses[4]?.answer || ''
  };

  return `【日報】${formatDate}　スタッフ名: ${staffName}

■ 本日の業務実績
${sections.performance}

■ 印象に残った接客
${sections.customer}

■ 売上・目標達成状況
${sections.sales}

■ 課題・改善点
${sections.issues}

■ 明日への目標・意気込み
${sections.goals}

■ その他・連絡事項
なし`;
}