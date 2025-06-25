import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { format } from 'date-fns';
import styles from '../components/CreateGoal.module.css';

import { fetchWithAuth } from '../utils/fetchWithAuth';

export default function EditGoal({ isOpen, onClose, goalId, onGoalUpdated }) {
  const router = useRouter();
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
      fetch(`${process.env.NEXT_PUBLIC_RAILS_API_URL}/api/goals/${goalId}`,
        { method: 'GET'}
      )
        .then((response) => response.json())
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
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        {message && <p>{message}</p>}
        <h2>Goalを編集しよう！</h2>
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

          <button type="submit" className="btn btn-primary">Goalを更新する</button>
        </form>
        <button onClick={onClose} className={styles.closeButton}>Close</button>
      </div>
    </div>
  );
}
