import React, { useEffect, useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import '../components/Calendar.css';

const ExpCalendar = () => {
  const [activities, setActivities] = useState({});

  useEffect(() => {
    const today = new Date();
    //console.log("Today's Date:", today.toLocaleDateString('sv-SE'));

    const fetchData = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/daily_exp', {
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Network response was not ok');
        }

        const data = await response.json();
        console.log("Fetched activities:", data);
        setActivities(data);
      } catch (error) {
        console.error('There has been a problem with your fetch operation:', error);
      }
    };

    fetchData();
  }, []);

  const tileClassName = ({ date, view }) => {
    if (view === 'month') {
      const dayKey = date.toLocaleDateString('sv-SE');
      //console.log("Checking date:", dayKey, activities[dayKey]);
      const expGained = Number(activities[dayKey]);

      if (expGained >= 1) {
        if (expGained >= 80) {
          return 'exp-level-80';
        } else if (expGained >= 70) {
          return 'exp-level-70';
        } else if (expGained >= 60) {
          return 'exp-level-60';
        } else if (expGained >= 50) {
          return 'exp-level-50';
        } else if (expGained >= 40) {
          return 'exp-level-40';
        } else if (expGained >= 30) {
          return 'exp-level-30';
        } else if (expGained >= 20) {
          return 'exp-level-20';
        } else if (expGained >= 10) {
          return 'exp-level-10';
        } else {
          return 'exp-level-1';
        }
      }
    }
  };

  return (
    <div data-testid="calendar">
      <Calendar
        locale="en-US"
        calendarType="iso8601"
        tileClassName={tileClassName}
      />
    </div>
  );
};

export default ExpCalendar;
