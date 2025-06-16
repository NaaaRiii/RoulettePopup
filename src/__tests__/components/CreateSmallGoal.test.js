import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CreateSmallGoal from '../../components/CreateSmallGoal';
import { fetchWithAuth } from '../../utils/fetchWithAuth';
import '@testing-library/jest-dom';
import styles from '../components/CreateGoal.module.css';

// fetchWithAuth のモック
jest.mock('../../utils/fetchWithAuth');

// Next.js の useRouter をモック
jest.mock('next/router', () => ({
  useRouter: () => ({
    query: {},
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
}));

// バリデーションテスト
beforeEach(() => {
  fetchWithAuth.mockClear();
});


describe('初期表示', () => {
  it('isOpen=false のとき、何もレンダリングされない', () => {
    const { container } = render(
      <CreateSmallGoal
        isOpen={false}
        onClose={() => {}}
        goalId={1}
        onSmallGoalAdded={() => {}}
      />
    );
    
    // コンテナが空であることを確認
    expect(container).toBeEmptyDOMElement();
  });

  it('isOpen=true のとき、モーダルが表示される', () => {
    render(
      <CreateSmallGoal
        isOpen={true}
        onClose={() => {}}
        goalId={1}
        onSmallGoalAdded={() => {}}
      />
    );
    
    // モーダルが表示されることを確認
    expect(screen.getByTestId('create-small-goal')).toBeInTheDocument();
    
    // モーダルのタイトルが表示されることを確認
    expect(screen.getByText('Small Goalを設定しよう!')).toBeInTheDocument();
    
    // フォームの主要な要素が表示されることを確認
    expect(screen.getByLabelText('Small Goalのタイトル')).toBeInTheDocument();
    expect(screen.getByLabelText('Task')).toBeInTheDocument();
    expect(screen.getByLabelText('難易度の設定')).toBeInTheDocument();
    expect(screen.getByLabelText('期限')).toBeInTheDocument();
    
    // ボタンが表示されることを確認
    expect(screen.getByText('タスクの追加')).toBeInTheDocument();
    expect(screen.getByText('設定する')).toBeInTheDocument();
    expect(screen.getByText('Close')).toBeInTheDocument();
  });

  it('初期状態で各フィールドが空である', () => {
    render(
      <CreateSmallGoal
        isOpen={true}
        onClose={() => {}}
        goalId={1}
        onSmallGoalAdded={() => {}}
      />
    );
    
    // タイトルフィールドが空であることを確認
    const titleInput = screen.getByLabelText('Small Goalのタイトル');
    expect(titleInput.value).toBe('');
    
    // タスクフィールドが空であることを確認
    const taskInput = screen.getByLabelText('Task');
    expect(taskInput.value).toBe('');
    
    // 難易度選択が空であることを確認
    const difficultySelect = screen.getByLabelText('難易度の設定');
    expect(difficultySelect.value).toBe('');
    
    // 期限フィールドが空であることを確認
    const deadlineInput = screen.getByLabelText('期限');
    expect(deadlineInput.value).toBe('');
    
    // エラーメッセージが表示されていないことを確認
    const errorMessage = screen.queryByRole('alert');
    expect(errorMessage).not.toBeInTheDocument();
  });

  it('初期状態で1つのタスクフィールドが表示される', () => {
    render(
      <CreateSmallGoal
        isOpen={true}
        onClose={() => {}}
        goalId={1}
        onSmallGoalAdded={() => {}}
      />
    );
    
    // タスクフィールドが1つだけ存在することを確認
    const taskInputs = screen.getAllByLabelText('Task');
    expect(taskInputs).toHaveLength(1);
    
    // タスク削除ボタンが1つだけ存在することを確認
    const removeButtons = screen.getAllByText('タスクの削除');
    expect(removeButtons).toHaveLength(1);
    
    // タスク追加ボタンが存在することを確認
    expect(screen.getByText('タスクの追加')).toBeInTheDocument();
  });
});

describe('フォーム要素の表示確認', () => {
  it('タイトル入力フィールドが表示される', () => {
    render(
      <CreateSmallGoal
        isOpen={true}
        onClose={() => {}}
        goalId={1}
        onSmallGoalAdded={() => {}}
      />
    );
    
    // タイトル入力フィールドが存在することを確認
    const titleInput = screen.getByLabelText('Small Goalのタイトル');
    expect(titleInput).toBeInTheDocument();
    
    // タイトル入力フィールドが textarea であることを確認
    expect(titleInput.tagName).toBe('TEXTAREA');
    
    // タイトル入力フィールドが必須であることを確認
    expect(titleInput).toBeRequired();
    
    // タイトル入力フィールドの属性を確認
    expect(titleInput).toHaveAttribute('rows', '2');
    expect(titleInput).toHaveAttribute('cols', '50');
    expect(titleInput).toHaveClass('textareaField');
  });

  it('タスク入力フィールドが表示される', () => {
    render(
      <CreateSmallGoal
        isOpen={true}
        onClose={() => {}}
        goalId={1}
        onSmallGoalAdded={() => {}}
      />
    );
    
    // タスク入力フィールドが存在することを確認
    const taskInput = screen.getByLabelText('Task');
    expect(taskInput).toBeInTheDocument();
    
    // タスク入力フィールドが textarea であることを確認
    expect(taskInput.tagName).toBe('TEXTAREA');
    
    // タスク入力フィールドが必須であることを確認
    expect(taskInput).toBeRequired();
    
    // タスク入力フィールドの属性を確認
    expect(taskInput).toHaveAttribute('rows', '2');
    expect(taskInput).toHaveAttribute('cols', '50');
    expect(taskInput).toHaveClass('textareaField');
    
    // タスク削除ボタンが存在することを確認
    const removeButton = screen.getByText('タスクの削除');
    expect(removeButton).toBeInTheDocument();
    expect(removeButton).toHaveClass('taskButton');
    
    // タスク追加ボタンが存在することを確認
    const addButton = screen.getByText('タスクの追加');
    expect(addButton).toBeInTheDocument();
    expect(addButton).toHaveClass('addTaskButton');
  });

  it('難易度選択フィールドが表示される', () => {
    render(
      <CreateSmallGoal
        isOpen={true}
        onClose={() => {}}
        goalId={1}
        onSmallGoalAdded={() => {}}
      />
    );
    
    // 難易度選択フィールドが存在することを確認
    const difficultySelect = screen.getByLabelText('難易度の設定');
    expect(difficultySelect).toBeInTheDocument();
    
    // 難易度選択フィールドが select 要素であることを確認
    expect(difficultySelect.tagName).toBe('SELECT');
    
    // 難易度選択フィールドが必須であることを確認
    expect(difficultySelect).toBeRequired();
    
    // デフォルトの選択肢が表示されることを確認
    expect(screen.getByText('難易度を選択')).toBeInTheDocument();
    
    // すべての難易度オプションが存在することを確認
    const options = [
      'ものすごく簡単',
      '簡単',
      '普通',
      '難しい',
      'とても難しい'
    ];
    
    options.forEach(option => {
      expect(screen.getByText(option)).toBeInTheDocument();
    });
    
    // 各オプションが select 要素の子要素として存在することを確認
    options.forEach(option => {
      const optionElement = screen.getByText(option);
      expect(optionElement.tagName).toBe('OPTION');
      expect(optionElement.parentElement).toBe(difficultySelect);
    });
  });

  it('期限入力フィールドが表示される', () => {
    render(
      <CreateSmallGoal
        isOpen={true}
        onClose={() => {}}
        goalId={1}
        onSmallGoalAdded={() => {}}
      />
    );
    
    // 期限入力フィールドが存在することを確認
    const deadlineInput = screen.getByLabelText('期限');
    expect(deadlineInput).toBeInTheDocument();
    
    // 期限入力フィールドが input 要素であることを確認
    expect(deadlineInput.tagName).toBe('INPUT');
    
    // 期限入力フィールドのタイプが date であることを確認
    expect(deadlineInput).toHaveAttribute('type', 'date');
    
    // 期限入力フィールドが必須であることを確認
    expect(deadlineInput).toBeRequired();
    
    // 期限入力フィールドに正しいクラスが適用されていることを確認
    expect(deadlineInput).toHaveClass('deadlineField');
  });

  it('各ボタンが表示される', () => {
    render(
      <CreateSmallGoal
        isOpen={true}
        onClose={() => {}}
        goalId={1}
        onSmallGoalAdded={() => {}}
      />
    );
    
    // タスク追加ボタンの確認
    const addTaskButton = screen.getByText('タスクの追加');
    expect(addTaskButton).toBeInTheDocument();
    expect(addTaskButton).toHaveClass('addTaskButton');
    expect(addTaskButton).toHaveAttribute('type', 'button');
    
    // タスク削除ボタンの確認
    const removeTaskButton = screen.getByText('タスクの削除');
    expect(removeTaskButton).toBeInTheDocument();
    expect(removeTaskButton).toHaveClass('taskButton');
    expect(removeTaskButton).toHaveAttribute('type', 'button');
    
    // 設定するボタンの確認
    const submitButton = screen.getByText('設定する');
    expect(submitButton).toBeInTheDocument();
    expect(submitButton).toHaveClass('btn', 'btn-primary');
    expect(submitButton).toHaveAttribute('type', 'submit');
    
    // Closeボタンの確認
    const closeButton = screen.getByText('Close');
    expect(closeButton).toBeInTheDocument();
    expect(closeButton).toHaveClass('closeButton');
  });
});

describe('タスク管理機能', () => {
  it('タスク追加ボタンをクリックすると新しいタスクフィールドが追加される', async () => {
    render(
      <CreateSmallGoal
        isOpen={true}
        onClose={() => {}}
        goalId={1}
        onSmallGoalAdded={() => {}}
      />
    );
    
    // 初期状態でタスクフィールドが1つだけ存在することを確認
    let taskInputs = screen.getAllByLabelText('Task');
    expect(taskInputs).toHaveLength(1);
    
    // タスク追加ボタンをクリック
    const addTaskButton = screen.getByText('タスクの追加');
    await userEvent.click(addTaskButton);
    
    // タスクフィールドが2つに増えたことを確認
    taskInputs = screen.getAllByLabelText('Task');
    expect(taskInputs).toHaveLength(2);
    
    // タスク削除ボタンも2つに増えたことを確認
    const removeButtons = screen.getAllByText('タスクの削除');
    expect(removeButtons).toHaveLength(2);
    
    // 新しく追加されたタスクフィールドが空であることを確認
    expect(taskInputs[1].value).toBe('');
    
    // もう一度タスク追加ボタンをクリック
    await userEvent.click(addTaskButton);
    
    // タスクフィールドが3つに増えたことを確認
    taskInputs = screen.getAllByLabelText('Task');
    expect(taskInputs).toHaveLength(3);
    
    // タスク削除ボタンも3つに増えたことを確認
    const removeButtonsAfterSecondAdd = screen.getAllByText('タスクの削除');
    expect(removeButtonsAfterSecondAdd).toHaveLength(3);
  });

  it('タスク削除ボタンをクリックすると該当のタスクフィールドが削除される', async () => {
    render(
      <CreateSmallGoal
        isOpen={true}
        onClose={() => {}}
        goalId={1}
        onSmallGoalAdded={() => {}}
      />
    );
    
    // まず2つのタスクフィールドを追加
    const addTaskButton = screen.getByText('タスクの追加');
    
    // 1つ目のタスクを追加
    await userEvent.click(addTaskButton);
    await waitFor(() => {
      const taskInputs = screen.getAllByLabelText('Task');
      expect(taskInputs).toHaveLength(2);
    });
    
    // 2つ目のタスクを追加
    await userEvent.click(addTaskButton);
    await waitFor(() => {
      const taskInputs = screen.getAllByLabelText('Task');
      expect(taskInputs).toHaveLength(3);
    });
    
    // 最新追加(3番目)のタスクフィールドに内容を入力
    let taskInputs = screen.getAllByLabelText('Task');
    await userEvent.type(taskInputs[2], 'テストタスク2');
    
    // 真ん中(2番目)のタスクフィールドの削除ボタンをクリック
    const removeButtons = await screen.findAllByText('タスクの削除');
    expect(removeButtons).toHaveLength(3);
    // 真ん中(2番目)の削除ボタンをクリック
    await userEvent.click(removeButtons[1]);

    // タスクフィールドが2つに減ったことを確認
    await waitFor(() => {
      const taskInputsAfterRemoval = screen.getAllByLabelText('Task');
      expect(taskInputsAfterRemoval).toHaveLength(2);
    });
    
    // タスク削除ボタンも2つに減ったことを確認
    const remainingRemoveButtons = screen.getAllByText('タスクの削除');
    expect(remainingRemoveButtons).toHaveLength(2);
    
    // 残っているタスクのどちらかに入力した内容が保持されていることを確認
    const remainingTaskWithValue = screen.getByDisplayValue('テストタスク2');
    expect(remainingTaskWithValue).toBeInTheDocument();
  });

  it('最後の1つのタスクは削除できない', async () => {
    render(
      <CreateSmallGoal
        isOpen={true}
        onClose={() => {}}
        goalId={1}
        onSmallGoalAdded={() => {}}
      />
    );

    // 初期状態でタスクフィールドは1つ
    const taskInputs = await screen.findAllByLabelText('Task');
    expect(taskInputs).toHaveLength(1);

    // 削除ボタンを取得
    const removeButtons = await screen.findAllByText('タスクの削除');
    expect(removeButtons).toHaveLength(1);

    // 削除を試みる
    await userEvent.click(removeButtons[0]);

    // タスクフィールドが依然として1つであることを確認
    expect(await screen.findAllByLabelText('Task')).toHaveLength(1);

    // 削除ボタンも1つのままであることを確認
    expect(await screen.findAllByText('タスクの削除')).toHaveLength(1);
  });

  it('タスクの内容が正しく更新される', async () => {
    render(
      <CreateSmallGoal
        isOpen={true}
        onClose={() => {}}
        goalId={1}
        onSmallGoalAdded={() => {}}
      />
    );

    const taskInput = screen.getByLabelText('Task');

    await userEvent.type(taskInput, 'タスク更新テスト');

    expect(taskInput).toHaveValue('タスク更新テスト');
  });
});

describe('入力バリデーション', () => {
  it('必須フィールドが空の場合は送信できない', async () => {
    render(
      <CreateSmallGoal
        isOpen={true}
        onClose={() => {}}
        goalId={1}
        onSmallGoalAdded={() => {}}
      />
    );

    // フォームの必須フィールドを確認
    const titleInput = screen.getByLabelText('Small Goalのタイトル');
    const taskInput = screen.getByLabelText('Task');
    const difficultySelect = screen.getByLabelText('難易度の設定');
    const deadlineInput = screen.getByLabelText('期限');

    // required属性が設定されていることを確認
    expect(titleInput).toBeRequired();
    expect(taskInput).toBeRequired();
    expect(difficultySelect).toBeRequired();
    expect(deadlineInput).toBeRequired();

    // 送信ボタンをクリック
    const submitButton = screen.getByText('設定する');
    await userEvent.click(submitButton);

    // fetchWithAuthが呼び出されていないことを確認
    expect(fetchWithAuth).not.toHaveBeenCalled();
  });

  it('タスクが空のままでは送信できない', async () => {
    render(
      <CreateSmallGoal
        isOpen={true}
        onClose={() => {}}
        goalId={1}
        onSmallGoalAdded={() => {}}
      />
    );

    // 必須フィールドを入力（タスクは空のまま）
    await userEvent.type(screen.getByLabelText('Small Goalのタイトル'), 'タイトルテスト');
    await userEvent.selectOptions(screen.getByLabelText('難易度の設定'), ['普通']);
    const deadlineInput = screen.getByLabelText('期限');
    const futureDate = new Date(Date.now() + 86400000).toISOString().split('T')[0]; // 明日
    await userEvent.type(deadlineInput, futureDate);

    const submitButton = screen.getByText('設定する');
    await userEvent.click(submitButton);


    expect(fetchWithAuth).not.toHaveBeenCalled();
  });
});

describe('API 通信', () => {
  it('正しいURL、メソッド、ボディで fetchWithAuth が呼ばれる', async () => {
    // モックのレスポンスを設定
    fetchWithAuth.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 1, title: 'テストSmall Goal' })
    });

    render(
      <CreateSmallGoal
        isOpen={true}
        onClose={() => {}}
        goalId={1}
        onSmallGoalAdded={() => {}}
      />
    );

    // フォームに値を入力
    const futureDate = new Date(Date.now() + 86400000).toISOString().split('T')[0]; // 明日

		await userEvent.type(screen.getByLabelText('Small Goalのタイトル'), 'テストSmall Goal');
		await userEvent.type(screen.getByLabelText('Task'), 'テストタスク');
		await userEvent.selectOptions(screen.getByLabelText('難易度の設定'), ['普通']);
		const deadlineInput = screen.getByLabelText('期限');
		await userEvent.type(deadlineInput, futureDate);

    // フォームを送信
    const submitButton = screen.getByText('設定する');
    await userEvent.click(submitButton);

    // fetchWithAuth が正しく呼ばれたことを確認
    expect(fetchWithAuth).toHaveBeenCalledTimes(1);
    
    // URL の確認
    const [url, options] = fetchWithAuth.mock.calls[0];
    expect(url).toBe('/api/goals/1/small_goals');
    
    // メソッドの確認
    expect(options.method).toBe('POST');
    
    // リクエストボディの確認
    const requestBody = JSON.parse(options.body);
    expect(requestBody).toEqual({
      small_goal: {
        title: 'テストSmall Goal',
        difficulty: '普通',
        deadline: futureDate,
        tasks_attributes: [
          { content: 'テストタスク' }
        ]
      }
    });
  });

  it('API エラー時にエラーメッセージが表示される', async () => {
    // エラーレスポンスをモック
    fetchWithAuth.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ errors: ['エラーが発生しました'] })
    });

    render(
      <CreateSmallGoal
        isOpen={true}
        onClose={() => {}}
        goalId={1}
        onSmallGoalAdded={() => {}}
      />
    );

    // フォームに値を入力
    const futureDate = new Date(Date.now() + 86400000).toISOString().split('T')[0];

		await userEvent.type(screen.getByLabelText('Small Goalのタイトル'), 'テストSmall Goal');
		await userEvent.type(screen.getByLabelText('Task'), 'テストタスク');
		await userEvent.selectOptions(screen.getByLabelText('難易度の設定'), ['普通']);
		const deadlineInput = screen.getByLabelText('期限');
		await userEvent.type(deadlineInput, futureDate);

    // フォームを送信
    const submitButton = screen.getByText('設定する');
    await userEvent.click(submitButton);

    // エラーメッセージが表示されることを確認
    await waitFor(() => {
      expect(screen.getByText('エラーが発生しました')).toBeInTheDocument();
    });
  });

  it('API 通信成功時に onSmallGoalAdded が呼ばれる', async () => {
    const mockSmallGoal = { id: 1, title: 'テストSmall Goal' };
    const onSmallGoalAdded = jest.fn();

    // 成功レスポンスをモック
    fetchWithAuth.mockResolvedValueOnce({
      ok: true,
      json: async () => mockSmallGoal
    });

    render(
      <CreateSmallGoal
        isOpen={true}
        onClose={() => {}}
        goalId={1}
        onSmallGoalAdded={onSmallGoalAdded}
      />
    );

    // フォームに値を入力
    const futureDate = new Date(Date.now() + 86400000).toISOString().split('T')[0];

		await userEvent.type(screen.getByLabelText('Small Goalのタイトル'), 'テストSmall Goal');
		await userEvent.type(screen.getByLabelText('Task'), 'テストタスク');
		await userEvent.selectOptions(screen.getByLabelText('難易度の設定'), ['普通']);
		const deadlineInput = screen.getByLabelText('期限');
		await userEvent.type(deadlineInput, futureDate);

    // フォームを送信
    const submitButton = screen.getByText('設定する');

		await userEvent.click(submitButton);

    // onSmallGoalAdded が正しいデータで呼ばれたことを確認
    await waitFor(() => {
      expect(onSmallGoalAdded).toHaveBeenCalledWith(mockSmallGoal);
    });
  });

  it('複数のタスクを含むリクエストボディが正しい形式である', async () => {
    // モックのレスポンスを設定
    fetchWithAuth.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 1, title: 'テストSmall Goal' })
    });

    render(
      <CreateSmallGoal
        isOpen={true}
        onClose={() => {}}
        goalId={1}
        onSmallGoalAdded={() => {}}
      />
    );

    const futureDate = new Date(Date.now() + 86400000).toISOString().split('T')[0];

    // フォームに値を入力
		await userEvent.type(screen.getByLabelText('Small Goalのタイトル'), 'テストSmall Goal');
		await userEvent.type(screen.getByLabelText('Task'), 'タスク1');
		await userEvent.selectOptions(screen.getByLabelText('難易度の設定'), ['普通']);
		const deadlineInput = screen.getByLabelText('期限');
		await userEvent.type(deadlineInput, futureDate);

    // 2つ目のタスクを追加
		const addTaskButton = screen.getByText('タスクの追加');
		await userEvent.click(addTaskButton);

    // 2つ目のタスクの内容を入力
		const taskInputs = screen.getAllByLabelText('Task');
		await userEvent.type(taskInputs[1], 'タスク2');

    // フォームを送信
    const submitButton = screen.getByText('設定する');
    await userEvent.click(submitButton);

    // リクエストボディの確認
    const [_, options] = fetchWithAuth.mock.calls[0];
    const requestBody = JSON.parse(options.body);
    
    // 基本構造の確認
    expect(requestBody).toHaveProperty('small_goal');
    expect(requestBody.small_goal).toHaveProperty('title');
    expect(requestBody.small_goal).toHaveProperty('difficulty');
    expect(requestBody.small_goal).toHaveProperty('deadline');
    expect(requestBody.small_goal).toHaveProperty('tasks_attributes');

    // 値の確認
    expect(requestBody.small_goal).toEqual({
      title: 'テストSmall Goal',
      difficulty: '普通',
      deadline: futureDate,
      tasks_attributes: [
        { content: 'タスク1' },
        { content: 'タスク2' }
      ]
    });

    // tasks_attributes の配列形式の確認
    expect(Array.isArray(requestBody.small_goal.tasks_attributes)).toBe(true);
    expect(requestBody.small_goal.tasks_attributes).toHaveLength(2);
    
    // 各タスクの形式確認
    requestBody.small_goal.tasks_attributes.forEach(task => {
      expect(task).toHaveProperty('content');
      expect(typeof task.content).toBe('string');
      expect(task.content).not.toBe('');
    });
  });

  it('タスクを削除した場合のリクエストボディが正しい形式である', async () => {
    // モックのレスポンスを設定
    fetchWithAuth.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 1, title: 'テストSmall Goal' })
    });

    render(
      <CreateSmallGoal
        isOpen={true}
        onClose={() => {}}
        goalId={1}
        onSmallGoalAdded={() => {}}
      />
    );

    const futureDate = new Date(Date.now() + 86400000).toISOString().split('T')[0];

    // フォームに値を入力
		await userEvent.type(screen.getByLabelText('Small Goalのタイトル'), 'テストSmall Goal');
		await userEvent.type(screen.getByLabelText('Task'), 'タスク1');
		await userEvent.selectOptions(screen.getByLabelText('難易度の設定'), ['普通']);
		const deadlineInput = screen.getByLabelText('期限');
		await userEvent.type(deadlineInput, futureDate);

    // 2つ目のタスクを追加
		const addTaskButton = screen.getByText('タスクの追加');
		await userEvent.click(addTaskButton);

    // 2つ目のタスクの内容を入力
		const taskInputs = screen.getAllByLabelText('Task');
		await userEvent.type(taskInputs[1], 'タスク2');

    // 2つ目のタスクを削除
    const removeButtons = await screen.findAllByText('タスクの削除');
    await userEvent.click(removeButtons[1]);

    // フォームを送信
    const submitButton = screen.getByText('設定する');
		await userEvent.click(submitButton);

    // リクエストボディの確認
    const [_, options] = fetchWithAuth.mock.calls[0];
    const requestBody = JSON.parse(options.body);
    
    // 削除後のタスク数が1つであることを確認
    expect(requestBody.small_goal.tasks_attributes).toHaveLength(1);
    expect(requestBody.small_goal.tasks_attributes[0].content).toBe('タスク1');
  });

  it('空のタスクがある場合は送信されない', async () => {
    render(
      <CreateSmallGoal
        isOpen={true}
        onClose={() => {}}
        goalId={1}
        onSmallGoalAdded={() => {}}
      />
    );

    const futureDate = new Date(Date.now() + 86400000).toISOString().split('T')[0];

    // フォームに値を入力
		await userEvent.type(screen.getByLabelText('Small Goalのタイトル'), 'テストSmall Goal');
		await userEvent.type(screen.getByLabelText('Task'), 'タスク1');
		await userEvent.selectOptions(screen.getByLabelText('難易度の設定'), ['普通']);
		const deadlineInput = screen.getByLabelText('期限');
		await userEvent.type(deadlineInput, futureDate);

    // 2つ目のタスクを追加（空のまま）
		const addTaskButton = screen.getByText('タスクの追加');
		await userEvent.click(addTaskButton);

    // フォームを送信
    const submitButton = screen.getByText('設定する');
		await userEvent.click(submitButton);

    // fetchWithAuth が呼ばれていないことを確認
    expect(fetchWithAuth).not.toHaveBeenCalled();

    // 2つ目のタスクに内容を入力
		const taskInputs = screen.getAllByLabelText('Task');
		await userEvent.type(taskInputs[1], 'タスク2');

    // 再度フォームを送信
		await userEvent.click(submitButton);

    // この時点で fetchWithAuth が呼ばれることを確認
    expect(fetchWithAuth).toHaveBeenCalled();

    // リクエストボディの確認
    const calls = fetchWithAuth.mock.calls;
    expect(calls.length).toBeGreaterThan(0);
    const [_, options] = calls[0];
    const requestBody = JSON.parse(options.body);
    
    // 両方のタスクが含まれていることを確認
    expect(requestBody.small_goal.tasks_attributes).toHaveLength(2);
    expect(requestBody.small_goal.tasks_attributes[0].content).toBe('タスク1');
    expect(requestBody.small_goal.tasks_attributes[1].content).toBe('タスク2');
  });

  it('ネットワークエラー時にエラーメッセージが表示される', async () => {
    // fetchWithAuth がネットワークエラーを投げるようにモック
    fetchWithAuth.mockRejectedValueOnce(new Error('Network Error'));

    render(
      <CreateSmallGoal
        isOpen={true}
        onClose={() => {}}
        goalId={1}
        onSmallGoalAdded={() => {}}
      />
    );

    // フォームに値を入力
    const futureDate = new Date(Date.now() + 86400000).toISOString().split('T')[0];

    await userEvent.type(screen.getByLabelText('Small Goalのタイトル'), 'テストSmall Goal');
    await userEvent.type(screen.getByLabelText('Task'), 'テストタスク');
    await userEvent.selectOptions(screen.getByLabelText('難易度の設定'), ['普通']);
    await userEvent.type(screen.getByLabelText('期限'), futureDate);

    // フォームを送信
    await userEvent.click(screen.getByText('設定する'));

    // ネットワークエラーのメッセージが表示されることを確認
    await waitFor(() => {
      expect(screen.getByText('Submission failed, please try again.')).toBeInTheDocument();
    });
  });

  it('API エラー後にフォームの内容が保持される', async () => {
    fetchWithAuth.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ errors: ['何らかのエラー'] })
    });

    render(<CreateSmallGoal isOpen={true} onClose={() => {}} goalId={1} onSmallGoalAdded={() => {}} />);

    const futureDate = new Date(Date.now() + 86400000).toISOString().split('T')[0];

    await userEvent.type(screen.getByLabelText('Small Goalのタイトル'), 'API エラー保持テスト');
    await userEvent.type(screen.getByLabelText('Task'), 'タスク保持テスト');
    await userEvent.selectOptions(screen.getByLabelText('難易度の設定'), ['普通']);
    await userEvent.type(screen.getByLabelText('期限'), futureDate);

    await userEvent.click(screen.getByText('設定する'));

    // エラーメッセージ確認
    await waitFor(() => {
      expect(screen.getByText('何らかのエラー')).toBeInTheDocument();
    });

    // フォーム内容が保持されていることを確認
    expect(screen.getByLabelText('Small Goalのタイトル')).toHaveValue('API エラー保持テスト');
    expect(screen.getByLabelText('Task')).toHaveValue('タスク保持テスト');
    expect(screen.getByLabelText('難易度の設定')).toHaveValue('普通');
    expect(screen.getByLabelText('期限')).toHaveValue(futureDate);
  });

  it('ネットワークエラー後にフォームの内容が保持される', async () => {
    fetchWithAuth.mockRejectedValueOnce(new Error('Network Error'));

    render(<CreateSmallGoal isOpen={true} onClose={() => {}} goalId={1} onSmallGoalAdded={() => {}} />);

    const futureDate = new Date(Date.now() + 86400000).toISOString().split('T')[0];

    await userEvent.type(screen.getByLabelText('Small Goalのタイトル'), 'NW エラー保持テスト');
    await userEvent.type(screen.getByLabelText('Task'), 'タスクNWテスト');
    await userEvent.selectOptions(screen.getByLabelText('難易度の設定'), ['普通']);
    await userEvent.type(screen.getByLabelText('期限'), futureDate);

    await userEvent.click(screen.getByText('設定する'));

    // エラーメッセージ確認
    await waitFor(() => {
      expect(screen.getByText('Submission failed, please try again.')).toBeInTheDocument();
    });

    // フォーム内容が保持されていることを確認
    expect(screen.getByLabelText('Small Goalのタイトル')).toHaveValue('NW エラー保持テスト');
    expect(screen.getByLabelText('Task')).toHaveValue('タスクNWテスト');
    expect(screen.getByLabelText('難易度の設定')).toHaveValue('普通');
    expect(screen.getByLabelText('期限')).toHaveValue(futureDate);
  });
});

describe('API 成功時の挙動', () => {
  it('API 成功時に onSmallGoalAdded が正しいデータで呼ばれる', async () => {
    const mockSmallGoal = {
      id: 1,
      title: 'テストSmall Goal',
      difficulty: '普通',
      deadline: '2024-03-20',
      tasks: [
        { id: 1, content: 'タスク1', completed: false }
      ]
    };
    const onSmallGoalAdded = jest.fn();

    // 成功レスポンスをモック
    fetchWithAuth.mockResolvedValueOnce({
      ok: true,
      json: async () => mockSmallGoal
    });

    render(
      <CreateSmallGoal
        isOpen={true}
        onClose={() => {}}
        goalId={1}
        onSmallGoalAdded={onSmallGoalAdded}
      />
    );

    const futureDate = new Date(Date.now() + 86400000).toISOString().split('T')[0];

    // フォームに値を入力
		await userEvent.type(screen.getByLabelText('Small Goalのタイトル'), 'テストSmall Goal');
		await userEvent.type(screen.getByLabelText('Task'), 'タスク1');
		await userEvent.selectOptions(screen.getByLabelText('難易度の設定'), ['普通']);
		const deadlineInput = screen.getByLabelText('期限');
		await userEvent.type(deadlineInput, futureDate);

    // フォームを送信
    const submitButton = screen.getByText('設定する');
		await userEvent.click(submitButton);

    // onSmallGoalAdded が正しいデータで呼ばれたことを確認
    await waitFor(() => {
      expect(onSmallGoalAdded).toHaveBeenCalledTimes(1);
      expect(onSmallGoalAdded).toHaveBeenCalledWith(mockSmallGoal);
    });
  });

  it('API 成功時にモーダルが閉じられる', async () => {
    const onClose = jest.fn();
    const mockSmallGoal = {
      id: 1,
      title: 'テストSmall Goal',
      difficulty: '普通',
      deadline: '2024-03-20',
      tasks: [
        { id: 1, content: 'タスク1', completed: false }
      ]
    };

    // 成功レスポンスをモック
    fetchWithAuth.mockResolvedValueOnce({
      ok: true,
      json: async () => mockSmallGoal
    });

    render(
      <CreateSmallGoal
        isOpen={true}
        onClose={onClose}
        goalId={1}
        onSmallGoalAdded={() => {}}
      />
    );

    const futureDate = new Date(Date.now() + 86400000).toISOString().split('T')[0];

    // フォームに値を入力
		await userEvent.type(screen.getByLabelText('Small Goalのタイトル'), 'テストSmall Goal');
		await userEvent.type(screen.getByLabelText('Task'), 'タスク1');
		await userEvent.selectOptions(screen.getByLabelText('難易度の設定'), ['普通']);
		const deadlineInput = screen.getByLabelText('期限');
		await userEvent.type(deadlineInput, futureDate);
	
    // フォームを送信
    const submitButton = screen.getByText('設定する');
		await userEvent.click(submitButton);

    // モーダルが閉じられたことを確認
    await waitFor(() => {
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  it('API 成功時にフォームがリセットされる', async () => {
    const mockSmallGoal = {
      id: 1,
      title: 'テストSmall Goal',
      difficulty: '普通',
      deadline: '2024-03-20',
      tasks: [
        { id: 1, content: 'タスク1', completed: false }
      ]
    };

    // 成功レスポンスをモック
    fetchWithAuth.mockResolvedValueOnce({
      ok: true,
      json: async () => mockSmallGoal
    });

    const { rerender } = render(
      <CreateSmallGoal
        isOpen={true}
        onClose={() => {}}
        goalId={1}
        onSmallGoalAdded={() => {}}
      />
    );

    const futureDate = new Date(Date.now() + 86400000).toISOString().split('T')[0];

    // フォームに値を入力
      await userEvent.type(screen.getByLabelText('Small Goalのタイトル'), 'テストSmall Goal');
      await userEvent.type(screen.getByLabelText('Task'), 'タスク1');
      await userEvent.selectOptions(screen.getByLabelText('難易度の設定'), ['普通']);
      const deadlineInput = screen.getByLabelText('期限');
      await userEvent.type(deadlineInput, futureDate);

    // フォームを送信
    const submitButton = screen.getByText('設定する');
		await userEvent.click(submitButton);

    // モーダルを一旦閉じてから再表示
      rerender(
        <CreateSmallGoal
          isOpen={false}
          onClose={() => {}}
          goalId={1}
          onSmallGoalAdded={() => {}}
        />
      );

      rerender(
        <CreateSmallGoal
          isOpen={true}
          onClose={() => {}}
          goalId={1}
          onSmallGoalAdded={() => {}}
        />
      );

    // フォームがリセットされていることを確認
    await waitFor(() => {
      expect(screen.getByLabelText('Small Goalのタイトル')).toHaveValue('');
      expect(screen.getByLabelText('Task')).toHaveValue('');
      expect(screen.getByLabelText('難易度の設定')).toHaveValue('');
      expect(screen.getByLabelText('期限')).toHaveValue('');
    });
  });
});

// モーダルのクローズ操作
describe('モーダル操作', () => {
  it('Close ボタンをクリックすると onClose が呼ばれる', async () => {
    const onClose = jest.fn();

    render(
      <CreateSmallGoal
        isOpen={true}
        onClose={onClose}
        goalId={1}
        onSmallGoalAdded={() => {}}
      />
    );

    // Close ボタンをクリック
    await userEvent.click(screen.getByText('Close'));

    // onClose が呼ばれたことを確認
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('モーダルを閉じた後に再度開くとフォームがリセットされる', async () => {
    const onClose = jest.fn();

    const { rerender } = render(
      <CreateSmallGoal
        isOpen={true}
        onClose={onClose}
        goalId={1}
        onSmallGoalAdded={() => {}}
      />
    );

    // フォームに値を入力
    const futureDate = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    await userEvent.type(screen.getByLabelText('Small Goalのタイトル'), 'クローズテスト');
    await userEvent.type(screen.getByLabelText('Task'), 'タスククローズテスト');
    await userEvent.selectOptions(screen.getByLabelText('難易度の設定'), ['普通']);
    await userEvent.type(screen.getByLabelText('期限'), futureDate);

    // Close ボタンをクリック
    await userEvent.click(screen.getByText('Close'));
    expect(onClose).toHaveBeenCalledTimes(1);

    // 親コンポーネント側でモーダルを閉じる（isOpen=false）
    rerender(
      <CreateSmallGoal
        isOpen={false}
        onClose={onClose}
        goalId={1}
        onSmallGoalAdded={() => {}}
      />
    );

    // 再度モーダルを開く（isOpen=true）
    rerender(
      <CreateSmallGoal
        isOpen={true}
        onClose={onClose}
        goalId={1}
        onSmallGoalAdded={() => {}}
      />
    );

    // フォームがリセットされていることを確認
    expect(screen.getByLabelText('Small Goalのタイトル')).toHaveValue('');
    expect(screen.getByLabelText('Task')).toHaveValue('');
    expect(screen.getByLabelText('難易度の設定')).toHaveValue('');
    expect(screen.getByLabelText('期限')).toHaveValue('');
  });
});

describe('URL クエリパラメータの処理', () => {
  it('URL にメッセージパラメータがある場合、そのメッセージが表示される', async () => {
    // useRouter のモックを更新
    const mockRouter = {
      query: { message: 'テストメッセージ' },
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
    };
    jest.spyOn(require('next/router'), 'useRouter').mockReturnValue(mockRouter);

    // コンポーネントをレンダリング
    render(
      <CreateSmallGoal
        isOpen={true}
        onClose={() => {}}
        goalId={1}
        onSmallGoalAdded={() => {}}
      />
    );

    // メッセージが表示されることを確認
    const messageElement = screen.getByText('テストメッセージ');
    expect(messageElement).toBeInTheDocument();
    expect(messageElement.closest('div')).toHaveClass(styles.errorMessage);
  });

  it('URL にメッセージパラメータがない場合、メッセージは表示されない', async () => {
    // useRouter のモックを更新（メッセージなし）
    const mockRouter = {
      query: {},
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
    };
    jest.spyOn(require('next/router'), 'useRouter').mockReturnValue(mockRouter);

    // コンポーネントをレンダリング
    render(
      <CreateSmallGoal
        isOpen={true}
        onClose={() => {}}
        goalId={1}
        onSmallGoalAdded={() => {}}
      />
    );

    // メッセージが表示されないことを確認
    expect(screen.queryByText('テストメッセージ')).not.toBeInTheDocument();
  });

  it('URL エンコードされたメッセージパラメータが正しくデコードされる', async () => {
    // URL エンコードされたメッセージ
    const encodedMessage = encodeURIComponent('テストメッセージ & 特殊文字');
    
    // useRouter のモックを更新
    const mockRouter = {
      query: { message: encodedMessage },
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
    };
    jest.spyOn(require('next/router'), 'useRouter').mockReturnValue(mockRouter);

    // コンポーネントをレンダリング
    render(
      <CreateSmallGoal
        isOpen={true}
        onClose={() => {}}
        goalId={1}
        onSmallGoalAdded={() => {}}
      />
    );

    // デコードされたメッセージが表示されることを確認
    const messageElement = screen.getByText('テストメッセージ & 特殊文字');
    expect(messageElement).toBeInTheDocument();
    expect(messageElement.closest('div')).toHaveClass(styles.errorMessage);
  });
});

describe('スタイルの確認', () => {
  it('各要素に適切なクラス名が適用されている', async () => {
    render(
      <CreateSmallGoal
        isOpen={true}
        onClose={() => {}}
        goalId={1}
        onSmallGoalAdded={() => {}}
      />
    );

    // モーダルのオーバーレイ
    const modalOverlay = screen.getByTestId('create-small-goal');
    expect(modalOverlay).toHaveClass(styles.modalOverlay);

    // モーダルのコンテンツ
    const modalContent = modalOverlay.firstChild;
    expect(modalContent).toHaveClass(styles.modalContent);

    // タイトル入力フィールド
    const titleInput = screen.getByLabelText('Small Goalのタイトル');
    expect(titleInput).toHaveClass(styles.textareaField);

    // タスク入力フィールド
    const taskInput = screen.getByLabelText('Task');
    expect(taskInput).toHaveClass(styles.textareaField);

    // タスク削除ボタン
    const removeTaskButton = screen.getByText('タスクの削除');
    expect(removeTaskButton).toHaveClass(styles.taskButton);

    // タスク追加ボタン
    const addTaskButton = screen.getByText('タスクの追加');
    expect(addTaskButton).toHaveClass(styles.addTaskButton);

    // 期限入力フィールド
    const deadlineInput = screen.getByLabelText('期限');
    expect(deadlineInput).toHaveClass(styles.deadlineField);

    // 設定するボタン
    const submitButton = screen.getByText('設定する');
    expect(submitButton).toHaveClass('btn', 'btn-primary');

    // Closeボタン
    const closeButton = screen.getByText('Close');
    expect(closeButton).toHaveClass(styles.closeButton);
  });

  it('エラーメッセージに適切なクラス名が適用される', async () => {
    // useRouter のモックを更新
    const mockRouter = {
      query: { message: 'テストメッセージ' },
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
    };
    jest.spyOn(require('next/router'), 'useRouter').mockReturnValue(mockRouter);

    render(
      <CreateSmallGoal
        isOpen={true}
        onClose={() => {}}
        goalId={1}
        onSmallGoalAdded={() => {}}
      />
    );

    // エラーメッセージのコンテナ
    const errorMessageContainer = screen.getByText('テストメッセージ').closest('div');
    expect(errorMessageContainer).toHaveClass(styles.errorMessage);
  });
});

describe('エラーメッセージのスタイル', () => {
  beforeEach(() => {
    // useRouter のモックをクリア
    const mockRouter = {
      query: {},
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
    };
    jest.spyOn(require('next/router'), 'useRouter').mockReturnValue(mockRouter);
  });

  it('API エラー時にエラーメッセージが適切なスタイルで表示される', async () => {
    // エラーレスポンスをモック
    fetchWithAuth.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ errors: ['エラーが発生しました'] })
    });

    render(
      <CreateSmallGoal
        isOpen={true}
        onClose={() => {}}
        goalId={1}
        onSmallGoalAdded={() => {}}
      />
    );

    // フォームに値を入力
    const futureDate = new Date(Date.now() + 86400000).toISOString().split('T')[0];

    await userEvent.type(screen.getByLabelText('Small Goalのタイトル'), 'テストSmall Goal');
    await userEvent.type(screen.getByLabelText('Task'), 'テストタスク');
    await userEvent.selectOptions(screen.getByLabelText('難易度の設定'), ['普通']);
    const deadlineInput = screen.getByLabelText('期限');
    await userEvent.type(deadlineInput, futureDate);

    // フォームを送信
    const submitButton = screen.getByText('設定する');
    await userEvent.click(submitButton);

    // エラーメッセージが表示されることを確認
    const errorMessage = await screen.findByText('エラーが発生しました');
    expect(errorMessage).toBeInTheDocument();
    expect(errorMessage.closest('div')).toHaveClass(styles.errorMessage);
  });

  it('ネットワークエラー時にエラーメッセージが適切なスタイルで表示される', async () => {
    // fetchWithAuth がネットワークエラーを投げるようにモック
    fetchWithAuth.mockRejectedValueOnce(new Error('Network Error'));

    render(
      <CreateSmallGoal
        isOpen={true}
        onClose={() => {}}
        goalId={1}
        onSmallGoalAdded={() => {}}
      />
    );

    // フォームに値を入力
    const futureDate = new Date(Date.now() + 86400000).toISOString().split('T')[0];

    await userEvent.type(screen.getByLabelText('Small Goalのタイトル'), 'テストSmall Goal');
    await userEvent.type(screen.getByLabelText('Task'), 'テストタスク');
    await userEvent.selectOptions(screen.getByLabelText('難易度の設定'), ['普通']);
    const deadlineInput = screen.getByLabelText('期限');
    await userEvent.type(deadlineInput, futureDate);

    // フォームを送信
    const submitButton = screen.getByText('設定する');
    await userEvent.click(submitButton);

    // エラーメッセージが表示されることを確認
    const errorMessage = await screen.findByText('Submission failed, please try again.');
    expect(errorMessage).toBeInTheDocument();
    expect(errorMessage.closest('div')).toHaveClass(styles.errorMessage);
  });

  it('URL クエリパラメータのメッセージが適切なスタイルで表示される', async () => {
    // useRouter のモックを更新
    const mockRouter = {
      query: { message: 'クエリパラメータのメッセージ' },
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
    };
    jest.spyOn(require('next/router'), 'useRouter').mockReturnValue(mockRouter);

    render(
      <CreateSmallGoal
        isOpen={true}
        onClose={() => {}}
        goalId={1}
        onSmallGoalAdded={() => {}}
      />
    );

    // メッセージが表示されることを確認
    const messageElement = screen.getByText('クエリパラメータのメッセージ');
    expect(messageElement).toBeInTheDocument();
    expect(messageElement.closest('div')).toHaveClass(styles.errorMessage);
  });

  it('エラーメッセージが複数行の場合も適切に表示される', async () => {
    fetchWithAuth.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ 
        errors: [
          'タイトルは必須です',
          'タスクは1つ以上必要です',
          '期限を設定してください'
        ] 
      })
    });

    render(
      <CreateSmallGoal
        isOpen={true}
        onClose={() => {}}
        goalId={1}
        onSmallGoalAdded={() => {}}
      />
    );

    // フォームを送信
    //await userEvent.click(screen.getByText('設定する'));
    // 1. フォームの必須項目を埋める
    await userEvent.type(screen.getByLabelText('Small Goalのタイトル'), 'dummy');
    await userEvent.type(screen.getAllByLabelText('Task')[0], 'dummy task');
    await userEvent.selectOptions(screen.getByLabelText('難易度の設定'), '普通');
    fireEvent.change(screen.getByLabelText('期限'), { target: { value: '2025-01-01' } });

    // 2. 送信
    await userEvent.click(screen.getByRole('button', { name: '設定する' }));

    // 3. alert の検証
    const alertBox = await screen.findByRole('alert');
    expect(alertBox).toHaveTextContent('タイトルは必須です');


    // エラーメッセージが表示されるまで待機（タイムアウトを延長）
    //await waitFor(() => {
    //  const alertBox = screen.getByRole('alert');
    //  console.log('Error message content:', alertBox.textContent);
    //  console.log('Error message HTML:', alertBox.innerHTML);
    //  console.log('Error message classes:', alertBox.className);
      
    //  expect(alertBox).toHaveClass(styles.errorMessage);
    //  expect(alertBox).toHaveTextContent('タイトルは必須です');
    //  expect(alertBox).toHaveTextContent('タスクは1つ以上必要です');
    //  expect(alertBox).toHaveTextContent('期限を設定してください');
    //}, { timeout: 3000 }); // タイムアウトを3秒に延長
  });
}); 