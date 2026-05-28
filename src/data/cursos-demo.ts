/*
  Datos FALSOS de cursos / alumno para la maqueta del aula.
  ---
  Mientras no haya backend, las páginas privadas leen de acá.
  Cuando conectemos Supabase, esto se reemplaza por consultas reales
  pero la forma del objeto va a ser parecida — por eso conviene
  mantener nombres de campos claros.
*/

export interface ArchivoModulo {
  /** Texto que ve el alumno. */
  nombre: string;
  /** Tamaño aproximado, sólo para mostrar. */
  peso: string;
  /** Tipo: pdf, video, audio, link. Sólo afecta el ícono. */
  tipo: "pdf" | "video" | "audio" | "link";
}

export interface TareaModulo {
  titulo: string;
  consigna: string;
  /** Fecha que ve el alumno. Formato libre por ahora. */
  fechaEntrega: string;
  /** Estado de la entrega del alumno. */
  estado: "pendiente" | "entregada" | "corregida";
  /** Si está corregida, devolución del profe. */
  devolucion?: { nota: string; comentario: string };
}

export interface Modulo {
  numero: number;
  titulo: string;
  descripcion: string;
  archivos: ArchivoModulo[];
  tarea?: TareaModulo;
}

export interface Curso {
  /** Identificador para la URL: /aula/curso/[slug]. */
  slug: string;
  titulo: string;
  resumen: string;
  /** Nombre(s) del/los profe(s). */
  profesor: string;
  /** Texto libre para mostrar el período del curso. */
  periodo: string;
  /** Progreso 0-100 que muestra la barra. */
  progreso: number;
  modulos: Modulo[];
}

// Alumno de prueba — placeholder hasta que haya auth real.
export const alumnoDemo = {
  nombre: "Sofía Méndez",
  email: "sofia.mendez@ejemplo.com",
};

// Catálogo de cursos a los que está inscripto el alumno demo.
export const cursosDemo: Curso[] = [
  {
    slug: "coaching-vocacional-agosto-2026",
    titulo: "Coaching Vocacional · Edición Agosto 2026",
    resumen:
      "Un viaje de 8 encuentros en 5 etapas para descubrir hacia dónde se construye tu propio futuro.",
    profesor: "Julia Vargas y Laura Pires",
    periodo: "Agosto – Octubre 2026",
    progreso: 35,
    modulos: [
      {
        numero: 1,
        titulo: "Bienvenida — el viaje empieza acá",
        descripcion:
          "Conocemos al grupo, presentamos el método y armamos el contrato de aprendizaje para las próximas semanas.",
        archivos: [
          { nombre: "Manual del programa.pdf", peso: "1.2 MB", tipo: "pdf" },
          { nombre: "Bienvenida en video", peso: "8 min", tipo: "video" },
        ],
        tarea: {
          titulo: "Carta a tu yo del futuro",
          consigna:
            "Escribí una carta (una carilla aprox.) a vos en 5 años. Compartila por acá.",
          fechaEntrega: "15 de agosto",
          estado: "corregida",
          devolucion: {
            nota: "Excelente",
            comentario:
              "Sofi, qué hermosa apertura. Me quedo con la imagen del 'mapa propio'. Charlamos en el próximo encuentro.",
          },
        },
      },
      {
        numero: 2,
        titulo: "Identidad y autoconocimiento",
        descripcion:
          "Quién soy más allá de lo que hago. Trabajamos con narrativa personal y mapeo de fortalezas.",
        archivos: [
          { nombre: "Guía de autoconocimiento.pdf", peso: "780 KB", tipo: "pdf" },
          { nombre: "Ejercicio de fortalezas.pdf", peso: "420 KB", tipo: "pdf" },
        ],
        tarea: {
          titulo: "Mapa de fortalezas",
          consigna:
            "Completá el ejercicio de la guía y subí el resultado (foto del cuaderno o PDF).",
          fechaEntrega: "29 de agosto",
          estado: "entregada",
        },
      },
      {
        numero: 3,
        titulo: "El mundo del trabajo que viene",
        descripcion:
          "Futurismo aplicado: cómo está cambiando el mundo del trabajo y qué significa para tu mapa personal.",
        archivos: [
          { nombre: "Futuros del trabajo 2030.pdf", peso: "2.1 MB", tipo: "pdf" },
          { nombre: "Charla con invitado/a", peso: "45 min", tipo: "video" },
        ],
        tarea: {
          titulo: "Tres escenarios posibles",
          consigna:
            "Imaginá tres escenarios distintos para vos en 2030. Una página por escenario.",
          fechaEntrega: "12 de septiembre",
          estado: "pendiente",
        },
      },
    ],
  },
  {
    slug: "taller-identidad-y-proposito",
    titulo: "Taller: Identidad y Propósito",
    resumen:
      "Un taller intensivo de cuatro encuentros para clarificar el propio propósito profesional.",
    profesor: "Laura Pires",
    periodo: "Julio 2026",
    progreso: 100,
    modulos: [
      {
        numero: 1,
        titulo: "El propósito como brújula",
        descripcion: "Qué es el propósito y cómo se distingue de la meta.",
        archivos: [
          { nombre: "Lectura introductoria.pdf", peso: "520 KB", tipo: "pdf" },
        ],
      },
    ],
  },
];

export function obtenerCurso(slug: string): Curso | undefined {
  return cursosDemo.find((c) => c.slug === slug);
}
