import React, { useState, useEffect, useContext } from 'react';
import { TicketsContext } from '../contexts/TicketsContext';
import { useFetchRouletteTexts } from '../hooks/useFetchRouletteTexts';
import { fetchWithAuth } from '../utils/fetchWithAuth';
import Layout from '../components/Layout';
import Image from 'next/image';
import RoulettePopup from '../components/RoulettePopup';
import Link from 'next/link';
import { format } from 'date-fns';
import '../components/styles.css';


const EditRouletteText = () => {
  const [rouletteNumber, setRouletteNumber] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editedText, setEditedText] = useState('');
  const [flashMessage, setFlashMessage] = useState('');
  const [recentSpins, setRecentSpins] = useState([]);
  const [smallGoals, setSmallGoals] = useState([]);
  const { tickets, fetchTickets } = useContext(TicketsContext);
  const { rouletteTexts, setRouletteTexts } = useFetchRouletteTexts();
  console.log('[EditRoulette] tickets=', tickets);

  // 初期読み込み: 最近のスピン結果
  useEffect(() => {
    try {
      const saved = typeof window !== 'undefined' ? window.localStorage.getItem('recentSpins') : null;
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setRecentSpins(parsed);
      }
    } catch (e) {
      console.error('Failed to load recentSpins from localStorage', e);
    }
  }, []);

  // 進行中のSmall Goalを取得
  useEffect(() => {
    const fetchSmallGoals = async () => {
      try {
        const response = await fetchWithAuth('/api/goals');
        if (response.ok) {
          const goalsData = await response.json();
          // 未完了のGoalから未完了のSmall Goalを抽出
          const incompleteSmallGoals = goalsData
            .filter(goal => !goal.completed)
            .flatMap(goal => 
              (goal.small_goals || [])
                .filter(smallGoal => !smallGoal.completed)
                .map(smallGoal => ({
                  ...smallGoal,
                  goalTitle: goal.title,
                  goalId: goal.id
                }))
            );
          setSmallGoals(incompleteSmallGoals);
        }
      } catch (error) {
        console.error('Failed to fetch small goals:', error);
      }
    };

    fetchSmallGoals();
  }, []);

  useEffect(() => {
    if (rouletteNumber !== '') {
      const controller = new AbortController();
      const signal = controller.signal;
  
      const fetchRouletteTexts = async () => {
        try {
          const response = await fetchWithAuth('/api/roulette_texts', { signal });

          if (!response.ok) {
            throw new Error(`Error fetching data. Status: ${response.status}`);
          }

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
            console.log('Fetch aborted');
          } else {
            console.error('Error fetching roulette texts:', error);
          }
        }
      };

      fetchRouletteTexts();
      return () => {
        controller.abort();
      };
    }
  }, [rouletteNumber, setRouletteTexts]);
  

  const selectedRouletteTextNumber = parseInt(rouletteNumber);

  const formatDate = (dateString) => format(new Date(dateString), 'yyyy-MM-dd');

  // ルーレット結果の受け取り・履歴保存
  const handleSpinComplete = (matchedNumber) => {
    try {
      const matched = rouletteTexts.find((t) => t.number === Number(matchedNumber));
      const entry = {
        number: matchedNumber,
        text: matched ? matched.text : '',
        at: new Date().toISOString(),
      };
      setRecentSpins((prev) => {
        const next = [entry, ...prev].slice(0, 5);
        try {
          if (typeof window !== 'undefined') {
            window.localStorage.setItem('recentSpins', JSON.stringify(next));
          }
        } catch (e) {
          console.error('Failed to save recentSpins to localStorage', e);
        }
        return next;
      });
    } catch (e) {
      console.error('handleSpinComplete error', e);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log("Selected Roulette Text Number:", rouletteNumber);
    console.log("Edited Text:", editedText);

    if (!rouletteNumber) {
      console.error('Roulette Number is undefined.');
      return;
    }

    if (!window.confirm("この内容でテキストを編集しますか？")) {
      return;
    }

    try {
      const response = await fetchWithAuth(
        `/api/roulette_texts/${rouletteNumber}`,
        {
          method: 'PATCH',
          body: JSON.stringify({ roulette_text: { text: editedText } }),
        }
      );

      console.log("Response Status:", response.status);

      if (!response.ok) {
        let errorMessage = '更新に失敗しました。';
        try {
          const err = await response.clone().json();
          errorMessage = err.error || errorMessage;
        } catch {
          const errText = await response.text();
          console.error('Error Response Text:', errText);
        }
        alert(errorMessage);
        return;
      }

      const data = await response.json();
      console.log("Updated Data:", data);

      const updatedRouletteText =
        (data.roulette_text && typeof data.roulette_text === 'object')
          ? data.roulette_text
          : data;
          
        if (updatedRouletteText && 'number' in updatedRouletteText) {
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
      <div className="
        flex flex-col lg:flex-row
        min-h-screen px-2 py-4 sm:p-6 lg:p-5
        gap-6 lg:gap-8
      ">
        <div className="
          flex-1 lg:flex-[6]
          flex flex-col space-y-6
          pl-2 sm:pl-4 lg:pl-[100px]
        ">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800">ごほうびルーレット</h2>
          <h3 className="text-sm sm:text-base lg:text-lg font-medium text-gray-700" data-testid="tickets">
            チケットを『{tickets}』枚持っています。
          </h3>

          <div>
            {!showForm && (
              <button type="button" className="btn btn-primary rounded-md" onClick={() => setShowForm(true)}>
                ルーレットを編集する
              </button>
            )}

            {showForm && (
              <div id="edit-roulette-text-form" className="
                bg-white p-3 sm:p-4 rounded-lg shadow-md
                border border-gray-200 space-y-3
                max-w-md mx-auto lg:mx-0
              " data-testid="edit-roulette-text-form">
                <form onSubmit={handleSubmit}>
                  <div className="space-y-2">
                    <label htmlFor="rouletteNumber" className="block text-base font-medium text-gray-700">
                      編集したい数字を選んでください。
                    </label>
                    <select
                      id="rouletteNumber"
                      value={rouletteNumber}
                      onChange={(e) => setRouletteNumber(e.target.value)}
                      required
                      className="w-full p-2 sm:p-3 border border-gray-300 rounded-md text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="" disabled>数字を選択</option>
                      {[...Array(12).keys()].map(n => (
                        <option key={n+1} value={n+1}>{n+1}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="rouletteText" className="block text-base font-medium text-gray-700">
                      内容を編集してください。
                    </label>
                    <input
                      type="text"
                      id="rouletteText"
                      className="w-full p-2 sm:p-3 border border-gray-300 rounded-md text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={editedText}
                      onChange={(e) => setEditedText(e.target.value)}
                      required
                    />
                  </div>

                  <div className="
                    flex flex-col sm:flex-row gap-3">
                    <button
                      type="submit"
                      className="btn btn-primary w-full sm:w-auto rounded-md"
                    >
                      内容を保存する
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary w-full sm:w-auto border border-gray-300 rounded-md"
                      onClick={() => setShowForm(false)}
                    >
                      キャンセル
                    </button>
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

        <div className="
          flex-1 lg:flex-[4]
          flex flex-col items-center text-center
          gap-6 lg:gap-5
          mt-6 lg:mt-0
          pr-0 sm:pr-4 lg:pr-[100px]
        ">
          <div className="roulette">
            <RoulettePopup onSpinComplete={handleSpinComplete} />
          </div>

          <div className="roulette-description c-card mx-2 sm:mx-0 lg:w-[650px]">
            <ul data-testid="roulette-description-list">
              <li>Rankが10上がるごとに、チケットが付与されます。</li>
              <li>ルーレットを回すには、チケットを1枚使用する必要があります。</li>
              <li>各チケットの枚数は、左上に表示されています。</li>
            </ul>
          </div>

          <div className="roulette-history c-card mx-2 sm:mx-0 lg:w-[650px]" data-testid="roulette-recent-results">
            <div className="px-5 py-4">
              <h4 className="text-base sm:text-lg font-semibold text-gray-800 mb-3">最近のスピン結果</h4>
              {recentSpins.length === 0 ? (
                <p className="text-sm text-gray-600">まだ結果はありません。右のボタンから回してみましょう。</p>
              ) : (
                <ul className="space-y-2">
                  {recentSpins.map((s, idx) => (
                    <li key={`${s.at}-${idx}`} className="flex items-center justify-between text-left">
                      <span className="text-sm text-gray-800">No.{s.number}：{s.text || '—'}</span>
                      <span className="text-xs text-gray-500">{new Date(s.at).toLocaleString()}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {smallGoals.length > 0 && (
            <div className="small-goals-section c-card mx-2 sm:mx-0 lg:w-[650px]" data-testid="small-goals-section">
              <div className="px-5 py-4">
                <h4 className="text-base sm:text-lg font-semibold text-gray-800 mb-3">期限が近いSmall Goal</h4>
                <div className="space-y-3">
                  {smallGoals.slice(0, 5).map((smallGoal) => (
                    <div key={smallGoal.id} className="flex items-start justify-between p-3 bg-gray-50 rounded border">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800 mb-1">{smallGoal.goalTitle}</p>
                        <p className="text-xs text-gray-600 mb-2">{smallGoal.title}</p>
                        <p className="text-xs text-red-600">
                          期限: {smallGoal.deadline ? formatDate(smallGoal.deadline) : 'No deadline'}
                        </p>
                      </div>
                      <Link href={`/goals/${smallGoal.goalId}`}>
                        <button className="ml-3 px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600">
                          確認
                        </button>
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default EditRouletteText;
