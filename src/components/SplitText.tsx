import React, { useEffect, useRef } from 'react';
import * as Anime from 'animejs';

interface SplitTextProps {
  text: string;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'span';
  className?: string;
  staggerDelay?: number;
  triggerOnScroll?: boolean;
}

export const SplitText: React.FC<SplitTextProps> = ({
  text,
  as: Component = 'h2',
  className = '',
  staggerDelay = 50,
  triggerOnScroll = true,
}) => {
  const containerRef = useRef<HTMLElement>(null);
  const hasAnimatedRef = useRef(false);

  useEffect(() => {
    if (!triggerOnScroll) {
      animateOnMount();
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimatedRef.current) {
            hasAnimatedRef.current = true;
            animateOnMount();
          }
        });
      },
      { threshold: 0.5 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [triggerOnScroll]);

  const animateOnMount = () => {
    const chars = containerRef.current?.querySelectorAll('[data-char]');
    if (!chars) return;

    // Set initial state
    Anime.set(chars, {
      opacity: 0,
      transform: 'translateY(24px)',
      clipPath: 'polygon(0 100%, 100% 100%, 100% 100%, 0 100%)',
    });

    // Animate in
    Anime.animate(chars, {
      opacity: 1,
      transform: 'translateY(0px)',
      clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)',
      duration: 800,
      delay: Anime.stagger(staggerDelay),
      easing: 'easeOutCubic',
    });
  };

  const chars = text.split('').map((char, idx) => (
    <span
      key={idx}
      data-char
      style={{
        display: 'inline-block',
        willChange: 'transform, opacity',
      }}
    >
      {char === ' ' ? '\u00A0' : char}
    </span>
  ));

  const props = {
    ref: containerRef,
    className: `split-text ${className}`,
    style: {
      display: 'block',
      lineHeight: 1.1,
      letterSpacing: '-0.04em',
    },
  };

  return React.createElement(Component, props, chars);
};

export default SplitText;
