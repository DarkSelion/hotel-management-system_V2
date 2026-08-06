import { cn } from '../../lib/utils'

const variantMap: Record<string, string> = {
  default: 'bg-border/50 text-muted',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  danger: 'bg-danger/10 text-danger',
  info: 'bg-info/10 text-info',
  gold: 'bg-gold/20 text-gold-dark',
}

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: keyof typeof variantMap
  size?: 'sm' | 'md'
}

function Badge({ className, variant = 'default', size = 'md', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm',
        variantMap[variant],
        className,
      )}
      {...props}
    />
  )
}

export { Badge }
