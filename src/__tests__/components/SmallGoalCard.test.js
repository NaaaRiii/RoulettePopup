import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import SmallGoalCard from '../../components/SmallGoalCard';

jest.mock('next/link', () => {
  const MockLink = ({ children, href, onClick }) => (
    <a href={href} onClick={onClick}>
      {children}
    </a>
  );
  MockLink.displayName = 'MockLink';
  return MockLink;
});

describe('SmallGoalCardコンポーネント', () => {
  const mockSmallGoal = {
    id: 1,
    title: 'Test Small Goal',
    completed: false,
    difficulty: 'Easy',
    deadline: '2024-01-01',
    tasks: [
      { id: 1, content: 'Task 1', completed: false },
      { id: 2, content: 'Task 2', completed: true }
    ]
  };

  const mockProps = {
    smallGoal: mockSmallGoal,
    isCompleted: false,
    onTaskToggle: jest.fn(),
    onCompleteSmallGoal: jest.fn(),
    onOpenEditSmallGoalModal: jest.fn(),
    onDeleteSmallGoal: jest.fn(),
    goal: { id: 123, title: 'Test Goal' },
    setGoal: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('未完了のSmall Goal', () => {
    it('タイトル、期限、難易度を表示する', () => {
      render(<SmallGoalCard {...mockProps} />);
      
      expect(screen.getByText('Test Small Goal')).toBeInTheDocument();
      expect(
        screen.getByText((content, node) => node.textContent === '期限: 2024-01-01')
      ).toBeInTheDocument();
      expect(
        screen.getByText((content, node) => node.textContent === '難易度: Easy')
      ).toBeInTheDocument();
    });

    it('タスクのチェックボックスを表示する', () => {
      render(<SmallGoalCard {...mockProps} />);
      
      expect(screen.getByText('Task 1')).toBeInTheDocument();
      expect(screen.getByText('Task 2')).toBeInTheDocument();
      
      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes).toHaveLength(2);
      expect(checkboxes[0]).not.toBeChecked(); // unchecked checkbox
      expect(checkboxes[1]).toBeChecked(); // checked checkbox
    });

    it('タスクのチェックボックスをクリックするとonTaskToggleが呼ばれる', () => {
      render(<SmallGoalCard {...mockProps} />);
      
      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[0]); // unchecked checkbox
      
      expect(mockProps.onTaskToggle).toHaveBeenCalledWith(1, false);
    });

    it('すべてのタスクが完了したときに完了ボタンを表示する', () => {
      const completedTasksSmallGoal = {
        ...mockSmallGoal,
        tasks: [
          { id: 1, content: 'Task 1', completed: true },
          { id: 2, content: 'Task 2', completed: true }
        ]
      };
      
      render(<SmallGoalCard {...mockProps} smallGoal={completedTasksSmallGoal} />);
      
      expect(screen.getByText('完了')).toBeInTheDocument();
    });

    it('完了ボタンをクリックするとonCompleteSmallGoalが呼ばれる', () => {
      const completedTasksSmallGoal = {
        ...mockSmallGoal,
        tasks: [
          { id: 1, content: 'Task 1', completed: true },
          { id: 2, content: 'Task 2', completed: true }
        ]
      };
      
      render(<SmallGoalCard {...mockProps} smallGoal={completedTasksSmallGoal} />);
      
      const completeButton = screen.getByText('完了');
      fireEvent.click(completeButton);
      
      expect(mockProps.onCompleteSmallGoal).toHaveBeenCalledWith(1, mockProps.goal, mockProps.setGoal);
    });

    it('編集リンクをクリックするとonOpenEditSmallGoalModalが呼ばれる', () => {
      render(<SmallGoalCard {...mockProps} />);
      
      const editLink = screen.getByText('編集');
      fireEvent.click(editLink);
      
      expect(mockProps.onOpenEditSmallGoalModal).toHaveBeenCalledWith(mockSmallGoal);
    });

    it('削除リンクをクリックするとonDeleteSmallGoalが呼ばれる', () => {
      render(<SmallGoalCard {...mockProps} />);
      
      const deleteLink = screen.getByText('削除');
      fireEvent.click(deleteLink);
      
      expect(mockProps.onDeleteSmallGoal).toHaveBeenCalledWith(1);
    });

    it('削除リンクに正しいdata-testidが設定されている', () => {
      render(<SmallGoalCard {...mockProps} />);
      
      expect(screen.getByTestId('delete-small-goal-1')).toBeInTheDocument();
    });
  });

  describe('完了済みのSmall Goal', () => {
    const completedProps = {
      ...mockProps,
      isCompleted: true,
      smallGoal: { ...mockSmallGoal, completed: true }
    };

    it('完了済みの表示になる', () => {
      render(<SmallGoalCard {...completedProps} />);
      
      expect(screen.getByText('完了!')).toBeInTheDocument();
    });

    it('タスクがチェックボックスではなくテキストで表示される', () => {
      render(<SmallGoalCard {...completedProps} />);
      
      expect(screen.getByText('・Task 1')).toBeInTheDocument();
      expect(screen.getByText('・Task 2')).toBeInTheDocument();
      expect(screen.queryByRole('checkbox')).not.toBeInTheDocument(); // no checkboxes
    });

    it('編集・削除リンクが表示されない', () => {
      render(<SmallGoalCard {...completedProps} />);
      
      expect(screen.queryByText('編集')).not.toBeInTheDocument();
      expect(screen.queryByText('削除')).not.toBeInTheDocument();
    });

    it('完了ボタンが表示されない', () => {
      render(<SmallGoalCard {...completedProps} />);
      
      expect(screen.queryByText('完了')).not.toBeInTheDocument();
    });
  });

  describe('期限なしのSmall Goal', () => {
    it('期限がnullの場合は"No deadline"を表示する', () => {
      const noDeadlineSmallGoal = {
        ...mockSmallGoal,
        deadline: null
      };
      
      render(<SmallGoalCard {...mockProps} smallGoal={noDeadlineSmallGoal} />);
      
      expect(screen.getByText('期限: No deadline')).toBeInTheDocument();
    });
  });
}); 