import React, { useState } from 'react';
import '../components/RoulettePopup.css';
import Modal from './Modal';

const RoulettePopup = () => {
  const [rotation, setRotation] = useState(90);
  const [isSpinning, setIsSpinning] = useState(false);
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

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [result, setResult] = useState('');

  const startSpinning = () => {
    // ルーレットを5回転プラスランダムな角度で回転させます
    const newRotation = 90 + Math.floor(Math.random() * 360) + 360 * 5;
  
    setRotation(newRotation);
    setIsSpinning(true);
  
    setTimeout(() => {
      setIsSpinning(false);
      const effectiveAngle = (newRotation - 90) % 360;
      const matchNumber = Math.ceil((360 - effectiveAngle) / segmentAngles);
      
      // モーダルで結果を表示
      setResult(`Matched number is: ${matchNumber}`);
      setIsModalOpen(true);
    }, 6000);
  };

  const resetRoulette = () => {
    setRotation(90); // 初期回転角度に戻す
    setIsSpinning(false); // 回転状態をリセット
    setIsModalOpen(false); // モーダルを閉じる
  };

  // 回転が完全に止まるまで待ちます
  //  setTimeout(() => {
  //    setIsSpinning(false);
  
  //    // 実質的なルーレットの角度（360度未満）を計算
  //    const effectiveAngle = (newRotation - 90) % 360;
  //    // ルーレットの針が指すセグメントを計算
  //    const matchNumber = Math.ceil((360 - effectiveAngle) / segmentAngles);
  //    setSelectedSegment(matchNumber);
  //    alert(`Matched number is: ${matchNumber}`);
  //  }, 6000); // 回転の時間（ミリ秒）
  //};

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
      <button onClick={startSpinning} disabled={isSpinning}>Start</button>
      {/*{!isSpinning && selectedSegment && <div>Selected Segment: {selectedSegment}</div>}*/}
      {/*<Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>*/}
      <Modal isOpen={isModalOpen} onClose={resetRoulette}>
      <div>{result}</div>
      </Modal>
    </div>
  );
};

export default RoulettePopup;