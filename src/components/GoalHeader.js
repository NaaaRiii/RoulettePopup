import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import EditGoalModal from './EditGoal';
import CreateSmallGoal from './CreateSmallGoal';
import { formatDate } from '../utils/formatDate';

const GoalHeader = ({ 
  goal, 
  goalId, 
  onCompleteGoal, 
  onOpenEditGoalModal, 
  onOpenCreateSmallGoalModal,
  isEditGoalModalOpen,
  isCreateSmallGoalModalOpen,
  onCloseEditGoalModal,
  onCloseCreateSmallGoalModal,
  onGoalUpdated,
  onSmallGoalAdded,
  onDeleteGoal,
  userData
}) => {

  const [isHighlighted, setIsHighlighted] = useState(true);

  // 10秒後にハイライトを解除
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsHighlighted(false);
    }, 10000);
    
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <div className='flex flex-col bg-[#FFFCEB] w-full rounded-sm shadow-sm p-4 sm:p-8 lg:p-12 lg:w-[750px]'>
      <div className="mb-4">
        <h2 className="text-xl sm:text-2xl font-bold inline">Goal : </h2>
        <span className="text-xl sm:text-2xl font-normal">{goal.title}</span>
      </div>
      <div className='flex flex-col gap-2'>
        {goal.completed ? (
          <p className="text-sm sm:text-base">このGoalは達成しました!</p>
        ) : (
          <>
            <p className="text-sm sm:text-base">このGoalを完了しますか?</p>
            {!goal.small_goals || goal.small_goals.length === 0 || goal.small_goals.some(sg => !sg.completed) ? (
              <button 
                disabled 
                className='w-full sm:w-auto sm:max-w-[200px] px-3 py-2 mt-2 mb-2 rounded-sm border-none cursor-not-allowed bg-gray-200 text-gray-500 opacity-60 text-sm sm:text-base'
              >
                Goalを完了する
              </button>
            ) : (
              <button 
                onClick={onCompleteGoal} 
                className='w-full sm:w-auto sm:max-w-[200px] px-3 py-2 mt-2 mb-2 rounded-sm border-none cursor-pointer bg-blue-500 text-white hover:bg-blue-600 text-sm sm:text-base'
              >
                Goalを完了する
              </button>
            )}
          </>
        )}
      </div>

      <div className='pt-5'>
        <h2 className="text-lg sm:text-xl lg:text-2xl font-bold mb-4">Goalの詳細 : </h2>
        <span className="text-xl sm:text-2xl font-normal">{goal.content}</span>
        <p className='text-sm sm:text-base lg:text-lg mb-4 mt-3'>
          期限: {goal.deadline ? formatDate(goal.deadline) : 'No deadline'}
        </p>
        <div className='pt-4 '>
          {!goal.completed && (
            <>
              {userData?.is_guest ? (
                <div 
                  className='text-blue-600 opacity-50 cursor-not-allowed text-sm sm:text-base relative group'
                  title="ゲストログイン時は無効"
                >
                  Goalを編集する
                  <div className="absolute bottom-full left-0 mb-2 px-3 py-1 bg-gray-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                    ゲストログイン時は無効
                  </div>
                </div>
              ) : (
                <Link href={`#`} onClick={onOpenEditGoalModal}>
                  <div className='text-blue-600 cursor-pointer hover:text-blue-800 text-sm sm:text-base'>
                    Goalを編集する
                  </div>
                </Link>
              )}
              <EditGoalModal 
                isOpen={isEditGoalModalOpen} 
                onClose={onCloseEditGoalModal} 
                goalId={goalId}
                onGoalUpdated={onGoalUpdated}
              />
            </>
          )}

          <div className='flex justify-between items-center mt-12'>
            <div className='goalid-create-small-goal-container w-48'>
              {userData?.is_guest ? (
                <div 
                  className="btn btn-primary sm:w-auto opacity-50 cursor-not-allowed relative group"
                  title="ゲストログイン時は無効"
                >
                  Small Goalを作成
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-gray-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                    ゲストログイン時は無効
                  </div>
                </div>
              ) : (
                <Link href={`#`} onClick={onOpenCreateSmallGoalModal}>
                  <div className={`btn btn-primary sm:w-auto transition-all duration-500 ${
                    isHighlighted 
                      ? 'animate-pulse bg-orange-500 hover:bg-orange-600 scale-110 shadow-lg border-2 border-yellow-400' 
                      : ''
                  }`}>
                    {isHighlighted ? '✨ Small Goalを作成 ✨' : 'Small Goalを作成'}
                  </div>
                </Link>
              )}
              <CreateSmallGoal
                isOpen={isCreateSmallGoalModalOpen}
                onClose={onCloseCreateSmallGoalModal}
                goalId={goalId}
                onSmallGoalAdded={onSmallGoalAdded}
              />
            </div>
            <div className='mt-8'>
              {userData?.is_guest ? (
                <div 
                  className='text-blue-600 opacity-50 cursor-not-allowed text-sm sm:text-base relative group'
                  title="ゲストログイン時は無効"
                >
                  Goalを削除する
                  <div className="absolute bottom-full right-0 mb-2 px-3 py-1 bg-gray-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                    ゲストログイン時は無効
                  </div>
                </div>
              ) : (
                <a 
                  href="#" 
                  onClick={onDeleteGoal} 
                  data-testid="delete-goal-link" 
                  className='text-blue-600 cursor-pointer hover:text-blue-800 text-sm sm:text-base'
                >
                  Goalを削除する
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GoalHeader; 