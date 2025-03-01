// src/components/ui/button.tsx
import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

const buttonVariants = cva(
  "inline-flex items-center justify-center text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary-400 disabled:opacity-50 disabled:pointer-events-none shadow-button",
  {
    variants: {
      variant: {
        default: "bg-primary-500 text-white hover:bg-primary-600 active:bg-primary-700",
        destructive: "bg-red-500 text-white hover:bg-red-600 active:bg-red-700",
        outline: "border border-gray-200 bg-white hover:bg-gray-50 active:bg-gray-100 text-gray-700 hover:border-primary-200",
        ghost: "bg-transparent shadow-none hover:bg-gray-100 active:bg-gray-200 text-gray-700",
        link: "text-primary-600 shadow-none underline-offset-4 hover:underline",
        secondary: "bg-secondary-500 text-white hover:bg-secondary-600 active:bg-secondary-700",
        tertiary: "bg-tertiary-500 text-white hover:bg-tertiary-600 active:bg-tertiary-700",
        success: "bg-emerald-500 text-white hover:bg-emerald-600 active:bg-emerald-700",
        glass: "bg-white/80 backdrop-blur-sm border border-white/40 text-gray-800 hover:bg-white/90",
      },
      size: {
        default: "h-10 py-2 px-5",
        sm: "h-8 px-3 text-xs",
        lg: "h-12 px-8 text-base",
        xl: "h-14 px-10 text-lg",
        icon: "h-10 w-10",
        "icon-sm": "h-8 w-8",
        "icon-md": "h-10 w-10",
        "icon-lg": "h-12 w-12",
      },
      rounded: {
        default: "rounded-xl",
        full: "rounded-full",
        md: "rounded-md",
        lg: "rounded-2xl",
      },
      hasAnimation: {
        true: "transform hover:scale-105 active:scale-95",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      rounded: "default",
      hasAnimation: false,
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, rounded, hasAnimation, isLoading, leftIcon, rightIcon, children, disabled, ...props }, ref) => {
    return (
      <button
        className={buttonVariants({ variant, size, rounded, hasAnimation, className })}
        ref={ref}
        disabled={isLoading || disabled}
        aria-disabled={isLoading || disabled}
        {...props}
      >
        {isLoading ? (
          <div className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {children}
          </div>
        ) : (
          <div className="flex items-center justify-center">
            {leftIcon && <span className="mr-2">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="ml-2">{rightIcon}</span>}
          </div>
        )}
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };