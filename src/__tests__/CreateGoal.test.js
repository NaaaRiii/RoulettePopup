import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NewGoalModal from '../components/CreateGoal';
import '@testing-library/jest-dom';
import styles from '../components/CreateGoal.module.css';
import { fetchWithAuth } from '../utils/fetchWithAuth';

// Next.js の useRouter をモック
jest.mock('next/router', () => ({
  useRouter: () => ({
    query: {},
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
}));

// fetchWithAuth をモック
jest.mock('../utils/fetchWithAuth');

describe('NewGoalModal', () => {
  beforeEach(() => {
    // 各テスト前にモックをリセット
    jest.clearAllMocks();
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
    expect(screen.getByText('目標を設定する')).toBeInTheDocument();

    // フォーム要素が存在することを確認
    expect(screen.getByLabelText('目標のタイトル')).toBeInTheDocument();
    expect(screen.getByLabelText('Content')).toBeInTheDocument();
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
    const titleInput = screen.getByLabelText('目標のタイトル');
    expect(titleInput).toHaveValue('');

    // Contentが空文字であることを確認
    const contentInput = screen.getByLabelText('Content');
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

    const titleInput = screen.getByLabelText('目標のタイトル');
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

    const contentInput = screen.getByLabelText('Content');
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
}); 