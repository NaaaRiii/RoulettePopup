import React, { useState } from 'react';
import { useRouter } from 'next/router';
import styles from '../components/CreateGoal.module.css';

import { fetchWithAuth } from '../utils/fetchWithAuth';

export default function EditUserNameModal({ isOpen, onClose, currentName, onUserUpdate }) {
  const router = useRouter();

  const [newName, setNewName] = useState(currentName || '');

  if (!isOpen) return null;

  const handleSubmit = async (event) => {
    event.preventDefault();

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
        // 更新に成功したら、レスポンスを取得
        const data = await response.json();
        console.log("Updated user name:", data);
        console.log("Response user data:", data.user);
        console.log("New name in response:", data.user?.name);

        // 親コンポーネントに新しいユーザー名を渡す
        if (onUserUpdate && data.user) {
          onUserUpdate(data.user);
        }

        // モーダルを閉じる
        onClose();

      } else {
        const errorData = await response.json();
        console.error("Error updating user name:", errorData);
        console.error("Response status:", response.status);
        console.error("Response status text:", response.statusText);
      }
    } catch (error) {
      console.error("Submission failed", error);
    } finally {
      // 1回の呼び出しでも良いかを確認
      onClose();
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <h2>ユーザー名を編集する</h2>
        <form onSubmit={handleSubmit}>
          <label htmlFor="username">新しいユーザー名を入力してください。</label>
          <textarea
            id="username"
            name="username"
            rows={2}
            cols={50}
            className={styles.textareaField}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            required
          />
          <button type="submit" className="btn btn-primary">変更</button>
        </form>

        {/* キャンセル用ボタン */}
        <button onClick={onClose} className={styles.closeButton}>Close</button>
      </div>
    </div>
  );
}
