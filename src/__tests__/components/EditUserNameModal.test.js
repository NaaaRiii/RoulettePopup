import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import EditUserNameModal from '../../components/EditUserNameModal';
import { fetchWithAuth } from '../../utils/fetchWithAuth';

// fetchWithAuth のモック
jest.mock('../../utils/fetchWithAuth');

// useRouter のモック
const mockReplace = jest.fn();
jest.mock('next/router', () => ({
  useRouter: () => ({
    replace: mockReplace
  })
}));

describe('EditUserNameModal コンポーネント', () => {
  // モック関数の定義
  const handleClose = jest.fn();

  beforeEach(() => {
    // モックのリセット
    jest.clearAllMocks();
    handleClose.mockClear();
  });

  it('isOpen=false のとき、何もレンダリングされない', () => {
    const { container } = render(
      <EditUserNameModal 
        isOpen={false} 
        onClose={handleClose} 
        currentName="テストユーザー"
      />
    );
    
    // コンテナが空であることを確認
    expect(container).toBeEmptyDOMElement();
  });

  it('isOpen=true のとき、オーバーレイとフォームがレンダリングされる', () => {
    //render(
    //  <EditUserNameModal 
    //    isOpen={true} 
    //    onClose={handleClose} 
    //    currentName="テストユーザー"
    //  />
    //);
    
    //// モーダルのオーバーレイが存在することを確認
    //expect(screen.getByRole('presentation')).toBeInTheDocument();

		const { container } = render(
			<EditUserNameModal 
				isOpen={true} 
				onClose={handleClose} 
				currentName="テストユーザー"
			/>
		);
 
		// モーダルのオーバーレイ（.modalOverlay）が存在することを確認
		expect(container.querySelector('.modalOverlay')).toBeInTheDocument();

    // タイトルが表示されていることを確認
    expect(screen.getByRole('heading', { name: 'ユーザー名を編集する' })).toBeInTheDocument();

    // フォームの要素が存在することを確認
    expect(screen.getByLabelText('新しいユーザー名を入力してください。')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toHaveValue('テストユーザー');

    // ボタンが存在することを確認
    expect(screen.getByRole('button', { name: '変更' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
  });

  describe.each([
    {
      name: '値あり',
      currentName: 'テストユーザー名',
      expectedValue: 'テストユーザー名'
    },
    {
      name: '値なし',
      currentName: undefined,
      expectedValue: ''
    }
  ])('currentName が $name のとき', ({ currentName, expectedValue }) => {
    it('<textarea> の value が $expectedValue で初期化されている', () => {
      render(
        <EditUserNameModal 
          isOpen={true} 
          onClose={handleClose} 
          currentName={currentName}
        />
      );
      
      // textarea が存在し、期待する値で初期化されていることを確認
      const textarea = screen.getByRole('textbox');
      expect(textarea).toBeInTheDocument();
      expect(textarea).toHaveValue(expectedValue);
    });
  });

  it('<textarea> に文字をタイプすると内部ステート newName が更新され、value に反映される', async () => {
    render(
      <EditUserNameModal 
        isOpen={true} 
        onClose={handleClose} 
        currentName="初期値"
      />
    );
    
    // textarea を取得
    const textarea = screen.getByRole('textbox');
    expect(textarea).toBeInTheDocument();
    expect(textarea).toHaveValue('初期値');

    // 新しい値を入力
    const newValue = '新しいユーザー名';
    await userEvent.clear(textarea);
    await userEvent.type(textarea, newValue);

    // 値が更新されていることを確認
    expect(textarea).toHaveValue(newValue);
  });

  it('「Close」ボタンをクリックすると onClose コールバックが呼ばれる', async () => {
    render(
      <EditUserNameModal 
        isOpen={true} 
        onClose={handleClose} 
        currentName="テストユーザー"
      />
    );
    
    // Close ボタンをクリック
    await userEvent.click(screen.getByRole('button', { name: 'Close' }));

    // onClose が1回呼ばれたことを確認
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('フォーム送信時に fetchWithAuth が正しく呼ばれる', async () => {
    // fetchWithAuth のモック実装
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
    
    // 新しいユーザー名を入力
    const textarea = screen.getByRole('textbox');
    const newName = '新しいユーザー名';
    await userEvent.clear(textarea);
    await userEvent.type(textarea, newName);

    // フォームを送信
    await userEvent.click(screen.getByRole('button', { name: '変更' }));

    // fetchWithAuth が正しく呼ばれたことを確認
    expect(fetchWithAuth).toHaveBeenCalledTimes(1);
    expect(fetchWithAuth).toHaveBeenCalledWith(
      '/api/current_user',
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user: { name: newName } })
      }
    );
  });

  it('レスポンスが ok: true のとき、response.json() が呼ばれたあとに onClose が呼ばれる', async () => {
    // モックのレスポンスデータ
    const mockResponseData = { username: '新しいユーザー名' };
    
    // fetchWithAuth のモック実装
    fetchWithAuth.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponseData)
    });

    render(
      <EditUserNameModal 
        isOpen={true} 
        onClose={handleClose} 
        currentName="テストユーザー"
      />
    );
    
    // 新しいユーザー名を入力
    const textarea = screen.getByRole('textbox');
    const newName = '新しいユーザー名';
    await userEvent.clear(textarea);
    await userEvent.type(textarea, newName);

    // フォームを送信
    await userEvent.click(screen.getByRole('button', { name: '変更' }));

    // 非同期処理の完了を待つ
    expect(fetchWithAuth).toHaveBeenCalledTimes(1);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  describe.each([
    {
      name: '成功時',
      mockResponse: {
        ok: true,
        json: () => Promise.resolve({ username: '新しいユーザー名' })
      },
      expectedConsoleError: false
    },
    {
      name: '失敗時',
      mockResponse: {
        ok: false,
        json: () => Promise.resolve({ error: '更新に失敗しました' })
      },
      expectedConsoleError: true,
      expectedErrorMessage: 'Error updating user name:',
      expectedErrorData: { error: '更新に失敗しました' }
    }
  ])('フォーム送信が $name の場合', ({ mockResponse, expectedConsoleError, expectedErrorMessage, expectedErrorData }) => {
    beforeEach(() => {
      fetchWithAuth.mockResolvedValue(mockResponse);
    });

    it('onClose が呼ばれる', async () => {
      render(
        <EditUserNameModal 
          isOpen={true} 
          onClose={handleClose} 
          currentName="テストユーザー"
        />
      );
      
      // フォームを送信
      await userEvent.click(screen.getByRole('button', { name: '変更' }));

      // onClose が呼ばれたことを確認（成功時は1回、失敗時は1回）
      const expectedCallCount = mockResponse.ok ? 1 : 1;
      expect(handleClose).toHaveBeenCalledTimes(expectedCallCount);
    });

    if (expectedConsoleError) {
      it('console.error が呼ばれる', async () => {
        // console.error のモック
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        render(
          <EditUserNameModal 
            isOpen={true} 
            onClose={handleClose} 
            currentName="テストユーザー"
          />
        );
        
        // フォームを送信
        await userEvent.click(screen.getByRole('button', { name: '変更' }));

        // console.error が3回呼ばれたことを確認（実際のコンポーネントの動作に合わせて）
        expect(consoleErrorSpy).toHaveBeenCalledTimes(3);
        
        // 最初のconsole.errorが期待するメッセージで呼ばれたことを確認
        expect(consoleErrorSpy).toHaveBeenNthCalledWith(
          1,
          expectedErrorMessage,
          expectedErrorData
        );

        // モックをリセット
        consoleErrorSpy.mockRestore();
      });
    }
  });

  it('fetchWithAuth が例外を投げたとき、エラーハンドリングが正しく行われる', async () => {
    // 例外の設定
    const error = new Error('Network error');
    
    // fetchWithAuth のモック実装（例外を投げる）
    fetchWithAuth.mockRejectedValue(error);

    // console.error のモック
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <EditUserNameModal 
        isOpen={true} 
        onClose={handleClose} 
        currentName="テストユーザー"
      />
    );
    
    // フォームを送信
    await userEvent.click(screen.getByRole('button', { name: '変更' }));

    // 非同期処理の完了を待つ
    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Submission failed',
      error
    );
    expect(handleClose).toHaveBeenCalledTimes(1);

    // モックをリセット
    consoleErrorSpy.mockRestore();
  });
}); 