import React from 'react';
import LoadingSpinner from './LoadingSpinner';

const Button = ({
    children,
    onClick,
    type = 'button',
    variant = 'primary',
    isLoading = false,
    disabled = false,
    className = '',
    fullWidth = false,
    ...props
}) => {
    const baseClasses = "flex items-center justify-center gap-2 px-4 py-2 sm:px-6 py-2.5 sm:py-3.5 rounded-xl font-bold text-sm sm:text-base transition-all duration-200 shadow-md";
    const disabledClasses = "disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none hover:transform-none";
    const widthClass = fullWidth ? "w-full" : "";

    const variants = {
        primary: "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/20 hover:-translate-y-0.5",
        secondary: "bg-slate-100 hover:bg-slate-200 text-slate-800 shadow-slate-200 hover:-translate-y-0.5",
        danger: "bg-red-600 hover:bg-red-700 text-white shadow-red-600/20 hover:-translate-y-0.5",
        success: "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20 hover:-translate-y-0.5"
    };

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={isLoading || disabled}
            className={`${baseClasses} ${variants[variant]} ${disabledClasses} ${widthClass} ${className}`}
            {...props}
        >
            {isLoading && <LoadingSpinner size="sm" className="text-current opacity-80" />}
            {children}
        </button>
    );
};

export default Button;
