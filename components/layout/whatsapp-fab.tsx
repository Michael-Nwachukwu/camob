"use client";

import { motion } from "motion/react";
import { MessageCircle } from "lucide-react";
import { siteCopy } from "@/lib/data/camob";

export function WhatsappFab() {
  return (
    <motion.a
      href={siteCopy.whatsapp}
      target="_blank"
      rel="noreferrer"
      aria-label="Chat with us on WhatsApp"
      initial={{ opacity: 0, scale: 0.6, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay: 1.2, type: "spring", stiffness: 80, damping: 14 }}
      whileHover={{ y: -3, rotate: 2, transition: { type: "spring", stiffness: 60, damping: 12 } }}
      whileTap={{ scale: 0.96 }}
      className="fixed bottom-5 right-5 z-40 inline-flex h-11 w-11 items-center justify-center rounded-full bg-brand text-white shadow-scrim md:bottom-7 md:right-7 md:h-12 md:w-12"
    >
      <span className="absolute inset-0 -z-10 animate-[ping_1.5s_linear_infinite] rounded-full bg-brand opacity-30" />
      <MessageCircle className="h-6 w-6 md:h-5 md:w-5" />
    </motion.a>
  );
}
