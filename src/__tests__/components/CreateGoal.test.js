import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NewGoalModal from '../../components/CreateGoal';
import '@testing-library/jest-dom';
import styles from '../components/CreateGoal.module.css';
import { fetchWithAuth } from '../../utils/fetchWithAuth';

// Next.js の useRouter をモック
const mockPush = jest.fn();
jest.mock('next/router', () => ({
  useRouter: () => ({
    query: {},
    push: mockPush,
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
}));

// fetchWithAuth をモック
jest.mock('../../utils/fetchWithAuth');

// console.error をモック
const originalConsoleError = console.error;
console.error = jest.fn();

describe('NewGoalModal', () => {
  beforeEach(() => {
    // 各テスト前にモックをリセット
    jest.clearAllMocks();
  });

  afterAll(() => {
    // テスト終了後に console.error を元に戻す
    console.error = originalConsoleError;
  });

  it('isOpen=false のとき、何もレンダリングされない', () => {
    const { container } = render(
      <NewGoalModal
        isOpen={false}
        onClose={() => {}}
      />
    );
    
    // コンテナが空であることを確認
    expect(container).toBeEmptyDOMElement();
  });

  it('isOpen=true のとき、モーダルの要素が正しく描画される', () => {
    render(
      <NewGoalModal
        isOpen={true}
        onClose={() => {}}
      />
    );

    // モーダルのオーバーレイが存在することを確認
    const overlay = screen.getByRole('dialog');
    expect(overlay).toHaveClass(styles.modalOverlay);

    // モーダルのコンテンツが存在することを確認
    const modalContent = overlay.querySelector(`.${styles.modalContent}`);
    expect(modalContent).toBeInTheDocument();

    // タイトルが存在することを確認
    expect(screen.getByText('Goalを設定する')).toBeInTheDocument();

    // フォーム要素が存在することを確認
    expect(screen.getByLabelText('Goalのタイトル')).toBeInTheDocument();
    expect(screen.getByLabelText('Goalの詳細')).toBeInTheDocument();
    expect(screen.getByLabelText('期限')).toBeInTheDocument();

    // ボタンが存在することを確認
    expect(screen.getByText('設定する')).toBeInTheDocument();
    expect(screen.getByText('Close')).toBeInTheDocument();
  });

  it('マウント直後にフォーム要素が空文字である', () => {
    render(
      <NewGoalModal
        isOpen={true}
        onClose={() => {}}
      />
    );

    // タイトルが空文字であることを確認
    const titleInput = screen.getByLabelText('Goalのタイトル');
    expect(titleInput).toHaveValue('');

    // Contentが空文字であることを確認
    const contentInput = screen.getByLabelText('Goalの詳細');
    expect(contentInput).toHaveValue('');

    // 期限が空文字であることを確認
    const deadlineInput = screen.getByLabelText('期限');
    expect(deadlineInput).toHaveValue('');
  });

  it('タイトル欄に入力すると value が即座に更新される', async () => {
    render(
      <NewGoalModal
        isOpen={true}
        onClose={() => {}}
      />
    );

    const titleInput = screen.getByLabelText('Goalのタイトル');
    const testTitle = 'テスト目標';

    // タイトルを入力
    await userEvent.type(titleInput, testTitle);

    // 入力値が即座に更新されていることを確認
    expect(titleInput).toHaveValue(testTitle);
  });

  it('Content 欄に入力すると value が更新される', async () => {
    render(
      <NewGoalModal
        isOpen={true}
        onClose={() => {}}
      />
    );

    const contentInput = screen.getByLabelText('Goalの詳細');
    const testContent = 'テストコンテンツ';

    // Contentを入力
    await userEvent.type(contentInput, testContent);

    // 入力値が更新されていることを確認
    expect(contentInput).toHaveValue(testContent);
  });

  it('期限 <input type="date"> を変更すると value が更新される', async () => {
    render(
      <NewGoalModal
        isOpen={true}
        onClose={() => {}}
      />
    );

    const deadlineInput = screen.getByLabelText('期限');
    const testDate = '2024-12-31';

    // 期限を変更
    await userEvent.type(deadlineInput, testDate);

    // 入力値が更新されていることを確認
    expect(deadlineInput).toHaveValue(testDate);
  });

  it('「Close」ボタンをクリックすると onClose コールバックが一度だけ呼ばれる', async () => {
    // onClose のモック関数を作成
    const handleClose = jest.fn();

    render(
      <NewGoalModal
        isOpen={true}
        onClose={handleClose}
      />
    );

    // Close ボタンをクリック
    await userEvent.click(screen.getByText('Close'));

    // onClose が1回だけ呼ばれたことを確認
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('空欄が残っている状態では handleSubmit が呼ばれない（fetchWithAuth も呼ばれない）', async () => {
    render(
      <NewGoalModal
        isOpen={true}
        onClose={() => {}}
      />
    );

    // フォームを送信
    await userEvent.click(screen.getByText('設定する'));

    // fetchWithAuth が呼ばれていないことを確認
    expect(fetchWithAuth).not.toHaveBeenCalled();
  });

  it('必須フィールドを埋めて送信すると /api/goals へ POST される', async () => {
    render(
      <NewGoalModal
        isOpen={true}
        onClose={() => {}}
      />
    );

    // 必須フィールドに入力
    const titleInput = screen.getByLabelText('Goalのタイトル');
    const contentInput = screen.getByLabelText('Goalの詳細');
    const deadlineInput = screen.getByLabelText('期限');

    await userEvent.type(titleInput, 'テスト目標');
    await userEvent.type(contentInput, 'テストコンテンツ');
    await userEvent.type(deadlineInput, '2024-12-31');

    // フォームを送信
    await userEvent.click(screen.getByText('設定する'));

    // fetchWithAuth が1回だけ呼ばれたことを確認
    expect(fetchWithAuth).toHaveBeenCalledTimes(1);

    // 正しいエンドポイントとメソッドで呼ばれたことを確認
    expect(fetchWithAuth).toHaveBeenCalledWith(
      '/api/goals',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          title: 'テスト目標',
          content: 'テストコンテンツ',
          deadline: '2024-12-31'
        })
      })
    );
  });

  it('response.ok=true の場合、router.push が正しいパラメータで呼ばれる', async () => {
    // 成功レスポンスをモック
    const mockResponse = {
      ok: true,
      json: async () => ({
        id: 123,
        message: 'Goalを作成しました'
      })
    };
    fetchWithAuth.mockResolvedValueOnce(mockResponse);

    render(
      <NewGoalModal
        isOpen={true}
        onClose={() => {}}
      />
    );

    // 必須フィールドに入力
    const titleInput = screen.getByLabelText('Goalのタイトル');
    const contentInput = screen.getByLabelText('Goalの詳細');
    const deadlineInput = screen.getByLabelText('期限');

    await userEvent.type(titleInput, 'テスト目標');
    await userEvent.type(contentInput, 'テストコンテンツ');
    await userEvent.type(deadlineInput, '2024-12-31');

    // フォームを送信
    await userEvent.click(screen.getByText('設定する'));

    // router.push が正しいパラメータで呼ばれたことを確認
    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/goals/123',
      query: {
        message: encodeURIComponent('Goalを作成しました')
      }
    });
  });

  it('response.ok=false の場合、console.error が正しいエラーメッセージで呼ばれる', async () => {
    // エラーレスポンスをモック
    const errorData = { message: 'バリデーションエラー' };
    const mockResponse = {
      ok: false,
      json: async () => errorData
    };
    fetchWithAuth.mockResolvedValueOnce(mockResponse);

    render(
      <NewGoalModal
        isOpen={true}
        onClose={() => {}}
      />
    );

    // 必須フィールドに入力
    const titleInput = screen.getByLabelText('Goalのタイトル');
    const contentInput = screen.getByLabelText('Goalの詳細');
    const deadlineInput = screen.getByLabelText('期限');

    await userEvent.type(titleInput, 'テスト目標');
    await userEvent.type(contentInput, 'テストコンテンツ');
    await userEvent.type(deadlineInput, '2024-12-31');

    // フォームを送信
    await userEvent.click(screen.getByText('設定する'));

    // console.error が正しいエラーメッセージで呼ばれたことを確認
    expect(console.error).toHaveBeenCalledWith('Error submitting form:', errorData);
  });

  it('fetchWithAuth が例外を投げた場合、console.error が正しいエラーメッセージで呼ばれる', async () => {
    // 例外を投げるようにモックを設定
    const error = new Error('ネットワークエラー');
    fetchWithAuth.mockRejectedValueOnce(error);

    render(
      <NewGoalModal
        isOpen={true}
        onClose={() => {}}
      />
    );

    // 必須フィールドに入力
    const titleInput = screen.getByLabelText('Goalのタイトル');
    const contentInput = screen.getByLabelText('Goalの詳細');
    const deadlineInput = screen.getByLabelText('期限');

    await userEvent.type(titleInput, 'テスト目標');
    await userEvent.type(contentInput, 'テストコンテンツ');
    await userEvent.type(deadlineInput, '2024-12-31');

    // フォームを送信
    await userEvent.click(screen.getByText('設定する'));

    // console.error が正しいエラーメッセージで呼ばれたことを確認
    expect(console.error).toHaveBeenCalledWith('Submission failed', error);
  });

  it('モーダルに role="dialog"、タイトルに aria-labelledby が正しく付与されている', () => {
    render(
      <NewGoalModal
        isOpen={true}
        onClose={() => {}}
      />
    );

    // モーダルが role="dialog" を持っていることを確認
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();

    // モーダルが aria-labelledby を持っていることを確認
    expect(dialog).toHaveAttribute('aria-labelledby');

    // タイトル要素が存在し、aria-labelledby で参照されていることを確認
    const titleId = dialog.getAttribute('aria-labelledby');
    const title = document.getElementById(titleId);
    expect(title).toBeInTheDocument();
    expect(title).toHaveTextContent('Goalを設定する');
  });

  it('オーバーレイに styles.modalOverlay、内容に styles.modalContent が付いていること', () => {
    render(
      <NewGoalModal
        isOpen={true}
        onClose={() => {}}
      />
    );

    // オーバーレイに正しいクラスが付いていることを確認
    const overlay = screen.getByRole('dialog');
    expect(overlay).toHaveClass(styles.modalOverlay);

    // モーダルの内容に正しいクラスが付いていることを確認
    const content = overlay.querySelector(`.${styles.modalContent}`);
    expect(content).toBeInTheDocument();
  });
}); 