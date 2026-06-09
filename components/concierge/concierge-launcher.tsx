"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { MessageCircle, X } from "lucide-react";
import { ConciergePanel } from "@/components/concierge/concierge-panel";

// Replaces the original WhatsApp FAB. The WhatsApp escalation lives inside
// the concierge panel as a "Reach out on WhatsApp" button — single right-side
// entry-point instead of two.
export function ConciergeLauncher() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <motion.button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close concierge" : "Open concierge"}
        initial={{ opacity: 0, scale: 0.6, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ delay: 1.2, type: "spring", stiffness: 180 }}
        whileHover={{ y: -4, rotate: 4 }}
        whileTap={{ scale: 0.92 }}
        className="fixed bottom-5 right-5 z-40 inline-flex h-14 w-14 items-center justify-center rounded-full bg-brand text-white shadow-scrim md:bottom-7 md:right-7"
      >
        {!open ? (
          <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-brand opacity-30" />
        ) : null}
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </motion.button>

      <AnimatePresence>{open ? <ConciergePanel onClose={() => setOpen(false)} /> : null}</AnimatePresence>
    </>
  );
}
