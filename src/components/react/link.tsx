import { cn } from '@/lib/utils';
import React from 'react';

interface Props {
  href: string;
  external?: boolean;
  className?: string;
  underline?: boolean;
  [key: string]: any;
}

const Link: React.FC<Props> = ({ href, external, className, underline, children, ...rest }) => {
  return (
    <a
      href={href}
      target={external ? '_blank' : '_self'}
      className={cn(
        'inline-block transition-colors duration-300 ease-in-out',
        underline &&
          'underline decoration-muted-foreground underline-offset-[3px] hover:decoration-foreground',
        className
      )}
      {...rest}
    >
      {children}
    </a>
  );
};

export default Link;