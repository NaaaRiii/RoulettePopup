import React, { useState, useEffect, useContext } from 'react';
import '../components/RoulettePopup.css';
import Modal from './Modal';
import { fetchRouletteText } from './utils';
import { TicketsContext } from '../contexts/TicketsContext';
import { fetchWithAuth } from '../utils/fetchWithAuth';
import { Button, Stack } from '@mui/material';

export const isValidAngle = (angle) => {
  const excludedRanges = [
    { min: 0, max: 5 },
    { min: 25, max: 35 },
    { min: 55, max: 65 },
    { min: 85, max: 95 },
    { min: 115, max: 125 },
    { min: 145, max: 155 },
    { min: 175, max: 185 },
    { min: 205, max: 215 },
    { min: 235, max: 245 },
    { min: 265, max: 275 },
    { min: 295, max: 305 },
    { min: 325, max: 335 },
    { min: 355, max: 359 }
  ];

  return !excludedRanges.some(range => angle >= range.min && angle <= range.max);
};

const RoulettePopup = ({ onSpinComplete, spinDuration = 6000 }) => {
  const [rotation, setRotation] = useState(90);
  const [isSpinning, setIsSpinning] = useState(false);
  const [rouletteText, setRouletteText] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { tickets, setTickets, fetchTickets } = useContext(TicketsContext);

  const segmentAngles = 360 / 12;
  const segments = Array.from({ length: 12 }, (_, index) => {
    const angle = 360 / 12 * index;
    const color = `hsl(${angle}, 100%, 50%)`;
    return (
      <div
      className="segment"
      data-testid={`segment-${index + 1}`}
      data-number={index + 1}
      style={{
        backgroundColor: color,
        transform: `rotate(${angle}deg)`,
      }}
      key={index}
      />
    );
  });

  const startSpinningWithTicket = async () => {
    if (tickets <= 0) {
      alert('チケットが不足しています');
      return;
    }
  
    const confirmSpin = window.confirm('チケットを1枚消費して、ルーレットを回しますか？');
    if (!confirmSpin) {
      return;
    }

    setIsSpinning(true);
  
    try {
      const response = await fetchWithAuth('/api/roulette_texts/spin', { method: 'PATCH' });
  
      if (!response.ok) {
        const errorData = await response.json();
        alert(errorData.error || 'ルーレットの回転に失敗しました。');
        return;
      }
  
      const data = await response.json();
      console.log('Spin Response:', data);
  
      setTickets(data.tickets);
  
      startSpinning();
    } catch (error) {
      console.error('Error spinning the roulette:', error);
      alert('ルーレットの回転中にエラーが発生しました。');
    }
  };

  const startSpinning = () => {
    // ルーレットを最低5回転するように設定
    let baseRotation = 360 * 5;
    let randomAngle;
    do {
        // 0から359度の間でランダムな角度を生成
        randomAngle = Math.floor(Math.random() * 360);
    } while (!isValidAngle(randomAngle)); // 有効な角度が得られるまで繰り返す

    // 累積回転角度を計算
    let newRotation = rotation + randomAngle + baseRotation;

    setRotation(newRotation);
    setIsSpinning(true);

    setTimeout(async () => {
        setIsSpinning(false);
        const effectiveAngle = (newRotation - 90) % 360;
        const matchNumber = Math.ceil((360 - effectiveAngle) / segmentAngles);

        // コールバック関数を呼び出す
        if (onSpinComplete) {
          onSpinComplete(matchNumber);
        }

        // APIからデータを取得し、状態に保存
        const data = await fetchRouletteText(matchNumber);
        setRouletteText(data.text);
        setIsModalOpen(true);

        // コンソールに角度とテキストを出力
        console.log(`Stopped at angle: ${effectiveAngle} degrees`);
        console.log(`Matched number: ${matchNumber}`);
        console.log(`Matched text: ${data.text}`);
    }, spinDuration);
  };

  // お試し（無料）でルーレットを回すハンドラー
  const startTrialSpin = () => {
    // 既に回転中の場合は何もしない
    if (isSpinning) return;

    startSpinning();
  };

  const closeModal = () => {
    console.log('Closing modal and fetching tickets');
    setIsModalOpen(false);
    setIsSpinning(false);
    fetchTickets();
  };

  return (
    <div className="roulette-container" data-testid="roulette-container">
      <div className="roulette-pointer" data-testid="roulette-pointer"></div>
        <div
          className="roulette-wheel"
          data-testid="roulette-wheel"
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: isSpinning ? 'transform 6s cubic-bezier(0.17, 0.67, 0.83, 0.67)' : 'none'
          }}
        >
          {segments}
        </div>

        <div className="start-button" style={{ display: 'flex', justifyContent: 'center' }}>
          <Stack direction="row" spacing={2}>
            <Button 
              variant="outlined" 
              color="primary" 
              data-testid="trial-button" 
              onClick={startTrialSpin} 
              disabled={isSpinning}
              size="medium"
              sx={{ fontSize: '13px', fontFamily: '"UD デジタル 教科書体 N-R", "UD Digi Kyokasho NP-R"', minWidth: '180px' }}
            >
              お試しで回す
            </Button>
            <Button 
              variant="contained" 
              color="primary" 
              data-testid="start-button" 
              onClick={startSpinningWithTicket} 
              disabled={isSpinning}
              size="medium"
              sx={{ fontSize: '13px', fontFamily: '"UD デジタル 教科書体 N-R", "UD Digi Kyokasho NP-R"', minWidth: '180px' }}
            >
              チケットを消費して回す
            </Button>
          </Stack>
        </div>

        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
            <p>ごほうびルーレットの結果です！！！: {rouletteText}</p>
            <Button 
              variant="contained" 
              color="secondary" 
              data-testid="close-modal-button" 
              onClick={closeModal}
              size="medium"
              sx={{ fontSize: '12px', fontFamily: '"UD デジタル 教科書体 N-R", "UD Digi Kyokasho NP-R"' }}
            >
              Close
            </Button>
        </Modal>
    </div>
  );
};

export default RoulettePopup;