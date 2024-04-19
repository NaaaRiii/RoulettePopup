import { useRouter } from 'next/router';
import { useState } from 'react';
import Link from 'next/link';
import Layout from '../../../components/Layout';
import '../../../components/styles.css';

function NewSmallGoal() {
  const router = useRouter();
  const { id } = router.query;
  const [title, setTitle] = useState('');
  const [tasks, setTasks] = useState([{ id: Date.now(), content: '' }]);
  const [difficulty, setDifficulty] = useState('');
  const [deadline, setDeadline] = useState('');

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
    setTasks([...tasks, { id: Date.now(), content: '' }]);
  };

  const removeTask = (index) => {
    if (tasks.length > 1) {
      setTasks(tasks.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const body = JSON.stringify({
      small_goal: {
        title,
        difficulty,
        deadline,
        tasks_attributes: tasks.map(task => ({ 
          id: task.id, 
          content: task.content 
        }))
      }
    });

    const token = localStorage.getItem('token');

    try {
      const response = await fetch(`http://localhost:3000/api/goals/${id}/small_goals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // トークンをヘッダーに追加
        },
        body
      });

      if (response.ok) {
        router.push(`/goals/${id}`);
      } else {
        const errorData = await response.json();
        console.error("Error submitting small goal:", errorData);
      }
    } catch (error) {
      console.error("Submission failed", error);
    }
  };

  return (
    <Layout>
      <h1>Let's Set Small Goals</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="title">Small Goal's Title</label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
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
            <button type="button" onClick={addTask}>Add Task</button>
            <button type="button" onClick={() => removeTask(index)}>Remove Task</button>
          </div>
        ))}
        <div>
          <label htmlFor="difficulty">Difficulty</label>
          <select
            id="difficulty"
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            required
          >
            <option value="">Select Difficulty</option>
            <option value="very_easy">Very Easy</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
            <option value="very_hard">Very Hard</option>
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
        <button type="submit" className="btn btn-primary">Submit</button>
        <Link href={`/goals/${id}`}>
          <div className={'btn btn-primary'}>Back</div>
        </Link>
      </form>
    </Layout>
  );
}

export default NewSmallGoal;
