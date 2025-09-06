import React, { useState } from 'react';
import { useRouter } from 'next/router';
import styles from '../components/CreateGoal.module.css';

import { fetchWithAuth } from '../utils/fetchWithAuth';

export default function EditUserNameModal({ isOpen, onClose, currentName, onUserUpdate, userData = null }) {
  const router = useRouter();

  const [newName, setNewName] = useState(currentName || '');
  const [showGuestWarning, setShowGuestWarning] = useState(false);

  const isGuestUser = userData?.is_guest || false;

  if (!isOpen) return null;

  const handleSubmit = async (event) => {
    event.preventDefault();

    // ゲストユーザーの場合は送信を阻止
    if (isGuestUser) {
      setShowGuestWarning(true);
      return;
    }

    const body = JSON.stringify({
      user: { name: newName }
    });

    console.log("Sending request with body:", body);

    try {
      const response = await fetchWithAuth(
        '/api/current_user',
        { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body }
      );

      if (response.ok) {
        const data = await response.json();

        if (onUserUpdate && data.user) {
          onUserUpdate(data.user);
        }

      } else {
        const errorData = await response.json();
        console.error("Error updating user name:", errorData);
        console.error("Response status:", response.status);
        console.error("Response status text:", response.statusText);
      }
    } catch (error) {
      console.error("Submission failed", error);
    } finally {
      onClose();
    }
  };

  const handleGuestFocus = () => {
    if (isGuestUser) {
      setShowGuestWarning(true);
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <h2>ユーザー名を編集する</h2>
        
        {/* ゲスト制限警告メッセージ */}
        {isGuestUser && (
          <div className="mb-4 p-3 bg-gray-100 border border-gray-300 rounded text-sm text-gray-600">
            不適切な投稿を避けるため、入力できません
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <label htmlFor="username">新しいユーザー名を入力してください。</label>
          <textarea
            id="username"
            name="username"
            rows={2}
            cols={50}
            className={`${styles.textareaField} ${
              isGuestUser ? 'bg-gray-100 cursor-not-allowed opacity-50' : ''
            }`}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onFocus={handleGuestFocus}
            disabled={isGuestUser}
            placeholder={isGuestUser ? "ゲストユーザーは入力できません" : ""}
            required
          />
          <button 
            type="submit" 
            disabled={isGuestUser}
            className={`btn btn-primary ${
              isGuestUser ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            変更
          </button>
        </form>

        {/* キャンセル用ボタン */}
        <button onClick={onClose} className={styles.closeButton}>Close</button>
      </div>
    </div>
  );
}
