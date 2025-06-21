'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Staff } from '@/types/report';

interface NameSelectorProps {
  onSelect: (staff: Staff) => void;
  selectedStaff: Staff | null;
}

export default function NameSelector({ onSelect, selectedStaff }: NameSelectorProps) {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      const { data, error } = await supabase
        .from('staff')
        .select('*')
        .order('name');

      if (error) throw error;
      setStaff(data || []);
    } catch (err) {
      setError('スタッフ情報の取得に失敗しました');
      console.error('Error fetching staff:', err);
    } finally {
      setLoading(false);
    }
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
          onClick={fetchStaff}
          className="mt-2 text-blue-600 hover:text-blue-800"
        >
          再試行
        </button>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-800 mb-4">
        お名前を選択してください
      </h2>
      <div className="grid gap-3">
        {staff.map((member) => (
          <button
            key={member.id}
            onClick={() => onSelect(member)}
            className={`p-4 text-left rounded-lg border-2 transition-all duration-200 ${
              selectedStaff?.id === member.id
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <span className="font-medium">{member.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}