import React from 'react';
import SmallGoalCard from './SmallGoalCard';
import EditSmallGoalModal from './EditSmallGoal';

const SmallGoalList = ({
  goal,
  selectedSmallGoal,
  isEditSmallGoalModalOpen,
  onCloseEditSmallGoalModal,
  onTaskToggle,
  onCompleteSmallGoal,
  onOpenEditSmallGoalModal,
  onDeleteSmallGoal,
  onSmallGoalUpdated,
  setGoal
}) => {
  const incompleteSmallGoals = goal.small_goals.filter(smallGoal => !smallGoal.completed);
  const completedSmallGoals = goal.small_goals.filter(smallGoal => smallGoal.completed);

  return (
    <div className="goal-content-bottom">
      {/* 未完了のSmall Goals */}
      <div className="goal-content-bottom-top">
        {incompleteSmallGoals.map(smallGoal => (
          <SmallGoalCard
            key={smallGoal.id}
            smallGoal={smallGoal}
            isCompleted={false}
            onTaskToggle={onTaskToggle}
            onCompleteSmallGoal={onCompleteSmallGoal}
            onOpenEditSmallGoalModal={onOpenEditSmallGoalModal}
            onDeleteSmallGoal={onDeleteSmallGoal}
            goal={goal}
            setGoal={setGoal}
          />
        ))}
      </div>

      {/* EditSmallGoal モーダル */}
      <EditSmallGoalModal
        isOpen={isEditSmallGoalModalOpen}
        onClose={onCloseEditSmallGoalModal}
        smallGoal={selectedSmallGoal}
        goalId={goal.id}
        onSmallGoalUpdated={onSmallGoalUpdated}
      />

      {/* 完了済みのSmall Goals */}
      <div className="goal-content-bottom-bottom">
        {completedSmallGoals.map(smallGoal => (
          <SmallGoalCard
            key={smallGoal.id}
            smallGoal={smallGoal}
            isCompleted={true}
            onTaskToggle={onTaskToggle}
            onCompleteSmallGoal={onCompleteSmallGoal}
            onOpenEditSmallGoalModal={onOpenEditSmallGoalModal}
            onDeleteSmallGoal={onDeleteSmallGoal}
            goal={goal}
            setGoal={setGoal}
          />
        ))}
      </div>
    </div>
  );
};

export default SmallGoalList; 