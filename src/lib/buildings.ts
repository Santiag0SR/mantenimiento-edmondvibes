export const CATEGORIAS = [
  "Turístico",
  "Corporativo",
  "Vitarooms",
] as const;

export type Categoria = typeof CATEGORIAS[number];

export const EDIFICIOS_POR_CATEGORIA: Record<Categoria, Record<string, string[]>> = {
  "Turístico": {
    "Andres Obispo": [
      "2A",
      "2B",
      "3A",
      "3B",
      "Cuarto de limpieza",
      "Cajetín garaje"
    ],
    "General Martinez Campos": [
      "1",
      "2",
      "3",
      "4"
    ],
    "Juan Bravo": [
      "1A", "1B", "1C", "1D",
      "2A", "2B", "2C", "2D",
      "3A", "3B", "3C", "3D",
      "5C", "5D",
      "6C", "6D",
      "7B",
      "BA", "BB",
      "Trastero 18"
    ],
    "Abada": [
      "BA", "BB",
      "1A", "1B",
      "2A", "2B",
      "3A", "3B",
      "4A", "4B",
      "5"
    ]
  },
  "Corporativo": {
    "Juan Bautista de Toledo 17": [
      "02 A",
      "03 B"
    ],
    "Madera 29": [
      "1 D 2 (Ext)",
      "1 D 1 (Int)",
      "1 I2 (Ext)",
      "1 I1 (Int)",
      "2 D2 (Ext)",
      "2 D1 (Int)",
      "2 I2 (Ext)",
      "2 I1 (Int)",
      "3 D1 (Int)",
      "3 I2 (Ext)",
      "3 I1 (Int)",
      "4 D2 (Ext)",
      "4 D1 (Int)",
      "4 I",
      "Bajo 1A (Int)"
    ],
    "Presidente Carmona 6": [
      "SM 02"
    ],
    "Villanueva 13": [
      "Habitacion 1",
      "Habitacion 2",
      "Habitacion 3",
      "Habitacion 4",
      "Habitacion 5",
      "Habitacion 6",
      "Habitacion 7",
      "Habitacion 8",
      "Habitacion 9",
      "Habitacion 10",
      "Habitacion 11",
      "Habitacion 12"
    ]
  },
  "Vitarooms": {
    "VG15 - Vasco de Gama 15": [
      "Habitación 1", "Habitación 2", "Habitación 3", "Habitación 4"
    ],
    "CM6 - Callejón de Murcia 6": [
      "Habitación 1", "Habitación 2", "Habitación 3", "Habitación 4"
    ],
    "LG66 - López Grass 66, 4B": [
      "Habitación 1", "Habitación 2", "Habitación 3"
    ],
    "ANLB21 - Ana Albi 21, 1 Izq": [
      "Habitación 1", "Habitación 2", "Habitación 3", "Habitación 4"
    ],
    "GT6 - Getafe 6, 2-3D": [
      "Habitación 1", "Habitación 2", "Habitación 3", "Habitación 4"
    ],
    "NSG1 - Ntra Sra de Guadalupe 1": [
      "Habitación 1", "Habitación 2", "Habitación 3", "Habitación 4"
    ],
    "VLD4 - Valdeparazuelos 4, 1D": [
      "Habitación 1", "Habitación 2", "Habitación 3", "Habitación 4"
    ],
    "AP11 - Alberto Palacios 11, 1B": [
      "Habitación 1", "Habitación 2", "Habitación 3", "Habitación 4"
    ],
    "VER8 - Verónica 8": [
      "Habitación 1", "Habitación 2", "Habitación 3", "Habitación 4"
    ],
    "ESP3 - Españoleto 3, 2C": [
      "Habitación 1", "Habitación 2", "Habitación 3", "Habitación 4", "Habitación 5"
    ],
    "TRL7 - Teruel 7, bajo C": [
      "Habitación 1", "Habitación 2", "Habitación 3", "Habitación 4"
    ],
    "RG1 - Río Guadarrama 1, 2D": [
      "Habitación 1", "Habitación 2", "Habitación 3", "Habitación 4"
    ],
    "PV1 - Pz Valencia 1, 3D": [
      "Habitación 1", "Habitación 2", "Habitación 3", "Habitación 4"
    ],
    "VG4 - Vega 4, 4-03": [
      "Habitación 1", "Habitación 2", "Habitación 3", "Habitación 4"
    ],
    "PR9 - Pz de los Ríos 9, 3D": [
      "Habitación 1", "Habitación 2", "Habitación 3", "Habitación 4"
    ],
    "TRJ2 - Trujillo 2, 5B": [
      "Habitación 1", "Habitación 2", "Habitación 3", "Habitación 4"
    ],
    "LT6 - Lago Tiberíades 6, 1C": [
      "Habitación 1", "Habitación 2", "Habitación 3", "Habitación 4"
    ],
    "BDZ14 - Badajoz 14, bajo": [
      "Habitación 1"
    ],
    "PDC3 - Puerta del Campo 3, 3 Izq": [
      "Habitación 1", "Habitación 2", "Habitación 3", "Habitación 4"
    ],
    "HTS2 - Hortensia 2, 4D": [
      "Habitación 1", "Habitación 2", "Habitación 3", "Habitación 4"
    ],
    "DB4 - Doctor Barraquer 4, 4-4": [
      "Habitación 1", "Habitación 2", "Habitación 3", "Habitación 4"
    ],
    "PP50 - Pablo Picasso 50, 4-2": [
      "Habitación 1", "Habitación 2", "Habitación 3", "Habitación 4"
    ],
    "LBT51 - Libertad 51, 4D": [
      "Habitación 1", "Habitación 2", "Habitación 3", "Habitación 4"
    ],
    "MA7 - Manuel Arranz 7, bajo int 3": [
      "Habitación 1", "Habitación 2"
    ],
    "SA3 - San Andrés 3, 4A": [
      "Habitación 1", "Habitación 2", "Habitación 3", "Habitación 4"
    ],
    "CA105 - Cuevas de Almanzora 105, 1 Izq": [
      "Habitación 1", "Habitación 2", "Habitación 3", "Habitación 4", "Habitación 5"
    ],
    "VA1 - Valladolid 1, 4E": [
      "Habitación 1", "Habitación 2", "Habitación 3", "Habitación 4"
    ]
  }
};

// Alias de edificios usados en mantenimiento → nombre completo + categoría
export const EDIFICIO_ALIASES: Record<string, { nombre: string; categoria: Categoria }> = {
  "JB": { nombre: "Juan Bravo", categoria: "Turístico" },
  "AO": { nombre: "Andres Obispo", categoria: "Turístico" },
  "GMC": { nombre: "General Martinez Campos", categoria: "Turístico" },
  "CDV": { nombre: "Conde de Vilches", categoria: "Turístico" },
  "Abada": { nombre: "Abada", categoria: "Turístico" },
};

// Todos los edificios combinados (para filtros generales)
export const EDIFICIOS: Record<string, string[]> = Object.assign(
  {},
  ...CATEGORIAS.map((cat) => EDIFICIOS_POR_CATEGORIA[cat])
);

export const URGENCIAS = [
  "Baja",
  "Media",
  "Alta",
  "Urgente"
] as const;

export const ESTADOS = [
  "Pendiente",
  "En proceso",
  "Derivar a especialista",
  "Completada",
  "Cancelada"
] as const;

export const ESPECIALIDADES = [
  "Fontanería",
  "Electricidad",
  "Cerrajería",
  "Climatización",
  "Pintura",
  "Albañilería",
  "Otro",
] as const;

export type Urgencia = typeof URGENCIAS[number];
export type Estado = typeof ESTADOS[number];
export type Especialidad = typeof ESPECIALIDADES[number];
