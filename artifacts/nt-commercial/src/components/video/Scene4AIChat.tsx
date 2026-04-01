import { motion } from 'framer-motion';
import { sceneTransitions } from '@/lib/video/animations';
import { useEffect, useState } from 'react';

export const Scene4AIChat = () => {
  const [typedQuestion, setTypedQuestion] = useState("");
  const fullQuestion = "Is Williamsburg safe at night?";
  
  const [typedAnswer, setTypedAnswer] = useState("");
  const fullAnswer = "Locals rate it 4/5 for safety after dark. Most well-lit main streets are highly active and generally considered safe by residents.";

  useEffect(() => {
    let qIndex = 0;
    const qInterval = setInterval(() => {
      if (qIndex <= fullQuestion.length) {
        setTypedQuestion(fullQuestion.slice(0, qIndex));
        qIndex++;
      } else {
        clearInterval(qInterval);
      }
    }, 40);

    const aTimeout = setTimeout(() => {
      let aIndex = 0;
      const aInterval = setInterval(() => {
        if (aIndex <= fullAnswer.length) {
          setTypedAnswer(fullAnswer.slice(0, aIndex));
          aIndex++;
        } else {
          clearInterval(aInterval);
        }
      }, 25);
      return () => clearInterval(aInterval);
    }, 1800);

    return () => {
      clearInterval(qInterval);
      clearTimeout(aTimeout);
    };
  }, []);

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center z-10"
      {...sceneTransitions.slideUp}
    >
      <div className="w-[70vw] flex flex-col gap-8">
        <motion.div 
          className="self-end bg-brand-teal text-white px-8 py-5 rounded-3xl rounded-tr-sm text-[2vw] shadow-xl max-w-[70vw] font-medium"
          initial={{ opacity: 0, scale: 0.9, x: 30 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          {typedQuestion}
          <motion.span 
            animate={{ opacity: [0, 1, 0] }} 
            transition={{ repeat: Infinity, duration: 0.8 }}
            className="inline-block ml-1 font-mono text-white/50"
          >
            |
          </motion.span>
        </motion.div>

        {typedQuestion.length === fullQuestion.length && (
          <motion.div 
            className="self-start bg-brand-navy border border-brand-purple/40 text-white px-8 py-6 rounded-3xl rounded-tl-sm text-[2vw] shadow-2xl max-w-[70vw] flex gap-6 items-start relative overflow-hidden"
            initial={{ opacity: 0, scale: 0.9, x: -30 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-brand-purple/10 to-transparent pointer-events-none" />
            <div className="mt-1 text-brand-purple shrink-0 bg-brand-purple/10 p-3 rounded-xl">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
            </div>
            <div className="leading-relaxed font-body relative z-10">
              {typedAnswer}
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};
