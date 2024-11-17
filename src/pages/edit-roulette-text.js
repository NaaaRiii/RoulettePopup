import React, { useState, useEffect, useContext } from 'react';
import { TicketsContext } from '../contexts/TicketsContext';
import { useFetchRouletteTexts } from '../hooks/useFetchRouletteTexts';
import Layout from '../components/Layout';
import withAuth from '../utils/withAuth';
import Image from 'next/image';
import RoulettePopup from '../components/RoulettePopup';
import '../components/styles.css';

const EditRouletteText = () => {
  //const [tickets, setTickets] = useState(0);
  const [rouletteNumber, setRouletteNumber] = useState('');
  //const [rouletteTexts, setRouletteTexts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editedText, setEditedText] = useState('');
  const [flashMessage, setFlashMessage] = useState('');
  const { playTickets, editTickets, fetchTickets } = useContext(TicketsContext);
  const { rouletteTexts, setRouletteTexts } = useFetchRouletteTexts();


  //useEffect(() => {
  //  if (rouletteNumber !== '') {
  //    const fetchRouletteTexts = async () => {
  //      try {
  //        const response = await fetch('http://localhost:3000/api/roulette_texts', {
  //          method: 'GET',
  //          credentials: 'include'
  //        });
  //        const data = await response.json();
  //        console.log('Fetched roulette texts:', data); 
  //        if (Array.isArray(data)) {
  //          setRouletteTexts(data);
  //          const selectedText = data.find(text => text.number === parseInt(rouletteNumber));
  //          setEditedText(selectedText ? selectedText.text : '');
  //        } else {
  //          console.error('Data is not an array:', data);
  //        }
  //      } catch (error) {
  //        console.error('Error fetching roulette texts:', error);
  //      }
  //    };
  //    fetchRouletteTexts();
  //  }
  //}, [rouletteNumber]);

  //useEffect(() => {
  //  const fetchAllRouletteTexts = async () => {
  //    try {
  //      const response = await fetch('http://localhost:3000/api/roulette_texts', {
  //        method: 'GET',
  //        credentials: 'include'
  //      });
  //      const data = await response.json();
  //      console.log('Fetched roulette texts:', data); // デバッグ用
  //      if (Array.isArray(data)) {
  //        setRouletteTexts(data);
  //      } else {
  //        console.error('Data is not an array:', data);
  //      }
  //    } catch (error) {
  //      console.error('Error fetching roulette texts:', error);
  //    }
  //  };
    
  //  fetchAllRouletteTexts();
  //}, []);

  //useEffect(() => {
  //  let isMounted = true; // マウント状態を追跡するフラグ

  //  const fetchAllRouletteTexts = async () => {
  //    try {
  //      const response = await fetch('http://localhost:3000/api/roulette_texts', {
  //        method: 'GET',
  //        credentials: 'include'
  //      });
  //      const data = await response.json();
  //      console.log('Fetched roulette texts:', data); // デバッグ用
  //      //if (Array.isArray(data)) {
  //      //  if (isMounted) {
  //      //    setRouletteTexts(data);
  //      //  }
  //      if (Array.isArray(data)) {
  //        if (isMounted) {
  //          console.log('Before setRouletteTexts');
  //          setRouletteTexts(data);
  //          console.log('After setRouletteTexts');
  //        }
  //      } else {
  //        console.error('Data is not an array:', data);
  //      }
  //    } catch (error) {
  //      console.error('Error fetching roulette texts:', error);
  //    }
  //  };
    
  //  fetchAllRouletteTexts();

  //  return () => {
  //    isMounted = false; // コンポーネントがアンマウントされたことを示す
  //  };
  //}, []);

  //useEffect(() => {
  //  if (rouletteNumber !== '') {
  //    let isMounted = true; // マウント状態を追跡するフラグ

  //    const fetchRouletteTexts = async () => {
  //      try {
  //        const response = await fetch('http://localhost:3000/api/roulette_texts', {
  //          method: 'GET',
  //          credentials: 'include'
  //        });
  //        const data = await response.json();
  //        console.log('Fetched roulette texts:', data);
  //        if (Array.isArray(data)) {
  //          if (isMounted) {
  //            setRouletteTexts(data);
  //            const selectedText = data.find(text => text.number === parseInt(rouletteNumber));
  //            setEditedText(selectedText ? selectedText.text : '');
  //          }
  //        } else {
  //          console.error('Data is not an array:', data);
  //        }
  //      } catch (error) {
  //        console.error('Error fetching roulette texts:', error);
  //      }
  //    };
  //    fetchRouletteTexts();

  //    return () => {
  //      isMounted = false; // コンポーネントがアンマウントされたことを示す
  //    };
  //  }
  //}, [rouletteNumber, setRouletteTexts]);

  useEffect(() => {
    if (rouletteNumber !== '') {
      const controller = new AbortController();
      const signal = controller.signal;
  
      const fetchRouletteTexts = async () => {
        try {
          const response = await fetch('http://localhost:3000/api/roulette_texts', {
            method: 'GET',
            credentials: 'include',
            signal: signal, // AbortControllerのsignalを渡す
          });
          const data = await response.json();
          console.log('Fetched roulette texts:', data);
          if (Array.isArray(data)) {
            setRouletteTexts(data);
            const selectedText = data.find(text => text.number === parseInt(rouletteNumber));
            setEditedText(selectedText ? selectedText.text : '');
          } else {
            console.error('Data is not an array:', data);
          }
        } catch (error) {
          if (error.name === 'AbortError') {
            // フェッチが中止された場合は何もしない
            console.log('Fetch aborted');
          } else {
            console.error('Error fetching roulette texts:', error);
          }
        }
      };
      fetchRouletteTexts();
  
      return () => {
        // コンポーネントのアンマウント時にフェッチを中止
        controller.abort();
      };
    }
  }, [rouletteNumber, setRouletteTexts]);
  

  const selectedRouletteTextNumber = parseInt(rouletteNumber);

  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log("Selected Roulette Text Number:", rouletteNumber);
    console.log("Edited Text:", editedText);

    if (editTickets <= 0) {
      alert('編集チケットが不足しています');
      return;
    }

    if (!rouletteNumber) {
      console.error('Roulette Number is undefined.');
      return;
    }

    const apiUrl = `http://localhost:3000/api/roulette_texts/${rouletteNumber}`;

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

      console.log("Response Status:", response.status);

      if (!response.ok) {
        const errorData = await response.json();
        alert(errorData.error || '更新に失敗しました。');
        return;
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error Response Text:", errorText);
        alert('更新に失敗しました。');
        return;
      }

      const data = await response.json();
      console.log("Updated Data:", data);

      if (data.roulette_text && typeof data.roulette_text === 'object' && 'number' in data.roulette_text) {
        const { roulette_text: updatedRouletteText } = data;
        setRouletteTexts(prevTexts => prevTexts.map(text => text.number === updatedRouletteText.number ? updatedRouletteText : text));
        fetchTickets(); 
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
          <h3 className="ticket-info" data-testid="play-tickets">
            プレイチケットを『{playTickets}』枚持っています。
          </h3>
          <h3 className="roulette-edit-info" data-testid="edit-tickets">
            編集チケットを『{editTickets}』枚持っています。
          </h3>

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
                        if (window.confirm("チケットを1枚消費して、この内容でテキストを編集しますか？")) {
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

          <div className="roulette-texts-list" data-testid="roulette-text-list" >
            {rouletteTexts.map((rouletteText) => (
              <div key={rouletteText.id} className="roulette-text-item" data-testid={`roulette-text-item-${rouletteText.id}`}>
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
