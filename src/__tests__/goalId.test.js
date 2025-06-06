import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import GoalPage from '../pages/goals/[goalId]';
import { useRouter } from 'next/router';
import { fetchWithAuth } from '../utils/fetchWithAuth';
import { Authenticator } from '@aws-amplify/ui-react';
import { useGoals } from '../contexts/GoalsContext';
import { TicketsContext } from '../contexts/TicketsContext';
import '@testing-library/jest-dom';

jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

jest.mock('../utils/fetchWithAuth');
jest.mock('../contexts/GoalsContext', () => ({
  useGoals: jest.fn(),
}));

describe('Data Fetching', () => {
  beforeEach(() => {
    // goalId をクエリに渡すようにルーターをモック
    useRouter.mockImplementation(() => ({
      query: { goalId: '123' },
      push: jest.fn(),
    }));

    // useGoals をモックして最低限のプロパティを返す
    useGoals.mockImplementation(() => ({
      goalsState: [],
      setGoalsState: jest.fn(),
      refreshGoals: jest.fn(),
    }));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('on mount calls both fetchWithAuth endpoints and shows "Loading..."', async () => {
    // fetchWithAuth の呼び出し跡を追いたいのでモックの戻り値は一旦解決しない Promise を返す
    fetchWithAuth
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 123, title: 'Test Goal' }) })       // /api/goals/123
      .mockResolvedValueOnce({ ok: true, json: async () => ([] ) });                                    // /api/goals/123/small_goals

    render(
			<Authenticator.Provider>
				<TicketsContext.Provider value={{ tickets: 0, setTickets: jest.fn(), fetchTickets: jest.fn() }}>
					<GoalPage />
				</TicketsContext.Provider>
			</Authenticator.Provider>
    );

    // 初期ロード中は "Loading..." が表示される
    expect(screen.getByText('Loading...')).toBeInTheDocument();

		// 2 回目の呼び出しまで待機
		await waitFor(() => {
			expect(fetchWithAuth).toHaveBeenCalledTimes(2);
		});
		
    expect(fetchWithAuth).toHaveBeenNthCalledWith(
      1, '/api/goals/123'
    );
    expect(fetchWithAuth).toHaveBeenNthCalledWith(
      2, '/api/goals/123/small_goals'
    );
  });


  it('on successful fetch stores goal state and renders title, content, and small goals list', async () => {
    // モックの goalDetails
    const mockGoalDetails = {
      id: 123,
      title: 'Test Goal Title',
      content: 'Test Content',
      completed: false,
      deadline: '2025-06-10',
    };
    // モックの smallGoals 配列
    const mockSmallGoals = [
      {
        id: 1,
        title: 'Small Goal 1',
        content: 'SG1 Content',
        deadline: '2025-06-15',
        difficulty: 'Easy',
        tasks: [{ id: 10, content: 'Task 1', completed: false }],
        completed: false,
      },
      {
        id: 2,
        title: 'Small Goal 2',
        content: 'SG2 Content',
        deadline: '2025-06-20',
        difficulty: 'Medium',
        tasks: [{ id: 20, content: 'Task 2', completed: true }],
        completed: true,
      },
    ];

    fetchWithAuth
      .mockResolvedValueOnce({ ok: true, json: async () => mockGoalDetails })
      .mockResolvedValueOnce({ ok: true, json: async () => mockSmallGoals });

    render(
      <Authenticator.Provider>
        <TicketsContext.Provider value={{ tickets: 0, setTickets: jest.fn(), fetchTickets: jest.fn() }}>
          <GoalPage />
        </TicketsContext.Provider>
      </Authenticator.Provider>
    );

    // ローディングが消えて、goal title が表示されるまで待機
    const titleEl = await screen.findByText('目標 : Test Goal Title');
    expect(titleEl).toBeInTheDocument();

    // 内容が表示されていることを確認
    expect(screen.getByText('内容 : Test Content')).toBeInTheDocument();

    // 未完了の small goal セクションに "Small Goal 1" が表示されている
    expect(screen.getByText('Small Goal 1')).toBeInTheDocument();

    // 完了済みの small goal セクションに "Small Goal 2" が表示されている
    expect(screen.getByText('Small Goal 2')).toBeInTheDocument();

		// タスク "Task 1" は未完了セクションなのでチェックボックス付きラベルで見つかる
		expect(screen.getByLabelText('Task 1')).toBeInTheDocument();

		// タスク "Task 2" は完了済セクションなので「・Task 2」というテキストで探す
		expect(screen.getByText('・Task 2')).toBeInTheDocument();
  });

	it('on fetch failure shows "Goal not found"', async () => {
    // 取得失敗: response.ok===false
    fetchWithAuth.mockResolvedValueOnce({ ok: false, status: 500 });
    // small_goals は呼ばれないがモックにしておく
    fetchWithAuth.mockResolvedValueOnce({ ok: true, json: async () => [] });

    render(
      <Authenticator.Provider>
        <TicketsContext.Provider value={{ tickets: 0, setTickets: jest.fn(), fetchTickets: jest.fn() }}>
          <GoalPage />
        </TicketsContext.Provider>
      </Authenticator.Provider>
    );

    const notFoundEl = await screen.findByText('Goal not found');
    expect(notFoundEl).toBeInTheDocument();
  });

  it('on fetch exception shows "Goal not found"', async () => {
    // 例外を投げる
    fetchWithAuth.mockRejectedValueOnce(new Error('Network error'));

    render(
      <Authenticator.Provider>
        <TicketsContext.Provider value={{ tickets: 0, setTickets: jest.fn(), fetchTickets: jest.fn() }}>
          <GoalPage />
        </TicketsContext.Provider>
      </Authenticator.Provider>
    );

    const notFoundEl = await screen.findByText('Goal not found');
    expect(notFoundEl).toBeInTheDocument();
  });

	it('when small_goals format is invalid, sets smallGoalsError and displays error message', async () => {
    const mockGoalDetails = {
      id: 123,
      title: 'Test Goal Title',
      content: 'Test Content',
      completed: false,
      deadline: '2025-06-10',
    };

    // 1回目は goalDetails、2回目は small_goals にオブジェクトを返して形式異常を起こす
    fetchWithAuth
      .mockResolvedValueOnce({ ok: true, json: async () => mockGoalDetails })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ invalid: 'data' }) });

    render(
      <Authenticator.Provider>
        <TicketsContext.Provider value={{ tickets: 0, setTickets: jest.fn(), fetchTickets: jest.fn() }}>
          <GoalPage />
        </TicketsContext.Provider>
      </Authenticator.Provider>
    );

    // smallGoalsError がセットされると、"Invalid data format for small goals." を描画
    const errorEl = await screen.findByText('Invalid data format for small goals.');
    expect(errorEl).toBeInTheDocument();
  });
	
});
