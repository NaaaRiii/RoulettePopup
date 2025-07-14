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
    <div className='goal-content-top-left-card'>
      <h2>Goal : {goal.title}</h2>
      <div className='completed-goal-button-container'>
        {goal.completed ? (
          <p>このGoalは達成しました!</p>
        ) : (
          <>
            <p>このGoalを完了しますか?</p>
            {goal.small_goals?.some(sg => !sg.completed) ? (
              <button disabled className='completed-goal-button'>
                Goalを完了する
              </button>
            ) : (
              <button onClick={onCompleteGoal} className='button-completed-goal'>
                Goalを完了する
              </button>
            )}
          </>
        )}
      </div>

      <div className='goal-content-top-left-lower-part'>
        <h2>Goalの詳細 : {goal.content}</h2>
          <p className='deadline-text'>
            期限: {goal.deadline ? formatDate(goal.deadline) : 'No deadline'}
          </p>
        <div className='goal-content-top-left-lower-part-link'>
          {!goal.completed && (
            <>
              <Link href={`#`} onClick={onOpenEditGoalModal}>
                <div className='edit-goal-link'>
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

          <div className='add-small-goal-button'>
            <Link href={`#`} onClick={onOpenCreateSmallGoalModal}>
              <div className="add-small-goal-button-link">
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
            className='delete-goal-link'
          >
            Goalを削除する
          </a>
        </div>
      </div>
    </div>
  );
};

export default GoalHeader; 