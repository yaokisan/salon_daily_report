import { GoogleGenerativeAI } from '@google/generative-ai';
import { VoiceResponse } from '@/types/report';

const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY!;
const genAI = new GoogleGenerativeAI(apiKey);

export async function correctTranscription(rawText: string, context: string): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    
    const prompt = `以下の音声入力テキストを、文脈を考慮して適切な漢字変換と句読点の追加を行ってください。
美容室での日報作成の回答であることを前提に、自然な日本語に補正してください。

質問の文脈: ${context}

音声入力テキスト: ${rawText}

補正ルール:
- 適切な漢字変換を行う
- 句読点を自然な位置に追加
- 誤認識を文脈から推測して修正
- 音声入力の内容を保持しつつ、読みやすい文章にする
- 余計な装飾や説明は加えない

補正後のテキストのみを返してください。`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const correctedText = response.text().trim();
    
    return correctedText;
  } catch (error) {
    console.error('Error correcting transcription:', error);
    // エラー時は元のテキストを返す
    return rawText;
  }
}

export async function formatReportWithAI(responses: VoiceResponse[], staffName: string): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    
    const prompt = `以下の質問と回答から、美容室の日報を生成してください。

スタッフ名: ${staffName}
日付: ${new Date().toLocaleDateString('ja-JP')}

質問と回答:
${responses.map((r, i) => `質問${i + 1}: ${r.question}\n回答: ${r.answer}`).join('\n\n')}

以下のフォーマットで日報を作成してください：

【日報】[日付]　スタッフ名: [名前]

■ 本日の業務実績
[回答を基に業務内容を整理]

■ 印象に残った接客
[回答を基に記載]

■ 売上・目標達成状況
[回答を基に記載]

■ 課題・改善点
[回答を基に記載]

■ 明日への目標・意気込み
[回答を基に記載]

■ その他・連絡事項
なし`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    console.error('Error formatting report with AI:', error);
    throw error;
  }
}