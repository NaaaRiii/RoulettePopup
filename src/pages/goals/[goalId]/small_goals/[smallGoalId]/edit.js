import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { format } from 'date-fns'; //goalのeditでなぜ不要かは後回し
import Link from 'next/link';
import Layout from '../../../../../components/Layout.js';
import '../../../../../components/styles.css';

function EditSmallGoal() {
  const router = useRouter();
  const { goalId, smallGoalId } = router.query;
  const [title, setTitle] = useState('');
  const [tasks, setTasks] = useState([]);
  const [difficulty, setDifficulty] = useState('');
  const [deadline, setDeadline] = useState('');

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return format(date, 'yyyy-MM-dd');
  };

  useEffect(() => {
    if (smallGoalId && goalId) {
      fetch(`http://localhost:3000/api/goals/${goalId}/small_goals/${smallGoalId}`, {
        method: 'GET',
        credentials: 'include'
      })
      .then(response => {
        if (response.ok) {
          return response.json();
        } else {
          throw new Error('Failed to fetch');
        }
      })
      .then(data => {
        setTitle(data.title);
        setTasks(data.tasks || []);
        setDifficulty(data.difficulty);
        if (data.deadline) {
          const formattedDeadline = formatDate(data.deadline);
          setDeadline(formattedDeadline);
        } else {
          setDeadline('');
        }
      })
      .catch(error => {
        console.error('Failed to load small goal', error);
      });
    }
  }, [smallGoalId, goalId]);

  const addTask = () => {
    setTasks(prevTasks => [
      ...prevTasks,
      { id: `temp-${Date.now()}`, content: '', _destroy: false }
    ]);
  };

  const handleChange = (e, taskId) => {
    const { name, value } = e.target;
    setTasks(prevTasks => prevTasks.map(task => {
        if (task.id === taskId) {
            return { ...task, [name]: value };
        }
        return task;
    }));
  };

  const removeTask = (taskId) => {
    setTasks(prevTasks => prevTasks.map(task => {
        if (task.id === taskId) {
            return { ...task, _destroy: true }; // 削除フラグを設定
        }
        return task;
    }));
  };

  console.log(tasks);

  const handleSubmit = async (event) => {
    event.preventDefault();

    console.log("Tasks before sending:", tasks);

    const tasksToSend = tasks.map(task => {
      const taskData = {
        content: task.content,
        _destroy: task._destroy
      };
      if (task.id && !String(task.id).startsWith('temp-')) {
        taskData.id = task.id;
      }
      return taskData;
    }).filter(task => !task._destroy || task.id);
  
    if (tasksToSend.length === 0 || tasksToSend.every(task => task._destroy)) {
      alert("You must have at least one task that is not marked for deletion.");
      return;
    }

    if (tasksToSend.length === 0) {
      alert("You must have at least one task.");
      return;
    }

    const updatedSmallGoal = {
      title,
      difficulty,
      deadline,
      tasks_attributes: tasksToSend
    };

    console.log("Sending these tasks for deletion:", tasksToSend);
    console.log("Updated Small Goal Data:", updatedSmallGoal);
    console.log("Tasks to send:", tasks);
    console.log("Final data to send:", JSON.stringify(updatedSmallGoal));

    try {
      const response = await fetch(`http://localhost:3000/api/goals/${goalId}/small_goals/${smallGoalId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(updatedSmallGoal)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error updating small goal:", errorText);
        alert("Update error: " + errorText);  // ユーザーへのエラー表示
        return;
      }

      const responseData = await response.json();
      console.log("Update Success:", responseData);
      router.push(`/goals/${goalId}`);
    } catch (error) {
      console.error("Update failed", error);
      alert("Failed to update small goal: " + error.message);
    }
  };

  return (
    <Layout>
      {/* TODO: Fix the unescaped entities issue */}
      {/* eslint-disable-next-line react/no-unescaped-entities */}
      <h1>Let's Set Small Goals</h1>
      <form onSubmit={handleSubmit}>
        <div>
          {/* TODO: Fix the unescaped entities issue */}
          {/* eslint-disable-next-line react/no-unescaped-entities */}
          <label htmlFor="title">Small Goal's Title</label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        {/*{tasks.map((task, index) => (
          <div key={task.id}>
            <label htmlFor={`task-${task.id}`}>Task</label>
            <input
              id={`task-${task.id}`}
              type="text"
              name="content"
              data-index={index}
              value={task.content}
              onChange={handleChange}
              required
            />
            <button type="button" onClick={() => addTask()}>Add Task</button>
            <button type="button" onClick={() => removeTask(index)}>Remove Task</button>
          </div>
        ))}*/}
        {/*// タスクリストの表示部分の key を ID に変更*/}
        {/*{tasks.filter(task => !task._destroy).map((task, index) => (
          <div key={task.id}>
            <label htmlFor={`task-${task.id}`}>Task</label>
            <input
              id={`task-${task.id}`}
              type="text"
              name="content"
              value={task.content}
              onChange={handleChange}
              required
            />
            
            <button type="button" onClick={() => removeTask(task.id)}>Remove Task</button>
          </div>
        ))}*/}
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

        <br />{/* 改行の挿入*/}
        <button type="button" onClick={() => addTask()}>Add Task</button>

        <div>
          <label htmlFor="difficulty">Difficulty</label>
          <select
            id="difficulty"
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            required
          >
            {/*<option value="">Select Difficulty</option>*/}
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
        <button type="submit" className="btn btn-primary">Update Small Goal</button>
        <Link href={`/goals/${goalId}`}>
          <div className={'btn btn-primary'}>Back</div>
        </Link>
      </form>
    </Layout>
  );
}

export default EditSmallGoal;