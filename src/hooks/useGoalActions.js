import { useRouter } from 'next/router';
import { useContext } from 'react';
import { TicketsContext } from '../contexts/TicketsContext';
import { fetchWithAuth } from '../utils/fetchWithAuth';

export const useGoalActions = ({ goalId, refreshGoals }) => {
  const router = useRouter();
  const { fetchTickets } = useContext(TicketsContext);

  // 目標の削除
  const deleteGoal = async (event) => {
    if (event) event.preventDefault();
    if (window.confirm('Are you sure ?')) {
      try {
        const response = await fetchWithAuth(`/api/goals/${goalId}`, {
          method: 'DELETE',
        });
        if (response.ok) {
          alert('Goalが削除されました。');
          if (refreshGoals) refreshGoals();
          router.push('/dashboard');
        } else {
          console.error(`Error: ${response.statusText}`);
          alert('Failed to delete the goal.');
        }
      } catch (error) {
        console.error('Communication has failed:', error);
        alert('Communication has failed.');
      }
    }
  };

  // 目標の完了
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
        query: { message: encodeURIComponent(data.message) },
      });
    } else {
      alert(data.message);
    }
  };

  return {
    deleteGoal,
    completeGoal,
  };
}; 