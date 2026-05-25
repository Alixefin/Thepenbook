"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface BookPageOpeningProps {
  coverNode: ReactNode;
  contentNode: ReactNode;
}

export default function BookPageOpening({ coverNode, contentNode }: BookPageOpeningProps) {
  // Animation variants for the cover flip effect - slower reveal
  const coverVariants = {
    hidden: { opacity: 1 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut",
      },
    },
  };

  // Animation variants for content fade-in with more delay
  const contentVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: "easeOut",
        delay: 1.2,
      },
    },
  };

  return (
    <div>
      {/* Cover stays visible */}
      <motion.div
        variants={coverVariants}
        initial="hidden"
        animate="visible"
      >
        {coverNode}
      </motion.div>

      {/* Content fade-in after cover is visible */}
      <motion.div
        variants={contentVariants}
        initial="hidden"
        animate="visible"
      >
        {contentNode}
      </motion.div>
    </div>
  );
}
