'use client';

import { useState, useEffect } from 'react';
import { VoiceResponse, REPORT_QUESTIONS } from '@/types/report';
import VoiceInputAqua from './VoiceInputAqua';

interface VoiceInputProps {
  onComplete: (responses: VoiceResponse[]) => void;
  initialResponses?: VoiceResponse[];
}

export default function VoiceInput({ onComplete, initialResponses = [] }: VoiceInputProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<VoiceResponse[]>(initialResponses);
  const [isVoiceInputOpen, setIsVoiceInputOpen] = useState(false);
  const [editingAnswer, setEditingAnswer] = useState('');

  useEffect(() => {
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

  const handleVoiceInputComplete = (answer: string) => {
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
    setEditingAnswer(answer.trim());
    setIsVoiceInputOpen(false);

    // 最後の質問でない場合は次へ
    if (currentQuestionIndex < REPORT_QUESTIONS.length - 1) {
      setTimeout(() => {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        setEditingAnswer('');
      }, 500);
    }
  };

  const handleManualComplete = () => {
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

    if (currentQuestionIndex < REPORT_QUESTIONS.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setEditingAnswer('');
    }
  };

  const goToQuestion = (index: number) => {
    setCurrentQuestionIndex(index);
    const existingAnswer = responses.find(r => r.questionIndex === index);
    setEditingAnswer(existingAnswer ? existingAnswer.answer : '');
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

      {/* 入力エリア */}
      <div className="bg-white rounded-lg border-2 border-gray-200 p-6 mb-6">
        {/* 音声入力ボタン */}
        <div className="text-center mb-4">
          <button
            onClick={() => setIsVoiceInputOpen(true)}
            className="group relative w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
          >
            <span className="text-3xl">🎤</span>
            <div className="absolute inset-0 rounded-full bg-blue-400 opacity-0 group-hover:opacity-20 animate-ping"></div>
          </button>
          <p className="mt-3 text-sm text-gray-600">
            マイクボタンを押して音声入力
          </p>
        </div>

        {/* テキスト編集エリア */}
        <div className="mb-4">
          <textarea
            value={editingAnswer}
            onChange={(e) => setEditingAnswer(e.target.value)}
            className="w-full p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={4}
            placeholder="音声入力または直接入力してください..."
          />
        </div>

        {/* 既存の回答がある場合の表示 */}
        {currentAnswer && currentAnswer.answer !== editingAnswer && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">保存済みの回答:</p>
            <p className="text-gray-800">{currentAnswer.answer}</p>
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
        
        {editingAnswer.trim() && (
          <button
            onClick={handleManualComplete}
            className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition duration-200"
          >
            {currentAnswer ? '更新して次へ' : '次へ'} →
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

      {/* AQUA VOICEスタイルの音声入力モーダル */}
      {isVoiceInputOpen && (
        <VoiceInputAqua
          questionText={currentQuestion}
          onComplete={handleVoiceInputComplete}
          onCancel={() => setIsVoiceInputOpen(false)}
          initialValue={editingAnswer}
        />
      )}
    </div>
  );
}