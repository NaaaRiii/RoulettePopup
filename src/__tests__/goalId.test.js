import React from 'react';
import { render, screen, waitFor, fireEvent, waitForElementToBeRemoved } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GoalPage from '../pages/goals/[goalId]';
import { useRouter } from 'next/router';
import { useGoals } from '../contexts/GoalsContext';
import { fetchWithAuth } from '../utils/fetchWithAuth';
import { Authenticator } from '@aws-amplify/ui-react';
import '@testing-library/jest-dom';


jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

jest.mock('../contexts/GoalsContext', () => ({
  useGoals: jest.fn(),
}));

jest.mock('../utils/fetchWithAuth', () => ({
  fetchWithAuth: jest.fn(),
}));


describe('GoalPage ― 初期レンダリング／状態遷移', () => {
  beforeEach(() => {
    // 共通モック（毎テスト実行前にリセットしたいもの）
    useRouter.mockReturnValue({
      query: { goalId: 'test-id' },
      push: jest.fn(),
    });
    useGoals.mockReturnValue({
      goalsState: [],
      setGoalsState: jest.fn(),
      refreshGoals: jest.fn(),
    });
    fetchWithAuth.mockClear();
  });

  it('loading=true の間 “Loading...” が表示される', async () => {
    // 成功レスポンスをスタブ
    fetchWithAuth.mockImplementation((url) =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve(
            url.endsWith('/small_goals') ? [] : { id: 1, title: 'Goal', completed: false }
          ),
      })
    );

    render(
      <Authenticator.Provider value={{ route: 'authenticated', user: {} }}>
        <GoalPage />
      </Authenticator.Provider>
    );

    // ロード中
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
    // データ取得完了後には消える
    await waitForElementToBeRemoved(() => screen.queryByText(/loading/i));
  });

  it('API が 404 / 空データなら “Goal not found” を表示', async () => {
    // goalDetails 404
    fetchWithAuth.mockImplementation((url) => {
      if (url.includes('/small_goals')) return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
      return Promise.resolve({ ok: false, status: 404 });
    });

    render(
      <Authenticator.Provider value={{ route: 'authenticated', user: {} }}>
        <GoalPage />
      </Authenticator.Provider>
    );

    await waitForElementToBeRemoved(() => screen.queryByText(/loading/i));
    expect(screen.getByText(/goal not found/i)).toBeInTheDocument();
  });


	it('goal 取得成功で goal 情報と small goal 一覧が描画される', async () => {
		// goalDetails と small_goals の正常レスポンス
		fetchWithAuth.mockImplementation((url) => {
			if (url === '/api/goals/test-id') {
				return Promise.resolve({
					ok: true,
					json: () =>
						Promise.resolve({
							id: 1,
							title: 'Test Goal',
							content: 'Goal content',
							deadline: '2025-06-30T00:00:00Z',
							completed: false,
						}),
				});
			}
			if (url === '/api/goals/test-id/small_goals') {
				return Promise.resolve({
					ok: true,
					json: () =>
						Promise.resolve([
							{
								id: 11,
								title: 'Small A',
								difficulty: 'easy',
								deadline: '2025-06-15T00:00:00Z',
								completed: false,
								tasks: [
									{ id: 101, content: 'task-1', completed: false },
									{ id: 102, content: 'task-2', completed: true },
								],
							},
						]),
				});
			}
			return Promise.reject(new Error(`unexpected: ${url}`));
		});

		render(
			<Authenticator.Provider
				value={{ route: 'authenticated', user: {} }}
			>
				<GoalPage />
			</Authenticator.Provider>
		);

		// Loading… が消えるまで待つ
		await waitForElementToBeRemoved(() => screen.queryByText(/loading/i));

		// Goal タイトルが描画
		expect(screen.getByText('目標 : Test Goal')).toBeInTheDocument();

		// Small goal タイトルが描画
		expect(screen.getByText('Small A')).toBeInTheDocument();

		// タスク内容も表示されている
		expect(screen.getByText('task-1')).toBeInTheDocument();
		expect(screen.getByText('task-2')).toBeInTheDocument();
	});
});