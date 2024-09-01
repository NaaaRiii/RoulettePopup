import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Layout from '../components/Layout';
import RoulettePopup from '../components/RoulettePopup';
import '../components/styles.css';

const EditRouletteText = () => {
  const [tickets, setTickets] = useState(0);
  const [rouletteNumber, setRouletteNumber] = useState('');
  const [rouletteTexts, setRouletteTexts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editedText, setEditedText] = useState('');
  const [flashMessage, setFlashMessage] = useState('');

  useEffect(() => {
    fetch('http://localhost:3000/api/roulette_texts/tickets', {
      method: 'GET',
      credentials: 'include'
    })
      .then(response => response.json())
      .then(data => setTickets(data.tickets))
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
        const errorText = await response.text();
        console.error('Network response was not ok:', errorText);
        setFlashMessage('更新に失敗しました。');
        return;
      }

      const data = await response.json();

      if (data.roulette_text && typeof data.roulette_text === 'object' && 'number' in data.roulette_text) {
        const { roulette_text: updatedRouletteText, tickets: updatedTickets } = data;
        setRouletteTexts(rouletteTexts.map(text => text.number === updatedRouletteText.number ? updatedRouletteText : text));
        setTickets(updatedTickets);
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
          <h3 className="ticket-info">チケットを『{tickets}』枚持っています。</h3>
          <h3 className="roulette-edit-info">ルーレットの内容を『{tickets}』個、編集することができます。</h3>

          <div>
            {tickets > 0 && !showForm && (
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
              <div key={rouletteText.id} className="c-card roulette-text-item">
                <div className="roulette-text-card">
                  <div className="roulette-text-image">
                    <img 
                      src={`/images/${rouletteText.number}.jpeg`} 
                      alt={`Roulette Image ${rouletteText.number}`} 
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
          {/*<div className="c-card">*/}
          <div className="roulette-description c-card">
            <ul>
              <li>ルーレットはRankが10上がるごとに、1つ編集できるようになります。<br />
                また、同時にルーレットを1回、回すことができるようになります。</li>
              <li>ルーレットを回すことと内容を編集することは、任意のタイミングで別々に行うことができますが、回数に制限があります。</li>
              <li>回数については左上を参照してください。</li>
            </ul>
          </div>
          {/*</div>*/}

        </div>

      </div>
    </Layout>
  );
};

export default EditRouletteText;
