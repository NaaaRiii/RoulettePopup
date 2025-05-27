import React from 'react';
import { render, screen, waitFor, fireEvent, waitForElementToBeRemoved } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GoalPage from '../pages/goals/[goalId]';
import { useRouter } from 'next/router';
import { useGoals } from '../contexts/GoalsContext';
import { fetchWithAuth } from '../utils/fetchWithAuth';
import { Authenticator, useAuthenticator } from '@aws-amplify/ui-react';
import '@testing-library/jest-dom';


jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

jest.mock('../contexts/GoalsContext', () => ({
  useGoals: jest.fn(),
}));

jest.mock('../utils/fetchWithAuth', () => ({
  fetchWithAuth: jest.fn(),
}));

jest.mock('@aws-amplify/ui-react', () => {
  const actual = jest.requireActual('@aws-amplify/ui-react');
  return {
    __esModule: true,
    ...actual,
    useAuthenticator: jest.fn(() => ({
      route: 'authenticated',
      user: { username: 'tester' },
    })),
  };
});

////////////////////////////////////////////////////////////////////////////////

describe('GoalPage ― 初期レンダリング／状態遷移', () => {
  beforeEach(() => {
    // 共通モック（毎テスト実行前にリセットしたいもの）
    useRouter.mockReturnValue({
      query: { goalId: 'test-id' },
      push: jest.fn(),
    });
    useGoals.mockReturnValue({
      goalsState: [],
      setGoalsState: jest.fn(),
      refreshGoals: jest.fn(),
    });
    fetchWithAuth.mockClear();
  });

  it('loading=true の間 “Loading...” が表示される', async () => {
    // 成功レスポンスをスタブ
    fetchWithAuth.mockImplementation((url) =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve(
            url.endsWith('/small_goals') ? [] : { id: 1, title: 'Goal', completed: false }
          ),
      })
    );

    render(
      <Authenticator.Provider value={{ route: 'authenticated', user: {} }}>
        <GoalPage />
      </Authenticator.Provider>
    );

    // ロード中
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
    // データ取得完了後には消える
    await waitForElementToBeRemoved(() => screen.queryByText(/loading/i));
  });

  it('API が 404 / 空データなら “Goal not found” を表示', async () => {
    // goalDetails 404
    fetchWithAuth.mockImplementation((url) => {
      if (url.includes('/small_goals')) return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
      return Promise.resolve({ ok: false, status: 404 });
    });

    render(
      <Authenticator.Provider value={{ route: 'authenticated', user: {} }}>
        <GoalPage />
      </Authenticator.Provider>
    );

    await waitForElementToBeRemoved(() => screen.queryByText(/loading/i));
    expect(screen.getByText(/goal not found/i)).toBeInTheDocument();
  });

	it('goal 取得成功で goal 情報と small goal 一覧が描画される', async () => {
		// goalDetails と small_goals の正常レスポンス
		fetchWithAuth.mockImplementation((url) => {
			if (url === '/api/goals/test-id') {
				return Promise.resolve({
					ok: true,
					json: () =>
						Promise.resolve({
							id: 1,
							title: 'Test Goal',
							content: 'Goal content',
							deadline: '2025-06-30T00:00:00Z',
							completed: false,
						}),
				});
			}
			if (url === '/api/goals/test-id/small_goals') {
				return Promise.resolve({
					ok: true,
					json: () =>
						Promise.resolve([
							{
								id: 11,
								title: 'Small A',
								difficulty: 'easy',
								deadline: '2025-06-15T00:00:00Z',
								completed: false,
								tasks: [
									{ id: 101, content: 'task-1', completed: false },
									{ id: 102, content: 'task-2', completed: true },
								],
							},
						]),
				});
			}
			return Promise.reject(new Error(`unexpected: ${url}`));
		});

		render(
			<Authenticator.Provider
				value={{ route: 'authenticated', user: {} }}
			>
				<GoalPage />
			</Authenticator.Provider>
		);

		// Loading… が消えるまで待つ
		await waitForElementToBeRemoved(() => screen.queryByText(/loading/i));

		// Goal タイトルが描画
		expect(screen.getByText('目標 : Test Goal')).toBeInTheDocument();

		// Small goal タイトルが描画
		expect(screen.getByText('Small A')).toBeInTheDocument();

		// タスク内容も表示されている
		expect(screen.getByText('task-1')).toBeInTheDocument();
		expect(screen.getByText('task-2')).toBeInTheDocument();
	});

	it('URL クエリに ?message= がある場合、そのメッセージが表示される', async () => {
		const msg = 'Small Goal を作成しました！';
	
		// ── Router だけ上書きして message を含める
		useRouter.mockReturnValueOnce({
			query: {
				goalId: 'test-id',
				message: encodeURIComponent(msg), // ← コンポーネント内で decode される
			},
			push: jest.fn(),
		});
	
		// goalDetails / small_goals 正常レスポンスを再利用
		fetchWithAuth.mockImplementation((url) => {
			if (url === '/api/goals/test-id') {
				return Promise.resolve({
					ok: true,
					json: () =>
						Promise.resolve({
							id: 1,
							title: 'Test Goal',
							content: 'dummy',
							deadline: '2025-06-30T00:00:00Z',
							completed: false,
						}),
				});
			}
			if (url === '/api/goals/test-id/small_goals') {
				return Promise.resolve({
					ok: true,
					json: () => Promise.resolve([]),
				});
			}
			return Promise.reject(new Error(`unexpected: ${url}`));
		});
	
		render(
			<Authenticator.Provider
				value={{ route: 'authenticated', user: {} }}
			>
				<GoalPage />
			</Authenticator.Provider>
		);
	
		// Loading… が消えるまで待つ
		await waitForElementToBeRemoved(() => screen.queryByText(/loading/i));
	
		// クエリ文字列のメッセージが描画されているか
		expect(screen.getByText(msg)).toBeInTheDocument();
	});

	it('日付フォーマットが正しく表示される', async () => {
		// Router に goalId をセット
		useRouter.mockReturnValueOnce({
			query: { goalId: 'test-id' },
			push: jest.fn(),
		});
	
		// API レスポンスをスタブ（deadline に ISO 文字列をセット）
		fetchWithAuth.mockImplementation((url) => {
			if (url === '/api/goals/test-id') {
				return Promise.resolve({
					ok: true,
					json: () =>
						Promise.resolve({
							id: 1,
							title: 'Date Test Goal',
							content: 'dummy',
							deadline: '2025-05-27T03:00:00Z', // ← テスト対象の日付
							completed: false,
						}),
				});
			}
			if (url === '/api/goals/test-id/small_goals') {
				return Promise.resolve({
					ok: true,
					json: () => Promise.resolve([]),
				});
			}
			return Promise.reject(new Error(`unexpected: ${url}`));
		});
	
		render(
			<Authenticator.Provider value={{ route: 'authenticated', user: {} }}>
				<GoalPage />
			</Authenticator.Provider>
		);
	
		// Loading… が消えるまで待つ
		await waitForElementToBeRemoved(() => screen.queryByText(/loading/i));
	
		// フォーマット後の期限表示を検証
		expect(screen.getByText('期限: 2025-05-27')).toBeInTheDocument();
	});
	
});

////////////////////////////////////////////////////////////////////////////////

describe('副作用フック(useEffect & useCallback)', () => {
  beforeEach(() => {
    useAuthenticator.mockReturnValue({
      route: 'authenticated',
      user: { username: 'tester' },
    });

    useGoals.mockReturnValue({
      goalsState: [],
      setGoalsState: jest.fn(),
      refreshGoals: jest.fn(),
    });

    fetchWithAuth.mockClear();
  });

  it('goalId が存在するときのみ API(fetchWithAuth) が呼ばれる', async () => {
    useRouter.mockReturnValue({
      query: { goalId: 'abc' },
      push: jest.fn(),
    });
    fetchWithAuth.mockResolvedValue({ ok: true, json: () => Promise.resolve({}) });

    render(<GoalPage />);

    await waitFor(() => {
      expect(fetchWithAuth).toHaveBeenCalled();
    });
  });

  it('goalId が undefined のときは API(fetchWithAuth) が呼ばれない', () => {
    useRouter.mockReturnValue({ query: {}, push: jest.fn() });

    render(<GoalPage />);

    expect(fetchWithAuth).not.toHaveBeenCalled();
  });

	it('goalDetails + smallGoals 正常系: 2つのエンドポイントを叩き、state が統合データで更新される', async () => {
    // → goalId を含む router
    useRouter.mockReturnValue({ query: { goalId: 'xyz' }, push: jest.fn() });

    const mockGoal = {
      id: 7,
      title: 'Combined Goal',
      content: 'Combined content',
      deadline: '2025-12-31T12:00:00Z',
      completed: false,
    };
    const mockSmallGoals = [
      {
        id: 71,
        title: 'SG1',
        difficulty: 'easy',
        deadline: '2025-12-01T00:00:00Z',
        completed: false,
        tasks: [{ id: 1001, content: 'foo', completed: false }],
      },
    ];

    // 2 つの URL に対して返却を定義
    fetchWithAuth.mockImplementation((url) => {
      if (url === '/api/goals/xyz') {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockGoal) });
      }
      if (url === '/api/goals/xyz/small_goals') {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockSmallGoals) });
      }
      return Promise.reject(new Error(`unexpected request: ${url}`));
    });

    render(<GoalPage />);

    // 2 つとも呼ばれたことを確認
    await waitFor(() => {
      expect(fetchWithAuth).toHaveBeenCalledWith('/api/goals/xyz');
      expect(fetchWithAuth).toHaveBeenCalledWith('/api/goals/xyz/small_goals');
    });

    // 結合された state が UI に反映されているか
    expect(await screen.findByText('目標 : Combined Goal')).toBeInTheDocument();
    expect(screen.getByText('SG1')).toBeInTheDocument();
    expect(screen.getByText('foo')).toBeInTheDocument();
  });

	it('small_goals 異常フォーマット時に smallGoalsError がセットされ、small_goals は空配列になる', async () => {
		// ① goalId を含む router をセット
		useRouter.mockReturnValue({
			query: { goalId: 'xyz' },
			push: jest.fn(),
		});
	
		// ② モックデータ定義
		const mockGoal = {
			id: 42,
			title: 'Error Format Goal',
			content: 'dummy',
			deadline: '2025-08-01T00:00:00Z',
			completed: false,
		};
	
		// ③ fetchWithAuth の振る舞いを切り替え
		fetchWithAuth.mockImplementation((url) => {
			if (url === '/api/goals/xyz') {
				return Promise.resolve({
					ok: true,
					json: () => Promise.resolve(mockGoal),
				});
			}
			if (url === '/api/goals/xyz/small_goals') {
				// 配列ではなくオブジェクトを返して異常フォーマットをシミュレート
				return Promise.resolve({
					ok: true,
					json: () => Promise.resolve({ foo: 'bar' }),
				});
			}
			return Promise.reject(new Error(`unexpected request: ${url}`));
		});
	
		// ④ レンダリング開始
		render(<GoalPage />);
	
		// ⑤ 異常フォーマット検知後にエラーメッセージが出るまで待つ
		await waitFor(() => {
			expect(
				screen.getByText(/invalid data format for small goals\./i)
			).toBeInTheDocument();
		});
	
		// ⑥ small_goals は空配列扱いなので、h3(小目標タイトル) が存在しないことを確認
		expect(
			screen.queryByRole('heading', { level: 3 })
		).toBeNull();
	});

	it('response.ok === false のとき goal が null になり "Goal not found" が表示される', async () => {
		// goalId をセット
		useRouter.mockReturnValue({ query: { goalId: 'err1' }, push: jest.fn() });
		// 1 回目の fetchWithAuth（goalDetails）が ok:false
		fetchWithAuth.mockResolvedValueOnce({ ok: false, status: 500 });
	
		render(<GoalPage />);
	
		// loading が消えるまで待機
		await waitFor(() =>
			expect(screen.queryByText(/loading/i)).not.toBeInTheDocument()
		);
	
		// フォールバックとして "Goal not found" が表示される
		expect(screen.getByText(/goal not found/i)).toBeInTheDocument();
	});
	
	it('fetchWithAuth が reject したとき goal が null になり "Goal not found" が表示される', async () => {
		// goalId をセット
		useRouter.mockReturnValue({ query: { goalId: 'err2' }, push: jest.fn() });
		// fetchWithAuth がネットワークエラーで reject
		fetchWithAuth.mockRejectedValueOnce(new Error('Network error'));
	
		render(<GoalPage />);
	
		// loading が消えるまで待機
		await waitFor(() =>
			expect(screen.queryByText(/loading/i)).not.toBeInTheDocument()
		);
	
		// フォールバックとして "Goal not found" が表示される
		expect(screen.getByText(/goal not found/i)).toBeInTheDocument();
	});
});

////////////////////////////////////////////////////////////////////////////////

