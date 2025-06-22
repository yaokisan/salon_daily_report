import { GoogleGenerativeAI } from '@google/generative-ai';
import { VoiceResponse } from '@/types/report';

const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY!;
const genAI = new GoogleGenerativeAI(apiKey);

export async function correctTranscription(rawText: string): Promise<string> {
  // 短いテキストや空の場合は補正しない
  if (!rawText || rawText.trim().length < 3) {
    return rawText;
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    
    const prompt = `以下の音声入力テキストを最小限の補正のみ行ってください。
話した内容をそのまま尊重し、必要最小限の修正のみを実施してください。

音声入力テキスト: ${rawText}

補正ルール:
- 明らかな誤字・脱字のみを修正
- 句読点を自然な位置に追加
- ひらがな→漢字変換は控えめに（一般的な単語のみ）
- 話し方や表現を変更しない
- 文章の構造や内容は一切変更しない
- 「ここに入っている」「えーっと」などの自然な話し言葉はそのまま保持

元の音声入力の自然さを保った補正後テキストのみを返してください。`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const correctedText = response.text().trim();
    
    return correctedText;
  } catch (error) {
    console.error('Error correcting transcription:', error);
    
    // API制限やサービス不可の場合は元のテキストを返す
    if (error instanceof Error) {
      const errorMessage = error.message;
      if (errorMessage.includes('503') || 
          errorMessage.includes('429') || 
          errorMessage.includes('quota') ||
          errorMessage.includes('unavailable')) {
        console.warn('Gemini API temporarily unavailable, using original text');
        return rawText;
      }
    }
    
    // その他のエラーも元のテキストを返す
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