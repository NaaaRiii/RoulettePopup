import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import styles from '../components/CreateGoal.module.css';

import { fetchWithAuth } from '../utils/fetchWithAuth';

export default function EditSmallGoalModal({ isOpen, onClose, smallGoal, goalId, onSmallGoalUpdated }) {
  const [title, setTitle] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [deadline, setDeadline] = useState('');
  const [tasks, setTasks] = useState([]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);

    if (isNaN(date.getTime())) {
      console.error('Invalid date:', dateString);
      return 'Invalid date';
    }

    return format(date, 'yyyy-MM-dd');
  };

  useEffect(() => {
    if (smallGoal) {
      console.log("Editing Small Goal:", smallGoal);
      setTitle(smallGoal.title);
      setDifficulty(smallGoal.difficulty);
      setDeadline(formatDate(smallGoal.deadline));
      setTasks(smallGoal.tasks.map(task => ({ ...task, _destroy: false })));
    }
  }, [smallGoal]);

  const handleTaskChange = (taskId, value) => {
    setTasks(tasks.map(task => 
      task.id === taskId ? { ...task, content: value } : task
    ));
  };

  const addTask = () => {
    setTasks([...tasks, { id: `temp-${Date.now()}`, content: '' }]);
  };

  const removeTask = (taskId) => {
    setTasks(tasks.map(task => 
      task.id === taskId ? { ...task, _destroy: true } : task
    ));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!goalId || !smallGoal?.id) {
      console.error("goalId or smallGoal.id is undefined.");
      return;
    }

    const updatedSmallGoal = {
      title,
      difficulty,
      deadline,
      tasks_attributes: tasks.map(task =>
        task._destroy
          ? { id: task.id, _destroy: true }
          : {
              ...(task.id && typeof task.id === 'string' && task.id.startsWith('temp-')
                ? {} // 新規タスクにはIDを送らない
                : { id: task.id }), // 既存タスクにはIDを送る
              content: task.content,
            }
      ),
    };

    try {
      const response = await fetchWithAuth(
        `/api/goals/${goalId}/small_goals/${smallGoal.id}`,
        { method: 'PUT', body: JSON.stringify(updatedSmallGoal) }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to update small goal:', errorText);
        alert('Failed to update small goal: ' + errorText);
      } else {
        const data = await response.json();
        onSmallGoalUpdated(data);
        onClose();
      }
    } catch (error) {
      console.error('Update failed', error);
      alert('Failed to update small goal: ' + error.message);
    }
  };

  if (!isOpen || !smallGoal) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center p-4">
      <div className="
        relative bg-white p-4
        w-full sm:w-[90%] sm:max-w-[600px] lg:max-w-[500px]
        max-h-[90vh] rounded border border-gray-400
        flex flex-col
      ">
        {/* ヘッダー部分（固定） */}
        <div className="p-4 sm:p-5 pb-3 border-b border-gray-200">
          <h2 className="text-xl sm:text-2xl font-bold mb-4">Small Goalを編集しよう！</h2>
        </div>

        {/* スクロール可能なコンテンツ部分 */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="title" className="block mb-2 font-medium text-base">Small Goalのタイトル</label>
              <textarea
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full p-2 border border-gray-300 rounded-sm resize-none text-sm sm:text-base"
                rows={2}
              />
            </div>

            <div className="space-y-4">
              <h3 className="font-medium text-sm sm:text-base">タスク一覧</h3>
              {tasks.filter(task => !task._destroy).map((task, index) => (
                <div key={task.id || `temp-${index}`} className="p-3 bg-gray-50 rounded border">
                  <label htmlFor={`task-${task.id || `temp-${index}`}`} className="block mb-2 font-medium text-base">タスク {index + 1}</label>
                  <textarea
                    id={`task-${task.id || `temp-${index}`}`}
                    type="text"
                    value={task.content}
                    onChange={(e) => handleTaskChange(task.id, e.target.value)}
                    required
                    className="w-full p-2 border border-gray-300 rounded-sm resize-none mb-2 text-sm sm:text-base"
                    rows={2}
                  />
                  {tasks.filter(task => !task._destroy).length > 1 && (
                    <button 
                      type="button" 
                      onClick={() => removeTask(task.id)}
                      className="w-full sm:w-auto px-3 py-1 text-sm border border-red-300 rounded-sm bg-red-50 hover:bg-red-100 text-red-700 cursor-pointer"
                    >
                      タスクを削除
                    </button>
                  )}
                </div>
              ))}
              
              <button 
                type="button" 
                onClick={addTask}
                className="w-full px-3 py-2 border border-green-300 rounded-sm bg-green-50 hover:bg-green-100 text-green-700 cursor-pointer"
              >
                + タスクを追加
              </button>
            </div>
            
            <div>
              <label htmlFor="difficulty" className="block mb-2 font-medium text-sm sm:text-base">難易度</label>
              <select
                id="difficulty"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                required
                className="w-full p-2 border border-gray-300 rounded-sm text-sm sm:text-base"
              >
                <option value="ものすごく簡単">ものすごく簡単</option>
                <option value="簡単">簡単</option>
                <option value="普通">普通</option>
                <option value="難しい">難しい</option>
                <option value="とても難しい">とても難しい</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="deadline" className="block mb-2 font-medium text-sm sm:text-base">期限</label>
              <input
                id="deadline"
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                required
                className="w-full p-2 border border-gray-300 rounded-sm text-sm sm:text-base"
              />
            </div>
          </form>
        </div>

        <div className="flex-shrink-0 py-4 space-y-4 space-y-reverse border-t border-gray-200">
          <button 
            type="submit" 
            onClick={handleSubmit}
            className="btn btn-primary w-full sm:w-auto"
          >
            更新する
          </button>
        </div>
        
          <button onClick={onClose} className={styles.closeButton}>Close</button>
      </div>
    </div>
  );
}
