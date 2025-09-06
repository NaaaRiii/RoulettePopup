import React from 'react';
import { useState } from 'react';
import { useRouter } from 'next/router';
import styles from '../components/CreateGoal.module.css';

import { fetchWithAuth } from '../utils/fetchWithAuth';

export default function NewGoalModal({ isOpen, onClose, userData = null }) {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [deadline, setDeadline] = useState('');
  const [showGuestWarning, setShowGuestWarning] = useState(false);

  const isGuestUser = userData?.is_guest || false;

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    // ゲストユーザーの場合は送信を阻止
    if (isGuestUser) {
      setShowGuestWarning(true);
      return;
    }

    const body = JSON.stringify({ title, content, deadline });

    try {
      const response = await fetchWithAuth('/api/goals', {
        method: 'POST',
        body,
      });

      if (response.ok) {
        const data = await response.json();
        router.push({
          pathname: `/goals/${data.id}`,
          query: { message: encodeURIComponent(data.message) },
        });
      } else {
        const errorData = await response.json();
        console.error("Error submitting form:", errorData);
      }
    } catch (error) {
      console.error("Submission failed", error);
    }
  };

  const handleGuestFocus = () => {
    if (isGuestUser) {
      setShowGuestWarning(true);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={`${styles.modalOverlay}`} role="dialog" aria-labelledby="modal-title">
      <div className={`${styles.modalContent}
        w-full sm:w-[90%] sm:max-w-[600px] lg:max-w-[500px]
        max-h-[90vh] overflow-hidden p-2.5
      `}>
        {/* ヘッダー部分 */}
        <div className="pb-3 border-b border-gray-200">
          <h2 id="modal-title" className="text-lg sm:text-xl font-bold">Goalを設定しよう！</h2>
        </div>

        {/* スクロール可能なコンテンツ部分 */}
        <div className="flex-1 overflow-y-auto py-4">
          {/* ゲスト制限警告メッセージ */}
          {isGuestUser && (
            <div className="mb-4 p-3 bg-gray-100 border border-gray-300 rounded text-sm text-gray-600">
              不適切な投稿を避けるため、入力できません
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4 space-y-reverse">
            <div>
              <label htmlFor="title" className="block mb-2 text-base">Goalのタイトル</label>
              <textarea
                id="title"
                name="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onFocus={handleGuestFocus}
                disabled={isGuestUser}
                required
                className={`${styles.textareaField} w-full text-sm sm:text-base ${
                  isGuestUser ? 'bg-gray-100 cursor-not-allowed opacity-50' : ''
                }`}
                rows={2}
                placeholder={isGuestUser ? "ゲストユーザーは入力できません" : ""}
              />
            </div>

            <div>
              <label htmlFor="content" className="block mb-2 text-base">Goalの詳細</label>
              <textarea
                id="content"
                name="content"
                type="text"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onFocus={handleGuestFocus}
                disabled={isGuestUser}
                required
                className={`${styles.textareaField} w-full text-sm sm:text-base ${
                  isGuestUser ? 'bg-gray-100 cursor-not-allowed opacity-50' : ''
                }`}
                rows={2}
                placeholder={isGuestUser ? "ゲストユーザーは入力できません" : ""}
              />
            </div>

            <div>
              <label htmlFor="deadline" className="block mb-2 text-base">期限</label>
              <input
                id="deadline"
                name="deadline"
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                onFocus={handleGuestFocus}
                disabled={isGuestUser}
                required
                className={`${styles.deadlineField} w-full text-sm sm:text-base ${
                  isGuestUser ? 'bg-gray-100 cursor-not-allowed opacity-50' : ''
                }`}
              />
            </div>

            <button 
              type="submit" 
              disabled={isGuestUser}
              className={`btn btn-primary w-full sm:w-auto ${
                isGuestUser ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              設定する
            </button>
          </form>
        </div>
        
        <button onClick={onClose} className={styles.closeButton}>Close</button>
      </div>
    </div>
  );
}
