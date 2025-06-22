'use client';

import { useState, useEffect, useRef } from 'react';
import { SpeechRecognition } from '@/lib/speech';
import { VoiceResponse, REPORT_QUESTIONS } from '@/types/report';
import { correctTranscription } from '@/lib/gemini';

interface VoiceInputProps {
  onComplete: (responses: VoiceResponse[]) => void;
  initialResponses?: VoiceResponse[];
}

export default function VoiceInput({ onComplete, initialResponses = [] }: VoiceInputProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<VoiceResponse[]>(initialResponses);
  const [isListening, setIsListening] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [rawTranscript, setRawTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingAnswer, setEditingAnswer] = useState('');
  const [isEditingCurrent, setIsEditingCurrent] = useState(false);
  
  const speechRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    speechRef.current = new SpeechRecognition();
    setSpeechSupported(speechRef.current.isSupported());
  }, []);

  useEffect(() => {
    // 既存の回答がある場合、現在の質問のインデックスを調整
    if (initialResponses.length > 0) {
      const lastAnsweredIndex = Math.max(...initialResponses.map(r => r.questionIndex));
      setCurrentQuestionIndex(Math.min(lastAnsweredIndex + 1, REPORT_QUESTIONS.length - 1));
      
      // 現在の質問に既存の回答がある場合は編集モードに
      const currentAnswer = initialResponses.find(r => r.questionIndex === currentQuestionIndex);
      if (currentAnswer) {
        setEditingAnswer(currentAnswer.answer);
        setIsEditingCurrent(true);
      }
    }
  }, [initialResponses, currentQuestionIndex]);

  const startListening = () => {
    if (!speechRef.current) return;
    
    setIsListening(true);
    setRawTranscript('');
    setCurrentTranscript('');
    setError(null);

    speechRef.current.startListening(
      (transcript) => {
        setRawTranscript(transcript);
      },
      (error) => {
        setError(`音声認識エラー: ${error}`);
        setIsListening(false);
      }
    );
  };

  const stopListening = async () => {
    if (speechRef.current) {
      speechRef.current.stopListening();
    }
    setIsListening(false);

    if (rawTranscript.trim()) {
      setIsProcessing(true);
      try {
        // Gemini APIで文脈補正
        const correctedText = await correctTranscription(
          rawTranscript.trim(),
          REPORT_QUESTIONS[currentQuestionIndex]
        );
        
        // 既存の回答と結合するか、新規作成
        const finalText = editingAnswer 
          ? `${editingAnswer} ${correctedText}`
          : correctedText;
        
        setCurrentTranscript(finalText);
        setEditingAnswer(finalText);
      } catch (error) {
        console.error('Error processing transcript:', error);
        setCurrentTranscript(rawTranscript.trim());
        setEditingAnswer(rawTranscript.trim());
      } finally {
        setIsProcessing(false);
        setRawTranscript('');
      }
    }
  };

  const handleAnswerComplete = () => {
    const answer = editingAnswer || currentTranscript;
    if (!answer.trim()) return;

    const newResponse: VoiceResponse = {
      question: REPORT_QUESTIONS[currentQuestionIndex],
      answer: answer.trim(),
      questionIndex: currentQuestionIndex
    };

    // 既存の回答を更新するか、新規追加
    const existingIndex = responses.findIndex(r => r.questionIndex === currentQuestionIndex);
    let updatedResponses;
    if (existingIndex >= 0) {
      updatedResponses = [...responses];
      updatedResponses[existingIndex] = newResponse;
    } else {
      updatedResponses = [...responses, newResponse].sort((a, b) => a.questionIndex - b.questionIndex);
    }

    setResponses(updatedResponses);
    setCurrentTranscript('');
    setEditingAnswer('');
    setIsEditingCurrent(false);

    if (currentQuestionIndex < REPORT_QUESTIONS.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      onComplete(updatedResponses);
    }
  };

  const goToQuestion = (index: number) => {
    setCurrentQuestionIndex(index);
    const existingAnswer = responses.find(r => r.questionIndex === index);
    if (existingAnswer) {
      setEditingAnswer(existingAnswer.answer);
      setIsEditingCurrent(true);
    } else {
      setEditingAnswer('');
      setIsEditingCurrent(false);
    }
    setCurrentTranscript('');
    stopListening();
  };

  const handleEditChange = (value: string) => {
    setEditingAnswer(value);
    setCurrentTranscript(value);
  };

  if (!speechSupported) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">
          お使いのブラウザは音声入力に対応していません
        </p>
        <p className="text-gray-600">
          Chrome、Safari、Edgeなどの対応ブラウザをご利用ください
        </p>
      </div>
    );
  }

  const currentQuestion = REPORT_QUESTIONS[currentQuestionIndex];
  const progress = ((responses.length) / REPORT_QUESTIONS.length) * 100;

  return (
    <div className="max-w-2xl mx-auto">
      {/* プログレスバー */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>質問 {currentQuestionIndex + 1} / {REPORT_QUESTIONS.length}</span>
          <span>{Math.round(progress)}% 完了</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      {/* 現在の質問 */}
      <div className="bg-blue-50 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold text-blue-800 mb-2">
          質問 {currentQuestionIndex + 1}
        </h3>
        <p className="text-blue-700 text-lg">
          {currentQuestion}
        </p>
      </div>

      {/* 音声入力エリア */}
      <div className="bg-white rounded-lg border-2 border-gray-200 p-6 mb-6">
        <div className="text-center mb-4">
          <button
            onClick={isListening ? stopListening : startListening}
            disabled={isProcessing}
            className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl transition-all duration-200 ${
              isListening 
                ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse' 
                : isProcessing
                  ? 'bg-gray-400 text-white cursor-not-allowed'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            {isListening ? '⏹️' : isProcessing ? '⌛' : '🎤'}
          </button>
          <p className="mt-2 text-sm text-gray-600">
            {isListening ? 'お話しください...' : isProcessing ? '処理中...' : 'マイクボタンを押して開始'}
          </p>
        </div>

        {/* 認識中の音声（ぼかし表示） */}
        {isListening && rawTranscript && (
          <div className="bg-gray-100 rounded p-4 mb-4 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-100 to-transparent animate-pulse"></div>
            <p className="text-gray-400 blur-sm select-none">{rawTranscript}</p>
          </div>
        )}

        {/* 既存の回答または処理済みテキスト */}
        {(editingAnswer || currentTranscript) && !isListening && (
          <div className="mb-4">
            <textarea
              value={editingAnswer || currentTranscript}
              onChange={(e) => handleEditChange(e.target.value)}
              className="w-full p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={4}
              placeholder="回答を入力または編集してください..."
            />
          </div>
        )}

        {/* エラー表示 */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded p-4 mb-4">
            <p className="text-red-700">{error}</p>
          </div>
        )}
      </div>

      {/* コントロールボタン */}
      <div className="flex gap-3">
        {currentQuestionIndex > 0 && (
          <button
            onClick={() => goToQuestion(currentQuestionIndex - 1)}
            className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition duration-200"
          >
            ← 前の質問
          </button>
        )}
        
        <div className="flex-1"></div>
        
        {(editingAnswer || currentTranscript) && (
          <button
            onClick={handleAnswerComplete}
            className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition duration-200"
          >
            {isEditingCurrent ? '更新して次へ' : '次へ'} →
          </button>
        )}
      </div>

      {/* 質問ナビゲーション */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-semibold text-gray-800 mb-3">質問一覧</h4>
        <div className="space-y-2">
          {REPORT_QUESTIONS.map((question, index) => {
            const answer = responses.find(r => r.questionIndex === index);
            const isActive = index === currentQuestionIndex;
            
            return (
              <button
                key={index}
                onClick={() => goToQuestion(index)}
                className={`w-full text-left p-3 rounded-lg transition-all duration-200 ${
                  isActive 
                    ? 'bg-blue-100 border-2 border-blue-500' 
                    : answer 
                      ? 'bg-green-50 border border-green-300 hover:bg-green-100'
                      : 'bg-white border border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-sm ${isActive ? 'font-semibold text-blue-700' : 'text-gray-700'}`}>
                    質問 {index + 1}
                  </span>
                  {answer && (
                    <span className="text-xs text-green-600 font-medium">✓ 回答済み</span>
                  )}
                </div>
                <p className={`text-xs mt-1 ${isActive ? 'text-blue-600' : 'text-gray-500'}`}>
                  {question}
                </p>
                {answer && (
                  <p className="text-xs text-gray-600 mt-2 truncate">
                    {answer.answer}
                  </p>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 完了ボタン */}
      {responses.length === REPORT_QUESTIONS.length && (
        <div className="mt-6 text-center">
          <button
            onClick={() => onComplete(responses)}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition duration-200 shadow-md"
          >
            すべての回答を確認して次へ
          </button>
        </div>
      )}
    </div>
  );
}