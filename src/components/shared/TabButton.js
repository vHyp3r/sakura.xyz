import React from 'react';

export default function TabButton({ active, children, onClick }) {
  return (
    <button onClick={onClick} className={active ? 'tab active' : 'tab'}>
      {children}
    </button>
  );
}
