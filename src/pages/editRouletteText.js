import React, { useState, useEffect } from 'react';


const EditRouletteText = () => {
  const [tickets, setTickets] = useState(0);
  const [rouletteTexts, setRouletteTexts] = useState([]);


  useEffect(() => {
    fetch('http://localhost:3000/users/tickets', {
      credentials: 'include'
    })
      .then(response => response.json())
      .then(data => setTickets(data.tickets))
      .catch(error => console.error('Error:', error));
  }, []);

  useEffect(() => {
    fetch('http://localhost:3000/roulette_texts')
      .then(response => response.json())
      .then(data => setRouletteTexts(data))
      .catch(error => console.error('Error:', error));
  }, []);

  const handleSubmit = (event) => {
    event.preventDefault();
    // フォーム送信の処理
  };

  return (
    <div>
      <h1>Edit your Roulette</h1>
      <h2>Number of tickets: {tickets}</h2>

      <form id="edit-roulette-text-form" onSubmit={handleSubmit} style={{ display: 'none' }}>
        <select /* 選択項目の設定 */>
          {/* オプションの設定 */}
        </select>
        <input type="text" className="roulette-text" /* その他の属性 */ />
        <button type="submit">Save Changes</button>
      </form>

      {tickets > 0 ? (
        <button type="button" className="btn btn-primary">
          Edit text using tickets
        </button>
      ) : (
        <button type="button" className="btn btn-primary" disabled>
          Edit text using tickets
        </button>
      )}

      {/* ルーレットテキストのリスト表示 */}
      {rouletteTexts.map((rouletteText) => (
        <div key={rouletteText.id}>
          Number: {rouletteText.number}, Text: {rouletteText.text}
        </div>
      ))}
    </div>
  );
};

export default EditRouletteText;


