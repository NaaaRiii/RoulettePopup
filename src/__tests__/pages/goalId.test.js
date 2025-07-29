import React from 'react';
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import GoalPage from '../../pages/goals/[goalId]';
import EditRouletteText        from '../../pages/edit-roulette-text'; 
import { useRouter } from 'next/router';
import { fetchWithAuth } from '../../utils/fetchWithAuth';
import { Authenticator } from '@aws-amplify/ui-react';
import { useGoals } from '../../contexts/GoalsContext';
import { TicketsContext } from '../../contexts/TicketsContext';
import '@testing-library/jest-dom';

jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

jest.mock('../../utils/fetchWithAuth');
jest.mock('../../contexts/GoalsContext', () => ({
  useGoals: jest.fn(),
}));

jest.mock('../../components/EditGoal', () => {
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

jest.mock('../../components/EditSmallGoal', () => {
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

jest.mock('../../hooks/useFetchRouletteTexts', () => ({
  useFetchRouletteTexts: () => ({
    // map できるように最低限の配列を渡す
    rouletteTexts: [
      { id: 1, number: 1, text: 'Prize 1' },
      { id: 2, number: 2, text: 'Prize 2' },
    ],
    setRouletteTexts: jest.fn(),
  }),
}));


describe('データの取得', () => {
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

  it('マウント時に両方のfetchWithAuthエンドポイントを呼び出し、"Loading..."を表示すること', async () => {
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


  it('取得成功時に目標状態を保存し、タイトル、内容、小目標リストをレンダリングすること', async () => {
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
    const titleEl = await screen.findByText('Goal : Test Goal Title');
    expect(titleEl).toBeInTheDocument();

    // 内容が表示されていることを確認
    expect(screen.getByText('Goalの詳細 : Test Content')).toBeInTheDocument();

    // 未完了の small goal セクションに "Small Goal 1" が表示されている
    expect(screen.getByText('Small Goal 1')).toBeInTheDocument();

    // 完了済みの small goal セクションに "Small Goal 2" が表示されている
    expect(screen.getByText('Small Goal 2')).toBeInTheDocument();

		// タスク "Task 1" は未完了セクションなのでチェックボックス付きラベルで見つかる
		expect(screen.getByLabelText('Task 1')).toBeInTheDocument();

		// タスク "Task 2" は完了済セクションなので「・Task 2」というテキストで探す
		expect(screen.getByText('・Task 2')).toBeInTheDocument();
  });

	it('取得失敗時に"Goal not found"を表示すること', async () => {
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

  it('取得例外時に"Goal not found"を表示すること', async () => {
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

	it('small_goalsの形式が無効なとき、smallGoalsErrorを設定してエラーメッセージを表示すること', async () => {
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


describe('表示ロジック', () => {
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

  it('?message=...が存在するときにクエリ文字列からメッセージを表示すること', async () => {
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

  it('未完成の小目標があるときに"目標完了"ボタンを無効でレンダリングすること', async () => {
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

    const button = screen.getByRole('button', { name: /Goalを完了する/i });
    expect(button).toBeDisabled();
  });

  it('すべての小目標が完了したときに"目標完了"ボタンを有効でレンダリングすること', async () => {
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

    const button = screen.getByRole('button', { name: /Goalを完了する/i });
    expect(button).toBeEnabled();
  });

	it('完了フラグに基づいて小目標を未完了と完了済みセクションにグループ化すること', async () => {
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


describe('モーダル操作', () => {
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

  it('CreateSmallGoalモーダルを開いてonCloseで閉じること', async () => {
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
    await screen.findByText('Goal : Test Goal');

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

	it('"目標を編集する"リンクがクリックされたときにEditGoalModalを開くこと', async () => {
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

    await screen.findByText('Goal : Test Goal');

		const goalLink = screen.getByRole('link', { name: /Goalを編集する/ });
		fireEvent.click(goalLink);
	
		expect(await screen.findByTestId('mock-edit-goal')).toBeInTheDocument();
	});

  it('小目標の編集リンクがクリックされたときにEditSmallGoalModalを開くこと', async () => {
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

		const editTrigger = await screen.findByText(/^編集$/);
		fireEvent.click(editTrigger);  

		expect(await screen.findByTestId('mock-edit-small-goal')).toBeInTheDocument();
  });
});


describe('タスクの切り替え', () => {
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

  it('POST /api/tasks/:id/completeを呼び出し、完了状態を切り替えること', async () => {
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

  it('"完了"ボタン→POST /complete→smallGoal.completedがtrueになりdashboardに遷移すること', async () => {
    render(
      <Authenticator.Provider>
        <TicketsContext.Provider value={{ tickets: 0, setTickets: jest.fn(), fetchTickets: jest.fn() }}>
          <GoalPage />
        </TicketsContext.Provider>
      </Authenticator.Provider>
    );

    /* ① Small Goal が描画されるまで待機 */
    await screen.findByText(/Small\s*Goal\s*1/i);

    /* ② "完了" ボタンをクリック */
    const completeBtn = screen.getByRole('button', { name: /^完了$/ });
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
    // Small Goal が存在しない場合 ⇒ "Goalを完了する" ボタンは無効になる
    const smallGoals = [];  // ← 変更: Small Goal なし

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

  it('小目標が無いとき目標完了ボタンが無効になること', async () => {
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
    await screen.findByText('Goal : Test Goal');

    /* "Goalを完了する" ボタンが無効になっていることを確認 */
    const goalCompleteBtn = screen.getByRole('button', { name:/Goalを完了する/i });
    expect(goalCompleteBtn).toBeDisabled();

    // 無効ボタンのためクリック操作は行わず、complete API が呼ばれていないことを確認
    expect(fetchWithAuth).not.toHaveBeenCalledWith(
      `/api/goals/${goalId}/complete`,
      expect.any(Object)
    );
  });
});


describe('削除操作', () => {
  const goalId      = '123';
  const pushMock    = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    /* ---- Router / GoalsContext ---- */
    useRouter.mockReturnValue({ query:{ goalId }, push:pushMock });
    useGoals.mockReturnValue({ goalsState:[], setGoalsState:jest.fn(), refreshGoals:jest.fn() });

    /* ---- ダミーデータ ---- */
    const goalDetails = { id:123, title:'Test Goal' };
    const smallGoals  = [
      { id:1, title:'Small Goal 1', completed:false, difficulty:'Easy', deadline:null, tasks:[] },
      { id:2, title:'Small Goal 2', completed:false, difficulty:'Easy', deadline:null, tasks:[] },
    ];

    /* ---- fetchWithAuth を URL 判定で一元モック ---- */
    fetchWithAuth.mockImplementation(async (url, opts = {}) => {
      if (url === `/api/goals/${goalId}`)                    // Goal 詳細
        return { ok:true, json:async()=>goalDetails };

      if (url === `/api/goals/${goalId}/small_goals`)        // Small Goals 一覧
        return { ok:true, json:async()=>smallGoals };

      if (url === `/api/goals/${goalId}/small_goals/1`       // 削除エンドポイント
          && opts.method === 'DELETE')
        return { ok:true, json:async()=>({}) };

      /* デフォルト */
      return { ok:true, json:async()=>({}) };
    });
  });

  it('確認 OK→DELETEで小目標がUIから消えること', async () => {

    /* ① confirm を YES にしておく */
    const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true);

    render(
      <Authenticator.Provider>
        <TicketsContext.Provider value={{ tickets:0, setTickets:jest.fn(), fetchTickets:jest.fn() }}>
          <GoalPage />
        </TicketsContext.Provider>
      </Authenticator.Provider>
    );

    /* ② 小ゴール２件が描画されるまで待機 */
    await screen.findByText(/Small\s*Goal\s*1/);
    await screen.findByText(/Small\s*Goal\s*2/);

    /* ③ id=1 の削除リンクをクリック */
    const deleteLink = screen.getByTestId('delete-small-goal-1');
    fireEvent.click(deleteLink);

    /* ④ DELETE リクエストが正しい URL／method で送られたか */
    await waitFor(() =>
      expect(fetchWithAuth).toHaveBeenCalledWith(
        `/api/goals/${goalId}/small_goals/1`,
        { method:'DELETE' }
      )
    );

    /* ⑤ UI から Small Goal 1 が消え、Small Goal 2 は残る */
    await waitFor(() =>
      expect(screen.queryByText(/Small\s*Goal\s*1/)).not.toBeInTheDocument()
    );
    expect(screen.getByText(/Small\s*Goal\s*2/)).toBeInTheDocument();

    confirmSpy.mockRestore();
  });

	it('確認 OK→DELETE /api/goals/:id→refreshGoalsが呼ばれdashboardに遷移すること', async () => {
		const goalId = '123';
	
		/* ---- Router / GoalsContext のモックを再設定 ---- */
		const pushMock        = jest.fn();
		const refreshGoalsSpy = jest.fn();
	
		useRouter.mockReturnValue({ query:{ goalId }, push:pushMock });
		useGoals.mockReturnValue({ goalsState:[], setGoalsState:jest.fn(), refreshGoals:refreshGoalsSpy });
	
		/* ---- fetchWithAuth モック ---- */
		const goalDetails = { id:123, title:'Test Goal' };
		fetchWithAuth.mockImplementation(async (url, opts={}) => {
			if (url === `/api/goals/${goalId}` && !opts.method)
				return { ok:true, json:async()=>goalDetails };           // Goal 詳細
			if (url === `/api/goals/${goalId}/small_goals`)
				return { ok:true, json:async()=>[] };                    // small_goals 空
			if (url === `/api/goals/${goalId}` && opts.method==='DELETE')
				return { ok:true, json:async()=>({}) };                  // Goal DELETE
			return { ok:true, json:async()=>({}) };
		});
	
		/* ---- confirm を YES に固定 ---- */
		const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true);
	
		/* ---- ① 画面描画 ---- */
		render(
			<Authenticator.Provider>
				<TicketsContext.Provider value={{ tickets:0, setTickets:jest.fn(), fetchTickets:jest.fn() }}>
					<GoalPage />
				</TicketsContext.Provider>
			</Authenticator.Provider>
		);
	
		/* ---- ② Goal が表示されるまで待機 ---- */
		await screen.findByText('Goal : Test Goal');
	
		/* ---- ③ 「Delete Goal」リンクをクリック ---- */
		const deleteLink = screen.getByTestId('delete-goal-link');
		fireEvent.click(deleteLink);
	
		/* ---- ④ DELETE が正しい URL で呼ばれたか ---- */
		await waitFor(() =>
			expect(fetchWithAuth).toHaveBeenCalledWith(
				`/api/goals/${goalId}`,
				{ method:'DELETE' }
			)
		);
	
		/* ---- ⑤ refreshGoals() が呼ばれたか ---- */
		expect(refreshGoalsSpy).toHaveBeenCalled();
	
		/* ---- ⑥ /dashboard へ遷移したか ---- */
		expect(pushMock).toHaveBeenCalledWith('/dashboard');
	
		confirmSpy.mockRestore();
	});
});


describe('チケット表示', () => {
  /**
   * <h3 class="ticket-info">チケットを『{tickets}』枚…</h3>
   * が TicketsContext.tickets の変更をリアルタイムに反映するかを確認
   */
  it('TicketsContext 反映', async () => {
    /* ① wrapper で tickets を操作出来るように */
    const TestWrapper = () => {
      const [tickets, setTickets] = React.useState(3);   // 初期 3 枚
      return (
        <TicketsContext.Provider
          value={{ tickets, setTickets, fetchTickets: jest.fn() }}
        >
          <EditRouletteText />
          {/* テスト用: tickets を 7 に更新するボタン */}
          <button data-testid="update-tickets" onClick={() => setTickets(7)}>
            update
          </button>
        </TicketsContext.Provider>
      );
    };

    render(
      <Authenticator.Provider>
        <TestWrapper />
      </Authenticator.Provider>
    );

    /* ② 初期表示は 3 枚 */
    expect(screen.getByTestId('tickets')).toHaveTextContent('チケットを『3』枚');

    /* ③ クリックで tickets を 7 に変更 */
    fireEvent.click(screen.getByTestId('update-tickets'));

    /* ④ DOM が 7 枚に更新されるまで待つ */
    await waitFor(() =>
      expect(screen.getByTestId('tickets')).toHaveTextContent('チケットを『7』枚')
    );
  });
});


describe('副作用フック', () => {
	beforeEach(() => {
		fetchWithAuth.mockImplementation(async (url) => {
			/* ── 123 系 ────────────────────────── */
			if (url === '/api/goals/123')
				return { ok: true, json: async () => ({ id: 123, title: 'First Goal' }) };
	
			if (url === '/api/goals/123/small_goals')
				return { ok: true, json: async () => [] };
	
			/* ── 456 系 ────────────────────────── */
			if (url === '/api/goals/456')
				return { ok: true, json: async () => ({ id: 456, title: 'Second Goal' }) };
	
			if (url === '/api/goals/456/small_goals')
				return { ok: true, json: async () => [] };
	
			/* デフォルト（来ないはず） */
			return { ok: false, status: 404 };
		});
	});

  it('goalIdが変わると再フェッチし、前回のstateをリセットすること', async () => {
		const AppWrapped = ({ goalId }) => (
			<Authenticator.Provider>
				<TicketsContext.Provider value={{ tickets: 0, setTickets: jest.fn(), fetchTickets: jest.fn() }}>
					<GoalPage />         {/* GoalPage 自体は useRouter から goalId を読み取る */}
				</TicketsContext.Provider>
			</Authenticator.Provider>
		);

		/* ---------------- ① useRouter を１つのオブジェクトでモック ---------------- */
		const routerObj = {
			query: { goalId: '123' },
			push : jest.fn(),
		};
		useRouter.mockReturnValue(routerObj);

		/* ---------------- ② 1 回目のレンダー ---------------- */
		const view = render(<AppWrapped goalId="123" />);

		expect(await screen.findByText(/Goal\s*:\s*First\s*Goal/)).toBeInTheDocument();

		/* ---------------- ③ goalId を書き換えて再レンダー ---------------- */
		routerObj.query.goalId = '456';
		view.rerender(<AppWrapped goalId="456" />);

		expect(await screen.findByText(/Goal\s*:\s*Second\s*Goal/)).toBeInTheDocument();
		expect(screen.queryByText(/Goal\s*:\s*First\s*Goal/)).not.toBeInTheDocument();

  });
});


describe('UI コンポーネント存在', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    /* --------- Router / GoalsContext 最小限モック --------- */
    useRouter.mockReturnValue({ query: { goalId: '123' }, push: jest.fn() });
    useGoals.mockReturnValue({ goalsState: [], setGoalsState: jest.fn(), refreshGoals: jest.fn() });

    /* --------- fetchWithAuth を URL で分岐モック --------- */
    fetchWithAuth.mockImplementation(async (url) => {
      if (url === '/api/goals/123')
        return { ok: true, json: async () => ({ id: 123, title: 'Test Goal' }) };
      if (url === '/api/goals/123/small_goals')
        return { ok: true, json: async () => [] };
      return { ok: true, json: async () => ({}) };
    });
  });

  /**
   * ExpCalendar が描画されるかを確認
   * GoalPage 内では <div data-testid="calendar">…</div> を含むため
   * これを取得して存在をアサートする
   */
  it('ExpCalendarが描画されること', async () => {
    render(
      <Authenticator.Provider>
        <TicketsContext.Provider
          value={{ tickets: 0, setTickets: jest.fn(), fetchTickets: jest.fn() }}
        >
          <GoalPage />
        </TicketsContext.Provider>
      </Authenticator.Provider>
    );

    /* Goal データが表示されるのを待ってから Calendar を検証 */
    await screen.findByText(/Goal\s*:\s*Test\s*Goal/);

    expect(screen.getByTestId('calendar')).toBeInTheDocument();
  });
});