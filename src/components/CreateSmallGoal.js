import React from 'react';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import styles from '../components/CreateGoal.module.css';

import { fetchWithAuth } from '../utils/fetchWithAuth';

export default function CreateSmallGoal({ isOpen, onClose, goalId, onSmallGoalAdded }) {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [tasks, setTasks] = useState([{ id: Date.now(), content: '' }]);
  const [difficulty, setDifficulty] = useState('');
  const [deadline, setDeadline] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const messageFromQuery = router.query.message;
    if (messageFromQuery) {
      setMessage(decodeURIComponent(messageFromQuery));
    }
  }, [router.query]);

  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setTasks([{ id: Date.now(), content: '' }]);
      setDifficulty('');
      setDeadline('');
      setMessage('');
    }
  }, [isOpen]);

  const handleTaskChange = (index, value) => {
    const newTasks = tasks.map((task, i) => {
      if (i === index) {
        return { ...task, content: value };
      }
      return task;
    });
    setTasks(newTasks);
  };

  const addTask = () => {
    setTasks([...tasks, { id: `temp-${Date.now()}`, content: '' }]);
  };

  const removeTask = (index) => {
    if (tasks.length > 1) {
      setTasks(tasks.filter((_, i) => i !== index));
    }
  };

  const handleClose = () => {
    setMessage('');
    onClose();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const body = JSON.stringify({
      small_goal: {
        title,
        difficulty,
        deadline,
        tasks_attributes: tasks.map(task => ({
          content: task.content
        }))
      }
    });

    try {
      const response = await fetchWithAuth(`${process.env.NEXT_PUBLIC_RAILS_API_URL}/api/goals/${goalId}/small_goals`, {
        method: 'POST',
        body
      });

      if (response.ok) {
        const data = await response.json();
        if (onSmallGoalAdded) {
          onSmallGoalAdded(data);
        }
        onClose();
      } else {
        const errorData = await response.json();
        setMessage(errorData.errors.join(', '));
      }
    } catch (error) {
      console.error("Submission failed", error);
      setMessage('Submission failed, please try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} data-testid="create-small-goal">
      <div className={styles.modalContent}>
        <h2>Small Goalを設定しよう!</h2>

        {message && (
          <div className={styles.errorMessage}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <label htmlFor="title">Small Goalのタイトル</label>
          <textarea
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className={styles.textareaField}
            rows={2}
            cols={50}
          />

          <div className={styles.tasksContainer}>
            {tasks.map((task, index) => (
              <div key={task.id}>
                <label htmlFor={`task-${task.id}`}>Task</label>
                <textarea
                  id={`task-${task.id}`}
                  type="text"
                  value={task.content}
                  onChange={(e) => handleTaskChange(index, e.target.value)}
                  required
                  className={styles.textareaField}
                  rows={2}
                  cols={50}
                />
                <button
                  type="button"
                  onClick={() => removeTask(index)}
                  className={styles.taskButton} // Removeボタンにスタイルを適用
                >
                  タスクの削除
                </button>
              </div>
            ))}
          </div>

          <button type="button" onClick={addTask} className={styles.addTaskButton}>
            タスクの追加
          </button>

          <div>
            <label htmlFor="difficulty">難易度の設定</label>
            <select
              id="difficulty"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              required
              //className={styles.selectField}
            >
              <option value="">難易度を選択</option>
              <option value="ものすごく簡単">ものすごく簡単</option>
              <option value="簡単">簡単</option>
              <option value="普通">普通</option>
              <option value="難しい">難しい</option>
              <option value="とても難しい">とても難しい</option>
            </select>
          </div>

          <div>
            <label htmlFor="deadline">期限</label>
            <input
              id="deadline"
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              required
              className={styles.deadlineField}
            />
          </div>

          <button type="submit" className="btn btn-primary">
            設定する
          </button>
        </form>
        <button onClick={handleClose} className={styles.closeButton}>
          Close
        </button>
      </div>
    </div>
  );
}
