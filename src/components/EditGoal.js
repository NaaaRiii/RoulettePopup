import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import styles from '../components/CreateGoal.module.css';

import { fetchWithAuth } from '../utils/fetchWithAuth';

export default function EditGoal({ isOpen, onClose, goalId, onGoalUpdated }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [deadline, setDeadline] = useState('');
  const [message, setMessage] = useState('');

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return format(date, 'yyyy-MM-dd');
  };

  useEffect(() => {
    if (goalId && isOpen) {
      fetchWithAuth(`/api/goals/${goalId}`, { method: 'GET' })
        .then(async (response) => {
          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || 'Failed to load goal');
          }
          return response.json();
        })
        .then((data) => {
          setTitle(data.title);
          setContent(data.content);
          setDeadline(formatDate(data.deadline));
        })
        .catch((error) => console.error('Failed to load goal', error));
    }
  }, [goalId, isOpen]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const updatedGoal = {
      title,
      content,
      deadline,
    };

    try {
      const response = await fetchWithAuth(
        `/api/goals/${goalId}`,
        { method: 'PUT', body: JSON.stringify(updatedGoal) }
      );

      if (response.ok) {
        setMessage('Goalを編集しました');
        if (onGoalUpdated) {
          onGoalUpdated(updatedGoal);
        }
        onClose();
      } else {
        const errorData = await response.json();
        console.error("Error updating goal:", errorData);
      }
    } catch (error) {
      console.error("Update failed", error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={`${styles.modalOverlay} p-4`} role="dialog" aria-labelledby="modal-title">
      <div className={`${styles.modalContent} w-full sm:w-[90%] sm:max-w-[600px] lg:max-w-[500px] max-h-[90vh] overflow-hidden`}>
        {/* ヘッダー部分 */}
        <div className="pb-3 border-b border-gray-200">
          <h2 id="modal-title" className="text-lg sm:text-xl font-bold">Goalを編集しよう！</h2>
          {message && <p role="alert" className="text-green-600 mt-2 text-sm">{message}</p>}
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

            <button type="submit" className="btn btn-primary w-full sm:w-auto">Goalを更新する</button>
          </form>
        </div>
        
        <button onClick={onClose} className={styles.closeButton}>Close</button>
      </div>
    </div>
  );
}
