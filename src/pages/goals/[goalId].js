import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import { useGoals } from '../../contexts/GoalsContext';
import { useContext } from 'react';
import { TicketsContext } from '../../contexts/TicketsContext';
import { formatDate } from '../../utils/formatDate';
import { fetchWithAuth } from '../../utils/fetchWithAuth';
import Link from 'next/link';
import Layout from '../../components/Layout';
import ExpCalendar from '../../components/Calendar';
import CreateSmallGoal from '../../components/CreateSmallGoal';
import EditGoalModal from '../../components/EditGoal';
import EditSmallGoalModal from '../../components/EditSmallGoal';
import { useModalState } from '../../hooks/useModalState';
import '../../components/styles.css';


function GoalPage() {
  const { goalsState, setGoalsState, refreshGoals } = useGoals();
  const router = useRouter();
  const { goalId } = router.query;
  const [goal, setGoal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [smallGoalsError, setSmallGoalsError] = useState(null);

  const { fetchTickets } = useContext(TicketsContext);
  
  const {
    isCreateSmallGoalModalOpen,
    isEditGoalModalOpen,
    isEditSmallGoalModalOpen,
    selectedSmallGoal,
    openCreateSmallGoalModal,
    closeCreateSmallGoalModal,
    openEditGoalModal,
    closeEditGoalModal,
    openEditSmallGoalModal,
    closeEditSmallGoalModal,
  } = useModalState();

  const handleGoalUpdated = async (updatedGoal) => {
    await fetchGoalData();
  };

  useEffect(() => {
    const messageFromQuery = router.query.message;
    if (messageFromQuery) {
      setMessage(decodeURIComponent(messageFromQuery));
    }
  }, [router.query]);

  const fetchGoalData = useCallback(async () => {
    if (!goalId) {
      console.error('goalId is undefined.');
      return;
    }
    setLoading(true);

    try {
      const goalDetailsResponse = await fetchWithAuth(
        `/api/goals/${goalId}`
      );
      if (!goalDetailsResponse.ok) {
        throw new Error('Failed to fetch goal details');
      }
      const goalDetails = await goalDetailsResponse.json();
      if (!goalDetails) {
        setGoal(null);
        setLoading(false);
        return;
      }

      const smallGoalsResponse = await fetchWithAuth(
        `/api/goals/${goalId}/small_goals`
      );
      if (!smallGoalsResponse.ok) {
        throw new Error('Failed to fetch small goals');
      }
      const smallGoalsData = await smallGoalsResponse.json();
      if (!Array.isArray(smallGoalsData)) {
        console.error('Invalid data format for small_goals:', smallGoalsData);
        setSmallGoalsError('Invalid data format for small goals.');
        setGoal({
          ...goalDetails,
          small_goals: []
        });
        setLoading(false);
        return;
      }
  
      setGoal({
        ...goalDetails,
        small_goals: smallGoalsData.map(smallGoal => ({
          ...smallGoal,
          tasks: smallGoal.tasks
        }))
      });
      setSmallGoalsError(null);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch goal data', error);
      setGoal(null);
      setLoading(false);
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
      const response = await fetchWithAuth(
        `/api/tasks/${taskId}/complete`,
        { method:'POST', body: JSON.stringify({ completed:newCompleted }) }
      );

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

  const deleteGoal = (event) => {
    event.preventDefault();
  
    if (window.confirm('Are you sure ?')) {
      fetchWithAuth(`/api/goals/${goalId}`, {
        method: 'DELETE'
      })
        .then(response => {
          if (response.ok) {
            alert('Goalが削除されました。');
            refreshGoals();
  
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
      fetchWithAuth(
        `/api/goals/${goalId}/small_goals/${smallGoalId}`,
        { method: 'DELETE' }
      )
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
    const response = await fetchWithAuth(
      `/api/goals/${goalId}/complete`,
      { method: 'POST' }
    );

    const data = await response.json();

    if (response.ok) {
     try {
       await fetchTickets();
       console.log('[Goal] after fetchTickets');
     } catch (e) {
       console.error('Failed to refresh tickets', e);
     }
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
      const response = await fetchWithAuth(
        `/api/goals/${goalId}/small_goals/${smallGoalId}/complete`,
        { method: 'POST' }
      );

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
  if (!goal) {
    return (
      <>
        {smallGoalsError && <p className="error-message">{smallGoalsError}</p>}
        <p>Goal not found</p>
      </>
    );
  }

  return (
    <Layout>
      <div className='goal-page-container'>
        <div className='goal-content'>
          {message && <p>{message}</p>}
          {smallGoalsError && <p className="error-message">{smallGoalsError}</p>}
          <div className='goal-content-top'>
            <div className='goal-content-top-left-container'>
              <div className='goal-content-top-left-card'>
                <h2>Goal : {goal.title}</h2>
                <div className='completed-goal-button-container'>
                  {goal.completed ? (
                    <p>このGoalは達成しました!</p>
                  ) : (
                    <>
                      <p>このGoalを完了しますか?</p>
                      {goal.small_goals?.some(sg => !sg.completed) ? (
                        <button disabled className='completed-goal-button'>Goalを完了する
                        </button>
                      ) : (
                        <button onClick={completeGoal} className='button-completed-goal'>Goalを完了する</button>
                      )}
                    </>
                  )}
                </div>

                <div className='goal-content-top-left-lower-part'>
                  <h2>Goalの詳細 : {goal.content}</h2>
                  <p className='deadline-text'>期限: {goal.deadline ? formatDate(goal.deadline) : 'No deadline'}</p>
                  <div className='goal-content-top-left-lower-part-link'>
                    {!goal.completed && (
                      <>
                        <Link href={`#`} onClick={openEditGoalModal}>
                          <div className='edit-goal-link'>
                            Goalを編集する
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
                      <Link href={`#`} onClick={openCreateSmallGoalModal}>
                      <div
                          className="add-small-goal-button-link"
                        >
                          Small Goalの作成
                        </div>
                      </Link>
                      <CreateSmallGoal
                        isOpen={isCreateSmallGoalModalOpen}
                        onClose={closeCreateSmallGoalModal}
                        goalId={goalId}
                        onSmallGoalAdded={handleSmallGoalAdded}
                      />
                    </div>
                  </div>

                  <a href="#" onClick={deleteGoal} data-testid="delete-goal-link" className='delete-goal-link'>
                    Goalを削除する
                  </a>
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
                      <p className="goalid-small-goal__deadline">期限: {smallGoal.deadline ? formatDate(smallGoal.deadline) : 'No deadline'}</p>
                      <p className="goalid-small-goal__difficulty">難易度: {smallGoal.difficulty}</p>
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
                        <div className='goalid-small-goal__edit-link'>編集</div>
                      </Link>
                      <Link href='#' onClick={(e) => { e.preventDefault(); deleteSmallGoal(smallGoal.id); }}>
                      <div className='goalid-small-goal__delete-link' data-testid={`delete-small-goal-${smallGoal.id}`}>
                        削除
                      </div>
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
                      <p className="goalid-small-goal__deadline">期限: {smallGoal.deadline ? formatDate(smallGoal.deadline) : 'No deadline'}</p>
                      <p className="goalid-small-goal__difficulty">難易度: {smallGoal.difficulty}</p>
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
