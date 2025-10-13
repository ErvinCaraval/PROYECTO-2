import React from 'react';
import { motion } from 'framer-motion'

export default function Question({ text, question, options, onSelect, selected, showResult = false, correctIndex = null }) {
  const title = typeof text === 'string' && text.length > 0 ? text : question;
  const getOptionClasses = (idx) => {
    if (showResult) {
      if (idx === correctIndex) return 'border-emerald-400/60 bg-emerald-500/10';
      if (selected === idx && idx !== correctIndex) return 'border-red-400/60 bg-red-500/10';
      return 'border-white/15 bg-white/5';
    }
    return selected === idx
      ? 'border-bb-primary bg-white/10'
      : 'border-white/20 bg-white/5 hover:bg-white/10';
  };
  return (
    <div className="space-y-3">
      <h2 className="text-lg md:text-xl font-bold leading-snug break-words">{title}</h2>
      <motion.div
        role="group"
        aria-label="Opciones de respuesta"
        className="grid grid-cols-1 sm:grid-cols-2 gap-2"
        initial="hidden" animate="show"
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.04 } } }}
      >
        {options.map((opt, idx) => (
          <motion.button
            key={idx}
            onClick={() => onSelect(idx)}
            disabled={selected !== null}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: selected === null ? 1.01 : 1 }}
            whileTap={{ scale: selected === null ? 0.99 : 1 }}
            transition={{ type: 'spring', stiffness: 160, damping: 14 }}
            className={`col-span-1 text-left w-full rounded-xl border px-4 py-3 text-sm md:text-base transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bb-primary break-words ${getOptionClasses(idx)}`}
            aria-pressed={selected === idx}
          >
            <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-md bg-white/10 text-sm font-semibold">{String.fromCharCode(65 + idx)}</span>
            <span className="align-middle">{opt}</span>
          </motion.button>
        ))}
      </motion.div>
    </div>
  );
}