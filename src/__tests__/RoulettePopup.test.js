import React, { useState } from 'react';
import { render, screen } from '@testing-library/react';
import RoulettePopup from '../components/RoulettePopup';
import { TicketsContext } from '../contexts/TicketsContext';
import { isValidAngle } from '../components/RoulettePopup';


jest.mock('../contexts/TicketsContext', () => {
  const React = require('react');
  return {
    TicketsContext: React.createContext({
      tickets: 1,
      setTickets: jest.fn(),
      fetchTickets: jest.fn(),
    }),
  };
});


describe('ユーティリティ関数 isValidAngle', () => {
  /* ── 正常系 ───────────────────────────────────── */
  it.each([10, 50, 100])('%i° は除外レンジ外なので true を返す', (angle) => {
    expect(isValidAngle(angle)).toBe(true);
  });

  /* ── 境界値 ───────────────────────────────────── */
  const boundaryAngles = [
    0, 5,
    25, 35,
    55, 65,
    85, 95,
    115, 125,
    145, 155,
    175, 185,
    205, 215,
    235, 245,
    265, 275,
    295, 305,
    325, 335,
    355, 359,
  ];

  it.each(boundaryAngles)('%i° は除外レンジ境界なので false を返す', (angle) => {
    expect(isValidAngle(angle)).toBe(false);
  });

  /* ── 異常・限界値 ─────────────────────────────── */
  it.each([-10, -1, 360, 720])(
    '%i° は 0–359° の範囲外だが除外対象ではないため true を返す',
    (angle) => {
      expect(isValidAngle(angle)).toBe(true);
    },
  );
});


describe('初期レンダリング', () => {
  it('ルーレット用コンテナ・ポインタ・ホイールが存在し、data-testid が付与されていること', () => {
    render(<RoulettePopup />);

    // toBeInTheDocument を使わずに存在チェック
    expect(screen.getByTestId('roulette-container')).toBeTruthy();
    expect(screen.getByTestId('roulette-pointer')).toBeTruthy();
    expect(screen.getByTestId('roulette-wheel')).toBeTruthy();
  });

  it('segment 要素が 12 個生成され、data-number が 1〜12 の連番になっていること', () => {
    const { container } = render(<RoulettePopup />);
    const segments = container.getElementsByClassName('segment');

    // 12 個あること
    expect(segments.length).toBe(12);

    // data-number が 1 から 12 の連番になっていること
    Array.from(segments).forEach((seg, idx) => {
      expect(seg.getAttribute('data-number')).toBe(String(idx + 1));
    });
  });

  it('初期状態では rotation が 90deg で適用され、transition が none である', () => {
    render(<RoulettePopup />);
  
    const wheel = screen.getByTestId('roulette-wheel');
    // inline style ベースで確認
    expect(wheel.style.transform).toBe('rotate(90deg)');
    expect(wheel.style.transition).toBe('none');
  });

  it('「ルーレットを回す」ボタンが存在し、初期状態で disabled=false', () => {
    render(<RoulettePopup />);
    const button = screen.getByTestId('start-button');
    // ボタンが存在すること
    expect(button).toBeTruthy();
    // 初期状態で disabled が false であること
    expect(button.disabled).toBe(false);
  });
  
});
