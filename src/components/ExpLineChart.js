import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, subDays, addDays } from 'date-fns';

import { fetchWithAuth } from '../../utils/fetchWithAuth';

const ExpLineChart = () => {
  const [data, setData] = useState([]);

  // 今日の日付を基準に、前5日と翌日の日付を生成
  const today = new Date();

  // X軸用の日付リストを生成 (前5日+今日+翌日)
  const dateRange = [
    subDays(today, 5),
    subDays(today, 4),
    subDays(today, 3),
    subDays(today, 2),
    subDays(today, 1),
    today,
    addDays(today, 1)
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetchWithAuth(`${process.env.NEXT_PUBLIC_RAILS_API_URL}/api/weekly_exp`,
          { method: 'GET' }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch data');
        }

        const jsonData = await response.json();
        if (!Array.isArray(jsonData)) {
          throw new Error('Data is not an array');
        }

        const formattedData = jsonData.map(item => ({
          day: item.date,
          exp: item.exp,
        }));

        setData(formattedData);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  const CustomTick = ({ x, y, payload }) => {
    const index = payload.value;
    const date = dateRange[index];
    const formattedDate = format(date, 'M/d');
    const isToday = format(today, 'M/d') === formattedDate;

    return (
      <g transform={`translate(${x},${y})`}>
        <text textAnchor="middle" style={{ fill: isToday ? 'red' : '#666' }}>
          <tspan x="0" dy="0.71em">{formattedDate}</tspan>
        </text>
      </g>
    );
  };

  // カスタムツールチップコンポーネント
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip" style={{ backgroundColor: '#fff', padding: '5px', border: '1px solid #ccc' }}>
          <p style={{ color: '#593459' }}>{`Exp: ${payload[0].value}`}</p>
        </div>
      );
    }
    return null;
  };

  const updatedData = data.map((item, index) => ({
    ...item,
    day: index
  }));

  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={updatedData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
        <CartesianGrid stroke="#ccc" strokeDasharray="" vertical={false} horizontal={false} />
        <XAxis dataKey="day" tick={<CustomTick />} />
        <YAxis tick={false} />
        <Tooltip content={<CustomTooltip />} cursor={false} />
        <Line
          type="monotone"
          dataKey="exp"
          stroke="#8884d8"
          dot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default ExpLineChart;
