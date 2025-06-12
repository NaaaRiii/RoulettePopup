import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CreateSmallGoal from '../components/CreateSmallGoal';
import { fetchWithAuth } from '../utils/fetchWithAuth';
import '@testing-library/jest-dom';
import { act, waitFor } from '@testing-library/react';

// fetchWithAuth のモック
jest.mock('../utils/fetchWithAuth');

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
    await act(async () => {
      await userEvent.click(addTaskButton);
    });
    await waitFor(() => {
      const taskInputs = screen.getAllByLabelText('Task');
      expect(taskInputs).toHaveLength(2);
    });
    
    // 2つ目のタスクを追加
    await act(async () => {
      await userEvent.click(addTaskButton);
    });
    await waitFor(() => {
      const taskInputs = screen.getAllByLabelText('Task');
      expect(taskInputs).toHaveLength(3);
    });
    
    // 最新追加(3番目)のタスクフィールドに内容を入力
    let taskInputs = screen.getAllByLabelText('Task');
    await act(async () => {
      await userEvent.type(taskInputs[2], 'テストタスク2');
    });
    
    // 真ん中(2番目)のタスクフィールドの削除ボタンをクリック
    const removeButtons = screen.getAllByText('タスクの削除');
    await act(async () => {
      await userEvent.click(removeButtons[1]);
    });
    
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
    let taskInputs = screen.getAllByLabelText('Task');
    expect(taskInputs).toHaveLength(1);

    const removeButton = screen.getByText('タスクの削除');

    // 削除を試みる
    await act(async () => {
      await userEvent.click(removeButton);
    });

    // タスクフィールドが依然として1つであることを確認
    taskInputs = screen.getAllByLabelText('Task');
    expect(taskInputs).toHaveLength(1);

    // 削除ボタンも1つのままであることを確認
    const removeButtons = screen.getAllByText('タスクの削除');
    expect(removeButtons).toHaveLength(1);
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

    await act(async () => {
      await userEvent.type(taskInput, 'タスク更新テスト');
    });

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
    await act(async () => {
      await userEvent.click(submitButton);
    });

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
    await act(async () => {
      await userEvent.type(screen.getByLabelText('Small Goalのタイトル'), 'タイトルテスト');
      await userEvent.selectOptions(screen.getByLabelText('難易度の設定'), ['普通']);
      const deadlineInput = screen.getByLabelText('期限');
      const futureDate = new Date(Date.now() + 86400000).toISOString().split('T')[0]; // 明日
      await userEvent.type(deadlineInput, futureDate);
    });

    const submitButton = screen.getByText('設定する');
    await act(async () => {
      await userEvent.click(submitButton);
    });

    expect(fetchWithAuth).not.toHaveBeenCalled();
  });

}); 