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
    <div className={styles.modalOverlay} role="dialog" aria-labelledby="modal-title">
      <div className={styles.modalContent}>
        <h2 id="modal-title">Goalを設定する</h2>
        <form onSubmit={handleSubmit}>
          <label htmlFor="title">Goalのタイトル</label>
          <textarea
            id="title"
            name="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className={styles.textareaField}
            rows={2}
            cols={50}
          />

          <label htmlFor="content">Goalの詳細</label>
          <textarea
            id="content"
            name="content"
            type="text"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            className={styles.textareaField}
            rows={2}
            cols={50}
          />

          <label htmlFor="deadline">期限</label>
          <input
            id="deadline"
            name="deadline"
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            required
            className={styles.deadlineField}
          />

          <button type="submit" className="btn btn-primary">設定する
          </button>
        </form>
        <button onClick={onClose} className={styles.closeButton}>Close</button>
      </div>
    </div>
  );
}
