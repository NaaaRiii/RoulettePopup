import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { format } from 'date-fns';
import styles from '../components/create_goal.module.css';

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
      fetch(`http://localhost:3000/api/goals/${goalId}`, {
        method: 'GET',
        credentials: 'include',
      })
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
      const response = await fetch(`http://localhost:3000/api/goals/${goalId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(updatedGoal),
      });

      if (response.ok) {
        setMessage('Goal was successfully updated');
        onGoalUpdated(updatedGoal);
        onClose();
        router.push(`/goals/${goalId}?message=Goal was successfully updated`);
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
        <h2>目標を編集しよう！</h2>
        <form onSubmit={handleSubmit}>
          <label htmlFor="title">目標のタイトル</label>
          <input
            id="title"
            name="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <label htmlFor="content">Content</label>
          <input
            id="content"
            name="content"
            type="text"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
          />

          <label htmlFor="deadline">Deadline</label>
          <input
            id="deadline"
            name="deadline"
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            required
          />

          <button type="submit" className="btn btn-primary">Update Goal</button>
        </form>
        <button onClick={onClose} className={styles.closeButton}>Close</button>
      </div>
    </div>
  );
}
