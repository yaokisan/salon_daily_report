'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminReportList from '@/components/AdminReportList';
import { supabase } from '@/lib/supabase';
import { Staff } from '@/types/report';

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'reports' | 'staff' | 'questions'>('reports');
  const [staff, setStaff] = useState<Staff[]>([]);
  const [newStaffName, setNewStaffName] = useState('');
  const [isAddingStaff, setIsAddingStaff] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // 認証チェック
    const session = localStorage.getItem('admin_session');
    if (session === 'true') {
      setIsAuthenticated(true);
      fetchStaff();
    } else {
      router.push('/admin/login');
    }
    setLoading(false);
  }, [router]);

  const fetchStaff = async () => {
    try {
      const { data, error } = await supabase
        .from('staff')
        .select('*')
        .order('name');

      if (error) throw error;
      setStaff(data || []);
    } catch (err) {
      console.error('Error fetching staff:', err);
    }
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffName.trim()) return;

    setIsAddingStaff(true);
    try {
      const { error } = await supabase
        .from('staff')
        .insert({ name: newStaffName.trim() });

      if (error) throw error;

      setNewStaffName('');
      fetchStaff();
    } catch (err) {
      console.error('Error adding staff:', err);
      alert('スタッフの追加に失敗しました');
    } finally {
      setIsAddingStaff(false);
    }
  };

  const handleDeleteStaff = async (id: string) => {
    if (!confirm('このスタッフを削除しますか？')) return;

    try {
      const { error } = await supabase
        .from('staff')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchStaff();
    } catch (err) {
      console.error('Error deleting staff:', err);
      alert('スタッフの削除に失敗しました');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_session');
    router.push('/admin/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* ヘッダー */}
      <header className="bg-white shadow">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-800">
              日報管理システム
            </h1>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/')}
                className="text-gray-600 hover:text-gray-800"
              >
                ホームへ
              </button>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition duration-200"
              >
                ログアウト
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* タブナビゲーション */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('reports')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'reports'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                📊 日報一覧
              </button>
              <button
                onClick={() => setActiveTab('staff')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'staff'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                👥 スタッフ管理
              </button>
              <button
                onClick={() => setActiveTab('questions')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'questions'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                ❓ 質問管理
              </button>
            </nav>
          </div>
        </div>

        {/* コンテンツ */}
        {activeTab === 'reports' && <AdminReportList />}
        
        {activeTab === 'questions' && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">質問管理</h3>
              <p className="text-gray-600 mb-6">日報作成時の質問内容を編集・管理できます</p>
              <button
                onClick={() => router.push('/admin/questions')}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition duration-200"
              >
                質問管理ページへ →
              </button>
            </div>
          </div>
        )}

        {activeTab === 'staff' && (
          <div className="space-y-6">
            {/* スタッフ追加 */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                新しいスタッフを追加
              </h3>
              <form onSubmit={handleAddStaff} className="flex gap-4">
                <input
                  type="text"
                  value={newStaffName}
                  onChange={(e) => setNewStaffName(e.target.value)}
                  placeholder="スタッフ名を入力"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <button
                  type="submit"
                  disabled={isAddingStaff}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition duration-200 disabled:opacity-50"
                >
                  {isAddingStaff ? '追加中...' : '追加'}
                </button>
              </form>
            </div>

            {/* スタッフ一覧 */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800">
                  スタッフ一覧 ({staff.length}人)
                </h3>
              </div>
              
              {staff.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">スタッフが登録されていません</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {staff.map((member) => (
                    <div
                      key={member.id}
                      className="px-6 py-4 flex items-center justify-between"
                    >
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {member.name}
                        </h4>
                        <p className="text-sm text-gray-500">
                          登録日: {new Date(member.created_at).toLocaleDateString('ja-JP')}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteStaff(member.id)}
                        className="text-red-600 hover:text-red-800 font-medium"
                      >
                        削除
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}