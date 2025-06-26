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
import { useGoalData } from '../../hooks/useGoalData';
import { useGoalActions } from '../../hooks/useGoalActions';
import { useSmallGoalActions } from '../../hooks/useSmallGoalActions';
import '../../components/styles.css';

function GoalPage() {
  const { goalsState, setGoalsState, refreshGoals } = useGoals();
  const router = useRouter();
  const { goalId } = router.query;

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

  const {
    goal,
    loading,
    message,
    smallGoalsError,
    handleTaskToggle,
    handleGoalUpdated,
    handleSmallGoalUpdated,
    handleSmallGoalAdded,
    setGoal,
  } = useGoalData();

  const { deleteGoal, completeGoal } = useGoalActions({ goalId, refreshGoals });
  const { deleteSmallGoal, completeSmallGoal } = useSmallGoalActions({ goalId, setGoal });

  useEffect(() => {
    console.log("Goal state updated:", goal);
  }, [goal]);

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
                      {!smallGoal.completed && smallGoal.tasks?.every(task => task.completed) && (
                        <button className="btn btn-success" onClick={() => completeSmallGoal(smallGoal.id, goal, setGoal)}>
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
                  <div className="goalid-small-goal__tasks-completed">
                    <ul>
                      {smallGoal.tasks?.map(task => (
                        <li key={task.id}>
                          ・{task.content}
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
