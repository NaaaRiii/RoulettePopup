import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import styles from '../components/CreateGoal.module.css';


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
      const response = await fetch(`http://localhost:3000/api/goals/${goalId}/small_goals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
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
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <h2>Small Goalを設定しよう!</h2>

        {message && (
        <div className={styles.errorMessage}>
          {message}
        </div>
      )}

        <form onSubmit={handleSubmit}>
          <label htmlFor="title">Small Goalのタイトル</label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          {tasks.map((task, index) => (
            <div key={task.id}>
              <label htmlFor={`task-${task.id}`}>Task</label>
              <input
                id={`task-${task.id}`}
                type="text"
                value={task.content}
                onChange={(e) => handleTaskChange(index, e.target.value)}
                required
              />
              <button type="button" onClick={() => removeTask(index)}>Remove Task</button>
            </div>
          ))}
          <button type="button" onClick={addTask}>Add Task</button>
          <div>
            <label htmlFor="difficulty">Difficulty</label>
            <select
              id="difficulty"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              required
            >
              <option value="">Select Difficulty</option>
              <option value="ものすごく簡単">ものすごく簡単</option>
              <option value="簡単">簡単</option>
              <option value="普通">普通</option>
              <option value="難しい">難しい</option>
              <option value="とても難しい">とても難しい</option>
            </select>
          </div>
          <div>
            <label htmlFor="deadline">Deadline</label>
            <input
              id="deadline"
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary">設定する</button>
        </form>
        <button onClick={handleClose} className={styles.closeButton}>Close</button>
      </div>
    </div>
  );
}
