import { format } from 'date-fns';
import { useRouter } from 'next/router';
import { useGoals } from '../../contexts/GoalsContext';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Layout from '../../components/Layout';
import '../../components/styles.css';


function GoalPage() {
  const router = useRouter();
  const { goalId } = router.query;
  const [goal, setGoal] = useState({ small_goals: [] });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const { refreshGoals } = useGoals();

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return format(date, 'yyyy-MM-dd');
  };

  useEffect(() => {
    const messageFromQuery = router.query.message;
    if (messageFromQuery) {
      setMessage(decodeURIComponent(messageFromQuery));
    }
  }, [router.query]);

  useEffect(() => {
    if (goalId) {
      fetchGoalData();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [goalId]);

  const fetchGoalData = async () => {
    try {
      const [goalDetailsResponse, smallGoalsResponse] = await Promise.all([
        fetch(`http://localhost:3000/api/goals/${goalId}`, {
          method: 'GET',
          credentials: 'include'
        }),
        fetch(`http://localhost:3000/api/goals/${goalId}/small_goals`, {
          method: 'GET',
          credentials: 'include'
        })
      ]);

      if (!goalDetailsResponse.ok || !smallGoalsResponse.ok) {
        throw new Error('Unauthorized');
      }

      const goalDetails = await goalDetailsResponse.json();
      const smallGoalsData = await smallGoalsResponse.json();

      setGoal({
        ...goalDetails,
        small_goals: smallGoalsData.map(smallGoal => ({
          ...smallGoal,
          tasks: smallGoal.tasks
        }))
      });
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch goal data', error);
    }
  };

  const handleTaskToggle = async (taskId, currentStatus) => {
    const newCompleted = !currentStatus;
    const token = localStorage.getItem('token');

    try {
      const response = await fetch(`http://localhost:3000/api/tasks/${taskId}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include',
        body: JSON.stringify({ completed: newCompleted })
      });

      if (!response.ok) {
        throw new Error('Failed to update task');
      }

      setGoal(prevGoal => {
        const updatedSmallGoals = prevGoal.small_goals.map(smallGoal => ({
          ...smallGoal,
          tasks: smallGoal.tasks.map(task => 
            task.id === taskId ? { ...task, completed: newCompleted } : task
          )
        }));
        return { ...prevGoal, small_goals: updatedSmallGoals };
      });

    } catch (error) {
      console.error(error);
    }
  };

  const deleteGoal = () => {
    if (window.confirm('Are you sure ?')) {
      fetch(`http://localhost:3000/api/goals/${goalId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      })
      .then(response => {
        if (response.ok) {
          refreshGoals();
          router.push('/index-goal');
        } else {
          alert('Failed to delete the goal.');
        }
      })
      .catch(() => alert('Communication has failed.'));
    }
  };

  const deleteSmallGoal = (smallGoalId) => {
    if (window.confirm('Are you sure?')) {
      fetch(`http://localhost:3000/api/goals/${goalId}/small_goals/${smallGoalId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      })
      .then(response => {
        if (response.ok) {
          setGoal(prevGoal => ({
            ...prevGoal,
            small_goals: prevGoal.small_goals.filter(sg => sg.id !== smallGoalId)
          }));
          alert('小目標が削除されました。');
        } else {
          alert('小目標の削除に失敗しました。');
        }
      })
      .catch(() => alert('通信に失敗しました。'));
    }
  };

  const completeGoal = async () => {
    const response = await fetch(`http://localhost:3000/api/goals/${goalId}/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include' 
    });
    const data = await response.json();
    if (response.ok) {
      router.push({
        pathname: '/dashboard',
        query: { message: encodeURIComponent(data.message) }
      });
    } else {
      alert(data.message);
    }
  };

  const completeSmallGoal = async (smallGoalId) => {
    try {
      const response = await fetch(`http://localhost:3000/api/goals/${goalId}/small_goals/${smallGoalId}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include' 
      });

      const data = await response.json();
      if (response.ok) {
        const updatedGoals = goal.small_goals.map(sg => {
          if (sg.id === smallGoalId) {
            return { ...sg, completed: true };
          }
          return sg;
        });
        setGoal({ ...goal, small_goals: updatedGoals });

        router.push({
          pathname: '/dashboard',
          query: { message: encodeURIComponent(data.message) }
        });
      } else {
        alert('Failed to complete small goal.');
      }
    } catch (error) {
      console.error('Error completing small goal:', error);
    }
  };

  if (loading) return <p>Loading...</p>;
  if (!goal) return <p>Goal not found</p>;

  return (
    <Layout>
      <div>
        {message && <p>{message}</p>}
        <h1>Goal Title:</h1>
        <h3>{goal.title}</h3>
        {goal.completed ? (
          <p>このGoalは達成しました!</p>
        ) : (
          <>
            <p>このGoalを完了しますか?</p>
            {goal.small_goals?.some(sg => !sg.completed) ? (
              <button disabled className="btn btn-success">Completed Goal</button>
            ) : (
              <button onClick={completeGoal} className="btn btn-success">Completed Goal</button>
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
            
            {!smallGoal.completed && (
              <>
                <Link href={`/goals/${goalId}/small_goals/${smallGoal.id}/edit`}>
                  <div>Edit Small Goal</div>
                </Link>
                <Link href={`/goals/${goalId}`} onClick={(e) => {
                  e.preventDefault();
                  deleteSmallGoal(smallGoal.id);
                }}>
                  <div>Delete Small Goal</div>
                </Link>
              </>
            )}

            {/* 各smallGoalのタスクが全て完了しているか確認 */}
            {!smallGoal.completed && (
              <ul>
                {smallGoal.tasks?.map((task) => (
                  <li key={task.id}>
                    <label>
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={() => handleTaskToggle(task.id, task.completed)}
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

        {!goal.completed && (
          <>
            <Link href={`/goals/${goalId}/edit`}>
              <div>Edit Goal</div>
            </Link>
            <Link href={`/index-goal`} onClick={deleteGoal}>
              <div>Delete Goal</div>
            </Link>
          </>
        )}

        <div class="button-container">
          <Link href={`/goals/${goalId}/new-small_goal`}>
            <div className={'btn btn-primary'}>Add New Small Goal</div>
          </Link>
          <Link href="/dashboard">
            <div className={'btn btn-primary'}>Back</div>
          </Link>
          </div>
        </div>
    </Layout>
  );
}

export default GoalPage;
