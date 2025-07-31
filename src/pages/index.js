import Link from 'next/link';
import Layout from '../components/Layout';
import Image from 'next/image';
import '../components/styles.css';

export default function HomePage() {
  return (
    <Layout>
			<div className="top-page">
				{/* Hero Section */}
				<section className="hero">
					<p className="hero-title">Plus ONEで成長を可視化しよう！</p>
					<div className="button-container">
            <Link href="/guest-signin">
              <button className="button">お試し</button>
            </Link>
            <Link href="/dashboard">
              <button className="button">ログイン</button>
            </Link>
          </div>
				</section>

				{/* Goal Setting Section */}
				<section className="feature-goal">
					<div className="feature-card goal-text">
						<h3>Goalの設定</h3>
						<p>達成したいGoal(目標)を設定しましょう。</p>
					</div>
					<div className="goal-image">
						<Image
							src="/images/Goal-setting.png"
							alt="Goal 設定フォーム"
							width={300}
							height={225}
						/>
					</div>
				</section>

				{/* Small Goal Setting Section */}
				<section className="feature-small">
					<div className="small-goal-image">
						<Image
							src="/images/Small_Goal-setting.png"
							alt="Small Goal 設定フォーム"
							width={400}
							height={250}
						/>
					</div>
					<div className="feature-card small-goal-text">
						<h3>Small Goalの設定</h3>
						<p>Goalを細分化し、Small Goalとタスクを設定しましょう。</p>
					</div>
				</section>

				{/* EXP Section */}
				<section className="feature-exp">
					<div className="feature-card exp-text">
						<h3>EXPの獲得</h3>
						<p>カレンダーには、1日に獲得したEXPの量が多いほど、<br />
							色が濃く表示されます。</p>
						<p>グラフには、1週間分のEXPの推移が表示されます。</p>
					</div>
					<div className="exp-image">
						<Image
							src="/images/calendar-chart.png"
							alt="EXP カレンダーとグラフ"
							width={600}
							height={400}
						/>
					</div>
				</section>
			</div>
    </Layout>
  );
} 