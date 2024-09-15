import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import styles from '../components/CreateGoal.module.css';

export default function EditSmallGoalModal({ isOpen, onClose, smallGoal, goalId, onSmallGoalUpdated }) {
  const [title, setTitle] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [deadline, setDeadline] = useState('');
  const [tasks, setTasks] = useState([]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);

    if (isNaN(date.getTime())) {
      console.error('Invalid date:', dateString);
      return 'Invalid date';
    }

    return format(date, 'yyyy-MM-dd');
  };

  useEffect(() => {
    if (smallGoal) {
      console.log("Editing Small Goal:", smallGoal);
      setTitle(smallGoal.title);
      setDifficulty(smallGoal.difficulty);
      setDeadline(formatDate(smallGoal.deadline));
      setTasks(smallGoal.tasks.map(task => ({ ...task, _destroy: false })));
    }
  }, [smallGoal]);

  const handleTaskChange = (taskId, value) => {
    setTasks(tasks.map(task => 
      task.id === taskId ? { ...task, content: value } : task
    ));
  };

  const addTask = () => {
    setTasks([...tasks, { id: `temp-${Date.now()}`, content: '' }]);
  };

  const removeTask = (taskId) => {
    setTasks(tasks.map(task => 
      task.id === taskId ? { ...task, _destroy: true } : task
    ));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!goalId || !smallGoal?.id) {
      console.error("goalId or smallGoal.id is undefined.");
      return;
    }

    const updatedSmallGoal = {
      title,
      difficulty,
      deadline,
      tasks_attributes: tasks.map(task =>
        task._destroy
          ? { id: task.id, _destroy: true }
          : {
              ...(task.id && typeof task.id === 'string' && task.id.startsWith('temp-')
                ? {} // 新規タスクにはIDを送らない
                : { id: task.id }), // 既存タスクにはIDを送る
              content: task.content,
            }
      ),
    };

    try {
      const response = await fetch(
        `http://localhost:3000/api/goals/${goalId}/small_goals/${smallGoal.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(updatedSmallGoal),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to update small goal:', errorText);
        alert('Failed to update small goal: ' + errorText);
      } else {
        const data = await response.json();
        onSmallGoalUpdated(data);
        onClose();
      }
    } catch (error) {
      console.error('Update failed', error);
      alert('Failed to update small goal: ' + error.message);
    }
  };

  if (!isOpen || !smallGoal) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <h2>Small Goalを編集</h2>
        <form onSubmit={handleSubmit}>
          <label htmlFor="title">Small Goalのタイトル</label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          {tasks.filter(task => !task._destroy).map((task, index) => (
            <div key={task.id || `temp-${index}`}>
              <label htmlFor={`task-${task.id || `temp-${index}`}`}>Task</label>
              <input
                id={`task-${task.id || `temp-${index}`}`}
                type="text"
                value={task.content}
                onChange={(e) => handleTaskChange(task.id, e.target.value)}
                required
              />
              {tasks.filter(task => !task._destroy).length > 1 && (
                <button type="button" onClick={() => removeTask(task.id)}>
                  Remove Task
                </button>
              )}
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
              <option value="ものすごく簡単">ものすごく簡単</option>
              <option value="簡単">簡単</option>
              <option value="普通">普通</option>
              <option value="難しい">難しい</option>
              <option value="とても難しい">とても難しい</option>
            </select>
          </div>
          <div>
            <label htmlFor="deadline">締切日</label>
            <input
              id="deadline"
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary">Update Small Goal</button>
        </form>
        <button onClick={onClose} className={styles.closeButton}>Close</button>
      </div>
    </div>
  );
}
