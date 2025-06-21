'use client';

import { useState, useEffect, useRef } from 'react';
import { SpeechRecognition } from '@/lib/speech';
import { VoiceResponse, REPORT_QUESTIONS } from '@/types/report';

interface VoiceInputProps {
  onComplete: (responses: VoiceResponse[]) => void;
}

export default function VoiceInput({ onComplete }: VoiceInputProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<VoiceResponse[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [speechSupported, setSpeechSupported] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const speechRef = useRef<SpeechRecognition | null>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    speechRef.current = new SpeechRecognition();
    setSpeechSupported(speechRef.current.isSupported());
  }, []);

  const startListening = () => {
    if (!speechRef.current) return;
    
    setIsListening(true);
    setCurrentTranscript('');
    setError(null);

    speechRef.current.startListening(
      (transcript, isFinal) => {
        setCurrentTranscript(transcript);
        
        // 3秒間の無音で次の質問へ
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
        }
        
        if (isFinal && transcript.trim()) {
          silenceTimerRef.current = setTimeout(() => {
            handleAnswerComplete(transcript.trim());
          }, 3000);
        }
      },
      (error) => {
        setError(`音声認識エラー: ${error}`);
        setIsListening(false);
      }
    );
  };

  const stopListening = () => {
    if (speechRef.current) {
      speechRef.current.stopListening();
    }
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
    }
    setIsListening(false);
  };

  const handleAnswerComplete = (answer: string) => {
    const newResponse: VoiceResponse = {
      question: REPORT_QUESTIONS[currentQuestionIndex],
      answer,
      questionIndex: currentQuestionIndex
    };

    const updatedResponses = [...responses, newResponse];
    setResponses(updatedResponses);
    setCurrentTranscript('');
    stopListening();

    if (currentQuestionIndex < REPORT_QUESTIONS.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      onComplete(updatedResponses);
    }
  };

  const handleManualNext = () => {
    if (currentTranscript.trim()) {
      handleAnswerComplete(currentTranscript.trim());
    }
  };

  const goToPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setResponses(responses.slice(0, -1));
      stopListening();
    }
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
  const progress = ((currentQuestionIndex) / REPORT_QUESTIONS.length) * 100;

  return (
    <div className="max-w-2xl mx-auto">
      {/* プログレスバー */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>質問 {currentQuestionIndex + 1} / {REPORT_QUESTIONS.length}</span>
          <span>{Math.round(progress)}%</span>
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
            className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl transition-all duration-200 ${
              isListening 
                ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse' 
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            {isListening ? '⏹️' : '🎤'}
          </button>
          <p className="mt-2 text-sm text-gray-600">
            {isListening ? 'お話しください...' : 'マイクボタンを押して開始'}
          </p>
        </div>

        {/* 認識中のテキスト */}
        {currentTranscript && (
          <div className="bg-gray-50 rounded p-4 mb-4">
            <p className="text-gray-700">{currentTranscript}</p>
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
            onClick={goToPreviousQuestion}
            className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition duration-200"
          >
            ← 前の質問
          </button>
        )}
        
        <div className="flex-1"></div>
        
        {currentTranscript.trim() && (
          <button
            onClick={handleManualNext}
            className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition duration-200"
          >
            次へ →
          </button>
        )}
      </div>

      {/* 過去の回答 */}
      {responses.length > 0 && (
        <div className="mt-8">
          <h4 className="font-semibold text-gray-800 mb-4">回答済み</h4>
          <div className="space-y-3">
            {responses.map((response, index) => (
              <div key={index} className="bg-green-50 rounded p-3">
                <p className="text-sm text-green-700 font-medium mb-1">
                  質問 {index + 1}: {response.question}
                </p>
                <p className="text-green-800">{response.answer}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}