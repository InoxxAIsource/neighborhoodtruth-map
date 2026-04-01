import { motion } from 'framer-motion';
import { sceneTransitions } from '@/lib/video/animations';

export const Scene5ZoneBloom = () => {
  const zones = [
    { color: "bg-brand-orange", x: "-18vw", y: "-15vh", text: "Cool 😎", delay: 0.2 },
    { color: "bg-brand-teal", x: "18vw", y: "-22vh", text: "Family 👨‍👩‍👧", delay: 0.8 },
    { color: "bg-brand-purple", x: "2vw", y: "18vh", text: "Edgy 🔥", delay: 1.4 },
  ];

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center z-10"
      {...sceneTransitions.fadeBlur}
    >
      <div className="absolute inset-0 mix-blend-screen opacity-80">
        {zones.map((zone, i) => (
          <motion.div
            key={i}
            className={`absolute rounded-full flex items-center justify-center ${zone.color} blur-[20px]`}
            initial={{ width: "0vw", height: "0vw", opacity: 0, x: zone.x, y: zone.y, left: "50%", top: "50%", transform: "translate(-50%, -50%)" }}
            animate={{ width: "50vw", height: "50vw", opacity: 0.6, x: zone.x, y: zone.y }}
            transition={{ duration: 2.5, ease: "easeOut", delay: zone.delay }}
          />
        ))}
      </div>

      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {zones.map((zone, i) => (
          <motion.div
            key={`text-${i}`}
            className="absolute font-display font-black text-5xl md:text-6xl text-white drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)]"
            initial={{ opacity: 0, scale: 0.5, x: zone.x, y: zone.y, left: "50%", top: "50%", transform: "translate(-50%, -50%)" }}
            animate={{ opacity: 1, scale: 1, x: zone.x, y: zone.y }}
            transition={{ duration: 1, delay: zone.delay + 0.8, type: "spring", stiffness: 200, damping: 20 }}
          >
            {zone.text}
          </motion.div>
        ))}
      </div>
      
      <motion.div
        className="absolute bottom-[10vh] text-center w-full"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 3, duration: 1 }}
      >
        <h2 className="font-display text-4xl text-white/90 font-bold tracking-tight">
          Find your perfect zone.
        </h2>
      </motion.div>
    </motion.div>
  );
};
