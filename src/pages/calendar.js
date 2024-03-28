////import { useState } from 'react'
//import Calendar from 'react-calendar'
//import 'react-calendar/dist/Calendar.css' // カレンダーのcss
//import '../components/calendar.css'; 

//const exp_Calendar = () => {
//  //const [value, setValue] = useState()
//  //const [value, setValue] = useState(new Date()); //初期値を今日の日付に設定したい場合

//  return (
//    <div>
//      <Calendar
//        //value={value}
//        //onClickDay={(e) => setValue(e)}
//        locale="en-US"
//        calendarType="iso8601" //月曜始まり
//      />
//      {/*<div>{value}</div>*/}
//      {/*<div>{value && value.toDateString()}</div>*/}
//    </div>
//  )
//}

//export default exp_Calendar

import { useEffect, useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import '../components/calendar.css';

const ExpCalendar = () => {
  const [activities, setActivities] = useState({});

  useEffect(() => {
    fetch('http://localhost:3000/api/daily_exp')
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then(data => setActivities(data))
    .catch(error => console.error('There has been a problem with your fetch operation:', error));
  }, []);

  // 日付に対するexp_gainedの合計に基づいて、色の濃淡を計算する関数
  const tileClassName = ({ date, view }) => {
    if (view === 'month') {
      // タイムゾーンを考慮して日付を取得
      const dayKey = date.toLocaleDateString('sv-SE'); // sv-SE ロケールを使用して YYYY-MM-DD 形式に変換
      const expGained = Number(activities[dayKey]); // expGained を数値に変換
      console.log(dayKey, expGained);
      if (expGained) {
        if (expGained > 100) {
          return 'exp-high';
        } else if (expGained > 50) {
          return 'exp-medium';
        } else {
          return 'exp-low';
        }
      }
    }
  };

  return (
    <div>
      <Calendar
        locale="en-US"
        calendarType="iso8601"
        tileClassName={tileClassName}
      />
    </div>
  );
}

export default ExpCalendar;
