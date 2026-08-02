import { forwardRef } from 'react'
import type { ButtonHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'gold' | 'ghost' | 'outline' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  square?: boolean
}
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'md', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:pointer-events-none disabled:opacity-50',
          {
            'default': 'bg-gray-100 text-gray-700 hover:bg-gray-200',
            'primary': 'bg-primary text-white hover:bg-primary-light',
            'gold': 'bg-gold text-white hover:bg-gold-light',
            'ghost': 'text-gray-600 hover:bg-gray-100',
            'outline': 'border border-border bg-transparent text-gray-700 hover:bg-gray-50',
            'danger': 'bg-danger text-white hover:bg-red-600',
          }[variant],
          {
            sm: 'h-8 px-3 text-xs',
            md: 'h-10 px-4 text-sm',
            lg: 'h-12 px-6 text-base',
          }[size],
          className,
        )}
        {...props}
      />
    )
  },
)

Button.displayName = 'Button'

