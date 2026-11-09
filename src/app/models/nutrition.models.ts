export interface NutrienteItem {
  nombre: string;
  unidad: string;
  descripcion: string;
}

export type NutrientesEstructura = Record<
  string,
  | NutrienteItem[]
  | Record<
      string,
      | NutrienteItem[]
      | Record<string, NutrienteItem[]>
    >
>;

export interface NutrientePlano extends NutrienteItem {
  niveles: string[];
}

export interface Alimento {
  nombre: string;
  categoria: string;
  composicion: Record<string, number>;
  unidad?: string;
  esManual?: boolean;
  displayManual?: string;
}

export interface AlimentoAgregado {
  alimento: Alimento;
  peso: number;
}

export type TotalesNutricionales = Record<string, number | null>;

export type DistribucionVDR = Record<string, number>;

export type VDRMap = Record<string, number>;

export interface UsuarioPerfil {
  nombre: string;
  nombreVisual: string;
  emoji?: string;
  fechaNacimiento?: string;
  edad?: number | null;
  peso?: number | null;
  altura?: number | null;
  fantasma?: boolean;
  vdr: VDRMap;
  distribucionVDR: DistribucionVDR;
  distribucionTemp?: DistribucionVDR;
}

export const COMIDAS = ['Desayuno', 'Almuerzo', 'Merienda', 'Cena'] as const;
export type TipoComida = (typeof COMIDAS)[number];

export const CATEGORIAS_ALIMENTOS = [
  'Frutas',
  'Verduras',
  'Cereales',
  'Lácteos',
  'Carnes',
  'Huevos',
];

export const COLORES_VDR = {
  verde: '#2e7d32',
  amarillo: '#f9a825',
  rojo: '#FF0000',
};

export const VDR_DEFAULT: VDRMap = {
  Agua: 2000,
  'Sólidos totales': 3000,
  Energía: 2000,
  Proteínas: 50,
  Carbohidratos: 300,
  'Grasas totales': 70,
};

export const DISTRIBUCION_VDR_DEFAULT: DistribucionVDR = {
  Desayuno: 25,
  Almuerzo: 25,
  Merienda: 25,
  Cena: 25,
  Total: 100,
};

export const NUTRIENTES: NutrientesEstructura = {
  'Peso Total': [
    {
      nombre: 'Agua',
      unidad: 'g',
      descripcion:
        'Componente principal del alimento; esencial para funciones celulares, transporte de nutrientes y regulación de la temperatura corporal. No aporta energía (0 kcal/g).',
    },
    {
      nombre: 'Sólidos totales',
      unidad: 'g',
      descripcion:
        'Parte seca del alimento que incluye carbohidratos, proteínas, grasas y minerales; representa la materia nutritiva disponible. Su aporte energético depende de los componentes individuales.',
    },
  ],

  Macronutrientes: {
    Principales: [
      {
        nombre: 'Energía',
        unidad: 'kcal',
        descripcion:
          'Cantidad total de energía que el cuerpo puede obtener del alimento; proviene de proteínas (4 kcal/g), carbohidratos (4 kcal/g), grasas (9 kcal/g) y alcohol (7 kcal/g).',
      },
      {
        nombre: 'Proteínas',
        unidad: 'g',
        descripcion:
          'Macronutriente formado por aminoácidos; esencial para la formación y reparación de tejidos, enzimas y hormonas. Aporta 4 kcal por gramo.',
      },
      {
        nombre: 'Carbohidratos',
        unidad: 'g',
        descripcion:
          'Incluye azúcares, almidón y fibras; los azúcares y el almidón aportan energía (4 kcal/g), mientras que las fibras promueven la salud digestiva.',
      },
      {
        nombre: 'Grasas totales',
        unidad: 'g',
        descripcion:
          'Lípidos que aportan energía concentrada (9 kcal/g); participan en la absorción de vitaminas liposolubles y en la formación de membranas celulares.',
      },
      {
        nombre: 'Alcohol etílico',
        unidad: 'g',
        descripcion:
          'Fuente de energía no esencial (7 kcal/g); se metaboliza en el hígado y aporta calorías sin proporcionar nutrientes esenciales.',
      },
      {
        nombre: 'Cafeína',
        unidad: 'mg',
        descripcion:
          'Estimulante del sistema nervioso central; aumenta alerta y reduce la fatiga.',
      },
      {
        nombre: 'Cenizas',
        unidad: 'g',
        descripcion:
          'Residuo mineral total tras la combustión del alimento; refleja la cantidad total de minerales presentes.',
      },
    ],

    'Componentes de proteínas': {
      'Aminoácidos esenciales': [
        {
          nombre: 'Histidina',
          unidad: 'mg',
          descripcion:
            'Aminoácido esencial necesario para el crecimiento, reparación de tejidos y función inmune.',
        },
        {
          nombre: 'Isoleucina',
          unidad: 'mg',
          descripcion:
            'Aminoácido que contribuye a la recuperación muscular y equilibrio energético.',
        },
        {
          nombre: 'Leucina',
          unidad: 'mg',
          descripcion:
            'Estimula la síntesis de proteínas musculares y favorece la regeneración de tejidos.',
        },
        {
          nombre: 'Lisina',
          unidad: 'mg',
          descripcion:
            'Fundamental para el crecimiento, formación de colágeno y absorción de calcio.',
        },
        {
          nombre: 'Metionina',
          unidad: 'mg',
          descripcion:
            'Aminoácido esencial que apoya el metabolismo y la desintoxicación hepática.',
        },
        {
          nombre: 'Fenilalanina',
          unidad: 'mg',
          descripcion:
            'Precursora de dopamina y adrenalina; importante para la función cerebral y el estado de ánimo.',
        },
        {
          nombre: 'Treonina',
          unidad: 'mg',
          descripcion:
            'Contribuye a la salud del hígado, el sistema inmune y el metabolismo proteico.',
        },
        {
          nombre: 'Triptófano',
          unidad: 'mg',
          descripcion:
            'Precursora de serotonina y melatonina; apoya el sueño y el bienestar general.',
        },
        {
          nombre: 'Valina',
          unidad: 'mg',
          descripcion:
            'Favorece la energía, recuperación y regeneración muscular.',
        },
      ],

      'Aminoácidos condicionalmente esenciales': [
        {
          nombre: 'Cisteína',
          unidad: 'mg',
          descripcion:
            'Aminoácido con función antioxidante y componente de queratina; importante para cabello, piel y uñas.',
        },
        {
          nombre: 'Tirosina',
          unidad: 'mg',
          descripcion:
            'Precursora de dopamina y hormonas tiroideas; importante para el sistema nervioso y el metabolismo hormonal.',
        },
        {
          nombre: 'Arginina',
          unidad: 'mg',
          descripcion:
            'Aminoácido condicionalmente esencial; mejora la circulación, función inmune y síntesis de proteínas. Es esencial en niños cuando el cuerpo no produce suficiente cantidad.',
        },
        {
          nombre: 'Glutamina',
          unidad: 'mg',
          descripcion:
            'Apoya la función inmune e intestinal; su requerimiento aumenta en estrés o enfermedad.',
        },
        {
          nombre: 'Prolina',
          unidad: 'mg',
          descripcion:
            'Importante para la síntesis de colágeno y la salud de tejidos conectivos.',
        },
        {
          nombre: 'Glicina',
          unidad: 'mg',
          descripcion:
            'Participa en la síntesis de colágeno y neurotransmisores; contribuye a funciones celulares y antioxidantes.',
        },
      ],
    },

    'Componentes de carbohidratos': [
      {
        nombre: 'Azúcares totales',
        unidad: 'g',
        descripcion:
          'Carbohidratos simples presentes de forma natural o añadida que aportan energía rápida.',
      },
      {
        nombre: 'Fibra insoluble',
        unidad: 'g',
        descripcion:
          'Carbohidrato insoluble que no aporta energía; mejora el tránsito intestinal y previene estreñimiento.',
      },
      {
        nombre: 'Fibra soluble',
        unidad: 'g',
        descripcion:
          'Carbohidrato soluble no digerible; ayuda a regular colesterol y glucosa en sangre. Aporta energía limitada (~2 kcal/g).',
      },
      {
        nombre: 'Almidón',
        unidad: 'g',
        descripcion:
          'Carbohidrato complejo que libera glucosa lentamente, proporcionando energía sostenida.',
      },
    ],

    'Componentes de grasas': [
      {
        nombre: 'Grasas monoinsaturadas',
        unidad: 'g',
        descripcion:
          'Grasas saludables presentes en aceite de oliva, frutos secos y palta; favorecen la salud cardiovascular.',
      },
      {
        nombre: 'Grasas poliinsaturadas',
        unidad: 'g',
        descripcion:
          'Incluyen ácidos grasos esenciales omega-3 y omega-6; participan en funciones antiinflamatorias y hormonales.',
      },
      {
        nombre: 'Grasas saturadas',
        unidad: 'g',
        descripcion:
          'Lípidos sólidos a temperatura ambiente; su consumo excesivo puede aumentar el riesgo cardiovascular.',
      },
      {
        nombre: 'Grasas trans',
        unidad: 'g',
        descripcion:
          'Grasas artificiales que aumentan el riesgo cardiovascular; deben evitarse.',
      },
      {
        nombre: 'Colesterol',
        unidad: 'mg',
        descripcion:
          'Lípido de origen animal necesario en pequeñas cantidades para hormonas y membranas celulares.',
      },
      {
        nombre: 'Ácido linoleico (Omega 6)',
        unidad: 'g',
        descripcion:
          'Grasa esencial que participa en procesos inflamatorios, hormonales y celulares.',
      },
      {
        nombre: 'Ácido alfa-linolénico (Omega 3)',
        unidad: 'g',
        descripcion:
          'Grasa esencial con funciones antiinflamatorias y protectoras del corazón.',
      },
      {
        nombre: 'EPA (ácido eicosapentaenoico)',
        unidad: 'g',
        descripcion:
          'Omega-3 marino que protege el corazón, reduce inflamación y apoya la función cerebral.',
      },
      {
        nombre: 'DHA (ácido docosahexaenoico)',
        unidad: 'g',
        descripcion:
          'Omega-3 esencial para el desarrollo cerebral, la visión y la salud cardiovascular.',
      },
    ],
  },

  Micronutrientes: {
    'Vitaminas liposolubles': [
      {
        nombre: 'Vitamina A',
        unidad: 'µg',
        descripcion:
          'Esencial para visión, crecimiento celular, piel y función inmune; se almacena en hígado y tejidos grasos.',
      },
      {
        nombre: 'Vitamina D',
        unidad: 'µg',
        descripcion:
          'Regula absorción de calcio y fósforo; importante para huesos, dientes y función inmune. Su síntesis depende de la exposición solar.',
      },
      {
        nombre: 'Vitamina E',
        unidad: 'mg',
        descripcion:
          'Antioxidante que protege membranas celulares y tejidos del daño oxidativo.',
      },
      {
        nombre: 'Vitamina K',
        unidad: 'µg',
        descripcion:
          'Necesaria para coagulación sanguínea y metabolismo óseo.',
      },
    ],

    'Vitaminas hidrosolubles': [
      {
        nombre: 'Vitamina C',
        unidad: 'mg',
        descripcion:
          'Antioxidante que fortalece el sistema inmune, ayuda a formar colágeno y mejora la absorción de hierro.',
      },
      {
        nombre: 'Tiamina (B1)',
        unidad: 'mg',
        descripcion:
          'Participa en el metabolismo energético y el funcionamiento nervioso.',
      },
      {
        nombre: 'Riboflavina (B2)',
        unidad: 'mg',
        descripcion:
          'Apoya el metabolismo de carbohidratos, grasas y proteínas; mantiene piel y ojos saludables.',
      },
      {
        nombre: 'Niacina (B3)',
        unidad: 'mg',
        descripcion:
          'Interviene en el metabolismo energético y la síntesis de ácidos grasos.',
      },
      {
        nombre: 'Ácido pantoténico (B5)',
        unidad: 'mg',
        descripcion:
          'Participa en la producción de energía y síntesis de hormonas y colesterol.',
      },
      {
        nombre: 'Piridoxina (B6)',
        unidad: 'mg',
        descripcion:
          'Participa en el metabolismo de aminoácidos y la síntesis de neurotransmisores.',
      },
      {
        nombre: 'Biotina (B7)',
        unidad: 'µg',
        descripcion:
          'Coenzima que apoya el metabolismo de macronutrientes y la salud de cabello, piel y uñas.',
      },
      {
        nombre: 'Ácido fólico (B9)',
        unidad: 'µg',
        descripcion:
          'Esencial para la formación de ADN y desarrollo fetal. Su requerimiento aumenta en embarazo.',
      },
      {
        nombre: 'Cobalamina (B12)',
        unidad: 'µg',
        descripcion:
          'Necesaria para la formación de glóbulos rojos, función neurológica y síntesis de ADN.',
      },
      {
        nombre: 'Colina',
        unidad: 'mg',
        descripcion:
          'Importante para el cerebro, memoria y metabolismo de grasas. Su deficiencia afecta desarrollo fetal.',
      },
    ],

    Minerales: {
      Macrominerales: [
        {
          nombre: 'Calcio (Ca)',
          unidad: 'mg',
          descripcion:
            'Fortalece huesos y dientes; participa en contracción muscular y función nerviosa.',
        },
        {
          nombre: 'Fósforo (P)',
          unidad: 'mg',
          descripcion:
            'Trabaja con el calcio en huesos y dientes; importante para energía y ADN.',
        },
        {
          nombre: 'Magnesio (Mg)',
          unidad: 'mg',
          descripcion:
            'Regula función muscular y nerviosa, producción de energía y síntesis de proteínas.',
        },
        {
          nombre: 'Sodio (Na)',
          unidad: 'mg',
          descripcion:
            'Equilibra líquidos y presión arterial. El exceso aumenta el riesgo de hipertensión.',
        },
        {
          nombre: 'Potasio (K)',
          unidad: 'mg',
          descripcion:
            'Regula función muscular y presión arterial; mantiene el equilibrio de líquidos.',
        },
        {
          nombre: 'Cloro (Cl)',
          unidad: 'mg',
          descripcion:
            'Ayuda en digestión y equilibrio de fluidos; componente del ácido gástrico.',
        },
        {
          nombre: 'Azufre (S)',
          unidad: 'mg',
          descripcion:
            'Componente de aminoácidos y vitaminas; importante para el metabolismo y los tejidos.',
        },
      ],
      Oligoelementos: [
        {
          nombre: 'Hierro (Fe)',
          unidad: 'mg',
          descripcion:
            'Transporta oxígeno y apoya la función inmune. Su deficiencia es común en mujeres y niños.',
        },
        {
          nombre: 'Zinc (Zn)',
          unidad: 'mg',
          descripcion:
            'Participa en función inmune, cicatrización y síntesis de proteínas.',
        },
        {
          nombre: 'Cobre (Cu)',
          unidad: 'mg',
          descripcion:
            'Interviene en formación de glóbulos rojos, metabolismo y función antioxidante.',
        },
        {
          nombre: 'Manganeso (Mn)',
          unidad: 'mg',
          descripcion:
            'Ayuda al metabolismo de carbohidratos y proteínas; contribuye al crecimiento óseo.',
        },
        {
          nombre: 'Selenio (Se)',
          unidad: 'µg',
          descripcion:
            'Antioxidante que protege células y apoya la función tiroidea.',
        },
        {
          nombre: 'Yodo (I)',
          unidad: 'µg',
          descripcion:
            'Esencial para la síntesis de hormonas tiroideas y el metabolismo energético.',
        },
        {
          nombre: 'Molibdeno (Mo)',
          unidad: 'µg',
          descripcion:
            'Cofactor enzimático que participa en el metabolismo de aminoácidos.',
        },
        {
          nombre: 'Cromo (Cr)',
          unidad: 'µg',
          descripcion:
            'Contribuye al metabolismo de glucosa y al control del azúcar en sangre.',
        },
        {
          nombre: 'Flúor (F)',
          unidad: 'mg',
          descripcion:
            'Fortalece dientes y huesos; previene caries y mantiene estructura ósea.',
        },
      ],
    },
  },
};

export const ALIMENTOS_BASE: Alimento[] = [
  {
    nombre: 'Huevo entero crudo',
    categoria: 'Huevos',
    composicion: {
      Agua: 75.3,
      'Sólidos totales': 24.7,
      Energía: 143,
      Proteínas: 12.6,
      Carbohidratos: 0.72,
      'Grasas totales': 9.5,
      'Alcohol etílico': 0,
      Cenizas: 1.1,
    },
  },
  {
    nombre: 'Leche entera',
    categoria: 'Lácteos',
    composicion: {
      Agua: 87,
      'Sólidos totales': 13,
      Energía: 61,
      Proteínas: 3.2,
      Carbohidratos: 4.8,
      'Grasas totales': 3.3,
      'Alcohol etílico': 0,
      Cenizas: 0.7,
    },
  },
  {
    nombre: 'Pan blanco',
    categoria: 'Cereales',
    composicion: {
      Agua: 36,
      'Sólidos totales': 64,
      Energía: 265,
      Proteínas: 9,
      Carbohidratos: 49,
      'Grasas totales': 3.2,
      'Alcohol etílico': 0,
      Cenizas: 1.5,
    },
  },
  {
    nombre: 'Manzana cruda',
    categoria: 'Frutas',
    composicion: {
      Agua: 85.6,
      'Sólidos totales': 14.4,
      Energía: 52,
      Proteínas: 0.26,
      Carbohidratos: 13.8,
      'Grasas totales': 0.17,
      'Alcohol etílico': 0,
      Cenizas: 0.19,
    },
  },
  {
    nombre: 'Pollo cocido',
    categoria: 'Carnes',
    composicion: {
      Agua: 64,
      'Sólidos totales': 36,
      Energía: 239,
      Proteínas: 27.3,
      Carbohidratos: 0,
      'Grasas totales': 13.6,
      'Alcohol etílico': 0,
      Cenizas: 1.1,
    },
  },
  {
    nombre: 'Arroz blanco cocido',
    categoria: 'Cereales',
    composicion: {
      Agua: 68,
      'Sólidos totales': 32,
      Energía: 130,
      Proteínas: 2.4,
      Carbohidratos: 28.2,
      'Grasas totales': 0.3,
      'Alcohol etílico': 0,
      Cenizas: 0.1,
    },
  },
  {
    nombre: 'Queso fresco',
    categoria: 'Lácteos',
    composicion: {
      Agua: 60,
      'Sólidos totales': 40,
      Energía: 264,
      Proteínas: 18,
      Carbohidratos: 3.1,
      'Grasas totales': 21,
      'Alcohol etílico': 0,
      Cenizas: 1.8,
    },
  },
  {
    nombre: 'Tomate crudo',
    categoria: 'Verduras',
    composicion: {
      Agua: 94.5,
      'Sólidos totales': 5.5,
      Energía: 18,
      Proteínas: 0.9,
      Carbohidratos: 3.9,
      'Grasas totales': 0.2,
      'Alcohol etílico': 0,
      Cenizas: 0.5,
    },
  },
  {
    nombre: 'Papa hervida',
    categoria: 'Verduras',
    composicion: {
      Agua: 77,
      'Sólidos totales': 23,
      Energía: 87,
      Proteínas: 1.9,
      Carbohidratos: 20,
      'Grasas totales': 0.1,
      'Alcohol etílico': 0,
      Cenizas: 0.9,
    },
  },
  {
    nombre: 'Aceite de oliva',
    categoria: 'Grasas y aceites',
    composicion: {
      Agua: 0.2,
      'Sólidos totales': 99.8,
      Energía: 884,
      Proteínas: 0,
      Carbohidratos: 0,
      'Grasas totales': 100,
      'Alcohol etílico': 0,
      Cenizas: 0,
    },
  },
];

export const SISTEMAS_CUERPO = {
  '1. Sistema Endocrino': {
    Hipotálamo: [
      'Ácido alfa-linolénico (ALA, Omega-3)',
      'Ácido docosahexaenoico (DHA, Omega-3)',
      'Colina',
      'Tirosina',
      'Zinc (Zn)',
      'Vitamina D',
      'Piridoxina (B6)',
      'Cobalamina (B12)',
      'Folato (B9)',
    ],
  },
};

export const CONVERSIONES: Record<string, Record<string, number>> = {
  energia: { kcal: 1, kJ: 4.184 },
  masa: { g: 1, mg: 1000, µg: 1e6 },
  volumen: { L: 1, ml: 1000 },
};

export const DENSIDADES: Record<string, number> = {
  Agua: 1,
};

export function tipoUnidad(u: string): string | null {
  if (['kcal', 'kJ'].includes(u)) return 'energia';
  if (['g', 'mg', 'µg'].includes(u)) return 'masa';
  if (['L', 'ml'].includes(u)) return 'volumen';
  return null;
}

export function convertir(
  v: number,
  d: string,
  h: string,
  sustancia = 'Agua'
): number {
  const tipoD = tipoUnidad(d);
  const tipoH = tipoUnidad(h);

  if (!tipoD || !tipoH) return v;

  if (tipoD === tipoH) {
    const c = CONVERSIONES[tipoD];
    if (!c || !c[d] || !c[h]) return v;
    return v * (c[h] / c[d]);
  }

  if (sustancia !== 'Agua') return v;

  const densidad = DENSIDADES[sustancia];
  if (!densidad) return v;

  if (tipoD === 'volumen' && tipoH === 'masa') {
    const volML = v * (CONVERSIONES['volumen']['ml'] / CONVERSIONES['volumen'][d]);
    const gramos = volML * densidad;
    return gramos * (CONVERSIONES['masa'][h] / CONVERSIONES['masa']['g']);
  }

  if (tipoD === 'masa' && tipoH === 'volumen') {
    const gramos = v / CONVERSIONES['masa'][d];
    const volML = gramos / densidad;
    return volML * (CONVERSIONES['volumen'][h] / CONVERSIONES['volumen']['ml']);
  }

  return v;
}

export function aplanarNutrientes(
  obj: NutrientesEstructura,
  niveles: string[] = []
): NutrientePlano[] {
  const lista: NutrientePlano[] = [];
  for (const [k, v] of Object.entries(obj)) {
    if (Array.isArray(v)) {
      v.forEach((n) => lista.push({ ...n, niveles: [...niveles, k] }));
    } else if (typeof v === 'object' && v !== null) {
      lista.push(...aplanarNutrientes(v as NutrientesEstructura, [...niveles, k]));
    }
  }
  return lista;
}

export const NUTRIENTES_PLANOS: NutrientePlano[] = aplanarNutrientes(NUTRIENTES);
