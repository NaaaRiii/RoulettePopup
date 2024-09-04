import { useState } from 'react';
import { useRouter } from 'next/router';
import styles from '../components/CreateGoal.module.css';


export default function NewGoalModal({ isOpen, onClose }) {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [deadline, setDeadline] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    const body = JSON.stringify({ title, content, deadline });

    try {
      const response = await fetch('http://localhost:3000/api/goals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body
      });

      if (response.ok) {
        const data = await response.json();
        router.push({
          pathname: `/goals/${data.id}/new-small_goal`,
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
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <h2>目標を設定しよう！</h2>
        <form onSubmit={handleSubmit}>
          <label htmlFor="title">目標にタイトルをつけよう！</label>
          <input id="title" name="title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} />

          <label htmlFor="content">Content</label>
          <input id="content" name="content" type="text" value={content} onChange={(e) => setContent(e.target.value)} />

          <label htmlFor="deadline">Deadline</label>
          <input id="deadline" name="deadline" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />

          <button type="submit" className="btn btn-primary">設定する
          </button>
        </form>
        <button onClick={onClose} className={styles.closeButton}>Close</button>
      </div>
    </div>
  );
}
