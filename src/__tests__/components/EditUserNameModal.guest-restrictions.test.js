import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useRouter } from 'next/router';
import EditUserNameModal from '../../components/EditUserNameModal';
import { fetchWithAuth } from '../../utils/fetchWithAuth';

// Mock外部依存関係
jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

jest.mock('../../utils/fetchWithAuth');

const mockRouter = {
  push: jest.fn(),
};

describe('EditUserNameModal - ゲスト制限機能', () => {
  beforeEach(() => {
    useRouter.mockReturnValue(mockRouter);
    jest.clearAllMocks();
  });

  describe('ユーザーネーム編集制限', () => {
    test('通常ユーザー（is_guest: false）の場合、ユーザーネーム編集フォームが正常に動作する', async () => {
      const userData = {
        id: 1,
        name: 'テストユーザー',
        email: 'user@example.com',
        is_guest: false
      };

      render(
        <EditUserNameModal
          isOpen={true}
          onClose={() => {}}
          currentName="テストユーザー"
          onUserUpdate={() => {}}
          userData={userData}
        />
      );

      // フォーム要素が存在し、入力可能であることを確認
      const nameInput = screen.getByDisplayValue('テストユーザー');
      const submitButton = screen.getByText('変更');

      expect(nameInput).toBeInTheDocument();
      expect(nameInput).not.toBeDisabled();
      expect(submitButton).toBeInTheDocument();
      expect(submitButton).not.toBeDisabled();

      // 入力が可能であることを確認
      fireEvent.change(nameInput, { target: { value: '新しい名前' } });
      expect(nameInput.value).toBe('新しい名前');
    });

    test('ゲストユーザー（is_guest: true）の場合、フォーム入力が制限される', async () => {
      const userData = {
        id: 1,
        name: 'ゲストユーザー',
        email: 'guest@example.com',
        is_guest: true
      };

      render(
        <EditUserNameModal
          isOpen={true}
          onClose={() => {}}
          currentName="ゲストユーザー"
          onUserUpdate={() => {}}
          userData={userData}
        />
      );

      // フォーム要素が無効化されていることを確認
      const nameInput = screen.getByDisplayValue('ゲストユーザー');
      const submitButton = screen.getByText('変更');

      expect(nameInput).toBeDisabled();
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

      render(
        <EditUserNameModal
          isOpen={true}
          onClose={() => {}}
          currentName="ゲストユーザー"
          onUserUpdate={() => {}}
          userData={userData}
        />
      );

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

      render(
        <EditUserNameModal
          isOpen={true}
          onClose={() => {}}
          currentName="ゲストユーザー"
          onUserUpdate={() => {}}
          userData={userData}
        />
      );

      const submitButton = screen.getByText('変更');
      expect(submitButton).toBeDisabled();

      // フォーム送信がされないことを確認
      fireEvent.click(submitButton);
      expect(fetchWithAuth).not.toHaveBeenCalled();
    });

    test('通常ユーザーがフォーム送信すると正常に送信される', async () => {
      const userData = {
        id: 1,
        name: 'テストユーザー',
        email: 'user@example.com',
        is_guest: false
      };

      fetchWithAuth.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ user: { name: '更新されたユーザー' } })
      });

      const onUserUpdate = jest.fn();
      const onClose = jest.fn();

      render(
        <EditUserNameModal
          isOpen={true}
          onClose={onClose}
          currentName="テストユーザー"
          onUserUpdate={onUserUpdate}
          userData={userData}
        />
      );

      const nameInput = screen.getByDisplayValue('テストユーザー');
      const submitButton = screen.getByText('変更');

      // 名前を変更
      fireEvent.change(nameInput, { target: { value: '更新されたユーザー' } });
      
      // フォーム送信
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(fetchWithAuth).toHaveBeenCalledWith('/api/current_user', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user: { name: '更新されたユーザー' } })
        });
      });
    });
  });
});