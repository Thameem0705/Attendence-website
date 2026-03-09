import React from 'react';
import { Loader2 } from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';

export function cn(...inputs) {
    return twMerge(clsx(inputs));
}

const Button = React.forwardRef(
    (
        {
            children,
            onClick,
            type = 'button',
            variant = 'primary',
            size = 'md',
            isLoading = false,
            disabled = false,
            className = '',
            fullWidth = false,
            ...props
        },
        ref
    ) => {
        const variants = {
            primary: "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/20",
            secondary: "bg-slate-100 hover:bg-slate-200 text-slate-800 shadow-slate-200",
            danger: "bg-red-600 hover:bg-red-700 text-white shadow-red-600/20",
            success: "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20"
        };

        const sizes = {
            sm: 'h-8 px-3 text-xs',
            md: 'h-10 px-4 py-2',
            lg: 'h-12 px-6 text-lg',
            icon: 'h-10 w-10',
        };

        return (
            <motion.button
                ref={ref}
                type={type}
                onClick={onClick}
                disabled={disabled || isLoading}
                whileTap={{ scale: disabled || isLoading ? 1 : 0.96 }}
                className={cn(
                    // Base styles
                    'inline-flex items-center justify-center rounded-xl font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:pointer-events-none disabled:opacity-50 relative overflow-hidden',
                    // Variants
                    variants[variant],
                    // Sizes
                    sizes[size],
                    // Full width
                    fullWidth && 'w-full',
                    className
                )}
                {...props}
            >
                {/* Ink ripple effect pseudo-element could go here if needed, but framer motion handles the tap scale nicely */}
                {isLoading && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                <span className="relative z-10 flex items-center gap-2">{children}</span>
            </motion.button>
        );
    }
);

Button.displayName = 'Button';

export default Button;
