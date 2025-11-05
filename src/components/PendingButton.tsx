'use client'

import { useTransition } from 'react'
import { Button, type ButtonProps } from '@/components/ui/button'

type PendingButtonProps = Omit<ButtonProps, 'onClick'> & {
  onAction?: () => Promise<void> | void
}

export default function PendingButton({ onAction, children, disabled, ...rest }: PendingButtonProps) {
  const [isPending, startTransition] = useTransition()

  const handleClick = () => {
    if (!onAction) return
    startTransition(() => {
      Promise.resolve(onAction())
    })
  }

  return (
    <Button
      {...rest}
      disabled={disabled || isPending}
      onClick={handleClick}
    >
      {isPending && (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/60 border-t-transparent" />
      )}
      <span>{isPending ? 'Processing…' : children}</span>
    </Button>
  )
}


