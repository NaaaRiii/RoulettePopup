import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Layout from '../components/Layout';
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
        if (Array.isArray(data)) { // 配列であることを確認
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
      <div>
        {flashMessage && <div className="flash-message">{flashMessage}</div>}
        <h1>Edit your Roulette</h1>
        <h2>Number of tickets: {tickets}</h2>

        {/*<div id="edit-roulette-text-form" style={{ display: showForm ? 'block' : 'none' }}>
          <form onSubmit={handleSubmit}>
            <select value={rouletteNumber} onChange={(e) => setNumber(e.target.value)} required>
              <option value="" disabled selected>Select a number</option>
              {[...Array(12).keys()].map(n => (
                <option key={n+1} value={n+1}>{n+1}</option>
              ))}
            </select>
            <input type="text" className="roulette-text" value={rouletteTexts} onChange={(e) => setText(e.target.value)} required />
            <button type="submit">Save Changes</button>
          </form>
        </div>*/}
        <div id="edit-roulette-text-form" style={{ display: showForm ? 'block' : 'none' }}>
          <form onSubmit={handleSubmit}>
            <select value={rouletteNumber} onChange={(e) => setRouletteNumber(e.target.value)} required>
              <option value="" disabled>Select a number</option>
              {[...Array(12).keys()].map(n => (
                <option key={n+1} value={n+1}>{n+1}</option>
              ))}
            </select>
            <input type="text" className="roulette-text" value={editedText} onChange={(e) => setEditedText(e.target.value)} required />
            <button type="submit">Save Changes</button>
          </form>
        </div>

        {tickets > 0 ? (
          <button type="button" className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
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

        <div>
          <Link href="/dashboard">
              <div className={'btn btn-primary'}>Back</div>
          </Link>
        </div>

      </div>
    </Layout>
  );
};

export default EditRouletteText;
