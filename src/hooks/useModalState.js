import { useState } from 'react';

export const useModalState = () => {
  const [isCreateSmallGoalModalOpen, setIsCreateSmallGoalModalOpen] = useState(false);
  const [isEditGoalModalOpen, setIsEditGoalModalOpen] = useState(false);
  const [isEditSmallGoalModalOpen, setIsEditSmallGoalModalOpen] = useState(false);
  const [selectedSmallGoal, setSelectedSmallGoal] = useState(null);

  const openCreateSmallGoalModal = () => {
    setIsCreateSmallGoalModalOpen(true);
  };

  const closeCreateSmallGoalModal = () => {
    setIsCreateSmallGoalModalOpen(false);
  };

  const openEditGoalModal = () => {
    setIsEditGoalModalOpen(true);
  };

  const closeEditGoalModal = () => {
    setIsEditGoalModalOpen(false);
  };

  const openEditSmallGoalModal = (smallGoal) => {
    if (smallGoal) {
      setSelectedSmallGoal(smallGoal);
      setIsEditSmallGoalModalOpen(true);
    } else {
      console.error("Small Goal is missing");
    }
  };

  const closeEditSmallGoalModal = () => {
    setIsEditSmallGoalModalOpen(false);
    setSelectedSmallGoal(null);
  };

  return {
    isCreateSmallGoalModalOpen,
    isEditGoalModalOpen,
    isEditSmallGoalModalOpen,
    selectedSmallGoal,
    
    openCreateSmallGoalModal,
    closeCreateSmallGoalModal,
    
    openEditGoalModal,
    closeEditGoalModal,
    
    openEditSmallGoalModal,
    closeEditSmallGoalModal,
  };
}; 