import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import styles from '../components/create_goal.module.css';

export default function EditSmallGoalModal({ isOpen, onClose, smallGoal, goalId, onSmallGoalUpdated }) {
  const [title, setTitle] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [deadline, setDeadline] = useState('');
  const [tasks, setTasks] = useState([]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
  
    // Dateオブジェクトが有効かどうかを確認
    if (isNaN(date.getTime())) {
      console.error('Invalid date:', dateString);
      return 'Invalid date'; // エラーが発生した場合のデフォルト値
    }
  
    return format(date, 'yyyy-MM-dd');
  };
  

  useEffect(() => {
    if (smallGoal) {
      setTitle(smallGoal.title);
      setDifficulty(smallGoal.difficulty);
      setDeadline(formatDate(smallGoal.deadline));
      setTasks(smallGoal.tasks.map(task => ({ ...task, _destroy: false })));
    }
  }, [smallGoal]); 

  const handleChange = (e, taskId) => {
    const newTasks = tasks.map((task) =>
      task.id === taskId ? { ...task, content: e.target.value } : task
    );
    setTasks(newTasks);
  };

  const addTask = () => {
    setTasks([...tasks, { id: null, content: '', _destroy: false }]);
  };

  const removeTask = (taskId) => {
    setTasks(tasks.map(task => task.id === taskId ? { ...task, _destroy: true } : task));
  };

  const handleSmallGoalUpdated = (updatedSmallGoal) => {
    setGoal(prevGoal => ({
      ...prevGoal,
      small_goals: prevGoal.small_goals.map(sg => 
        sg.id === updatedSmallGoal.id ? updatedSmallGoal : sg
      )
    }));
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
      tasks_attributes: tasks.map((task) =>
        task._destroy ? { id: task.id, _destroy: true } : { id: task.id, content: task.content }
      ),
    };
  
    try {
      const response = await fetch(
        `http://localhost:3000/api/goals/${goalId}/small_goals/${smallGoal.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(updatedSmallGoal),
        }
      );
  
      if (response.ok) {
        const data = await response.json();
        onSmallGoalUpdated(data); // 更新されたSmall Goalデータを渡して即時に反映
        onClose(); // モーダルを閉じる
      } else {
        console.error("Failed to update small goal.");
      }
    } catch (error) {
      console.error("Update failed", error);
    }
  };

  if (!isOpen || !smallGoal) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <h2>Small Goalを編集します</h2>
        <form onSubmit={handleSubmit}>
          <label htmlFor="title">Small Goalのタイトル</label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <label htmlFor="difficulty">難易度</label>
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

          <label htmlFor="deadline">締切日</label>
          <input
            id="deadline"
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            required
          />

          {tasks.filter(task => !task._destroy).map((task) => (
            <div key={task.id}>
              <label htmlFor={`task-${task.id}`}>Task</label>
              <input
                id={`task-${task.id}`}
                type="text"
                name="content"
                value={task.content}
                onChange={(e) => handleChange(e, task.id)}
                required
              />
              <button type="button" onClick={() => removeTask(task.id)}>Remove Task</button>
            </div>
          ))}

          <button type="button" onClick={() => addTask()}>Add Task</button>

          <button type="submit" className="btn btn-primary">Update Small Goal</button>
        </form>
        <button onClick={onClose} className={styles.closeButton}>Close</button>
      </div>
    </div>
  );
}
