// Pool determinístico de frases motivacionales en español mexicano.
// Rota por día — cada vendedor ve la misma frase el mismo día.

const FRASES = [
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
];

export function fraseDelDia(): string {
  // Days since epoch → determinístico y estable por día
  const dayIndex = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
  return FRASES[dayIndex % FRASES.length];
}
