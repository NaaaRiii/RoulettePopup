import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

const ExpAreaChart = ({ data }) => {
  const formatXAxis = (tickItem) => {
    const date = new Date(tickItem);
    return format(date, 'M/d');
  };

  return (
    <ResponsiveContainer width="100%" height={400}>
      <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="day" tickFormatter={formatXAxis} />
        <YAxis />
        <Tooltip />
        <Area type="monotone" dataKey="exp" stroke="#8884d8" fill="#8884d8" />
      </AreaChart>
    </ResponsiveContainer>
  );
};

export default ExpAreaChart;
