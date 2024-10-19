import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
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
  const MockedLayout = ({ children }) => <div>{children}</div>;
  MockedLayout.displayName = 'MockedLayout';
  return MockedLayout;
});

jest.mock('../utils/withAuth', () => ({
  __esModule: true,
  default: (Component) => {
    const MockedWithAuth = (props) => <Component {...props} />;
    MockedWithAuth.displayName = `withAuth(${Component.displayName || Component.name || 'Component'})`;
    return MockedWithAuth;
  },
}));

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

	beforeEach(() => {
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

    useAuth.mockReturnValue({
      isLoggedIn: true,
      userRank: 20,
    });
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

	it('opens the goal creation modal when the button is clicked', async () => {
		render(<Dashboard />);
	
		// "目標を設定する"ボタンを取得
		//const setGoalButton = screen.getByText('目標を設定する');
		const setGoalButton = await screen.findByText('目標を設定する');

		fireEvent.click(setGoalButton);

		// モーダルのタイトルをfindByで取得
    const modalTitle = await screen.findByRole('heading', { name: '目標を設定する' });
    expect(modalTitle).toBeInTheDocument();
  });
	
	it('renders the completed goals link with correct href', async () => {
    render(<Dashboard />);

    const completedGoalLink = await screen.findByText('達成した目標');
    expect(completedGoalLink.closest('a')).toHaveAttribute('href', '/completed-goal');
  });
	
});
