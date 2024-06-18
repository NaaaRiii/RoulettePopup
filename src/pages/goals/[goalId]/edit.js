import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Layout from '../../../components/Layout';
import '../../../components/styles.css';

function EditGoal() {
  const router = useRouter();
  const { goalId } = router.query;
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [deadline, setDeadline] = useState('');
  const [ message ] = useState('');

  useEffect(() => {
    if (goalId) {
      fetch(`http://localhost:3000/api/goals/${goalId}`, {
        method: 'GET',
        credentials: 'include'
      })
      .then(response => response.json())
      .then(data => {
        setTitle(data.title);
        setContent(data.content);
        setDeadline(data.deadline);
      })
      .catch(error => console.error('Failed to load goal', error));
    }
  }, [goalId]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const updatedGoal = {
      title,
      content,
      deadline
    };

    try {
      const response = await fetch(`http://localhost:3000/api/goals/${goalId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(updatedGoal)
      });

      if (response.ok) {
        router.push(`/goals/${goalId}?message=Goal was successfully updated`);
      } else {
        const errorData = await response.json();
        console.error("Error updating goal:", errorData);
      }
    } catch (error) {
      console.error("Update failed", error);
    }
  };

  return (
    <Layout>
      {message && <p>{message}</p>}
      <h1>Let's Edit Goals</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="title">Goal's Title</label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="content">Content</label>
          <input
            id="content"
            type="text"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="deadline">Deadline</label>
          <input
            id="deadline"
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="btn btn-primary">Update Goal</button>
        <Link href={`/goals/${goalId}`}>
          <div className={'btn btn-primary'}>Back</div>
        </Link>
      </form>
    </Layout>
  );
}

export default EditGoal;
