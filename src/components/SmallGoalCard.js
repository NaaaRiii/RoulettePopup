import React from 'react';
import Link from 'next/link';
import { formatDate } from '../utils/formatDate';

const SmallGoalCard = ({ 
  smallGoal, 
  isCompleted = false,
  onTaskToggle,
  onCompleteSmallGoal,
  onOpenEditSmallGoalModal,
  onDeleteSmallGoal,
  goal,
  setGoal
}) => {
  const cardClass = isCompleted 
    ? "c-card goalid-small-goal" 
    : "c-card goalid-small-goal";

  const topClass = isCompleted 
    ? "goalid-small-goal__top goalid-small-goal__top--completed"
    : "goalid-small-goal__top";

  return (
    <div className={cardClass}>
      <div className={topClass}>
        <div className="goalid-small-goal__left">
          <h3 className="goalid-small-goal__title">{smallGoal.title}</h3>
        </div>
        <div className="goalid-small-goal__right">
          <p className="goalid-small-goal__deadline">
            期限: {smallGoal.deadline ? formatDate(smallGoal.deadline) : 'No deadline'}
          </p>
          <p className="goalid-small-goal__difficulty">難易度: {smallGoal.difficulty}</p>
        </div>
        {isCompleted && (
          <span className="completed-text"><strong>完了!</strong></span>
        )}
      </div>

      {!isCompleted ? (
        <div className="goalid-small-goal__bottom">
          <div className="goalid-small-goal__tasks">
            <ul>
              {smallGoal.tasks?.map(task => (
                <li key={task.id}>
                  <label>
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => onTaskToggle(task.id, task.completed)}
                      className="input-checkbox"
                    />
                    {task.content}
                  </label>
                </li>
              ))}
            </ul>
            {!smallGoal.completed && smallGoal.tasks?.every(task => task.completed) && (
              <button 
                className="w-[20%] px-3 py-2 mt-2 mb-2 rounded-sm border-none cursor-pointer bg-blue-500 text-white hover:bg-blue-600" 
                onClick={() => onCompleteSmallGoal(smallGoal.id, goal, setGoal)}
              >
                完了
              </button>
            )}
          </div>

          <div className='goalid-small-goal__actions'>
            <Link href='#' onClick={(e) => { 
              e.preventDefault(); 
              onOpenEditSmallGoalModal(smallGoal); 
            }}>
              <div className='goalid-small-goal__edit-link'>編集</div>
            </Link>
            <Link href='#' onClick={(e) => { 
              e.preventDefault(); 
              onDeleteSmallGoal(smallGoal.id); 
            }}>
              <div className='goalid-small-goal__delete-link' data-testid={`delete-small-goal-${smallGoal.id}`}>
                削除
              </div>
            </Link>
          </div>
        </div>
      ) : (
        <div className="goalid-small-goal__tasks-completed">
          <ul>
            {smallGoal.tasks?.map(task => (
              <li key={task.id}>
                ・{task.content}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default SmallGoalCard; 