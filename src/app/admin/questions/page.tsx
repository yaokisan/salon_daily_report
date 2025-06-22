'use client';

import { useState, useEffect } from 'react';
import { Question, REPORT_QUESTIONS } from '@/types/report';
import { supabase } from '@/lib/supabase';

export default function QuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [newQuestionText, setNewQuestionText] = useState('');
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [showSQL, setShowSQL] = useState(false);

  // 質問一覧を取得
  const fetchQuestions = async () => {
    try {
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .order('order_index', { ascending: true });

      if (error) {
        // テーブルが存在しない場合は初期データで作成
        console.warn('Questions table not found, creating with default data');
        await createQuestionsTable();
        return;
      }
      
      setQuestions(data || []);
    } catch (err) {
      console.error('Error fetching questions:', err);
      // エラー時は既存のREPORT_QUESTIONSをフォールバックとして使用
      const fallbackQuestions: Question[] = REPORT_QUESTIONS.map((text, index) => ({
        id: `fallback-${index}`,
        text,
        order_index: index + 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));
      setQuestions(fallbackQuestions);
      setError('質問テーブルが見つかりません。デフォルト質問を表示しています。');
    } finally {
      setLoading(false);
    }
  };

  // questionsテーブルを作成
  const createQuestionsTable = async () => {
    try {
      // まずテーブルの存在確認
      const { data: tableExists } = await supabase
        .from('questions')
        .select('id')
        .limit(1);

      if (!tableExists) {
        // テーブルが存在しない場合のフォールバック
        const fallbackQuestions: Question[] = REPORT_QUESTIONS.map((text, index) => ({
          id: `default-${index}`,
          text,
          order_index: index + 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }));
        setQuestions(fallbackQuestions);
        setError('questionsテーブルが設定されていません。Supabaseでテーブルを作成してください。');
      }
    } catch (err) {
      console.error('Error checking questions table:', err);
      setError('データベース接続に問題があります');
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 質問を追加
  const addQuestion = async () => {
    if (!newQuestionText.trim()) return;

    // フォールバックデータの場合は追加不可
    if (questions.some(q => q.id.startsWith('fallback-') || q.id.startsWith('default-'))) {
      setError('questionsテーブルを作成してから質問を追加してください');
      return;
    }

    try {
      const maxOrder = Math.max(...questions.map(q => q.order_index), 0);
      const { data, error } = await supabase
        .from('questions')
        .insert([{
          text: newQuestionText.trim(),
          order_index: maxOrder + 1
        }])
        .select()
        .single();

      if (error) throw error;

      setQuestions([...questions, data]);
      setNewQuestionText('');
      setIsAddingNew(false);
    } catch (err) {
      console.error('Error adding question:', err);
      setError('質問の追加に失敗しました');
    }
  };

  // 質問を更新
  const updateQuestion = async (question: Question) => {
    try {
      const { error } = await supabase
        .from('questions')
        .update({ 
          text: question.text,
          updated_at: new Date().toISOString()
        })
        .eq('id', question.id);

      if (error) throw error;

      setQuestions(questions.map(q => 
        q.id === question.id ? { ...question, updated_at: new Date().toISOString() } : q
      ));
      setEditingQuestion(null);
    } catch (err) {
      console.error('Error updating question:', err);
      setError('質問の更新に失敗しました');
    }
  };

  // 質問を削除
  const deleteQuestion = async (questionId: string) => {
    if (!confirm('この質問を削除しますか？')) return;

    try {
      const { error } = await supabase
        .from('questions')
        .delete()
        .eq('id', questionId);

      if (error) throw error;

      setQuestions(questions.filter(q => q.id !== questionId));
    } catch (err) {
      console.error('Error deleting question:', err);
      setError('質問の削除に失敗しました');
    }
  };

  // 質問の順序を変更
  const moveQuestion = async (questionId: string, direction: 'up' | 'down') => {
    const currentIndex = questions.findIndex(q => q.id === questionId);
    if (currentIndex === -1) return;

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= questions.length) return;

    const newQuestions = [...questions];
    [newQuestions[currentIndex], newQuestions[targetIndex]] = [newQuestions[targetIndex], newQuestions[currentIndex]];

    // 順序を更新
    const updates = newQuestions.map((q, index) => ({
      id: q.id,
      order: index + 1
    }));

    try {
      for (const update of updates) {
        const { error } = await supabase
          .from('questions')
          .update({ order_index: update.order })
          .eq('id', update.id);
        
        if (error) throw error;
      }

      setQuestions(newQuestions.map((q, index) => ({ ...q, order_index: index + 1 })));
    } catch (err) {
      console.error('Error updating question order:', err);
      setError('質問の順序変更に失敗しました');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">質問管理</h1>
          <p className="text-gray-600">日報作成時の質問内容を編集できます</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{error}</p>
            <div className="mt-3 flex space-x-3">
              <button 
                onClick={() => setShowSQL(true)}
                className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
              >
                SQL表示
              </button>
              <button 
                onClick={() => setError(null)}
                className="text-sm text-red-600 hover:text-red-800 underline"
              >
                閉じる
              </button>
            </div>
          </div>
        )}

        {/* SQLスクリプト表示モーダル */}
        {showSQL && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-96 overflow-y-auto">
              <h3 className="text-lg font-semibold mb-4">Supabaseで実行するSQL</h3>
              <pre className="bg-gray-100 p-4 rounded text-sm overflow-x-auto mb-4">
{`-- 質問管理テーブル
CREATE TABLE IF NOT EXISTS questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  text TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックスを追加（順序でのソート用）
CREATE INDEX IF NOT EXISTS idx_questions_order ON questions(order_index);

-- 初期データを挿入
INSERT INTO questions (text, order_index) VALUES
  ('今日はどんなお客様の対応をしましたか？', 1),
  ('印象に残ったお客様はいらっしゃいましたか？', 2),
  ('今日の売上目標の達成状況はいかがでしたか？', 3),
  ('何か困ったことや気になったことはありましたか？', 4),
  ('明日に向けて意気込みや目標があれば教えてください', 5)
ON CONFLICT DO NOTHING;`}
              </pre>
              <p className="text-sm text-gray-600 mb-4">
                このSQLをSupabaseのSQL Editorで実行してください。
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowSQL(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                >
                  閉じる
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`-- 質問管理テーブル
CREATE TABLE IF NOT EXISTS questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  text TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- インデックスを追加（順序でのソート用）
CREATE INDEX IF NOT EXISTS idx_questions_order ON questions(order_index);

-- 初期データを挿入
INSERT INTO questions (text, order_index) VALUES
  ('今日はどんなお客様の対応をしましたか？', 1),
  ('印象に残ったお客様はいらっしゃいましたか？', 2),
  ('今日の売上目標の達成状況はいかがでしたか？', 3),
  ('何か困ったことや気になったことはありましたか？', 4),
  ('明日に向けて意気込みや目標があれば教えてください', 5)
ON CONFLICT DO NOTHING;`);
                    alert('SQLをクリップボードにコピーしました');
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  SQLをコピー
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 質問一覧 */}
        <div className="bg-white rounded-lg shadow-sm border mb-6">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">現在の質問一覧</h2>
            
            {questions.length === 0 ? (
              <p className="text-gray-500 text-center py-8">質問が登録されていません</p>
            ) : (
              <div className="space-y-4">
                {questions.map((question, index) => (
                  <div key={question.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <span className="text-sm font-medium text-gray-500 mr-2">
                            質問 {index + 1}
                          </span>
                          
                          {/* 順序変更ボタン */}
                          <div className="flex space-x-1">
                            <button
                              onClick={() => moveQuestion(question.id, 'up')}
                              disabled={index === 0}
                              className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                            >
                              ↑
                            </button>
                            <button
                              onClick={() => moveQuestion(question.id, 'down')}
                              disabled={index === questions.length - 1}
                              className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                            >
                              ↓
                            </button>
                          </div>
                        </div>
                        
                        {editingQuestion?.id === question.id ? (
                          <div className="space-y-3">
                            <textarea
                              value={editingQuestion.text}
                              onChange={(e) => setEditingQuestion({
                                ...editingQuestion,
                                text: e.target.value
                              })}
                              className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              rows={3}
                            />
                            <div className="flex space-x-2">
                              <button
                                onClick={() => updateQuestion(editingQuestion)}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                              >
                                保存
                              </button>
                              <button
                                onClick={() => setEditingQuestion(null)}
                                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                              >
                                キャンセル
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-gray-900">{question.text}</p>
                        )}
                      </div>
                      
                      {!editingQuestion && !question.id.startsWith('fallback-') && !question.id.startsWith('default-') && (
                        <div className="flex space-x-2 ml-4">
                          <button
                            onClick={() => setEditingQuestion(question)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            編集
                          </button>
                          <button
                            onClick={() => deleteQuestion(question.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            削除
                          </button>
                        </div>
                      )}
                      
                      {(question.id.startsWith('fallback-') || question.id.startsWith('default-')) && (
                        <div className="ml-4 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          読み取り専用
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 新しい質問追加 */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">新しい質問を追加</h2>
            
            {isAddingNew ? (
              <div className="space-y-4">
                <textarea
                  value={newQuestionText}
                  onChange={(e) => setNewQuestionText(e.target.value)}
                  placeholder="新しい質問を入力してください..."
                  className="w-full p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                />
                <div className="flex space-x-3">
                  <button
                    onClick={addQuestion}
                    disabled={!newQuestionText.trim()}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    追加
                  </button>
                  <button
                    onClick={() => {
                      setIsAddingNew(false);
                      setNewQuestionText('');
                    }}
                    className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    キャンセル
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setIsAddingNew(true)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                + 質問を追加
              </button>
            )}
          </div>
        </div>

        {/* 戻るボタン */}
        <div className="mt-8">
          <a
            href="/admin/dashboard"
            className="inline-flex items-center px-4 py-2 text-blue-600 hover:text-blue-800 transition-colors"
          >
            ← ダッシュボードに戻る
          </a>
        </div>
      </div>
    </div>
  );
}