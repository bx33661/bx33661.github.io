import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface BentoCardProps {
  className?: string;
  children: React.ReactNode;
  gradient?: string;
}

export const BentoCard: React.FC<BentoCardProps> = ({ 
  className, 
  children, 
  gradient 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={cn(
        'rounded-3xl p-6 backdrop-blur-sm',
        'border border-gray-200/50 dark:border-gray-700/50',
        'shadow-lg hover:shadow-xl transition-all duration-300',
        'group cursor-pointer',
        gradient || 'bg-white/80 dark:bg-gray-800/80',
        className
      )}
      whileHover={{ scale: 1.02, y: -5 }}
      whileTap={{ scale: 0.98 }}
    >
      {children}
    </motion.div>
  );
};

interface BentoGridProps {
  children: React.ReactNode;
  className?: string;
}

export const BentoGrid: React.FC<BentoGridProps> = ({ children, className }) => {
  return (
    <div className={cn(
      'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-auto',
      className
    )}>
      {children}
    </div>
  );
};

interface ProfileCardProps {
  name: string;
  title: string;
  description: string;
  avatar?: string;
}

export const ProfileCard: React.FC<ProfileCardProps> = ({ 
  name, 
  title, 
  description,
  avatar 
}) => {
  return (
    <BentoCard className="md:col-span-1 md:row-span-2">
      <div className="flex flex-col h-full justify-between">
        {avatar && (
          <div className="mb-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold overflow-hidden">
              {avatar.startsWith('http') ? (
                <img src={avatar} alt={name} className="w-full h-full object-cover" />
              ) : (
                <span>{avatar}</span>
              )}
            </div>
          </div>
        )}
        <div className="flex-1">
          <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">
            {name}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {title}
          </p>
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
            {description}
          </p>
        </div>
      </div>
    </BentoCard>
  );
};

interface ProjectCardProps {
  title: string;
  description: string;
  icon?: string;
  color?: string;
  span?: string;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ 
  title, 
  description, 
  icon,
  color = 'from-blue-500 to-cyan-500',
  span = 'md:col-span-1'
}) => {
  return (
    <BentoCard 
      className={`${span} bg-gradient-to-br ${color}`}
    >
      <div className="flex flex-col h-full justify-between text-white">
        {icon && (
          <div className="mb-3">
            <span className="text-3xl">{icon}</span>
          </div>
        )}
        <div>
          <h3 className="text-xl font-bold mb-2">{title}</h3>
          <p className="text-sm text-white/80">{description}</p>
        </div>
      </div>
    </BentoCard>
  );
};

interface InfoCardProps {
  title: string;
  subtitle?: string;
  content?: string;
  gradient?: string;
  icon?: string;
  span?: string;
}

export const InfoCard: React.FC<InfoCardProps> = ({ 
  title, 
  subtitle, 
  content,
  gradient = 'bg-gradient-to-br from-pink-100 to-orange-100 dark:from-pink-900/30 dark:to-orange-900/30',
  icon,
  span = 'md:col-span-1'
}) => {
  return (
    <BentoCard className={`${span} ${gradient}`}>
      <div className="flex flex-col h-full justify-between">
        {icon && (
          <div className="mb-3">
            <div className="w-8 h-8 rounded-lg bg-white/50 dark:bg-black/30 flex items-center justify-center">
              <span className="text-xl">{icon}</span>
            </div>
          </div>
        )}
        <div>
          <h3 className="text-lg font-bold mb-1 text-gray-900 dark:text-white">
            {title}
          </h3>
          {subtitle && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              {subtitle}
            </p>
          )}
          {content && (
            <p className="text-xs text-gray-700 dark:text-gray-300">
              {content}
            </p>
          )}
        </div>
      </div>
    </BentoCard>
  );
};

interface QuickActionCardProps {
  title: string;
  action: string;
  icon?: string;
  gradient?: string;
}

export const QuickActionCard: React.FC<QuickActionCardProps> = ({ 
  title, 
  action,
  icon,
  gradient = 'bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700'
}) => {
  return (
    <BentoCard className={`md:col-span-1 ${gradient}`}>
      <div className="flex flex-col h-full justify-between items-start">
        <div className="flex-1">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
            {title}
          </h3>
        </div>
        <div className="w-full">
          <button className="w-full px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-xl text-sm font-medium hover:opacity-90 transition-opacity">
            {action}
          </button>
        </div>
      </div>
    </BentoCard>
  );
};

interface StatusCardProps {
  status: string;
  label: string;
  icon?: string;
  gradient?: string;
}

export const StatusCard: React.FC<StatusCardProps> = ({ 
  status, 
  label,
  icon,
  gradient = 'bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800'
}) => {
  return (
    <BentoCard className={`md:col-span-1 ${gradient}`}>
      <div className="flex flex-col items-center justify-center h-full text-center py-6">
        {icon && (
          <div className="mb-3">
            <div className="w-12 h-12 rounded-full bg-white/50 dark:bg-black/30 flex items-center justify-center">
              <span className="text-2xl">{icon}</span>
            </div>
          </div>
        )}
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{label}</p>
        <p className="text-sm font-medium text-gray-900 dark:text-white">{status}</p>
      </div>
    </BentoCard>
  );
};
