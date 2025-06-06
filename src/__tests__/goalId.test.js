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
});
