import React, { useEffect, useState } from 'react';
import ExpAreaChart from '../components/ExpAreaChart';

export default function HomePage() {
  const [data, setData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const response = await fetch('http://localhost:3000/api/weekly_exp');
      const jsonData = await response.json();
      const formattedData = jsonData.map(item => ({
        day: item.date,
        exp: item.exp
      }));
      setData(formattedData);
    };

    fetchData();
  }, []);

  return (
    <div>
      <h1>Weekly EXP Chart</h1>
      <ExpAreaChart data={data} />
    </div>
  );
}
