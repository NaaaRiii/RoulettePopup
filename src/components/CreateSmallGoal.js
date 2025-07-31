import React from 'react';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import styles from '../components/CreateGoal.module.css';

import { fetchWithAuth } from '../utils/fetchWithAuth';

export default function CreateSmallGoal({ isOpen, onClose, goalId, onSmallGoalAdded }) {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [tasks, setTasks] = useState([{ id: Date.now(), content: '' }]);
  const [difficulty, setDifficulty] = useState('');
  const [deadline, setDeadline] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setTasks([{ id: Date.now(), content: '' }]);
      setDifficulty('');
      setDeadline('');
      setMessage('');
    }
  }, [isOpen]);

  useEffect(() => {
    const messageFromQuery = router.query.message;
    if (messageFromQuery) {
      setMessage(decodeURIComponent(messageFromQuery));
    }
  }, [router.query]);

  const handleTaskChange = (index, value) => {
    const newTasks = tasks.map((task, i) => {
      if (i === index) {
        return { ...task, content: value };
      }
      return task;
    });
    setTasks(newTasks);
  };

  const addTask = () => {
    setTasks([...tasks, { id: `temp-${Date.now()}`, content: '' }]);
  };

  const removeTask = (index) => {
    if (tasks.length > 1) {
      setTasks(tasks.filter((_, i) => i !== index));
    }
  };

  const handleClose = () => {
    setMessage('');
    onClose();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const body = JSON.stringify({
      small_goal: {
        title,
        difficulty,
        deadline,
        tasks_attributes: tasks.map(task => ({
          content: task.content
        }))
      }
    });

    try {
      const response = await fetchWithAuth(
        `/api/goals/${goalId}/small_goals`,
        { method: 'POST', body }
      );

      if (response.ok) {
        const data = await response.json();
        if (onSmallGoalAdded) {
          onSmallGoalAdded(data);
        }
        onClose();
      } else {
        const errorData = await response.json();
        setMessage(errorData.errors.join(', '));
      }
    } catch (error) {
      console.error("Submission failed", error);
      setMessage('Submission failed, please try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center p-4" data-testid="create-small-goal">
      <div className="relative bg-white w-full max-w-[500px] max-h-[90vh] rounded border border-gray-400 flex flex-col">
        {/* ヘッダー部分（固定） */}
        <div className="p-5 pb-3 border-b border-gray-200">
          <h2 className="text-2xl font-bold mb-4">Small Goalを設定しよう!</h2>
          {message && (
            <div role="alert" className="text-red-600 mb-3 text-center">
              {message}
            </div>
          )}
        </div>

        {/* スクロール可能なコンテンツ部分 */}
        <div className="flex-1 overflow-y-auto p-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="title" className="block mb-2 font-medium">Small Goalのタイトル</label>
              <textarea
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full p-2 border border-gray-300 rounded-sm resize-none"
                rows={2}
              />
            </div>

            <div className="space-y-4">
              <h3 className="font-medium">タスク一覧</h3>
              {tasks.map((task, index) => (
                <div key={task.id} className="p-3 bg-gray-50 rounded border">
                  <label htmlFor={`task-${task.id}`} className="block mb-2 font-medium">タスク {index + 1}</label>
                  <textarea
                    id={`task-${task.id}`}
                    type="text"
                    value={task.content}
                    onChange={(e) => handleTaskChange(index, e.target.value)}
                    required
                    className="w-full p-2 border border-gray-300 rounded-sm resize-none mb-2"
                    rows={2}
                  />
                  {tasks.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeTask(index)}
                      className="px-3 py-1 text-sm border border-red-300 rounded-sm bg-red-50 hover:bg-red-100 text-red-700 cursor-pointer"
                    >
                      タスクの削除
                    </button>
                  )}
                </div>
              ))}
              
              <button 
                type="button" 
                onClick={addTask} 
                className="w-full px-3 py-2 border border-green-300 rounded-sm bg-green-50 hover:bg-green-100 text-green-700 cursor-pointer"
              >
                + タスクの追加
              </button>
            </div>

            <div>
              <label htmlFor="difficulty" className="block mb-2 font-medium">難易度の設定</label>
              <select
                id="difficulty"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                required
                className="w-full p-2 border border-gray-300 rounded-sm"
              >
                <option value="">難易度を選択</option>
                <option value="ものすごく簡単">ものすごく簡単</option>
                <option value="簡単">簡単</option>
                <option value="普通">普通</option>
                <option value="難しい">難しい</option>
                <option value="とても難しい">とても難しい</option>
              </select>
            </div>

            <div>
              <label htmlFor="deadline" className="block mb-2 font-medium">期限</label>
              <input
                id="deadline"
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                required
                className="w-full p-2 border border-gray-300 rounded-sm"
              />
            </div>
          </form>
        </div>

        {/* フッター部分（固定） */}
        <div className="p-5 pt-3 border-t border-gray-200 bg-gray-50">
          <button 
            type="submit" 
            onClick={handleSubmit}
            className="w-full px-3 py-2 border-none cursor-pointer bg-blue-500 text-white hover:bg-blue-600 rounded font-medium"
          >
            設定する
          </button>
          <button 
            onClick={handleClose} 
            className="w-full mt-2 px-3 py-2 border border-gray-300 rounded bg-white hover:bg-gray-50 cursor-pointer"
          >
            キャンセル
          </button>
        </div>
      </div>
    </div>
  );
}
