//import React, { useEffect, useState } from 'react';
//import ExpAreaChart from './ExpAreaChart';

//export default function HomePage() {
//  const [data, setData] = useState([]);

//  useEffect(() => {
//    const fetchData = async () => {
//      try {
//        const response = await fetch('http://localhost:3000/api/weekly_exp', {
//          credentials: 'include',
//        });

//        if (!response.ok) {
//          throw new Error('Network response was not ok');
//        }

//        const jsonData = await response.json();
//        const formattedData = jsonData.map(item => ({
//          day: item.date,
//          exp: item.exp
//        }));
//        setData(formattedData);
//      } catch (error) {
//        console.error('There has been a problem with your fetch operation:', error);
//      }
//    };

//    fetchData();
//  }, []);

//  return (
//    <div>
//      <ExpAreaChart data={data} />
//    </div>
//  );
//}
