import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { cn } from '@/lib/utils';
// import { Icon } from '@iconify/react'; // Removed unused import
import { Briefcase, GraduationCap, Calendar, MapPin } from 'lucide-react';

export interface TimelineItem {
    id: string | number;
    title: string;
    subtitle: string;
    description: string;
    date: string;
    location?: string;
    type: 'education' | 'experience' | 'project' | 'achievement';
    icon?: React.ReactNode;
    tags?: string[];
}

interface TimelineProps {
    items: TimelineItem[];
    className?: string;
}

const TimelineCard: React.FC<{ item: TimelineItem; index: number }> = ({ item, index }) => {
    const isEven = index % 2 === 0;

    return (
        <motion.div
            initial={{ opacity: 0, y: 50, x: isEven ? -50 : 50 }}
            whileInView={{ opacity: 1, y: 0, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className={cn(
                "relative flex items-center justify-between md:justify-normal w-full mb-8",
                isEven ? "md:flex-row-reverse" : "md:flex-row"
            )}
        >
            {/* Empty half for desktop layout */}
            <div className="hidden md:block w-5/12" />

            {/* Center Line Dot */}
            <div className="absolute left-0 md:left-1/2 -translate-x-1/2 flex items-center justify-center w-8 h-8 rounded-full bg-background border-2 border-primary z-10 shadow-lg shadow-primary/20">
                {item.type === 'education' && <GraduationCap className="w-4 h-4 text-primary" />}
                {item.type === 'experience' && <Briefcase className="w-4 h-4 text-primary" />}
                {!['education', 'experience'].includes(item.type) && <div className="w-2 h-2 rounded-full bg-primary" />}
            </div>

            {/* Content Card */}
            <div className={cn(
                "w-[calc(100%-2.5rem)] md:w-5/12 ml-10 md:ml-0 p-6 rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm hover:bg-card hover:border-primary/50 transition-all duration-300 shadow-sm hover:shadow-md",
                "group relative overflow-hidden"
            )}>
                {/* Glow effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div className="relative z-10">
                    <div className="flex flex-wrap items-center gap-2 mb-2 text-xs text-muted-foreground font-medium">
                        <span className="flex items-center gap-1 bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                            <Calendar className="w-3 h-3" />
                            {item.date}
                        </span>
                        {item.location && (
                            <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {item.location}
                            </span>
                        )}
                    </div>

                    <h3 className="text-lg font-bold text-foreground mb-1 group-hover:text-primary transition-colors">
                        {item.title}
                    </h3>
                    <div className="text-sm font-semibold text-muted-foreground mb-3">
                        {item.subtitle}
                    </div>

                    <p className="text-sm text-muted-foreground/80 leading-relaxed mb-4">
                        {item.description}
                    </p>

                    {item.tags && item.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                            {item.tags.map(tag => (
                                <span key={tag} className="px-2 py-0.5 text-[10px] rounded-full bg-secondary text-secondary-foreground border border-border/50">
                                    {tag}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

export const Timeline: React.FC<TimelineProps> = ({ items, className }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start end", "end start"]
    });

    const height = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

    return (
        <div ref={containerRef} className={cn("relative w-full py-10", className)}>
            {/* Center Vertical Line */}
            <div className="absolute left-[15px] md:left-1/2 top-0 bottom-0 w-0.5 bg-border/30 -translate-x-1/2 h-full rounded-full">
                <motion.div
                    style={{ height }}
                    className="absolute top-0 left-0 w-full bg-gradient-to-b from-primary/80 via-primary to-primary/20 rounded-full"
                />
            </div>

            <div className="flex flex-col gap-0">
                {items.map((item, index) => (
                    <TimelineCard key={item.id} item={item} index={index} />
                ))}
            </div>
        </div>
    );
};
