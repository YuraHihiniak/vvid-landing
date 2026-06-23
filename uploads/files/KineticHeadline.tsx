"use client";
/**
 * KineticHeadline — кинетический заголовок: слова «выезжают» из-под маски
 * со ступенчатой задержкой. Использует Framer Motion (он уже в твоём стеке).
 *
 * Использование:
 *   <KineticHeadline
 *     words={["A", "Hybrid", "Film", "Production"]}
 *     className="text-7xl font-black uppercase tracking-tight"
 *   />
 *
 * Можно помечать отдельные слова как «тонкие/курсив» через объект:
 *   words={[{ t: "A" }, { t: "Hybrid" }, { t: "visual eng.", thin: true }]}
 */
import { motion, useReducedMotion, type Variants } from "framer-motion";

type Word = string | { t: string; thin?: boolean };

type Props = {
  words: Word[];
  className?: string;
  /** задержка между словами, сек. */
  stagger?: number;
};

const container: Variants = {
  hidden: {},
  show: (stagger: number) => ({
    transition: { staggerChildren: stagger },
  }),
};

const word: Variants = {
  hidden: { y: "110%" },
  show: { y: "0%", transition: { duration: 0.9, ease: [0.16, 1, 0.3, 1] } },
};

export default function KineticHeadline({
  words,
  className = "",
  stagger = 0.08,
}: Props) {
  const reduce = useReducedMotion();

  return (
    <motion.h1
      className={className}
      style={{ display: "flex", flexWrap: "wrap", gap: "0.25em", lineHeight: 0.9 }}
      variants={container}
      custom={stagger}
      initial={reduce ? "show" : "hidden"}
      whileInView="show"
      viewport={{ once: true, amount: 0.4 }}
    >
      {words.map((w, i) => {
        const text = typeof w === "string" ? w : w.t;
        const thin = typeof w === "object" && w.thin;
        return (
          <span key={i} style={{ display: "inline-block", overflow: "hidden", verticalAlign: "top" }}>
            <motion.span
              variants={word}
              style={{
                display: "inline-block",
                fontWeight: thin ? 300 : undefined,
                fontStyle: thin ? "italic" : undefined,
              }}
            >
              {text}
            </motion.span>
          </span>
        );
      })}
    </motion.h1>
  );
}
