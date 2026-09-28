"use client";
import React from 'react';
import styled, { keyframes } from 'styled-components';

const spin = keyframes`
  0% { transform: translate(-50%, -50%) rotateX(45deg) rotateZ(0deg); opacity: 0; }
  20% { opacity: 1; }
  80% { opacity: 1; }
  100% { transform: translate(-50%, -50%) rotateX(45deg) rotateZ(360deg); opacity: 0; }
`;

export const CrystalLoader = ({ className, size = 60 }: { className?: string, size?: number }) => {
  return (
    <StyledWrapper className={className} $size={size}>
      <div className="container">
        <div className="loader">
          <div className="crystal" />
          <div className="crystal" />
          <div className="crystal" />
          <div className="crystal" />
          <div className="crystal" />
          <div className="crystal" />
        </div>
      </div>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div<{ $size: number }>`
  display: inline-flex;
  color: inherit;
  
  .container {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
  }

  .loader {
    position: relative;
    width: ${props => props.$size}px;
    height: ${props => props.$size}px;
    perspective: ${props => props.$size * 13.33}px;
  }

  .crystal {
    position: absolute;
    top: 50%;
    left: 50%;
    width: ${props => props.$size * 0.5}px;
    height: ${props => props.$size * 0.5}px;
    opacity: 0;
    transform-origin: bottom center;
    transform: translate(-50%, -50%) rotateX(45deg) rotateZ(0deg);
    border: 1px solid currentColor;
    box-shadow: 0 0 ${props => props.$size * 0.16}px currentColor, inset 0 0 ${props => props.$size * 0.16}px currentColor;
    animation: ${spin} 3s infinite linear;
    background: currentColor;
    opacity: 0.1;
    border-radius: ${props => Math.max(2, props.$size * 0.06)}px;
  }

  .crystal:nth-child(1) { animation-delay: 0s; }
  .crystal:nth-child(2) { animation-delay: 0.5s; }
  .crystal:nth-child(3) { animation-delay: 1.0s; }
  .crystal:nth-child(4) { animation-delay: 1.5s; }
  .crystal:nth-child(5) { animation-delay: 2.0s; }
  .crystal:nth-child(6) { animation-delay: 2.5s; }
`;
