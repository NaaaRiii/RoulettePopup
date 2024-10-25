import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CompletedGoal from '../pages/completed-goal';
import { useGoals } from '../contexts/GoalsContext';
import '@testing-library/jest-dom';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';

// 1. `next/router`のモックを最初に設定
jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

// 2. `next/link`をモックして、クリック時に`router.push`を呼び出すようにする
jest.mock('next/link', () => {
  const MockLink = ({ children, href }) => {
    const { useRouter } = require('next/router');
    const router = useRouter();
    return (
      <a
        href={href}
        onClick={(e) => {
          e.preventDefault();
          router.push(href);
        }}
      >
        {children}
      </a>
    );
  };
  MockLink.displayName = 'MockLink';
  return MockLink;
});

jest.mock('next/image', () => ({
  __esModule: true,
  // eslint-disable-next-line @next/next/no-img-element
  default: ({ src, alt, ...props }) => <img src={src} alt={alt} {...props} />,
}));

jest.mock('../contexts/GoalsContext', () => ({
  useGoals: jest.fn(),
}));

jest.mock('../components/Layout', () => {
  const MockedLayout = ({ children }) => <div data-testid="layout">{children}</div>;
  return MockedLayout;
});

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

jest.mock('../contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

// 4. グローバルの`fetch`をモック
global.fetch = jest.fn();

describe('CompletedGoal Component', () => {
  const mockGoals = [
    {
      id: 1,
      title: 'Test Goal 1',
      completed: true,
      completed_time: '2024-01-01T12:00:00Z',
    },
    {
      id: 2,
      title: 'Test Goal 2',
      completed: true,
      completed_time: '2024-02-01T12:00:00Z',
    },
    {
      id: 3,
      title: 'Completed Goal 3',
      completed: true,
      completed_time: '2024-03-01T12:00:00Z',
    },
    {
      id: 4,
      title: 'Incomplete Goal 1',
      completed: false,
      completed_time: null,
    },
    {
      id: 5,
      title: 'Completed Goal 4',
      completed: true,
      completed_time: '2024-04-01T12:00:00Z',
    },
    {
      id: 6,
      title: 'Incomplete Goal 2',
      completed: false,
      completed_time: null,
    },
  ];

  // 追加: mockMixedGoals の定義
  const mockMixedGoals = [
    {
      id: 3,
      title: 'Completed Goal 3',
      completed: true,
      completed_time: '2024-03-01T12:00:00Z',
    },
    {
      id: 4,
      title: 'Incomplete Goal 1',
      completed: false,
      completed_time: null,
    },
    {
      id: 5,
      title: 'Completed Goal 4',
      completed: true,
      completed_time: '2024-04-01T12:00:00Z',
    },
    {
      id: 6,
      title: 'Incomplete Goal 2',
      completed: false,
      completed_time: null,
    },
  ];

  let mockPush;

  beforeEach(() => {
    // `useRouter`が返す`push`関数をモック
    mockPush = jest.fn();
    useRouter.mockReturnValue({ push: mockPush });

    // `useGoals`フックをモック
    useGoals.mockReturnValue({ refresh: false });

		useAuth.mockReturnValue({
      isLoggedIn: true,
      userRank: 20,
    });

    // `fetch`のモックレスポンスを設定
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => mockGoals,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

	it('renders the correct title and displays goals list', async () => {
		render(<CompletedGoal />);
	
		// 正しいタイトルが表示されていることを確認
		const titleElement = screen.getByText(/These are your Completed Goals!/i);
		expect(titleElement).toBeInTheDocument();
	
		// completed: true のゴールのみが表示されていることを確認
		const completedGoals = mockGoals.filter(goal => goal.completed);
		const goalLinks = await screen.findAllByRole('link');
		expect(goalLinks).toHaveLength(completedGoals.length);
	
		// 各completed: true のゴールタイトルが表示されていることを確認
		completedGoals.forEach(goal => {
			expect(screen.getByText(goal.title)).toBeInTheDocument();
		});
	});

  it('renders the Layout component correctly', () => {
    render(<CompletedGoal />);

    // Layout コンポーネントが正しくレンダリングされていることを確認
    const layoutElement = screen.getByTestId('layout');
    expect(layoutElement).toBeInTheDocument();
  });

  it('navigates to the goal detail page when a goal title is clicked', async () => {
    render(<CompletedGoal />);

    // 目標タイトルが表示されるのを待つ
    const goalLink = await screen.findByText('Test Goal 1');

    // リンクをクリック
    fireEvent.click(goalLink);

    // 目標詳細ページに遷移したことを確認
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/goals/1');
    });
  });

	it('redirects to login page if user is not logged in', async () => {
		// ユーザーがログインしていない状態をモック
		useAuth.mockReturnValue({
			isLoggedIn: false,
			userRank: null,
		});
	
		render(<CompletedGoal />);
	
		// リダイレクトが実行されるまで待機
		await waitFor(() => {
			expect(mockPush).toHaveBeenCalledWith('/login');
		});
	});

	it('filters and displays only completed goals when fetchGoals succeeds', async () => {
		// `fetch`のモックを上書きして、混在したゴールデータを返すように設定
		global.fetch.mockResolvedValueOnce({
			ok: true,
			json: async () => mockMixedGoals,
		});
	
		render(<CompletedGoal />);
	
		// 完了済みのゴールが表示されていることを確認
		const completedGoal1 = await screen.findByText('Completed Goal 3');
		const completedGoal2 = await screen.findByText('Completed Goal 4');
	
		expect(completedGoal1).toBeInTheDocument();
		expect(completedGoal2).toBeInTheDocument();
	
		// 不完了のゴールが表示されていないことを確認
		const incompleteGoal1 = screen.queryByText('Incomplete Goal 1');
		const incompleteGoal2 = screen.queryByText('Incomplete Goal 2');
	
		expect(incompleteGoal1).not.toBeInTheDocument();
		expect(incompleteGoal2).not.toBeInTheDocument();
	
		// 表示されているゴールの数がcompleted:trueのものだけであることを確認
		const goalLinks = screen.getAllByRole('link');
		expect(goalLinks).toHaveLength(2);
	
		// 表示されているゴールが正しいことを確認
		expect(screen.getByText('Completed Goal 3')).toBeInTheDocument();
		expect(screen.getByText('Completed Goal 4')).toBeInTheDocument();
	});
	
	it('displays images with correct src paths for each completed goal', async () => {
		render(<CompletedGoal />);
	
		// completed: true のゴールのみが表示されていることを確認
		const completedGoals = mockGoals.filter(goal => goal.completed);
	
		// 画像を `alt="Trophy"` で検索
		const goalImages = await screen.findAllByAltText('Trophy');
	
		// 完了済みゴール数と画像数が一致することを確認
		expect(goalImages).toHaveLength(completedGoals.length);
	
		// 各画像のsrcが正しいことを確認
		goalImages.forEach(img => {
			expect(img).toHaveAttribute('src');
			// Next.js の画像最適化パスを考慮して、元の画像パスが含まれていることを確認
			expect(img.getAttribute('src')).toContain('/images/trophy.png');
		});
	
		// 不完了のゴールに関連する画像が表示されていないことを確認
		const incompleteGoals = mockGoals.filter(goal => !goal.completed);
		incompleteGoals.forEach(goal => {
			const goalImage = screen.queryByAltText(goal.title);
			expect(goalImage).not.toBeInTheDocument();
		});
	});
	
	it('refreshes goals list when refresh changes', async () => {
		// 1. 初期のゴールデータを設定
		const initialGoals = [
			{
				id: 1,
				title: 'Initial Goal 1',
				completed: true,
				completed_time: '2024-01-01T12:00:00Z',
			},
			{
				id: 2,
				title: 'Initial Goal 2',
				completed: true,
				completed_time: '2024-02-01T12:00:00Z',
			},
		];
	
		// 2. `fetch` のモックを設定
		let fetchMock = jest.fn().mockResolvedValue({
			ok: true,
			json: async () => initialGoals,
		});
		global.fetch = fetchMock;
	
		// 3. `useGoals` のモックを設定
		// `refresh` を変更できるように、`useGoals` の戻り値を制御します。
		let refreshValue = false;
		const setRefreshValue = (value) => {
			refreshValue = value;
			// モックを更新
			useGoals.mockReturnValue({
				refresh: refreshValue,
				// 他の必要なプロパティもモック
			});
		};
	
		// 初期の `useGoals` モックを設定
		useGoals.mockReturnValue({
			refresh: refreshValue,
			// 他の必要なプロパティもモック
		});
	
		// 4. コンポーネントをレンダリング
		const { rerender } = render(<CompletedGoal />);
	
		// 5. 初期のゴールが表示されていることを確認
		const initialGoal1 = await screen.findByText('Initial Goal 1');
		const initialGoal2 = await screen.findByText('Initial Goal 2');
		expect(initialGoal1).toBeInTheDocument();
		expect(initialGoal2).toBeInTheDocument();
	
		// 6. 新しいゴールデータを設定
		const updatedGoals = [
			{
				id: 3,
				title: 'Updated Goal 1',
				completed: true,
				completed_time: '2024-03-01T12:00:00Z',
			},
			{
				id: 4,
				title: 'Updated Goal 2',
				completed: true,
				completed_time: '2024-04-01T12:00:00Z',
			},
		];
	
		// 7. `fetch` のモックを更新
		fetchMock.mockResolvedValueOnce({
			ok: true,
			json: async () => updatedGoals,
		});
	
		// 8. `refresh` の値を変更
		setRefreshValue(true);
	
		// 9. コンポーネントを再レンダリング
		rerender(<CompletedGoal />);
	
		// 10. 新しいゴールが表示されていることを確認
		const updatedGoal1 = await screen.findByText('Updated Goal 1');
		const updatedGoal2 = await screen.findByText('Updated Goal 2');
		expect(updatedGoal1).toBeInTheDocument();
		expect(updatedGoal2).toBeInTheDocument();
	
		// 11. 初期のゴールが表示されていないことを確認
		expect(screen.queryByText('Initial Goal 1')).not.toBeInTheDocument();
		expect(screen.queryByText('Initial Goal 2')).not.toBeInTheDocument();
	});
	
	it('displays completion dates in the correct format for each completed goal', async () => {
		render(<CompletedGoal />);
	
		// 達成済みのゴールのみを取得
		const completedGoals = mockGoals.filter(goal => goal.completed);
	
		for (const goal of completedGoals) {
			// コンポーネントと同じロケールとオプションで日付をフォーマット
			const expectedDate = new Date(goal.completed_time).toLocaleDateString('en-US', {
				year: 'numeric',
				month: 'numeric',
				day: 'numeric',
			});
	
			// ゴールの達成日が表示されているか確認
			const dateElement = await screen.findByText(`達成日: ${expectedDate}`);
			expect(dateElement).toBeInTheDocument();
		}
	});
	
	it('handles fetchGoals failure and logs error message', async () => {
    // 1. `fetch` をモックしてエラーを投げるように設定
    const fetchError = new Error('Failed to fetch goals');
    global.fetch.mockRejectedValueOnce(fetchError);

    // 2. `console.error` をスパイ
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    // 3. コンポーネントをレンダリング
    render(<CompletedGoal />);

    // 4. `console.error` が期待通りに呼ばれたことを確認
    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching data:', fetchError);
    });

    // 5. スパイを元に戻す
    consoleErrorSpy.mockRestore();
  });

	it('handles non-array data response and logs error message', async () => {
		// 1. `fetch` をモックして、配列でないデータを返す
		const invalidData = { message: 'This is not an array' };
		global.fetch.mockResolvedValueOnce({
			ok: true,
			json: async () => invalidData,
		});
	
		// 2. `console.error` をスパイ
		const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
	
		// 3. コンポーネントをレンダリング
		render(<CompletedGoal />);
	
		// 4. `console.error` が期待通りに呼ばれたことを確認
		await waitFor(() => {
			expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching data:', expect.any(Error));
	
			// エラーオブジェクトのメッセージを確認
			const errorArg = consoleErrorSpy.mock.calls[0][1];
			expect(errorArg.message).toBe('Data is not an array');
		});
	
		// 5. スパイを元に戻す
		consoleErrorSpy.mockRestore();
	});
	
});
