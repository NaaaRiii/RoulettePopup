import React from 'react';
import { formatDate } from '../utils/formatDate';

const GoalDetails = ({ goal, onDeleteGoal }) => {
  return (
    <div className='goal-content-top-left-lower-part'>
      <p className='deadline-text'>
        期限: {goal.deadline ? formatDate(goal.deadline) : 'No deadline'}
      </p>
      <a 
        href="#" 
        onClick={onDeleteGoal} 
        data-testid="delete-goal-link" 
        className='delete-goal-link'
      >
        Goalを削除する
      </a>
    </div>
  );
};

export default GoalDetails; 