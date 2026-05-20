"use client";

import { motion } from "motion/react";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.32, delayChildren: 0.25 } },
};

const line = {
  hidden: { opacity: 0, y: 10, filter: "blur(4px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] as const },
  },
};

export default function Letter() {
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="font-hand text-[var(--ink)] leading-[1.7]"
    >
      <motion.p
        variants={line}
        className="text-4xl sm:text-5xl text-[var(--ink)] mb-6"
      >
        Cele,
      </motion.p>

      <motion.p variants={line} className="text-2xl sm:text-3xl mb-5">
        esto es para que hagamos una cuenta regresiva hacia tu cumple — la fecha
        en la que te pregunté si llegaríamos a estar todavía juntos.
      </motion.p>

      <motion.p variants={line} className="text-2xl sm:text-3xl mb-5">
        la verdad es que, desde que te conocí —ese 11 en el gimnasio y el 12 en el
        sillón de mi depto—, me encantaste. me gustó todo de vos. me hiciste reír
        desde el principio, con tus anécdotas, tus gestos, tus sonrisas.
      </motion.p>

      <motion.p variants={line} className="text-2xl sm:text-3xl mb-5">
        admito que pensé que quizás no iba a salir bien{" "}
        <span className="text-[var(--ink-soft)]">(no sé por qué)</span>, pero salió
        muchísimo mejor de lo que podría haber imaginado. al principio lo atractivo
        de vernos era lo que teníamos en la cama, pero después empecé a conocerte
        más y me di cuenta de la hermosa personita que había.
      </motion.p>

      <motion.p variants={line} className="text-2xl sm:text-3xl mb-5">
        hoy, un mes y piquito después, puedo decir que te conozco mucho más que esa
        noche. que me encanta compartir no solo la cama, sino cualquier otra cosa
        con vos. que una pavada —como ir a comprar una botellita a un supermercado—
        se vuelve un momento súper lindo al lado tuyo.
      </motion.p>

      <motion.p variants={line} className="text-2xl sm:text-3xl mb-5">
        gracias por haberte acercado ese sábado en el gimnasio a hablarme; si no,
        quizás no estaría escribiendo esto y nunca nos hubiésemos visto. gracias por
        confiar en mí, por darme un espacio en tu vida a pesar de tus miedos y de la
        diferencia de edad. gracias también por ser como sos conmigo, sin que yo te
        pida ni plantee nada — eso es algo que me encanta.
      </motion.p>

      <motion.p variants={line} className="text-2xl sm:text-3xl mb-5">
        podría decir más cosas, pero algunas es mejor guardarlas.
      </motion.p>

      <motion.p variants={line} className="text-2xl sm:text-3xl mb-2">
        espero hacer que valga la pena lo que hacés por mí. espero superar tus
        expectativas y sumar en tu vida, siempre.
      </motion.p>

      <motion.div variants={line} className="mt-8 text-2xl sm:text-3xl">
        <span className="ink-underline inline-block text-4xl sm:text-5xl">Tkm.</span>
        <br />
        <span className="text-[var(--ink-soft)] mt-2 inline-block">— Marc</span>
      </motion.div>
    </motion.div>
  );
}
