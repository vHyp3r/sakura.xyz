import React from 'react';

export default function Card({ children, style = {}, className = 'form-card' }) {
  return (
    <div className={className} style={style}>
      {children}
    </div>
  );
}
