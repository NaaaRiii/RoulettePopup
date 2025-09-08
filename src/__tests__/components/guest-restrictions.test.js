import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

// Next.js Router を先にモックする（useRouterエラー回避のため）
jest.mock('next/router', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    pathname: '/',
    query: {},
    prefetch: jest.fn(),
    events: { on: jest.fn(), off: jest.fn() },
  })),
}));

// next/link の簡易モック
jest.mock('next/link', () => {
  const MockLink = ({ children, href, onClick }) => (
    <a href={href || '#'} onClick={onClick}>
      {children}
    </a>
  );
  MockLink.displayName = 'MockLink';
  return MockLink;
});

// fetchWithAuth をモック（EditGoalModal の初期ロードで使用）
jest.mock('../../utils/fetchWithAuth', () => ({
  fetchWithAuth: jest.fn(async () => ({
    ok: true,
    json: async () => ({ title: 'Goal A', content: 'Content', deadline: '2024-01-01' }),
    text: async () => ''
  }))
}));

// 依存のモック定義の後でコンポーネントを読み込む
const GoalHeader = require('../../components/GoalHeader').default;
const SmallGoalList = require('../../components/SmallGoalList').default;
const EditGoalModal = require('../../components/EditGoal').default;
const SmallGoalCard = require('../../components/SmallGoalCard').default;

describe('ゲスト制限 - コンポーネント挙動確認', () => {
  const userGuest = { id: 1, name: 'Guest', is_guest: true };
  const userNormal = { id: 2, name: 'User', is_guest: false };

  const sampleGoal = {
    id: 101,
    title: 'Goal A',
    content: 'Content',
    deadline: '2024-01-01',
    completed: false,
    small_goals: [
      {
        id: 201,
        title: 'SG1',
        difficulty: '普通',
        deadline: '2024-01-05',
        completed: false,
        tasks: [
          { id: 1, content: 'T1', completed: true },
          { id: 2, content: 'T2', completed: true }
        ]
      }
    ]
  };

  describe('GoalHeader', () => {
    const defaultHandlers = {
      onCompleteGoal: jest.fn(),
      onOpenEditGoalModal: jest.fn(),
      onOpenCreateSmallGoalModal: jest.fn(),
      onCloseEditGoalModal: jest.fn(),
      onCloseCreateSmallGoalModal: jest.fn(),
      onGoalUpdated: jest.fn(),
      onSmallGoalAdded: jest.fn(),
      onDeleteGoal: jest.fn(),
    };

    beforeEach(() => jest.clearAllMocks());

    test('ゲスト: 編集/作成/削除はリンクにならず無効表示', () => {
      render(
        <GoalHeader
          goal={sampleGoal}
          goalId={String(sampleGoal.id)}
          isEditGoalModalOpen={false}
          isCreateSmallGoalModalOpen={false}
          userData={userGuest}
          {...defaultHandlers}
        />
      );

      // 編集: テキストは表示されるがリンクではない
      expect(screen.getByText('Goalを編集する')).toBeInTheDocument();
      expect(screen.queryByRole('link', { name: 'Goalを編集する' })).not.toBeInTheDocument();

      // Small Goal作成: リンクではなく無効ボタン表示
      expect(screen.getByText('Small Goalを作成')).toBeInTheDocument();
      expect(screen.queryByRole('link', { name: 'Small Goalを作成' })).not.toBeInTheDocument();

      // Goal削除: リンクではない（data-testid付きのリンクが存在しない）
      expect(screen.getByText('Goalを削除する')).toBeInTheDocument();
      expect(screen.queryByTestId('delete-goal-link')).not.toBeInTheDocument();
    });

    test('通常ユーザー: 編集/作成/削除リンクが活性化', () => {
      render(
        <GoalHeader
          goal={sampleGoal}
          goalId={String(sampleGoal.id)}
          isEditGoalModalOpen={false}
          isCreateSmallGoalModalOpen={false}
          userData={userNormal}
          {...defaultHandlers}
        />
      );

      expect(screen.getByRole('link', { name: 'Goalを編集する' })).toBeInTheDocument();
      // 絵文字付きの可能性があるため部分一致の正規表現で確認
      expect(screen.getByRole('link', { name: /Small Goalを作成/ })).toBeInTheDocument();
      expect(screen.getByTestId('delete-goal-link')).toBeInTheDocument();
    });
  });

  describe('EditGoalModal', () => {
    test('ゲスト: 入力および送信が無効化、警告表示', () => {
      render(
        <EditGoalModal
          isOpen={true}
          onClose={() => {}}
          goalId={sampleGoal.id}
          onGoalUpdated={() => {}}
          userData={userGuest}
        />
      );

      expect(screen.getByText('Goalを編集しよう！')).toBeInTheDocument();
      expect(screen.getByText('不適切な投稿を避けるため、編集できません')).toBeInTheDocument();

      const title = screen.getByLabelText('Goalのタイトル');
      const content = screen.getByLabelText('Goalの詳細');
      const deadline = screen.getByLabelText('期限');
      const submit = screen.getByRole('button', { name: '更新する' });

      expect(title).toBeDisabled();
      expect(content).toBeDisabled();
      expect(deadline).toBeDisabled();
      expect(submit).toBeDisabled();
    });
  });

  describe('EditSmallGoalModal（SmallGoalList経由）', () => {
    test('ゲスト: 小Goal編集モーダルで入力/送信が無効化、警告表示', () => {
      const sg = sampleGoal.small_goals[0];
      render(
        <SmallGoalList
          goal={sampleGoal}
          selectedSmallGoal={sg}
          isEditSmallGoalModalOpen={true}
          onCloseEditSmallGoalModal={() => {}}
          onTaskToggle={() => {}}
          onCompleteSmallGoal={() => {}}
          onOpenEditSmallGoalModal={() => {}}
          onDeleteSmallGoal={() => {}}
          onSmallGoalUpdated={() => {}}
          setGoal={() => {}}
          userData={userGuest}
        />
      );

      expect(screen.getByText('Small Goalを編集しよう！')).toBeInTheDocument();
      expect(screen.getByText('不適切な投稿を避けるため、編集できません')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '更新する' })).toBeDisabled();
    });
  });

  describe('SmallGoalCard - 完了ボタンの無効化', () => {
    test('ゲスト: 全タスク完了時でも「完了」ボタンはdisabled', () => {
      const sgAllDone = {
        ...sampleGoal.small_goals[0],
        completed: false,
        tasks: [
          { id: 1, content: 'T1', completed: true },
          { id: 2, content: 'T2', completed: true }
        ]
      };

      const handlers = {
        onTaskToggle: jest.fn(),
        onCompleteSmallGoal: jest.fn(),
        onOpenEditSmallGoalModal: jest.fn(),
        onDeleteSmallGoal: jest.fn(),
        setGoal: jest.fn(),
      };

      render(
        <SmallGoalCard
          smallGoal={sgAllDone}
          isCompleted={false}
          goal={sampleGoal}
          userData={userGuest}
          {...handlers}
        />
      );

      const completeBtn = screen.getByRole('button', { name: '完了' });
      expect(completeBtn).toBeDisabled();

      fireEvent.click(completeBtn);
      expect(handlers.onCompleteSmallGoal).not.toHaveBeenCalled();
    });
  });
});
