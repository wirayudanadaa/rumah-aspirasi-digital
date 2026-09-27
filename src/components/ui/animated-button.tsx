'use client';

import React from 'react';
import Link from 'next/link';

interface AnimatedButtonProps {
  href?: string;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
  className?: string;
  onClick?: () => void;
}

export const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  href,
  children,
  variant = 'secondary',
  className = '',
  onClick,
}) => {
  const content = (
    <>
      <svg xmlns="http://www.w3.org/2000/svg" className="arr-2" viewBox="0 0 24 24">
        <path d="M16.1716 10.9999L10.8076 5.63589L12.2218 4.22168L20 11.9999L12.2218 19.778L10.8076 18.3638L16.1716 12.9999H4V10.9999H16.1716Z" />
      </svg>
      <span className="text">{children}</span>
      <span className="circle" />
      <svg xmlns="http://www.w3.org/2000/svg" className="arr-1" viewBox="0 0 24 24">
        <path d="M16.1716 10.9999L10.8076 5.63589L12.2218 4.22168L20 11.9999L12.2218 19.778L10.8076 18.3638L16.1716 12.9999H4V10.9999H16.1716Z" />
      </svg>
    </>
  );

  const combinedClass = `animated-button ${variant} ${className}`.trim();

  if (href?.startsWith('#')) {
    return (
      <a href={href} className={combinedClass} onClick={onClick}>
        {content}
      </a>
    );
  }

  if (href) {
    return (
      <Link href={href} className={combinedClass} onClick={onClick}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" className={combinedClass} onClick={onClick}>
      {content}
    </button>
  );
};

export default AnimatedButton;
