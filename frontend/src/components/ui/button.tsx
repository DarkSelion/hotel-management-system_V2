import { forwardRef } from 'react'
import type { ButtonHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'gold' | 'ghost' | 'outline' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  square?: boolean
}
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'md', square, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:pointer-events-none disabled:opacity-50',
          {
            'default': 'bg-border/50 text-foreground hover:bg-border',
            'primary': 'bg-primary text-white hover:bg-primary-light',
            'gold': 'bg-gold text-white hover:bg-gold-light',
            'ghost': 'text-muted hover:bg-border/50',
            'outline': 'border border-border bg-transparent text-foreground hover:bg-bg',
            'danger': 'bg-danger text-white hover:bg-danger/90',
          }[variant],
          square ? 'size-8 px-0' : {
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

