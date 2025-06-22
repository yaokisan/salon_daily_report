-- 質問管理テーブル
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
ON CONFLICT DO NOTHING;