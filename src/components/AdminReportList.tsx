'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Report, Staff, VoiceResponse } from '@/types/report';

interface ReportWithStaff extends Report {
  staff: Staff;
}

export default function AdminReportList() {
  const [reports, setReports] = useState<ReportWithStaff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<ReportWithStaff | null>(null);
  const [dateFilter, setDateFilter] = useState('');

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select(`
          *,
          staff (
            id,
            name,
            created_at
          )
        `)
        .order('date', { ascending: false });

      if (error) throw error;

      setReports(data || []);
    } catch (err) {
      setError('日報の取得に失敗しました');
      console.error('Error fetching reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredReports = reports.filter(report => {
    if (!dateFilter) return true;
    return report.date === dateFilter;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      weekday: 'short'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">{error}</p>
        <button 
          onClick={fetchReports}
          className="mt-2 text-blue-600 hover:text-blue-800"
        >
          再試行
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* フィルター */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">フィルター</h3>
        <div className="flex gap-4">
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
              日付
            </label>
            <input
              type="date"
              id="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={() => setDateFilter('')}
              className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-md transition duration-200"
            >
              クリア
            </button>
          </div>
        </div>
      </div>

      {/* 統計情報 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 rounded-lg p-4">
          <h4 className="font-semibold text-blue-800">本日の日報</h4>
          <p className="text-2xl font-bold text-blue-600">
            {reports.filter(r => r.date === new Date().toISOString().split('T')[0]).length}
          </p>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <h4 className="font-semibold text-green-800">今月の日報</h4>
          <p className="text-2xl font-bold text-green-600">
            {reports.filter(r => r.date.startsWith(new Date().toISOString().slice(0, 7))).length}
          </p>
        </div>
        <div className="bg-purple-50 rounded-lg p-4">
          <h4 className="font-semibold text-purple-800">総日報数</h4>
          <p className="text-2xl font-bold text-purple-600">{reports.length}</p>
        </div>
      </div>

      {/* 日報一覧 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">
            日報一覧 ({filteredReports.length}件)
          </h3>
        </div>
        
        {filteredReports.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">該当する日報がありません</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredReports.map((report) => (
              <div
                key={report.id}
                className="px-6 py-4 hover:bg-gray-50 cursor-pointer transition duration-200"
                onClick={() => setSelectedReport(report)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">
                      {report.staff.name}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {formatDate(report.date)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">
                      {new Date(report.created_at).toLocaleString('ja-JP')}
                    </p>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      提出済み
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 日報詳細モーダル */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-blue-600 text-white p-6 rounded-t-lg">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold">
                    {selectedReport.staff.name}さんの日報
                  </h3>
                  <p className="text-blue-100">
                    {formatDate(selectedReport.date)}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedReport(null)}
                  className="text-white hover:text-gray-200 text-2xl"
                >
                  ×
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <pre className="whitespace-pre-wrap font-sans text-gray-800 leading-relaxed">
                  {selectedReport.formatted_report}
                </pre>
              </div>
              
              <div className="border-t pt-6">
                <h4 className="font-semibold text-gray-800 mb-4">音声入力の詳細</h4>
                <div className="space-y-3">
                  {selectedReport.raw_responses.map((response: VoiceResponse, index: number) => (
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
          </div>
        </div>
      )}
    </div>
  );
}