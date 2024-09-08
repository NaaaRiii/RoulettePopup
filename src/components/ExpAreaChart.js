//import React from 'react';
//import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Text } from 'recharts';
//import { format, isSameDay } from 'date-fns';


//const ExpAreaChart = ({ data }) => {
//  const formatXAxis = (tickItem) => {
//    const date = new Date(tickItem);
//    return format(date, 'M/d');
//  };

//  const CustomTick = ({ x, y, payload }) => {
//    const date = new Date(payload.value);
//    const today = new Date();
//    const isCurrentDay = isSameDay(date, today);

//    return (
//      <Text
//        x={x}
//        y={y + 10}
//        textAnchor="middle"
//        fill={isCurrentDay ? 'red' : '#666'}
//      >
//        {formatXAxis(payload.value)}
//      </Text>
//    );
//  };

//  return (
//    <ResponsiveContainer width="100%" height={400}>
//      <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
//        <CartesianGrid strokeDasharray="3 3" />
//        <XAxis dataKey="day" tick={<CustomTick />} />
//        <YAxis />
//        <Tooltip />
//        <Area type="monotone" dataKey="exp" stroke="#8884d8" fill="#8884d8" />
//      </AreaChart>
//    </ResponsiveContainer>
//  );
//};

//export default ExpAreaChart;





//import React from 'react';
//import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
//import { format } from 'date-fns';

//const ExpAreaChart = ({ data }) => {
//  const formatXAxis = (tickItem) => {
//    const date = new Date(tickItem);
//    return format(date, 'M/d');
//  };

//  // カスタムTickコンポーネント
//  const CustomTick = ({ x, y, payload }) => {
//    const date = new Date(payload.value); // データから取得した日付
//    const today = new Date(); // 今日の日付

//    // 今日の日付とTickの日付をフォーマットして比較
//    const formattedDate = format(date, 'M/d');
//    const formattedToday = format(today, 'M/d');

//    console.log("Tick date:", formattedDate);
//    console.log("Today's date:", formattedToday);
//    console.log("Is current day:", formattedDate === formattedToday);

//    console.log("Tick date:", date);
//    console.log("Today's date:", today);
//    //console.log("Is current day:", isCurrentDay);

//    return (
//      <g transform={`translate(${x},${y})`}>
//        <text textAnchor="middle" style={{ fill: formattedDate === formattedToday ? 'red' : '#666' }}>
//          <tspan x="0" dy="0.71em">
//            {formattedDate}
//          </tspan>
//        </text>
//      </g>
//    );
//  };

//  return (
//    <ResponsiveContainer width="100%" height={400}>
//      <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
//        <CartesianGrid strokeDasharray="3 3" />
//        <XAxis dataKey="day" tick={<CustomTick />} />
//        <YAxis />
//        <Tooltip />
//        <Area type="monotone" dataKey="exp" stroke="#8884d8" fill="#8884d8" />
//      </AreaChart>
//    </ResponsiveContainer>
//  );
//};

//export default ExpAreaChart;

//import React, { useEffect } from 'react';
//import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

//const ExpAreaChart = ({ data }) => {
//  // データの内容をコンソールに出力して確認
//  useEffect(() => {
//    console.log("Chart data:", data);
//  }, [data]);

//  return (
//    <ResponsiveContainer width="100%" height={400}>
//      <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
//        <CartesianGrid strokeDasharray="3 3" />
//        <XAxis dataKey="day" />
//        <YAxis />
//        <Tooltip />
//        <Area type="monotone" dataKey="exp" stroke="#8884d8" fill="#8884d8" />
//      </AreaChart>
//    </ResponsiveContainer>
//  );
//};

//export default ExpAreaChart;


import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

const ExpAreaChart = ({ data }) => {
  const formatXAxis = (tickItem) => {
    // 日付文字列に現在の年を追加し、ブラウザが正しく解釈できるようにする
    const currentYear = new Date().getFullYear();
    const dateStr = `${tickItem} ${currentYear}`; // 日付に現在の年を追加
    const date = new Date(dateStr); // 正しくDateに変換

    console.log("Formatted Tick date (with year):", dateStr, " -> Parsed:", date); // パースした日付を表示

    return format(date, 'M/d');
  };

  // カスタムTickコンポーネント
  const CustomTick = ({ x, y, payload }) => {
    const currentYear = new Date().getFullYear();
    const dateStr = `${payload.value} ${currentYear}`; // payloadの値に年を追加
    const date = new Date(dateStr); // Dateオブジェクトに変換
    const today = new Date(); // 今日の日付

    // 今日の日付とTickの日付をフォーマットして比較
    const formattedDate = format(date, 'M/d');
    const formattedToday = format(today, 'M/d');

    // コンソールに情報を出力
    console.log("Tick date:", date);
    console.log("Tick date:", formattedDate);
    console.log("Today's date:", formattedToday);
    console.log("Is current day:", formattedDate === formattedToday);

    return (
      <g transform={`translate(${x},${y})`}>
        <text textAnchor="middle" style={{ fill: formattedDate === formattedToday ? 'red' : '#666' }}>
          <tspan x="0" dy="0.71em">
            {formattedDate}
          </tspan>
        </text>
      </g>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={400}>
      <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="day" tick={<CustomTick />} />
        {/*<XAxis dataKey="day" tickFormatter={formatXAxis} />*/}
        <YAxis />
        <Tooltip />
        <Area type="monotone" dataKey="exp" stroke="#8884d8" fill="#8884d8" />
      </AreaChart>
    </ResponsiveContainer>
  );
};

export default ExpAreaChart;
