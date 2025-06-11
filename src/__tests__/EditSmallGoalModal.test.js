import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

  describe('formatDate 関数', () => {
    let consoleErrorSpy;

    beforeEach(() => {
      consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      consoleErrorSpy.mockRestore();
    });

    describe.each([
      {
        name: '有効な日付文字列',
        input: '2024-03-20',
        expected: '2024-03-20',
        shouldLogError: false
      },
      {
        name: '無効な日付文字列',
        input: 'invalid-date',
        expected: '',  // 無効な日付の場合は空文字列が表示される
        shouldLogError: true
      }
    ])('$name を渡したとき', ({ input, expected, shouldLogError }) => {
      it('期待する形式で返される', () => {
        const { container } = render(
          <EditSmallGoalModal
            isOpen={true}
            onClose={() => {}}
            smallGoal={{
              id: 1,
              title: 'テストSmall Goal',
              difficulty: '普通',
              deadline: input,
              tasks: []
            }}
            goalId={1}
            onSmallGoalUpdated={() => {}}
          />
        );

        // 日付フィールドの値を確認
        const deadlineInput = screen.getByLabelText('期限');
        expect(deadlineInput).toHaveValue(expected);

        // エラーログの確認
        if (shouldLogError) {
          expect(consoleErrorSpy).toHaveBeenCalledWith('Invalid date:', input);
        } else {
          expect(consoleErrorSpy).not.toHaveBeenCalled();
        }
      });
    });
  });

  describe('タスク操作', () => {
    const mockSmallGoal = {
      id: 1,
      title: 'テストSmall Goal',
      difficulty: '普通',
      deadline: '2024-03-20',
      tasks: [
        { id: 1, content: 'タスク1' },
        { id: 2, content: 'タスク2' },
        { id: 3, content: 'タスク3' }
      ]
    };

    const defaultProps = {
      isOpen: true,
      onClose: () => {},
      smallGoal: mockSmallGoal,
      goalId: 1,
      onSmallGoalUpdated: () => {}
    };

    it('handleTaskChange で指定タスクの content が更新される', async () => {
      render(<EditSmallGoalModal {...defaultProps} />);

      // タスク入力フィールドを取得
      const taskInputs = screen.getAllByLabelText('Task');
      expect(taskInputs).toHaveLength(3);

      // 2番目のタスクの内容を更新
      const newContent = '更新されたタスク2';
      await userEvent.clear(taskInputs[1]);
      await userEvent.type(taskInputs[1], newContent);

      // 更新後の値を確認
      expect(taskInputs[1]).toHaveValue(newContent);
      // 他のタスクは変更されていないことを確認
      expect(taskInputs[0]).toHaveValue('タスク1');
      expect(taskInputs[2]).toHaveValue('タスク3');
    });

    it('addTask で新規タスクが末尾に追加される', async () => {
      render(<EditSmallGoalModal {...defaultProps} />);

      // 初期状態のタスク数を確認
      let taskInputs = screen.getAllByLabelText('Task');
      expect(taskInputs).toHaveLength(3);

      // Add Task ボタンをクリック
      const addTaskButton = screen.getByText('Add Task');
      await userEvent.click(addTaskButton);

      // タスクが追加されたことを確認
      taskInputs = screen.getAllByLabelText('Task');
      expect(taskInputs).toHaveLength(4);

      // 新規タスクの内容が空であることを確認
      expect(taskInputs[3]).toHaveValue('');

      // 既存のタスクは変更されていないことを確認
      expect(taskInputs[0]).toHaveValue('タスク1');
      expect(taskInputs[1]).toHaveValue('タスク2');
      expect(taskInputs[2]).toHaveValue('タスク3');
    });

    it('removeTask で指定タスクに _destroy: true がセットされる', async () => {
      render(<EditSmallGoalModal {...defaultProps} />);

      // 初期状態のタスク数を確認
      let taskInputs = screen.getAllByLabelText('Task');
      expect(taskInputs).toHaveLength(3);

      // 2番目のタスクの Remove Task ボタンをクリック
      const removeButtons = screen.getAllByText('Remove Task');
      await userEvent.click(removeButtons[1]); // 2番目のタスクの削除ボタン

      // タスクが1つ減ったことを確認
      taskInputs = screen.getAllByLabelText('Task');
      expect(taskInputs).toHaveLength(2);

      // 残っているタスクの内容を確認
      expect(taskInputs[0]).toHaveValue('タスク1');
      expect(taskInputs[1]).toHaveValue('タスク3');

      // 削除されたタスク（タスク2）が表示されていないことを確認
      const taskContents = taskInputs.map(input => input.value);
      expect(taskContents).not.toContain('タスク2');
    });

    describe('Remove Task ボタンの表示制御', () => {
      it('タスクが1件の場合は Remove Task ボタンが表示されない', () => {
        const singleTaskProps = {
          ...defaultProps,
          smallGoal: {
            ...mockSmallGoal,
            tasks: [{ id: 1, content: 'タスク1' }]
          }
        };

        render(<EditSmallGoalModal {...singleTaskProps} />);

        // Remove Task ボタンが表示されていないことを確認
        const removeButtons = screen.queryAllByText('Remove Task');
        expect(removeButtons).toHaveLength(0);
      });

      it('タスクが2件以上の場合は Remove Task ボタンが表示される', async () => {
        render(<EditSmallGoalModal {...defaultProps} />);

        // Remove Task ボタンが表示されていることを確認
        const removeButtons = screen.getAllByText('Remove Task');
        expect(removeButtons).toHaveLength(3); // 3つのタスクそれぞれに表示される

        // タスクを1つ削除
        await userEvent.click(removeButtons[0]);

        // タスクが2つになった後も Remove Task ボタンが表示されていることを確認
        await waitFor(() => {
          const remainingRemoveButtons = screen.getAllByText('Remove Task');
          expect(remainingRemoveButtons).toHaveLength(2);
        });
      });
    });

    describe('タスクの追加・削除後の状態確認', () => {
      it('タスクを追加・削除した後の状態が正しく反映される', async () => {
        render(<EditSmallGoalModal {...defaultProps} />);

        // 初期状態の確認
        let taskInputs = screen.getAllByLabelText('Task');
        expect(taskInputs).toHaveLength(3);

        // タスクを追加
        const addTaskButton = screen.getByText('Add Task');
        await userEvent.click(addTaskButton);

        // タスクが追加されたことを確認
        await waitFor(() => {
          taskInputs = screen.getAllByLabelText('Task');
          expect(taskInputs).toHaveLength(4);
          expect(taskInputs[3]).toHaveValue(''); // 新規タスクは空
        });

        // 2番目のタスクを削除
        const removeButtons = screen.getAllByText('Remove Task');
        await userEvent.click(removeButtons[1]);

        // タスクが削除されたことを確認
        await waitFor(() => {
          taskInputs = screen.getAllByLabelText('Task');
          expect(taskInputs).toHaveLength(3);
          
          // 残っているタスクの内容を確認
          expect(taskInputs[0]).toHaveValue('タスク1');
          expect(taskInputs[1]).toHaveValue('タスク3');
          expect(taskInputs[2]).toHaveValue('');
        });

        // 削除されたタスクが表示されていないことを確認
        const taskContents = taskInputs.map(input => input.value);
        expect(taskContents).not.toContain('タスク2');

        // 新規タスクのIDが正しい形式であることを確認
        const newTaskInput = taskInputs[2];
        const newTaskId = newTaskInput.id;
        expect(newTaskId).toMatch(/^task-temp-\d+$/);
      });
    });
  });
}); 