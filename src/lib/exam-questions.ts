// Pool de preguntas teóricas para el examen de certificación.
// Cada examen toma 6 al azar. El coach evalúa las respuestas contra la
// clave y el criterio del reglamento.

export type PreguntaTeorica = {
  id: string;
  pregunta: string;
  clave: string; // respuesta esperada / criterio de evaluación
};

export const PREGUNTAS_TEORICAS: PreguntaTeorica[] = [
  {
    id: "planes-precios",
    pregunta: "Menciona los 3 planes que ofrece MyS Sites, cada uno con su precio.",
    clave:
      "Temporada $2,000, Negocio $4,500, Completo $12,000. Todos MXN.",
  },
  {
    id: "comision",
    pregunta: "¿Cuál es tu comisión por cada cliente que cierres y cómo se te paga?",
    clave:
      "20% plano del monto cobrado, sin importar el plan. Se paga en efectivo directamente cuando el pago del cliente ya fue aprobado.",
  },
  {
    id: "flujo-pago",
    pregunta:
      "Un cliente te dice 'ya me pasas tus datos y te transfiero'. ¿Qué haces exactamente?",
    clave:
      "El vendedor NUNCA comparte datos de cuenta ni recibe el pago. Se avisa a MyS Sites (Santiago) y él manda los datos de pago directo al cliente. Solo así se puede aprobar el cierre.",
  },
  {
    id: "descuentos",
    pregunta: "¿Puedes ofrecer un descuento sobre el precio del plan?",
    clave:
      "No. Los vendedores no pueden ofrecer descuentos. Precio fijo por plan, sin excepción.",
  },
  {
    id: "cancelacion",
    pregunta: "Un cliente cancela después de recibir el sitio para revisión. ¿Cuánto se le reembolsa?",
    clave:
      "Nada. Si ya recibió la primera versión para revisión, no aplica reembolso — se termina el sitio y el cliente cubre el saldo.",
  },
  {
    id: "prospectos-inactividad",
    pregunta:
      "¿Qué pasa con un prospecto asignado si no reportas seguimiento en 7-10 días?",
    clave:
      "Se libera automáticamente y se le reasigna a otro vendedor activo.",
  },
  {
    id: "efectivo-persona",
    pregunta:
      "¿En qué caso puedes recibir un pago en efectivo directamente del cliente?",
    clave:
      "Solo si ya has probado ser confiable con al menos un cierre previo por transferencia. Y tienes máximo 24-48 horas para entregar el dinero. Si no cumples, se cancela la certificación y se avisa a los papás.",
  },
  {
    id: "curso-actividad",
    pregunta:
      "¿Qué necesitas hacer todos los días del curso para que ese día 'cuente'?",
    clave:
      "Al menos 1 práctica completa (chat con cliente simulado). Sin práctica el día no cuenta y no avanzas al siguiente.",
  },
  {
    id: "examen-desbloqueo",
    pregunta: "¿A partir de qué día se desbloquea el examen y cuál es la regla de reintento?",
    clave:
      "Se desbloquea el día 8, solo si cumpliste la actividad diaria. Si repruebas, esperas 12 horas para volver a intentar.",
  },
  {
    id: "prospectos-max",
    pregunta:
      "¿Cuál es el máximo de prospectos activos que puedes tener asignados a la vez?",
    clave: "Entre 3 y 5 prospectos activos a la vez, no más.",
  },
  {
    id: "prometer-precio",
    pregunta:
      "Un cliente pregunta si le puedes hacer un plan a la medida por $3,500 (entre Temporada y Negocio). ¿Qué haces?",
    clave:
      "No. Los precios son fijos y no puedes mezclar planes. Explicas los 3 planes tal cual y dejas que elija.",
  },
  {
    id: "cliente-no-quiere",
    pregunta:
      "Un prospecto asignado ya te dijo 'no me interesa, no vuelvas a contactarme'. ¿Qué haces en la app?",
    clave:
      "Se marca como 'cerrado sin venta'. El prospecto se libera de inmediato, sin esperar los 7-10 días de inactividad.",
  },
  {
    id: "comprobante-falso",
    pregunta:
      "¿Qué pasa si intentas subir un comprobante de pago falso o inventar una venta?",
    clave:
      "La certificación se cancela de inmediato y se avisa a tus papás.",
  },
];

export function pickRandom(n: number): PreguntaTeorica[] {
  const pool = [...PREGUNTAS_TEORICAS];
  const out: PreguntaTeorica[] = [];
  for (let i = 0; i < n && pool.length > 0; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    out.push(pool.splice(idx, 1)[0]);
  }
  return out;
}
