import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CompletedGoal from '../pages/completed-goal';
import { useGoals } from '../contexts/GoalsContext';
import '@testing-library/jest-dom';
import { useRouter } from 'next/router';
import { fetchWithAuth } from '../utils/fetchWithAuth';

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

jest.mock('../utils/fetchWithAuth');

jest.mock('../utils/getIdToken');

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
    mockPush = jest.fn();
    useRouter.mockReturnValue({ push: mockPush });

    useGoals.mockReturnValue({ refresh: false });

		fetchWithAuth.mockClear();
		fetchWithAuth.mockResolvedValue({ ok: true, json: async () => mockGoals });
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
		// ★ 1) 既定のモックを消す
		fetchWithAuth.mockReset();
	
		// 初期データ
		const initialGoals = [
			{ id: 1, title: 'Initial Goal 1', completed: true, completed_time: '2024-01-01T12:00:00Z' },
			{ id: 2, title: 'Initial Goal 2', completed: true, completed_time: '2024-02-01T12:00:00Z' },
		];
		// ★ 2) 1回目の呼び出し
		fetchWithAuth.mockResolvedValueOnce({ ok: true, json: async () => initialGoals });
	
		// refresh=false で初回
		useGoals.mockReturnValue({ refresh: false });
	
		const { rerender } = render(<CompletedGoal />);
	
		// 初期ゴールが表示されることを確認
		expect(await screen.findByText('Initial Goal 1')).toBeInTheDocument();
		expect(screen.getByText('Initial Goal 2')).toBeInTheDocument();
	
		// 更新データ
		const updatedGoals = [
			{ id: 3, title: 'Updated Goal 1', completed: true, completed_time: '2024-03-01T12:00:00Z' },
			{ id: 4, title: 'Updated Goal 2', completed: true, completed_time: '2024-04-01T12:00:00Z' },
		];
		// ★ 3) 2回目の呼び出し
		fetchWithAuth.mockResolvedValueOnce({ ok: true, json: async () => updatedGoals });
	
		// refresh を true に切り替え
		useGoals.mockReturnValue({ refresh: true });
	
		// 再レンダリング（Props は無いので同じ Component をもう一度）
		rerender(<CompletedGoal />);
	
		// 更新後のゴールを確認
		expect(await screen.findByText('Updated Goal 1')).toBeInTheDocument();
		expect(screen.getByText('Updated Goal 2')).toBeInTheDocument();
	
		// 旧ゴールが消えていることを確認
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
		const fetchError = new Error('Failed to fetch goals');
	
		// ★ 1) 前のモック設定を完全に削除
		fetchWithAuth.mockReset();
	
		// ★ 2) 最初の呼び出しで reject させる
		fetchWithAuth.mockRejectedValueOnce(fetchError);
	
		const consoleErrorSpy = jest
			.spyOn(console, 'error')
			.mockImplementation(() => {});
	
		render(<CompletedGoal />);
	
		// ★ 3) 呼び出しを確認し、中身を検証
		await waitFor(() => {
			expect(consoleErrorSpy).toHaveBeenCalled();
	
			const match = consoleErrorSpy.mock.calls.find(
				([first, err]) =>
					first === 'Error fetching data:' &&
					err === fetchError
			);
			expect(match).toBeTruthy();
		});
	
		consoleErrorSpy.mockRestore();
	});
	

	it('handles non-array data response and logs error message', async () => {
		// 1️⃣ まず既存のモック設定を完全にクリア
		fetchWithAuth.mockReset();
	
		// 2️⃣ 今回のテスト用に「1 回目」の返り値を non-array にする
		const invalidData = { message: 'This is not an array' };
		fetchWithAuth.mockResolvedValueOnce({
			ok: true,
			json: async () => invalidData,
		});
	
		// 3️⃣ console.error をスパイ
		const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
	
		// 4️⃣ レンダリング
		render(<CompletedGoal />);
	
		// 5️⃣ エラーログが出たか確認
		await waitFor(() => {
			expect(consoleErrorSpy).toHaveBeenCalled();
	
			// 引数チェック
			const match = consoleErrorSpy.mock.calls.find(
				([first, err]) =>
					first === 'Error fetching data:' &&
					err instanceof Error &&
					err.message === 'Data is not an array'
			);
			expect(match).toBeTruthy();
		});
	
		// 6️⃣ 後片付け
		consoleErrorSpy.mockRestore();
	});
	
});