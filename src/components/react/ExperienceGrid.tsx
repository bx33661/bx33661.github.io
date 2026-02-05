import React from 'react';
import { Card3D } from './card-3d';
import { BentoGrid } from './bento-grid';
import { cn } from '@/lib/utils';
import { Briefcase, GraduationCap, Calendar, MapPin, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';

export interface ExperienceItem {
    id: string | number;
    title: string;
    subtitle: string;
    description: string;
    date: string;
    location?: string;
    type: 'education' | 'experience' | 'project';
    tags?: string[];
    link?: string;
    span?: string; // e.g., "md:col-span-2"
    gradient?: string; // Custom gradient background
    icon?: React.ReactNode;
}

interface ExperienceGridProps {
    items: ExperienceItem[];
    className?: string;
}

const getIcon = (type: string) => {
    switch (type) {
        case 'education':
            return <GraduationCap className="size-6 text-white" />;
        case 'experience':
            return <Briefcase className="size-6 text-white" />;
        case 'project':
            return <div className="size-6 text-xl">🚀</div>;
        default:
            return <Briefcase className="size-6 text-white" />;
    }
};

const getDefaultGradient = (type: string) => {
    switch (type) {
        case 'education':
            return "from-emerald-500/20 to-teal-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30";
        case 'experience':
            return "from-blue-500/20 to-indigo-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30";
        case 'project':
            return "from-orange-500/20 to-amber-500/20 text-orange-600 dark:text-orange-400 border-orange-500/30";
        default:
            return "from-gray-500/20 to-slate-500/20 border-gray-500/30";
    }
};

const ExperienceCard: React.FC<{ item: ExperienceItem; index: number }> = ({ item, index }) => {
    const isEducation = item.type === 'education';

    return (
        <div className={cn("h-full", item.span || "md:col-span-1")}>
            <Card3D
                className="h-full w-full"
                intensity={10}
                enableGlow={true}
                glowColor={item.type === 'education' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(59, 130, 246, 0.4)'}
            >
                <div className={cn(
                    "relative h-full w-full overflow-hidden rounded-3xl border backdrop-blur-md p-6 flex flex-col justify-between transition-all duration-300 group hover:shadow-xl",
                    "bg-gradient-to-br bg-card/40 dark:bg-card/30",
                    item.gradient || getDefaultGradient(item.type)
                )}>
                    {/* Decorative Elements */}
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500">
                        {item.icon || getIcon(item.type)}
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <div className={cn(
                                "p-3 rounded-xl backdrop-blur-sm shadow-inner flex items-center justify-center",
                                isEducation ? "bg-emerald-500/10 text-emerald-500" : "bg-blue-500/10 text-blue-500"
                            )}>
                                {item.icon || getIcon(item.type)}
                            </div>

                            <div className="flex items-center gap-2 text-xs font-medium px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/5">
                                <Calendar className="size-3" />
                                {item.date}
                            </div>
                        </div>

                        <h3 className="text-xl md:text-2xl font-bold mb-1 text-foreground group-hover:text-primary transition-colors">
                            {item.title}
                        </h3>
                        <div className="text-sm font-semibold opacity-80 mb-4 flex items-center gap-2">
                            {item.subtitle}
                            {item.location && (
                                <>
                                    <span className="w-1 h-1 rounded-full bg-current opacity-50" />
                                    <span className="flex items-center gap-1 font-normal opacity-70">
                                        <MapPin className="size-3" /> {item.location}
                                    </span>
                                </>
                            )}
                        </div>

                        <p className="text-sm leading-relaxed opacity-90 mb-6 font-medium">
                            {item.description}
                        </p>
                    </div>

                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/10">
                        <div className="flex flex-wrap gap-2">
                            {item.tags?.map(tag => (
                                <span key={tag} className="text-[10px] px-2 py-1 rounded-md bg-white/5 border border-white/10 font-medium">
                                    {tag}
                                </span>
                            ))}
                        </div>

                        {item.link && (
                            <a href={item.link} target="_blank" rel="noreferrer" className="p-2 rounded-full hover:bg-white/10 transition-colors">
                                <ExternalLink className="size-4" />
                            </a>
                        )}
                    </div>
                </div>
            </Card3D>
        </div>
    );
};

export const ExperienceGrid: React.FC<ExperienceGridProps> = ({ items, className }) => {
    return (
        <BentoGrid className={cn("auto-rows-[minmax(280px,auto)]", className)}>
            {items.map((item, index) => (
                <motion.div
                    key={item.id}
                    className={cn("contents", item.span)}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                >
                    <ExperienceCard item={item} index={index} />
                </motion.div>
            ))}
        </BentoGrid>
    );
};
