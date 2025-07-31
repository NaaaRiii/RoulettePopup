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
    <div className='flex flex-col bg-[#FFFCEB] w-[70%] rounded-sm shadow-sm p-12 px-15'>
      <h2 className="text-2xl font-bold mb-4">Goal : {goal.title}</h2>
      <div className='flex flex-col gap-2'>
        {goal.completed ? (
          <p>このGoalは達成しました!</p>
        ) : (
          <>
            <p>このGoalを完了しますか?</p>
            {!goal.small_goals || goal.small_goals.length === 0 || goal.small_goals.some(sg => !sg.completed) ? (
              <button 
                disabled 
                className='w-[30%] px-3 py-2 mt-2 mb-2 rounded-sm border-none cursor-not-allowed bg-gray-200 text-gray-500 opacity-60'
              >
                Goalを完了する
              </button>
            ) : (
              <button 
                onClick={onCompleteGoal} 
                className='w-[30%] px-3 py-2 mt-2 mb-2 rounded-sm border-none cursor-pointer bg-blue-500 text-white hover:bg-blue-600'
              >
                Goalを完了する
              </button>
            )}
          </>
        )}
      </div>

      <div className='pt-5'>
        <h2 className="text-2xl font-bold mb-4">Goalの詳細 : {goal.content}</h2>
        <p className='text-lg mb-4'>
          期限: {goal.deadline ? formatDate(goal.deadline) : 'No deadline'}
        </p>
        <div className='pt-4'>
          {!goal.completed && (
            <>
              <Link href={`#`} onClick={onOpenEditGoalModal}>
                <div className='text-blue-600 cursor-pointer hover:text-blue-800 mb-5'>
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

          <div className='mb-4'>
            <Link href={`#`} onClick={onOpenCreateSmallGoalModal}>
              <div className="text-green-600 cursor-pointer hover:text-green-800">
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
          <a 
            href="#" 
            onClick={onDeleteGoal} 
            data-testid="delete-goal-link" 
            className='text-blue-600 cursor-pointer hover:text-blue-800 flex justify-end'
          >
            Goalを削除する
          </a>
        </div>
      </div>
    </div>
  );
};

export default GoalHeader; 