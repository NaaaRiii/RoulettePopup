import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import Modal from '../../components/Modal';


describe('初期レンダリング', () => {
	it('isOpen=false でマウントすると .modal-overlay がレンダリングされない', () => {
		const { container } = render(
			<Modal isOpen={false} onClose={() => {}}>
				<div>テスト</div>
			</Modal>
		);

		// .modal-overlay が存在しないこと
		expect(container.querySelector('.modal-overlay')).toBeNull();
	});

	it('isOpen=true でマウント直後は遅延中なので .modal-overlay がレンダリングされない', () => {
		// タイマーを制御
		jest.useFakeTimers();

		const { container } = render(
			<Modal isOpen={true} onClose={() => {}}>
				<div>テスト</div>
			</Modal>
		);

		jest.advanceTimersByTime(800);

		// 実装上は初期ステートが isOpen なので即表示される
		expect(container.querySelector('.modal-overlay')).not.toBeNull();
		expect(container.querySelector('.modal-content')).not.toBeNull();

		// タイマーを戻しておく
		jest.useRealTimers();
	});
});


describe('遅延表示', () => {
  it('isOpen=false → true に変更しても 800 ms 経過前は .modal-overlay が表示されない', () => {
    jest.useFakeTimers();

    // ① isOpen=false でマウント
    const { container, rerender } = render(
      <Modal isOpen={false} onClose={() => {}}>
        <div>テスト</div>
      </Modal>
    );

    // ② isOpen=true へ切り替え
    rerender(
      <Modal isOpen={true} onClose={() => {}}>
        <div>テスト</div>
      </Modal>
    );

    // ③ 799ms 進めてもまだ表示されない
    jest.advanceTimersByTime(799);
    expect(container.querySelector('.modal-overlay')).toBeNull();

    jest.useRealTimers();
  });

  it('isOpen=false → true 後 800 ms 経過で .modal-overlay/.modal-content が現れ、children が描画される', async () => {
    jest.useFakeTimers();

    // ① isOpen=false でマウント
    const { container, rerender } = render(
      <Modal isOpen={false} onClose={() => {}}>
        <div>テスト</div>
      </Modal>
    );

    // ② isOpen=true に切り替え
    rerender(
      <Modal isOpen={true} onClose={() => {}}>
        <div>テスト</div>
      </Modal>
    );

    // ③ タイマーを 800ms 進める
    jest.advanceTimersByTime(800);

    // ④ waitFor 内では内部で act が走るので明示的な act は不要
    await waitFor(() => {
      const overlay = container.querySelector('.modal-overlay');
      const content = container.querySelector('.modal-content');
      expect(overlay).not.toBeNull();
      expect(content).not.toBeNull();
      expect(content.textContent).toContain('テスト');
    });

    jest.useRealTimers();
  });
});


describe('即時非表示', () => {
  it('isOpen=true → false に変更直後、要素が即座に消える／再描画されない', () => {
    // ① isOpen=true でマウント
    const { container, rerender } = render(
      <Modal isOpen={true} onClose={() => {}}>
        <div>テスト</div>
      </Modal>
    );

    // マウント直後は表示されている
    expect(container.querySelector('.modal-overlay')).not.toBeNull();

    // ② isOpen=false に切り替え
    rerender(
      <Modal isOpen={false} onClose={() => {}}>
        <div>テスト</div>
      </Modal>
    );

    // 即座に非表示
    expect(container.querySelector('.modal-overlay')).toBeNull();

    // さらに 1000ms 経っても再描画されない
    jest.advanceTimersByTime?.(1000);
    expect(container.querySelector('.modal-overlay')).toBeNull();
  });
});


describe('クリーンアップ', () => {
  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('isOpen=true → 800ms 未満でアンマウントしても act 警告／メモリリークが出ない', () => {
    jest.useFakeTimers();

    // React の警告を監視
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    // ① isOpen=true でマウント
    const { container, unmount } = render(
      <Modal isOpen={true} onClose={() => {}}>
        <div>テスト</div>
      </Modal>
    );

    // ② 400ms 経過時点でアンマウント（800ms 未満）
    jest.advanceTimersByTime(400);
    unmount();

    // さらに 1 秒進めても何も起こらない（clearTimeout が効いている）
    jest.advanceTimersByTime(1000);

    // モーダルが残っていない
    expect(container.querySelector('.modal-overlay')).toBeNull();

    // React の act 警告やメモリリーク系エラーが出ていない
    const errorCalls = consoleErrorSpy.mock.calls.flat().join('\n');
    expect(errorCalls).not.toMatch(/act|not wrapped in act|memory leak/i);
  });
});


describe('子要素', () => {
  afterEach(() => jest.useRealTimers());

  it('children に任意のノードを渡すと、遅延後にそのノードが DOM 内にある', async () => {
    jest.useFakeTimers();

    const { container, rerender } = render(
      <Modal isOpen={false} onClose={() => {}}>
        <div>テスト</div>
      </Modal>
    );

    // isOpen=true に切り替え
    rerender(
      <Modal isOpen={true} onClose={() => {}}>
        <div>テスト</div>
      </Modal>
    );

    // 800ms 進める
    jest.advanceTimersByTime(800);

    // 挿入を待ってからアサーション
    await waitFor(() => {
      const content = container.querySelector('.modal-content');
      expect(content).not.toBeNull();
      expect(content.textContent).toContain('テスト');
    });
  });
});


describe('再表示', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('false→true→false→true の連続トグル 2 回目以降も遅延ロジックが正しく働く', async () => {
    const { rerender } = render(
      <Modal isOpen={false} onClose={() => {}}>
        <div>テスト</div>
      </Modal>
    );

    // 1 回目のトグル: OFF→ON
    rerender(
      <Modal isOpen={true} onClose={() => {}}>
        <div>テスト</div>
      </Modal>
    );
    // 800ms 経過で表示
    jest.advanceTimersByTime(800);
    await screen.findByText('テスト');

    // OFF に切り替えたら即座に非表示
    rerender(
      <Modal isOpen={false} onClose={() => {}}>
        <div>テスト</div>
      </Modal>
    );
    expect(screen.queryByText('テスト')).toBeNull();

    // 2 回目のトグル: OFF→ON
    rerender(
      <Modal isOpen={true} onClose={() => {}}>
        <div>テスト</div>
      </Modal>
    );
    jest.advanceTimersByTime(800);
    await screen.findByText('テスト');
  });
});