 import { motion, Transition, Variants } from "framer-motion";
 import { ReactNode } from "react";
 
 interface PageTransitionProps {
   children: ReactNode;
   className?: string;
 }
 
 const pageVariants: Variants = {
   initial: {
     opacity: 0,
     y: 12,
   },
   in: {
     opacity: 1,
     y: 0,
   },
   out: {
     opacity: 0,
     y: -12,
   },
 };
 
 const pageTransition: Transition = {
   type: "tween",
   ease: "easeOut" as const,
   duration: 0.25,
 };
 
 export function PageTransition({ children, className }: PageTransitionProps) {
   return (
     <motion.div
       initial="initial"
       animate="in"
       exit="out"
       variants={pageVariants}
       transition={pageTransition}
       className={className}
     >
       {children}
     </motion.div>
   );
 }