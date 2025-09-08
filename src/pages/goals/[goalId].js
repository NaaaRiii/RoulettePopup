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
import { fetchWithAuth } from '../../utils/fetchWithAuth';
import '../../components/styles.css';

function GoalPage() {
  const { goalsState, setGoalsState, refreshGoals } = useGoals();
  const router = useRouter();
  const { goalId } = router.query;
  const [userData, setUserData] = useState(null);

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
    const fetchUserData = async () => {
      try {
        const res = await fetchWithAuth('/api/current_user');
      if (!res.ok) {
        console.error('Failed to fetch user data');
      } else {
        const data = await res.json();
        setUserData(data);
      }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };
    fetchUserData();
  }, []);

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
      <div className="w-full bg-[#f7f7ed] min-h-screen">
        <div className="flex flex-col min-h-screen bg-[#f7f7ed] p-4 sm:p-6 lg:p-8">
          {message && <p className="text-center py-2 text-green-600">{message}</p>}
          {smallGoalsError && <p className="text-center py-2 text-red-600">{smallGoalsError}</p>}
          
          {/* Top Section - Goal Header and Calendar */}
          <div className="flex flex-col lg:flex-row gap-6 pb-6 border-b-2 border-gray-300 mb-6">
            {/* Goal Header Section */}
            <div className="flex-1 lg:flex-[7] px-2 sm:px-4 lg:pl-8">
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
                userData={userData}
              />
            </div>

            {/* Calendar Section */}
            <div className="flex-1 lg:flex-[3] px-2 sm:px-4">
              <div className="w-full">
                <ExpCalendar />
              </div>
            </div>
          </div>

          {/* Small Goals List Section */}
          <div className="flex-1">
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
              userData={userData}
            />
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default GoalPage;
