import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EditGoal from '../../components/EditGoal';
import { fetchWithAuth } from '../../utils/fetchWithAuth';
import '@testing-library/jest-dom';

// fetchWithAuth のモック
// デフォルトでは global.fetch に委譲して Promise を返すようにしておく。
// 各テストケースで fetchWithAuth.mockResolvedValueOnce などで上書き可能。
jest.mock('../../utils/fetchWithAuth', () => {
  const fetchWithAuth = jest.fn((path, opts = {}) => {
    const base = (process.env.NEXT_PUBLIC_RAILS_API_URL || '').replace(/\/$/, '');
    const url  = base
      ? `${base}/${path.replace(/^\//, '')}`
      : path;

    return global.fetch(url, opts).then((resp) => {
      // `resp.ok` が無い場合は true を補完（テスト用）
      if (typeof resp.ok === 'undefined') {
        resp.ok = true;
      }
      // `resp.text` が無い場合はダミー実装を付与
      if (typeof resp.text !== 'function') {
        resp.text = async () => '';
      }
      return resp;
    });
  });
  return { __esModule: true, default: fetchWithAuth, fetchWithAuth };
});

// Next.js の useRouter をモック
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    pathname: '/',
    query: {},
  }),
}));


describe('初期表示', () => {
	it('isOpen=false のとき、何もレンダリングされない', () => {
		const { container } = render(
			<EditGoal
				isOpen={false}
				onClose={() => {}}
				goalId={1}
				onGoalUpdated={() => {}}
			/>
		);
		
		// コンテナが空であることを確認
		expect(container).toBeEmptyDOMElement();
	});

	it('goalId が渡されたとき、API からデータを取得して各ステートが初期化される', async () => {
		const mockGoal = {
			title: 'テスト目標',
			content: 'テスト内容',
			deadline: '2024-03-20'
		};

		// fetch のモック実装
		global.fetch = jest.fn().mockResolvedValueOnce({
			json: () => Promise.resolve(mockGoal)
		});

		render(
			<EditGoal
				isOpen={true}
				onClose={() => {}}
				goalId={1}
				onGoalUpdated={() => {}}
			/>
		);

		// API が正しい URL で呼ばれることを確認
		expect(global.fetch).toHaveBeenCalledWith(
			'/api/goals/1',
			{ method: 'GET' }
		);

		// 各ステートが正しく初期化されることを確認
		await waitFor(() => {
			// title の初期化を確認
			const titleInput = screen.getByLabelText('Goalのタイトル');
			expect(titleInput).toHaveValue(mockGoal.title);

			// content の初期化を確認
			const contentInput = screen.getByLabelText('Goalの詳細');
			expect(contentInput).toHaveValue(mockGoal.content);

			// deadline の初期化を確認
			const deadlineInput = screen.getByLabelText('期限');
			expect(deadlineInput).toHaveValue(mockGoal.deadline);
		});
	});
});

describe('formatDate 関数', () => {
	it('有効な日付文字列を渡したとき、期待する形式で返される', async () => {
		// テストケース
		const testCases = [
			{
				input: '2024-03-20T00:00:00+09:00',
				expected: '2024-03-20'
			},
			{
				input: '2024-12-31T00:00:00+09:00',
				expected: '2024-12-31'
			},
			{
				input: '2024-01-01T00:00:00+09:00',
				expected: '2024-01-01'
			}
		];

		// 各テストケースを実行
		for (const { input, expected } of testCases) {
			// fetch のモック実装
			global.fetch = jest.fn().mockResolvedValueOnce({
				json: () => Promise.resolve({
					title: 'テスト目標',
					content: 'テスト内容',
					deadline: input
				})
			});

			// コンポーネントをレンダリング
			const { unmount } = render(
				<EditGoal
					isOpen={true}
					onClose={() => {}}
					goalId={1}
					onGoalUpdated={() => {}}
				/>
			);

			// deadline フィールドが正しくフォーマットされることを確認
			await waitFor(() => {
				const deadlineInput = screen.getByLabelText('期限');
				expect(deadlineInput.value).toBe(expected);
			});

			// コンポーネントをアンマウントして次のテストケースの準備
			unmount();
		}
	});

	it('無効な日付文字列を渡したとき、エラーがログされる', async () => {
		// console.error のスパイを設定
		const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

		// 無効な日付文字列を含むデータ
		const invalidDate = 'invalid-date-string';

		// fetch のモック実装
		global.fetch = jest.fn().mockResolvedValueOnce({
			json: () => Promise.resolve({
				title: 'テスト目標',
				content: 'テスト内容',
				deadline: invalidDate
			})
		});

		// コンポーネントをレンダリング
		render(
			<EditGoal
				isOpen={true}
				onClose={() => {}}
				goalId={1}
				onGoalUpdated={() => {}}
			/>
		);

		// エラーがログに出力されることを確認
		await waitFor(() => {
			expect(consoleErrorSpy).toHaveBeenCalledWith(
				'Failed to load goal',
				expect.any(Error)
			);
		});

		// スパイをクリーンアップ
		consoleErrorSpy.mockRestore();
	});
});


describe('入力フォームの要素確認', () => {
	beforeEach(() => {
		// fetch のモックを設定
		global.fetch = jest.fn().mockResolvedValue({
			json: () => Promise.resolve({
				title: 'テスト目標',
				content: 'テスト内容',
				deadline: '2024-03-20'
			})
		});
	});

	afterEach(() => {
		// モックをクリーンアップ
		jest.clearAllMocks();
	});

	it('title の textarea が表示され、value にステート title が反映される', async () => {
		// コンポーネントをレンダリング
		render(
			<EditGoal
				isOpen={true}
				onClose={() => {}}
				goalId={1}
				onGoalUpdated={() => {}}
			/>
		);

		// title の textarea を取得
		const titleInput = await screen.findByLabelText('Goalのタイトル');
		expect(titleInput).toBeInTheDocument();
		expect(titleInput.tagName).toBe('TEXTAREA');

		// 既存の値をクリアして新しい値を入力
		fireEvent.change(titleInput, { target: { value: '新しい目標タイトル' } });

		// 値が更新されていることを確認
		expect(titleInput.value).toBe('新しい目標タイトル');
	});

	it('content の textarea が表示され、value にステート content が反映される', async () => {
		// コンポーネントをレンダリング
		render(
			<EditGoal
				isOpen={true}
				onClose={() => {}}
				goalId={1}
				onGoalUpdated={() => {}}
			/>
		);

		// content の textarea を取得
		const contentInput = await screen.findByLabelText('Goalの詳細');
		expect(contentInput).toBeInTheDocument();
		expect(contentInput.tagName).toBe('TEXTAREA');

		// 既存の値をクリアして新しい値を入力
		fireEvent.change(contentInput, { target: { value: '新しい目標の詳細' } });

		// 値が更新されていることを確認
		expect(contentInput.value).toBe('新しい目標の詳細');
	});

	it('deadline の date input が表示され、value にステート deadline が反映される', async () => {
		// コンポーネントをレンダリング
		render(
			<EditGoal
				isOpen={true}
				onClose={() => {}}
				goalId={1}
				onGoalUpdated={() => {}}
			/>
		);

		// deadline の input を取得
		const deadlineInput = await screen.findByLabelText('期限');
		expect(deadlineInput).toBeInTheDocument();
		expect(deadlineInput.type).toBe('date');

		// 既存の値をクリアして新しい値を入力
		fireEvent.change(deadlineInput, { target: { value: '2024-12-31' } });

		// 値が更新されていることを確認
		expect(deadlineInput.value).toBe('2024-12-31');
	});
});


describe('キャンセル操作', () => {
	it('Close ボタンをクリックすると必ず onClose が呼ばれる', async () => {
		// onClose のモック関数を作成
		const mockOnClose = jest.fn();

		// コンポーネントをレンダリング
		render(
			<EditGoal
				isOpen={true}
				onClose={mockOnClose}
				goalId={1}
				onGoalUpdated={() => {}}
			/>
		);

		// Close ボタンを取得してクリック
		const closeButton = await screen.findByText('Close');
		fireEvent.click(closeButton);

		// onClose が1回呼ばれたことを確認
		expect(mockOnClose).toHaveBeenCalledTimes(1);
	});
});


describe('フォーム送信前バリデーション', () => {
	it('goalId が falsy のとき、fetch は呼ばれない', () => {
		// fetch のモックをリセット
		global.fetch = jest.fn();

		// コンポーネントをレンダリング（goalId を null に設定）
		render(
			<EditGoal
				isOpen={true}
				onClose={() => {}}
				goalId={null}
				onGoalUpdated={() => {}}
			/>
		);
		
		// fetch が呼ばれていないことを確認
		expect(global.fetch).not.toHaveBeenCalled();
	});
});


describe('API 通信', () => {
	it('正しい URL・メソッド・ボディで fetchWithAuth が一度だけ呼ばれる', async () => {
		// fetchWithAuth のモックをリセット
		fetchWithAuth.mockClear();

		// GET (1回目)
		fetchWithAuth.mockResolvedValueOnce({
		  ok  : true,
		  json: () => Promise.resolve({
		    title  : 'テスト目標',
		    content: 'テスト内容',
		    deadline: '2024-03-20'
		  })
		});
		// PUT (2回目)
		fetchWithAuth.mockResolvedValueOnce({
		  ok  : true,
		  json: () => Promise.resolve({ message: 'Goalを編集しました' })
		});

		// コンポーネントをレンダリング
		render(
			<EditGoal
				isOpen={true}
				onClose={() => {}}
				goalId={1}
				onGoalUpdated={() => {}}
			/>
		);

		// フォームの入力値を設定
		const titleInput = await screen.findByLabelText('Goalのタイトル');
		const contentInput = await screen.findByLabelText('Goalの詳細');
		const deadlineInput = await screen.findByLabelText('期限');

		fireEvent.change(titleInput, { target: { value: 'テスト目標' } });
		fireEvent.change(contentInput, { target: { value: 'テスト内容' } });
		fireEvent.change(deadlineInput, { target: { value: '2024-12-31' } });

		// フォームを送信
		const submitButton = screen.getByText('Goalを更新する');
		const form = submitButton.closest('form');
		fireEvent.submit(form);

		// fetchWithAuth は初期データ取得 (GET) と更新 (PUT) の 2 回呼ばれる
		expect(fetchWithAuth).toHaveBeenCalledTimes(2);
		expect(fetchWithAuth).toHaveBeenCalledWith(
			'/api/goals/1',
			{
				method: 'PUT',
				body: JSON.stringify({
					title: 'テスト目標',
					content: 'テスト内容',
					deadline: '2024-12-31'
				})
			}
		);
	});
});


describe('API 成功時の挙動', () => {
	it('response.ok===true のとき、onGoalUpdated と onClose が呼ばれる', async () => {
		// 前のテストケースでの呼び出し回数をリセット
		fetchWithAuth.mockClear();
		// モックの設定
		const mockOnClose = jest.fn();
		const mockOnGoalUpdated = jest.fn();
		// fetchWithAuth を 2 回モック
		//   1回目(GET) : 初期データ取得成功
		//   2回目(PUT) : 更新成功
		fetchWithAuth
		  .mockResolvedValueOnce({
		    ok  : true,
		    json: async () => ({
		      title  : 'テスト目標',
		      content: 'テスト内容',
		      deadline: '2024-03-20'
		    })
		  })
		  .mockResolvedValueOnce({
		    ok  : true,
		    json: async () => ({ message: 'Goal updated successfully' })
		  });

		// コンポーネントをレンダリング
		render(
			<EditGoal
				isOpen={true}
				onClose={mockOnClose}
				goalId={1}
				onGoalUpdated={mockOnGoalUpdated}
			/>
		);

		// フォームの入力値を設定
		const titleInput = await screen.findByLabelText('Goalのタイトル');
		const contentInput = await screen.findByLabelText('Goalの詳細');
		const deadlineInput = await screen.findByLabelText('期限');

		// 入力値を設定
		fireEvent.change(titleInput, { target: { value: 'テスト目標' } });
		fireEvent.change(contentInput, { target: { value: 'テスト内容' } });
		fireEvent.change(deadlineInput, { target: { value: '2024-12-31' } });

		// フォームを送信
		const submitButton = screen.getByText('Goalを更新する');
		const form = submitButton.closest('form');
		fireEvent.submit(form);

		// 非同期処理の完了を待つ
		await waitFor(() => {
			// onGoalUpdated と onClose が呼ばれていることを確認
			expect(mockOnGoalUpdated).toHaveBeenCalledWith({
				title   : 'テスト目標',
				content : 'テスト内容',
				deadline: '2024-12-31'
			});
			expect(mockOnClose).toHaveBeenCalledTimes(1);
		});
		// メッセージはモーダルが閉じるため表示されないケースもあるので確認しない
	});
});


describe('API エラー時の挙動', () => {
  it('response.ok===false のとき、エラーメッセージがログされる', async () => {
    // モックの設定
    const mockOnClose = jest.fn();
    const mockOnGoalUpdated = jest.fn();
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    // 初期データ取得用のfetchのモック
    global.fetch = jest.fn().mockResolvedValueOnce({
      json: () => Promise.resolve({
        title: 'テスト目標',
        content: 'テスト内容',
        deadline: '2024-03-20'
      })
    });

    // fetchWithAuth のモック実装
    //   1回目(GET) : 初期データ取得成功
    //   2回目(PUT) : 更新失敗 (ok:false)
    fetchWithAuth
      .mockResolvedValueOnce({
        ok  : true,
        json: async () => ({
          title  : 'テスト目標',
          content: 'テスト内容',
          deadline: '2024-03-20'
        })
      })
      .mockResolvedValueOnce({
        ok  : false,
        json: async () => ({ error: '更新に失敗しました' })
      });

    render(
      <EditGoal
        isOpen={true}
        onClose={mockOnClose}
        goalId={1}
        onGoalUpdated={mockOnGoalUpdated}
      />
    );

    // フォームの入力値を設定
    const titleInput = await screen.findByLabelText('Goalのタイトル');
    const contentInput = await screen.findByLabelText('Goalの詳細');
    const deadlineInput = await screen.findByLabelText('期限');

    // 入力値を設定
    fireEvent.change(titleInput, { target: { value: 'テスト目標' } });
    fireEvent.change(contentInput, { target: { value: 'テスト内容' } });
    fireEvent.change(deadlineInput, { target: { value: '2024-12-31' } });

    // フォームを送信
    const submitButton = screen.getByText('Goalを更新する');
    const form = submitButton.closest('form');
    fireEvent.submit(form);

    // エラーメッセージがログされることを確認
    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error updating goal:',
        { error: '更新に失敗しました' }
      );
    });

    // onClose と onGoalUpdated が呼ばれないことを確認
    expect(mockOnClose).not.toHaveBeenCalled();
    expect(mockOnGoalUpdated).not.toHaveBeenCalled();

    // モックをリセット
    consoleErrorSpy.mockRestore();
  });

	it('fetchWithAuth が例外を投げたとき、エラーメッセージがログされる', async () => {
    // モックの設定
    const mockOnClose = jest.fn();
    const mockOnGoalUpdated = jest.fn();
    
    // 例外の設定
    const error = new Error('Network error');
    
    // 初期データ取得用のfetchのモック
    global.fetch = jest.fn().mockResolvedValueOnce({
      json: () => Promise.resolve({
        title: 'テスト目標',
        content: 'テスト内容',
        deadline: '2024-03-20'
      })
    });
    
    // fetchWithAuth のモック実装（例外を投げる）
    fetchWithAuth.mockRejectedValue(error);

    // console.error のモック
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <EditGoal
        isOpen={true}
        onClose={mockOnClose}
        goalId={1}
        onGoalUpdated={mockOnGoalUpdated}
      />
    );

    // フォームの入力値を設定
    const titleInput = await screen.findByLabelText('Goalのタイトル');
    const contentInput = await screen.findByLabelText('Goalの詳細');
    const deadlineInput = await screen.findByLabelText('期限');

    // 入力値を設定
    fireEvent.change(titleInput, { target: { value: 'テスト目標' } });
    fireEvent.change(contentInput, { target: { value: 'テスト内容' } });
    fireEvent.change(deadlineInput, { target: { value: '2024-12-31' } });

    // フォームを送信
    const submitButton = screen.getByText('Goalを更新する');
    const form = submitButton.closest('form');
    fireEvent.submit(form);

    // エラーメッセージがログされることを確認
    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith('Update failed', error);
    });

    // onClose と onGoalUpdated が呼ばれないことを確認
    expect(mockOnClose).not.toHaveBeenCalled();
    expect(mockOnGoalUpdated).not.toHaveBeenCalled();

    // モックをリセット
    consoleErrorSpy.mockRestore();
  });
});