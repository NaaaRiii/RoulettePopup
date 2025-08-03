import Link from 'next/link';
import Layout from '../components/Layout';
import Image from 'next/image';
import '../components/styles.css';

export default function HomePage() {
  return (
    <Layout>
      <div className="min-h-screen bg-[#FFFFEE] flex flex-col">
        {/* Hero Section */}
        <section className="hero bg-cover bg-center bg-no-repeat w-full px-4 sm:px-6 md:px-8 py-20 md:py-32 min-h-[250px] bg-[#f7f7ed] flex flex-col items-center text-center">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-6 md:mb-8 text-[#373741] max-w-4xl leading-relaxed">
            Plus ONEで成長を可視化しよう！
          </h1>
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
            <Link href="/guest-signin" className="px-6 py-3 sm:px-8 sm:py-4 text-base sm:text-lg text-white bg-black bg-opacity-50 border-none rounded hover:bg-opacity-70 transition-colors cursor-pointer whitespace-nowrap inline-block text-center">
              お試し
            </Link>
            <Link href="/dashboard" className="px-6 py-3 sm:px-8 sm:py-4 text-base sm:text-lg text-white bg-black bg-opacity-50 border-none rounded hover:bg-opacity-70 transition-colors cursor-pointer whitespace-nowrap inline-block text-center">
              ログイン
            </Link>
          </div>
        </section>

        {/* Goal Setting Section */}
        <section className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-12 w-full max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-12 md:py-20">
          <div className="flex-1 max-w-md text-center md:text-left">
            <div className="bg-[rgb(240,239,226)] rounded-lg p-6 md:p-8 shadow-sm">
              <h3 className="text-xl md:text-2xl font-semibold mb-3 md:mb-4 text-[#373741]">Goalの設定</h3>
              <p className="text-base md:text-lg leading-relaxed text-[#373741]">達成したいGoal(目標)を設定しましょう。</p>
            </div>
          </div>
          <div className="flex-1 flex justify-center max-w-md">
            <Image
              src="/images/Goal-setting.png"
              alt="Goal 設定フォーム"
              width={300}
              height={225}
              className="w-full h-auto max-w-sm rounded-lg shadow-sm"
            />
          </div>
        </section>

        {/* Small Goal Setting Section */}
        <section className="flex flex-col md:flex-row-reverse items-center justify-center gap-8 md:gap-12 w-full max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-12 md:py-20">
          <div className="flex-1 max-w-md text-center md:text-left">
            <div className="bg-[rgb(240,239,226)] rounded-lg p-6 md:p-8 shadow-sm">
              <h3 className="text-xl md:text-2xl font-semibold mb-3 md:mb-4 text-[#373741]">Small Goalの設定</h3>
              <p className="text-base md:text-lg leading-relaxed text-[#373741]">Goalを細分化し、Small Goalとタスクを設定しましょう。</p>
            </div>
          </div>
          <div className="flex-1 flex justify-center max-w-md">
            <Image
              src="/images/Small_Goal-setting.png"
              alt="Small Goal 設定フォーム"
              width={400}
              height={250}
              className="w-full h-auto max-w-sm rounded-lg shadow-sm"
            />
          </div>
        </section>

        {/* EXP Section */}
        <section className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-12 w-full max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-12 md:py-20">
          <div className="flex-1 max-w-md text-center md:text-left">
            <div className="bg-[rgb(240,239,226)] rounded-lg p-6 md:p-8 shadow-sm">
              <h3 className="text-xl md:text-2xl font-semibold mb-3 md:mb-4 text-[#373741]">EXPの獲得</h3>
              <p className="text-base md:text-lg leading-relaxed text-[#373741] mb-3">
                カレンダーには、1日に獲得したEXPの量が多いほど、色が濃く表示されます。
              </p>
              <p className="text-base md:text-lg leading-relaxed text-[#373741]">
                グラフには、1週間分のEXPの推移が表示されます。
              </p>
            </div>
          </div>
          <div className="flex-1 flex justify-center max-w-lg">
            <Image
              src="/images/calendar-chart.png"
              alt="EXP カレンダーとグラフ"
              width={600}
              height={400}
              className="w-full h-auto max-w-lg rounded-lg shadow-sm"
            />
          </div>
        </section>
      </div>
    </Layout>
  );
}