import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import withAuth from '../utils/withAuth';
import Image from 'next/image';
import RoulettePopup from '../components/RoulettePopup';
import '../components/styles.css';

const EditRouletteText = () => {
  //const [tickets, setTickets] = useState(0);
  const [rouletteNumber, setRouletteNumber] = useState('');
  const [rouletteTexts, setRouletteTexts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editedText, setEditedText] = useState('');
  const [flashMessage, setFlashMessage] = useState('');
  const [playTickets, setPlayTickets] = useState(0);
  const [editTickets, setEditTickets] = useState(0);


  useEffect(() => {
    fetch('http://localhost:3000/api/roulette_texts/tickets', {
      method: 'GET',
      credentials: 'include'
    })
      .then(response => response.json())
      .then(data => {
        setPlayTickets(data.play_tickets);
        setEditTickets(data.edit_tickets);
      })
      .catch(error => console.error('Error:', error));
  }, []);

  useEffect(() => {
    fetch('http://localhost:3000/api/roulette_texts', {
      method: 'GET',
      credentials: 'include'
    })
      .then(response => response.json())
      .then(data => {
        if (Array.isArray(data)) {
          setRouletteTexts(data);
          const selectedText = data.find(text => text.number === parseInt(rouletteNumber));
          setEditedText(selectedText ? selectedText.text : '');
        } else {
          console.error('Data is not an array:', data);
        }
      })
      .catch(error => console.error('Error:', error));
  }, [rouletteNumber]);

  const selectedRouletteTextId = rouletteTexts.find(rt => rt.number === parseInt(rouletteNumber))?.id;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (editTickets <= 0) {
      alert('編集チケットが不足しています');
      return;
    }

    if (!selectedRouletteTextId) {
      console.error('Roulette Text ID is undefined.');
      return;
    }

    const apiUrl = `http://localhost:3000/api/roulette_texts/${selectedRouletteTextId}`;

    try {
      const response = await fetch(apiUrl, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          roulette_text: { text: editedText },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        alert(errorData.error || '更新に失敗しました。');
        return;
      }  

      const data = await response.json();

      if (data.roulette_text && typeof data.roulette_text === 'object' && 'number' in data.roulette_text) {
        const { roulette_text: updatedRouletteText, edit_tickets: updatedEditTickets } = data;
        setRouletteTexts(rouletteTexts.map(text => text.number === updatedRouletteText.number ? updatedRouletteText : text));
        setEditTickets(updatedEditTickets); // 編集チケットの更新
        setShowForm(false);
        setFlashMessage(`Number: ${updatedRouletteText.number} を ${updatedRouletteText.text} に変更しました。`);
      } else {
        console.error('Invalid response format:', data);
        setFlashMessage('更新に失敗しました。');
      }
    } catch (error) {
      console.error('There has been a problem with your fetch operation:', error);
      setFlashMessage('更新に失敗しました。');
    }
  };

  return (
    <Layout>
      {flashMessage && <div className="flash-message">{flashMessage}</div>}
      <div className="edit-roulette-container">
        <div className="edit-roulette-left-container">
          <h2 className="page-title">ごほうびルーレット</h2>
          <h3 className="ticket-info">プレイチケットを『{playTickets}』枚持っています。</h3>
          <h3 className="roulette-edit-info">編集チケットを『{editTickets}』枚持っています。</h3>

          <div>
            {editTickets > 0 && !showForm && (
              <button type="button" className="btn btn-primary" onClick={() => setShowForm(true)}>
                ルーレットを編集する
              </button>
            )}

            {showForm && (
              <div id="edit-roulette-text-form" className="form-container visible">
                <form onSubmit={handleSubmit}>
                  <div className="form-group">
                    <label htmlFor="rouletteNumber">編集したい数字を選んでください。</label>
                    <select
                      id="rouletteNumber"
                      value={rouletteNumber}
                      onChange={(e) => setRouletteNumber(e.target.value)}
                      required
                    >
                      <option value="" disabled>数字を選択</option>
                      {[...Array(12).keys()].map(n => (
                        <option key={n+1} value={n+1}>{n+1}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="rouletteText">Edit text</label>
                    <input
                      type="text"
                      id="rouletteText"
                      className="roulette-text"
                      value={editedText}
                      onChange={(e) => setEditedText(e.target.value)}
                      required
                    />
                  </div>

                  <div className="button-group">
                    <button
                      type="submit"
                      className="btn btn-primary"
                      onClick={(e) => {
                        e.preventDefault();
                        if (window.confirm("この内容で保存しますか？")) {
                          handleSubmit(e);
                        }
                      }}
                    >
                      内容を保存する
                    </button>
                    <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>キャンセル</button>
                  </div>
                </form>
              </div>
            )}
          </div>

          <div className="roulette-texts-list">
            {rouletteTexts.map((rouletteText) => (
              <div key={rouletteText.id} className="roulette-text-item">
                <div className="roulette-text-card">
                  <div className="roulette-text-image">
                    <Image
                      src={`/images/${rouletteText.number}.jpeg`} 
                      alt={`Roulette Image ${rouletteText.number}`} 
                      width={100}
                      height={100}
                    />
                  </div>
                  <div className="roulette-text-content">
                    <span className="roulette-text">{rouletteText.text}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>

        <div className="edit-roulette-right-container">
          <div className="roulette">
            <RoulettePopup />
          </div>

          <div className="roulette-description c-card">
            <ul>
              <li>Rankが10上がるごとに、プレイチケットと編集チケットが付与されます。</li>
              <li>ルーレットを回すには、プレイチケットを1枚使用する必要があります。</li>
              <li>ルーレットの各テキストを編集するには、編集チケットを1枚使用する必要があります。</li>
              <li>各チケットの枚数は、左上に表示されています。</li>
            </ul>
          </div>

        </div>

      </div>
    </Layout>
  );
};

export default withAuth(EditRouletteText);
