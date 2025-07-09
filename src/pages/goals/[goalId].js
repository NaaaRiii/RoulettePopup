import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import { useGoals } from '../../contexts/GoalsContext';
import { useContext } from 'react';
import { TicketsContext } from '../../contexts/TicketsContext';
import Layout from '../../components/Layout';
import ExpCalendar from '../../components/Calendar';
import GoalHeader from '../../components/GoalHeader';
import SmallGoalList from '../../components/SmallGoalList';
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
              <GoalHeader
                goal={goal}
                goalId={goalId}
                onCompleteGoal={completeGoal}
                onOpenEditGoalModal={openEditGoalModal}
                onOpenCreateSmallGoalModal={openCreateSmallGoalModal}
                isEditGoalModalOpen={isEditGoalModalOpen}
                isCreateSmallGoalModalOpen={isCreateSmallGoalModalOpen}
                onCloseEditGoalModal={closeEditGoalModal}
                onCloseCreateSmallGoalModal={closeCreateSmallGoalModal}
                onGoalUpdated={handleGoalUpdated}
                onSmallGoalAdded={handleSmallGoalAdded}
                onDeleteGoal={deleteGoal}
              />
            </div>

            <div className='goal-content-top-right-container'>
              <div className='calendar'>
                <ExpCalendar />
              </div>
            </div>
          </div>

          <SmallGoalList
            goal={goal}
            selectedSmallGoal={selectedSmallGoal}
            isEditSmallGoalModalOpen={isEditSmallGoalModalOpen}
            onCloseEditSmallGoalModal={closeEditSmallGoalModal}
            onTaskToggle={handleTaskToggle}
            onCompleteSmallGoal={completeSmallGoal}
            onOpenEditSmallGoalModal={openEditSmallGoalModal}
            onDeleteSmallGoal={deleteSmallGoal}
            onSmallGoalUpdated={handleSmallGoalUpdated}
            setGoal={setGoal}
          />
        </div>
      </div>
    </Layout>
  );
}

export default GoalPage;
