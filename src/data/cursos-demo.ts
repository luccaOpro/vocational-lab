/*
  Datos FALSOS para la maqueta del aula.
  ---
  Cuando conectemos Supabase, esto se reemplaza por consultas reales.
  Los nombres de campos están pensados para que el cambio sea suave.

  ESTRUCTURA:
  · alumnoDemo / alumnosDemo  → alumnos del aula
  · profeDemo / profesDemo    → profesores
  · cursosDemo                → cursos con módulos, archivos y tareas
  · entregasDemo              → entregas que hay que corregir
  · transferenciasDemo        → transferencias pendientes de confirmar (admin)
*/

// ─── Alumnos ──────────────────────────────────────────────────────────

export interface Alumno {
  id: string;
  nombre: string;
  email: string;
  /** Fecha en formato libre, solo para mostrar. */
  inscripto: string;
  /** Estado de pago. */
  pago: "pagado" | "pendiente";
  /** Slugs de los cursos en los que está inscripto. */
  cursos: string[];
}

// Alumno principal para la vista de "Mis cursos".
export const alumnoDemo: Alumno = {
  id: "a-001",
  nombre: "Sofía Méndez",
  email: "sofia.mendez@ejemplo.com",
  inscripto: "30 de julio de 2026",
  pago: "pagado",
  cursos: ["coaching-vocacional-agosto-2026", "taller-identidad-y-proposito"],
};

// Lista para la vista de admin.
export const alumnosDemo: Alumno[] = [
  alumnoDemo,
  {
    id: "a-002",
    nombre: "Mateo Aguirre",
    email: "mateo.aguirre@ejemplo.com",
    inscripto: "2 de agosto de 2026",
    pago: "pagado",
    cursos: ["coaching-vocacional-agosto-2026"],
  },
  {
    id: "a-003",
    nombre: "Camila Rossi",
    email: "camila.rossi@ejemplo.com",
    inscripto: "5 de agosto de 2026",
    pago: "pagado",
    cursos: ["coaching-vocacional-agosto-2026"],
  },
  {
    id: "a-004",
    nombre: "Joaquín Bravo",
    email: "joaquin.bravo@ejemplo.com",
    inscripto: "8 de agosto de 2026",
    pago: "pendiente",
    cursos: [],
  },
  {
    id: "a-005",
    nombre: "Lucía Pérez",
    email: "lucia.perez@ejemplo.com",
    inscripto: "9 de agosto de 2026",
    pago: "pendiente",
    cursos: [],
  },
];

// ─── Profesores ──────────────────────────────────────────────────────

export interface Profesor {
  id: string;
  nombre: string;
  email: string;
  /** Slugs de los cursos que enseña. */
  cursos: string[];
}

export const profeDemo: Profesor = {
  id: "p-001",
  nombre: "Julia Vargas",
  email: "julia@vocationallab.com",
  cursos: ["coaching-vocacional-agosto-2026"],
};

export const profesDemo: Profesor[] = [
  profeDemo,
  {
    id: "p-002",
    nombre: "Laura Pires",
    email: "laura@vocationallab.com",
    cursos: ["coaching-vocacional-agosto-2026", "taller-identidad-y-proposito"],
  },
];

// ─── Cursos / Módulos / Archivos / Tareas ────────────────────────────

export interface ArchivoModulo {
  nombre: string;
  peso: string;
  tipo: "pdf" | "video" | "audio" | "link";
}

export interface TareaModulo {
  titulo: string;
  consigna: string;
  fechaEntrega: string;
  estado: "pendiente" | "entregada" | "corregida";
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
  slug: string;
  titulo: string;
  resumen: string;
  profesor: string;
  periodo: string;
  progreso: number;
  modulos: Modulo[];
}

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

export function obtenerAlumno(id: string): Alumno | undefined {
  return alumnosDemo.find((a) => a.id === id);
}

// ─── Entregas (lo que el profe tiene que corregir) ───────────────────

export interface Entrega {
  id: string;
  alumnoId: string;
  cursoSlug: string;
  moduloNumero: number;
  /** Archivo que subió el alumno. */
  archivo: string;
  /** Fecha en que el alumno la subió. */
  enviadaEl: string;
  estado: "pendiente" | "corregida";
  /** Si ya fue corregida, la devolución. */
  devolucion?: { nota: string; comentario: string };
}

export const entregasDemo: Entrega[] = [
  {
    id: "e-001",
    alumnoId: "a-001",
    cursoSlug: "coaching-vocacional-agosto-2026",
    moduloNumero: 2,
    archivo: "mapa-fortalezas-sofia.pdf",
    enviadaEl: "28 de agosto",
    estado: "pendiente",
  },
  {
    id: "e-002",
    alumnoId: "a-002",
    cursoSlug: "coaching-vocacional-agosto-2026",
    moduloNumero: 2,
    archivo: "fortalezas-mateo.jpg",
    enviadaEl: "27 de agosto",
    estado: "pendiente",
  },
  {
    id: "e-003",
    alumnoId: "a-003",
    cursoSlug: "coaching-vocacional-agosto-2026",
    moduloNumero: 1,
    archivo: "carta-futuro-camila.pdf",
    enviadaEl: "14 de agosto",
    estado: "corregida",
    devolucion: {
      nota: "Muy bien",
      comentario: "Cami, hermosa carta. Me encantó la metáfora del faro.",
    },
  },
  {
    id: "e-004",
    alumnoId: "a-001",
    cursoSlug: "coaching-vocacional-agosto-2026",
    moduloNumero: 1,
    archivo: "carta-futuro-sofia.pdf",
    enviadaEl: "14 de agosto",
    estado: "corregida",
    devolucion: {
      nota: "Excelente",
      comentario:
        "Sofi, qué hermosa apertura. Me quedo con la imagen del 'mapa propio'.",
    },
  },
];

export function obtenerEntrega(id: string): Entrega | undefined {
  return entregasDemo.find((e) => e.id === id);
}

export function entregasPendientes(): Entrega[] {
  return entregasDemo.filter((e) => e.estado === "pendiente");
}

// ─── Transferencias (lo que el admin ve para confirmar pagos) ────────

export interface Transferencia {
  id: string;
  alumnoEmail: string;
  alumnoNombre: string;
  monto: string;
  fecha: string;
  curso: string;
  estado: "pendiente" | "confirmada";
}

export const transferenciasDemo: Transferencia[] = [
  {
    id: "t-001",
    alumnoEmail: "joaquin.bravo@ejemplo.com",
    alumnoNombre: "Joaquín Bravo",
    monto: "$ 95.000",
    fecha: "8 de agosto",
    curso: "Coaching Vocacional · Agosto 2026",
    estado: "pendiente",
  },
  {
    id: "t-002",
    alumnoEmail: "lucia.perez@ejemplo.com",
    alumnoNombre: "Lucía Pérez",
    monto: "$ 95.000",
    fecha: "9 de agosto",
    curso: "Coaching Vocacional · Agosto 2026",
    estado: "pendiente",
  },
];
