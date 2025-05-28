import React from 'react';
import { render, screen, waitFor, fireEvent, waitForElementToBeRemoved } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GoalPage from '../pages/goals/[goalId]';
import CreateSmallGoal from '../components/CreateSmallGoal';
import EditGoalModal from '../components/EditGoal';
import EditSmallGoalModal from '../components/EditSmallGoal';
import { useRouter } from 'next/router';
import { useGoals } from '../contexts/GoalsContext';
import { fetchWithAuth } from '../utils/fetchWithAuth';
import { Authenticator, useAuthenticator } from '@aws-amplify/ui-react';
import { within } from '@testing-library/react';
import '@testing-library/jest-dom';


jest.mock('../components/Layout', () => {
  const MockLayout = ({ children }) => <>{children}</>;
  MockLayout.displayName = 'Layout';
  return MockLayout;
});
jest.mock('../components/Calendar', () => {
  const MockCalendar = () => <div data-testid="calendar" />;
  MockCalendar.displayName = 'Calendar';
  return MockCalendar;
});

jest.mock('../components/CreateSmallGoal', () => {
  const fn = jest.fn(props => null);
  return { __esModule: true, default: fn };
});

jest.mock('../components/EditGoal', () => {
  const fn = jest.fn(props => null);
  return { __esModule: true, default: fn };
});

jest.mock('../components/EditSmallGoal', () => {
  const fn = jest.fn(props => null);
  return { __esModule: true, default: fn };
});

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

describe('UI インタラクション', () => {
	const goalDetails = {
    id: 1,
    title: 'Toggle Goal',
    content: 'dummy',
    deadline: null,
    completed: false,
  };
  const smallGoals = [
    {
      id: 10,
      title: 'SG',
      difficulty: 'easy',
      deadline: null,
      completed: false,
      tasks: [{ id: 100, content: 'task-1', completed: false }],
    },
  ];

	const smallGoalsAllDone = [
    {
      id: 10,
      title: 'SG',
      difficulty: 'easy',
      deadline: null,
      completed: false,
      tasks: [
        { id: 100, content: 't1', completed: true },
        { id: 101, content: 't2', completed: true },
      ],
    },
  ];

  beforeEach(() => {
		jest.resetAllMocks();

    useAuthenticator.mockReturnValue({ route: 'authenticated', user: {} });
    useRouter.mockReturnValue({ query: { goalId: 'xyz' }, push: jest.fn() });
    useGoals.mockReturnValue({
      goalsState: [],
      setGoalsState: jest.fn(),
      refreshGoals: jest.fn(),
    });
    
		fetchWithAuth.mockImplementation((url) => {
			if (url === '/api/goals/xyz') {
				return Promise.resolve({
					ok: true,
					json: () => Promise.resolve(goalDetails),
				});
			}
			if (url === '/api/goals/xyz/small_goals') {
				return Promise.resolve({
					ok: true,
					json: () => Promise.resolve(smallGoals),
				});
			}
			if (url.startsWith('/api/tasks/') && url.endsWith('/complete')) {
				return Promise.resolve({ ok: true });
			}
			// 他のフェッチ（/api/current_user など）は空レスポンスで無視
			return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
		});

  });

	afterEach(() => {
		jest.clearAllMocks();
	});

  it('タスクチェックボックスを change すると fetchWithAuth が呼ばれ、チェックが反転する', async () => {
    render(<GoalPage />);

    // 1) Loading… が消えるまで待つ
    await waitForElementToBeRemoved(() => screen.queryByText(/loading/i));

		console.log('🔍 fetchWithAuth.calls:',
			fetchWithAuth.mock.calls);
		screen.debug(); 

		const allCheckboxes = screen.getAllByRole('checkbox');
		console.log('🔍 checkbox count:', allCheckboxes.length);
		screen.debug();

    expect(screen.getByText('task-1')).toBeInTheDocument();

		const checkbox = await screen.findByRole('checkbox', { name: /task-1/ });
		expect(checkbox).not.toBeChecked();

    await userEvent.click(checkbox);

    await waitFor(() => {
      expect(fetchWithAuth).toHaveBeenCalledWith(
        '/api/tasks/100/complete',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ completed: true }),
        })
      );
    });

		await waitFor(() => {
			expect(
				screen.getByRole('checkbox', { name: /task-1/ })
			).toBeChecked();
		});
  });


  it('全タスク完了時のみ「完了」ボタンが活性化し、クリックで /small_goals/:id/complete に POST する', async () => {
    // ① fetchWithAuth を URL 別にスタブ
    fetchWithAuth.mockImplementation((url, options) => {
      if (url === '/api/goals/xyz') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(goalDetails),
        });
      }
      if (url === '/api/goals/xyz/small_goals') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(smallGoalsAllDone),
        });
      }
      if (url === '/api/goals/xyz/small_goals/10/complete') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ message: '小目標を完了しました' }),
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });

    render(<GoalPage />);

    // ② 初回ロードが終わるまで待機
    await waitForElementToBeRemoved(() => screen.queryByText(/loading/i));

    // ③ 「完了」ボタンが存在して活性化されている
    const completeBtn = screen.getByRole('button', { name: '完了' });
    expect(completeBtn).toBeEnabled();

    // ④ クリックして API 呼び出しを検証
    await userEvent.click(completeBtn);
    await waitFor(() => {
      expect(fetchWithAuth).toHaveBeenCalledWith(
        '/api/goals/xyz/small_goals/10/complete',
        { method: 'POST' }
      );
    });
  });

	it('未完了 small goal があるとき Completed Goal ボタンは disabled', async () => {
		// smallGoals のうち 1 件は未完了
		const smallGoalsSomeIncomplete = [
			{ id: 10, title: 'SG1', difficulty: 'easy', deadline: null, completed: false, tasks: [] },
			{ id: 11, title: 'SG2', difficulty: 'easy', deadline: null, completed: true,  tasks: [] },
		];
	
		fetchWithAuth.mockImplementation((url, options) => {
			if (url === '/api/goals/xyz') {
				return Promise.resolve({ ok: true, json: () => Promise.resolve(goalDetails) });
			}
			if (url === '/api/goals/xyz/small_goals') {
				return Promise.resolve({ ok: true, json: () => Promise.resolve(smallGoalsSomeIncomplete) });
			}
			// Completed Goal 用エンドポイントは呼ばれないはずなのでダミー返却
			if (url === '/api/goals/xyz/complete') {
				return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
			}
			return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
		});
	
		render(<GoalPage />);
		await waitForElementToBeRemoved(() => screen.queryByText(/loading/i));
	
		const completeButton = screen.getByRole('button', { name: 'Completed Goal' });
		expect(completeButton).toBeDisabled();
	});
	
	it('すべて完了した small goal のとき Completed Goal ボタンは有効でクリック時に /api/goals/xyz/complete に POST', async () => {
		// smallGoals はすべて completed: true
		const smallGoalsAllDone = [
			{ id: 20, title: 'SG1', difficulty: 'easy', deadline: null, completed: true, tasks: [] },
		];
	
		fetchWithAuth.mockImplementation((url, options) => {
			if (url === '/api/goals/xyz') {
				return Promise.resolve({ ok: true, json: () => Promise.resolve(goalDetails) });
			}
			if (url === '/api/goals/xyz/small_goals') {
				return Promise.resolve({ ok: true, json: () => Promise.resolve(smallGoalsAllDone) });
			}
			if (url === '/api/goals/xyz/complete') {
				return Promise.resolve({ ok: true, json: () => Promise.resolve({ message: 'Goal 完了' }) });
			}
			return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
		});
	
		render(<GoalPage />);
		await waitForElementToBeRemoved(() => screen.queryByText(/loading/i));
	
		const completeButton = screen.getByRole('button', { name: 'Completed Goal' });
		expect(completeButton).toBeEnabled();
	
		await userEvent.click(completeButton);
		await waitFor(() => {
			expect(fetchWithAuth).toHaveBeenCalledWith(
				'/api/goals/xyz/complete',
				{ method: 'POST' }
			);
		});
	});
	
	it('Goal 削除: window.confirm=true のとき DELETE → refreshGoals と router.push("/dashboard")', async () => {
		// モックデータ
		const goalDetails = { id: 1, title: 'Del Goal', content: 'dummy', deadline: null, completed: false };
		const smallGoals = [];
	
		// confirm ダイアログは常に OK
		window.confirm = jest.fn(() => true);
	
		// fetchWithAuth の動作を URL ごとに定義
		fetchWithAuth.mockImplementation((url, options) => {
			if (url === '/api/goals/xyz') {
				return Promise.resolve({ ok: true, json: () => Promise.resolve(goalDetails) });
			}
			if (url === '/api/goals/xyz/small_goals') {
				return Promise.resolve({ ok: true, json: () => Promise.resolve(smallGoals) });
			}
			if (url === '/api/goals/xyz' && options?.method === 'DELETE') {
				return Promise.resolve({ ok: true });
			}
			return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
		});
	
		// render
		render(<GoalPage />);
	
		// 初回ロード完了待ち
		await waitForElementToBeRemoved(() => screen.queryByText(/loading/i));
	
		// Delete Goal リンクをクリック
		await userEvent.click(screen.getByTestId('delete-goal-link'));
	
		// DELETE エンドポイントが呼ばれるまで待機
		await waitFor(() => {
			expect(fetchWithAuth).toHaveBeenCalledWith(
				'/api/goals/xyz',
				expect.objectContaining({ method: 'DELETE' })
			);
		});
	
		// refreshGoals が呼ばれたか
		expect(useGoals().refreshGoals).toHaveBeenCalled();
	
		// router.push('/dashboard') が呼ばれたか
		expect(useRouter().push).toHaveBeenCalledWith('/dashboard');
	});
	
	it('Small Goal 削除: confirm OK で該当 small goal が state から除去される', async () => {
		// モックデータ：2 つの small goal
		const smallGoals = [
			{
				id: 10,
				title: 'SG10',
				difficulty: 'easy',
				deadline: null,
				completed: false,
				tasks: [],
			},
			{
				id: 11,
				title: 'SG11',
				difficulty: 'easy',
				deadline: null,
				completed: false,
				tasks: [],
			},
		];
	
		// confirm は常に OK
		window.confirm = jest.fn(() => true);
		// alert は無視
		window.alert = jest.fn();
	
		// URL ごとに返却を分岐
		fetchWithAuth.mockImplementation((url, options) => {
			if (url === '/api/goals/xyz') {
				return Promise.resolve({ ok: true, json: () => Promise.resolve(goalDetails) });
			}
			if (url === '/api/goals/xyz/small_goals') {
				return Promise.resolve({ ok: true, json: () => Promise.resolve(smallGoals) });
			}
			if (url === '/api/goals/xyz/small_goals/10') {
				return Promise.resolve({ ok: true });
			}
			return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
		});
	
		render(<GoalPage />);
	
		// 初期ロード完了
		await waitForElementToBeRemoved(() => screen.queryByText(/loading/i));
	
		// まず両方のタイトルが見えている
		expect(screen.getByText('SG10')).toBeInTheDocument();
		expect(screen.getByText('SG11')).toBeInTheDocument();
	
		// 小目標 10 の削除リンクをクリック
		await userEvent.click(screen.getByTestId('delete-small-goal-10'));
	
		// DELETE API 呼び出しを待機
		await waitFor(() => {
			expect(fetchWithAuth).toHaveBeenCalledWith(
				'/api/goals/xyz/small_goals/10',
				expect.objectContaining({ method: 'DELETE' })
			);
		});
	
		// State 更新後、SG10 が消え、SG11 は残る
		await waitFor(() => {
			expect(screen.queryByText('SG10')).not.toBeInTheDocument();
			expect(screen.getByText('SG11')).toBeInTheDocument();
		});
	});
	
	it('Small Goal モーダルの open/close', async () => {
    render(<GoalPage />);
    await waitForElementToBeRemoved(() => screen.queryByText(/loading/i));

    // 初回は isOpen=false
    expect(CreateSmallGoal).toHaveBeenCalledWith(
      expect.objectContaining({ isOpen: false }),
      expect.anything()
    );

    // ボタンをクリックして open
    await userEvent.click(screen.getByText('Small Goalの作成'));
    expect(
      CreateSmallGoal.mock.calls.some(call => call[0].isOpen === true)
    ).toBe(true);

    // onClose() を呼ぶ（act不要）
    const { onClose } = CreateSmallGoal.mock.calls.slice(-1)[0][0];
    onClose();
    // 閉じた呼び出しが入るまで待つ
    await waitFor(() =>
      expect(
        CreateSmallGoal.mock.calls.some(
          (call, i) => call[0].isOpen === false && i > 0
        )
      ).toBe(true)
    );
  });

  it('Goal 編集モーダルの open/close', async () => {
    render(<GoalPage />);
    await waitForElementToBeRemoved(() => screen.queryByText(/loading/i));

    expect(EditGoalModal).toHaveBeenCalledWith(
      expect.objectContaining({ isOpen: false }),
      expect.anything()
    );

    await userEvent.click(screen.getByText('目標を編集する'));
    expect(
      EditGoalModal.mock.calls.some(call => call[0].isOpen === true)
    ).toBe(true);

    const { onClose } = EditGoalModal.mock.calls.slice(-1)[0][0];
    onClose();
    await waitFor(() =>
      expect(
        EditGoalModal.mock.calls.some(
          (call, i) => call[0].isOpen === false && i > 0
        )
      ).toBe(true)
    );
  });

  it('Small Goal 編集モーダルの open/close', async () => {
    render(<GoalPage />);
    await waitForElementToBeRemoved(() => screen.queryByText(/loading/i));

    expect(EditSmallGoalModal).toHaveBeenCalledWith(
      expect.objectContaining({ isOpen: false }),
      expect.anything()
    );

    // 各 smallGoal の Edit リンクを取得してクリック
    const edits = screen.getAllByText('Edit');
    await userEvent.click(edits[0]);

    expect(
      EditSmallGoalModal.mock.calls.some(call => call[0].isOpen === true)
    ).toBe(true);

    const { onClose } = EditSmallGoalModal.mock.calls.slice(-1)[0][0];
    onClose();
    await waitFor(() =>
      expect(
        EditSmallGoalModal.mock.calls.some(
          (call, i) => call[0].isOpen === false && i > 0
        )
      ).toBe(true)
    );
  });

	it('Small Goal 編集モーダル: small goal オブジェクトが渡されると選択済みでモーダルが開く', async () => {
		// モックデータ：1件の small goal
		const smallGoals = [
			{
				id: 99,
				title: 'SG99',
				difficulty: 'medium',
				deadline: null,
				completed: false,
				tasks: [],
			},
		];
	
		// fetchWithAuth のモック実装
		fetchWithAuth.mockImplementation((url) => {
			if (url === '/api/goals/xyz') {
				return Promise.resolve({ ok: true, json: () => Promise.resolve(goalDetails) });
			}
			if (url === '/api/goals/xyz/small_goals') {
				return Promise.resolve({ ok: true, json: () => Promise.resolve(smallGoals) });
			}
			return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
		});
	
		render(<GoalPage />);
		await waitForElementToBeRemoved(() => screen.queryByText(/loading/i));
	
		// small goal の Edit リンクをクリック
		const editLink = screen.getByText('Edit');
		await userEvent.click(editLink);
	
		// EditSmallGoalModal が呼ばれた最新の呼び出しを取得
		const lastCall = EditSmallGoalModal.mock.calls.slice(-1)[0][0];
	
		// isOpen が true
		expect(lastCall.isOpen).toBe(true);
	
		// smallGoal prop に正しいオブジェクトが渡されている
		expect(lastCall.smallGoal).toEqual(smallGoals[0]);
	});
	
});

////////////////////////////////////////////////////////////////////////////////

describe('条件付きレンダリング', () => {
  beforeEach(() => {
    jest.resetAllMocks();

    // 常に認証済み
    useAuthenticator.mockReturnValue({ route: 'authenticated', user: {} });

    // router に goalId をセット
    useRouter.mockReturnValue({ query: { goalId: 'xyz' }, push: jest.fn() });

    // GoalsContext のダミー
    useGoals.mockReturnValue({
      goalsState: [],
      setGoalsState: jest.fn(),
      refreshGoals: jest.fn(),
    });
  });

  it('完了済み Goal では「このGoalは達成しました!」が表示され、編集リンク／完了ボタンが非表示', async () => {
    const completedGoal = {
      id: 1,
      title: 'Done Goal',
      content: 'dummy',
      deadline: null,
      completed: true,  // ← 完了済み
    };

    fetchWithAuth.mockImplementation((url) => {
      if (url === '/api/goals/xyz') {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(completedGoal) });
      }
      if (url === '/api/goals/xyz/small_goals') {
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });

    render(<GoalPage />);

    // ローディング完了待ち
    await waitForElementToBeRemoved(() => screen.queryByText(/loading/i));

    // 完了メッセージ表示
    expect(screen.getByText('このGoalは達成しました!')).toBeInTheDocument();

    // 「目標を編集する」は消えている
    expect(screen.queryByText('目標を編集する')).toBeNull();

    // Completed Goal ボタンも消えている
    expect(screen.queryByRole('button', { name: /Completed Goal/ })).toBeNull();
  });

	it('完了／未完了 small goal の列挙: completed フラグで振り分けられる', async () => {
		// ← まず goalDetails を定義
		const goalDetails = {
			id: 123,
			title: 'List Test Goal',
			content: 'dummy',
			deadline: null,
			completed: false,
		};
	
		// ここで mixedSmallGoals を定義
		const mixedSmallGoals = [
			{ id: 1, title: 'SG Incomplete', difficulty: 'easy', deadline: null, completed: false, tasks: [] },
			{ id: 2, title: 'SG Complete',   difficulty: 'easy', deadline: null, completed: true,  tasks: [] },
		];
	
		// fetchWithAuth を URL ごとに返却を切り替え
		fetchWithAuth.mockImplementation((url) => {
			if (url === '/api/goals/xyz') {
				return Promise.resolve({
					ok: true,
					json: () => Promise.resolve(goalDetails),
				});
			}
			if (url === '/api/goals/xyz/small_goals') {
				return Promise.resolve({
					ok: true,
					json: () => Promise.resolve(mixedSmallGoals),
				});
			}
			return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
		});
	
		render(<GoalPage />);
		await waitForElementToBeRemoved(() => screen.queryByText(/loading/i));
	
		// SG Incomplete が描画され、トップ要素に completed クラスがついていないことを検証
		const inc = screen.getByText(/SG Incomplete/);
		expect(inc.closest('.goalid-small-goal__top--completed')).toBeNull();
	
		// SG Complete が描画され、トップ要素に completed クラスがついていることを検証
		const comp = screen.getByText(/SG Complete/);
		expect(comp.closest('.goalid-small-goal__top--completed')).not.toBeNull();
	});
	
});

///////////////////////////////////////////////////////////////////////////////

