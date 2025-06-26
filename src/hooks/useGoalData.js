import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/router';
import { fetchWithAuth } from '../utils/fetchWithAuth';

export const useGoalData = () => {
  const router = useRouter();
  const { goalId } = router.query;
  
  const [goal, setGoal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [smallGoalsError, setSmallGoalsError] = useState(null);

  // クエリパラメータからメッセージを取得
  useEffect(() => {
    const messageFromQuery = router.query.message;
    if (messageFromQuery) {
      setMessage(decodeURIComponent(messageFromQuery));
    }
  }, [router.query]);

  // 目標データを取得する関数
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

  // goalIdが変更されたときにデータを再取得
  useEffect(() => {
    if (goalId) {
      fetchGoalData();
    } else {
      console.error('goalId is undefined.');
    }
  }, [goalId, fetchGoalData]);

  // タスクの完了状態を切り替える関数
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

  // 目標データを更新する関数（モーダルからのコールバック用）
  const handleGoalUpdated = async (updatedGoal) => {
    await fetchGoalData();
  };

  // Small Goalを更新する関数（モーダルからのコールバック用）
  const handleSmallGoalUpdated = async (updatedSmallGoal) => {
    await fetchGoalData();
  };

  // Small Goalを追加する関数（モーダルからのコールバック用）
  const handleSmallGoalAdded = async (newSmallGoal) => {
    await fetchGoalData();
  };

  return {
    // 状態
    goal,
    loading,
    message,
    smallGoalsError,
    
    // 関数
    fetchGoalData,
    handleTaskToggle,
    handleGoalUpdated,
    handleSmallGoalUpdated,
    handleSmallGoalAdded,
    setGoal,
  };
}; 