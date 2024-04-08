import Layout from '../components/Layout';
import React, { useState, useEffect } from 'react';
import '../components/styles.css';


const EditRouletteText = () => {
  const [tickets, setTickets] = useState(0);
  const [rouletteNumber, setRouletteNumber] = useState('');
  const [rouletteTexts, setRouletteTexts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editedText, setEditedText] = useState('');

  const [flashMessage, setFlashMessage] = useState('');


  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch('http://localhost:3000/api/roulette_texts/tickets', {
      //credentials: 'include'
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(response => response.json())
      .then(data => setTickets(data.tickets))
      .catch(error => console.error('Error:', error));
  }, []);

  //useEffect(() => {
  //  const token = localStorage.getItem('token');
  //  fetch('http://localhost:3000/api/roulette_texts/tickets', {
  //    method: 'GET',
  //    headers: {
  //      'Authorization': `Bearer ${token}`,
  //      //'Content-Type': 'application/json',
  //    },
  //    //credentials: 'include', // クッキーを使用する場合
  //    })
  //    .then(response => response.json())
  //    .then(data => setTickets(data.tickets))
  //    .catch(error => console.error('Error:', error));
  //}, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch('http://localhost:3000/api/roulette_texts', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(response => response.json())
      .then(data => {
        setRouletteTexts(data);
        setEditedText(data.find(text => text.number === rouletteNumber)?.text || '');
      })
      .catch(error => console.error('Error:', error));
  }, [rouletteNumber]);

  //useEffect(() => {
  //  fetch('http://localhost:3000/roulette_texts')
  //    .then(response => response.json())
  //    .then(data => setRouletteTexts(data))
  //    .catch(error => console.error('Error:', error));
  //}, []);

  //useEffect(() => {
  //  fetch('http://localhost:3000/roulette_texts')
  //    .then(response => response.json())
  //    .then(data => setRouletteNumber(data))
  //    .catch(error => console.error('Error:', error));
  //}, []);

  //const selectedRouletteTextId = rouletteTexts.find(rt => rt.number === parseInt(setRouletteNumber))?.id;
  const selectedRouletteTextId = rouletteTexts.find(rt => rt.number === parseInt(rouletteNumber))?.id;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');

    if (!selectedRouletteTextId) {
      console.error('Roulette Text ID is undefined.');
      return;
    }
    const apiUrl = `http://localhost:3000/api/roulette_texts/${selectedRouletteTextId}`;

    try {
      const response = await fetch(apiUrl, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        //body: JSON.stringify({
        //  roulette_text: { 
        //    number: rouletteNumber, 
        //    text: editedText 
        //  },
        //}),
        body: JSON.stringify({
          roulette_text: { text: editedText },
        }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
  
    //  const updatedRouletteText = await response.json();

    //  // `rouletteTexts`状態を更新して、変更をUIに反映させる
    //  setRouletteTexts(rouletteTexts.map(text => 
    //    text.number === updatedRouletteText.number ? updatedRouletteText : text
    //  ));
  
    //  alert("テキストが更新されました。");
    //} catch (error) {
    //  console.error('There has been a problem with your fetch operation:', error);
    //}

    const updatedRouletteText = await response.json();
      setRouletteTexts(rouletteTexts.map(text => text.number === updatedRouletteText.number ? updatedRouletteText : text));

      setShowForm(false);
      
      // レスポンスに基づいてフラッシュメッセージを設定
      setFlashMessage(`Number: ${updatedRouletteText.number} を ${updatedRouletteText.text} に変更しました。`);

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
      </div>
    </Layout>
  );
};

export default EditRouletteText;


