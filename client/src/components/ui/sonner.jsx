import { useTheme } from 'next-themes'
import { Toaster as Sonner } from 'sonner'

/**
 * App-wide toast surface. Mounted once inside `.admin-app`. Reads the
 * admin theme so toasts match light/dark, and pulls colors from the
 * design tokens via inline CSS variables.
 */
function Toaster(props) {
  const { theme = 'system' } = useTheme()

  return (
    <Sonner
      theme={theme}
      className="toaster group"
      position="bottom-right"
      toastOptions={{
        classNames: {
          toast:
            'group toast group-[.toaster]:bg-card group-[.toaster]:text-card-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg group-[.toaster]:rounded-lg',
          description: 'group-[.toast]:text-muted-foreground',
          actionButton:
            'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground',
          cancelButton:
            'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground',
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
export { toast } from 'sonner'
