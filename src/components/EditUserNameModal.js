import React, { useState } from 'react';
import { useRouter } from 'next/router';
import styles from '../components/CreateGoal.module.css';

export default function EditUserNameModal({ isOpen, onClose, currentName }) {
  const router = useRouter();

  const [newName, setNewName] = useState(currentName || '');

  if (!isOpen) return null;

  const handleSubmit = async (event) => {
    event.preventDefault();

    const body = JSON.stringify({
      user: { username: newName }
    });

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_RAILS_API_URL}/api/current_user`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body
      });

      if (response.ok) {
        // 更新に成功したら、レスポンスを取得
        const data = await response.json();
        console.log("Updated user name:", data);

        // 例: ダッシュボードにリロード・遷移
        router.replace('/dashboard');

      } else {
        const errorData = await response.json();
        console.error("Error updating user name:", errorData);
      }
    } catch (error) {
      console.error("Submission failed", error);
    } finally {
      // 失敗でも成功でもモーダルは閉じる
      onClose();
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <h2>ユーザー名を編集</h2>
        <form onSubmit={handleSubmit}>
          <label htmlFor="username">新しいユーザー名</label>
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
