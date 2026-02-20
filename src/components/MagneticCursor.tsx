import React, { useEffect, useRef, useState } from 'react';
import * as Anime from 'animejs';

interface MousePos {
  x: number;
  y: number;
}

export const MagneticCursor: React.FC = () => {
  const cursorRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const mousePos = useRef<MousePos>({ x: 0, y: 0 });
  const targetPos = useRef<MousePos>({ x: 0, y: 0 });
  const [isOverMagnetic, setIsOverMagnetic] = useState(false);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const cursor = cursorRef.current;
    const dot = dotRef.current;
    if (!cursor || !dot) return;

    // Smooth cursor following with RAF
    const updateCursor = () => {
      const dx = targetPos.current.x - mousePos.current.x;
      const dy = targetPos.current.y - mousePos.current.y;
      
      mousePos.current.x += dx * 0.15;
      mousePos.current.y += dy * 0.15;

      cursor.style.transform = `translate3d(${mousePos.current.x - 8}px, ${mousePos.current.y - 8}px, 0)`;
      dot.style.transform = `translate3d(${targetPos.current.x - 3}px, ${targetPos.current.y - 3}px, 0)`;

      animationRef.current = requestAnimationFrame(updateCursor);
    };

    animationRef.current = requestAnimationFrame(updateCursor);

    const handleMouseMove = (e: MouseEvent) => {
      targetPos.current = { x: e.clientX, y: e.clientY };

      // Check if over magnetic element
      const magneticElement = (e.target as HTMLElement).closest('[data-magnetic]');
      const wasOverMagnetic = isOverMagnetic;
      
      if (magneticElement) {
        if (!wasOverMagnetic) {
          setIsOverMagnetic(true);
          // Animate cursor expansion
          Anime.animate(cursor, {
            width: 40,
            height: 40,
            opacity: 0.6,
            duration: 300,
            easing: 'easeOutCubic',
          });
        }

        // Make element tether to cursor
        const rect = magneticElement.getBoundingClientRect();
        const elementCenterX = rect.left + rect.width / 2;
        const elementCenterY = rect.top + rect.height / 2;
        
        const distance = Math.sqrt(
          (e.clientX - elementCenterX) ** 2 + (e.clientY - elementCenterY) ** 2
        );
        
        if (distance < 100) {
          const force = 1 - distance / 100;
          const moveX = (e.clientX - elementCenterX) * force * 0.15;
          const moveY = (e.clientY - elementCenterY) * force * 0.15;

          Anime.animate(magneticElement, {
            translateX: moveX,
            translateY: moveY,
            duration: 300,
            easing: 'easeOutCubic',
          });
        }
      } else if (wasOverMagnetic) {
        setIsOverMagnetic(false);
        Anime.animate(cursor, {
          width: 16,
          height: 16,
          opacity: 0.3,
          duration: 300,
          easing: 'easeOutCubic',
        });
      }
    };

    const handleMouseLeave = () => {
      if (isOverMagnetic && cursorRef.current) {
        setIsOverMagnetic(false);
        Anime.animate(cursorRef.current, {
          width: 16,
          height: 16,
          opacity: 0.3,
          duration: 300,
          easing: 'easeOutCubic',
        });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isOverMagnetic]);

  return (
    <>
      {/* Outer ring cursor */}
      <div
        ref={cursorRef}
        style={{
          position: 'fixed',
          width: 16,
          height: 16,
          border: '1px solid rgba(255, 255, 255, 0.5)',
          borderRadius: '50%',
          pointerEvents: 'none',
          zIndex: 9999,
          opacity: 0.3,
          willChange: 'transform, width, height',
          transition: 'opacity 0.3s ease-out',
          mixBlendMode: 'screen',
        }}
      />
      {/* Inner dot */}
      <div
        ref={dotRef}
        style={{
          position: 'fixed',
          width: 6,
          height: 6,
          background: 'rgba(255, 255, 255, 0.8)',
          borderRadius: '50%',
          pointerEvents: 'none',
          zIndex: 9999,
          willChange: 'transform',
          mixBlendMode: 'screen',
        }}
      />
    </>
  );
};

export default MagneticCursor;
