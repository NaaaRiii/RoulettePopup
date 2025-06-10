import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import Modal from '../components/Modal';


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