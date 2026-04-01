import { motion } from 'framer-motion';
import { sceneTransitions, springs } from '@/lib/video/animations';

export const Scene2LabelsDrop = () => {
  const labels = [
    { text: "🌙 Safe at night", x: "-22vw", y: "-18vh", delay: 0.2 },
    { text: "🎉 Good nightlife", x: "18vw", y: "-8vh", delay: 0.6 },
    { text: "💸 Affordable", x: "-12vw", y: "22vh", delay: 1.0 },
    { text: "☕ Great coffee", x: "24vw", y: "18vh", delay: 1.4 },
    { text: "🌳 Parks nearby", x: "4vw", y: "-25vh", delay: 1.8 },
  ];

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center z-10"
      {...sceneTransitions.zoomThrough}
    >
      {labels.map((label, i) => (
        <motion.div
          key={i}
          className="absolute bg-white text-brand-navy px-6 py-3 rounded-2xl font-display font-bold text-xl md:text-2xl shadow-2xl flex items-center gap-2 border border-black/10"
          initial={{ opacity: 0, scale: 0, x: label.x, y: `calc(${label.y} - 20vh)` }}
          animate={{ opacity: 1, scale: 1, x: label.x, y: label.y }}
          transition={{ ...springs.bouncy, delay: label.delay }}
        >
          {label.text}
          <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[12px] border-t-white drop-shadow-md" />
        </motion.div>
      ))}
      
      <motion.div
        className="absolute bottom-[15vh] text-center"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2.5, duration: 1, ease: [0.16, 1, 0.3, 1] }}
      >
        <h2 className="font-display text-4xl text-white/90 font-bold tracking-tight">
          Real labels from real locals.
        </h2>
      </motion.div>
    </motion.div>
  );
};
