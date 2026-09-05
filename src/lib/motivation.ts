// Pool grande de frases motivacionales en español mexicano.
// Rota determinísticamente por día para consistencia entre vendedores;
// el botón refresh en la UI permite pedir una random.

export const FRASES = [
  "Cada 'no' te acerca al 'sí' que estás esperando.",
  "La venta empieza cuando el cliente dice 'no'.",
  "Nadie recuerda al vendedor promedio. Sé la excepción.",
  "El mejor pitch es el que resuelve un problema real, no el más bonito.",
  "Escucha el doble de lo que hablas — de ahí sale el cierre.",
  "Un cliente satisfecho vale más que diez leads sin cerrar.",
  "El seguimiento constante es lo que separa a los buenos de los mejores.",
  "Vende el resultado, no el producto.",
  "Cada 'no gracias' es información gratis para tu próximo intento.",
  "Los sitios web se venden por confianza, no por precio.",
  "Tu primera venta cambia todo. La segunda confirma que no fue suerte.",
  "Prospectar en frío es un músculo — se entrena a diario.",
  "El cliente promedio necesita 5-7 contactos antes de decir sí.",
  "Un buen vendedor pregunta. Un gran vendedor escucha.",
  "El silencio incómodo después del precio es tu mejor aliado.",
  "Vende como si estuvieras recomendándole algo a tu mejor amigo.",
  "La objeción no es rechazo — es una petición de más información.",
  "Si suenas nervioso, el cliente lo siente. Práctica hasta que suene natural.",
  "El plan más caro es el que tú creas que vale más — el cliente lo notará.",
  "Cerrar es fácil cuando llegaste bien preparado.",
  "El mejor momento para pedir la venta es cuando el cliente cambia de tema.",
  "Todo vendedor que ha cerrado 100 empezó cerrando 1.",
  "La constancia le gana al talento cuando el talento no es constante.",
  "El cliente compra porque confía en ti, no porque el sitio sea bonito.",
  "Nunca discutas el precio antes de haber vendido el valor.",
  "Cada día que practicas es un día más cerca de tu primer cierre real.",
  "El curso es la base. La calle es donde de verdad aprendes.",
  "No vendas sitios web. Vende más clientes para su negocio.",
  "Tu tono al hablar vende más que tus palabras.",
  "Si el cliente no se emociona, tú tampoco te emocionaste al presentar.",
  "El miedo al 'no' es lo único que te separa de tu próxima venta.",
  "Tu producto vale exactamente lo que tú creas que vale.",
  "Vender no es convencer — es ayudar al cliente a decidir bien.",
  "Los mejores cierres pasan cuando el vendedor se calla a tiempo.",
  "Un cliente que hace muchas preguntas está más cerca de comprar de lo que crees.",
  "Prospectar es como el gym — duele al principio, se vuelve rutina, y transforma.",
  "El primer 'no' del día siempre pesa más que los siguientes.",
  "Cada llamada frustrante te está enseñando algo. Extráelo.",
  "La disciplina te lleva más lejos que la motivación.",
  "El vendedor que se prepara antes de la llamada gana la llamada.",
  "Un buen producto se vende solo. Un vendedor bueno lo vende más rápido.",
  "El cliente no compra tu producto, compra tu confianza.",
  "Sonríe al escribir el mensaje — se nota en las palabras.",
  "La urgencia falsa se huele. La urgencia real se escucha.",
  "Los mejores vendedores hacen que sus clientes se sientan escuchados.",
  "Estás a una llamada de la que puede cambiarte el mes.",
  "Si tienes miedo de cobrar caro, revisa qué te está estorbando en la cabeza.",
  "El seguimiento es donde el 80% de los vendedores se rinden.",
  "Cada venta cerrada valida años de esfuerzo silencioso.",
  "Aprender del rechazo es más útil que celebrar cada victoria.",
  "El mejor vendedor no es el más carismático — es el más consistente.",
  "El silencio después de un 'no' incómodo puede convertirlo en 'espera'.",
  "Habla del beneficio, no del feature. Nadie compra el 'qué', compran el 'para qué'.",
  "Si no crees en lo que vendes, encuentra otra cosa que vender.",
  "El cliente ideal no existe. Existen clientes que aún no te conocen.",
  "El coraje no es la ausencia del miedo — es actuar a pesar de él.",
  "Practica en el simulador como si fuera de verdad. Vende en la calle como si fuera práctica.",
  "El único cierre que garantiza cero ventas es no intentarlo.",
  "Tu voz también vende. Grábate y escúchate — vas a aprender más que con cualquier libro.",
  "Un cliente que dice 'lo pienso' no dijo 'no'. Sigue en juego.",
  "Cada objeción tiene una respuesta preparada — si no la tienes, es tu tarea de hoy.",
];

/**
 * Frase determinística por día — todos los vendedores ven la misma.
 */
export function fraseDelDia(): string {
  const dayIndex = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
  return FRASES[dayIndex % FRASES.length];
}

/**
 * Frase random del pool.
 */
export function fraseRandom(exclude?: string): string {
  if (FRASES.length === 1) return FRASES[0];
  let f = FRASES[Math.floor(Math.random() * FRASES.length)];
  let guard = 0;
  while (exclude && f === exclude && guard < 10) {
    f = FRASES[Math.floor(Math.random() * FRASES.length)];
    guard++;
  }
  return f;
}
