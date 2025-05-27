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
});