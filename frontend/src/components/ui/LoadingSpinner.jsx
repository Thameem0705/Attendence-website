import React from 'react';

const LoadingSpinner = ({ size = 'md', className = '' }) => {
    const sizeClasses = {
        sm: 'w-4 h-4 border-2',
        md: 'w-6 h-6 border-2',
        lg: 'w-8 h-8 border-3',
        xl: 'w-12 h-12 border-4'
    };

    return (
        <div
            className={`rounded-full border-current border-t-transparent animate-spin ${sizeClasses[size]} ${className}`}
        ></div>
    );
};

export default LoadingSpinner;
