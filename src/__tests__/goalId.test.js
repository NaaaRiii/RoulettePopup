import React from 'react';
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import GoalPage from '../pages/goals/[goalId]';
import CreateSmallGoal from '../components/CreateSmallGoal';
import EditGoalModal from '../components/EditGoal';
import EditSmallGoalModal from '../components/EditSmallGoal';
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

jest.mock('../components/EditGoal', () => {
  const React = require('react');
  const MockEditGoal = props => {
    const { isOpen, onGoalUpdated } = props;
    return isOpen
      ? <button data-testid="mock-edit-goal" onClick={onGoalUpdated}>Save Goal</button>
      : null;
  };
  MockEditGoal.displayName = 'EditGoal';
  return MockEditGoal;
});

jest.mock('../components/EditSmallGoal', () => {
  const React = require('react');
  const MockEditSmallGoal = props => {
    const { isOpen, onSmallGoalUpdated } = props;
    return isOpen
      ? <button data-testid="mock-edit-small-goal" onClick={onSmallGoalUpdated}>Save SmallGoal</button>
      : null;
  };
  MockEditSmallGoal.displayName = 'EditSmallGoal';
  return MockEditSmallGoal;
});


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


describe('Display Logic', () => {
	beforeEach(() => {
    // useRouter のモック
    useRouter.mockImplementation(() => ({
      query: { goalId: '123', message: null },
      push: jest.fn(),
    }));

    // useGoals をモックして最低限のプロパティを返す
    useGoals.mockImplementation(() => ({
      goalsState: [],
      setGoalsState: jest.fn(),
      refreshGoals: jest.fn(),
    }));

    jest.clearAllMocks();
  });

  it('shows message from query string when ?message=... is present', async () => {
    // ルーターに goalId と message をセット
    useRouter.mockImplementation(() => ({
      query: { goalId: '123', message: encodeURIComponent('Hello World') },
      push: jest.fn(),
    }));

    // fetchWithAuth をモック：まず goalDetails、次に small_goals を返す
    const mockGoalDetails = {
      id: 123,
      title: 'Test Goal',
      content: 'Some content',
      completed: false,
      deadline: '2025-06-10',
    };
    fetchWithAuth
      .mockResolvedValueOnce({ ok: true, json: async () => mockGoalDetails })
      .mockResolvedValueOnce({ ok: true, json: async () => [] });

    render(
      <Authenticator.Provider>
        <TicketsContext.Provider value={{ tickets: 0, setTickets: jest.fn(), fetchTickets: jest.fn() }}>
          <GoalPage />
        </TicketsContext.Provider>
      </Authenticator.Provider>
    );

    // ローディングが終わり、メッセージが表示されるのを待つ
    const messageEl = await screen.findByText('Hello World');
    expect(messageEl).toBeInTheDocument();
  });

  it('renders "Completed Goal" button disabled when there are incomplete small goals', async () => {
    useRouter.mockImplementation(() => ({
      query: { goalId: '123', message: null },
      push: jest.fn(),
    }));

    const mockGoalDetails = {
      id: 123,
      title: 'Test Goal',
      content: 'Some content',
      completed: false,
      deadline: '2025-06-10',
    };
    const mockSmallGoals = [
      { id: 1, completed: false, title: 'Small Goal 1', content: '...', deadline: null, difficulty: 'Easy', tasks: [] },
      { id: 2, completed: true, title: 'Small Goal 2', content: '...', deadline: null, difficulty: 'Easy', tasks: [] },
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

    // small goals が描画されるのを待つ
    await waitFor(() => {
      expect(screen.getByText('Small Goal 1')).toBeInTheDocument();
    });

    const button = screen.getByRole('button', { name: /Completed Goal/i });
    expect(button).toBeDisabled();
  });

  it('renders "Completed Goal" button enabled when all small goals are completed', async () => {
    useRouter.mockImplementation(() => ({
      query: { goalId: '123', message: null },
      push: jest.fn(),
    }));

    const mockGoalDetails = {
      id: 123,
      title: 'Test Goal',
      content: 'Some content',
      completed: false,
      deadline: '2025-06-10',
    };
    const mockSmallGoals = [
      { id: 1, completed: true, title: 'SG1', content: '...', deadline: null, difficulty: 'Easy', tasks: [] },
      { id: 2, completed: true, title: 'SG2', content: '...', deadline: null, difficulty: 'Easy', tasks: [] },
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

		await waitFor(() => {
			expect(screen.getByText('SG1')).toBeInTheDocument();
		});

    const button = screen.getByRole('button', { name: /Completed Goal/i });
    expect(button).toBeEnabled();
  });

	it('groups small goals into incomplete and completed sections based on completed flag', async () => {
    const mockGoalDetails = {
      id: 123,
      title: 'Test Goal',
      content: 'Some content',
      completed: false,
      deadline: '2025-06-10',
    };
    const mockSmallGoals = [
      {
        id: 1,
        completed: false,
        title: 'Unfinished SG',
        content: '...',
        deadline: null,
        difficulty: 'Easy',
        tasks: [],
      },
      {
        id: 2,
        completed: true,
        title: 'Finished SG',
        content: '...',
        deadline: null,
        difficulty: 'Easy',
        tasks: [],
      },
    ];

    fetchWithAuth
      .mockResolvedValueOnce({ ok: true, json: async () => mockGoalDetails })
      .mockResolvedValueOnce({ ok: true, json: async () => mockSmallGoals });

    const { container } = render(
      <Authenticator.Provider>
        <TicketsContext.Provider
          value={{ tickets: 0, setTickets: jest.fn(), fetchTickets: jest.fn() }}
        >
          <GoalPage />
        </TicketsContext.Provider>
      </Authenticator.Provider>
    );

    // 小ゴールがレンダリングされるのを待つ
    await screen.findByText('Unfinished SG');
    await screen.findByText('Finished SG');

    // 「未完了」セクションと「完了済み」セクションを取得
    const incompleteSection = container.querySelector('.goal-content-bottom-top');
    const completedSection = container.querySelector('.goal-content-bottom-bottom');

    // 未完了セクションに 'Unfinished SG' が含まれる
    expect(
      within(incompleteSection).getByText('Unfinished SG')
    ).toBeInTheDocument();

    // 完了済みセクションに 'Finished SG' が含まれる
    expect(
      within(completedSection).getByText('Finished SG')
    ).toBeInTheDocument();
  });

});


describe('Modal Operations', () => {
  beforeEach(() => {
		jest.clearAllMocks();
    fetchWithAuth.mockReset();

    useRouter.mockImplementation(() => ({
      query: { goalId: '123', message: null },
      push: jest.fn(),
    }));

    useGoals.mockImplementation(() => ({
      goalsState: [],
      setGoalsState: jest.fn(),
      refreshGoals: jest.fn(),
    }));

	fetchWithAuth
		.mockResolvedValueOnce({ ok: true, json: async () => ({ id: 123, title: 'Test Goal' }) })
		.mockResolvedValueOnce({
			ok:true,
			json:async()=>[
				{
					id:1,
					title:'Small Goal 1',
					completed:false,
					difficulty:'Easy',     // ← 実装側で参照されるフィールドは入れておく
					deadline:null,
					tasks:[
						{ id:11, content:'Task 1', completed:false },
					],
				},
			],
		});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('opens CreateSmallGoal modal then closes it with onClose', async () => {
    // goalDetails と small_goals を返す
    fetchWithAuth
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 123, title: 'Test Goal' }) })
      .mockResolvedValueOnce({ ok: true, json: async () => [] });

    render(
      <Authenticator.Provider>
        <TicketsContext.Provider value={{ tickets: 0, setTickets: jest.fn(), fetchTickets: jest.fn() }}>
          <GoalPage />
        </TicketsContext.Provider>
      </Authenticator.Provider>
    );

    // 目標タイトルが表示されるまで待つ
    await screen.findByText('目標 : Test Goal');

    // 「Small Goalの作成」を含む div を取得し、そこから <a> を探してクリック
    const labelDiv = await screen.findByText(/Small\s*Goalの作成/);
    const linkAnchor = labelDiv.closest('a');
    expect(linkAnchor).not.toBeNull();

    fireEvent.click(linkAnchor);

    // モーダルは data-testid="create-small-goal" をもつ div
    const modal = await screen.findByTestId('create-small-goal');
    expect(modal).toBeInTheDocument();

    // モーダル内の「キャンセル」または「閉じる」ボタンをクリックして閉じる
    const closeBtn = within(modal).getByRole('button', { name: /Close/i });
    fireEvent.click(closeBtn);

    // モーダルが消えるまで待機
    await waitFor(() => {
      expect(screen.queryByTestId('create-small-goal')).not.toBeInTheDocument();
    });
  });

	it('opens EditGoalModal when "目標を編集する" link is clicked', async () => {
    // 1st: goalDetails, 2nd: small_goals
    fetchWithAuth
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 123, title: 'Test Goal' }) })
      .mockResolvedValueOnce({ ok: true, json: async () => [] });

    render(
      <Authenticator.Provider>
        <TicketsContext.Provider value={{ tickets: 0, setTickets: jest.fn(), fetchTickets: jest.fn() }}>
          <GoalPage />
        </TicketsContext.Provider>
      </Authenticator.Provider>
    );

    await screen.findByText('目標 : Test Goal');

		const goalLink = screen.getByRole('link', { name: /目標を編集する/ });
		fireEvent.click(goalLink);
	
		expect(await screen.findByTestId('mock-edit-goal')).toBeInTheDocument();
	});

  it('opens EditSmallGoalModal when a small-goal Edit link is clicked', async () => {
    const goal = { id: 123, title: 'Test Goal' };
    const smallGoals = [
      { id: 1, title: 'Small Goal 1', completed: false, difficulty: 'Easy', deadline: null, tasks: [] }
    ];

    fetchWithAuth
      .mockResolvedValueOnce({ ok: true, json: async () => goal })
      .mockResolvedValueOnce({ ok: true, json: async () => smallGoals });

    render(
      <Authenticator.Provider>
        <TicketsContext.Provider value={{ tickets: 0, setTickets: jest.fn(), fetchTickets: jest.fn() }}>
          <GoalPage />
        </TicketsContext.Provider>
      </Authenticator.Provider>
    );

		await screen.findByText(/Small\s*Goal\s*1/);


		const editTrigger = await screen.findByText(/^Edit$/);
		fireEvent.click(editTrigger);  

		expect(await screen.findByTestId('mock-edit-small-goal')).toBeInTheDocument();
  });
});


describe('Task Toggle', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    /* ---- Router / GoalsContext の最小限モック ---- */
    useRouter.mockReturnValue({ query:{ goalId:'123' }, push:jest.fn() });
    useGoals.mockReturnValue({ goalsState:[], setGoalsState:jest.fn(), refreshGoals:jest.fn() });

    /* ---- fetchWithAuth を URL 判定で一元モック ---- */
    const goal = { id:123, title:'Test Goal' };
    const smallGoals = [{
      id:1,
      title:'Small Goal 1',
      completed:false,
      difficulty:'Easy',
      deadline:null,
      tasks:[ { id:11, content:'Task 1', completed:false } ],
    }];

    fetchWithAuth.mockImplementation(async (url, opts={}) => {
      if (url === '/api/goals/123')                       return { ok:true, json:async()=>goal       };
      if (url === '/api/goals/123/small_goals')           return { ok:true, json:async()=>smallGoals };
      if (url.endsWith('/api/tasks/11/complete'))         return { ok:true, json:async()=>({ completed:true }) };
      /* デフォルト */
      return { ok:true, json:async()=>({}) };
    });
  });

  it('calls POST /api/tasks/:id/complete and toggles completed state', async () => {
    render(
      <Authenticator.Provider>
        <TicketsContext.Provider value={{ tickets:0, setTickets:jest.fn(), fetchTickets:jest.fn() }}>
          <GoalPage />
        </TicketsContext.Provider>
      </Authenticator.Provider>
    );

    /* --- チェックボックスを取得してクリック --- */
    const checkbox = await screen.findByRole('checkbox', { name:/Task\s*1/i });
    expect(checkbox).not.toBeChecked();

    const user = userEvent.setup();
    await user.click(checkbox);

    /* --- POST が送られたか --- */
    await waitFor(() =>
      expect(fetchWithAuth).toHaveBeenCalledWith(
        '/api/tasks/11/complete',
        { method:'POST', body:JSON.stringify({ completed:true }) }
      )
    );

    /* --- UI が更新されたか --- */
    await waitFor(() =>
      expect(screen.getByRole('checkbox', { name:/Task\s*1/i })).toBeChecked()
    );
  });
});


describe('Small Goal 完了', () => {
  const goalId = '123';
  const routerPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    /* Router / GoalsContext モック */
    useRouter.mockReturnValue({ query: { goalId }, push: routerPush });
    useGoals.mockReturnValue({ goalsState: [], setGoalsState: jest.fn(), refreshGoals: jest.fn() });

    /* ダミーデータ */
    const goal = { id: 123, title: 'Test Goal' };
    const smallGoals = [
      {
        id: 1,
        title: 'Small Goal 1',
        completed: false,
        difficulty: 'Easy',
        deadline: null,
        tasks: [{ id: 11, content: 'Task 1', completed: true }],
      },
    ];

    /* fetchWithAuth を URL 判定で一元モック */
    fetchWithAuth.mockImplementation(async (url, opts = {}) => {
      if (url === `/api/goals/${goalId}`) return { ok: true, json: async () => goal };
      if (url === `/api/goals/${goalId}/small_goals`) return { ok: true, json: async () => smallGoals };
      if (url === `/api/goals/${goalId}/small_goals/1/complete`) {
        /* ---- SmallGoal 完了 API 応答 ---- */
        return {
          ok: true,
          json: async () => ({ message: 'Small Goal Completed!' }),
        };
      }
      return { ok: true, json: async () => ({}) };
    });
  });

  it('“完了” ボタン → POST /complete → smallGoal.completed が true になり dashboard に遷移する', async () => {
    render(
      <Authenticator.Provider>
        <TicketsContext.Provider value={{ tickets: 0, setTickets: jest.fn(), fetchTickets: jest.fn() }}>
          <GoalPage />
        </TicketsContext.Provider>
      </Authenticator.Provider>
    );

    /* ① Small Goal が描画されるまで待機 */
    await screen.findByText(/Small\s*Goal\s*1/i);

    /* ② “完了” ボタンをクリック */
    const completeBtn = screen.getByRole('button', { name: /完了/i });
    const user = userEvent.setup();
    await user.click(completeBtn);

    /* ③ POST が正しい URL で送られたか */
    await waitFor(() =>
      expect(fetchWithAuth).toHaveBeenCalledWith(
        `/api/goals/${goalId}/small_goals/1/complete`,
        { method: 'POST' }
      )
    );

    /* ④ router.push が flash メッセージ付きで呼ばれたか */
    await waitFor(() =>
      expect(routerPush).toHaveBeenCalledWith({
        pathname: '/dashboard',
        query: { message: encodeURIComponent('Small Goal Completed!') },
      })
    );
  });
});


describe('Goal 完了', () => {
  const goalId      = '123';
  const routerPush  = jest.fn();
  const fetchTicketsMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    /* -------- Router / GoalsContext のモック -------- */
    useRouter.mockReturnValue({ query:{ goalId, message:null }, push:routerPush });
    useGoals.mockReturnValue({ goalsState:[], setGoalsState:jest.fn(), refreshGoals:jest.fn() });

    /* -------- API モック -------- */
    const goalDetails = {
      id:      123,
      title:   'Test Goal',
      content: 'Some content',
      completed: false,
      deadline: null,
    };
    // すべて completed:true ⇒ “Completed Goal” ボタンが有効になる
    const smallGoals = [
      { id:1, title:'SG1', completed:true,  difficulty:'Easy', deadline:null, tasks:[] },
      { id:2, title:'SG2', completed:true,  difficulty:'Easy', deadline:null, tasks:[] },
    ];

    fetchWithAuth.mockImplementation(async (url, opts = {}) => {
      if (url === `/api/goals/${goalId}`)                     // Goal 詳細
        return { ok:true, json:async()=>goalDetails };

      if (url === `/api/goals/${goalId}/small_goals`)         // Small Goals
        return { ok:true, json:async()=>smallGoals };

      if (url === `/api/goals/${goalId}/complete`)            // Goal 完了 POST
        return { ok:true, json:async()=>({ message:'Goal Completed!' }) };

      return { ok:true, json:async()=>({}) };
    });
  });

  it('未完了 small goal が無いとき “Completed Goal” で Goal 完了 & ダッシュボード遷移', async () => {
    render(
      <Authenticator.Provider>
        <TicketsContext.Provider
          value={{ tickets:0, setTickets:jest.fn(), fetchTickets:fetchTicketsMock }}
        >
          <GoalPage />
        </TicketsContext.Provider>
      </Authenticator.Provider>
    );

    /* ① Goal & Small Goals の描画を待つ */
    await screen.findByText('目標 : Test Goal');

    /* “Completed Goal” ボタンが有効になっているはず */
    const completeBtn = screen.getByRole('button', { name:/Completed Goal/i });
    expect(completeBtn).toBeEnabled();

    /* ② クリック */
    const user = userEvent.setup();
    await user.click(completeBtn);

    /* ③ /api/goals/:id/complete が POST されたか */
    await waitFor(() =>
      expect(fetchWithAuth).toHaveBeenCalledWith(
        `/api/goals/${goalId}/complete`,
        { method:'POST' }
      )
    );

    /* ④ fetchTickets() が呼ばれる（チケット枚数更新） */
    await waitFor(() =>
      expect(fetchTicketsMock).toHaveBeenCalled()
    );

    /* ⑤ router.push('/dashboard', flash message) が呼ばれる */
    await waitFor(() =>
      expect(routerPush).toHaveBeenCalledWith({
        pathname: '/dashboard',
        query: { message: encodeURIComponent('Goal Completed!') },
      })
    );
  });
});