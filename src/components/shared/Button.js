import React from 'react';

export default function Button({ children, className = '', onClick, type = 'button', disabled = false, ...rest }) {
  return (
    <button type={type} className={className} onClick={onClick} disabled={disabled} {...rest}>
      {children}
    </button>
  );
}
