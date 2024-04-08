import { useState } from 'react';
import Router from 'next/router';

export default function NewGoal() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [deadline, setDeadline] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    // ここでAPIにデータを送信する処理を実装します
    // 例: fetch('/api/goals', { method: 'POST', body: JSON.stringify({ title, content, deadline }), headers: { 'Content-Type': 'application/json' } })
    // APIからのレスポンスに基づいて適切なアクションを取ります（例: リダイレクト）
    Router.push('/goalList'); // 例としてリダイレクト
  };

  return (
    <div id="goal_form">
      <h1>Let's Set Goals</h1>
      <form onSubmit={handleSubmit}>
        <div id="error_explanation">
          {/* エラーメッセージを表示する部分 */}
        </div>

        <label htmlFor="title">Goal's Title</label>
        <input
          id="title"
          name="title"
          type="text"
          className="goal-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <label htmlFor="content">Content</label>
        <input
          id="content"
          name="content"
          type="text"
          className="goal-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />

        <label htmlFor="deadline">Deadline</label>
        <input
          id="deadline"
          name="deadline"
          type="date"
          className="goal-deadline"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
        />

        <button type="submit" className="btn btn-primary">設定</button>
      </form>
    </div>
  );
}
