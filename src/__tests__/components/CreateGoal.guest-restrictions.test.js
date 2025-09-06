import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useRouter } from 'next/router';
import NewGoalModal from '../../components/CreateGoal';
import { fetchWithAuth } from '../../utils/fetchWithAuth';

// Mock外部依存関係
jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

jest.mock('../../utils/fetchWithAuth');

const mockRouter = {
  push: jest.fn(),
};

// ユーザーデータをprops経由で受け取るテスト用ラッパー
const CreateGoalWrapper = ({ isOpen, onClose, userData }) => {
  return (
    <div>
      {/* ゲスト制限を適用したNewGoalModal */}
      <NewGoalModal 
        isOpen={isOpen} 
        onClose={onClose}
        userData={userData}
      />
    </div>
  );
};

describe('CreateGoal - ゲスト制限機能', () => {
  beforeEach(() => {
    useRouter.mockReturnValue(mockRouter);
    jest.clearAllMocks();
  });

  describe('Goal入力制限', () => {
    test('通常ユーザー（is_guest: false）の場合、Goal作成フォームが正常に動作する', async () => {
      const userData = {
        id: 1,
        name: 'テストユーザー',
        email: 'user@example.com',
        is_guest: false
      };

      render(<CreateGoalWrapper isOpen={true} onClose={() => {}} userData={userData} />);

      // フォーム要素が存在し、入力可能であることを確認
      const titleInput = screen.getByLabelText(/Goalのタイトル/i);
      const contentTextarea = screen.getByLabelText(/Goalの詳細/i);
      const deadlineInput = screen.getByLabelText(/期限/i);
      const submitButton = screen.getByText('設定する');

      expect(titleInput).toBeInTheDocument();
      expect(titleInput).not.toBeDisabled();
      expect(contentTextarea).toBeInTheDocument();
      expect(contentTextarea).not.toBeDisabled();
      expect(deadlineInput).toBeInTheDocument();
      expect(deadlineInput).not.toBeDisabled();
      expect(submitButton).toBeInTheDocument();
      expect(submitButton).not.toBeDisabled();

      // 入力が可能であることを確認
      fireEvent.change(titleInput, { target: { value: 'テストゴール' } });
      expect(titleInput.value).toBe('テストゴール');
    });

    test('ゲストユーザー（is_guest: true）の場合、フォーム入力が制限される', async () => {
      const userData = {
        id: 1,
        name: 'ゲストユーザー',
        email: 'guest@example.com',
        is_guest: true
      };

      render(<CreateGoalWrapper isOpen={true} onClose={() => {}} userData={userData} />);

      // フォーム要素が無効化されていることを確認
      const titleInput = screen.getByLabelText(/Goalのタイトル/i);
      const contentTextarea = screen.getByLabelText(/Goalの詳細/i);
      const deadlineInput = screen.getByLabelText(/期限/i);
      const submitButton = screen.getByText('設定する');

      expect(titleInput).toBeDisabled();
      expect(contentTextarea).toBeDisabled();
      expect(deadlineInput).toBeDisabled();
      expect(submitButton).toBeDisabled();

      // ゲスト制限メッセージが表示されることを確認
      expect(screen.getByText('不適切な投稿を避けるため、入力できません')).toBeInTheDocument();
    });

    test('ゲストユーザーが入力フィールドにフォーカスした際、警告メッセージが表示される', async () => {
      const userData = {
        id: 1,
        name: 'ゲストユーザー',
        email: 'guest@example.com',
        is_guest: true
      };

      render(<CreateGoalWrapper isOpen={true} onClose={() => {}} userData={userData} />);

      // 警告メッセージが表示されることを確認
      expect(screen.getByText('不適切な投稿を避けるため、入力できません')).toBeInTheDocument();
    });

    test('ゲストユーザーがフォーム送信を試みても送信されない', async () => {
      const userData = {
        id: 1,
        name: 'ゲストユーザー',
        email: 'guest@example.com',
        is_guest: true
      };

      render(<CreateGoalWrapper isOpen={true} onClose={() => {}} userData={userData} />);

      const submitButton = screen.getByText('設定する');
      expect(submitButton).toBeDisabled();

      // フォーム送信がされないことを確認
      fireEvent.click(submitButton);
      expect(fetchWithAuth).not.toHaveBeenCalled();
    });
  });
});