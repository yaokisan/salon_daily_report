'use client';

import { useState, useEffect, useRef } from 'react';
import { VoiceResponse, REPORT_QUESTIONS } from '@/types/report';
import { SpeechRecognition } from '@/lib/speech';
import { correctTranscription } from '@/lib/gemini';

interface VoiceInputProps {
  onComplete: (responses: VoiceResponse[]) => void;
  initialResponses?: VoiceResponse[];
}

export default function VoiceInput({ onComplete, initialResponses = [] }: VoiceInputProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<VoiceResponse[]>(initialResponses);
  const [editingAnswer, setEditingAnswer] = useState('');
  
  // 音声入力関連の状態
  const [isListening, setIsListening] = useState(false);
  const [rawTranscript, setRawTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const speechRef = useRef<SpeechRecognition | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    speechRef.current = new SpeechRecognition();
    
    // 既存の回答がある場合、現在の質問のインデックスを調整
    if (initialResponses.length > 0) {
      const lastAnsweredIndex = Math.max(...initialResponses.map(r => r.questionIndex));
      setCurrentQuestionIndex(Math.min(lastAnsweredIndex + 1, REPORT_QUESTIONS.length - 1));
      
      // 現在の質問に既存の回答がある場合
      const currentAnswer = initialResponses.find(r => r.questionIndex === currentQuestionIndex);
      if (currentAnswer) {
        setEditingAnswer(currentAnswer.answer);
      }
    }
  }, [initialResponses, currentQuestionIndex]);

  const startListening = () => {
    if (!speechRef.current) return;
    
    setIsListening(true);
    setRawTranscript('');
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
          rawTranscript.trim()
        );
        
        // 既存のテキストに追加（または新規作成）
        const newText = editingAnswer 
          ? `${editingAnswer} ${correctedText}`
          : correctedText;
        
        setEditingAnswer(newText);
      } catch (error) {
        console.error('Error processing transcript:', error);
        // エラー時は元のテキストをそのまま使用
        const newText = editingAnswer 
          ? `${editingAnswer} ${rawTranscript.trim()}`
          : rawTranscript.trim();
        setEditingAnswer(newText);
      } finally {
        setIsProcessing(false);
        setRawTranscript('');
      }
    }
  };

  const handleSaveAnswer = () => {
    if (!editingAnswer.trim()) return;

    const newResponse: VoiceResponse = {
      question: REPORT_QUESTIONS[currentQuestionIndex],
      answer: editingAnswer.trim(),
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

    // 次の質問へ
    if (currentQuestionIndex < REPORT_QUESTIONS.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setEditingAnswer('');
    }
  };

  const goToQuestion = (index: number) => {
    setCurrentQuestionIndex(index);
    const existingAnswer = responses.find(r => r.questionIndex === index);
    setEditingAnswer(existingAnswer ? existingAnswer.answer : '');
    
    // 音声入力を停止
    if (isListening) {
      stopListening();
    }
  };

  const currentQuestion = REPORT_QUESTIONS[currentQuestionIndex];
  const progress = ((responses.length) / REPORT_QUESTIONS.length) * 100;
  const currentAnswer = responses.find(r => r.questionIndex === currentQuestionIndex);

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

      {/* 回答入力エリア */}
      <div className="bg-white rounded-lg border-2 border-gray-200 p-8 mb-6">
        {/* 回答入力フィールド */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-medium text-gray-700">
              回答内容
            </label>
            
            {/* 音声入力コントロール */}
            <div className="flex items-center space-x-3">
              {/* 音声入力ボタン */}
              <button
                onClick={isListening ? stopListening : startListening}
                disabled={isProcessing}
                className={`relative p-3 rounded-full shadow-lg transition-all duration-200 ${
                  isListening 
                    ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse' 
                    : isProcessing
                      ? 'bg-gray-400 text-white cursor-not-allowed'
                      : 'bg-blue-500 hover:bg-blue-600 text-white transform hover:scale-105'
                }`}
              >
                {isListening ? (
                  <div className="w-4 h-4 bg-white rounded-sm"></div>
                ) : isProcessing ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
              
              {/* ステータス表示 */}
              <span className="text-sm text-gray-600">
                {isListening ? '聞いています...' : isProcessing ? '処理中...' : '音声入力'}
              </span>
            </div>
          </div>
          
          {/* テキストエリア */}
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={editingAnswer}
              onChange={(e) => setEditingAnswer(e.target.value)}
              className="w-full p-6 text-base border-2 border-gray-300 rounded-xl resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              rows={8}
              placeholder="音声入力ボタンを押して話すか、こちらに直接入力してください..."
            />
            
            {/* 音声認識中のオーバーレイ（モザイク表示） */}
            {(isListening || isProcessing) && rawTranscript && (
              <div className="absolute inset-0 bg-black/5 rounded-xl flex items-end p-6">
                <div className="bg-white/90 backdrop-blur-sm rounded-lg p-4 w-full">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className={`w-2 h-2 rounded-full ${isListening ? 'bg-red-500 animate-pulse' : 'bg-gray-500'}`}></div>
                    <span className="text-xs text-gray-600">
                      {isListening ? '音声認識中...' : '処理中...'}
                    </span>
                  </div>
                  <div className="text-gray-500 blur-sm select-none">
                    {rawTranscript}
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex justify-between items-center mt-2">
            <div className="text-sm text-gray-500">
              {editingAnswer.length} 文字
            </div>
            
            {/* 回答保存ボタン */}
            {editingAnswer.trim() && (
              <button
                onClick={handleSaveAnswer}
                className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition duration-200 text-sm"
              >
                {currentAnswer ? '回答を更新して次へ' : '回答を保存して次へ'} →
              </button>
            )}
          </div>
        </div>

        {/* エラー表示 */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* 既存の回答がある場合の表示 */}
        {currentAnswer && currentAnswer.answer !== editingAnswer && (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-700 font-medium mb-2">以前の回答:</p>
            <p className="text-blue-800">{currentAnswer.answer}</p>
            <button
              onClick={() => setEditingAnswer(currentAnswer.answer)}
              className="mt-2 text-sm text-blue-600 hover:text-blue-800 underline"
            >
              この回答を復元
            </button>
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
      </div>

      {/* 質問ナビゲーション（コンパクト版） */}
      {responses.length > 0 && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex flex-wrap gap-2">
            {REPORT_QUESTIONS.map((_, index) => {
              const answer = responses.find(r => r.questionIndex === index);
              const isActive = index === currentQuestionIndex;
              
              return (
                <button
                  key={index}
                  onClick={() => goToQuestion(index)}
                  className={`px-3 py-1 rounded-full text-sm transition-all duration-200 ${
                    isActive 
                      ? 'bg-blue-500 text-white' 
                      : answer 
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                  }`}
                >
                  {index + 1}
                  {answer && <span className="ml-1">✓</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}

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