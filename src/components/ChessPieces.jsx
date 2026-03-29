import React from 'react';

// Wikipedia Chess Piece Set (Standard 45x45 paths)
export const ChessPieceSVG = ({ piece, size = 45, svgStyle }) => {
  const isWhite = piece === piece.toUpperCase();
  const type = piece.toLowerCase();

  const svgs = {
    p: (
      <svg viewBox="0 0 45 45" width={size} height={size} style={svgStyle}>
        <path
          d="M22.5 9c-2.21 0-4 1.79-4 4 0 .89.29 1.71.78 2.38C17.33 16.5 16 18.59 16 21c0 2.03.94 3.84 2.41 5.03-3 1.06-7.41 5.55-7.41 13.47h23c0-7.92-4.41-12.41-7.41-13.47 1.47-1.19 2.41-3 2.41-5.03 0-2.41-1.33-4.5-3.28-5.62.49-.67.78-1.49.78-2.38 0-2.21-1.79-4-4-4z"
          fill={isWhite ? "#fff" : "#000"}
          stroke={isWhite ? "#000" : "#fff"}
          strokeWidth="1.5"
        />
      </svg>
    ),
    n: (
      <svg viewBox="0 0 45 45" width={size} height={size} style={svgStyle}>
        <g
          fill={isWhite ? "#fff" : "#000"}
          stroke={isWhite ? "#000" : "#fff"}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M22 10c10.5 1 16.5 8 16 29H15c0-9 10-6.5 8-21" />
          <path d="M24 18c.38 2.43-7 1.5-12 5.5-5 4-4 12-4 15.5" />
          <path d="M9 26c8.5-1.5 21 0 21 0" fill="none" />
          <path d="M15 15.5 A 0.5 0.5 0 1 1 14 15.5 A 0.5 0.5 0 1 1 15 15.5" fill={isWhite ? "#000" : "#fff"} stroke="none" />
        </g>
      </svg>
    ),
    b: (
      <svg viewBox="0 0 45 45" width={size} height={size} style={svgStyle}>
        <g
          fill={isWhite ? "#fff" : "#000"}
          stroke={isWhite ? "#000" : "#fff"}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M9 36c3.39-.97 10.11.43 13.5-2 3.39 2.43 10.11 1.03 13.5 2 0 0 0 5-22.5 5-22.5 0-22.5-5-22.5-5z" />
          <path d="M15 32c2.5 2.5 12.5 2.5 15 0 .5-1.5 0-2 0-2 0-2.5-2.5-4-2.5-4 5.5-1.5 6-11.5-5-15.5-11 4-10.5 14-5 15.5 0 0-2.5 1.5-2.5 4 0 0-.5.5 0 2z" />
          <path d="M25 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 1 1 5 0z" />
        </g>
      </svg>
    ),
    r: (
      <svg viewBox="0 0 45 45" width={size} height={size} style={svgStyle}>
        <g
          fill={isWhite ? "#fff" : "#000"}
          stroke={isWhite ? "#000" : "#fff"}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M9 39h27v-3H9v3zM12 36v-4h21v4H12zM11 14V9h4v2h5V9h5v2h5V9h4v5" />
          <path d="M34 14l-3 3H14l-3-3" />
          <path d="M31 17v12.5H14V17" />
          <path d="M31 29.5l1.5 2.5h-20l1.5-2.5" />
          <path d="M11 14h23" fill="none" stroke={isWhite ? "#000" : "#fff"} strokeLinejoin="miter" />
        </g>
      </svg>
    ),
    q: (
      <svg viewBox="0 0 45 45" width={size} height={size} style={svgStyle}>
        <g
          fill={isWhite ? "#fff" : "#000"}
          stroke={isWhite ? "#000" : "#fff"}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M8 12a2 2 0 1 1-4 0 2 2 0 1 1 4 0zM24.5 7.5a2 2 0 1 1-4 0 2 2 0 1 1 4 0zM41 12a2 2 0 1 1-4 0 2 2 0 1 1 4 0zM11 20a2 2 0 1 1-4 0 2 2 0 1 1 4 0zM38 20a2 2 0 1 1-4 0 2 2 0 1 1 4 0z" />
          <path d="M9 26c8.5-1.5 21-1.5 27 0l2-12-7 11V11l-5.5 13.5-3-15-3 15-5.5-13.5V25l-7-11 2 12z" />
          <path d="M9 26c0 2 1.5 2 2.5 4 2.5 4 4.5 6 11 6s8.5-2 11-6c1-2 2.5-2 2.5-4 0-5.5-1.5-11-1.5-11l-3 12H13l-3-12s-1.5 5.5-1.5 11z" />
          <path d="M11.5 30c3.5-1 18.5-1 22 0M12 33.5c6-1 15-1 21 0" fill="none" />
        </g>
      </svg>
    ),
    k: (
      <svg viewBox="0 0 45 45" width={size} height={size} style={svgStyle}>
        <g
          fill={isWhite ? "#fff" : "#000"}
          stroke={isWhite ? "#000" : "#fff"}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M22.5 11.63V6M20 8h5" stroke={isWhite ? "#000" : "#fff"} strokeLinejoin="miter" />
          <path d="M22.5 25s4.5-7.5 4.5-11.25a4.5 4.5 0 1 0-9 0c0 3.75 4.5 11.25 4.5 11.25z" />
          <path d="M11.5 37c5.5 3.5 15.5 3.5 21 0v-7s9-4.5 6-10.5c-4-1-1-4-1-4s-3 3-4 6c-3-1.5-6-2-11-2s-8 .5-11 2c-1-3-4-6-4-6s3 3 1 4c-3 6 6 10.5 6 10.5v7z" />
          <path d="M11.5 30c5.5-3 15.5-3 21 0m-21 3.5c5.5-3 15.5-3 21 0m-21 3.5c5.5-3 15.5-3 21 0" fill="none" />
        </g>
      </svg>
    )
  };

  return svgs[type] || null;
};

export default React.memo(ChessPieceSVG);
