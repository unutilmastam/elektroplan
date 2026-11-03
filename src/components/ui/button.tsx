import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

/** shadcn/ui-style button with ELEKTROPLAN variants (DESIGN_SYSTEM §2). */
export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-[background,box-shadow,border-color,opacity,transform] duration-150 ease-out outline-none focus-visible:ring-2 focus-visible:ring-primary-hi/70 disabled:cursor-not-allowed disabled:opacity-80 active:scale-[0.98] disabled:active:scale-100 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-white glow-primary hover:bg-primary-hi',
        secondary:
          'bg-panel-solid/90 text-text border border-white/12 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] hover:border-white/25 hover:bg-[#16223a]',
        danger: 'bg-danger/12 text-[#ff6b6b] border border-danger/45 hover:bg-danger/20',
        success: 'bg-success/15 text-[#e9fbe9] border border-success/45 hover:bg-success/22',
        gold: 'bg-pro-gold text-[#1a1404] font-semibold hover:brightness-105',
        ghost: 'text-text-muted hover:text-text hover:bg-white/5',
      },
      size: {
        sm: 'h-9 px-3 text-sm rounded-[10px]',
        md: 'h-11 px-4 text-[15px] rounded-[10px]',
        lg: 'h-[52px] px-5 text-base rounded-[10px]',
        icon: 'h-11 w-11 rounded-[10px]',
      },
    },
    defaultVariants: { variant: 'secondary', size: 'md' },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant, size, asChild = false, type, ...props },
  ref,
) {
  const Comp = asChild ? Slot : 'button';
  return (
    <Comp
      ref={ref}
      type={asChild ? undefined : (type ?? 'button')}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
});
