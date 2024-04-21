import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Layout from '../../components/Layout';
import '../../components/styles.css';
import { format } from 'date-fns';
import { useGoals } from '../../contexts/GoalsContext';

function GoalPage() {
  const router = useRouter();
  const { id } = router.query;// この `id` が `goalId`
  const [goal, setGoal] = useState({ small_goals: [] });
  const [smallGoals, setSmallGoals] = useState({ tasks: [] });
  const [loading, setLoading] = useState(true);
  const { refreshGoals } = useGoals();
  const token = localStorage.getItem('token');
  const smallGoalId = 'your_value_here';

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return format(date, 'yyyy-MM-dd');
  };

  useEffect(() => {
    fetch(`http://localhost:3000/api/goals/${id}/small_goals`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
      setSmallGoals(data);
    });
  }, [id]);

  useEffect(() => {
    if (!id) return;

    const token = localStorage.getItem('token');
    fetch(`http://localhost:3000/api/goals/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(data => {
        setGoal(data);
        setLoading(false);
      });
  }, [id]);

  const deleteGoal = () => {
    if (window.confirm('本当にこのゴールを削除しますか？')) {
      const token = localStorage.getItem('token');
      fetch(`http://localhost:3000/api/goals/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      .then(response => {
        if (response.ok) {
          refreshGoals();
          router.push('/index-goal');
        } else {
          alert('ゴールの削除に失敗しました。');
        }
      })
      .catch(() => alert('通信に失敗しました。'));
    }
  };

  useEffect(() => {
    if (!id) return;
    
    const token = localStorage.getItem('token');
    fetch(`http://localhost:3000/api/goals/${id}/small_goals`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(response => response.json())
    .then(data => {
      console.log('Fetched small goals:', data);
      const updatedSmallGoals = data.map(smallGoal => ({
        ...smallGoal,
        tasks: smallGoal.tasks.map(task => {
          const taskStateKey = `taskState-${id}-${smallGoal.id}-${task.id}`;
          const savedState = localStorage.getItem(taskStateKey);
          return {
            ...task,
            completed: savedState !== null ? JSON.parse(savedState) : task.completed
          };
        })
      }));
      setGoal(prevGoal => ({
        ...prevGoal,
        small_goals: updatedSmallGoals
      }));
      setLoading(false);
    })
    .catch(error => {
      console.error('Error fetching small goals:', error);
    });
  }, [id]);

  function handleTaskToggle(taskId) {
    setGoal(prevGoal => {
      const updatedGoal = prevGoal.small_goals.map(smallGoal => {
        return {
          ...smallGoal,
          tasks: smallGoal.tasks.map(task => {
            if (task.id === taskId) {
              const newCompleted = !task.completed;
              console.log(`Task ${taskId} completed status changed to: ${newCompleted}`); // 状態変更をログ出力
              saveTaskState(prevGoal.id, smallGoal.id, taskId, newCompleted);
              return { ...task, completed: newCompleted };
            }
            return task;
          })
        };
      });
  
      const newGoalState = { ...prevGoal, small_goals: updatedGoal };
      localStorage.setItem(`goalState-${prevGoal.id}`, JSON.stringify(newGoalState));
      console.log('New goal state saved to localStorage', newGoalState); // 保存状態をログ出力
      return newGoalState;
    });
  }
  
  function saveTaskState(goalId, smallGoalId, taskId, completed) {
    const key = `taskState-${goalId}-${smallGoalId}-${taskId}`;
    localStorage.setItem(key, JSON.stringify(completed));
    console.log(`Task state for ${taskId} saved: ${completed}`); // localStorageへの保存状態をログ出力
  }
  
  useEffect(() => {
    const storedState = localStorage.getItem(`goalState-${id}`);
    if (storedState) {
      const loadedGoal = JSON.parse(storedState);
      setGoal(loadedGoal);
    }
  }, [id]); 

  function completeSmallGoal(smallGoalId) {
    // APIを通じてサーバーにsmall goalの完了を通知
    const token = localStorage.getItem('token');
    fetch(`http://localhost:3000/api/goals/${id}/small_goals/${smallGoalId}/complete`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
    .then(response => response.json())  // レスポンスをJSON形式で受け取る
    .then(data => {
      if (data.status === 'success') {
        // small_goalの状態を更新
        const updatedGoals = goal.small_goals.map(sg => {
          if (sg.id === smallGoalId) {
            return { ...sg, completed: true };
          }
          return sg;
        });
        setGoal({ ...goal, small_goals: updatedGoals });

        // dashboardページへリダイレクトし、成功メッセージを表示
        router.push({
          pathname: '/dashboard',
          query: { message: encodeURIComponent(data.message) }  // エンコードされたメッセージをクエリパラメータに設定
        });
      } else {
        alert('Failed to complete small goal.');
      }
    })
    .catch(error => {
      console.error('Error completing small goal:', error);
    });
  }

    const allTasksCompleted = goal.small_goals?.every(smallGoal =>
      smallGoal.tasks?.every(task => task.completed)
    );

  if (loading) return <p>Loading...</p>;
  if (!goal) return <p>Goal not found</p>;

  return (
    <Layout>
      <div>
        <h1>Goal Title:</h1>
        <h3>{goal.title}</h3>
        {goal.completed ? (
          <p>このGoalは達成しました!</p>
        ) : (
          <>
            <p>このGoalを完了しますか?</p>
            {goal.small_goals?.some(sg => !sg.completed) ? (
              <button disabled className="btn btn-success">Goalを達成する</button>
            ) : (
              <button className="btn btn-success">Goalを達成する</button>
            )}
          </>
        )}

        <h2>Goal Content:</h2>
        <h3>{goal.content}</h3>
        <p>Deadline: {goal.deadline ? formatDate(goal.deadline) : 'No deadline'}</p>

        {goal.small_goals.map(smallGoal => (
          <div key={smallGoal.id} className="small-goal">
            <h2>Small Goal Title:</h2>
            <h3>{smallGoal.title}</h3>
            {smallGoal.completed ? <span><strong>完了!</strong></span> : null}

            {/* smallGoalが未完了で、全てのタスクが完了していれば完了ボタンを表示 */}
            {!smallGoal.completed && smallGoal.tasks?.every(task => task.completed) && (
              <button className="btn btn-success" onClick={() => completeSmallGoal(smallGoal.id)}>完了</button>
            )}

            <p>Difficulty: {smallGoal.difficulty}</p>
            <p>Deadline: {smallGoal.deadline ? formatDate(smallGoal.deadline) : 'No deadline'}</p>

            {/* 各smallGoalのタスクが全て完了しているか確認 */}
            {!smallGoal.completed && (
              <ul>
                {smallGoal.tasks?.map((task) => (
                  <li key={task.id}>
                    <label>
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={() => handleTaskToggle(task.id)}
                        className="input-checkbox"
                      />
                      {task.content}
                    </label>
                  </li>
                ))}
              </ul>
            )}
            <div>**************************************</div>
          </div>
        ))}

        <Link href={`/goals/${goal.id}/edit`}>
          <div>Edit Goal</div>
        </Link>
        <Link href={`/index-goal`} onClick={deleteGoal}>
          <div>Delete Goal</div>
        </Link>
        <Link href={`/goals/${goal.id}/new-small_goal`}>
          <div className={'btn btn-primary'}>Add New Small Goal</div>
        </Link>
        <Link href="/index-goal">
          <div className={'btn btn-primary'}>Back</div>
        </Link>
      </div>
    </Layout>
  );
}

export default GoalPage;