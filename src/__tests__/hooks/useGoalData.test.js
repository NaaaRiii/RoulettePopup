import { renderHook, act, waitFor } from '@testing-library/react';
import { useGoalData } from '../../hooks/useGoalData';
import { fetchWithAuth } from '../../utils/fetchWithAuth';


jest.mock('../../utils/fetchWithAuth');
jest.mock('next/router', () => ({
  useRouter: () => ({
    query: { goalId: '123' },
    push: jest.fn(),
  }),
}));

describe('useGoalDataフック', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    console.error.mockRestore();
  });

  it('初期状態ではloadingがtrueでgoalがnull', () => {
    const { result } = renderHook(() => useGoalData());

    expect(result.current.loading).toBe(true);
    expect(result.current.goal).toBe(null);
    expect(result.current.message).toBe('');
    expect(result.current.smallGoalsError).toBe(null);
  });

  describe('fetchGoalData', () => {
    it('正常にデータを取得した場合、goalとloadingが更新される', async () => {
      const mockGoalDetails = {
        id: 123,
        title: 'Test Goal',
        content: 'Test Content',
        completed: false,
        deadline: null,
      };

      const mockSmallGoals = [
        {
          id: 1,
          title: 'Small Goal 1',
          completed: false,
          difficulty: 'Easy',
          deadline: null,
          tasks: [],
        },
      ];

      fetchWithAuth
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockGoalDetails,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockSmallGoals,
        });

      const { result } = renderHook(() => useGoalData());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.goal).toEqual({
        ...mockGoalDetails,
        small_goals: mockSmallGoals,
      });
      expect(result.current.smallGoalsError).toBe(null);
    });

    it('目標詳細の取得に失敗した場合、エラーが設定される', async () => {
      fetchWithAuth.mockResolvedValueOnce({
        ok: false,
      });

      const { result } = renderHook(() => useGoalData());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.goal).toBe(null);
      expect(console.error).toHaveBeenCalledWith(
        'Failed to fetch goal data',
        expect.any(Error)
      );
    });

    it('Small Goalsの取得に失敗した場合、エラーが設定される', async () => {
      const mockGoalDetails = {
        id: 123,
        title: 'Test Goal',
        content: 'Test Content',
        completed: false,
        deadline: null,
      };

      fetchWithAuth
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockGoalDetails,
        })
        .mockResolvedValueOnce({
          ok: false,
        });

      const { result } = renderHook(() => useGoalData());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.goal).toBe(null);
      expect(console.error).toHaveBeenCalledWith(
        'Failed to fetch goal data',
        expect.any(Error)
      );
    });

    it('Small Goalsのデータ形式が無効な場合、エラーメッセージが設定される', async () => {
      const mockGoalDetails = {
        id: 123,
        title: 'Test Goal',
        content: 'Test Content',
        completed: false,
        deadline: null,
      };

      fetchWithAuth
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockGoalDetails,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => 'invalid data',
        });

      const { result } = renderHook(() => useGoalData());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.goal).toEqual({
        ...mockGoalDetails,
        small_goals: [],
      });
      expect(result.current.smallGoalsError).toBe('Invalid data format for small goals.');
    });
  });

  describe('handleTaskToggle', () => {
    it('タスクの完了状態を正常に切り替える', async () => {
      const mockGoal = {
        id: 123,
        title: 'Test Goal',
        small_goals: [
          {
            id: 1,
            title: 'Small Goal 1',
            tasks: [
              { id: 1, content: 'Task 1', completed: false },
              { id: 2, content: 'Task 2', completed: true },
            ],
          },
        ],
      };

      fetchWithAuth
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockGoal,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [],
        })
        .mockResolvedValueOnce({
          ok: true,
        });

      const { result } = renderHook(() => useGoalData());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.handleTaskToggle(1, false);
      });

      expect(fetchWithAuth).toHaveBeenCalledWith(
        '/api/tasks/1/complete',
        {
          method: 'POST',
          body: JSON.stringify({ completed: true }),
        }
      );
    });

    it('タスクの更新に失敗した場合、エラーがログに出力される', async () => {
      const mockGoal = {
        id: 123,
        title: 'Test Goal',
        small_goals: [
          {
            id: 1,
            title: 'Small Goal 1',
            tasks: [
              { id: 1, content: 'Task 1', completed: false },
            ],
          },
        ],
      };

      fetchWithAuth
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockGoal,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [],
        })
        .mockResolvedValueOnce({
          ok: false,
        });

      const { result } = renderHook(() => useGoalData());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.handleTaskToggle(1, false);
      });

      expect(console.error).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('コールバック関数', () => {
    it('handleGoalUpdatedがfetchGoalDataを呼び出す', async () => {
      fetchWithAuth
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ id: 123, title: 'Test Goal' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [],
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ id: 123, title: 'Test Goal' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [],
        });

      const { result } = renderHook(() => useGoalData());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.handleGoalUpdated({ id: 123 });
      });

      expect(fetchWithAuth).toHaveBeenCalledTimes(4);
    });

    it('handleSmallGoalUpdatedがfetchGoalDataを呼び出す', async () => {
      fetchWithAuth
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ id: 123, title: 'Test Goal' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [],
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ id: 123, title: 'Test Goal' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [],
        });

      const { result } = renderHook(() => useGoalData());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.handleSmallGoalUpdated({ id: 1 });
      });

      expect(fetchWithAuth).toHaveBeenCalledTimes(4);
    });

    it('handleSmallGoalAddedがfetchGoalDataを呼び出す', async () => {
      fetchWithAuth
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ id: 123, title: 'Test Goal' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [],
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ id: 123, title: 'Test Goal' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [],
        });

      const { result } = renderHook(() => useGoalData());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.handleSmallGoalAdded({ id: 1 });
      });

      expect(fetchWithAuth).toHaveBeenCalledTimes(4);
    });
  });
}); 