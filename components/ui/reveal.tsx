"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";

export function Reveal({
  children,
  delay = 0,
  y = 18,
  className
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function TiltHover({
  children,
  rotate = 1.5,
  className
}: {
  children: ReactNode;
  rotate?: number;
  className?: string;
}) {
  return (
    <motion.div
      whileHover={{ y: -4, rotate, transition: { type: "spring", stiffness: 220 } }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
