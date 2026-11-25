import type { Ejercicio } from '@/domain/tipos';

/** Catálogo precargado según la clasificación del documento del Proyecto 3. */
export const CATALOGO_SEMILLA: Ejercicio[] = [
  // Tren superior: pecho
  { id: 'ej-press-banca', nombre: 'Press de banca', tipo: 'TREN_SUPERIOR', grupo: 'PECHO', equipo: 'Barra y banco', medicion: 'REPETICIONES',
    descripcion: 'Escápulas juntas y apoyadas en el banco. Bajá la barra controlada hasta rozar el pecho a la altura del esternón y empujá exhalando, sin despegar la cola del banco.' },
  { id: 'ej-aperturas', nombre: 'Aperturas con mancuernas', tipo: 'TREN_SUPERIOR', grupo: 'PECHO', equipo: 'Mancuernas', medicion: 'REPETICIONES',
    descripcion: 'Codos levemente flexionados y fijos durante todo el recorrido. Abrí hasta sentir el estiramiento del pecho, sin bajar los codos por debajo del banco.' },
  { id: 'ej-flexiones', nombre: 'Flexiones de brazos', tipo: 'TREN_SUPERIOR', grupo: 'PECHO', medicion: 'REPETICIONES',
    descripcion: 'Cuerpo en línea recta de cabeza a talones. Codos a unos 45° del torso. Bajá hasta que el pecho quede a un puño del piso.' },
  // Tren superior: espalda
  { id: 'ej-dominadas', nombre: 'Dominadas', tipo: 'TREN_SUPERIOR', grupo: 'ESPALDA', equipo: 'Barra fija', medicion: 'REPETICIONES',
    descripcion: 'Agarre prono un poco más ancho que los hombros. Iniciá llevando las escápulas hacia abajo y subí hasta pasar el mentón por encima de la barra.' },
  { id: 'ej-jalon', nombre: 'Jalón al pecho', tipo: 'TREN_SUPERIOR', grupo: 'ESPALDA', equipo: 'Polea alta', medicion: 'REPETICIONES',
    descripcion: 'Torso apenas inclinado hacia atrás. Llevá la barra a la parte alta del pecho tirando con los codos, no con las manos.' },
  { id: 'ej-remo-barra', nombre: 'Remo con barra', tipo: 'TREN_SUPERIOR', grupo: 'ESPALDA', equipo: 'Barra', medicion: 'REPETICIONES',
    descripcion: 'Bisagra de cadera con la espalda neutra y rodillas semiflexionadas. Llevá la barra al ombligo y apretá las escápulas arriba.' },
  { id: 'ej-remo-mancuerna', nombre: 'Remo con mancuerna', tipo: 'TREN_SUPERIOR', grupo: 'ESPALDA', equipo: 'Mancuerna y banco', medicion: 'REPETICIONES',
    descripcion: 'Rodilla y mano del mismo lado apoyadas en el banco. Tirá la mancuerna hacia la cadera sin rotar el torso.' },
  // Tren superior: hombros
  { id: 'ej-press-militar', nombre: 'Press militar', tipo: 'TREN_SUPERIOR', grupo: 'HOMBROS', equipo: 'Barra', medicion: 'REPETICIONES',
    descripcion: 'De pie, glúteos y abdomen firmes. Empujá la barra en línea recta por encima de la cabeza, metiendo la cabeza "por la ventana" al final.' },
  { id: 'ej-elevaciones', nombre: 'Elevaciones laterales', tipo: 'TREN_SUPERIOR', grupo: 'HOMBROS', equipo: 'Mancuernas', medicion: 'REPETICIONES',
    descripcion: 'Subí los brazos hasta la altura de los hombros, guiando con los codos. Sin balanceo del torso.' },
  { id: 'ej-vuelos', nombre: 'Vuelos posteriores', tipo: 'TREN_SUPERIOR', grupo: 'HOMBROS', equipo: 'Mancuernas', medicion: 'REPETICIONES',
    descripcion: 'Torso inclinado casi paralelo al piso. Abrí los brazos hacia los costados apretando la parte posterior del hombro.' },
  // Tren superior: brazos
  { id: 'ej-curl', nombre: 'Curl de bíceps', tipo: 'TREN_SUPERIOR', grupo: 'BRAZOS', equipo: 'Mancuernas', medicion: 'REPETICIONES',
    descripcion: 'Codos pegados al cuerpo y quietos. Subí rotando la muñeca y bajá en dos tiempos.' },
  { id: 'ej-fondos', nombre: 'Fondos en paralelas', tipo: 'TREN_SUPERIOR', grupo: 'BRAZOS', equipo: 'Paralelas', medicion: 'REPETICIONES',
    descripcion: 'Torso erguido para enfocar el tríceps. Bajá hasta que el codo forme 90° y empujá sin bloquear de golpe.' },
  { id: 'ej-ext-triceps', nombre: 'Extensión de tríceps en polea', tipo: 'TREN_SUPERIOR', grupo: 'BRAZOS', equipo: 'Polea', medicion: 'REPETICIONES',
    descripcion: 'Codos fijos al costado del cuerpo. Extendé por completo y volvé controlando hasta los 90°.' },

  // Tren inferior: cuádriceps
  { id: 'ej-sentadilla', nombre: 'Sentadilla', tipo: 'TREN_INFERIOR', grupo: 'CUADRICEPS', equipo: 'Barra', medicion: 'REPETICIONES',
    descripcion: 'Espalda recta y pecho arriba. Rodillas en la dirección de las puntas de los pies. Bajá hasta que la cadera quede a la altura de las rodillas.' },
  { id: 'ej-prensa', nombre: 'Prensa de piernas', tipo: 'TREN_INFERIOR', grupo: 'CUADRICEPS', equipo: 'Prensa', medicion: 'REPETICIONES',
    descripcion: 'Zona lumbar siempre apoyada en el respaldo. No bloquees las rodillas al extender.' },
  { id: 'ej-sillon', nombre: 'Sillón de cuádriceps', tipo: 'TREN_INFERIOR', grupo: 'CUADRICEPS', equipo: 'Máquina', medicion: 'REPETICIONES',
    descripcion: 'Rodilla alineada con el eje de la máquina. Pausa de un segundo arriba.' },
  // Tren inferior: glúteos e isquiotibiales
  { id: 'ej-peso-muerto-rumano', nombre: 'Peso muerto rumano', tipo: 'TREN_INFERIOR', grupo: 'GLUTEOS_ISQUIOS', equipo: 'Barra', medicion: 'REPETICIONES',
    descripcion: 'Rodillas apenas flexionadas. Llevá la cadera hacia atrás con la barra pegada a las piernas hasta sentir el estiramiento del isquio.' },
  { id: 'ej-hip-thrust', nombre: 'Hip thrust', tipo: 'TREN_INFERIOR', grupo: 'GLUTEOS_ISQUIOS', equipo: 'Barra y banco', medicion: 'REPETICIONES',
    descripcion: 'Escápulas apoyadas en el banco, mentón al pecho. Empujá con los talones y apretá glúteos arriba sin arquear la zona lumbar.' },
  { id: 'ej-camilla', nombre: 'Camilla de femorales', tipo: 'TREN_INFERIOR', grupo: 'GLUTEOS_ISQUIOS', equipo: 'Máquina', medicion: 'REPETICIONES',
    descripcion: 'Cadera pegada a la camilla. Flexioná llevando los talones a la cola y bajá lento.' },
  // Tren inferior: pantorrillas
  { id: 'ej-talones-parado', nombre: 'Elevación de talones parado', tipo: 'TREN_INFERIOR', grupo: 'PANTORRILLAS', equipo: 'Step', medicion: 'REPETICIONES',
    descripcion: 'Bajá el talón por debajo del step para estirar y subí lo más alto posible. Pausa arriba.' },
  { id: 'ej-talones-sentado', nombre: 'Elevación de talones sentado', tipo: 'TREN_INFERIOR', grupo: 'PANTORRILLAS', equipo: 'Máquina', medicion: 'REPETICIONES',
    descripcion: 'Rodillas a 90°. Recorrido completo, sin rebotar abajo.' },

  // Zona media
  { id: 'ej-crunch', nombre: 'Crunch abdominal', tipo: 'ZONA_MEDIA', grupo: 'ABDOMEN', medicion: 'REPETICIONES',
    descripcion: 'Zona lumbar apoyada. Despegá solo los omóplatos exhalando; las manos no tiran del cuello.' },
  { id: 'ej-plancha-frontal', nombre: 'Plancha frontal', tipo: 'ZONA_MEDIA', grupo: 'ABDOMEN', medicion: 'TIEMPO',
    descripcion: 'Antebrazos bajo los hombros, cuerpo en línea. Apretá glúteos y abdomen; no dejes caer la cadera.' },
  { id: 'ej-rueda', nombre: 'Rueda abdominal', tipo: 'ZONA_MEDIA', grupo: 'ABDOMEN', equipo: 'Rueda', medicion: 'REPETICIONES',
    descripcion: 'Desde rodillas, avanzá solo hasta donde puedas mantener la zona lumbar neutra.' },
  { id: 'ej-plancha-lateral', nombre: 'Plancha lateral', tipo: 'ZONA_MEDIA', grupo: 'OBLICUOS', medicion: 'TIEMPO',
    descripcion: 'Codo bajo el hombro, cadera alta y alineada. Repetí del otro lado.' },
  { id: 'ej-giros-rusos', nombre: 'Giros rusos', tipo: 'ZONA_MEDIA', grupo: 'OBLICUOS', medicion: 'REPETICIONES',
    descripcion: 'Torso inclinado atrás con la espalda recta. Rotá desde el torso, no solo con los brazos.' },
  { id: 'ej-lenador', nombre: 'Leñador en polea', tipo: 'ZONA_MEDIA', grupo: 'OBLICUOS', equipo: 'Polea', medicion: 'REPETICIONES',
    descripcion: 'Brazos casi extendidos. Rotá el torso en diagonal pivoteando el pie de atrás.' },
  { id: 'ej-hiperextensiones', nombre: 'Hiperextensiones', tipo: 'ZONA_MEDIA', grupo: 'LUMBAR', equipo: 'Banco romano', medicion: 'REPETICIONES',
    descripcion: 'Subí hasta alinear el torso con las piernas, sin hiperextender la espalda.' },
  { id: 'ej-superman', nombre: 'Superman', tipo: 'ZONA_MEDIA', grupo: 'LUMBAR', medicion: 'TIEMPO',
    descripcion: 'Boca abajo, elevá brazos y piernas a la vez manteniendo el cuello neutro.' },

  // Cardio
  { id: 'ej-cinta', nombre: 'Cinta de correr', tipo: 'CARDIO', grupo: 'CUERPO_COMPLETO', equipo: 'Cinta', medicion: 'TIEMPO',
    descripcion: 'Ritmo en el que puedas hablar con frases cortas. Pisada suave, sin agarrarte de la baranda.' },
  { id: 'ej-soga', nombre: 'Saltos a la soga', tipo: 'CARDIO', grupo: 'CUERPO_COMPLETO', equipo: 'Soga', medicion: 'TIEMPO',
    descripcion: 'Saltos bajos sobre la punta de los pies, el giro sale de las muñecas.' },
  { id: 'ej-remoergometro', nombre: 'Remoergómetro', tipo: 'CARDIO', grupo: 'CUERPO_COMPLETO', equipo: 'Remo', medicion: 'TIEMPO',
    descripcion: 'Secuencia piernas, torso, brazos al tirar; al revés al volver.' },
  { id: 'ej-burpees', nombre: 'Burpees', tipo: 'CARDIO', grupo: 'CUERPO_COMPLETO', medicion: 'REPETICIONES',
    descripcion: 'Bajada a plancha, flexión opcional, salto con extensión completa.' },
  { id: 'ej-bici', nombre: 'Bicicleta fija', tipo: 'CARDIO', grupo: 'PREDOMINIO_INFERIOR', equipo: 'Bicicleta', medicion: 'TIEMPO',
    descripcion: 'Asiento a la altura de la cadera; rodilla casi extendida abajo.' },
  { id: 'ej-escalador', nombre: 'Escalador', tipo: 'CARDIO', grupo: 'PREDOMINIO_INFERIOR', equipo: 'Stairmaster', medicion: 'TIEMPO',
    descripcion: 'Torso erguido, apoyá el pie completo en cada escalón. Evitá colgarte de las barandas.' },
];
