import { useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import '../components/styles.css';

export default function NewGoal() {
  const router = useRouter();
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
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body
      });

      if (response.ok) {
        const data = await response.json();
        router.push({
          pathname: `/goals/${data.id}/new-small_goal`,
          query: { message: encodeURIComponent(data.message) },
        });
      } else {
        const errorData = await response.json();
        console.error("Error submitting form:", errorData);
      }
    } catch (error) {
      console.error("Submission failed", error);
    }
  };

  return (
    <Layout>
      <div id="goal_form">
        {/* TODO: Fix the unescaped entities issue */}
        {/* eslint-disable-next-line react/no-unescaped-entities */}
        <h1>Let's Set Goals</h1>
        <form onSubmit={handleSubmit}>
          {/* TODO: Fix the unescaped entities issue */}
          {/* eslint-disable-next-line react/no-unescaped-entities */}
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
