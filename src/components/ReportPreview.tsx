'use client';

import { useState } from 'react';
import { VoiceResponse, Staff } from '@/types/report';
import { formatReport } from '@/lib/reportFormatter';

interface ReportPreviewProps {
  responses: VoiceResponse[];
  staff: Staff;
  onEdit: (editedReport: string) => void;
  onSubmit: (reportData: { formatted_report: string; raw_responses: VoiceResponse[] }) => void;
  onBack: () => void;
}

export default function ReportPreview({ 
  responses, 
  staff, 
  onEdit, 
  onSubmit, 
  onBack 
}: ReportPreviewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedReport, setEditedReport] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const today = new Date().toISOString().split('T')[0];
  const formattedReport = formatReport(responses, staff.name, today);

  const handleEditToggle = () => {
    if (!isEditing) {
      setEditedReport(formattedReport);
    }
    setIsEditing(!isEditing);
  };

  const handleSaveEdit = () => {
    onEdit(editedReport);
    setIsEditing(false);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit({
        formatted_report: isEditing ? editedReport : formattedReport,
        raw_responses: responses
      });
    } catch (error) {
      console.error('Submit error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg">
        {/* ヘッダー */}
        <div className="bg-blue-600 text-white p-6 rounded-t-lg">
          <h2 className="text-2xl font-bold">日報プレビュー</h2>
          <p className="text-blue-100 mt-1">
            内容を確認して、必要に応じて修正してください
          </p>
        </div>

        {/* プレビュー内容 */}
        <div className="p-6">
          {isEditing ? (
            <div>
              <textarea
                value={editedReport}
                onChange={(e) => setEditedReport(e.target.value)}
                className="w-full h-96 p-4 border border-gray-300 rounded-lg font-mono text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="日報の内容を編集してください..."
              />
              <div className="flex gap-3 mt-4">
                <button
                  onClick={handleSaveEdit}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition duration-200"
                >
                  保存
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition duration-200"
                >
                  キャンセル
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg p-6">
              <pre className="whitespace-pre-wrap font-sans text-gray-800 leading-relaxed">
                {formattedReport}
              </pre>
            </div>
          )}
        </div>

        {/* アクションボタン */}
        <div className="bg-gray-50 px-6 py-4 rounded-b-lg">
          <div className="flex justify-between items-center">
            <button
              onClick={onBack}
              className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition duration-200"
              disabled={isSubmitting}
            >
              ← 戻る
            </button>
            
            <div className="flex gap-3">
              <button
                onClick={handleEditToggle}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition duration-200"
                disabled={isSubmitting}
              >
                {isEditing ? '編集終了' : '✏️ 編集'}
              </button>
              
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                    送信中...
                  </>
                ) : (
                  '📤 日報を送信'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 音声回答の詳細（デバッグ用） */}
      <div className="mt-8 bg-white rounded-lg shadow p-6">
        <h3 className="font-semibold text-gray-800 mb-4">音声入力の詳細</h3>
        <div className="space-y-3">
          {responses.map((response, index) => (
            <div key={index} className="border-l-4 border-blue-500 pl-4">
              <p className="text-sm font-medium text-gray-700">
                質問 {index + 1}: {response.question}
              </p>
              <p className="text-gray-600 mt-1">{response.answer}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}