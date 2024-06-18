import Head from 'next/head';
import Header from './Header';
import Footer from './Footer';

export default function Layout({ children }) {
  return (
    <>
      <Head>
        <title>Plus ONE</title>
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <meta charSet="utf-8" />
        {/* その他のmetaタグ */}
        {/*<link rel="stylesheet" href="src/components/styles.css" />*/}
        {/* jQueryを使用する場合 */}
        {/*<script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>*/}
      </Head>
      <Header />
      <div className="main">
        <div id="dashboard">
          {children}
        </div>
      </div>
      <Footer>
      </Footer>
    </>
  );
}
