import React from 'react';
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import { useRouter } from 'next/router';
import { fetchWithAuth } from '../../utils/fetchWithAuth';
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
jest.mock('../../components/Calendar', () => {
  const MockedExpCalendar = () => <div>Mocked ExpCalendar</div>;
  MockedExpCalendar.displayName = 'MockedExpCalendar';
  return MockedExpCalendar;
});

jest.mock('../../components/ExpLineChart', () => {
  const MockedExpLineChart = () => <div>Mocked ExpLineChart</div>;
  MockedExpLineChart.displayName = 'MockedExpLineChart';
  return MockedExpLineChart;
});

jest.mock('../../components/Layout', () => {
  const MockedLayout = ({ children }) => <div data-testid="layout">{children}</div>;
  MockedLayout.displayName = 'MockedLayout';
  return MockedLayout;
});

jest.mock('../../utils/fetchWithAuth');

jest.mock('../../utils/getIdToken');

jest.mock('next/router', () => ({
  useRouter: jest.fn(),
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
	let Dashboard;

	beforeEach(() => {
		mockPush = jest.fn();

    useRouter.mockReturnValue({
      query: {},
      push: mockPush,
			replace: jest.fn(),
    });

    fetchWithAuth.mockReset()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockGoalsData,      // 1) /api/goals
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockUserData,       // 2) /api/current_user
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),// 3) /update_rank
      })
      .mockResolvedValue({                    // 4) 以降
        ok: true,
        json: async () => ({}),
      });

		Dashboard = require('../../pages/dashboard').default;
  });
	
	// console.log の出力を抑制できるコード
	jest.spyOn(console, 'log').mockImplementation(() => {});

	afterEach(() => {
		jest.clearAllMocks();
	});

  it('renders the dashboard with user profile and goals', async () => {
		const Dashboard = require('../../pages/dashboard').default;
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
		const Dashboard = require('../../pages/dashboard').default;
		render(<Dashboard />);
	
		// 何か 1 つ描画されるまでアンカーで待機
		await screen.findByText('Sample User');
	
		// /update_rank が呼ばれていることを確認
		const updateCalls = fetchWithAuth.mock.calls.filter(([url]) =>
			url.includes('/update_rank')
		);
		expect(updateCalls).toHaveLength(1);
	
		const [url, options] = updateCalls[0];
		expect(url).toContain('/api/current_users/7/update_rank');
		expect(options).toMatchObject({
			method: 'POST',
			body: JSON.stringify({ lastRouletteRank: mockUserData.rank }),
		});
	});

	it('updates lastRouletteRank when rank increases past a multiple of 10', async () => {
		const Dashboard = require('../../pages/dashboard').default;
		render(<Dashboard />);

	 // 非同期にレンダリングされる要素をfindByで取得
	 const rankText = await screen.findByText('Your Rank: 20');
	 expect(rankText).toBeInTheDocument();
 });
	
	it('opens and closes the goal creation modal when the respective buttons are clicked', async () => {
		const Dashboard = require('../../pages/dashboard').default;
		render(<Dashboard />);
	
		// "目標を設定する"ボタンを取得してクリック
		const setGoalButton = await screen.findByText('Goalを設定する');
		fireEvent.click(setGoalButton);
	
		// モーダルが開いたことを確認
		const modalTitle = await screen.findByRole('heading', { name: 'Goalを設定する' });
		expect(modalTitle).toBeInTheDocument();
	
		// モーダル内の閉じるボタンを取得してクリック
		const closeButton = screen.getByRole('button', { name: 'Close' }); // 'Close' は閉じるボタンのテキスト
		fireEvent.click(closeButton);
	
		// モーダルが閉じたことを確認
		await waitFor(() => {
			expect(screen.queryByRole('heading', { name: 'Goalを設定する' })).not.toBeInTheDocument();
		});
	});	

	it('renders the completed goals link with correct href', async () => {
		const Dashboard = require('../../pages/dashboard').default;
    render(<Dashboard />);

    const completedGoalLink = await screen.findByText('達成したGoal');
    expect(completedGoalLink.closest('a')).toHaveAttribute('href', '/completed-goal');
  });
	
	it('should render the latest completed Small-Goals', async () => {
		const Dashboard = require('../../pages/dashboard').default;
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
		const Dashboard = require('../../pages/dashboard').default;
		render(<Dashboard />);
	
		// Calendarコンポーネントがモックされたテキストを持つかどうかを確認
		const calendarElement = await screen.findByText('Mocked ExpCalendar');
		expect(calendarElement).toBeInTheDocument();
	});
	
	it('should render the ExpLineChart component', async () => {
		const Dashboard = require('../../pages/dashboard').default;
		render(<Dashboard />);
	
		// ExpLineChartコンポーネントがモックされたテキストを持つかどうかを確認
		const chartElement = await screen.findByText('Mocked ExpLineChart');
		expect(chartElement).toBeInTheDocument();
	});

	it('should render unmet goals in the correct order by deadline', async () => {
		const Dashboard = require('../../pages/dashboard').default;
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
		const Dashboard = require('../../pages/dashboard').default;
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
		const Dashboard = require('../../pages/dashboard').default;
		render(<Dashboard />);
		console.log(document.body.innerHTML);

		await screen.findByText('Sample User');

		const layout = screen.getByTestId('layout');
		expect(layout).toBeInTheDocument();
	});
	
	//userRank が 10 を超える場合、「ごほうびルーレット」リンクが表示されることを確認するテスト
	it('shows ごほうびルーレット link when userRank is 10', async () => {
		fetchWithAuth.mockReset();
		fetchWithAuth
			.mockResolvedValueOnce({ ok:true, json:async()=>mockGoalsData }) // first call /api/goals
			.mockResolvedValueOnce({ ok:true, json:async()=>({...mockUserData, rank:10}) }) // second /api/current_user
			.mockResolvedValue({ ok:true, json:async()=>({}) });

			const Dashboard = require('../../pages/dashboard').default;
		render(<Dashboard />);
	
		// rank が反映されるまで適当なアンカーで待つ
		await screen.findByText('Sample User');
	
		// リンクを確認
		const rouletteLink = await screen.findByText('ごほうびルーレット');
		expect(rouletteLink).toBeInTheDocument();
		expect(rouletteLink.closest('a')).toHaveAttribute('href', '/edit-roulette-text');
	});

	// dashboard.test.js ─ 「ごほうびルーレット」が出ることを確認するテスト
	it('renders the "ごほうびルーレット" link when userRank is 10', async () => {
		/* ① 既存モックをリセット */
		fetchWithAuth.mockReset();

		/* ② 1回目 (/api/goals) → 既定データ
					2回目 (/api/current_user) → rank:10 を返す */
		fetchWithAuth
			.mockResolvedValueOnce({ ok: true, json: async () => mockGoalsData })
			.mockResolvedValueOnce({ ok: true, json: async () => ({ ...mockUserData, rank: 10 }) })
			.mockResolvedValue({ ok: true, json: async () => ({}) });
			const Dashboard = require('../../pages/dashboard').default;
		render(<Dashboard />);

		/* ③ 何か1つ描画されるまで待つ */
		await screen.findByText('Sample User');

		/* ④ リンクを検証 */
		const rouletteLink = await screen.findByRole('link', { name: 'ごほうびルーレット' });
		expect(rouletteLink).toBeInTheDocument();
		expect(rouletteLink).toHaveAttribute('href', '/edit-roulette-text');
	});

	//userRank が 9 の場合、「ごほうびルーレット」リンクが表示されないことを確認するテスト
  it('should not render the "ごほうびルーレット" link when userRank is 9', async () => {
    // userRank を 9 に設定
    fetchWithAuth.mockReturnValue({
      isLoggedIn: true,
      userRank: 9,
    });
		const Dashboard = require('../../pages/dashboard').default;
    render(<Dashboard />);

    // 「ごほうびルーレット」リンクが表示されていないことを確認
    await waitFor(() => {
      const rouletteLink = screen.queryByText('ごほうびルーレット');
      expect(rouletteLink).not.toBeInTheDocument();
    });
  });

	it('redirects to login page if user is not logged in', async () => {
		/** 1️⃣ 既存の fetchWithAuth モックをリセット */
		fetchWithAuth.mockReset();

		/** 2️⃣ 1回目 (= /api/current_user) の呼び出しで ok:false を返す */
		fetchWithAuth.mockResolvedValueOnce({
			ok: false,
			json: async () => ({}),
		});

		const mockReplace = jest.fn();
		useRouter.mockReturnValue({
			query: {},
			push: jest.fn(),
			replace: mockReplace
		});

		const Dashboard = require('../../pages/dashboard').default;
		render(<Dashboard />);

		await waitFor(() => {
			expect(mockReplace).toHaveBeenCalledWith('/login');
		});
	});
	
  it('renders only goals with completed: false as ongoing goals', async () => {
		/** 1️⃣ 既存のモックをリセット */
		fetchWithAuth.mockReset();
	
		/** 2️⃣ 呼び出し順にレスポンスを定義 */
		fetchWithAuth
			.mockResolvedValueOnce({ ok: true, json: async () => mockGoalsData }) // /api/goals
			.mockResolvedValueOnce({ ok: true, json: async () => mockUserData })  // /api/current_user
			// それ以降は空レスポンスで十分
			.mockResolvedValue({ ok: true, json: async () => ({}) });
			const Dashboard = require('../../pages/dashboard').default;
		render(<Dashboard />);
	
		/* 1) いずれかのゴールタイトルが描画されるまで待つ */
		await waitFor(async () => {
			const goals = await screen.findAllByText('Sample Goal');
			expect(goals.length).toBeGreaterThan(0);
		});

		/* 2) 見出しの存在を確認（日本語表記） */
		const header = screen.getByRole('heading', { name: /進行中のGoal/ });
		expect(header).toBeInTheDocument();

		/* 3) 以下、完了していないゴールだけが表示されているかを検証 */
		const ongoingGoals = mockGoalsData.filter(g => !g.completed);
		const titleEls = await screen.findAllByTestId('goal-title');
		expect(titleEls).toHaveLength(ongoingGoals.length);

		ongoingGoals.forEach(goal => {
			expect(titleEls.some(el => el.textContent === goal.title)).toBe(true);
		});

		mockGoalsData
			.filter(g => g.completed)
			.forEach(goal => {
				expect(screen.queryByText(goal.title)).not.toBeInTheDocument();
			});
	});

	it('renders only small goals with completed: false as ongoing small goals', async () => {
		/** 1️⃣ 既定モックを全消し */
		fetchWithAuth.mockReset();
	
		/** 2️⃣ 1回目: /api/goals, 2回目: /api/current_user */
		fetchWithAuth
			.mockResolvedValueOnce({ ok: true, json: async () => mockGoalsData })
			.mockResolvedValueOnce({ ok: true, json: async () => mockUserData })
			/** 3️⃣ それ以降は空でも OK */
			.mockResolvedValue({ ok: true, json: async () => ({}) });
			const Dashboard = require('../../pages/dashboard').default;
		render(<Dashboard />);
	
		/** 4️⃣ Small-Goal が 1 件でも DOM に現れるまで待つ */
		await screen.findByText('Sample Small Goal');
	
		/** 見出しを確認 */
		const header = screen.getByRole('heading', { name: /進行中のSmall Goal/ });
		expect(header).toBeInTheDocument();
	
		/* === 以下は元の検証ロジックをそのまま残す ============================= */
		const { findAllByTestId, queryByText } = within(header.parentElement);
	
		const ongoingSmallGoals = [];
		mockGoalsData.forEach(g => {
			if (!g.completed) ongoingSmallGoals.push(...g.small_goals.filter(sg => !sg.completed));
		});
	
		const titleEls = await findAllByTestId('small-goal-title');
		expect(titleEls).toHaveLength(ongoingSmallGoals.length);
	
		ongoingSmallGoals.forEach(sg => {
			expect(titleEls.some(el => el.textContent === sg.title)).toBe(true);
		});
	
		const completedSmallGoals = [];
		mockGoalsData.forEach(g => {
			if (!g.completed) completedSmallGoals.push(...g.small_goals.filter(sg => sg.completed));
		});
		completedSmallGoals.forEach(sg => {
			expect(queryByText(sg.title)).not.toBeInTheDocument();
		});
	});
	
	
	it('removes a small goal from ongoing Small Goals when it is deleted', async () => {
		const initialMockGoalsData = [...mockGoalsData];

		// 1️⃣ 既存モックをリセット
		fetchWithAuth.mockReset();
	
		// 2️⃣ 初回レンダリング用レスポンス
		//    1回目 = /api/goals, 2回目 = /api/current_user
		fetchWithAuth
			.mockResolvedValueOnce({ ok: true, json: async () => initialMockGoalsData })
			.mockResolvedValueOnce({ ok: true, json: async () => mockUserData })
			// 以降は空でも可
			.mockResolvedValue({ ok: true, json: async () => ({}) });
	
		const Dashboard = require('../../pages/dashboard').default;
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
	
		// ❹ fetchWithAuth を更新: 1回目 goals, 2回目 current_user
		fetchWithAuth.mockReset();
		fetchWithAuth
			.mockResolvedValueOnce({ ok: true, json: async () => updatedMockGoalsData })
			.mockResolvedValueOnce({ ok: true, json: async () => mockUserData });
		
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