import { useState } from 'react';
import Router from 'next/router';
import Layout from '../components/Layout';
import '../components/styles.css';

export default function NewGoal() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [deadline, setDeadline] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    const token = localStorage.getItem('token');
    const body = JSON.stringify({ title, content, deadline });

    try {
      const response = await fetch('http://localhost:3000/api/goals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`  // トークンをヘッダーに設定
        },
        body
      });
      const data = await response.json();

      if (response.ok) {
        Router.push(`/goals/${data.id}/new-small_goal`);
      } else {
        console.error("Error submitting form:", data);
      }
    } catch (error) {
      console.error("Submission failed", error);
    }
  };

  return (
    <Layout>
      <div id="goal_form">
        <h1>Let's Set Goals</h1>
        <form onSubmit={handleSubmit}>
          <label htmlFor="title">Goal's Title</label>
          <input id="title" name="title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} />

          <label htmlFor="content">Content</label>
          <input id="content" name="content" type="text" value={content} onChange={(e) => setContent(e.target.value)} />

          <label htmlFor="deadline">Deadline</label>
          <input id="deadline" name="deadline" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />

          <button type="submit" className="btn btn-primary">設定</button>
        </form>
      </div>
    </Layout>
  );
}
