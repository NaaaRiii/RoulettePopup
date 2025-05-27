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

describe('副作用フック（useEffect & useCallback）', () => {
  beforeEach(() => {
    // ここで常に「ログイン済み」を返す
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
});

////////////////////////////////////////////////////////////////////////////////

