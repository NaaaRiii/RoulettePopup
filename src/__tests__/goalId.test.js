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

describe('GoalPage ― ロード状態の表示 (Amplify 本物)', () => {
  beforeEach(() => {
    // Router クエリに goalId を注入
    useRouter.mockReturnValue({
      query: { goalId: '123' },
      push: jest.fn(),
    });

    // GoalsContext は必要最低限で OK
    useGoals.mockReturnValue({
      goalsState: [],
      setGoalsState: jest.fn(),
      refreshGoals: jest.fn(),
    });

    // API レスポンスをスタブ
    fetchWithAuth.mockImplementation((url) => {
      if (url === '/api/goals/123') {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              id: 123,
              title: 'Test Goal',
              content: 'dummy',
              deadline: '2025-06-30',
              completed: false,
            }),
        });
      }

      if (url === '/api/goals/123/small_goals') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([]),
        });
      }

      return Promise.reject(new Error(`unexpected request: ${url}`));
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('データ取得中は "Loading..." が表示され、取得完了後に消える', async () => {
    render(
			<Authenticator.Provider
				value={{ route: 'authenticated', user: { username: 'tester' } }}
			>
				<GoalPage />
			</Authenticator.Provider>
    );

    // 初期レンダリング直後
    expect(screen.getByText(/loading/i)).toBeInTheDocument();

    // 非同期 fetch が完了したら Loading が消える
    await waitForElementToBeRemoved(() => screen.queryByText(/loading/i));

    // 代わりにコンテンツが描画されているか簡易確認
    expect(screen.getByText('目標 : Test Goal')).toBeInTheDocument();
  });
});