import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import SmallGoalList from '../../components/SmallGoalList';

// Mock SmallGoalCard component
jest.mock('../../components/SmallGoalCard', () => {
  return function MockSmallGoalCard({ smallGoal, isCompleted }) {
    return (
      <div data-testid={`small-goal-card-${smallGoal.id}`} data-completed={isCompleted}>
        {smallGoal.title}
      </div>
    );
  };
});

// Mock EditSmallGoalModal component
jest.mock('../../components/EditSmallGoal', () => {
  return function MockEditSmallGoalModal({ isOpen, smallGoal }) {
    if (!isOpen) return null;
    return (
      <div data-testid="edit-small-goal-modal">
        Edit Modal for {smallGoal?.title}
      </div>
    );
  };
});

describe('SmallGoalListコンポーネント', () => {
  const mockGoal = {
    id: 123,
    title: 'Test Goal',
    small_goals: [
      {
        id: 1,
        title: 'Incomplete Small Goal 1',
        completed: false,
        difficulty: 'Easy',
        deadline: '2024-01-01',
        tasks: []
      },
      {
        id: 2,
        title: 'Incomplete Small Goal 2',
        completed: false,
        difficulty: 'Medium',
        deadline: '2024-01-02',
        tasks: []
      },
      {
        id: 3,
        title: 'Completed Small Goal 1',
        completed: true,
        difficulty: 'Hard',
        deadline: '2024-01-03',
        tasks: []
      },
      {
        id: 4,
        title: 'Completed Small Goal 2',
        completed: true,
        difficulty: 'Easy',
        deadline: '2024-01-04',
        tasks: []
      }
    ]
  };

  const mockProps = {
    goal: mockGoal,
    selectedSmallGoal: null,
    isEditSmallGoalModalOpen: false,
    onCloseEditSmallGoalModal: jest.fn(),
    onTaskToggle: jest.fn(),
    onCompleteSmallGoal: jest.fn(),
    onOpenEditSmallGoalModal: jest.fn(),
    onDeleteSmallGoal: jest.fn(),
    onSmallGoalUpdated: jest.fn(),
    setGoal: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('未完了のSmall Goalを正しく表示する', () => {
    render(<SmallGoalList {...mockProps} />);
    
    expect(screen.getByTestId('small-goal-card-1')).toBeInTheDocument();
    expect(screen.getByTestId('small-goal-card-2')).toBeInTheDocument();
    expect(screen.getByText('Incomplete Small Goal 1')).toBeInTheDocument();
    expect(screen.getByText('Incomplete Small Goal 2')).toBeInTheDocument();
  });

  it('完了済みのSmall Goalを正しく表示する', () => {
    render(<SmallGoalList {...mockProps} />);
    
    expect(screen.getByTestId('small-goal-card-3')).toBeInTheDocument();
    expect(screen.getByTestId('small-goal-card-4')).toBeInTheDocument();
    expect(screen.getByText('Completed Small Goal 1')).toBeInTheDocument();
    expect(screen.getByText('Completed Small Goal 2')).toBeInTheDocument();
  });

  it('未完了のSmall GoalカードにisCompleted=falseを渡す', () => {
    render(<SmallGoalList {...mockProps} />);
    
    const incompleteCard1 = screen.getByTestId('small-goal-card-1');
    const incompleteCard2 = screen.getByTestId('small-goal-card-2');
    
    expect(incompleteCard1).toHaveAttribute('data-completed', 'false');
    expect(incompleteCard2).toHaveAttribute('data-completed', 'false');
  });

  it('完了済みのSmall GoalカードにisCompleted=trueを渡す', () => {
    render(<SmallGoalList {...mockProps} />);
    
    const completedCard1 = screen.getByTestId('small-goal-card-3');
    const completedCard2 = screen.getByTestId('small-goal-card-4');
    
    expect(completedCard1).toHaveAttribute('data-completed', 'true');
    expect(completedCard2).toHaveAttribute('data-completed', 'true');
  });

  it('Small Goalカードに必要なpropsを渡す', () => {
    render(<SmallGoalList {...mockProps} />);
    
    // SmallGoalCardコンポーネントが正しくレンダリングされていることを確認
    expect(screen.getByTestId('small-goal-card-1')).toBeInTheDocument();
    expect(screen.getByTestId('small-goal-card-2')).toBeInTheDocument();
    expect(screen.getByTestId('small-goal-card-3')).toBeInTheDocument();
    expect(screen.getByTestId('small-goal-card-4')).toBeInTheDocument();
  });

  it('EditSmallGoalModalが閉じているときは表示しない', () => {
    render(<SmallGoalList {...mockProps} />);
    
    expect(screen.queryByTestId('edit-small-goal-modal')).not.toBeInTheDocument();
  });

  it('EditSmallGoalModalが開いているときは表示する', () => {
    const openModalProps = {
      ...mockProps,
      isEditSmallGoalModalOpen: true,
      selectedSmallGoal: mockGoal.small_goals[0]
    };
    
    render(<SmallGoalList {...openModalProps} />);
    
    expect(screen.getByTestId('edit-small-goal-modal')).toBeInTheDocument();
    expect(screen.getByText('Edit Modal for Incomplete Small Goal 1')).toBeInTheDocument();
  });

  it('Small Goalが空の場合は何も表示しない', () => {
    const emptyGoalProps = {
      ...mockProps,
      goal: {
        ...mockGoal,
        small_goals: []
      }
    };
    
    render(<SmallGoalList {...emptyGoalProps} />);
    
    expect(screen.queryByTestId('small-goal-card-1')).not.toBeInTheDocument();
    expect(screen.queryByTestId('small-goal-card-2')).not.toBeInTheDocument();
    expect(screen.queryByTestId('small-goal-card-3')).not.toBeInTheDocument();
    expect(screen.queryByTestId('small-goal-card-4')).not.toBeInTheDocument();
  });

  it('正しいCSSクラスを持つコンテナを表示する', () => {
    const { container } = render(<SmallGoalList {...mockProps} />);
    
    expect(container.querySelector('.goal-content-bottom')).toBeInTheDocument();
    expect(container.querySelector('.goal-content-bottom-top')).toBeInTheDocument();
    expect(container.querySelector('.goal-content-bottom-bottom')).toBeInTheDocument();
  });
}); 