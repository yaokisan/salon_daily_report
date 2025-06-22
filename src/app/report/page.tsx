'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import NameSelector from '@/components/NameSelector';
import VoiceInput from '@/components/VoiceInput';
import ReportPreview from '@/components/ReportPreview';
import { Staff, VoiceResponse } from '@/types/report';
import { supabase } from '@/lib/supabase';

type Step = 'name-selection' | 'voice-input' | 'preview' | 'completed';

export default function ReportPage() {
  const [step, setStep] = useState<Step>('name-selection');
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [responses, setResponses] = useState<VoiceResponse[]>([]);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleNameSelect = (staff: Staff) => {
    setSelectedStaff(staff);
    setStep('voice-input');
  };

  const handleVoiceComplete = (voiceResponses: VoiceResponse[]) => {
    setResponses(voiceResponses);
    setStep('preview');
  };

  const handleReportEdit = (editedReport: string) => {
    // 編集された内容を保存（必要に応じて）
    console.log('Report edited:', editedReport);
  };

  const handleReportSubmit = async (reportData: { 
    formatted_report: string; 
    raw_responses: VoiceResponse[] 
  }) => {
    if (!selectedStaff) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { error } = await supabase
        .from('reports')
        .insert({
          staff_id: selectedStaff.id,
          date: today,
          raw_responses: reportData.raw_responses,
          formatted_report: reportData.formatted_report
        });

      if (error) throw error;
      
      setStep('completed');
    } catch (err) {
      setError('日報の送信に失敗しました');
      console.error('Submit error:', err);
    }
  };

  const handleBackToVoiceInput = () => {
    setStep('voice-input');
  };

  const handleStartOver = () => {
    setStep('name-selection');
    setSelectedStaff(null);
    setResponses([]);
    setError(null);
  };

  const handleGoHome = () => {
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* ヘッダー */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            日報作成
          </h1>
          {selectedStaff && (
            <p className="text-gray-600">
              {selectedStaff.name}さんの日報作成
            </p>
          )}
        </div>

        {/* エラー表示 */}
        {error && (
          <div className="max-w-2xl mx-auto mb-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700">{error}</p>
              <button 
                onClick={() => setError(null)}
                className="mt-2 text-sm text-red-600 hover:text-red-800"
              >
                × 閉じる
              </button>
            </div>
          </div>
        )}

        {/* ステップ表示 */}
        <div className="max-w-4xl mx-auto">
          {/* ステップインジケーター */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center space-x-4">
              <StepIndicator 
                step={1} 
                title="名前選択" 
                active={step === 'name-selection'} 
                completed={step !== 'name-selection'} 
              />
              <div className="w-8 h-0.5 bg-gray-300"></div>
              <StepIndicator 
                step={2} 
                title="音声入力" 
                active={step === 'voice-input'} 
                completed={step === 'preview' || step === 'completed'} 
              />
              <div className="w-8 h-0.5 bg-gray-300"></div>
              <StepIndicator 
                step={3} 
                title="確認・送信" 
                active={step === 'preview'} 
                completed={step === 'completed'} 
              />
            </div>
          </div>

          {/* コンテンツ */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            {step === 'name-selection' && (
              <NameSelector 
                onSelect={handleNameSelect}
                selectedStaff={selectedStaff}
              />
            )}

            {step === 'voice-input' && (
              <VoiceInput 
                onComplete={handleVoiceComplete} 
                initialResponses={responses}
              />
            )}

            {step === 'preview' && selectedStaff && (
              <ReportPreview
                responses={responses}
                staff={selectedStaff}
                onEdit={handleReportEdit}
                onSubmit={handleReportSubmit}
                onBack={handleBackToVoiceInput}
              />
            )}

            {step === 'completed' && (
              <div className="text-center py-8">
                <div className="mb-6">
                  <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-white text-2xl">✓</span>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">
                    日報を送信しました！
                  </h3>
                  <p className="text-gray-600">
                    {selectedStaff?.name}さん、お疲れさまでした。
                  </p>
                </div>
                
                <div className="flex gap-4 justify-center">
                  <button
                    onClick={handleStartOver}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition duration-200"
                  >
                    別の日報を作成
                  </button>
                  <button
                    onClick={handleGoHome}
                    className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition duration-200"
                  >
                    ホームに戻る
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface StepIndicatorProps {
  step: number;
  title: string;
  active: boolean;
  completed: boolean;
}

function StepIndicator({ step, title, active, completed }: StepIndicatorProps) {
  return (
    <div className="flex flex-col items-center">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
        completed 
          ? 'bg-green-500 text-white' 
          : active 
            ? 'bg-blue-500 text-white' 
            : 'bg-gray-300 text-gray-600'
      }`}>
        {completed ? '✓' : step}
      </div>
      <span className={`mt-1 text-xs ${
        active ? 'text-blue-600 font-medium' : 'text-gray-500'
      }`}>
        {title}
      </span>
    </div>
  );
}