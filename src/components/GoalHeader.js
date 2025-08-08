import React from 'react';
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
  onDeleteGoal
}) => {
  return (
    <div className='flex flex-col bg-[#FFFCEB] w-full rounded-sm shadow-sm p-4 sm:p-8 lg:p-12'>
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
        <div className='pt-4 space-y-3'>
          {!goal.completed && (
            <>
              <Link href={`#`} onClick={onOpenEditGoalModal}>
                <div className='text-blue-600 cursor-pointer hover:text-blue-800 text-sm sm:text-base'>
                  Goalを編集する
                </div>
              </Link>
              <EditGoalModal 
                isOpen={isEditGoalModalOpen} 
                onClose={onCloseEditGoalModal} 
                goalId={goalId}
                onGoalUpdated={onGoalUpdated}
              />
            </>
          )}

          <div>
            <Link href={`#`} onClick={onOpenCreateSmallGoalModal}>
              <div className="text-green-600 cursor-pointer hover:text-green-800 text-sm sm:text-base">
                Small Goalの作成
              </div>
            </Link>
            <CreateSmallGoal
              isOpen={isCreateSmallGoalModalOpen}
              onClose={onCloseCreateSmallGoalModal}
              goalId={goalId}
              onSmallGoalAdded={onSmallGoalAdded}
            />
          </div>
          <div className='flex justify-end'>
            <a 
              href="#" 
              onClick={onDeleteGoal} 
              data-testid="delete-goal-link" 
              className='text-blue-600 cursor-pointer hover:text-blue-800 text-sm sm:text-base'
            >
              Goalを削除する
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GoalHeader; 