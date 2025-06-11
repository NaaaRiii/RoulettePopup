import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import EditSmallGoalModal from '../components/EditSmallGoal';

describe('EditSmallGoalModal コンポーネント', () => {
  describe.each([
    {
      name: 'isOpen=false の場合',
      props: {
        isOpen: false,
        onClose: () => {},
        smallGoal: {
          id: 1,
          title: 'テストSmall Goal',
          difficulty: '普通',
          deadline: '2024-03-20',
          tasks: [{ id: 1, content: 'タスク1' }]
        },
        goalId: 1,
        onSmallGoalUpdated: () => {}
      }
    },
    {
      name: 'smallGoal=null の場合',
      props: {
        isOpen: true,
        onClose: () => {},
        smallGoal: null,
        goalId: 1,
        onSmallGoalUpdated: () => {}
      }
    }
  ])('$name', ({ props }) => {
    it('何もレンダリングされない', () => {
      const { container } = render(<EditSmallGoalModal {...props} />);
      
      // コンテナが空であることを確認
      expect(container).toBeEmptyDOMElement();
    });
  });

  describe('smallGoal を渡したとき', () => {
    const mockSmallGoal = {
      id: 1,
      title: 'テストSmall Goal',
      difficulty: '普通',
      deadline: '2024-03-20',
      tasks: [
        { id: 1, content: 'タスク1' },
        { id: 2, content: 'タスク2' }
      ]
    };

    const defaultProps = {
      isOpen: true,
      onClose: () => {},
      smallGoal: mockSmallGoal,
      goalId: 1,
      onSmallGoalUpdated: () => {}
    };

    it('各ステートが正しく初期化される', () => {
      render(<EditSmallGoalModal {...defaultProps} />);

      // title の初期化を確認
      const titleInput = screen.getByLabelText('Small Goalのタイトル');
      expect(titleInput).toHaveValue(mockSmallGoal.title);

      // difficulty の初期化を確認
      const difficultySelect = screen.getByLabelText('Difficulty');
      expect(difficultySelect).toHaveValue(mockSmallGoal.difficulty);

      // deadline の初期化を確認
      const deadlineInput = screen.getByLabelText('期限');
      expect(deadlineInput).toHaveValue(mockSmallGoal.deadline);

      // tasks の初期化を確認
      const taskInputs = screen.getAllByLabelText('Task');
      expect(taskInputs).toHaveLength(mockSmallGoal.tasks.length);
      
      mockSmallGoal.tasks.forEach((task, index) => {
        expect(taskInputs[index]).toHaveValue(task.content);
      });
    });
  });
}); 