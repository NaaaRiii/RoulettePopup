import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import EditUserNameModal from '../components/EditUserNameModal';
import { fetchWithAuth } from '../utils/fetchWithAuth';

// fetchWithAuth のモック
jest.mock('../utils/fetchWithAuth');

// useRouter のモック
jest.mock('next/router', () => ({
  useRouter: () => ({
    replace: jest.fn()
  })
}));

describe('EditUserNameModal コンポーネント', () => {
  beforeEach(() => {
    // モックのリセット
    jest.clearAllMocks();
  });

  it('isOpen=false のとき、何もレンダリングされない', () => {
    const { container } = render(
      <EditUserNameModal 
        isOpen={false} 
        onClose={() => {}} 
        currentName="テストユーザー"
      />
    );
    
    // コンテナが空であることを確認
    expect(container).toBeEmptyDOMElement();
  });

  it('isOpen=true のとき、オーバーレイとフォームがレンダリングされる', () => {
    render(
      <EditUserNameModal 
        isOpen={true} 
        onClose={() => {}} 
        currentName="テストユーザー"
      />
    );
    
    // モーダルのオーバーレイが存在することを確認
    const modalOverlay = document.querySelector('.modalOverlay');
    expect(modalOverlay).toBeInTheDocument();

    // モーダルのコンテンツが存在することを確認
    const modalContent = document.querySelector('.modalContent');
    expect(modalContent).toBeInTheDocument();

    // タイトルが表示されていることを確認
    expect(screen.getByText('ユーザー名を編集')).toBeInTheDocument();

    // フォームの要素が存在することを確認
    expect(screen.getByLabelText('新しいユーザー名')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toHaveValue('テストユーザー');

    // ボタンが存在することを確認
    expect(screen.getByRole('button', { name: '変更' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
  });

  it('currentName を渡したとき、<textarea> の value が currentName で初期化されている', () => {
    const testName = 'テストユーザー名';
    
    render(
      <EditUserNameModal 
        isOpen={true} 
        onClose={() => {}} 
        currentName={testName}
      />
    );
    
    // textarea が存在し、currentName の値で初期化されていることを確認
    const textarea = screen.getByRole('textbox');
    expect(textarea).toBeInTheDocument();
    expect(textarea).toHaveValue(testName);
  });

  it('currentName が undefined のとき、<textarea> の value が空文字列で初期化されている', () => {
    render(
      <EditUserNameModal 
        isOpen={true} 
        onClose={() => {}} 
        currentName={undefined}
      />
    );
    
    // textarea が存在し、空文字列で初期化されていることを確認
    const textarea = screen.getByRole('textbox');
    expect(textarea).toBeInTheDocument();
    expect(textarea).toHaveValue('');
  });

  it('<textarea> に文字をタイプすると内部ステート newName が更新され、value に反映される', () => {
    render(
      <EditUserNameModal 
        isOpen={true} 
        onClose={() => {}} 
        currentName="初期値"
      />
    );
    
    // textarea を取得
    const textarea = screen.getByRole('textbox');
    expect(textarea).toBeInTheDocument();
    expect(textarea).toHaveValue('初期値');

    // 新しい値を入力
    const newValue = '新しいユーザー名';
    fireEvent.change(textarea, { target: { value: newValue } });

    // 値が更新されていることを確認
    expect(textarea).toHaveValue(newValue);
  });

  it('「Close」ボタンをクリックすると onClose コールバックが呼ばれる', () => {
    // onClose のモック関数を作成
    const handleClose = jest.fn();
    
    render(
      <EditUserNameModal 
        isOpen={true} 
        onClose={handleClose} 
        currentName="テストユーザー"
      />
    );
    
    // Close ボタンを取得してクリック
    const closeButton = screen.getByRole('button', { name: 'Close' });
    expect(closeButton).toBeInTheDocument();
    fireEvent.click(closeButton);

    // onClose が1回呼ばれたことを確認
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('フォーム送信時に fetchWithAuth が正しく呼ばれる', async () => {
    // fetchWithAuth のモック実装
    fetchWithAuth.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ username: '新しいユーザー名' })
    });

    // useRouter のモック
    const mockReplace = jest.fn();
    jest.spyOn(require('next/router'), 'useRouter').mockImplementation(() => ({
      replace: mockReplace
    }));

    render(
      <EditUserNameModal 
        isOpen={true} 
        onClose={() => {}} 
        currentName="テストユーザー"
      />
    );
    
    // 新しいユーザー名を入力
    const textarea = screen.getByRole('textbox');
    const newName = '新しいユーザー名';
    fireEvent.change(textarea, { target: { value: newName } });

    // フォームを送信
    const submitButton = screen.getByRole('button', { name: '変更' });
    fireEvent.click(submitButton);

    // fetchWithAuth が正しく呼ばれたことを確認
    await waitFor(() => {
      expect(fetchWithAuth).toHaveBeenCalledTimes(1);
      expect(fetchWithAuth).toHaveBeenCalledWith(
        '/api/current_user',
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user: { username: newName } })
        }
      );
    });
  });

  it('レスポンスが ok: true のとき、response.json() が呼ばれたあとに router.replace が呼ばれる', async () => {
    // モックのレスポンスデータ
    const mockResponseData = { username: '新しいユーザー名' };
    
    // fetchWithAuth のモック実装
    fetchWithAuth.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponseData)
    });

    // useRouter のモック
    const mockReplace = jest.fn();
    jest.spyOn(require('next/router'), 'useRouter').mockImplementation(() => ({
      replace: mockReplace
    }));

    render(
      <EditUserNameModal 
        isOpen={true} 
        onClose={() => {}} 
        currentName="テストユーザー"
      />
    );
    
    // 新しいユーザー名を入力
    const textarea = screen.getByRole('textbox');
    const newName = '新しいユーザー名';
    fireEvent.change(textarea, { target: { value: newName } });

    // フォームを送信
    const submitButton = screen.getByRole('button', { name: '変更' });
    fireEvent.click(submitButton);

    // 非同期処理の完了を待つ
    await waitFor(() => {
      // fetchWithAuth が呼ばれたことを確認
      expect(fetchWithAuth).toHaveBeenCalledTimes(1);
      
      // router.replace が正しく呼ばれたことを確認
      expect(mockReplace).toHaveBeenCalledTimes(1);
      expect(mockReplace).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('フォーム送信成功時に onClose が呼ばれる', async () => {
    // モックの設定
    const handleClose = jest.fn();
    fetchWithAuth.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ username: '新しいユーザー名' })
    });

    render(
      <EditUserNameModal 
        isOpen={true} 
        onClose={handleClose} 
        currentName="テストユーザー"
      />
    );
    
    // フォームを送信
    const submitButton = screen.getByRole('button', { name: '変更' });
    fireEvent.click(submitButton);

    // 非同期処理の完了を待つ
    await waitFor(() => {
      expect(handleClose).toHaveBeenCalledTimes(1);
    });
  });

  it('フォーム送信失敗時に onClose が呼ばれる', async () => {
    // モックの設定
    const handleClose = jest.fn();
    fetchWithAuth.mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: '更新に失敗しました' })
    });

    render(
      <EditUserNameModal 
        isOpen={true} 
        onClose={handleClose} 
        currentName="テストユーザー"
      />
    );
    
    // フォームを送信
    const submitButton = screen.getByRole('button', { name: '変更' });
    fireEvent.click(submitButton);

    // 非同期処理の完了を待つ
    await waitFor(() => {
      expect(handleClose).toHaveBeenCalledTimes(1);
    });
  });

  it('レスポンスが ok: false のとき、console.error が呼ばれる', async () => {
    // エラーデータの設定
    const errorData = { error: '更新に失敗しました' };
    
    // fetchWithAuth のモック実装
    fetchWithAuth.mockResolvedValue({
      ok: false,
      json: () => Promise.resolve(errorData)
    });

    // console.error のモック
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <EditUserNameModal 
        isOpen={true} 
        onClose={() => {}} 
        currentName="テストユーザー"
      />
    );
    
    // フォームを送信
    const submitButton = screen.getByRole('button', { name: '変更' });
    fireEvent.click(submitButton);

    // 非同期処理の完了を待つ
    await waitFor(() => {
      // console.error が正しく呼ばれたことを確認
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error updating user name:',
        errorData
      );
    });

    // モックをリセット
    consoleErrorSpy.mockRestore();
  });

  it('APIエラー時に console.error が呼ばれたあとに onClose が呼ばれる', async () => {
    // エラーデータの設定
    const errorData = { error: '更新に失敗しました' };
    
    // fetchWithAuth のモック実装
    fetchWithAuth.mockResolvedValue({
      ok: false,
      json: () => Promise.resolve(errorData)
    });

    // console.error のモック
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // onClose のモック
    const handleClose = jest.fn();

    render(
      <EditUserNameModal 
        isOpen={true} 
        onClose={handleClose} 
        currentName="テストユーザー"
      />
    );
    
    // フォームを送信
    const submitButton = screen.getByRole('button', { name: '変更' });
    fireEvent.click(submitButton);

    // 非同期処理の完了を待つ
    await waitFor(() => {
      // console.error が正しく呼ばれたことを確認
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error updating user name:',
        errorData
      );

      // onClose が呼ばれたことを確認
      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    // モックをリセット
    consoleErrorSpy.mockRestore();
  });

  it('fetchWithAuth が例外を投げたとき、エラーハンドリングが正しく行われる', async () => {
    // 例外の設定
    const error = new Error('Network error');
    
    // fetchWithAuth のモック実装（例外を投げる）
    fetchWithAuth.mockRejectedValue(error);

    // console.error のモック
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // onClose のモック
    const handleClose = jest.fn();

    render(
      <EditUserNameModal 
        isOpen={true} 
        onClose={handleClose} 
        currentName="テストユーザー"
      />
    );
    
    // フォームを送信
    const submitButton = screen.getByRole('button', { name: '変更' });
    fireEvent.click(submitButton);

    // 非同期処理の完了を待つ
    await waitFor(() => {
      // console.error が正しく呼ばれたことを確認
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Submission failed',
        error
      );

      // onClose が呼ばれたことを確認
      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    // モックをリセット
    consoleErrorSpy.mockRestore();
  });
}); 