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
}); 