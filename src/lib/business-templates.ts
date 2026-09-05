// Templates para generar businesses_sim adicionales sin escribir a mano.
// Mezcla de giros comunes en Puebla + personalidades + objeciones típicas.
// El endpoint /api/admin/seed-businesses toma N templates al azar y les
// asigna nombres/dificultad variados.

export type BusinessTemplate = {
  giro: string;
  nombreOptions: string[]; // sufijos/nombres tipo "Los Hermanos", "Doña Chelo"
  personalidadFacil: string;
  personalidadDificil: string;
  objecionesFacil: string[];
  objecionesDificil: string[];
};

export const BUSINESS_TEMPLATES: BusinessTemplate[] = [
  {
    giro: "pizzería",
    nombreOptions: ["Pizzería Bella Napoli", "La Casa de la Pizza", "Don Vito Pizzas", "Pizzería La Angelópolis"],
    personalidadFacil: "Alberto, 34 años, dueño de una pizzería a domicilio con buena demanda. Amable, moderno, entiende de tecnología.",
    personalidadDificil: "Don Marco, 55 años, italiano radicado en Puebla, dueño de pizzería tradicional. Orgulloso, receloso de cambios, considera que 'su nombre habla por sí solo'.",
    objecionesFacil: ["Ya tengo pedidos por Uber Eats", "¿Cuánto tarda?", "¿Puedo ver un ejemplo?"],
    objecionesDificil: ["Aquí en Puebla me conocen desde hace 20 años", "Todo eso digital es una moda", "¿Cuánto me va a costar el mantenimiento?"],
  },
  {
    giro: "veterinaria",
    nombreOptions: ["Veterinaria San Francisco", "Clínica Veterinaria Los Ángeles", "Pet Center Puebla", "Mascotas Felices"],
    personalidadFacil: "Dra. Andrea, 30 años, veterinaria joven con enfoque holístico. Cálida, receptiva, quiere modernizar su clínica.",
    personalidadDificil: "Dr. Hernández, 52 años, veterinario con clientela leal desde hace 25 años. Directo, calcula todo por costo-beneficio.",
    objecionesFacil: ["¿Puedo agendar citas por ahí?", "Mis clientes son mayores, ¿lo usarán?", "¿Puedo subir fotos de las mascotas?"],
    objecionesDificil: ["Ya tengo mi lista de WhatsApp", "Los que me buscan ya saben dónde estoy", "¿Y si me abandonan el sistema en un año?"],
  },
  {
    giro: "óptica",
    nombreOptions: ["Óptica Vista Clara", "Óptica del Centro", "Lentes y Estilo", "Visión Poblana"],
    personalidadFacil: "Karen, 29 años, dueña de óptica moderna en zona comercial. Activa en redes, quiere una web que combine.",
    personalidadDificil: "Don Ricardo, 60 años, óptico de tercera generación. Formal, tradicional, sospecha de todo lo 'moderno'.",
    objecionesFacil: ["¿Puedo mostrar los modelos?", "¿Se ve bien desde el celular?", "¿Cuántas fotos puedo subir?"],
    objecionesDificil: ["La gente compra lentes al probárselos, no en internet", "¿Qué garantiza que no me copie la competencia?", "Nunca he tenido ni un letrero grande, ¿para qué una página?"],
  },
  {
    giro: "panadería",
    nombreOptions: ["Panadería La Estrella", "Pan de Doña Lucha", "Panadería El Trigal", "La Baguette Poblana"],
    personalidadFacil: "Lucía, 40 años, panadería artesanal con pastelería. Cálida, orgullosa de sus recetas.",
    personalidadDificil: "Don Genaro, 58 años, panadería de barrio de toda la vida. Ocupado desde las 4am, poca paciencia.",
    objecionesFacil: ["¿Puedo mostrar los pasteles de temporada?", "¿Reciben pedidos en línea?", "Mi hija sabe subir cosas"],
    objecionesDificil: ["Yo no ando en internet", "El pan se vende, no se anuncia", "Ya bastante trabajo tengo con la panadería"],
  },
  {
    giro: "dentista",
    nombreOptions: ["Dental Sonrisa Sana", "Clínica Dental del Ángel", "Odontología Familiar Ramírez", "Dentista Puebla Norte"],
    personalidadFacil: "Dra. Paulina, 32 años, dentista con clínica nueva. Marketing-consciente, ya invierte en Google Ads.",
    personalidadDificil: "Dr. Solís, 55 años, dentista con consultorio establecido. Serio, valora prestigio, escéptico de vendedores jóvenes.",
    objecionesFacil: ["¿Puedo mostrar antes/después de mis casos?", "¿Se integra con mi sistema de citas?", "¿Cuánto SEO incluyen?"],
    objecionesDificil: ["¿Qué credenciales tienen ustedes?", "Mi consultorio se llena por recomendación, no por búsquedas", "Ya me han vendido páginas antes y no funcionaron"],
  },
  {
    giro: "florería",
    nombreOptions: ["Florería La Rosa", "Flores del Cielo", "Detalles Florales Puebla", "Arreglos Bellos"],
    personalidadFacil: "Diana, 28 años, florería con enfoque en eventos. Creativa, quiere destacar visualmente.",
    personalidadDificil: "Doña Carmen, 55 años, florería tradicional. Trabaja sola, considera que las redes son 'para jóvenes'.",
    objecionesFacil: ["¿Cómo se ven las fotos de mis arreglos?", "¿Puedo poner mis paquetes de bodas?", "¿Cuánto tarda?"],
    objecionesDificil: ["Yo vendo por lo que la gente ve al pasar", "¿Cuánto me va a estar costando cada mes?", "Ni tengo tiempo de contestar el teléfono"],
  },
  {
    giro: "gimnasio",
    nombreOptions: ["Gym Poder Puebla", "FitZone", "Iron Body Gym", "Vida Fitness"],
    personalidadFacil: "César, 35 años, dueño de gym boutique. Ya usa Instagram activamente, valora las conversiones.",
    personalidadDificil: "Roberto, 45 años, dueño de gym mediano con maquinaria vieja. Escéptico, ROI-obsesionado.",
    objecionesFacil: ["¿Puedo integrar mis planes de membresía?", "¿Se ve bien la parte visual?", "¿Puedo mostrar transformaciones?"],
    objecionesDificil: ["Ya intenté con otras agencias", "¿Cuántos clientes te ha traído esto a otros gyms?", "El equipamiento vende, no la página"],
  },
  {
    giro: "cafetería",
    nombreOptions: ["Café del Portal", "Aroma Café Puebla", "El Grano Feliz", "Cafetería La Terraza"],
    personalidadFacil: "Sofía, 26 años, café pequeño en zona universitaria. Instagrameable, moderna.",
    personalidadDificil: "Don Emilio, 60 años, cafetería tradicional del centro histórico. Considera que 'sus clientes son fieles' y no necesita nada más.",
    objecionesFacil: ["¿Puedo mostrar el menú?", "¿Cuántas fotos aguanta?", "¿Se ve bien en celular?"],
    objecionesDificil: ["He estado 30 años sin página", "Los turistas ya me encuentran solos", "No estoy dispuesto a pagar mensualidad"],
  },
  {
    giro: "papelería",
    nombreOptions: ["Papelería El Lápiz Feliz", "Papel y Más", "Papelería Escolar Puebla", "El Universo del Papel"],
    personalidadFacil: "Karla, 32 años, dueña de papelería frente a primaria. Práctica, ocupada, receptiva si le ahorras tiempo.",
    personalidadDificil: "Don Federico, 55 años, papelería con 30 años. Habla mucho, escuchar cuesta.",
    objecionesFacil: ["¿Puedo poner listas de útiles?", "¿Reciben pedidos así?", "Estoy ocupada, dime rápido"],
    objecionesDificil: ["Todos los años entran mamás nuevas, no necesito web", "La escuela ya me manda los pedidos", "¿Cuánto es lo mínimo?"],
  },
  {
    giro: "restaurante",
    nombreOptions: ["Restaurante Mi Poblano", "Sazón de la Abuela", "Cocina Puebla", "El Rincón Angelopolitano"],
    personalidadFacil: "Marisol, 38 años, restaurante mediano con menú regional. Ya usa reservaciones por WhatsApp, quiere sistematizar.",
    personalidadDificil: "Chef Antonio, 50 años, restaurante fine dining. Perfeccionista, muy protector de su imagen.",
    objecionesFacil: ["¿Puedo poner mi menú del día?", "¿Los platillos se ven apetitosos?", "¿Puedo integrar reservas?"],
    objecionesDificil: ["Mi marca no se puede ver 'genérica'", "¿Quién va a fotografiar los platillos?", "¿Me la va a hacer un profesional o un principiante?"],
  },
  {
    giro: "tienda de abarrotes",
    nombreOptions: ["Abarrotes Doña Chelo", "Tienda La Esperanza", "Miscelánea El Ahorro", "Súper de la Colonia"],
    personalidadFacil: "Doña Rosa, 50 años, tiendita de esquina con clientela fija del barrio. Amable, curiosa.",
    personalidadDificil: "Don Pancho, 65 años, tiendita 24/7. Cortante, dice 'no' antes de escuchar.",
    objecionesFacil: ["¿Para qué me sirve?", "¿Puedo poner mis promociones?", "¿Cuánto es?"],
    objecionesDificil: ["Nadie compra abarrotes por internet", "Aquí me conocen todos los del barrio", "No, gracias"],
  },
  {
    giro: "estética",
    nombreOptions: ["Bella Estética Angelópolis", "Salón Divas", "Estética Chic", "Belleza Total"],
    personalidadFacil: "Maribel, 27 años, dueña de estética moderna con enfoque en novias y XV años. Activa en TikTok, quiere web para bookings.",
    personalidadDificil: "Doña Silvia, 48 años, estética con 15 años, clientela mayor. Desconfía de lo digital y cree que perdería a sus fieles.",
    objecionesFacil: ["¿Se ven bien mis servicios en fotos?", "¿Puedo poner precios?", "¿Cuánto tarda?"],
    objecionesDificil: ["Mis clientas prefieren llamar por teléfono", "¿Y si me copian las promos?", "Nunca he pagado por publicidad"],
  },
  {
    giro: "carnicería",
    nombreOptions: ["Carnicería La Bendición", "Res y Cerdo El Puerco Feliz", "Carnicería San Judas", "El Novillo"],
    personalidadFacil: "Don Jorge, 42 años, carnicería familiar con corte especial. Cálido, orgulloso de su trabajo.",
    personalidadDificil: "Doña Angélica, 55 años, carnicería con 3 sucursales. Ocupada, trata al vendedor como interrupción.",
    objecionesFacil: ["¿Puedo poner los cortes del día?", "Mis clientes no usan internet mucho", "¿Cuánto tarda?"],
    objecionesDificil: ["¿Tú sabes cuánto vendo al día? No necesito esto", "Ya me han vendido páginas y nadie las visitó", "Estoy ocupada, dime en 30 segundos"],
  },
  {
    giro: "lavandería",
    nombreOptions: ["Lavandería El Chorro Feliz", "Lavamatik Puebla", "Ropa Limpia", "Lavandería Express"],
    personalidadFacil: "Elena, 33 años, lavandería con servicio a domicilio. Práctica, quiere sistematizar pedidos.",
    personalidadDificil: "Don Rafa, 60 años, lavandería de barrio. Perezoso para tecnología, considera que 'las máquinas hablan solas'.",
    objecionesFacil: ["¿Puedo integrar pedidos a domicilio?", "¿Se ve bien en celular?", "¿Cuándo empezamos?"],
    objecionesDificil: ["Ya tengo mi rutina de siempre", "No tengo tiempo para aprender", "¿Y si se descompone el sitio?"],
  },
  {
    giro: "guardería",
    nombreOptions: ["Guardería Pequeños Genios", "Kinder Feliz", "Guardería Sol y Luna", "Mi Segundo Hogar"],
    personalidadFacil: "Maestra Rocío, 40 años, directora de guardería mediana. Amable, entiende que los papás buscan por internet.",
    personalidadDificil: "Sra. Patricia, 52 años, guardería con 20 años, referencia por recomendación. Estricta, cero riesgo con imagen.",
    objecionesFacil: ["¿Puedo poner fotos con permiso?", "¿Cuánto tarda?", "¿Puedo integrar registro?"],
    objecionesDificil: ["Los papás llegan por recomendación, no por Google", "Cualquier foto de niños es un riesgo legal", "¿Qué garantías me das?"],
  },
  {
    giro: "consultorio de nutrición",
    nombreOptions: ["Nutrición Consciente", "Vida Sana Puebla", "NutriBalance", "Consultorio Nutrición Ramírez"],
    personalidadFacil: "Lic. Karla, 29 años, nutrióloga con enfoque holístico. Ya usa Instagram, quiere web para agendar.",
    personalidadDificil: "Dr. Salazar, 45 años, nutriólogo formal con maestría. Serio, académico, escéptico de vendedores jóvenes.",
    objecionesFacil: ["¿Puedo integrar mi calendario?", "¿Cuánto SEO trae?", "¿Puedo mostrar mis testimonios?"],
    objecionesDificil: ["Mi área es científica, no popular", "¿Qué currículum tienes?", "Ya intenté con otras agencias y no funcionaron"],
  },
  {
    giro: "estudio de yoga",
    nombreOptions: ["Yoga Namaste", "Estudio Zen Puebla", "Prana Yoga", "Om Studio"],
    personalidadFacil: "Alma, 34 años, dueña de estudio pequeño. Zen, receptiva, valora la estética.",
    personalidadDificil: "Miguel, 40 años, estudio con instructor invitado. Le vale la estética, solo quiere resultados numéricos.",
    objecionesFacil: ["¿Se ve estético?", "¿Puedo integrar horarios?", "¿Puedo poner precios de paquetes?"],
    objecionesDificil: ["¿Cuánto ROI me das?", "Muchas agencias hablan bonito, ninguna cumple", "No quiero pagar mensualidades eternas"],
  },
  {
    giro: "escuela de idiomas",
    nombreOptions: ["Inglés Fácil", "Centro de Idiomas Angelópolis", "SpeakUp Puebla", "Idiomas Global"],
    personalidadFacil: "Prof. Ana, 30 años, dueña de escuelita de inglés. Ordenada, quiere web para inscripciones.",
    personalidadDificil: "Mr. Roberts, 55 años, americano radicado en Puebla con escuela de 20 años. Directo, valora eficiencia sobre todo.",
    objecionesFacil: ["¿Puedo integrar el pago de mensualidades?", "¿Cuánto tarda?", "¿Los alumnos pueden dejar reseñas?"],
    objecionesDificil: ["Prove to me it will work — show me numbers", "I've hired 3 web guys before", "Not paying monthly forever"],
  },
  {
    giro: "reparación de celulares",
    nombreOptions: ["iFix Puebla", "Cel Doctor", "Reparación TecnoMax", "Fix My Phone"],
    personalidadFacil: "Iván, 26 años, taller pequeño en plaza comercial. Joven, tech-savvy, entiende el valor.",
    personalidadDificil: "Don Pedro, 50 años, taller de barrio de toda la vida. Cero interés en 'chunches' nuevas.",
    objecionesFacil: ["¿Puedo poner precios por modelo?", "¿Cuánto tarda?", "¿Puedo mostrar reparaciones que hice?"],
    objecionesDificil: ["Mi clientela llega sola", "¿Y si me copian los precios?", "Cero mensualidades"],
  },
  {
    giro: "florista para eventos",
    nombreOptions: ["Flores para tu Boda", "Detalles Florales Elegant", "Bouquet Studio", "Arte Floral Eventos"],
    personalidadFacil: "Renata, 32 años, floreria enfocada en bodas y XV. Creativa, sabe vender lujo.",
    personalidadDificil: "Doña Carmelita, 60 años, arreglos por encargo. Cansada de vendedores, dice 'después' a todo.",
    objecionesFacil: ["¿Puedo mostrar mi portafolio?", "¿Cuánto tarda?", "¿Se ve elegante?"],
    objecionesDificil: ["Después te contesto", "¿Cuánto?", "Ya me llamaron otros como tú"],
  },
];

export const NOMBRES_PREFIJOS = [
  "Doña", "Don", "La", "El", "Los", "Las"
];
