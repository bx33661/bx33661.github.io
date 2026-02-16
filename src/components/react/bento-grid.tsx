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
        'rounded-3xl p-6 backdrop-blur-md',
        'border border-white/20 dark:border-white/10',
        'shadow-md hover:shadow-2xl transition-all duration-300 ease-out',
        'hover:-translate-y-1',
        'group cursor-pointer',
        gradient || 'bg-white/40 dark:bg-black/20',
        'overflow-hidden relative',
        className
      )}
      whileHover={{ scale: 1.02 }}
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
          <h2 className="mb-2 text-2xl font-bold text-foreground">
            {name}
          </h2>
          <p className="mb-4 text-sm text-muted-foreground">
            {title}
          </p>
          <p className="text-sm leading-relaxed text-foreground/80">
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
  image?: string;
  span?: string;
}

export const InfoCard: React.FC<InfoCardProps> = ({
  title,
  subtitle,
  content,
  gradient = 'bg-gradient-to-br from-pink-100 to-orange-100 dark:from-pink-900/30 dark:to-orange-900/30',
  icon,
  image,
  span = 'md:col-span-1'
}) => {
  return (
    <BentoCard className={`${span} ${gradient}`}>
      <div className="flex flex-col h-full justify-between">
        {image ? (
          <div className="mb-3 w-full h-28 overflow-hidden rounded-xl bg-white/30 dark:bg-black/20">
            <img src={image} alt={title} className="w-full h-full object-cover" />
          </div>
        ) : icon ? (
          <div className="mb-3">
            <div className="w-10 h-10 rounded-xl bg-white/80 dark:bg-black/40 flex items-center justify-center shadow-sm backdrop-blur-sm group-hover:scale-110 transition-transform duration-300">
              <span className="text-2xl">{icon}</span>
            </div>
          </div>
        ) : null}
        <div>
          <h3 className="mb-1 text-lg font-bold text-foreground">
            {title}
          </h3>
          {subtitle && (
            <p className="mb-2 text-sm text-muted-foreground">
              {subtitle}
            </p>
          )}
          {content && (
            <p className="text-xs text-foreground/80">
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
  gradient = 'bg-gradient-to-br from-muted to-accent'
}) => {
  return (
    <BentoCard className={`md:col-span-1 ${gradient}`}>
      <div className="flex flex-col h-full justify-between items-start">
        <div className="flex-1">
          <h3 className="mb-2 text-sm font-medium text-muted-foreground">
            {title}
          </h3>
        </div>
        <div className="w-full">
          <button className="w-full rounded-xl bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90">
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
  gradient = 'bg-gradient-to-br from-muted to-accent'
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
        <p className="mb-1 text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium text-foreground">{status}</p>
      </div>
    </BentoCard>
  );
};
