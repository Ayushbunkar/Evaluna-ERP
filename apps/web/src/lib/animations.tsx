"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ReactNode } from "react";

// ── Core animation variants ────────────────────────────────────────────────
export const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.35, ease: "easeOut" } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

export const slideUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
  exit: { opacity: 0, y: -12, transition: { duration: 0.2 } },
};

export const slideDown = {
  hidden: { opacity: 0, y: -16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
};

export const slideLeft = {
  hidden: { opacity: 0, x: 24 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } },
};

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.18 } },
};

export const stagger = {
  visible: { transition: { staggerChildren: 0.07 } },
};

export const staggerSlow = {
  visible: { transition: { staggerChildren: 0.12 } },
};

// ── Reusable wrapper components ───────────────────────────────────────────

/** Fade-in wrapper with optional delay */
export function FadeIn({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeIn}
      transition={{ delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/** Slide-up wrapper with optional delay */
export function SlideUp({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={slideUp}
      transition={{ delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/** Staggered children container */
export function StaggerList({
  children,
  className = "",
  slow = false,
}: {
  children: ReactNode;
  className?: string;
  slow?: boolean;
}) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={slow ? staggerSlow : stagger}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/** Individual stagger item – wrap each child of StaggerList with this */
export function StaggerItem({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div variants={slideUp} className={className}>
      {children}
    </motion.div>
  );
}

/** Page-level entrance animation */
export function PageTransition({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/** Animated card hover effect */
export function AnimatedCard({
  children,
  className = "",
  onClick,
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.015, y: -2 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className={className}
      onClick={onClick}
    >
      {children}
    </motion.div>
  );
}

/** Animated button press */
export function AnimatedButton({
  children,
  className = "",
  onClick,
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      className={className}
      onClick={onClick}
    >
      {children}
    </motion.button>
  );
}

/** Animated number counter  */
export function AnimatedNumber({
  value,
  className = "",
}: {
  value: number;
  className?: string;
}) {
  return (
    <motion.span
      key={value}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={className}
    >
      {value}
    </motion.span>
  );
}

/** AnimatePresence wrapper export for convenience */
export { motion, AnimatePresence };
