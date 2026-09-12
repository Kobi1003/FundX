import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.02,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 15, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.35,
      ease: [0.22, 1, 0.36, 1],
    },
  },
}

export function BentoGrid({ className, children }) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={cn('grid auto-rows-min grid-cols-1 gap-4 md:grid-cols-6 xl:grid-cols-12', className)}
    >
      {children}
    </motion.div>
  )
}

export function BentoItem({ className, children }) {
  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ y: -2, transition: { duration: 0.2, ease: 'easeOut' } }}
      className={cn('min-w-0', className)}
    >
      {children}
    </motion.div>
  )
}
