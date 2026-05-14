// Centralized Framer Motion variants for ClinicalCore EHR.
// Only transform + opacity are animated — never layout properties.
// All exports pass through safeAnimate() at call site to respect prefers-reduced-motion.

export function safeAnimate(props) {
  if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
    return {}
  }
  return props
}

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.22, ease: 'easeOut' },
}

export const slideUp = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.22, ease: 'easeOut' },
}

export const slideRight = {
  initial: { opacity: 0, x: -8 },
  animate: { opacity: 1, x: 0 },
  transition: { duration: 0.22, ease: 'easeOut' },
}

export const scaleIn = {
  initial: { opacity: 0, scale: 0.96, y: -4 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit:    { opacity: 0, scale: 0.96, y: -4 },
  transition: { duration: 0.12, ease: 'easeOut' },
}

// Use as variants on parent motion element for stagger effect
export const staggerContainer = {
  initial: {},
  animate: { transition: { staggerChildren: 0.05 } },
}

// Use as variants on child motion elements (paired with staggerContainer)
export const listItem = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.2, ease: 'easeOut' } },
}
