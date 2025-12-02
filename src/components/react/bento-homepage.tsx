import { 
  BentoGrid, 
  ProfileCard, 
  ProjectCard, 
  InfoCard, 
  QuickActionCard,
  StatusCard 
} from './bento-grid';

export const BentoHomepage: React.FC = () => {
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-pink-900/20 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* 顶部标题区域 */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
            Welcome to My Digital Space
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Building thoughtful products with a human touch
          </p>
        </div>

        {/* Bento Grid 布局 */}
        <BentoGrid>
          {/* 个人简介卡片 - 占据左侧两行 */}
          <ProfileCard
            name="Elara Vance"
            title="Product Manager & Hacker"
            description="Building thoughtful products with a human touch. Inspired by nature, driven by data."
            avatar="🌿"
          />

          {/* 产品哲学卡片 */}
          <InfoCard
            title="Product Philosophy"
            subtitle="GROWTH & HARMONY"
            content="I believe in creating that grow organically. My products feel delightful and sustainable scaling ever respect for the ecosystem."
            gradient="bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30"
            icon="🌱"
            span="md:col-span-2"
          />

          {/* LinkedIn 卡片 */}
          <ProjectCard
            title="LinkedIn"
            description=""
            icon="💼"
            color="from-blue-500 to-blue-600"
            span="md:col-span-1"
          />

          {/* Sprint Velocity 卡片 */}
          <ProjectCard
            title="Sprint Velocity"
            description="CONSISTENT GROWTH"
            icon="📊"
            color="from-yellow-400 to-orange-400"
            span="md:col-span-1"
          />

          {/* The Garden Path 卡片 */}
          <InfoCard
            title="The Garden Path"
            subtitle="Weekly thoughts on PM & Design"
            content="Latest issue"
            gradient="bg-gradient-to-br from-pink-100 to-rose-100 dark:from-pink-900/30 dark:to-rose-900/30"
            icon="📝"
            span="md:col-span-2"
          />

          {/* Deep Focus 状态卡片 */}
          <StatusCard
            status="Deep Focus"
            label="MY AFTERNOON"
            icon="🎯"
            gradient="bg-gradient-to-br from-gray-600 to-gray-700 dark:from-gray-700 dark:to-gray-800"
          />

          {/* Coffee Chat 快速操作卡片 */}
          <QuickActionCard
            title="☕ Coffee Chat"
            action="BOOK NOW"
            gradient="bg-gradient-to-br from-amber-100 to-yellow-100 dark:from-amber-900/30 dark:to-yellow-900/30"
          />

          {/* Add Friend 快速操作卡片 */}
          <QuickActionCard
            title="Add Friend"
            action="Add Friend"
            gradient="bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700"
          />
        </BentoGrid>

        {/* 底部说明 */}
        <div className="mt-12 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Made with ❤️ using Astro + React + Tailwind
          </p>
        </div>
      </div>
    </div>
  );
};

export default BentoHomepage;
