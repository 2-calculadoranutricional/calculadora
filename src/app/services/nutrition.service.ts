import { Injectable, signal, computed } from '@angular/core';
import {
  Alimento,
  AlimentoAgregado,
  COMIDAS,
  DISTRIBUCION_VDR_DEFAULT,
  DistribucionVDR,
  NUTRIENTES_PLANOS,
  TotalesNutricionales,
  UsuarioPerfil,
  VDR_DEFAULT,
  VDRMap,
  convertir,
} from '../models/nutrition.models';

export interface ToastMessage {
  id: number;
  mensaje: string;
  duracion: number;
}

export interface PerfilCompartirOpcion {
  clave: string;
  nombre: string;
  seleccionado: boolean;
}

export interface ModalOpciones {
  mensaje?: string;
  onAceptar?: () => void;
  onCancelar?: () => void;
  textoAceptar?: string;
  colorTexto?: string;
  perfilesCompartir?: PerfilCompartirOpcion[];
  onAceptarCompartir?: (seleccionados: string[]) => void;
}

const STORAGE_KEY = 'calculadora_nutricional_v1';

@Injectable({
  providedIn: 'root',
})
export class NutritionService {
  readonly usuarioActivo = signal<string>('Calculadora Nutricional');
  readonly usuariosMap = signal<Record<string, UsuarioPerfil>>({});
  readonly ordenUsuarios = signal<string[]>([]);
  readonly datosComidas = signal<Record<string, AlimentoAgregado[]>>({});
  readonly mostrarTodosLosNutrientes = signal<Record<string, boolean>>({});
  readonly panelAbierto = signal<string | null>(null);

  // Manual editor state: [userComidaKey][nutriente]
  readonly datosManuales = signal<Record<string, Record<string, number>>>({});
  readonly datosManualesUnidades = signal<Record<string, Record<string, string>>>({});
  readonly editorManualVisible = signal<Record<string, boolean>>({});

  // View sections toggle: seccion0 (grafico), seccion1 (tabla), seccion2 (perfiles en total)
  readonly seccionVisible = signal<
    Record<
      string,
      {
        grafico: boolean;
        tabla: boolean;
        perfiles?: boolean;
      }
    >
  >({});

  // Data originals for reverting food division
  private readonly datosOriginales: Record<string, AlimentoAgregado[]> = {};

  // Confirmation modal state
  readonly modalActivo = signal<ModalOpciones | null>(null);

  // Toast notifications queue
  readonly toastQueue = signal<ToastMessage[]>([]);
  readonly currentToast = signal<ToastMessage | null>(null);
  private toastTimer: ReturnType<typeof setTimeout> | null = null;
  private toastCounter = 0;

  // Lluvia de emojis
  readonly lluviaActiva = computed(() => {
    const active = this.usuarioActivo();
    const map = this.usuariosMap();
    const user = map[active];
    if (!user) return false;

    // Check if open panel closes rain
    if (this.panelAbierto() !== null) return false;

    const comidas = COMIDAS;
    const datos = this.datosComidas();
    return (
      comidas.length > 0 &&
      comidas.every((c) => {
        const key = `${user.nombre}-${c}`;
        return (datos[key] || []).length >= 1;
      })
    );
  });

  // Current active user object
  readonly currentUsuario = computed(() => {
    const active = this.usuarioActivo();
    const map = this.usuariosMap();
    return map[active] || map['Calculadora Nutricional'];
  });

  constructor() {
    this.cargarDesdeStorage();
  }

  private cargarDesdeStorage() {
    let cargado = false;
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const data = window.localStorage.getItem(STORAGE_KEY);
        if (data) {
          const parsed = JSON.parse(data);
          if (parsed.usuariosMap && parsed.datosComidas) {
            this.usuariosMap.set(parsed.usuariosMap);
            this.datosComidas.set(parsed.datosComidas);
            this.ordenUsuarios.set(parsed.ordenUsuarios || []);
            this.usuarioActivo.set(
              parsed.usuarioActivo || 'Calculadora Nutricional'
            );
            cargado = true;
          }
        }
      }
    } catch {
      // Ignorar error de parsing
    }

    if (!cargado) {
      const ghostUser: UsuarioPerfil = {
        nombre: 'Calculadora Nutricional',
        nombreVisual: 'Calculadora Nutricional',
        fantasma: true,
        emoji: '🙂',
        vdr: { ...VDR_DEFAULT },
        distribucionVDR: { ...DISTRIBUCION_VDR_DEFAULT },
      };
      this.usuariosMap.set({
        'Calculadora Nutricional': ghostUser,
      });
      this.ordenUsuarios.set([]);
      this.usuarioActivo.set('Calculadora Nutricional');

      const initialComidas: Record<string, AlimentoAgregado[]> = {};
      COMIDAS.forEach((c) => {
        initialComidas[`Calculadora Nutricional-${c}`] = [];
      });
      initialComidas['total-Calculadora Nutricional'] = [];
      this.datosComidas.set(initialComidas);
    }
  }

  guardarEnStorage() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const data = {
          usuariosMap: this.usuariosMap(),
          datosComidas: this.datosComidas(),
          ordenUsuarios: this.ordenUsuarios(),
          usuarioActivo: this.usuarioActivo(),
        };
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      }
    } catch {
      // localStorage lleno o deshabilitado
    }
  }

  setPanelAbierto(id: string | null) {
    this.panelAbierto.set(id);
    if (typeof document !== 'undefined') {
      const abierta = id !== null;
      document.body.classList.toggle('panel-abierto', abierta);
      document.documentElement.classList.toggle('panel-abierto', abierta);
    }
  }

  togglePanel(id: string) {
    if (this.panelAbierto() === id) {
      this.setPanelAbierto(null);
    } else {
      this.setPanelAbierto(id);
    }
  }

  // --- Usuarios ---
  seleccionarUsuario(clave: string) {
    if (!this.usuariosMap()[clave]) return;
    this.usuarioActivo.set(clave);
    this.setPanelAbierto(null);
    this.guardarEnStorage();
  }

  guardarUsuario(
    nombreInput: string,
    emoji: string,
    fechaNacimiento: string,
    edad: number | null,
    peso: number | null,
    altura: number | null,
    editandoClave: string | null
  ): boolean {
    const map = { ...this.usuariosMap() };
    const orden = [...this.ordenUsuarios()];

    if (editandoClave && map[editandoClave]) {
      const u = { ...map[editandoClave] };
      u.nombreVisual = nombreInput;
      u.emoji = emoji;
      u.fechaNacimiento = fechaNacimiento;
      u.edad = edad;
      u.peso = peso;
      u.altura = altura;
      map[editandoClave] = u;
      this.usuariosMap.set(map);
      this.usuarioActivo.set(editandoClave);
      this.guardarEnStorage();
      return true;
    } else {
      const claveBase = nombreInput;
      let clave = claveBase;
      let contador = 1;
      while (map[clave]) {
        clave = `${claveBase}_${contador++}`;
      }

      const nuevo: UsuarioPerfil = {
        nombre: clave,
        nombreVisual: nombreInput,
        emoji: emoji || '🙂',
        fechaNacimiento,
        edad,
        peso,
        altura,
        vdr: { ...VDR_DEFAULT },
        distribucionVDR: { ...DISTRIBUCION_VDR_DEFAULT },
      };

      map[clave] = nuevo;
      orden.push(clave);

      const comidas = { ...this.datosComidas() };
      COMIDAS.forEach((c) => {
        comidas[`${clave}-${c}`] = [];
      });
      comidas[`total-${clave}`] = [];

      this.usuariosMap.set(map);
      this.ordenUsuarios.set(orden);
      this.datosComidas.set(comidas);
      this.usuarioActivo.set(clave);

      // Limpiar calculadora nutricional default si existe
      if (map['Calculadora Nutricional']) {
        COMIDAS.forEach((c) => {
          comidas[`Calculadora Nutricional-${c}`] = [];
        });
      }

      this.guardarEnStorage();
      return true;
    }
  }

  eliminarUsuario(clave: string) {
    if (clave === 'Calculadora Nutricional') return;
    const map = { ...this.usuariosMap() };
    const orden = this.ordenUsuarios().filter((u) => u !== clave);
    const comidas = { ...this.datosComidas() };

    delete map[clave];
    COMIDAS.forEach((c) => {
      delete comidas[`${clave}-${c}`];
    });
    delete comidas[`total-${clave}`];

    const restantes = Object.keys(map).filter(
      (u) => u !== 'Calculadora Nutricional'
    );
    const nuevoActivo = restantes[0] || 'Calculadora Nutricional';

    this.usuariosMap.set(map);
    this.ordenUsuarios.set(orden);
    this.datosComidas.set(comidas);
    this.usuarioActivo.set(nuevoActivo);
    this.guardarEnStorage();
  }

  reordenarUsuarios(nuevoOrden: string[]) {
    this.ordenUsuarios.set(nuevoOrden);
    this.guardarEnStorage();
  }

  // --- VDR y Distribución ---
  actualizarVDRUsuario(usuarioClave: string, nuevoVDR: VDRMap) {
    const map = { ...this.usuariosMap() };
    if (!map[usuarioClave]) return;
    map[usuarioClave] = {
      ...map[usuarioClave],
      vdr: { ...nuevoVDR },
    };
    this.usuariosMap.set(map);
    this.guardarEnStorage();
  }

  actualizarDistribucionVDR(
    usuarioClave: string,
    nuevaDistribucion: DistribucionVDR
  ) {
    const map = { ...this.usuariosMap() };
    if (!map[usuarioClave]) return;
    map[usuarioClave] = {
      ...map[usuarioClave],
      distribucionVDR: { ...nuevaDistribucion },
    };
    this.usuariosMap.set(map);
    this.guardarEnStorage();
  }

  // --- Alimentos y Comidas ---
  agregarAlimento(usuarioComidaKey: string, alimento: Alimento, peso: number) {
    const [usuario, comida] = usuarioComidaKey.split('-');
    const totales = this.calcularComida(usuario, comida);

    // Validar límite 7 dígitos
    for (const [nutriente, valor] of Object.entries(alimento.composicion || {})) {
      const nuevoValor =
        (totales[nutriente] || 0) + (valor * peso) / 100;
      if (nuevoValor > 9999999) {
        this.mostrarToast(
          `No se puede agregar "${alimento.nombre}" porque "${nutriente}" superaría el límite de 7 dígitos enteros.`,
          2500
        );
        return false;
      }
    }

    const comidas = { ...this.datosComidas() };
    const lista = [...(comidas[usuarioComidaKey] || [])];
    lista.push({ alimento, peso });
    comidas[usuarioComidaKey] = lista;

    // Actualizar también total
    this.recalcularTotal(usuario, comidas);

    this.datosComidas.set(comidas);
    this.guardarEnStorage();
    return true;
  }

  eliminarAlimento(usuarioComidaKey: string, index: number) {
    const comidas = { ...this.datosComidas() };
    const lista = [...(comidas[usuarioComidaKey] || [])];
    if (index >= 0 && index < lista.length) {
      lista.splice(index, 1);
    }
    comidas[usuarioComidaKey] = lista;

    const [usuario] = usuarioComidaKey.split('-');
    this.recalcularTotal(usuario, comidas);

    this.datosComidas.set(comidas);
    this.guardarEnStorage();
  }

  dividirAlimentos(usuarioComidaKey: string, divisorNum: number): boolean {
    if (isNaN(divisorNum) || divisorNum <= 0) {
      this.mostrarToast('Ingresa un número válido mayor a 0 para dividir.');
      return false;
    }

    const items = this.datosComidas()[usuarioComidaKey] || [];
    if (items.length === 0) return false;

    // Guardar originales si no están guardados
    if (!this.datosOriginales[usuarioComidaKey]?.length) {
      this.datosOriginales[usuarioComidaKey] = items.map((item) => ({
        alimento: {
          ...item.alimento,
          composicion: item.alimento.composicion
            ? { ...item.alimento.composicion }
            : {},
        },
        peso: item.peso,
      }));
    }

    const nuevosItems: AlimentoAgregado[] = items.map((item) => {
      if (item.alimento?.esManual) {
        const nuevaCompo: Record<string, number> = {};
        for (const [nutriente, valor] of Object.entries(
          item.alimento.composicion
        )) {
          nuevaCompo[nutriente] = Math.round((valor / divisorNum) * 100) / 100;
        }

        const clave = Object.keys(nuevaCompo)[0];
        const valorBase = nuevaCompo[clave];
        const unidadBase =
          NUTRIENTES_PLANOS.find((n) => n.nombre === clave)?.unidad ||
          item.alimento.unidad ||
          'g';

        const valorConvertido = convertir(
          valorBase,
          unidadBase,
          item.alimento.unidad || unidadBase
        );
        const displayManual = `${clave} ${
          Math.round(valorConvertido * 100) / 100
        } ${item.alimento.unidad || unidadBase}`;

        return {
          alimento: {
            ...item.alimento,
            composicion: nuevaCompo,
            displayManual,
          },
          peso: item.peso,
        };
      } else {
        return {
          ...item,
          peso: Math.round((item.peso / divisorNum) * 100) / 100,
        };
      }
    });

    const comidas = { ...this.datosComidas() };
    comidas[usuarioComidaKey] = nuevosItems;
    const [usuario] = usuarioComidaKey.split('-');
    this.recalcularTotal(usuario, comidas);
    this.datosComidas.set(comidas);
    this.guardarEnStorage();
    return true;
  }

  revertirDivision(usuarioComidaKey: string) {
    const originales = this.datosOriginales[usuarioComidaKey];
    if (!originales || originales.length === 0) return;

    const items = this.datosComidas()[usuarioComidaKey] || [];
    const restaurados = items.map((item) => {
      const orig = originales.find(
        (o) => o.alimento?.nombre === item.alimento?.nombre
      );
      if (orig) {
        return {
          alimento: {
            ...orig.alimento,
            composicion: { ...orig.alimento.composicion },
          },
          peso: orig.peso,
        };
      }
      return item;
    });

    const comidas = { ...this.datosComidas() };
    comidas[usuarioComidaKey] = restaurados;
    const [usuario] = usuarioComidaKey.split('-');
    this.recalcularTotal(usuario, comidas);
    this.datosComidas.set(comidas);
    this.datosOriginales[usuarioComidaKey] = [];
    this.guardarEnStorage();
  }

  private recalcularTotal(
    usuario: string,
    comidas: Record<string, AlimentoAgregado[]>
  ) {
    const totalKey = `total-${usuario}`;
    const allItems: AlimentoAgregado[] = [];
    COMIDAS.forEach((c) => {
      const lista = comidas[`${usuario}-${c}`] || [];
      lista.forEach((item) => allItems.push(item));
    });
    comidas[totalKey] = allItems;
  }

  calcularComida(usuario: string, comida: string): TotalesNutricionales {
    const key = comida === 'total' ? `total-${usuario}` : `${usuario}-${comida}`;
    const items = this.datosComidas()[key] || [];
    const totales: TotalesNutricionales = {};

    NUTRIENTES_PLANOS.forEach((n) => {
      totales[n.nombre] = 0;
    });

    items.forEach(({ alimento, peso }) => {
      for (const [nombre, valor] of Object.entries(alimento.composicion || {})) {
        totales[nombre] = ((totales[nombre] as number) || 0) + (valor * peso) / 100;
      }
    });

    if (comida !== 'total') {
      const { pH, pHEst } = this.calcularPHComida(items);
      totales['pH (alimento)'] =
        pH != null && Number.isFinite(pH) ? Number(pH.toFixed(2)) : null;
      totales['pH estimado en estómago'] =
        pHEst != null && Number.isFinite(pHEst)
          ? Number(pHEst.toFixed(2))
          : null;
    }

    return totales;
  }

  calcularPHComida(alimentosComida: AlimentoAgregado[]) {
    let sumaH = 0;
    let sumaHEst = 0;
    let pesoConPH = 0;
    let pesoConHEst = 0;

    (alimentosComida || []).forEach(({ alimento, peso }) => {
      const pHAlimento = alimento?.composicion?.['pH (alimento)'];
      const pHEst = alimento?.composicion?.['pH estimado en estómago'];

      if (Number.isFinite(pHAlimento)) {
        sumaH += Math.pow(10, -pHAlimento) * peso;
        pesoConPH += peso;
      }
      if (Number.isFinite(pHEst)) {
        sumaHEst += Math.pow(10, -pHEst) * peso;
        pesoConHEst += peso;
      }
    });

    const pH =
      pesoConPH > 0 && sumaH > 0 ? -Math.log10(sumaH / pesoConPH) : null;
    const pHEst =
      pesoConHEst > 0 && sumaHEst > 0
        ? -Math.log10(sumaHEst / pesoConHEst)
        : null;

    return { pH, pHEst };
  }

  // --- Toggles de visibilidad ---
  toggleNutrientesVacios(key: string) {
    const map = { ...this.mostrarTodosLosNutrientes() };
    map[key] = !map[key];
    this.mostrarTodosLosNutrientes.set(map);
  }

  toggleEditorManual(key: string) {
    const map = { ...this.editorManualVisible() };
    map[key] = !map[key];
    this.editorManualVisible.set(map);
  }

  getSeccionVisible(id: string) {
    return (
      this.seccionVisible()[id] || {
        grafico: true,
        tabla: true,
        perfiles: false,
      }
    );
  }

  toggleSeccion(id: string) {
    const cur = this.getSeccionVisible(id);
    const todasOcultas = !cur.grafico && !cur.tabla && !cur.perfiles;
    const nextVal = todasOcultas;

    const map = { ...this.seccionVisible() };
    map[id] = {
      grafico: nextVal,
      tabla: nextVal,
      perfiles: id.startsWith('total-') ? nextVal : cur.perfiles,
    };
    this.seccionVisible.set(map);
  }

  toggleGrafico(id: string) {
    const cur = this.getSeccionVisible(id);
    const map = { ...this.seccionVisible() };
    map[id] = {
      ...cur,
      grafico: !cur.grafico,
    };
    this.seccionVisible.set(map);
  }

  toggleTabla(id: string) {
    const cur = this.getSeccionVisible(id);
    const map = { ...this.seccionVisible() };
    map[id] = {
      ...cur,
      tabla: !cur.tabla,
    };
    this.seccionVisible.set(map);
  }

  togglePerfiles(usuario: string) {
    const id = `total-${usuario}`;
    const cur = this.getSeccionVisible(id);
    const map = { ...this.seccionVisible() };
    map[id] = {
      ...cur,
      perfiles: !cur.perfiles,
    };
    this.seccionVisible.set(map);
  }

  // --- Notificaciones Toast y Modales ---
  mostrarToast(mensaje: string, duracion = 1000) {
    const item: ToastMessage = {
      id: ++this.toastCounter,
      mensaje,
      duracion,
    };
    this.toastQueue.update((q) => [...q, item]);
    this.procesarSiguienteToast();
  }

  private procesarSiguienteToast() {
    if (this.currentToast() !== null) return;
    const queue = this.toastQueue();
    if (queue.length === 0) return;

    const next = queue[0];
    this.toastQueue.set(queue.slice(1));
    this.currentToast.set(next);

    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      this.cerrarToast();
    }, next.duracion);
  }

  cerrarToast() {
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
      this.toastTimer = null;
    }
    this.currentToast.set(null);
    setTimeout(() => {
      this.procesarSiguienteToast();
    }, 200);
  }

  mostrarConfirmacion(
    mensaje: string,
    onAceptar: () => void,
    onCancelar?: () => void,
    opciones: { textoAceptar?: string; colorTexto?: string } = {}
  ) {
    this.modalActivo.set({
      mensaje,
      onAceptar,
      onCancelar,
      textoAceptar: opciones.textoAceptar || 'Eliminar',
      colorTexto: opciones.colorTexto,
    });
  }

  mostrarModalCompartir(
    perfiles: PerfilCompartirOpcion[],
    onAceptarCompartir: (seleccionados: string[]) => void,
    onCancelar?: () => void
  ) {
    this.modalActivo.set({
      perfilesCompartir: perfiles,
      textoAceptar: 'Aceptar',
      onAceptarCompartir,
      onCancelar,
    });
  }

  copiarAlimentosAUsuarios(
    destUsers: string[],
    comida: string,
    items: AlimentoAgregado[]
  ) {
    const comidas = { ...this.datosComidas() };
    for (const destUser of destUsers) {
      const keyDestino = `${destUser}-${comida}`;
      const lista = [...(comidas[keyDestino] || [])];
      items.forEach((i) => {
        lista.push({ alimento: i.alimento, peso: i.peso });
      });
      comidas[keyDestino] = lista;
      this.recalcularTotal(destUser, comidas);
    }
    this.datosComidas.set(comidas);
    this.guardarEnStorage();
  }

  cerrarModal() {
    this.modalActivo.set(null);
  }
}
