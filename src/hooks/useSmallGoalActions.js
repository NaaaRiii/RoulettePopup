import { useRouter } from 'next/router';
import { fetchWithAuth } from '../utils/fetchWithAuth';

export const useSmallGoalActions = ({ goalId, setGoal }) => {
  const router = useRouter();

  // Small Goalの削除
  const deleteSmallGoal = async (smallGoalId) => {
    if (window.confirm('Are you sure?')) {
      try {
        const response = await fetchWithAuth(
          `/api/goals/${goalId}/small_goals/${smallGoalId}`,
          { method: 'DELETE' }
        );
        if (response.ok) {
          setGoal(prevGoal => ({
            ...prevGoal,
            small_goals: prevGoal.small_goals.filter(sg => sg.id !== smallGoalId)
          }));
          alert('Small Goalが削除されました。');
        } else {
          alert('Small Goalの削除に失敗しました。');
        }
      } catch {
        alert('通信に失敗しました。');
      }
    }
  };

  // Small Goalの完了
  const completeSmallGoal = async (smallGoalId, goal, setGoal) => {
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

  return {
    deleteSmallGoal,
    completeSmallGoal,
  };
}; 