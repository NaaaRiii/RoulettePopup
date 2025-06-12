import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EditGoal from '../components/EditGoal';
import { fetchWithAuth } from '../utils/fetchWithAuth';
import '@testing-library/jest-dom';

// fetchWithAuth のモック
jest.mock('../utils/fetchWithAuth');

// Next.js の useRouter をモック
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    pathname: '/',
    query: {},
  }),
}));


describe('初期表示', () => {
	it('isOpen=false のとき、何もレンダリングされない', () => {
		const { container } = render(
			<EditGoal
				isOpen={false}
				onClose={() => {}}
				goalId={1}
				onGoalUpdated={() => {}}
			/>
		);
		
		// コンテナが空であることを確認
		expect(container).toBeEmptyDOMElement();
	});

	it('goalId が渡されたとき、API からデータを取得して各ステートが初期化される', async () => {
		const mockGoal = {
			title: 'テスト目標',
			content: 'テスト内容',
			deadline: '2024-03-20'
		};

		// fetch のモック実装
		global.fetch = jest.fn().mockResolvedValueOnce({
			json: () => Promise.resolve(mockGoal)
		});

		render(
			<EditGoal
				isOpen={true}
				onClose={() => {}}
				goalId={1}
				onGoalUpdated={() => {}}
			/>
		);

		// API が正しい URL で呼ばれることを確認
		expect(global.fetch).toHaveBeenCalledWith(
			`${process.env.NEXT_PUBLIC_RAILS_API_URL}/api/goals/1`,
			{ method: 'GET' }
		);

		// 各ステートが正しく初期化されることを確認
		await waitFor(() => {
			// title の初期化を確認
			const titleInput = screen.getByLabelText('目標のタイトル');
			expect(titleInput).toHaveValue(mockGoal.title);

			// content の初期化を確認
			const contentInput = screen.getByLabelText('詳細');
			expect(contentInput).toHaveValue(mockGoal.content);

			// deadline の初期化を確認
			const deadlineInput = screen.getByLabelText('期限');
			expect(deadlineInput).toHaveValue(mockGoal.deadline);
		});
	});
});

describe('formatDate 関数', () => {
	it('有効な日付文字列を渡したとき、期待する形式で返される', async () => {
		// テストケース
		const testCases = [
			{
				input: '2024-03-20T00:00:00+09:00',
				expected: '2024-03-20'
			},
			{
				input: '2024-12-31T00:00:00+09:00',
				expected: '2024-12-31'
			},
			{
				input: '2024-01-01T00:00:00+09:00',
				expected: '2024-01-01'
			}
		];

		// 各テストケースを実行
		for (const { input, expected } of testCases) {
			// fetch のモック実装
			global.fetch = jest.fn().mockResolvedValueOnce({
				json: () => Promise.resolve({
					title: 'テスト目標',
					content: 'テスト内容',
					deadline: input
				})
			});

			// コンポーネントをレンダリング
			const { unmount } = render(
				<EditGoal
					isOpen={true}
					onClose={() => {}}
					goalId={1}
					onGoalUpdated={() => {}}
				/>
			);

			// deadline フィールドが正しくフォーマットされることを確認
			await waitFor(() => {
				const deadlineInput = screen.getByLabelText('期限');
				expect(deadlineInput.value).toBe(expected);
			});

			// コンポーネントをアンマウントして次のテストケースの準備
			unmount();
		}
	});

	it('無効な日付文字列を渡したとき、エラーがログされる', async () => {
		// console.error のスパイを設定
		const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

		// 無効な日付文字列を含むデータ
		const invalidDate = 'invalid-date-string';

		// fetch のモック実装
		global.fetch = jest.fn().mockResolvedValueOnce({
			json: () => Promise.resolve({
				title: 'テスト目標',
				content: 'テスト内容',
				deadline: invalidDate
			})
		});

		// コンポーネントをレンダリング
		render(
			<EditGoal
				isOpen={true}
				onClose={() => {}}
				goalId={1}
				onGoalUpdated={() => {}}
			/>
		);

		// エラーがログに出力されることを確認
		await waitFor(() => {
			expect(consoleErrorSpy).toHaveBeenCalledWith(
				'Failed to load goal',
				expect.any(Error)
			);
		});

		// スパイをクリーンアップ
		consoleErrorSpy.mockRestore();
	});
});


describe('入力フォームの要素確認', () => {
	beforeEach(() => {
		// fetch のモックを設定
		global.fetch = jest.fn().mockResolvedValue({
			json: () => Promise.resolve({
				title: 'テスト目標',
				content: 'テスト内容',
				deadline: '2024-03-20'
			})
		});
	});

	afterEach(() => {
		// モックをクリーンアップ
		jest.clearAllMocks();
	});

	it('title の textarea が表示され、value にステート title が反映される', async () => {
		// コンポーネントをレンダリング
		render(
			<EditGoal
				isOpen={true}
				onClose={() => {}}
				goalId={1}
				onGoalUpdated={() => {}}
			/>
		);

		// title の textarea を取得
		const titleInput = await screen.findByLabelText('目標のタイトル');
		expect(titleInput).toBeInTheDocument();
		expect(titleInput.tagName).toBe('TEXTAREA');

		// 既存の値をクリアして新しい値を入力
		fireEvent.change(titleInput, { target: { value: '新しい目標タイトル' } });

		// 値が更新されていることを確認
		expect(titleInput.value).toBe('新しい目標タイトル');
	});

	it('content の textarea が表示され、value にステート content が反映される', async () => {
		// コンポーネントをレンダリング
		render(
			<EditGoal
				isOpen={true}
				onClose={() => {}}
				goalId={1}
				onGoalUpdated={() => {}}
			/>
		);

		// content の textarea を取得
		const contentInput = await screen.findByLabelText('詳細');
		expect(contentInput).toBeInTheDocument();
		expect(contentInput.tagName).toBe('TEXTAREA');

		// 既存の値をクリアして新しい値を入力
		fireEvent.change(contentInput, { target: { value: '新しい目標の詳細' } });

		// 値が更新されていることを確認
		expect(contentInput.value).toBe('新しい目標の詳細');
	});

	it('deadline の date input が表示され、value にステート deadline が反映される', async () => {
		// コンポーネントをレンダリング
		render(
			<EditGoal
				isOpen={true}
				onClose={() => {}}
				goalId={1}
				onGoalUpdated={() => {}}
			/>
		);

		// deadline の input を取得
		const deadlineInput = await screen.findByLabelText('期限');
		expect(deadlineInput).toBeInTheDocument();
		expect(deadlineInput.type).toBe('date');

		// 既存の値をクリアして新しい値を入力
		fireEvent.change(deadlineInput, { target: { value: '2024-12-31' } });

		// 値が更新されていることを確認
		expect(deadlineInput.value).toBe('2024-12-31');
	});
});