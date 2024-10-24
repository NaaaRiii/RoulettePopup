import React from 'react';
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import Dashboard from '../pages/dashboard';
import { useRouter } from 'next/router';
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

// 子コンポーネントをモック
jest.mock('../components/Calendar', () => {
  const MockedExpCalendar = () => <div>Mocked ExpCalendar</div>;
  MockedExpCalendar.displayName = 'MockedExpCalendar';
  return MockedExpCalendar;
});

jest.mock('../components/ExpLineChart', () => {
  const MockedExpLineChart = () => <div>Mocked ExpLineChart</div>;
  MockedExpLineChart.displayName = 'MockedExpLineChart';
  return MockedExpLineChart;
});

jest.mock('../components/Layout', () => {
  const MockedLayout = ({ children }) => <div data-testid="layout">{children}</div>;
  MockedLayout.displayName = 'MockedLayout';
  return MockedLayout;
});

// withAuth モックの修正
jest.mock('../utils/withAuth', () => {
  const React = require('react');
  const { useAuth } = require('../contexts/AuthContext');
  const { useRouter } = require('next/router');

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

describe('Dashboard page', () => {
  const mockGoalsData = [
		{
			id: 255,
			user_id: 7,
			content: 'This is a sample goal.',
			title: 'Sample Goal',
			deadline: '2024-01-22',
			small_goal: null,
			completed: false,
			completed_time: null,
			small_goals: [
				{
					id: 265,
					goal_id: 255,
					title: 'Sample Small Goal',
					difficulty: 'easy',
					deadline: '2024-12-15T21:07:11.668+09:00',
					task: 'test',
					completed: false,
					completed_time: null,
					exp: 30,
				},
			],
		},
		{
			id: 256,
			user_id: 7,
			content: 'This is an unmet sample goal.',
			title: 'First Unmet Goal',
			deadline: '2024-12-25',
			small_goal: null,
			completed: false,
			completed_time: null,
			small_goals: [
				{
					id: 266,
					goal_id: 256,
					title: 'First Unmet Small Goal',
					difficulty: 'easy',
					deadline: '2024-12-15T21:07:11.668+09:00',
					task: 'test',
					completed: false,
					completed_time: null,
					exp: 30,
				},
			],
		},
		{
			id: 257,
			user_id: 7,
			content: 'This is another unmet sample goal.',
			title: 'Second Unmet Goal',
			deadline: '2024-12-31',
			small_goal: null,
			completed: false,
			completed_time: null,
			small_goals: [
				{
					id: 267,
					goal_id: 257,
					title: 'Second Unmet Small Goal',
					difficulty: 'easy',
					deadline: '2024-12-15T21:07:11.668+09:00',
					task: 'test',
					completed: false,
					completed_time: null,
					exp: 30,
				},
			],
		},
		{
			id: 258,
			user_id: 7,
			content: 'This is a completed sample goal.',
			title: 'Completed Goal 1',
			deadline: '2024-11-30',
			small_goal: null,
			completed: true,
			completed_time: '2024-05-01T12:00:00+09:00',
			small_goals: [
				{
					id: 268,
					goal_id: 258,
					title: 'Completed Small Goal 1',
					difficulty: 'easy',
					deadline: '2024-11-15T21:07:11.668+09:00',
					task: 'test',
					completed: true,
					completed_time: '2024-05-01T12:00:00+09:00',
					exp: 30,
				},
			],
		},
		{
			id: 259,
			user_id: 7,
			content: 'This is another completed sample goal.',
			title: 'Completed Goal 2',
			deadline: '2024-11-30',
			small_goal: null,
			completed: false,
			completed_time: null,
			small_goals: [
				{
					id: 269,
					goal_id: 259,
					title: 'Completed Small Goal 2',
					difficulty: 'easy',
					deadline: '2024-11-16T21:07:11.668+09:00',
					task: 'test',
					completed: true,
					completed_time: '2024-05-03T12:00:00+09:00',
					exp: 30,
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
    goals: mockGoalsData,
    tasks: [
      {
        id: 2276,
        small_goal_id: 265,
        created_at: '2024-01-15T21:07:11.676+09:00',
        updated_at: '2024-01-15T21:07:11.676+09:00',
        completed: false,
        content: 'Task 1',
      },
      {
        id: 2277,
        small_goal_id: 265,
        created_at: '2024-01-15T21:07:11.680+09:00',
        updated_at: '2024-01-15T21:07:11.680+09:00',
        completed: false,
        content: 'Task 2',
      },
    ],
		latestCompletedGoals: [
			{
				id: 1,
				title: 'Completed Small Goal 1',
				completed_time: '2024-04-24T12:00:00+09:00',
			},
			{
				id: 2,
				title: 'Completed Small Goal 2',
				completed_time: '2024-04-25T15:30:00+09:00',
			},
		],
  };

	let mockPush;

	beforeEach(() => {
		mockPush = jest.fn();

    useRouter.mockReturnValue({
      query: {},
      push: mockPush,
    });

    useAuth.mockReturnValue({
      isLoggedIn: true,
      userRank: 20,
    });

    global.fetch = jest.fn((url, options) => {
      console.log('Mock fetch called with URL:', url);
      console.log('Fetch options:', options);

      if (url === 'http://localhost:3000/api/goals') {
        console.log('Mock fetch matched /api/goals');
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockGoalsData),
        });
      } else if (url === 'http://localhost:3000/api/current_user') {
        console.log('Mock fetch matched /api/current_user');
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockUserData),
        });
      } else if (url.endsWith('/update_rank')) {
        console.log('Mock fetch matched /update_rank');
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        });
      } else {
        console.log('Mock fetch did not match any condition for URL:', url);
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({}),
        });
      }
    });
  });
	
	// console.log の出力を抑制できるコード
	jest.spyOn(console, 'log').mockImplementation(() => {});

	afterEach(() => {
		jest.clearAllMocks();
	});

  it('renders the dashboard with user profile and goals', async () => {
    const mockRouter = {
      query: { message: 'Goal completed successfully' },
      push: jest.fn(),
    };
    useRouter.mockReturnValue(mockRouter);

		render(<Dashboard />);

		// 非同期にレンダリングされる要素をfindByで取得
		const userName = await screen.findByText('Sample User');
		expect(userName).toBeInTheDocument();

		expect(screen.getByText('Your EXP: 140')).toBeInTheDocument();
		expect(screen.getByText('Your Rank: 20')).toBeInTheDocument();
	});

	it('calls updateLastRouletteRank when rank increases past a multiple of 10', async () => {
		const mockFetch = jest.spyOn(global, 'fetch');
	
		render(<Dashboard />);
	
		await waitFor(() => {
			expect(mockFetch).toHaveBeenCalledWith(
				expect.stringContaining('/api/current_users/7/update_rank'),
				expect.objectContaining({
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					credentials: 'include',
					body: JSON.stringify({ lastRouletteRank: 20 }),
				})
			);
		});
	
		mockFetch.mockRestore();
	});

	it('updates lastRouletteRank when rank increases past a multiple of 10', async () => {
		render(<Dashboard />);

	 // 非同期にレンダリングされる要素をfindByで取得
	 const rankText = await screen.findByText('Your Rank: 20');
	 expect(rankText).toBeInTheDocument();
 });
	
	it('opens and closes the goal creation modal when the respective buttons are clicked', async () => {
		render(<Dashboard />);
	
		// "目標を設定する"ボタンを取得してクリック
		const setGoalButton = await screen.findByText('目標を設定する');
		fireEvent.click(setGoalButton);
	
		// モーダルが開いたことを確認
		const modalTitle = await screen.findByRole('heading', { name: '目標を設定する' });
		expect(modalTitle).toBeInTheDocument();
	
		// モーダル内の閉じるボタンを取得してクリック
		const closeButton = screen.getByRole('button', { name: 'Close' }); // 'Close' は閉じるボタンのテキスト
		fireEvent.click(closeButton);
	
		// モーダルが閉じたことを確認
		await waitFor(() => {
			expect(screen.queryByRole('heading', { name: '目標を設定する' })).not.toBeInTheDocument();
		});
	});	

	it('renders the completed goals link with correct href', async () => {
    render(<Dashboard />);

    const completedGoalLink = await screen.findByText('達成した目標');
    expect(completedGoalLink.closest('a')).toHaveAttribute('href', '/completed-goal');
  });
	
	it('should render the latest completed Small-Goals', async () => {
    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('Completed Small Goal 1')).toBeInTheDocument();
      expect(screen.getByText('Completed Small Goal 2')).toBeInTheDocument();
    });

    // 完了した時間の表示を確認
    expect(screen.getByText('2024-04-24')).toBeInTheDocument();
    expect(screen.getByText('2024-04-25')).toBeInTheDocument();
  });

	it('should render the Calendar component', async () => {
		render(<Dashboard />);
	
		// Calendarコンポーネントがモックされたテキストを持つかどうかを確認
		const calendarElement = await screen.findByText('Mocked ExpCalendar');
		expect(calendarElement).toBeInTheDocument();
	});
	
	it('should render the ExpLineChart component', async () => {
		render(<Dashboard />);
	
		// ExpLineChartコンポーネントがモックされたテキストを持つかどうかを確認
		const chartElement = await screen.findByText('Mocked ExpLineChart');
		expect(chartElement).toBeInTheDocument();
	});

	it('should render unmet goals in the correct order by deadline', async () => {
    render(<Dashboard />);

    // 進行中の目標のタイトルを取得
    const goalTitles = await screen.findAllByTestId('goal-title');

		expect(goalTitles[0]).toHaveTextContent('Sample Goal');         // 期限: 2024-01-22
		expect(goalTitles[1]).toHaveTextContent('Completed Goal 2');    // 期限: 2024-11-30
		expect(goalTitles[2]).toHaveTextContent('First Unmet Goal');    // 期限: 2024-12-25
		expect(goalTitles[3]).toHaveTextContent('Second Unmet Goal');   // 期限: 2024-12-31
	});
	
	// 進行中のSmall Goalが表示され、遷移できるかを確認
  it('should render ongoing Small Goals and allow navigation upon clicking "確認" button', async () => {
		render(<Dashboard />);
	
		// "進行中のSmall Goal" セクションの見出しを取得
		const smallGoalsHeader = await screen.findByText('進行中のSmall Goal');
		expect(smallGoalsHeader).toBeInTheDocument();
	
		// Small Goal のタイトルを取得
		const smallGoalTitles = await screen.findAllByText(/Sample Small Goal|First Unmet Small Goal|Second Unmet Small Goal/);
		expect(smallGoalTitles.length).toBe(3);
	
		// 各Small Goalに対する"確認"ボタンを取得
		const confirmButtons = screen.getAllByText('確認');
		expect(confirmButtons.length).toBe(3);
	
		// 各ボタンが正しいリンクにラップされているか確認
		confirmButtons.forEach((button, index) => {
			const expectedHref = `/goals/${mockGoalsData[index].id}`;
			const linkElement = button.closest('a');
			expect(linkElement).toHaveAttribute('href', expectedHref);
		});
	});
	
	it('should render the Layout component correctly', async () => {
		render(<Dashboard />);
	
		// Layout コンポーネントがレンダリングされていることを確認
		const layoutElement = await screen.findByTestId('layout');
		expect(layoutElement).toBeInTheDocument();
	
		// Layout の子要素が正しくレンダリングされているか確認
		// 例えば、Dashboard コンポーネントの一部を確認
		expect(screen.getByText('Sample User')).toBeInTheDocument();
	});
	
	//userRank が 10 を超える場合、「ごほうびルーレット」リンクが表示されることを確認するテスト
	 it('should render the "ごほうびルーレット" link when userRank > 10', async () => {
    // userRank は beforeEach で 20 に設定されているため、変更不要

    render(<Dashboard />);

    // 「ごほうびルーレット」リンクが表示されていることを確認
    const rouletteLink = await screen.findByText('ごほうびルーレット');
    expect(rouletteLink).toBeInTheDocument();

    // リンクの href 属性が正しいことを確認
    expect(rouletteLink.closest('a')).toHaveAttribute('href', '/edit-roulette-text');
  });

  //userRank が 10 の場合、「ごほうびルーレット」リンクが表示されることを確認するテスト
  it('should render the "ごほうびルーレット" link when userRank is 10', async () => {
    // userRank を 10 に設定
    useAuth.mockReturnValue({
      isLoggedIn: true,
      userRank: 10,
    });

    render(<Dashboard />);

    // 「ごほうびルーレット」リンクが表示されていることを確認
    const rouletteLink = await screen.findByText('ごほうびルーレット');
    expect(rouletteLink).toBeInTheDocument();

    // リンクの href 属性が正しいことを確認
    expect(rouletteLink.closest('a')).toHaveAttribute('href', '/edit-roulette-text');
  });

	//userRank が 9 の場合、「ごほうびルーレット」リンクが表示されないことを確認するテスト
  it('should not render the "ごほうびルーレット" link when userRank is 9', async () => {
    // userRank を 9 に設定
    useAuth.mockReturnValue({
      isLoggedIn: true,
      userRank: 9,
    });

    render(<Dashboard />);

    // 「ごほうびルーレット」リンクが表示されていないことを確認
    await waitFor(() => {
      const rouletteLink = screen.queryByText('ごほうびルーレット');
      expect(rouletteLink).not.toBeInTheDocument();
    });
  });

	it('redirects to login page if user is not logged in', async () => {
		// ユーザーがログインしていない状態をモック
		useAuth.mockReturnValue({
			isLoggedIn: false,
			userRank: null,
		});
	
		render(<Dashboard />);
	
		// リダイレクトが実行されるまで待機
		await waitFor(() => {
			expect(mockPush).toHaveBeenCalledWith('/login');
		});
	});
	
  it('renders only goals with completed: false as ongoing goals', async () => {
		// ダッシュボードをレンダリング
		render(<Dashboard />);
	
		// "進行中のGoal" セクションの見出しを確認
		const header = await screen.findByText('進行中のGoal');
		expect(header).toBeInTheDocument();
	
		// 完了していないゴールのみが表示されていることを確認
		const ongoingGoals = mockGoalsData.filter(goal => !goal.completed);
	
		// 表示されている全てのgoal-titleを取得
		const goalTitleElements = await screen.findAllByTestId('goal-title');
	
		// 表示されているゴールの数が完了していないゴールの数と一致することを確認
		expect(goalTitleElements).toHaveLength(ongoingGoals.length);
	
		// 各完了していないゴールのタイトルが表示されていることを確認
		ongoingGoals.forEach(goal => {
			const isGoalPresent = goalTitleElements.some(element => element.textContent === goal.title);
			expect(isGoalPresent).toBe(true);
		});
	
		// 完了済みゴールが表示されていないことを確認
		const completedGoals = mockGoalsData.filter(goal => goal.completed);
		completedGoals.forEach(goal => {
			const completedGoalTitle = screen.queryByText(goal.title);
			expect(completedGoalTitle).not.toBeInTheDocument();
		});
	});

	it('renders only small goals with completed: false as ongoing small goals', async () => {
		// ダッシュボードをレンダリング
		render(<Dashboard />);
	
		// "進行中のSmall Goal" セクションの見出しを確認
		const header = await screen.findByText('進行中のSmall Goal');
		expect(header).toBeInTheDocument();
	
		// "進行中のSmall Goal" セクションを取得
		const smallGoalsSection = header.parentElement;
		const { findAllByTestId, queryByText } = within(smallGoalsSection);
	
		// 未完了の Small Goal を取得
		const ongoingSmallGoals = [];
		mockGoalsData.forEach(goal => {
			if (!goal.completed) {
				const incompleteSmallGoals = goal.small_goals.filter(smallGoal => !smallGoal.completed);
				ongoingSmallGoals.push(...incompleteSmallGoals);
			}
		});
	
		// 表示されている Small Goal のタイトルを取得
		const smallGoalTitleElements = await findAllByTestId('small-goal-title');
	
		// 表示されている Small Goal の数が未完了の Small Goal の数と一致することを確認
		expect(smallGoalTitleElements).toHaveLength(ongoingSmallGoals.length);
	
		// 各未完了の Small Goal のタイトルが表示されていることを確認
		ongoingSmallGoals.forEach(smallGoal => {
			console.log('smallGoal.completed (ongoing):', smallGoal.completed, typeof smallGoal.completed);
			const isSmallGoalPresent = smallGoalTitleElements.some(element => element.textContent === smallGoal.title);
			expect(isSmallGoalPresent).toBe(true);
		});
	
		// 完了済み Small Goal が "進行中のSmall Goal" セクションに表示されていないことを確認
		const completedSmallGoals = [];
		mockGoalsData.forEach(goal => {
			if (!goal.completed) {
				const completeSmallGoals = goal.small_goals.filter(smallGoal => smallGoal.completed);
				completedSmallGoals.push(...completeSmallGoals);
			}
		});
		completedSmallGoals.forEach(smallGoal => {
			console.log('smallGoal.completed (completed):', smallGoal.completed, typeof smallGoal.completed);
			const completedSmallGoalTitle = queryByText(smallGoal.title);
			expect(completedSmallGoalTitle).not.toBeInTheDocument();
		});
	});
	
	it('removes a small goal from ongoing Small Goals when it is deleted', async () => {
		// 初期のモックデータを設定
		const initialMockGoalsData = [...mockGoalsData];
	
		// fetch のモックを設定
		global.fetch = jest.fn((url, options) => {
			if (url.endsWith('/api/goals')) {
				return Promise.resolve({
					ok: true,
					json: () => Promise.resolve(initialMockGoalsData),
				});
			} else if (url.endsWith('/api/current_user')) {
				return Promise.resolve({
					ok: true,
					json: () => Promise.resolve(mockUserData),
				});
			} else if (url.includes('/update_rank')) {
				return Promise.resolve({
					ok: true,
					json: () => Promise.resolve({ success: true }),
				});
			} else {
				return Promise.resolve({
					ok: true,
					json: () => Promise.resolve({}),
				});
			}
		});
	
		// コンポーネントをレンダリング
		const { unmount } = render(<Dashboard />);
	
		// Small Goal が表示されていることを確認
		const initialSmallGoal = await screen.findByText('Sample Small Goal');
		expect(initialSmallGoal).toBeInTheDocument();
	
		// モックデータを更新して Small Goal を削除
		const updatedMockGoalsData = initialMockGoalsData.map(goal => {
			if (goal.id === 255) {
				return {
					...goal,
					small_goals: goal.small_goals.filter(smallGoal => smallGoal.id !== 265),
				};
			}
			return goal;
		});
	
		// fetch のモックを更新
		global.fetch.mockImplementation((url, options) => {
			if (url.endsWith('/api/goals')) {
				return Promise.resolve({
					ok: true,
					json: () => Promise.resolve(updatedMockGoalsData),
				});
			} else if (url.endsWith('/api/current_user')) {
				return Promise.resolve({
					ok: true,
					json: () => Promise.resolve(mockUserData),
				});
			} else if (url.includes('/update_rank')) {
				return Promise.resolve({
					ok: true,
					json: () => Promise.resolve({ success: true }),
				});
			} else {
				return Promise.resolve({
					ok: true,
					json: () => Promise.resolve({}),
				});
			}
		});
	
		// コンポーネントをアンマウント
		unmount();
	
		// コンポーネントを再レンダリング（再マウント）
		render(<Dashboard />);
	
		// Small Goal が表示されなくなったことを確認
		await waitFor(() => {
			expect(screen.queryByText('Sample Small Goal')).not.toBeInTheDocument();
		});
	});

});