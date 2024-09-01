import React, { useState } from 'react';
import '../components/RoulettePopup.css';
import Modal from './Modal';
import { fetchRouletteText } from './utils'; //src/components/utils.jsからルーレットのテキストを取得する

const RoulettePopup = () => {
  const [rotation, setRotation] = useState(90);
  const [isSpinning, setIsSpinning] = useState(false);
  const [rouletteText, setRouletteText] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  //const [result, setResult] = useState('');
  //const [selectedSegment, setSelectedSegment] = useState(null);

  // ルーレットのセグメントを定義（例: 12セグメント）
  const segmentAngles = 360 / 12;
  const segments = Array.from({ length: 12 }, (_, index) => {
    const angle = 360 / 12 * index;
    const color = `hsl(${angle}, 100%, 50%)`;
    return (
      <div
        className="segment"
        style={{
          backgroundColor: color,
          transform: `rotate(${angle}deg)`,
        }}
        key={index}
        data-number={index + 1}
      />
    );
  });

  const isValidAngle = (angle) => {
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
  
    // どの範囲にも含まれない場合にtrueを返す
    return !excludedRanges.some(range => angle >= range.min && angle <= range.max);
  }

  const startSpinning = () => {
    // ルーレットを最低5回転するように設定
    let baseRotation = 360 * 5;
    let randomAngle;
    do {
        // 0から359度の間でランダムな角度を生成
        randomAngle = Math.floor(Math.random() * 360);
    } while (!isValidAngle(randomAngle)); // 有効な角度が得られるまで繰り返す

    // 最終的な回転角度にランダム角度を加算
    const newRotation = 90 + randomAngle + baseRotation;

    setRotation(newRotation);
    setIsSpinning(true);

    setTimeout(async () => {
        setIsSpinning(false);
        const effectiveAngle = (newRotation - 90) % 360;
        const matchNumber = Math.ceil((360 - effectiveAngle) / segmentAngles);

        // APIからデータを取得し、状態に保存
        const data = await fetchRouletteText(matchNumber);
        setRouletteText(data.text);
        setIsModalOpen(true);

        // コンソールに角度とテキストを出力
        console.log(`Stopped at angle: ${effectiveAngle} degrees`);
        console.log(`Matched number: ${matchNumber}`);
        console.log(`Matched text: ${data.text}`);
    }, 6000);
  };

  return (
    <div className="roulette-container">
      <div className="roulette-pointer"></div>
      <div
        className="roulette-wheel"
        style={{
          transform: `rotate(${rotation}deg)`,
          transition: isSpinning ? 'transform 6s cubic-bezier(0.17, 0.67, 0.83, 0.67)' : 'none'
        }}
      >
        {segments}
      </div>
      <div className="start-button">
        <button onClick={startSpinning} disabled={isSpinning}>Start
        </button>
      </div>
      {/*{!isSpinning && selectedSegment && <div>Selected Segment: {selectedSegment}</div>}*/}
      {/*<Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>*/}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <div>Matched text is: {rouletteText}</div>
      </Modal>
    </div>
  );
};

export default RoulettePopup;