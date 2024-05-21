//import { useRouter } from 'next/router';
//import { useEffect, useState } from 'react';
//import Link from 'next/link';
//import Layout from '../../../components/Layout';
//import '../../../components/styles.css';

//function EditSmallGoal() {
//  const router = useRouter();
//  const { goalId } = router.query;
//  const [smallGoal, setSmallGoal] = useState({
//    title: '',
//    tasks: [],
//    difficulty: '',
//    deadline: ''
//  });

//  useEffect(() => {
//    const fetchSmallGoal = async () => {
//      const token = localStorage.getItem('token');
//      try {
//        const response = await fetch(`http://localhost:3000/api/small_goals/${id}`, {
//          headers: { 'Authorization': `Bearer ${token}` }
//        });
//        const data = await response.json();
//        setSmallGoal(data);
//      } catch (error) {
//        console.error('Failed to load small goal', error);
//      }
//    };

//    if (id) {
//      fetchSmallGoal();
//    }
//  }, [id]);

//  const handleChange = (e) => {
//    const { name, value } = e.target;
//    setSmallGoal(prev => ({
//      ...prev,
//      [name]: value
//    }));
//  };

//  const handleSubmit = async (event) => {
//    event.preventDefault();
//    const token = localStorage.getItem('token');
//    try {
//      const response = await fetch(`http://localhost:3000/api/small_goals/${id}`, {
//        method: 'PUT',
//        headers: {
//          'Content-Type': 'application/json',
//          'Authorization': `Bearer ${token}`
//        },
//        body: JSON.stringify(smallGoal)
//      });

//      if (response.ok) {
//        router.push(`/goals/${id}`);
//      } else {
//        console.error("Error updating small goal:", await response.json());
//      }
//    } catch (error) {
//      console.error("Update failed", error);
//    }
//  };

//  return (
//    <Layout>
//      <h1>Edit Small Goal</h1>
//      <form onSubmit={handleSubmit}>
//        <div>
//          <label htmlFor="title">Title</label>
//          <input
//            id="title"
//            name="title"
//            type="text"
//            value={smallGoal.title}
//            onChange={handleChange}
//            required
//          />
//        </div>
//        {/* タスク、難易度、期限のフィールドを追加する */}
//        <button type="submit" className="btn btn-primary">Update Small Goal</button>
//        <Link href={`/goals/${id}`}>
//          <div className={'btn btn-primary'}>Back</div>
//        </Link>
//      </form>
//    </Layout>
//  );
//}

//export default EditSmallGoal;