import { format } from 'date-fns';
import { useRouter } from 'next/router';
import { useGoals } from '../../contexts/GoalsContext';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Layout from '../../components/Layout';
import ExpCalendar from '../../components/Calendar';
import CreateSmallGoal from '../../components/CreateSmallGoal';
import EditGoalModal from '../../components/EditGoal';
import EditSmallGoalModal from '../../components/EditSmallGoal';
import '../../components/styles.css';

function GoalPage() {
  const { goalsState, setGoalsState } = useGoals();
  const router = useRouter();
  const { goalId } = router.query;
  const [goal, setGoal] = useState({ small_goals: [] });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const { refreshGoals } = useGoals();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditGoalModalOpen, setIsEditGoalModalOpen] = useState(false);
  const [isEditSmallGoalModalOpen, setIsEditSmallGoalModalOpen] = useState(false);
  const [selectedSmallGoal, setSelectedSmallGoal] = useState(null);

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const openEditGoalModal = () => {
    setIsEditGoalModalOpen(true);
  };

  const closeEditGoalModal = () => {
    setIsEditGoalModalOpen(false);
  };

  const openEditSmallGoalModal = (smallGoal) => {
    if (smallGoal && goalId) {
      setSelectedSmallGoal(smallGoal);
      setIsEditSmallGoalModalOpen(true);
    } else {
      console.error("Small Goal or Goal ID is missing");
    }
  };

  const closeEditSmallGoalModal = () => {
    setIsEditSmallGoalModalOpen(false);
  };

  const handleGoalUpdated = async (updatedGoal) => {
    await fetchGoalData();
  };

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

  const fetchGoalData = useCallback(async () => {
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
  }, [goalId]);

  useEffect(() => {
    if (goalId) {
      fetchGoalData();
    } else {
      console.error('goalId is undefined.');
    }
  }, [goalId, fetchGoalData]);

  const handleTaskToggle = async (taskId, currentStatus) => {
    const newCompleted = !currentStatus;

    try {
      const response = await fetch(`http://localhost:3000/api/tasks/${taskId}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })
        .then(response => {
          if (response.ok) {
            // goalが削除されたことを確認するアラートを表示
            alert('goalが削除されました');

            // 最新の目標データを取得して更新
            refreshGoals();
  
            // アラートのOKボタンを押した後にdashboardに遷移
            router.push('/dashboard');
          } else {
            console.error(`Error: ${response.statusText}`);
            alert('Failed to delete the goal.');
          }
        })
        .catch(error => {
          console.error('Communication has failed:', error);
          alert('Communication has failed.');
        });
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
          alert('Small Goalが削除されました。');
        } else {
          alert('Small Goalの削除に失敗しました。');
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

  const handleSmallGoalUpdated = async (updatedSmallGoal) => {
    await fetchGoalData();
  };
  

  useEffect(() => {
    console.log("Goal state updated:", goal);
  }, [goal]);

  const handleSmallGoalAdded = async (newSmallGoal) => {
    await fetchGoalData();
  };

  if (loading) return <p>Loading...</p>;
  if (!goal) return <p>Goal not found</p>;

  return (
    <Layout>
      <div className='goal-page-container'>
        <div className='goal-content'>
        {message && <p>{message}</p>}
          <div className='goal-content-top'>
            <div className='goal-content-top-left-container'>
              <div className='goal-content-top-left-card'>
                <h2>目標 : {goal.title}</h2>
                  <div className='completed-goal-button-container'>
                    {goal.completed ? (
                      <p>このGoalは達成しました!</p>
                    ) : (
                      <>
                        <p>このGoalを完了しますか?</p>
                          {goal.small_goals?.some(sg => !sg.completed) ? (
                            <button disabled className='completed-goal-button'>Completed Goal</button>
                          ) : (
                            <button onClick={completeGoal} className='button-completed-goal'>Completed Goal</button>
                          )}
                      </>
                    )}
                  </div>

                <div className='goal-content-top-left-lower-part'>
                  <h2>内容 : {goal.content}</h2>
                  <p className='deadline-text'>期限: {goal.deadline ? formatDate(goal.deadline) : 'No deadline'}</p>
                  <div className='goal-content-top-left-lower-part-link'>
                    {!goal.completed && (
                      <>
                        <Link href={`#`} onClick={openEditGoalModal}>
                          <div className='edit-goal-link'>
                            目標を編集する
                          </div>
                        </Link>
                        <EditGoalModal 
                          isOpen={isEditGoalModalOpen} 
                          onClose={closeEditGoalModal} 
                          goalId={goalId}
                          onGoalUpdated={handleGoalUpdated}
                        />

                      </>
                    )}

                    <div className='add-small-goal-button'>
                      <Link href={`#`} onClick={openModal}>
                        <div className='add-small-goal-button-link'>
                          Small Goalの作成
                        </div>
                      </Link>
                      <CreateSmallGoal
                        isOpen={isModalOpen}
                        onClose={closeModal}
                        goalId={goalId}
                        onSmallGoalAdded={handleSmallGoalAdded}
                      />
                    </div>
                  </div>

                  <Link href={`#`} onClick={deleteGoal}>
                    <div className='delete-goal-link'>
                      Delete Goal
                    </div>
                  </Link>
                  
                </div>
              </div>
            </div>

            <div className='goal-content-top-right-container'>
              <div className='calendar'>
                <ExpCalendar />
              </div>
            </div>
          </div>

          <div className="goal-content-bottom">

            {/* 未完了のSmall Goalsセクション */}
            <div className="goal-content-bottom-top">
              {goal.small_goals.filter(smallGoal => !smallGoal.completed).map(smallGoal => (
                <div key={smallGoal.id} className="c-card goalid-small-goal">
                  <div className={'goalid-small-goal__top'}>
                    <div className="goalid-small-goal__left">
                      <h3 className="goalid-small-goal__title">{smallGoal.title}</h3>
                    </div>
                    <div className="goalid-small-goal__right">
                      <p className="goalid-small-goal__deadline">Deadline: {smallGoal.deadline ? formatDate(smallGoal.deadline) : 'No deadline'}</p>
                      <p className="goalid-small-goal__difficulty">Difficulty: {smallGoal.difficulty}</p>
                    </div>
                  </div>

                    <div className="goalid-small-goal__bottom">
                      <div className="goalid-small-goal__tasks">
                        <ul>
                          {smallGoal.tasks?.map(task => (
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
                        {/* タスクが全て完了している場合に完了ボタンを表示 */}
                        {!smallGoal.completed && smallGoal.tasks?.every(task => task.completed) && (
                          <button className="btn btn-success" onClick={() => completeSmallGoal(smallGoal.id)}>
                            完了
                          </button>
                        )}
                      </div>

                      <div className='goalid-small-goal__actions'>
                        <Link href='#' onClick={(e) => { e.preventDefault(); openEditSmallGoalModal(smallGoal); }}>
                          <div className='goalid-small-goal__edit-link'>Edit</div>
                        </Link>
                        <Link href='#' onClick={(e) => { e.preventDefault(); deleteSmallGoal(smallGoal.id); }}>
                          <div className='goalid-small-goal__delete-link'>Delete</div>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <EditSmallGoalModal
                isOpen={isEditSmallGoalModalOpen}
                onClose={closeEditSmallGoalModal}
                smallGoal={selectedSmallGoal}
                goalId={goalId}
                onSmallGoalUpdated={handleSmallGoalUpdated}
              />

              <div className="goal-content-bottom-bottom">
                {goal.small_goals.filter(smallGoal => smallGoal.completed).map(smallGoal => (
                  <div key={smallGoal.id} className="c-card goalid-small-goal">
                    <div className={`goalid-small-goal__top goalid-small-goal__top--completed`}>
                      <div className="goalid-small-goal__left">
                        <h3 className="goalid-small-goal__title">{smallGoal.title}</h3>
                      </div>
                      <div className="goalid-small-goal__right">
                        <p className="goalid-small-goal__deadline">Deadline: {smallGoal.deadline ? formatDate(smallGoal.deadline) : 'No deadline'}</p>
                        <p className="goalid-small-goal__difficulty">Difficulty: {smallGoal.difficulty}</p>
                      </div>
                      <span className="completed-text"><strong>完了!</strong></span>
                    </div>

                    {/* タスクを「・」付きで表示 */}
                    <div className="goalid-small-goal__tasks-completed">
                      <ul>
                        {smallGoal.tasks?.map(task => (
                          <li key={task.id}>
                            ・{task.content} {/* チェックボックスの代わりに「・」を表示 */}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
    </Layout>
  );
}

export default GoalPage;