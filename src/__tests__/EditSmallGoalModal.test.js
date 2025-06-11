import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import EditSmallGoalModal from '../components/EditSmallGoal';
import { fetchWithAuth } from '../utils/fetchWithAuth';

// fetchWithAuth のモック
jest.mock('../utils/fetchWithAuth');

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

  describe('入力フォームの要素確認', () => {
    it('title の textarea が表示され、value にステート title が反映される', async () => {
      const mockSmallGoal = {
        id: 1,
        title: 'テストSmall Goal',
        difficulty: '普通',
        deadline: '2024-03-20',
        tasks: []
      };

      render(
        <EditSmallGoalModal
          isOpen={true}
          onClose={() => {}}
          smallGoal={mockSmallGoal}
          goalId={1}
          onSmallGoalUpdated={() => {}}
        />
      );

      // textarea が存在することを確認
      const titleTextarea = screen.getByLabelText('Small Goalのタイトル');
      expect(titleTextarea).toBeInTheDocument();
      expect(titleTextarea.tagName).toBe('TEXTAREA');

      // 初期値が正しく設定されていることを確認
      expect(titleTextarea).toHaveValue(mockSmallGoal.title);

      // 新しい値を入力
      const newTitle = '更新されたSmall Goal';
      await userEvent.clear(titleTextarea);
      await userEvent.type(titleTextarea, newTitle);

      // 入力された値が反映されていることを確認
      await waitFor(() => {
        expect(titleTextarea).toHaveValue(newTitle);
      });
    });

    it('各タスク用 textarea が表示され、value に対応する task.content が入っている', () => {
      const mockSmallGoal = {
        id: 1,
        title: 'テストSmall Goal',
        difficulty: '普通',
        deadline: '2024-03-20',
        tasks: [
          { id: 1, content: 'タスク1の内容' },
          { id: 2, content: 'タスク2の内容' },
          { id: 3, content: 'タスク3の内容' }
        ]
      };

      render(
        <EditSmallGoalModal
          isOpen={true}
          onClose={() => {}}
          smallGoal={mockSmallGoal}
          goalId={1}
          onSmallGoalUpdated={() => {}}
        />
      );

      // タスク用の textarea が存在することを確認
      const taskTextareas = screen.getAllByLabelText('Task');
      expect(taskTextareas).toHaveLength(mockSmallGoal.tasks.length);

      // 各 textarea の内容を確認
      taskTextareas.forEach((textarea, index) => {
        expect(textarea).toBeInTheDocument();
        expect(textarea.tagName).toBe('TEXTAREA');
        expect(textarea).toHaveValue(mockSmallGoal.tasks[index].content);
      });

      // 各 textarea の ID が正しい形式であることを確認
      taskTextareas.forEach((textarea, index) => {
        const taskId = mockSmallGoal.tasks[index].id;
        expect(textarea.id).toBe(`task-${taskId}`);
      });
    });

    it('Add Task と Remove Task ボタンが正しく動作する', async () => {
      const mockSmallGoal = {
        id: 1,
        title: 'テストSmall Goal',
        difficulty: '普通',
        deadline: '2024-03-20',
        tasks: [
          { id: 1, content: 'タスク1の内容' },
          { id: 2, content: 'タスク2の内容' }
        ]
      };

      render(
        <EditSmallGoalModal
          isOpen={true}
          onClose={() => {}}
          smallGoal={mockSmallGoal}
          goalId={1}
          onSmallGoalUpdated={() => {}}
        />
      );

      // 初期状態の確認
      let taskTextareas = screen.getAllByLabelText('Task');
      expect(taskTextareas).toHaveLength(2);

      // Add Task ボタンをクリック
      const addTaskButton = screen.getByText('Add Task');
      await userEvent.click(addTaskButton);

      // タスクが追加されたことを確認
      await waitFor(() => {
        taskTextareas = screen.getAllByLabelText('Task');
        expect(taskTextareas).toHaveLength(3);
        expect(taskTextareas[2]).toHaveValue(''); // 新規タスクは空
      });

      // 新規タスクのIDが正しい形式であることを確認
      const newTaskId = taskTextareas[2].id;
      expect(newTaskId).toMatch(/^task-temp-\d+$/);

      // Remove Task ボタンをクリック（2番目のタスクを削除）
      const removeButtons = screen.getAllByText('Remove Task');
      await userEvent.click(removeButtons[1]);

      // タスクが削除されたことを確認
      await waitFor(() => {
        taskTextareas = screen.getAllByLabelText('Task');
        expect(taskTextareas).toHaveLength(2);
        
        // 残っているタスクの内容を確認
        expect(taskTextareas[0]).toHaveValue('タスク1の内容');
        expect(taskTextareas[1]).toHaveValue(''); // 新規タスク
      });

      // 削除されたタスクが表示されていないことを確認
      const taskContents = taskTextareas.map(input => input.value);
      expect(taskContents).not.toContain('タスク2の内容');
    });

    it('difficulty の select が表示され、value にステート difficulty が反映される', async () => {
      const mockSmallGoal = {
        id: 1,
        title: 'テストSmall Goal',
        difficulty: '普通',
        deadline: '2024-03-20',
        tasks: []
      };

      render(
        <EditSmallGoalModal
          isOpen={true}
          onClose={() => {}}
          smallGoal={mockSmallGoal}
          goalId={1}
          onSmallGoalUpdated={() => {}}
        />
      );

      // select が存在することを確認
      const difficultySelect = screen.getByLabelText('Difficulty');
      expect(difficultySelect).toBeInTheDocument();
      expect(difficultySelect.tagName).toBe('SELECT');
      expect(difficultySelect.id).toBe('difficulty');

      // 初期値が正しく設定されていることを確認
      expect(difficultySelect).toHaveValue(mockSmallGoal.difficulty);

      // 選択肢が正しく表示されていることを確認
      const options = difficultySelect.querySelectorAll('option');
      expect(options).toHaveLength(5);
      expect(options[0]).toHaveValue('ものすごく簡単');
      expect(options[1]).toHaveValue('簡単');
      expect(options[2]).toHaveValue('普通');
      expect(options[3]).toHaveValue('難しい');
      expect(options[4]).toHaveValue('とても難しい');

      // 新しい値を選択
      await userEvent.selectOptions(difficultySelect, '難しい');

      // 選択された値が反映されていることを確認
      expect(difficultySelect).toHaveValue('難しい');
    });

    it('deadline の date input が表示され、value にステート deadline が反映される', async () => {
      const mockSmallGoal = {
        id: 1,
        title: 'テストSmall Goal',
        difficulty: '普通',
        deadline: '2024-03-20',
        tasks: []
      };

      render(
        <EditSmallGoalModal
          isOpen={true}
          onClose={() => {}}
          smallGoal={mockSmallGoal}
          goalId={1}
          onSmallGoalUpdated={() => {}}
        />
      );

      // date input が存在することを確認
      const deadlineInput = screen.getByLabelText('期限');
      expect(deadlineInput).toBeInTheDocument();
      expect(deadlineInput.tagName).toBe('INPUT');
      expect(deadlineInput.type).toBe('date');
      expect(deadlineInput.id).toBe('deadline');

      // 初期値が正しく設定されていることを確認
      expect(deadlineInput).toHaveValue(mockSmallGoal.deadline);

      // 新しい日付を入力
      const newDate = '2024-04-01';
      await userEvent.clear(deadlineInput);
      await userEvent.type(deadlineInput, newDate);

      // 入力された値が反映されていることを確認
      expect(deadlineInput).toHaveValue(newDate);
    });
  });

  describe('キャンセル操作', () => {
    it('Close ボタンをクリックすると必ず onClose が呼ばれる', async () => {
      const mockOnClose = jest.fn();
      const mockSmallGoal = {
        id: 1,
        title: 'テストSmall Goal',
        difficulty: '普通',
        deadline: '2024-03-20',
        tasks: []
      };

      render(
        <EditSmallGoalModal
          isOpen={true}
          onClose={mockOnClose}
          smallGoal={mockSmallGoal}
          goalId={1}
          onSmallGoalUpdated={() => {}}
        />
      );

      // Close ボタンが存在することを確認
      const closeButton = screen.getByText('Close');
      expect(closeButton).toBeInTheDocument();

      // ボタンをクリック
      await userEvent.click(closeButton);

      // onClose が呼ばれたことを確認
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('フォーム送信前バリデーション', () => {
    let consoleErrorSpy;

    beforeEach(() => {
      consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      fetchWithAuth.mockClear();
    });

    afterEach(() => {
      consoleErrorSpy.mockRestore();
    });

    it('goalId または smallGoal.id が falsy のとき、エラーがログされ、fetchWithAuth は呼ばれない', async () => {
      const mockSmallGoal = {
        id: 1,
        title: 'テストSmall Goal',
        difficulty: '普通',
        deadline: '2024-03-20',
        tasks: []
      };

      // goalId が undefined の場合
      render(
        <EditSmallGoalModal
          isOpen={true}
          onClose={() => {}}
          smallGoal={mockSmallGoal}
          goalId={undefined}
          onSmallGoalUpdated={() => {}}
        />
      );

      // フォームを送信
      const submitButton = screen.getByText('Update Small Goal');
      await userEvent.click(submitButton);

      // エラーログが出力されることを確認
      expect(consoleErrorSpy).toHaveBeenCalledWith('goalId or smallGoal.id is undefined.');
      // fetchWithAuth が呼ばれないことを確認
      expect(fetchWithAuth).not.toHaveBeenCalled();

      // コンポーネントを再レンダリング（smallGoal.id が undefined の場合）
      render(
        <EditSmallGoalModal
          isOpen={true}
          onClose={() => {}}
          smallGoal={{ ...mockSmallGoal, id: undefined }}
          goalId={1}
          onSmallGoalUpdated={() => {}}
        />
      );

      // フォームを送信
      await userEvent.click(submitButton);

      // エラーログが出力されることを確認
      expect(consoleErrorSpy).toHaveBeenCalledWith('goalId or smallGoal.id is undefined.');
      // fetchWithAuth が呼ばれないことを確認
      expect(fetchWithAuth).not.toHaveBeenCalled();
    });
  });

  describe('送信データ整形の検証', () => {
    beforeEach(() => {
      fetchWithAuth.mockClear();
    });

    it('既存タスクは { id, content } で送られる', async () => {
      const mockSmallGoal = {
        id: 1,
        title: 'テストSmall Goal',
        difficulty: '普通',
        deadline: '2024-03-20',
        tasks: [
          { id: 1, content: 'タスク1の内容' },
          { id: 2, content: 'タスク2の内容' }
        ]
      };

      render(
        <EditSmallGoalModal
          isOpen={true}
          onClose={() => {}}
          smallGoal={mockSmallGoal}
          goalId={1}
          onSmallGoalUpdated={() => {}}
        />
      );

      // タスクの内容を更新
      const taskInputs = screen.getAllByLabelText('Task');
      await userEvent.clear(taskInputs[0]);
      await userEvent.type(taskInputs[0], '更新されたタスク1');

      // フォームを送信
      const submitButton = screen.getByText('Update Small Goal');
      await userEvent.click(submitButton);

      // fetchWithAuth が呼ばれたことを確認
      await waitFor(() => {
        expect(fetchWithAuth).toHaveBeenCalledTimes(1);
      });

      // 送信されたデータを確認
      const [url, options] = fetchWithAuth.mock.calls[0];
      const requestBody = JSON.parse(options.body);

      // tasks_attributes の形式を確認
      expect(requestBody.tasks_attributes).toHaveLength(2);
      expect(requestBody.tasks_attributes).toEqual([
        { id: 1, content: '更新されたタスク1' },
        { id: 2, content: 'タスク2の内容' }
      ]);
    });

    it('新規タスクは id を省略して { content } で送られる', async () => {
      const mockSmallGoal = {
        id: 1,
        title: 'テストSmall Goal',
        difficulty: '普通',
        deadline: '2024-03-20',
        tasks: [
          { id: 1, content: 'タスク1の内容' }
        ]
      };

      render(
        <EditSmallGoalModal
          isOpen={true}
          onClose={() => {}}
          smallGoal={mockSmallGoal}
          goalId={1}
          onSmallGoalUpdated={() => {}}
        />
      );

      // 新規タスクを追加
      const addTaskButton = screen.getByText('Add Task');
      await userEvent.click(addTaskButton);

      // 新規タスクの内容を入力
      const taskInputs = screen.getAllByLabelText('Task');
      await userEvent.type(taskInputs[1], '新規タスクの内容');

      // フォームを送信
      const submitButton = screen.getByText('Update Small Goal');
      await userEvent.click(submitButton);

      // fetchWithAuth が呼ばれたことを確認
      await waitFor(() => {
        expect(fetchWithAuth).toHaveBeenCalledTimes(1);
      });

      // 送信されたデータを確認
      const [url, options] = fetchWithAuth.mock.calls[0];
      const requestBody = JSON.parse(options.body);

      // tasks_attributes の形式を確認
      expect(requestBody.tasks_attributes).toHaveLength(2);
      expect(requestBody.tasks_attributes).toEqual([
        { id: 1, content: 'タスク1の内容' }, // 既存タスク
        { content: '新規タスクの内容' }      // 新規タスク（id なし）
      ]);
    });

    it('削除フラグが立ったタスクは { id, _destroy: true } で送られる', async () => {
      const mockSmallGoal = {
        id: 1,
        title: 'テストSmall Goal',
        difficulty: '普通',
        deadline: '2024-03-20',
        tasks: [
          { id: 1, content: 'タスク1の内容' },
          { id: 2, content: 'タスク2の内容' },
          { id: 3, content: 'タスク3の内容' }
        ]
      };

      render(
        <EditSmallGoalModal
          isOpen={true}
          onClose={() => {}}
          smallGoal={mockSmallGoal}
          goalId={1}
          onSmallGoalUpdated={() => {}}
        />
      );

      // 2番目のタスクを削除
      const removeButtons = screen.getAllByText('Remove Task');
      await userEvent.click(removeButtons[1]);

      // フォームを送信
      const submitButton = screen.getByText('Update Small Goal');
      await userEvent.click(submitButton);

      // fetchWithAuth が呼ばれたことを確認
      await waitFor(() => {
        expect(fetchWithAuth).toHaveBeenCalledTimes(1);
      });

      // 送信されたデータを確認
      const [url, options] = fetchWithAuth.mock.calls[0];
      const requestBody = JSON.parse(options.body);

      // tasks_attributes の形式を確認
      expect(requestBody.tasks_attributes).toHaveLength(3);
      expect(requestBody.tasks_attributes).toEqual([
        { id: 1, content: 'タスク1の内容' },     // 既存タスク（変更なし）
        { id: 2, _destroy: true },              // 削除フラグが立ったタスク
        { id: 3, content: 'タスク3の内容' }      // 既存タスク（変更なし）
      ]);
    });
  });

  describe('API 通信', () => {
    beforeEach(() => {
      fetchWithAuth.mockClear();
    });

    it('正しい URL・メソッド・ボディで fetchWithAuth が一度だけ呼ばれる', async () => {
      const mockSmallGoal = {
        id: 1,
        title: 'テストSmall Goal',
        difficulty: '普通',
        deadline: '2024-03-20',
        tasks: [
          { id: 1, content: 'タスク1の内容' },
          { id: 2, content: 'タスク2の内容' }
        ]
      };

      const goalId = 123;

      render(
        <EditSmallGoalModal
          isOpen={true}
          onClose={() => {}}
          smallGoal={mockSmallGoal}
          goalId={goalId}
          onSmallGoalUpdated={() => {}}
        />
      );

      // タスクの内容を更新
      const taskInputs = screen.getAllByLabelText('Task');
      await userEvent.clear(taskInputs[0]);
      await userEvent.type(taskInputs[0], '更新されたタスク1');

      // 2番目のタスクを削除
      const removeButtons = screen.getAllByText('Remove Task');
      await userEvent.click(removeButtons[1]);

      // 新規タスクを追加
      const addTaskButton = screen.getByText('Add Task');
      await userEvent.click(addTaskButton);

      // 新規タスクの内容を入力（非同期の更新を待つ）
      await waitFor(() => {
        const taskInputs = screen.getAllByLabelText('Task');
        expect(taskInputs).toHaveLength(2); // 削除されたタスクは表示されない
      });

      const newTaskInput = screen.getAllByLabelText('Task')[1];
      await userEvent.type(newTaskInput, '新規タスクの内容');

      // フォームを送信
      const submitButton = screen.getByText('Update Small Goal');
      await userEvent.click(submitButton);

      // fetchWithAuth が一度だけ呼ばれたことを確認
      await waitFor(() => {
        expect(fetchWithAuth).toHaveBeenCalledTimes(1);
      });

      // API 呼び出しの詳細を確認
      const [url, options] = fetchWithAuth.mock.calls[0];

      // URL の確認
      expect(url).toBe(`/api/goals/${goalId}/small_goals/${mockSmallGoal.id}`);

      // メソッドの確認
      expect(options.method).toBe('PUT');

      // リクエストボディの確認
      const requestBody = JSON.parse(options.body);
      expect(requestBody).toEqual({
        title: mockSmallGoal.title,
        difficulty: mockSmallGoal.difficulty,
        deadline: mockSmallGoal.deadline,
        tasks_attributes: [
          { id: 1, content: '更新されたタスク1' },  // 更新された既存タスク
          { id: 2, _destroy: true },               // 削除フラグが立ったタスク
          { content: '新規タスクの内容' }           // 新規タスク
        ]
      });
    });
  });
}); 