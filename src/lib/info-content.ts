export type InfoSection = {
  slug: string;
  titulo: string;
  descripcion: string;
  cuerpo: InfoBlock[];
};

export type InfoBlock =
  | { tipo: "parrafo"; texto: string }
  | { tipo: "subtitulo"; texto: string }
  | { tipo: "lista"; items: string[] }
  | {
      tipo: "tabla_planes";
      planes: {
        nombre: string;
        precio: string;
        entrega: string;
        incluye: string[];
      }[];
    }
  | { tipo: "pasos"; pasos: { titulo: string; detalle: string }[] };

export const INFO_SECTIONS: InfoSection[] = [
  {
    slug: "programa",
    titulo: "¿Qué es el programa?",
    descripcion: "En qué consiste la certificación de vendedores de MyS Sites.",
    cuerpo: [
      {
        tipo: "parrafo",
        texto:
          "MyS Sites busca crecer a través de un pequeño equipo de vendedores certificados. Antes de vender sitios web de verdad y ganar comisión por ello, cada vendedor pasa por un curso corto de práctica y un examen de certificación.",
      },
      {
        tipo: "parrafo",
        texto:
          "La idea es simple: nadie sale a vender sin antes haber practicado lo suficiente como para hacerlo bien. Así ganan los vendedores, ganan los clientes, y gana MyS Sites.",
      },
      { tipo: "subtitulo", texto: "Lo que vas a lograr" },
      {
        tipo: "lista",
        items: [
          "Aprender a vender de forma real, no en teoría.",
          "Ganar 20% de comisión por cada cliente que cierres.",
          "Cobrar en efectivo, sin depender de terceros.",
          "Formar parte del equipo original del programa.",
        ],
      },
    ],
  },
  {
    slug: "como-trabajamos",
    titulo: "Cómo trabajamos",
    descripcion: "El proceso end-to-end del curso al primer cierre.",
    cuerpo: [
      {
        tipo: "pasos",
        pasos: [
          {
            titulo: "1. Curso de práctica",
            detalle:
              "8 días mínimo dentro del simulador, con al menos 1 práctica al día. La dificultad sube progresivamente en 3 etapas: guiado, opción múltiple y libre.",
          },
          {
            titulo: "2. Examen de certificación",
            detalle:
              "Se desbloquea el día 8. Dos partes: teórica y práctica. Necesitas 8 o más en cada una para certificarte.",
          },
          {
            titulo: "3. Recibes tus primeros prospectos",
            detalle:
              "Máximo 3-5 prospectos activos a la vez. Nadie contacta al mismo negocio que tú tienes asignado.",
          },
          {
            titulo: "4. Vendes",
            detalle:
              "Presentas los 3 planes, resuelves dudas, cierras el trato. Cuando el cliente esté listo para pagar, avisas al admin.",
          },
          {
            titulo: "5. El pago va directo al negocio",
            detalle:
              "MyS Sites le manda al cliente los datos de pago — nunca tú. Cuando confirma, subes la foto del comprobante.",
          },
          {
            titulo: "6. Cobras tu comisión",
            detalle:
              "Una vez aprobado el pago, se te paga 20% en efectivo directo.",
          },
        ],
      },
    ],
  },
  {
    slug: "planes",
    titulo: "Los 3 planes que vendes",
    descripcion: "Precios, qué incluye cada uno y a quién se lo ofreces.",
    cuerpo: [
      {
        tipo: "parrafo",
        texto:
          "Todo vendedor certificado ofrece los 3 planes. El cliente elige el que le haga sentido — tú ganas 20% de comisión sin importar cuál cierre.",
      },
      {
        tipo: "tabla_planes",
        planes: [
          {
            nombre: "Temporada",
            precio: "$2,000 MXN",
            entrega: "Entrega: 7 días",
            incluye: [
              "Plantilla estándar",
              "1 ronda de ajustes",
              "Dominio incluido",
            ],
          },
          {
            nombre: "Negocio",
            precio: "$4,500 MXN",
            entrega: "Entrega: 7 días",
            incluye: [
              "Plantilla a la medida del giro",
              "2-3 rondas de ajustes",
              "SEO más cuidado",
              "1 mes de mantenimiento de cortesía",
            ],
          },
          {
            nombre: "Completo",
            precio: "$12,000 MXN",
            entrega: "Entrega: a definir según feature",
            incluye: [
              "Todo lo del plan Negocio",
              "Feature a la medida (reservas, citas, mensualidades)",
              "Mantenimiento incluido por más tiempo",
              "Ajustes ilimitados el primer mes",
            ],
          },
        ],
      },
      { tipo: "subtitulo", texto: "Lo que siempre incluye" },
      {
        tipo: "lista",
        items: [
          "Diseño a la medida del negocio (no plantillas genéricas reutilizadas).",
          "Publicación con dominio propio.",
          "Optimización para verse bien en celular.",
          "Botón directo de WhatsApp, ubicación, horarios y contacto visibles.",
        ],
      },
    ],
  },
  {
    slug: "comision",
    titulo: "Tu comisión",
    descripcion: "Cuánto ganas, cómo y cuándo se paga.",
    cuerpo: [
      {
        tipo: "parrafo",
        texto:
          "20% del monto cobrado al cliente, plano, en cualquiera de los 3 planes.",
      },
      { tipo: "subtitulo", texto: "En números" },
      {
        tipo: "lista",
        items: [
          "Plan Temporada ($2,000) → tu comisión: $400",
          "Plan Negocio ($4,500) → tu comisión: $900",
          "Plan Completo ($12,000) → tu comisión: $2,400",
        ],
      },
      {
        tipo: "parrafo",
        texto:
          "Se paga en efectivo, directamente, una vez que el pago del cliente está confirmado y aprobado por MyS Sites.",
      },
    ],
  },
  {
    slug: "flujo-de-pago",
    titulo: "Cómo se cierra un pago",
    descripcion:
      "El paso más importante — protege al cliente, al negocio y a ti.",
    cuerpo: [
      {
        tipo: "parrafo",
        texto:
          "El flujo de pago siempre es así, sin excepciones. Está diseñado para que nadie pueda quedarse con el pago de un cliente ni intentarlo.",
      },
      {
        tipo: "pasos",
        pasos: [
          {
            titulo: "1. Se te asigna un prospecto",
            detalle:
              "MyS Sites le manda al cliente un mensaje breve de presentación — quién es el dueño del negocio, sin mencionar pagos todavía.",
          },
          {
            titulo: "2. Haces tu trabajo de venta normal",
            detalle:
              "Presentas los planes, resuelves dudas, cierras el trato. Sin ninguna interferencia.",
          },
          {
            titulo: "3. Cuando el cliente ya está listo para pagar",
            detalle:
              "MyS Sites — y solo MyS Sites — le manda al cliente los datos de pago. Tú NUNCA compartes una cuenta propia ni recibes el pago completo a tu nombre.",
          },
          {
            titulo: "4. El cliente confirma con comprobante",
            detalle:
              "Subes la foto del comprobante desde la app para aprobación.",
          },
          {
            titulo: "5. Cobras tu comisión",
            detalle:
              "Al aprobarse el comprobante, se te paga en efectivo.",
          },
        ],
      },
      { tipo: "subtitulo", texto: "Excepción de efectivo en persona" },
      {
        tipo: "parrafo",
        texto:
          "Solo aplica una vez que ya demostraste ser confiable con cierres previos por transferencia. Tienes 24-48 horas para entregar el dinero. Si no cumples, o si intentas quedarte con un pago, se cancela tu certificación y se le avisa a tus papás.",
      },
    ],
  },
  {
    slug: "reglas",
    titulo: "Reglas generales",
    descripcion: "Lo que sí y lo que no como vendedor certificado.",
    cuerpo: [
      { tipo: "subtitulo", texto: "Sobre los prospectos" },
      {
        tipo: "lista",
        items: [
          "Contactas solo a los prospectos que te fueron asignados.",
          "No se vale 'robarle' un prospecto a otro vendedor.",
          "Si no reportas seguimiento en 7-10 días, el prospecto se libera automáticamente.",
        ],
      },
      { tipo: "subtitulo", texto: "Sobre la venta" },
      {
        tipo: "lista",
        items: [
          "Ser honesto con el cliente sobre tiempos de entrega, qué incluye cada plan y precio.",
          "Los vendedores NO pueden ofrecer descuentos. Precio fijo por plan.",
          "Nada de prometer de más para cerrar una venta.",
        ],
      },
      { tipo: "subtitulo", texto: "Sobre el pago" },
      {
        tipo: "lista",
        items: [
          "Nunca compartes datos de tu cuenta al cliente. Siempre los manda MyS Sites.",
          "Cualquier comprobante falso, venta inventada o intento de recibir un pago fuera del proceso cancela la certificación de inmediato.",
        ],
      },
      { tipo: "subtitulo", texto: "Sobre el curso" },
      {
        tipo: "lista",
        items: [
          "Mínimo 1 práctica diaria para que el día cuente.",
          "El examen se desbloquea el día 8, no antes.",
          "Si el examen se reprueba, hay que esperar 12 horas para reintentar.",
          "Si pasan 20-30 días sin actividad, tu progreso se archiva (no se borra) — puedes retomarlo cuando quieras.",
        ],
      },
    ],
  },
];

export function getInfoSection(slug: string): InfoSection | null {
  return INFO_SECTIONS.find((s) => s.slug === slug) ?? null;
}
