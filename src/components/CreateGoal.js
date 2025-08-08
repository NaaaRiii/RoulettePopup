import React from 'react';
import { useState } from 'react';
import { useRouter } from 'next/router';
import styles from '../components/CreateGoal.module.css';

import { fetchWithAuth } from '../utils/fetchWithAuth';

export default function NewGoalModal({ isOpen, onClose }) {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [deadline, setDeadline] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
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

  if (!isOpen) return null;

  return (
    <div className={`${styles.modalOverlay} p-4`} role="dialog" aria-labelledby="modal-title">
      <div className={`${styles.modalContent} w-full sm:w-[90%] sm:max-w-[600px] lg:max-w-[500px] max-h-[90vh] overflow-hidden`}>
        {/* ヘッダー部分 */}
        <div className="pb-3 border-b border-gray-200">
          <h2 id="modal-title" className="text-lg sm:text-xl font-bold">Goalを設定する</h2>
        </div>

        {/* スクロール可能なコンテンツ部分 */}
        <div className="flex-1 overflow-y-auto py-4">
          <form onSubmit={handleSubmit} className="space-y-4 space-y-reverse">
            <div>
              <label htmlFor="title" className="block mb-2 text-base">Goalのタイトル</label>
              <textarea
                id="title"
                name="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className={`${styles.textareaField} w-full text-sm sm:text-base`}
                rows={2}
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
                required
                className={`${styles.textareaField} w-full text-sm sm:text-base`}
                rows={2}
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
                required
                className={`${styles.deadlineField} w-full text-sm sm:text-base`}
              />
            </div>

            <button type="submit" className="btn btn-primary w-full sm:w-auto">設定する</button>
          </form>
        </div>
        
        <button onClick={onClose} className={styles.closeButton}>Close</button>
      </div>
    </div>
  );
}
