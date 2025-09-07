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
  setGoal,
  userData
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
                  <label className="flex items-center cursor-pointer">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={() => onTaskToggle(task.id, task.completed)}
                        className="sr-only"
                      />
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                        task.completed 
                          ? 'bg-[#e7833c] border-[#e7833c]' 
                          : 'bg-white border-gray-300'
                      }`}>
                        {task.completed && (
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </div>
                    <span className="ml-2">{task.content}</span>
                  </label>
                </li>
              ))}
            </ul>
            {!smallGoal.completed && smallGoal.tasks?.every(task => task.completed) && (
              userData?.is_guest ? (
                <div className="relative group inline-block">
                  <button 
                    disabled
                    className="px-3 py-2 mt-2 rounded-sm border-none cursor-not-allowed text-white opacity-60"
                    style={{ backgroundColor: '#e7833c' }}
                    title="ゲストログイン時は無効"
                  >
                    完了
                  </button>
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-gray-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                    ゲストログイン時は無効
                  </div>
                </div>
              ) : (
                <button 
                  className="px-3 py-2 mt-2 rounded-sm border-none cursor-pointer text-white transition-colors duration-200" 
                  style={{ backgroundColor: '#e7833c' }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#8B7355'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#e7833c'}
                  onClick={() => onCompleteSmallGoal(smallGoal.id, goal, setGoal)}
                >
                  完了
                </button>
              )
            )}
          </div>

          <div className='flex flex-row gap-2.5 absolute bottom-2 right-2'>
            {userData?.is_guest ? (
              <div 
                className='opacity-50 cursor-not-allowed relative group'
                style={{ color: '#e7833c' }}
                title="ゲストログイン時は無効"
              >
                編集
                <div className="absolute bottom-full right-0 mb-2 px-3 py-1 bg-gray-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                  ゲストログイン時は無効
                </div>
              </div>
            ) : (
              <Link href='#' onClick={(e) => {
                e.preventDefault();
                onOpenEditSmallGoalModal(smallGoal);
              }}>
                <div className='cursor-pointer'
                  style={{ color: '#e7833c' }}>
                  編集
                </div>
              </Link>
            )}
            {userData?.is_guest ? (
              <div 
                className='opacity-50 cursor-not-allowed relative group'
                style={{ color: '#8c7869' }}
                title="ゲストログイン時は無効"
                data-testid={`delete-small-goal-${smallGoal.id}`}
              >
                削除
                <div className="absolute bottom-full right-0 mb-2 px-3 py-1 bg-gray-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                  ゲストログイン時は無効
                </div>
              </div>
            ) : (
              <Link href='#' onClick={(e) => {
                e.preventDefault();
                onDeleteSmallGoal(smallGoal.id);
              }}>
                <div className='cursor-pointer'
                  style={{ color: '#8c7869' }}
                  data-testid={`delete-small-goal-${smallGoal.id}`}>
                  削除
                </div>
              </Link>
            )}
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
