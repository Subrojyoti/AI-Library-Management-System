// frontend/src/components/ResponsiveContainer.jsx
import React from 'react';

/**
 * A responsive container component that maintains consistent width and padding
 * across different screen sizes and zoom levels.
 */
function ResponsiveContainer({ children, className = '' }) {
  return (
    <div className={`responsive-container w-full mx-auto px-4 sm:px-6 lg:px-8 ${className}`}>
      {children}
    </div>
  );
}

export default ResponsiveContainer;
