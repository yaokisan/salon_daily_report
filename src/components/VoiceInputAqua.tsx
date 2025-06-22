'use client';

import { useState, useEffect, useRef } from 'react';
import { SpeechRecognition } from '@/lib/speech';
import { correctTranscription } from '@/lib/gemini';

interface VoiceInputAquaProps {
  questionText: string;
  onComplete: (answer: string) => void;
  onCancel?: () => void;
  initialValue?: string;
}

interface TextSegment {
  id: string;
  text: string;
  isConfirmed: boolean;
  timestamp: number;
}

export default function VoiceInputAqua({ questionText, onComplete, onCancel, initialValue = '' }: VoiceInputAquaProps) {
  const [isListening, setIsListening] = useState(false);
  const [segments, setSegments] = useState<TextSegment[]>([]);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const speechRef = useRef<SpeechRecognition | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastTranscriptRef = useRef<string>('');
  const segmentIdRef = useRef(0);

  useEffect(() => {
    speechRef.current = new SpeechRecognition();
    
    // 初期値がある場合はセグメントに追加
    if (initialValue) {
      setSegments([{
        id: `segment-${segmentIdRef.current++}`,
        text: initialValue,
        isConfirmed: true,
        timestamp: Date.now()
      }]);
    }
  }, [initialValue]);

  useEffect(() => {
    // 自動スクロール
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [segments, currentTranscript]);

  const startListening = () => {
    if (!speechRef.current) return;
    
    setIsListening(true);
    setCurrentTranscript('');
    setError(null);
    lastTranscriptRef.current = '';

    speechRef.current.startListening(
      async (transcript, isFinal) => {
        // リアルタイムで未確定テキストを更新
        setCurrentTranscript(transcript);

        // 最終的な認識結果の場合
        if (isFinal && transcript.trim() && transcript !== lastTranscriptRef.current) {
          lastTranscriptRef.current = transcript;
          
          // 処理中状態に
          setIsProcessing(true);
          
          try {
            // Gemini APIで文脈補正
            const correctedText = await correctTranscription(
              transcript.trim(),
              questionText
            );
            
            // 確定セグメントとして追加
            const newSegment: TextSegment = {
              id: `segment-${segmentIdRef.current++}`,
              text: correctedText,
              isConfirmed: true,
              timestamp: Date.now()
            };
            
            setSegments(prev => [...prev, newSegment]);
            setCurrentTranscript('');
          } catch (error) {
            console.error('Error processing transcript:', error);
            // エラー時は元のテキストをそのまま使用
            const newSegment: TextSegment = {
              id: `segment-${segmentIdRef.current++}`,
              text: transcript.trim(),
              isConfirmed: true,
              timestamp: Date.now()
            };
            setSegments(prev => [...prev, newSegment]);
          } finally {
            setIsProcessing(false);
            setCurrentTranscript('');
          }
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
    setIsListening(false);
    
    // 未確定のテキストがある場合は確定させる
    if (currentTranscript.trim()) {
      const newSegment: TextSegment = {
        id: `segment-${segmentIdRef.current++}`,
        text: currentTranscript.trim(),
        isConfirmed: true,
        timestamp: Date.now()
      };
      setSegments(prev => [...prev, newSegment]);
      setCurrentTranscript('');
    }
  };

  const handleComplete = () => {
    stopListening();
    const fullText = segments.map(seg => seg.text).join(' ');
    onComplete(fullText);
  };

  const handleClear = () => {
    setSegments([]);
    setCurrentTranscript('');
    lastTranscriptRef.current = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 背景のオーバーレイ */}
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      
      {/* メインコンテナ（AQUA VOICEスタイル） */}
      <div className="relative w-full max-w-2xl">
        {/* 質問表示 */}
        <div className="mb-4 bg-white/10 backdrop-blur-md rounded-lg p-4">
          <p className="text-white/80 text-sm">{questionText}</p>
        </div>
        
        {/* 音声入力コンテナ */}
        <div className="bg-black/90 backdrop-blur-md rounded-2xl shadow-2xl overflow-hidden">
          {/* コンテンツエリア */}
          <div 
            ref={containerRef}
            className="min-h-[200px] max-h-[400px] overflow-y-auto p-6 space-y-2"
          >
            {/* 確定済みテキスト */}
            {segments.map((segment) => (
              <div key={segment.id} className="text-white/90 leading-relaxed">
                {segment.text}
              </div>
            ))}
            
            {/* 処理中のテキスト（モザイク表示） */}
            {(isListening || isProcessing) && currentTranscript && (
              <div className="relative">
                <div className="text-white/30 blur-sm select-none">
                  {currentTranscript}
                </div>
                {isProcessing && (
                  <div className="absolute inset-0 flex items-center">
                    <div className="text-xs text-white/40">処理中...</div>
                  </div>
                )}
              </div>
            )}
            
            {/* エラー表示 */}
            {error && (
              <div className="text-red-400 text-sm">
                {error}
              </div>
            )}
          </div>
          
          {/* コントロールバー */}
          <div className="bg-black/50 border-t border-white/10 px-6 py-4">
            <div className="flex items-center justify-between">
              {/* 左側：録音インジケーターとステータス */}
              <div className="flex items-center space-x-3">
                {/* 録音ボタン/インジケーター */}
                <button
                  onClick={isListening ? stopListening : startListening}
                  disabled={isProcessing}
                  className="relative"
                >
                  <div className={`w-4 h-4 rounded-full transition-all duration-300 ${
                    isListening 
                      ? 'bg-blue-500 animate-pulse shadow-lg shadow-blue-500/50' 
                      : isProcessing
                        ? 'bg-gray-500'
                        : 'bg-gray-400 hover:bg-blue-400'
                  }`} />
                  {isListening && (
                    <div className="absolute inset-0 rounded-full bg-blue-400 animate-ping" />
                  )}
                </button>
                
                {/* ステータステキスト */}
                <span className="text-white/60 text-sm">
                  {isListening ? '聞いています...' : isProcessing ? '処理中...' : 'クリックして話す'}
                </span>
              </div>
              
              {/* 右側：アクションボタン */}
              <div className="flex items-center space-x-2">
                {/* クリアボタン */}
                {segments.length > 0 && (
                  <button
                    onClick={handleClear}
                    className="px-3 py-1 text-sm text-white/60 hover:text-white/80 transition-colors"
                  >
                    クリア
                  </button>
                )}
                
                {/* 完了ボタン */}
                <button
                  onClick={handleComplete}
                  disabled={segments.length === 0 && !currentTranscript}
                  className="px-4 py-1 text-sm bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  完了
                </button>
                
                {/* キャンセルボタン */}
                {onCancel && (
                  <button
                    onClick={onCancel}
                    className="px-3 py-1 text-sm text-white/60 hover:text-white/80 transition-colors"
                  >
                    キャンセル
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}