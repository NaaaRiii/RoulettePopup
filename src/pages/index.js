import Link from 'next/link';
//import Layout from '../components/Layout';
import '../components/styles.css';

export default function Home() {
  return (
    //<Layout>
      <div className="background-image">
        <header className="header">
          <h1>Plus ONE</h1> 
        </header>
        <div className="content">
          <h1 className="welcome-text">Welcome to the Plus ONE</h1>
          <div className="button-container">
            <Link href="/signup">
              <button className="button">Sign Up</button>
            </Link>
            <Link href="/login">
              <button className="button">Log In</button>
            </Link>
          </div>
        </div>
        <div className="log-dex-footer">
          <ul className="flex_list">
            <li>About</li>
            <li>Contact Us</li>
          </ul>
          <div className="footer_copyright">
            ©︎ 2023 Plus ONE, Inc.
          </div>
        </div>
      </div>
    //</Layout>
  );
}
