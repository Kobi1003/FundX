import { Button as ShadButton } from '@/components/ui/button'

const variantMap = {
  primary: 'default',
  secondary: 'secondary',
  outline: 'outline',
  danger: 'destructive',
  ghost: 'ghost',
}

export default function Button({ variant = 'primary', className = '', ...props }) {
  return <ShadButton variant={variantMap[variant] || variant} className={className} {...props} />
}
