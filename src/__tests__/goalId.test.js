import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
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
  const { useRouter } = jest.requireActual('next/router'); // 修正ポイント

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
          difficulty: 'Easy',
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
          difficulty: 'Medium',
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
          difficulty: 'Hard',
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
          difficulty: 'Easy',
          tasks: [
            { id: 2003, content: 'Task 6', completed: true },
          ],
        },
      ],
    },
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
    });

    useGoals.mockReturnValue({
      goalsState: [],
      setGoalsState: jest.fn(),
      refreshGoals: jest.fn(),
    });

    global.fetch = jest.fn((url, options) => {
      console.log('Mock fetch called with URL:', url);
      console.log('Fetch options:', options);
  
      // URLからgoalIdを抽出
      const match = url.match(/\/goals\/(\d+)/);
      const goalIdFromUrl = match ? match[1] : '1'; // デフォルトで'1'を使用
  
      if (url === `http://localhost:3000/api/goals/${goalIdFromUrl}`) {
        console.log(`Mock fetch matched /api/goals/${goalIdFromUrl}`);
        const goal = mockGoalData.find(g => g.id === parseInt(goalIdFromUrl));
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(goal),
        });
      } else if (url === `http://localhost:3000/api/goals/${goalIdFromUrl}/small_goals`) {
        console.log(`Mock fetch matched /api/goals/${goalIdFromUrl}/small_goals`);
        const goal = mockGoalData.find(g => g.id === parseInt(goalIdFromUrl));
        const smallGoals = goal ? goal.small_goals : [];
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(smallGoals),
        });
      } else if (url === 'http://localhost:3000/api/current_user') {
        console.log('Mock fetch matched /api/current_user');
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockUserData),
        });
      } else {
        console.log('Mock fetch did not match any condition for URL:', url);
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}),
        });
      }
    });

    // console.log の出力を抑制できるコード
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  // console.log の出力を抑制できるコード
  jest.spyOn(console, 'log').mockImplementation(() => {});

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
      console.log('Mock fetch called with URL:', url);
      console.log('Fetch options:', options);

      // URLからgoalIdを抽出
      const match = url.match(/\/goals\/(\d+)/);
      const goalIdFromUrl = match ? match[1] : '1'; // デフォルトで'1'を使用

      if (url === `http://localhost:3000/api/goals/${goalIdFromUrl}`) {
        console.log(`Mock fetch matched /api/goals/${goalIdFromUrl}`);
        // goalId が存在しないので null を返す
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(null),
        });
      } else if (url === `http://localhost:3000/api/goals/${goalIdFromUrl}/small_goals`) {
        console.log(`Mock fetch matched /api/goals/${goalIdFromUrl}/small_goals`);
        // small_goals も空配列を返す
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
        });
      } else if (url === 'http://localhost:3000/api/current_user') {
        console.log('Mock fetch matched /api/current_user');
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockUserData),
        });
      } else {
        console.log('Mock fetch did not match any condition for URL:', url);
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
				console.log('Mock fetch called with URL:', url);
	
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
});
