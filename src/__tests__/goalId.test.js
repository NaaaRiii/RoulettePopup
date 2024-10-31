import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GoalPage from '../pages/goals/[goalId]';
import { useRouter } from 'next/router';
import { useGoals } from '../contexts/GoalsContext';
import { useAuth } from '../contexts/AuthContext';
import '@testing-library/jest-dom';

beforeAll(() => {
  global.localStorage = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn()
  };
});

global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// withAuth モックの修正
jest.mock('../utils/withAuth', () => {
  const React = require('react');
  const { useAuth } = require('../contexts/AuthContext');
  const { useRouter } = jest.requireActual('next/router');

  return {
    __esModule: true,
    default: (Component) => {
      const MockedWithAuth = (props) => {
        const { isLoggedIn } = useAuth();
        const router = useRouter();

        React.useEffect(() => {
          if (!isLoggedIn) {
            router.push('/login');
          }
        }, [isLoggedIn, router]);

        return isLoggedIn ? <Component {...props} /> : null;
      };
      MockedWithAuth.displayName = `withAuth(${Component.displayName || Component.name || 'Component'})`;
      return MockedWithAuth;
    },
  };
});

jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

jest.mock('../contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('next/link', () => {
  const ActualLink = jest.requireActual('next/link');
  return ActualLink;
});

jest.mock('../contexts/GoalsContext', () => ({
  useGoals: jest.fn(),
}));

describe('GoalPage Component', () => {

  const mockGoalData = [
    {
      id: 1,
      title: 'Sample Goal 1',
      content: 'This is the first sample goal content.',
      deadline: '2024-12-31',
      completed: false,
      small_goals: [
        {
          id: 101,
          title: 'Sample Small Goal 1',
          completed: true,
          deadline: '2024-11-30',
          difficulty: '簡単',
          tasks: [
            { id: 1001, content: 'Task 1', completed: true },
            { id: 1002, content: 'Task 2', completed: true },
          ],
        },
        {
          id: 102,
          title: 'Sample Small Goal 2',
          completed: true,
          deadline: '2024-10-31',
          difficulty: 'ものすごく簡単',
          tasks: [
            { id: 1003, content: 'Task 3', completed: true },
          ],
        },
      ],
    },
    {
      id: 2,
      title: 'Sample Goal 2',
      content: 'This is the second sample goal content.',
      deadline: '2024-11-30',
      completed: false,
      small_goals: [
        {
          id: 201,
          title: 'Sample Small Goal 3',
          completed: false,
          deadline: '2024-10-15',
          difficulty: '難しい',
          tasks: [
            { id: 2001, content: 'Task 4', completed: false },
            { id: 2002, content: 'Task 5', completed: false },
          ],
        },
        {
          id: 202,
          title: 'Sample Small Goal 4',
          completed: true,
          deadline: '2024-09-30',
          difficulty: '簡単',
          tasks: [
            { id: 2003, content: 'Task 6', completed: true },
          ],
        },
      ],
    },
		{
			id: 3,
			title: 'Sample Goal 3',
			content: 'This is the third sample goal content.',
			deadline: '2024-10-31',
			completed: false,
			small_goals: [
				{
					id: 301,
					title: 'Sample Small Goal 5',
					completed: false,
					deadline: '2024-10-15',
					difficulty: '難しい',
					tasks: [
						{ id: 3001, content: 'Task 7', completed: false },
						{ id: 3002, content: 'Task 8', completed: false },
					],
				},
				{
					id: 302,
					title: 'Sample Small Goal 6',
					completed: false,
					deadline: '2024-09-30',
					difficulty: '簡単',
					tasks: [
						{ id: 3003, content: 'Task 9', completed: false },
					],
				},
			],
		}
  ];

  const mockUserData = {
    id: 7,
    name: 'Sample User',
    email: 'sample@example.com',
    totalExp: 140,
    rank: 20,
    last_roulette_rank: 10,
    goals: mockGoalData,
  };

  let mockPush;
  let goalId;

  beforeEach(() => {
    mockPush = jest.fn();

    goalId = '1';

    useRouter.mockReturnValue({
      query: { goalId, message: '' },
      push: mockPush,
    });

		useAuth.mockReturnValue({
			isLoggedIn: true,
			userRank: 20,
			setUserRank: jest.fn(),
			setIsLoggedIn: jest.fn(),
		});

    useGoals.mockReturnValue({
      goalsState: [],
      setGoalsState: jest.fn(),
      refreshGoals: jest.fn(),
    });

    global.fetch = jest.fn((url, options) => {
      //console.log('Mock fetch called with URL:', url);
      //console.log('Fetch options:', options);
  
      const match = url.match(/http:\/\/localhost:3000\/api\/goals\/(\d+)\/small_goals\/(\d+)/);
    const matchDeleteGoal = url.match(/http:\/\/localhost:3000\/api\/goals\/(\d+)$/);
    const goalIdFromUrl = match ? match[1] : (matchDeleteGoal ? matchDeleteGoal[1] : '1');
    const smallGoalIdFromUrl = match ? match[2] : '301';

    // DELETEリクエストの処理（Goalの削除）
    if (options && options.method === 'DELETE' && goalIdFromUrl === '3') {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ message: 'Goal deleted successfully.' }),
      });
    }

    // GETリクエストの処理
    const matchGet = url.match(/http:\/\/localhost:3000\/api\/goals\/(\d+)/);
    const goalIdGet = matchGet ? matchGet[1] : '1';

    if (url === `http://localhost:3000/api/goals/${goalIdGet}`) {
      const goal = mockGoalData.find(g => g.id === parseInt(goalIdGet));
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(goal),
      });
    } else if (url === `http://localhost:3000/api/goals/${goalIdGet}/small_goals`) {
      const goal = mockGoalData.find(g => g.id === parseInt(goalIdGet));
      const smallGoals = goal ? goal.small_goals : [];
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(smallGoals),
      });
    } else if (url === 'http://localhost:3000/api/current_user') {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockUserData),
      });
    } else {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      });
    }
  });

		// console.log の出力を抑制
		//jest.spyOn(console, 'log').mockImplementation(() => {});

		// window.alertをモック
		jest.spyOn(window, 'alert').mockImplementation(() => {});
	});

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it('renders the GoalPage component correctly with all elements for goalId:1', async () => {
    render(<GoalPage />); // デフォルトのgoalId:1

    // ローディングメッセージが表示されていることを確認
    expect(screen.getByText('Loading...')).toBeInTheDocument();

    // データがロードされるまで待機
    await waitFor(() => expect(screen.queryByText('Loading...')).not.toBeInTheDocument());

    // Layout コンポーネントがレンダリングされていることを確認
    expect(screen.getByTestId('layout')).toBeInTheDocument();

    // 目標のタイトルが表示されていることを確認
    expect(screen.getByText(`目標 : ${mockGoalData[0].title}`)).toBeInTheDocument();

    // 目標の内容が表示されていることを確認
    expect(screen.getByText(`内容 : ${mockGoalData[0].content}`)).toBeInTheDocument();

    // 期限が正しくフォーマットされて表示されていることを確認
    expect(screen.getByText(`期限: ${mockGoalData[0].deadline}`)).toBeInTheDocument();

    // Completed Goal ボタンが表示されていることを確認（全Small Goalsが完了しているため有効であることを確認）
    const completeGoalButton = screen.getByText('Completed Goal');
    expect(completeGoalButton).toBeInTheDocument();
    expect(completeGoalButton).toBeEnabled();

    // Small Goal の作成ボタンが表示されていることを確認
    expect(screen.getByText('Small Goalの作成')).toBeInTheDocument();

    // Delete Goal リンクが表示されていることを確認
    expect(screen.getByText('Delete Goal')).toBeInTheDocument();

    // Calendar コンポーネントがレンダリングされていることを確認
    expect(screen.getByTestId('calendar')).toBeInTheDocument();

    // Small Goals が正しく表示されていることを確認
    mockGoalData[0].small_goals.forEach(smallGoal => {
      // Small Goalのタイトル
      expect(screen.getByText(smallGoal.title)).toBeInTheDocument();
      // Small Goalの期限
      expect(screen.getByText(`Deadline: ${smallGoal.deadline}`)).toBeInTheDocument();
      // Small Goalの難易度
      expect(screen.getByText(`Difficulty: ${smallGoal.difficulty}`)).toBeInTheDocument();

      // タスクが正しく表示されていることを確認
      smallGoal.tasks.forEach(task => {
        // 正規表現を使用して部分一致
        expect(screen.getByText(new RegExp(task.content))).toBeInTheDocument();
      });
    });
  });

  it('renders the GoalPage component correctly with all elements for goalId:2 and "Completed Goal" button is disabled', async () => {
    goalId = '2';

    useRouter.mockReturnValue({
      query: { goalId, message: '' },
      push: mockPush,
    });

    render(<GoalPage />); // goalId:2 をレンダリング

    // ローディングメッセージが表示されていることを確認
    expect(screen.getByText('Loading...')).toBeInTheDocument();

    // データがロードされるまで待機
    await waitFor(() => expect(screen.queryByText('Loading...')).not.toBeInTheDocument());

    // Layout コンポーネントがレンダリングされていることを確認
    expect(screen.getByTestId('layout')).toBeInTheDocument();

    // 目標のタイトルが表示されていることを確認
    expect(screen.getByText(`目標 : ${mockGoalData[1].title}`)).toBeInTheDocument();

    // 目標の内容が表示されていることを確認
    expect(screen.getByText(`内容 : ${mockGoalData[1].content}`)).toBeInTheDocument();

    // 期限が正しくフォーマットされて表示されていることを確認
    expect(screen.getByText(`期限: ${mockGoalData[1].deadline}`)).toBeInTheDocument();

    // Completed Goal ボタンが表示されていることを確認（未完了のSmall Goalがあるためdisabledであることを確認）
    const completeGoalButton = screen.getByText('Completed Goal');
    expect(completeGoalButton).toBeInTheDocument();
    expect(completeGoalButton).toBeDisabled();

    // Small Goal の作成ボタンが表示されていることを確認
    expect(screen.getByText('Small Goalの作成')).toBeInTheDocument();

    // Delete Goal リンクが表示されていることを確認
    expect(screen.getByText('Delete Goal')).toBeInTheDocument();

    // Calendar コンポーネントがレンダリングされていることを確認
    expect(screen.getByTestId('calendar')).toBeInTheDocument();

    // Small Goals が正しく表示されていることを確認
    mockGoalData[1].small_goals.forEach(smallGoal => {
      // Small Goalのタイトル
      expect(screen.getByText(smallGoal.title)).toBeInTheDocument();
      // Small Goalの期限
      expect(screen.getByText(`Deadline: ${smallGoal.deadline}`)).toBeInTheDocument();
      // Small Goalの難易度
      expect(screen.getByText(`Difficulty: ${smallGoal.difficulty}`)).toBeInTheDocument();

      // タスクが正しく表示されていることを確認
      smallGoal.tasks.forEach(task => {
        // 正規表現を使用して部分一致
        expect(screen.getByText(new RegExp(task.content))).toBeInTheDocument();
      });
    });
  });

  it('displays "Goal not found" when the goal data does not exist', async () => {
    goalId = '999'; // 存在しない goalId に設定

    useRouter.mockReturnValue({
      query: { goalId, message: '' },
      push: mockPush,
    });

    // fetch のモックを調整して、該当の goalId に対して null を返す
    global.fetch = jest.fn((url, options) => {
      //console.log('Mock fetch called with URL:', url);
      //console.log('Fetch options:', options);

      // URLからgoalIdを抽出
      const match = url.match(/\/goals\/(\d+)/);
      const goalIdFromUrl = match ? match[1] : '1'; // デフォルトで'1'を使用

      if (url === `http://localhost:3000/api/goals/${goalIdFromUrl}`) {
        //console.log(`Mock fetch matched /api/goals/${goalIdFromUrl}`);
        // goalId が存在しないので null を返す
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(null),
        });
      } else if (url === `http://localhost:3000/api/goals/${goalIdFromUrl}/small_goals`) {
        //console.log(`Mock fetch matched /api/goals/${goalIdFromUrl}/small_goals`);
        // small_goals も空配列を返す
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
        });
      } else if (url === 'http://localhost:3000/api/current_user') {
        //console.log('Mock fetch matched /api/current_user');
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockUserData),
        });
      } else {
        //console.log('Mock fetch did not match any condition for URL:', url);
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}),
        });
      }
    });

    render(<GoalPage />);

    // ローディングメッセージが表示されていることを確認
    expect(screen.getByText('Loading...')).toBeInTheDocument();

    // データがロードされるまで待機
    await waitFor(() => expect(screen.queryByText('Loading...')).not.toBeInTheDocument());

    // "Goal not found" が表示されていることを確認
    expect(screen.getByText('Goal not found')).toBeInTheDocument();

    // 他の要素が表示されていないことを確認（任意）
    expect(screen.queryByTestId('layout')).not.toBeInTheDocument();
    expect(screen.queryByText('Completed Goal')).not.toBeInTheDocument();
  });

  it('fetches correct data from the API and displays the goal and small goals correctly', async () => {
    goalId = '1'; // テスト対象のgoalIdを設定

    useRouter.mockReturnValue({
      query: { goalId, message: '' },
      push: mockPush,
    });

    render(<GoalPage />);

    // ローディングメッセージが表示されていることを確認
    expect(screen.getByText('Loading...')).toBeInTheDocument();

    // データがロードされるまで待機
    await waitFor(() => expect(screen.queryByText('Loading...')).not.toBeInTheDocument());

    // 目標のタイトルが正しく表示されていることを確認
    expect(screen.getByText(`目標 : ${mockGoalData[0].title}`)).toBeInTheDocument();

    // 目標の内容が正しく表示されていることを確認
    expect(screen.getByText(`内容 : ${mockGoalData[0].content}`)).toBeInTheDocument();

    // 目標の期限が正しく表示されていることを確認
    expect(screen.getByText(`期限: ${mockGoalData[0].deadline}`)).toBeInTheDocument();

    // Small Goals が正しく表示されていることを確認
    mockGoalData[0].small_goals.forEach(smallGoal => {
      // Small Goalのタイトル
      expect(screen.getByText(smallGoal.title)).toBeInTheDocument();
      // Small Goalの期限
      expect(screen.getByText(`Deadline: ${smallGoal.deadline}`)).toBeInTheDocument();
      // Small Goalの難易度
      expect(screen.getByText(`Difficulty: ${smallGoal.difficulty}`)).toBeInTheDocument();

      // タスクが正しく表示されていることを確認
      smallGoal.tasks.forEach(task => {
        // 正規表現を使用して部分一致
        expect(screen.getByText(new RegExp(task.content))).toBeInTheDocument();
        // またはカスタムマッチャーを使用
        // expect(screen.getByText((content, element) => content.includes(task.content))).toBeInTheDocument();
      });
    });
  });

  it('handles API fetch failure correctly by logging error and displaying an error message', async () => {
    // 1. `goalId` を設定（任意）
    goalId = '1'; // テスト対象のgoalIdを設定

    useRouter.mockReturnValue({
      query: { goalId, message: '' },
      push: mockPush,
    });

    // 2. `console.error` をスパイしてモックする
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    // 3. `fetch` をエラーを投げるようにモックする
    global.fetch.mockImplementationOnce(() => Promise.reject(new Error('API fetch failed')));

    // 4. コンポーネントをレンダリングする
    render(<GoalPage />);

    // 5. ローディングメッセージが表示されていることを確認
    expect(screen.getByText('Loading...')).toBeInTheDocument();

    // 6. エラーメッセージが表示されるまで待機
    await waitFor(() => expect(screen.queryByText('Loading...')).not.toBeInTheDocument());

    // 7. "Goal not found" が表示されていることを確認
    expect(screen.getByText('Goal not found')).toBeInTheDocument();

    // 8. `console.error` が呼ばれたことを確認
    expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to fetch goal data', expect.any(Error));

    // 9. モックをクリーンアップ
    consoleErrorSpy.mockRestore();
  });

	it('handles non-array API response correctly by logging error and displaying an error message', async () => {
		// 1. goalId を設定
		goalId = '1'; // テスト対象のgoalIdを設定
	
		useRouter.mockReturnValue({
			query: { goalId, message: '' },
			push: mockPush,
		});
	
		// 2. `global.fetch` をリセット
		global.fetch.mockReset();
	
		// 3. `fetch` のモックを設定
		global.fetch
			.mockImplementation((url, options) => {
				//console.log('Mock fetch called with URL:', url);
	
				if (url.includes(`/api/goals/${goalId}`) && !url.includes('/small_goals')) {
					const goal = mockGoalData.find(g => g.id === parseInt(goalId));
					return Promise.resolve({
						ok: true,
						json: () => Promise.resolve(goal),
					});
				} else if (url.includes(`/api/goals/${goalId}/small_goals`)) {
					return Promise.resolve({
						ok: true,
						json: () => Promise.resolve({ error: 'Invalid data format' }), // 非配列データ
					});
				} else if (url.includes('/api/current_user')) {
					return Promise.resolve({
						ok: true,
						json: () => Promise.resolve(mockUserData),
					});
				} else {
					return Promise.resolve({
						ok: true,
						json: () => Promise.resolve({}),
					});
				}
			});
	
		// 4. `console.error` をスパイしてモックする
		const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
	
		// 5. コンポーネントをレンダリングする
		render(<GoalPage />);
	
		// 6. ローディングメッセージが表示されていることを確認
		expect(screen.getByText('Loading...')).toBeInTheDocument();
	
		// 7. エラーメッセージが表示されるまで待機
		await waitFor(() => expect(screen.queryByText('Loading...')).not.toBeInTheDocument());
	
		// 8. "Invalid data format for small goals." が表示されていることを確認
		expect(screen.getByText('Invalid data format for small goals.')).toBeInTheDocument();
	
		// 9. `console.error` が呼ばれたことを確認
		expect(consoleErrorSpy).toHaveBeenCalledWith('Invalid data format for small_goals:', { error: 'Invalid data format' });
	
		// 10. モックをクリーンアップ
		consoleErrorSpy.mockRestore();
	});

	it('opens and closes the CreateSmallGoal modal, displaying form elements correctly', async () => {
    render(<GoalPage />);

    // ローディングメッセージの表示を確認
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByText('Loading...')).not.toBeInTheDocument());

    // 「Small Goalの作成」ボタンをクリック
    fireEvent.click(screen.getByText('Small Goalの作成'));

    // モーダル内の要素の確認
    expect(await screen.findByText('Small Goalを設定しよう!')).toBeInTheDocument();
    expect(screen.getByLabelText('Small Goalのタイトル')).toBeInTheDocument();
    expect(screen.getByLabelText('期限')).toBeInTheDocument();
    expect(screen.getByLabelText('難易度の設定')).toBeInTheDocument();

    // タスクフィールドが存在することを確認
    expect(screen.getByLabelText('Task')).toBeInTheDocument();

    // Close ボタンをクリック
    fireEvent.click(screen.getByText('Close'));

    // モーダルが閉じていることを確認
    await waitFor(() => {
      expect(screen.queryByText('Small Goalを設定しよう!')).not.toBeInTheDocument();
    });
	});
	
	it('deletes a Small Goal and removes it from the list', async () => {
		// goalIdを'3'に設定（Sample Small Goal 5が属するGoal）
		goalId = '3';
	
		// useRouterのモックを更新
		useRouter.mockReturnValue({
			query: { goalId, message: '' },
			push: mockPush,
		});
	
		render(<GoalPage />);
	
		// Small Goalが表示されるまで待機
		await waitFor(() => expect(screen.getByText('Sample Small Goal 5')).toBeInTheDocument());
	
		// 特定のSmall GoalのDeleteリンクを取得
		const deleteLink = screen.getByTestId('delete-small-goal-301'); // smallGoal.idが301の場合
		expect(deleteLink).toBeInTheDocument();
	
		// 確認ダイアログをモックしてOKを選択
		jest.spyOn(window, 'confirm').mockReturnValueOnce(true);
	
		// 「Delete」リンクをクリック
		fireEvent.click(deleteLink);
	
		// DELETEリクエストが正しく呼び出されたことを確認
		const deleteFetchCall = global.fetch.mock.calls.find(
			([url, options]) =>
				url === `http://localhost:3000/api/goals/${goalId}/small_goals/301` &&
				options.method === 'DELETE'
		);
		expect(deleteFetchCall).toBeDefined();
	
		// Small Goalが削除されたことを確認
		await waitFor(() => expect(screen.queryByText('Sample Small Goal 5')).not.toBeInTheDocument());
	
		// confirmモックの復元
		window.confirm.mockRestore();
	});
	
	it('successfully deletes a Goal and redirects to the dashboard', async () => {
		// 1. goalIdを'3'に設定（Sample Goal 3が属するGoal）
		goalId = '3';
	
		// 2. useRouterのモックを更新
		useRouter.mockReturnValue({
			query: { goalId, message: '' },
			push: mockPush,
		});
	
		// 3. コンポーネントをレンダリング
		render(<GoalPage />);
	
		// 4. Goalが表示されるまで待機（findByTextを使用）
		await screen.findByText(/Sample Goal 3/);
	
		// 5. 「Delete Goal」リンクを取得（data-testidを使用）
		const deleteGoalLink = screen.getByTestId('delete-goal-link');
		expect(deleteGoalLink).toBeInTheDocument();
	
		// 6. 確認ダイアログをモックしてOKを選択
		jest.spyOn(window, 'confirm').mockReturnValueOnce(true);
	
		// 7. `fetch` のモックをリセット
		global.fetch.mockClear();
	
		// 8. 「Delete Goal」リンクをクリック（userEventを使用）
		await userEvent.click(deleteGoalLink);
	
		// 9. `deleteGoal` 関数が呼び出されたことを確認（デバッグ用ログ）
		// コンソールに 'deleteGoal function called' が表示されるはずです
	
		// 10. `fetch` の呼び出しを確認
		await waitFor(() => {
			const deleteFetchCall = global.fetch.mock.calls.find(
				([url, options]) =>
					url === `http://localhost:3000/api/goals/${goalId}` &&
					options && options.method === 'DELETE'
			);
			//console.log('Fetch calls:', global.fetch.mock.calls);
			expect(deleteFetchCall).toBeDefined();
		});
	
		// 11. window.alertが呼ばれたことを確認
		expect(window.alert).toHaveBeenCalledWith('Goalが削除されました。');
	
		// 12. ダッシュボードにリダイレクトされたことを確認
		expect(mockPush).toHaveBeenCalledWith('/dashboard');
	
		// 13. confirmモックの復元
		window.confirm.mockRestore();
	});
	
	it('completes a Goal and updates the UI accordingly', async () => {
		// 1. goalIdを'1'に設定（未完了のSample Goal 1を使用）
		goalId = '1';
	
		// 2. useRouterのモックを更新
		useRouter.mockReturnValue({
			query: { goalId, message: '' },
			push: mockPush,
		});
	
		// 3. コンポーネントをレンダリング
		render(<GoalPage />);
	
		// 4. Goalが表示されるまで待機
		await screen.findByText(/Sample Goal 1/);
	
		// 5. 「Completed Goal」ボタンを取得
		const completeGoalButton = screen.getByRole('button', { name: 'Completed Goal' });
		expect(completeGoalButton).toBeInTheDocument();
		expect(completeGoalButton).toBeEnabled();
	
		// 6. fetchのモックをセットアップ（Goalの完了リクエストを成功させる）
		global.fetch.mockImplementationOnce((url, options) => {
			if (url === `http://localhost:3000/api/goals/${goalId}/complete` && options.method === 'POST') {
				return Promise.resolve({
					ok: true,
					json: () => Promise.resolve({ message: 'Goal completed successfully.' }),
				});
			}
			return Promise.reject('Unexpected fetch call');
		});
	
		// 7. 「Completed Goal」ボタンをクリック
		userEvent.click(completeGoalButton);
	
		// 8. fetchが正しく呼び出されたことを確認
		await waitFor(() => {
			const completeFetchCall = global.fetch.mock.calls.find(
				([url, options]) =>
					url === `http://localhost:3000/api/goals/${goalId}/complete` &&
					options && options.method === 'POST'
			);
			expect(completeFetchCall).toBeDefined();
		});
	
		// 9. 適切なメッセージが表示されることを確認
		await waitFor(() => {
			expect(mockPush).toHaveBeenCalledWith({
				pathname: '/dashboard',
				query: { message: encodeURIComponent('Goal completed successfully.') }
			});
		});
	});
	
	it('completes a Small Goal and updates the UI accordingly', async () => {
		// 1. goalIdを'2'に設定（Sample Goal 2を使用）
		goalId = '2';
	
		// 2. useRouterのモックを更新
		useRouter.mockReturnValue({
			query: { goalId, message: '' },
			push: mockPush,
		});
	
		// 3. モックデータを定義
		const mockGoalData = {
			id: 2,
			title: 'Sample Goal 2',
			content: 'This is the second sample goal content.',
			deadline: '2024-11-30',
			completed: false,
		};
	
		const mockSmallGoalsData = [
			{
				id: 201,
				title: 'Sample Small Goal 3',
				completed: false,
				deadline: '2024-10-15',
				difficulty: 'Hard',
				tasks: [
					{ id: 2001, content: 'Task 4', completed: false },
					{ id: 2002, content: 'Task 5', completed: false },
				],
			},
		];
	
		// 4. fetchのモックを設定
		global.fetch.mockImplementation((url, options) => {
			// タスクの状態更新リクエストをモック
			if (
				url.startsWith('http://localhost:3000/api/tasks/') &&
				url.endsWith('/complete') &&
				options.method === 'POST'
			) {
				return Promise.resolve({
					ok: true,
					json: () => Promise.resolve({ message: 'Task updated successfully.' }),
				});
			}
	
			// Small Goalの完了リクエストをモック
			if (
				url === `http://localhost:3000/api/goals/${goalId}/small_goals/201/complete` &&
				options.method === 'POST'
			) {
				return Promise.resolve({
					ok: true,
					json: () => Promise.resolve({ message: 'Small Goal completed successfully.' }),
				});
			}
	
			// Goalの取得リクエストをモック
			if (
				url === `http://localhost:3000/api/goals/${goalId}` &&
				options.method === 'GET'
			) {
				return Promise.resolve({
					ok: true,
					json: () => Promise.resolve(mockGoalData),
				});
			}
	
			// Small Goalsの取得リクエストをモック
			if (
				url === `http://localhost:3000/api/goals/${goalId}/small_goals` &&
				options.method === 'GET'
			) {
				return Promise.resolve({
					ok: true,
					json: () => Promise.resolve(mockSmallGoalsData),
				});
			}
	
			// その他のfetchリクエストをモック（必要に応じて）
			return Promise.resolve({
				ok: true,
				json: () => Promise.resolve({}),
			});
		});
	
		// 5. コンポーネントをレンダリング
		render(<GoalPage />);
	
		// 6. Goalが表示されるまで待機
		await screen.findByText(/Sample Goal 2/);
	
		// 7. 未完了のSmall Goalを取得（id:201）
		const smallGoalTitle = await screen.findByText('Sample Small Goal 3');
		expect(smallGoalTitle).toBeInTheDocument();
	
		// 8. タスクのチェックボックスをすべて取得し、チェックを入れる
		const taskCheckboxes = screen.getAllByRole('checkbox');
		expect(taskCheckboxes.length).toBeGreaterThan(0);
		for (const checkbox of taskCheckboxes) {
			expect(checkbox).not.toBeChecked();
	
			// チェックボックスをクリック
			userEvent.click(checkbox);
	
			// 状態更新を待機
			await waitFor(() => {
				expect(checkbox).toBeChecked();
			});
		}
	
		// 9. 「完了」ボタンが表示されるまで待機
		const completeButton = await screen.findByRole('button', { name: '完了' });
		expect(completeButton).toBeInTheDocument();
	
		// 10. 「完了」ボタンをクリック
		userEvent.click(completeButton);
	
		// 11. fetchが正しく呼び出されたことを確認
		await waitFor(() => {
			const completeFetchCall = global.fetch.mock.calls.find(
				([url, options]) =>
					url === `http://localhost:3000/api/goals/${goalId}/small_goals/201/complete` &&
					options && options.method === 'POST'
			);
			expect(completeFetchCall).toBeDefined();
		});
	
		// 12. Small Goalが完了状態になり、UIが更新されることを確認
		await waitFor(() => {
			// 完了したSmall Goalのセクションにタイトルが表示されていることを確認
			const completedSmallGoalTitle = screen.getByText('Sample Small Goal 3');
			expect(completedSmallGoalTitle).toBeInTheDocument();
			// 完了テキストが表示されていることを確認
			expect(screen.getByText('完了!')).toBeInTheDocument();
		});
	});
	
	it('opens and closes the EditGoalModal correctly', async () => {
    // 1. goalId を '1' に設定
    goalId = '1';

    // 2. useRouter のモックを設定
    useRouter.mockReturnValue({
      query: { goalId, message: '' },
      push: mockPush,
    });

    // 3. モックデータを定義
    const mockGoalData = {
      id: 1,
      title: 'Sample Goal 1',
      content: 'This is the first sample goal content.',
      deadline: '2024-12-31',
      completed: false,
    };

    const mockSmallGoalsData = [
      // 必要に応じて Small Goal のデータを追加
    ];

    // 4. fetch のモックを設定
    global.fetch.mockImplementation((url, options) => {
      // Goal の取得リクエストをモック（GoalPage コンポーネント内）
      if (
        url === `http://localhost:3000/api/goals/${goalId}` &&
        options && options.method === 'GET' &&
        options.credentials === 'include'
      ) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockGoalData),
        });
      }

      // Small Goals の取得リクエストをモック
      if (
        url === `http://localhost:3000/api/goals/${goalId}/small_goals` &&
        options && options.method === 'GET' &&
        options.credentials === 'include'
      ) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockSmallGoalsData),
        });
      }

      // Goal の取得リクエストをモック（EditGoal コンポーネント内）
      if (
        url === `http://localhost:3000/api/goals/${goalId}` &&
        options && options.method === 'GET' &&
        options.credentials === 'include'
      ) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockGoalData),
        });
      }

      // Goal の更新リクエストをモック
      if (
        url === `http://localhost:3000/api/goals/${goalId}` &&
        options && options.method === 'PUT' &&
        options.credentials === 'include'
      ) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ message: 'Goal updated successfully.' }),
        });
      }

      // その他の fetch リクエストをモック
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      });
    });

    // 5. コンポーネントをレンダリング
    render(<GoalPage />);

    // 6. 目標のタイトルが表示されるまで待機
    await screen.findByText('目標 : Sample Goal 1');

    // 7. 「目標を編集する」リンクを取得
    const editGoalLink = screen.getByText('目標を編集する');
    expect(editGoalLink).toBeInTheDocument();

    // 8. 「目標を編集する」リンクをクリック
    userEvent.click(editGoalLink);

    // 9. モーダルが表示されることを確認
    const modalTitle = await screen.findByText('目標を編集しよう！');
    expect(modalTitle).toBeInTheDocument();

    // 10. モーダル内の要素を確認（非同期に値が設定されるまで待機）
    await waitFor(() => {
      expect(screen.getByLabelText('目標のタイトル')).toHaveValue('Sample Goal 1');
    });

    const titleInput = screen.getByLabelText('目標のタイトル');
    expect(titleInput).toBeInTheDocument();
    expect(titleInput).toHaveValue('Sample Goal 1');

    const contentInput = screen.getByLabelText('Content');
    expect(contentInput).toBeInTheDocument();
    expect(contentInput).toHaveValue('This is the first sample goal content.');

    const deadlineInput = screen.getByLabelText('期限');
    expect(deadlineInput).toBeInTheDocument();
    expect(deadlineInput).toHaveValue('2024-12-31');

    // 11. モーダルを閉じる（Close ボタンをクリック）
    const closeButton = screen.getByText('Close');
    userEvent.click(closeButton);

    // 12. モーダルが非表示になっていることを確認
    await waitFor(() => {
      expect(screen.queryByText('目標を編集しよう！')).not.toBeInTheDocument();
    });
  });

	it('opens and closes the EditSmallGoalModal correctly', async () => {
		// 1. goalId を '1' に設定
		goalId = '1';
	
		// 2. useRouter のモックを設定
		useRouter.mockReturnValue({
			query: { goalId, message: '' },
			push: mockPush,
		});
	
		// 3. モックデータを定義
		const mockGoalData = {
			id: 1,
			title: 'Sample Goal 1',
			content: 'This is the first sample goal content.',
			deadline: '2024-12-31',
			completed: false,
		};
	
		const mockSmallGoalsData = [
			{
				id: 101,
				title: 'Sample Small Goal 1',
				completed: false,
				deadline: '2024-10-15',
				difficulty: '普通',
				tasks: [
					{ id: 1001, content: 'Task 1', completed: false },
					{ id: 1002, content: 'Task 2', completed: false },
				],
			},
			// 他の Small Goal があれば追加
		];
	
		// 4. fetch のモックを設定
		global.fetch.mockImplementation((url, options) => {
			// Goal の取得リクエストをモック
			if (
				url === `http://localhost:3000/api/goals/${goalId}` &&
				(!options || options.method === 'GET')
			) {
				return Promise.resolve({
					ok: true,
					json: () => Promise.resolve(mockGoalData),
				});
			}
	
			// Small Goals の取得リクエストをモック
			if (
				url === `http://localhost:3000/api/goals/${goalId}/small_goals` &&
				(!options || options.method === 'GET')
			) {
				return Promise.resolve({
					ok: true,
					json: () => Promise.resolve(mockSmallGoalsData),
				});
			}
	
			// Small Goal の取得リクエストをモック（EditSmallGoalModal 内）
			if (
				url === `http://localhost:3000/api/goals/${goalId}/small_goals/101` &&
				options && options.method === 'GET'
			) {
				return Promise.resolve({
					ok: true,
					json: () => Promise.resolve(mockSmallGoalsData[0]),
				});
			}
	
			// その他の fetch リクエストをモック
			return Promise.resolve({
				ok: true,
				json: () => Promise.resolve({}),
			});
		});
	
		// 5. コンポーネントをレンダリング
		render(<GoalPage />);
	
		// 6. Goal のタイトルが表示されるまで待機
		await screen.findByText('目標 : Sample Goal 1');
	
		// 7. Small Goal のタイトルが表示されていることを確認
		const smallGoalTitle = await screen.findByText('Sample Small Goal 1');
		expect(smallGoalTitle).toBeInTheDocument();
	
		// 8. Small Goal の「Edit」リンクを取得
		const editLink = screen.getByText('Edit');
		expect(editLink).toBeInTheDocument();
	
		// 9. 「Edit」リンクをクリック
		userEvent.click(editLink);
	
		// 10. モーダルが表示されていることを確認
		const modalTitle = await screen.findByText('Small Goalを編集');
		expect(modalTitle).toBeInTheDocument();
	
		// 11. モーダル内の要素を確認（フォームフィールドなど）
		await waitFor(() => {
			expect(screen.getByLabelText('Small Goalのタイトル')).toHaveValue('Sample Small Goal 1');
		});
	
		const titleInput = screen.getByLabelText('Small Goalのタイトル');
		expect(titleInput).toBeInTheDocument();
		expect(titleInput).toHaveValue('Sample Small Goal 1');
	
		const deadlineInput = screen.getByLabelText('期限');
		expect(deadlineInput).toBeInTheDocument();
		expect(deadlineInput).toHaveValue('2024-10-15');
	
		const difficultySelect = screen.getByLabelText('Difficulty');
		expect(difficultySelect).toBeInTheDocument();
		expect(difficultySelect).toHaveValue('普通');
	
		// 12. モーダルを閉じる（閉じるボタンをクリック）
		const closeButton = screen.getByText('Close');
		userEvent.click(closeButton);
	
		// 13. モーダルが非表示になっていることを確認
		await waitFor(() => {
			expect(screen.queryByText('Small Goalを編集')).not.toBeInTheDocument();
		});
	});

	it('redirects to dashboard after deleting a Goal', async () => {
		// 1. goalIdを'3'に設定
		goalId = '3';
	
		// 2. useRouterのモックを更新
		useRouter.mockReturnValue({
			query: { goalId, message: '' },
			push: mockPush,
		});
	
		// 3. コンポーネントをレンダリング
		render(<GoalPage />);
	
		// 4. Goalが表示されるまで待機
		await screen.findByText(/Sample Goal 3/);
	
		// 5. 「Delete Goal」リンクを取得
		const deleteGoalLink = screen.getByTestId('delete-goal-link');
		expect(deleteGoalLink).toBeInTheDocument();
	
		// 6. 確認ダイアログをモックしてOKを選択
		jest.spyOn(window, 'confirm').mockReturnValueOnce(true);
	
		// 7. fetchのモックを設定
		global.fetch.mockImplementationOnce((url, options) => {
			if (
				url === `http://localhost:3000/api/goals/${goalId}` &&
				options && options.method === 'DELETE'
			) {
				return Promise.resolve({
					ok: true,
					json: () => Promise.resolve({ message: 'Goal deleted successfully.' }),
				});
			}
			return Promise.reject('Unexpected fetch call');
		});
	
		// 8. 「Delete Goal」リンクをクリック
		userEvent.click(deleteGoalLink);
	
		// 9. fetchが正しく呼び出されたことを確認
		await waitFor(() => {
			expect(global.fetch).toHaveBeenCalledWith(
				`http://localhost:3000/api/goals/${goalId}`,
				expect.objectContaining({
					method: 'DELETE',
				})
			);
		});
	
		// 10. router.pushが正しく呼ばれたことを確認
		await waitFor(() => {
			expect(mockPush).toHaveBeenCalledWith('/dashboard');
		});
	
		// 11. confirmモックの復元
		window.confirm.mockRestore();
	});
	
	it('redirects to dashboard after completing a Goal', async () => {
		// 1. goalIdを'1'に設定（全てのSmall Goalsが完了しているGoal）
		goalId = '1';
	
		// 2. useRouterのモックを更新
		useRouter.mockReturnValue({
			query: { goalId, message: '' },
			push: mockPush,
		});
	
		// 3. コンポーネントをレンダリング
		render(<GoalPage />);
	
		// 4. Goalが表示されるまで待機
		await screen.findByText(/Sample Goal 1/);
	
		// 5. 「Completed Goal」ボタンを取得
		const completeGoalButton = screen.getByRole('button', { name: 'Completed Goal' });
		expect(completeGoalButton).toBeInTheDocument();
		expect(completeGoalButton).toBeEnabled();
	
		// 6. fetchのモックを設定
		global.fetch.mockImplementationOnce((url, options) => {
			if (
				url === `http://localhost:3000/api/goals/${goalId}/complete` &&
				options && options.method === 'POST'
			) {
				return Promise.resolve({
					ok: true,
					json: () => Promise.resolve({ message: 'Goal completed successfully.' }),
				});
			}
			return Promise.reject('Unexpected fetch call');
		});
	
		// 7. 「Completed Goal」ボタンをクリック
		userEvent.click(completeGoalButton);
	
		// 8. fetchが正しく呼び出されたことを確認
		await waitFor(() => {
			expect(global.fetch).toHaveBeenCalledWith(
				`http://localhost:3000/api/goals/${goalId}/complete`,
				expect.objectContaining({
					method: 'POST',
				})
			);
		});
	
		// 9. router.pushが正しく呼ばれたことを確認
		await waitFor(() => {
			expect(mockPush).toHaveBeenCalledWith({
				pathname: '/dashboard',
				query: { message: encodeURIComponent('Goal completed successfully.') },
			});
		});
	});
	
	it('updates state after editing a Goal', async () => {
		// 1. goalIdを設定
		goalId = '1';
	
		// 2. useRouterのモックを設定
		useRouter.mockReturnValue({
			query: { goalId, message: '' },
			push: mockPush,
		});
	
		// 3. fetchのモックを設定
		const initialGoalData = {
			id: 1,
			title: 'Initial Goal Title',
			content: 'Initial Goal Content',
			deadline: '2024-12-31',
			completed: false,
		};
	
		const updatedGoalData = {
			...initialGoalData,
			title: 'Updated Goal Title',
			content: 'Updated Goal Content',
		};
	
		let fetchCallCount = 0;
		global.fetch.mockImplementation((url, options) => {
			fetchCallCount++;
	
			// Goalの取得リクエストをモック
			if (
				url === `http://localhost:3000/api/goals/${goalId}` &&
				(!options || options.method === 'GET')
			) {
				if (fetchCallCount <= 2) {
					return Promise.resolve({
						ok: true,
						json: () => Promise.resolve(initialGoalData),
					});
				} else {
					return Promise.resolve({
						ok: true,
						json: () => Promise.resolve(updatedGoalData),
					});
				}
			}
	
			// Goalの更新リクエストをモック
			if (
				url === `http://localhost:3000/api/goals/${goalId}` &&
				options && options.method === 'PUT'
			) {
				return Promise.resolve({
					ok: true,
					json: () => Promise.resolve({ message: 'Goal updated successfully.' }),
				});
			}
	
			// その他のfetchリクエストをモック
			return Promise.resolve({
				ok: true,
				json: () => Promise.resolve({}),
			});
		});
	
		// 4. コンポーネントをレンダリング
		render(<GoalPage />);
	
		// 5. 初期のGoalタイトルが表示されるまで待機
		await screen.findByText('目標 : Initial Goal Title');
	
		// 6. 「目標を編集する」リンクをクリック
		const editGoalLink = screen.getByText('目標を編集する');
		userEvent.click(editGoalLink);
	
		// 7. モーダル内のタイトルを変更
		const titleInput = await screen.findByLabelText('目標のタイトル');
		userEvent.clear(titleInput);
		userEvent.type(titleInput, 'Updated Goal Title');
	
		// 8. モーダル内の内容を変更
		const contentInput = screen.getByLabelText('Content');
		userEvent.clear(contentInput);
		userEvent.type(contentInput, 'Updated Goal Content');
	
		// 9. 「Update Goal」ボタンをクリック
		const updateButton = screen.getByText('Update Goal');
		userEvent.click(updateButton);
	
		// 10. fetchGoalDataが再度呼ばれたことを確認
		await waitFor(() => {
			expect(fetchCallCount).toBeGreaterThan(2);
		});
	
		// 11. 更新後のGoalタイトルが表示されることを確認
		await screen.findByText('目標 : Updated Goal Title');
	});
	
	it('updates state after adding a Small Goal with two tasks', async () => {
		const goalId = '1';
	
		// コンポーネントをレンダリング
		render(<GoalPage />);
	
		// 初期状態でSmall Goalが表示されていないことを確認
		await waitFor(() => {
			expect(screen.queryByText('New Small Goal')).not.toBeInTheDocument();
		});
	
		// 「Small Goalの作成」ボタンをクリック
		const createSmallGoalButton = await screen.findByText('Small Goalの作成');
		userEvent.click(createSmallGoalButton);
	
		// モーダル内で必要な情報を入力
		const titleInput = await screen.findByLabelText('Small Goalのタイトル');
		userEvent.type(titleInput, 'New Small Goal');
	
		const deadlineInput = screen.getByLabelText('期限');
		userEvent.type(deadlineInput, '2024-11-30');
	
		const difficultySelect = screen.getByLabelText('難易度の設定');
		userEvent.selectOptions(difficultySelect, '普通'); // 'Medium' を '普通' に変更
	
		// 2つのタスクを追加
		const addTaskButton = screen.getByRole('button', { name: /タスクの追加/i });
		userEvent.click(addTaskButton); // 2つ目のタスクフィールドを追加
	
		// タスクフィールドを取得
		const taskInputs = screen.getAllByLabelText('Task');
		console.log('Task inputs:', taskInputs);
		screen.debug();
		expect(taskInputs.length).toBe(2); // 2つのタスクフィールドがあるはず
	
		// 各タスクフィールドに値を入力
		userEvent.type(taskInputs[0], 'Task 1');
		userEvent.type(taskInputs[1], 'Task 2');
	
		// 「設定する」ボタンをクリック
		const submitButton = screen.getByRole('button', { name: /設定する/i });
		userEvent.click(submitButton);
	
		// POST リクエストが正しく行われたことを確認
		await waitFor(() => {
			expect(global.fetch).toHaveBeenCalledWith(
				`http://localhost:3000/api/goals/${goalId}/small_goals`,
				expect.objectContaining({
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					credentials: 'include',
					body: JSON.stringify({
						small_goal: {
							title: 'New Small Goal',
							difficulty: '普通',
							deadline: '2024-11-30',
							tasks_attributes: [
								{ content: 'Task 1' },
								{ content: 'Task 2' },
							],
						},
					}),
				})
			);
		});
	
		// モックを更新して、新しいSmall Goalを返すように設定
		const createdSmallGoal = {
			id: 201,
			title: 'New Small Goal',
			completed: false,
			deadline: '2024-11-30',
			difficulty: '普通',
			tasks: [
				{ id: 3001, content: 'Task 1', completed: false },
				{ id: 3002, content: 'Task 2', completed: false },
			],
		};
	
		global.fetch.mockImplementationOnce((url, options) => {
			if (
				parsedUrl.pathname === `/api/goals/${goalId}/small_goals` &&
				(!options || options.method === 'GET')
			) {
				return Promise.resolve({
					ok: true,
					json: () => Promise.resolve(smallGoalsData),
				});
			}
			return Promise.resolve({
				ok: true,
				json: () => Promise.resolve({}),
			});
		});
	
		// 新しいSmall Goalが表示されていることを確認
		await screen.findByText('New Small Goal');
	
		// タスクが表示されていることを確認
		await screen.findByText('Task 1');
		await screen.findByText('Task 2');
	});
	
});
