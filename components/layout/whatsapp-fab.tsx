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
      transition={{ delay: 1.2, type: "spring", stiffness: 180 }}
      whileHover={{ y: -4, rotate: 4 }}
      whileTap={{ scale: 0.92 }}
      className="fixed bottom-5 right-5 z-40 inline-flex h-14 w-14 items-center justify-center rounded-full bg-brand text-white shadow-scrim md:bottom-7 md:right-7 md:h-14 md:w-14"
    >
      <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-brand opacity-30" />
      <MessageCircle className="h-6 w-6 md:h-5 md:w-5" />
    </motion.a>
  );
}
