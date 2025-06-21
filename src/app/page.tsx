import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              美容室日報システム
            </h1>
            <p className="text-gray-600">
              音声入力で簡単に日報を作成できます
            </p>
          </div>
          
          <div className="space-y-4">
            <Link href="/report" className="block">
              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-lg transition duration-200 shadow-md">
                📝 日報を作成する
              </button>
            </Link>
            
            <Link href="/admin/login" className="block">
              <button className="w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold py-4 px-6 rounded-lg transition duration-200 shadow-md">
                🔒 管理者ログイン
              </button>
            </Link>
          </div>
          
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              スタッフの方は「日報を作成する」をクリック
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}