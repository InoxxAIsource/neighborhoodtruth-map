import { motion } from 'framer-motion';
import { sceneTransitions } from '@/lib/video/animations';

export const Scene1Hook = () => {
  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center z-10"
      {...sceneTransitions.scaleFade}
    >
      <motion.div
        className="absolute w-[30vw] h-[30vw] rounded-full border-2 border-brand-teal"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 4, opacity: [0, 0.8, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeOut" }}
      />
      <motion.div
        className="absolute w-[30vw] h-[30vw] rounded-full border-2 border-brand-teal"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 4, opacity: [0, 0.8, 0] }}
        transition={{ duration: 4, delay: 1.5, repeat: Infinity, ease: "easeOut" }}
      />
      <motion.h1
        className="font-display text-[5vw] font-black tracking-tight text-white relative z-20 text-center drop-shadow-2xl"
        initial={{ opacity: 0, y: 40, filter: 'blur(15px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        transition={{ duration: 1.2, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
      >
        Every city <br/>
        <span className="text-brand-teal inline-block mt-2">has a truth.</span>
      </motion.h1>
    </motion.div>
  );
};
