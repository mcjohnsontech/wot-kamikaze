import React, { useEffect, useRef } from 'react';
import * as Anime from 'animejs';
import { Box } from '@mantine/core';

interface StackingSectionProps {
  children: React.ReactNode;
  index: number;
  totalSections: number;
  className?: string;
  bg?: string;
}

export const StackingSection: React.FC<StackingSectionProps> = ({
  children,
  index,
  totalSections,
  className = '',
  bg = 'white',
}) => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const hasAnimatedRef = useRef(false);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimatedRef.current) {
            hasAnimatedRef.current = true;

            // Stagger effect: slide up from bottom
            Anime.set(section, {
              opacity: 0,
              transform: 'translate3d(0, 100px, 0)',
            });

            Anime.animate(section, {
              opacity: 1,
              transform: 'translate3d(0, 0px, 0)',
              duration: 1000,
              delay: 100 * index,
              easing: 'easeOutCubic',
            });
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -100px 0px' }
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, [index]);

  // Create stacking effect with z-index and scale transforms
  const zIndex = totalSections - index;

  return (
    <Box
      ref={sectionRef}
      className={`stacking-section ${className}`}
      bg={bg}
      style={{
        position: 'relative',
        zIndex,
        willChange: 'transform, opacity',
        // Create subtle stacking visual on viewport
        transform: `translate3d(0, ${index * -8}px, 0)`,
      }}
    >
      {children}
    </Box>
  );
};

export default StackingSection;
