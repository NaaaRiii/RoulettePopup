  //擬似的にupdateLastRouletteRankを呼ぶ
  import React, { useEffect, useState } from 'react';

  function TestComponent() {
      const [userId, setUserId] = useState(null);
  
      const updateLastRouletteRank = async (newRank) => {
          console.log("Attempting to update last roulette rank for user ID:", userId);
          // 以下にAPI呼び出しのコードを模擬的に追加しますが、実際のAPI呼び出しは行いません。
      };
  
      // ボタンをクリックしたときにユーザーIDをセットするだけにします
      const handleClick = () => {
          setUserId(7); // 仮のユーザーIDをセット
      };
  
      // userIdが更新されたらupdateLastRouletteRankを呼び出す
      useEffect(() => {
        if (userId !== null) { // 初期値のnullではないときだけ呼び出す
          updateLastRouletteRank(10); // 仮のランクを引数として渡す
        }
      // TODO: Fix the dependency array issue for userId
      // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [userId]);
  
      return (
          <div>
              <button onClick={handleClick}>Test Update Rank</button>
          </div>
      );
  }
  
  export default TestComponent;
  