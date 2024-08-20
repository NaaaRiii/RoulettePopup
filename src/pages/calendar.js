import { useEffect, useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import '../components/calendar.css';

const ExpCalendar = () => {
  const [activities, setActivities] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/daily_exp', {
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Network response was not ok');
        }

        const data = await response.json();
        setActivities(data);
      } catch (error) {
        console.error('There has been a problem with your fetch operation:', error);
      }
    };

    fetchData();
  }, []);

  const tileClassName = ({ date, view }) => {
    if (view === 'month') {
      const today = new Date();
      const dayKey = date.toLocaleDateString('sv-SE');
      const expGained = Number(activities[dayKey]);

      if (date.toDateString() === today.toDateString()) {
        return 'react-calendar__tile--now';
      }

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
