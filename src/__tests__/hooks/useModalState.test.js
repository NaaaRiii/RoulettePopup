import { renderHook, act } from '@testing-library/react';
import { useModalState } from '../../hooks/useModalState';

describe('useModalStateフック', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    console.error.mockRestore();
  });

  it('初期状態では全てのモーダルが閉じている', () => {
    const { result } = renderHook(() => useModalState());

    expect(result.current.isCreateSmallGoalModalOpen).toBe(false);
    expect(result.current.isEditGoalModalOpen).toBe(false);
    expect(result.current.isEditSmallGoalModalOpen).toBe(false);
    expect(result.current.selectedSmallGoal).toBe(null);
  });

  describe('CreateSmallGoal モーダル', () => {
    it('openCreateSmallGoalModal でモーダルが開く', () => {
      const { result } = renderHook(() => useModalState());

      act(() => {
        result.current.openCreateSmallGoalModal();
      });

      expect(result.current.isCreateSmallGoalModalOpen).toBe(true);
    });

    it('closeCreateSmallGoalModal でモーダルが閉じる', () => {
      const { result } = renderHook(() => useModalState());

      act(() => {
        result.current.openCreateSmallGoalModal();
      });

      act(() => {
        result.current.closeCreateSmallGoalModal();
      });

      expect(result.current.isCreateSmallGoalModalOpen).toBe(false);
    });
  });

  describe('EditGoal モーダル', () => {
    it('openEditGoalModal でモーダルが開く', () => {
      const { result } = renderHook(() => useModalState());

      act(() => {
        result.current.openEditGoalModal();
      });

      expect(result.current.isEditGoalModalOpen).toBe(true);
    });

    it('closeEditGoalModal でモーダルが閉じる', () => {
      const { result } = renderHook(() => useModalState());

      act(() => {
        result.current.openEditGoalModal();
      });

      act(() => {
        result.current.closeEditGoalModal();
      });

      expect(result.current.isEditGoalModalOpen).toBe(false);
    });
  });

  describe('EditSmallGoal モーダル', () => {
    const mockSmallGoal = {
      id: 1,
      title: 'Test Small Goal',
      completed: false,
      difficulty: 'Easy',
      deadline: null,
      tasks: []
    };

    it('openEditSmallGoalModal でモーダルが開き、selectedSmallGoalが設定される', () => {
      const { result } = renderHook(() => useModalState());

      act(() => {
        result.current.openEditSmallGoalModal(mockSmallGoal);
      });

      expect(result.current.isEditSmallGoalModalOpen).toBe(true);
      expect(result.current.selectedSmallGoal).toEqual(mockSmallGoal);
    });

    it('closeEditSmallGoalModal でモーダルが閉じ、selectedSmallGoalがリセットされる', () => {
      const { result } = renderHook(() => useModalState());

      act(() => {
        result.current.openEditSmallGoalModal(mockSmallGoal);
      });

      act(() => {
        result.current.closeEditSmallGoalModal();
      });

      expect(result.current.isEditSmallGoalModalOpen).toBe(false);
      expect(result.current.selectedSmallGoal).toBe(null);
    });

    it('openEditSmallGoalModal に smallGoal が渡されない場合、エラーがログされる', () => {
      const { result } = renderHook(() => useModalState());

      act(() => {
        result.current.openEditSmallGoalModal(null);
      });

      expect(console.error).toHaveBeenCalledWith('Small Goal is missing');
      expect(result.current.isEditSmallGoalModalOpen).toBe(false);
      expect(result.current.selectedSmallGoal).toBe(null);
    });

    it('openEditSmallGoalModal に undefined が渡される場合、エラーがログされる', () => {
      const { result } = renderHook(() => useModalState());

      act(() => {
        result.current.openEditSmallGoalModal(undefined);
      });

      expect(console.error).toHaveBeenCalledWith('Small Goal is missing');
      expect(result.current.isEditSmallGoalModalOpen).toBe(false);
      expect(result.current.selectedSmallGoal).toBe(null);
    });
  });

  describe('モーダルの独立性', () => {
    it('異なるモーダルは独立して動作する', () => {
      const { result } = renderHook(() => useModalState());

      act(() => {
        result.current.openCreateSmallGoalModal();
      });

      expect(result.current.isCreateSmallGoalModalOpen).toBe(true);
      expect(result.current.isEditGoalModalOpen).toBe(false);
      expect(result.current.isEditSmallGoalModalOpen).toBe(false);

      act(() => {
        result.current.openEditGoalModal();
      });

      expect(result.current.isCreateSmallGoalModalOpen).toBe(true);
      expect(result.current.isEditGoalModalOpen).toBe(true);
      expect(result.current.isEditSmallGoalModalOpen).toBe(false);

      const mockSmallGoal = { id: 1, title: 'Test' };
      act(() => {
        result.current.openEditSmallGoalModal(mockSmallGoal);
      });

      expect(result.current.isCreateSmallGoalModalOpen).toBe(true);
      expect(result.current.isEditGoalModalOpen).toBe(true);
      expect(result.current.isEditSmallGoalModalOpen).toBe(true);
      expect(result.current.selectedSmallGoal).toEqual(mockSmallGoal);
    });
  });

  describe('関数の存在確認', () => {
    it('必要な関数が全て存在する', () => {
      const { result } = renderHook(() => useModalState());

      expect(typeof result.current.openCreateSmallGoalModal).toBe('function');
      expect(typeof result.current.closeCreateSmallGoalModal).toBe('function');
      expect(typeof result.current.openEditGoalModal).toBe('function');
      expect(typeof result.current.closeEditGoalModal).toBe('function');
      expect(typeof result.current.openEditSmallGoalModal).toBe('function');
      expect(typeof result.current.closeEditSmallGoalModal).toBe('function');
    });
  });
}); 