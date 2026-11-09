import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  afterNextRender,
  computed,
  effect,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { Chart, DoughnutController, ArcElement, Legend, Tooltip } from 'chart.js';
import {
  ALIMENTOS_BASE,
  Alimento,
  CATEGORIAS_ALIMENTOS,
  COLORES_VDR,
  CONVERSIONES,
  NUTRIENTES,
  NUTRIENTES_PLANOS,
  NutrienteItem,
  convertir,
  tipoUnidad,
} from '../../models/nutrition.models';
import {
  NutritionService,
  PerfilCompartirOpcion,
} from '../../services/nutrition.service';

Chart.register(DoughnutController, ArcElement, Legend, Tooltip);

interface CategoriaTabla {
  categoria: string;
  subcategorias: {
    nombre?: string;
    items: NutrienteItem[];
  }[];
}

@Component({
  selector: 'app-meal-section',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="section"
      style="margin: 0.5rem; border-bottom: 1px solid #ccc; padding-bottom: 1rem;"
    >
      <!-- SELECTOR DE CATEGORÍA Y TÍTULO -->
      <div class="contenedor-select">
        <h5 class="titulo-comida">{{ comida() }}</h5>
        <select
          class="select-categorias"
          (change)="onCategoriaChange($event)"
          aria-label="Seleccionar categoría"
        >
          <option value="">Todas las categorías</option>
          @for (c of categoriasAlimentos; track c) {
            <option [value]="c">{{ c }}</option>
          }
        </select>
      </div>

      <!-- BUSCADOR Y PESO -->
      <div class="fila-comida">
        <div class="contenedor-buscador">
          <input
            type="text"
            class="input-buscador"
            placeholder="Buscar alimento"
            [value]="busquedaTexto()"
            (input)="onBusquedaInput($event)"
            maxlength="20"
          />
          @if (sugerencias().length > 0) {
            <ul class="sugerencias-lista">
              @for (a of sugerencias(); track a.nombre) {
                <li>
                  <button type="button" (click)="seleccionarAlimento(a)">
                    {{ a.nombre }}
                  </button>
                </li>
              }
            </ul>
          }
        </div>
        <div class="contenedor-peso">
          <span class="etiqueta-peso">g</span>
          <input
            type="text"
            inputmode="decimal"
            class="input-peso"
            placeholder="Peso"
            [value]="pesoInput()"
            (input)="onPesoInput($event)"
            maxlength="7"
          />
        </div>
      </div>

      <!-- LISTA DE ALIMENTOS AGREGADOS -->
      <div id="lista-agregados" style="margin-top:0.5rem;">
        @if (items().length > 0) {
          <div
            [style.max-height]="items().length > 5 ? '160px' : 'none'"
            [style.overflow-y]="items().length > 5 ? 'auto' : 'visible'"
          >
            <table>
              <thead>
                <tr>
                  <th>Alimento / Nutriente</th>
                  <th>Cantidad</th>
                  <th>Unidad</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                @for (item of items(); track $index) {
                  <tr>
                    <td>
                      @if (item.alimento.esManual) {
                        {{ getNombreManual(item.alimento.displayManual || '') }}
                      } @else {
                        {{ item.alimento.nombre }}
                      }
                    </td>
                    <td>
                      @if (item.alimento.esManual) {
                        {{
                          getCantidadManual(item.alimento.displayManual || '')
                        }}
                      } @else {
                        {{ item.peso }}
                      }
                    </td>
                    <td>
                      @if (item.alimento.esManual) {
                        {{ getUnidadManual(item.alimento.displayManual || '') }}
                      } @else {
                        {{ item.alimento.unidad || 'g' }}
                      }
                    </td>
                    <td>
                      <button
                        type="button"
                        class="btn-eliminar"
                        style="font-weight:bold; border:none; background:none; font-size:1.3rem; margin:0; padding:0; height:100%; cursor:pointer;"
                        (click)="eliminarAlimento($index)"
                        aria-label="Eliminar alimento"
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>

      <!-- HERRAMIENTAS, GRÁFICOS Y TABLAS (VISIBLES SI HAY ITEMS) -->
      @if (items().length > 0) {
        <div class="contenedor0">
          <div class="contenedor">
            <div class="divisor-box">
              <button type="button" (click)="revertirDivision()">
                Revertir
              </button>
              <input
                type="text"
                inputmode="decimal"
                class="input-divir"
                placeholder="Dividir comida entre..."
                [value]="divisorTexto()"
                (input)="onDivisorInput($event)"
              />
              <button type="button" (click)="aplicarDivision()">Aplicar</button>
            </div>

            <button type="button" (click)="toggleGrafico()">
              {{
                seccionVisible().grafico ? 'Ocultar gráfico' : 'Mostrar gráfico'
              }}
            </button>
            <button type="button" (click)="toggleSeccion()">
              Gráfico-Tablas
            </button>
            <button type="button" (click)="toggleTabla()">
              {{
                seccionVisible().tabla ? 'Ocultar tablas' : 'Mostrar tablas'
              }}
            </button>
            <div>
              <button
                type="button"
                class="btn-compartir"
                (click)="abrirCompartirAlimentosModal()"
              >
                Compartir alimentos con perfiles
              </button>
            </div>
          </div>

          <!-- SECCIÓN 0: GRÁFICO NUTRICIONAL -->
          @if (seccionVisible().grafico) {
            <div style="margin-top: 1rem;">
              <h4>Gráfico Nutricional</h4>
              <div style="max-width: 320px; margin: 0 auto;">
                <canvas #chartCanvas></canvas>
              </div>
            </div>
          }

          <!-- SECCIÓN 1: TABLA NUTRICIONAL Y EDITOR MANUAL -->
          @if (seccionVisible().tabla) {
            <div style="margin-top: 1rem;">
              <button type="button" (click)="toggleNutrientesVacios()">
                {{
                  mostrarTodosNutrientes()
                    ? 'Ocultar nutrientes vacíos'
                    : 'Mostrar todos los nutrientes'
                }}
              </button>
              <button type="button" (click)="toggleEditorManual()">
                {{
                  editorManualAbierto()
                    ? 'Aplicar nutrientes'
                    : 'Agregar nutrientes'
                }}
              </button>

              @if (!editorManualAbierto()) {
                <h4>Tabla Nutricional</h4>
                @for (cat of categoriasTabla; track cat.categoria) {
                  @if (tieneNutrientesVisibles(cat)) {
                    <table style="margin-bottom: 0.5rem;">
                      <thead>
                        <tr>
                          <th>Nutriente</th>
                          <th>Cantidad</th>
                          <th>Unidad</th>
                          <th>VDR%</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td
                            colspan="4"
                            style="text-align:center; background:#f9f9f9; font-weight:600; font-size:.8rem;"
                          >
                            {{ cat.categoria }}
                          </td>
                        </tr>

                        @for (
                          sub of cat.subcategorias;
                          track sub.nombre || $index
                        ) {
                          @if (sub.nombre && tieneSubcategoriaVisible(sub)) {
                            <tr>
                              <td
                                colspan="4"
                                style="text-align:center; background:#f0f0f0; font-weight:600; font-size:.8rem;"
                              >
                                {{ sub.nombre }}
                              </td>
                            </tr>
                          }

                          @for (n of sub.items; track n.nombre) {
                            @if (esNutrienteVisible(n.nombre)) {
                              <tr>
                                <td
                                  class="nombre-nutriente"
                                  style="cursor:pointer;"
                                  (click)="toggleDescripcion(n.nombre)"
                                >
                                  {{ n.nombre }}
                                </td>
                                <td>{{ getValorFormateado(n.nombre) }}</td>
                                <td>{{ n.unidad }}</td>
                                <td [style.color]="getColorVDR(n.nombre)">
                                  {{ getPorcentajeVDR(n.nombre) }}
                                </td>
                              </tr>
                              @if (descripcionesAbiertas()[n.nombre]) {
                                <tr class="descripcion-nutriente">
                                  <td
                                    colspan="4"
                                    style="font-size:.8rem; color:black; font-weight:600; background:#f0f0f0; text-align:left; padding:8px;"
                                  >
                                    {{
                                      n.descripcion ||
                                        'Sin descripción disponible.'
                                    }}
                                  </td>
                                </tr>
                              }
                            }
                          }
                        }
                      </tbody>
                    </table>
                  }
                }
              }

              <!-- EDITOR MANUAL -->
              @if (editorManualAbierto()) {
                <h4 style="margin-top:1rem;">Editor Manual</h4>
                @for (cat of categoriasTabla; track cat.categoria) {
                  <table style="margin-bottom: 0.5rem;">
                    <thead>
                      <tr>
                        <th>Nutriente</th>
                        <th>Cantidad</th>
                        <th>Unidad</th>
                        <th>VDR%</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td
                          colspan="4"
                          style="text-align:center; background:#f9f9f9; font-weight:600; font-size:.8rem;"
                        >
                          {{ cat.categoria }}
                        </td>
                      </tr>

                      @for (
                        sub of cat.subcategorias;
                        track sub.nombre || $index
                      ) {
                        @if (sub.nombre) {
                          <tr>
                            <td
                              colspan="4"
                              style="text-align:center; background:#f0f0f0; font-weight:600; font-size:.8rem;"
                            >
                              {{ sub.nombre }}
                            </td>
                          </tr>
                        }

                        @for (n of sub.items; track n.nombre) {
                          <tr>
                            <td>{{ n.nombre }}</td>
                            <td>
                              <input
                                type="text"
                                inputmode="decimal"
                                style="width:100%; border:none; text-align:center; background:transparent; font-size:.8rem;"
                                placeholder="0.00"
                                [value]="getManualInputValor(n.nombre)"
                                (input)="onManualInputValor(n.nombre, $event)"
                              />
                            </td>
                            <td>
                              <select
                                class="select-editor"
                                [value]="getManualUnidad(n.nombre, n.unidad)"
                                (change)="onManualUnidadChange(n.nombre, $event)"
                              >
                                @for (
                                  u of getOpcionesUnidades(n.nombre, n.unidad);
                                  track u
                                ) {
                                  <option [value]="u">{{ u }}</option>
                                }
                              </select>
                            </td>
                            <td [style.color]="getManualColorVDR(n.nombre)">
                              {{ getManualVDR(n.nombre, n.unidad) }}
                            </td>
                          </tr>
                        }
                      }
                    </tbody>
                  </table>
                }
              }

              <button
                type="button"
                class="btn-compartir"
                style="margin-top:0.5rem;"
                (click)="compartirResultados()"
              >
                Compartir resultados
              </button>
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class MealSection implements OnInit, OnDestroy {
  readonly comida = input.required<string>();
  readonly service = inject(NutritionService);
  private readonly chartCanvas =
    viewChild<ElementRef<HTMLCanvasElement>>('chartCanvas');

  readonly categoriasAlimentos = CATEGORIAS_ALIMENTOS;
  readonly categoriaSeleccionada = signal('');
  readonly busquedaTexto = signal('');
  readonly pesoInput = signal('');
  readonly divisorTexto = signal('');
  readonly descripcionesAbiertas = signal<Record<string, boolean>>({});

  // Manual inputs temp
  readonly manualCantidades = signal<Record<string, number>>({});
  readonly manualUnidades = signal<Record<string, string>>({});

  private chartInstance: Chart<'doughnut'> | null = null;
  readonly categoriasTabla: CategoriaTabla[] = [];

  readonly userComidaKey = computed(() => {
    return `${this.service.usuarioActivo()}-${this.comida()}`;
  });

  readonly items = computed(() => {
    const key = this.userComidaKey();
    return this.service.datosComidas()[key] || [];
  });

  readonly totales = computed(() => {
    const [u, c] = this.userComidaKey().split('-');
    return this.service.calcularComida(u, c);
  });

  readonly seccionVisible = computed(() => {
    return this.service.getSeccionVisible(this.userComidaKey());
  });

  readonly mostrarTodosNutrientes = computed(() => {
    return (
      this.service.mostrarTodosLosNutrientes()[this.userComidaKey()] || false
    );
  });

  readonly editorManualAbierto = computed(() => {
    return this.service.editorManualVisible()[this.userComidaKey()] || false;
  });

  readonly sugerencias = computed(() => {
    const txt = this.busquedaTexto().toLowerCase().trim();
    if (!txt) return [];
    const cat = this.categoriaSeleccionada();
    return ALIMENTOS_BASE.filter(
      (a) =>
        a.nombre.toLowerCase().includes(txt) &&
        (!cat || a.categoria === cat)
    );
  });

  constructor() {
    afterNextRender(() => {
      this.renderOrUpdateChart();
    });

    effect(() => {
      // Re-render chart on items or visibility change
      const isVisible = this.seccionVisible().grafico;
      this.totales();
      if (isVisible) {
        setTimeout(() => this.renderOrUpdateChart(), 50);
      } else {
        this.destroyChart();
      }
    });
  }

  ngOnInit() {
    this.construirEstructuraTabla();
  }

  private construirEstructuraTabla() {
    for (const [catNombre, catContenido] of Object.entries(NUTRIENTES)) {
      const subcategorias: { nombre?: string; items: NutrienteItem[] }[] = [];

      const recorrer = (nodo: unknown, subNombre?: string) => {
        if (Array.isArray(nodo)) {
          subcategorias.push({
            nombre: subNombre,
            items: nodo as NutrienteItem[],
          });
        } else if (nodo && typeof nodo === 'object') {
          for (const [subKey, subVal] of Object.entries(nodo)) {
            recorrer(subVal, subKey);
          }
        }
      };

      recorrer(catContenido);
      this.categoriasTabla.push({
        categoria: catNombre,
        subcategorias,
      });
    }
  }

  onCategoriaChange(e: Event) {
    this.categoriaSeleccionada.set((e.target as HTMLSelectElement).value);
  }

  onBusquedaInput(e: Event) {
    this.busquedaTexto.set((e.target as HTMLInputElement).value);
  }

  onPesoInput(e: Event) {
    const input = e.target as HTMLInputElement;
    const clean = input.value.replace(/[^0-9.]/g, '');
    input.value = clean;
    this.pesoInput.set(clean);
  }

  onDivisorInput(e: Event) {
    this.divisorTexto.set((e.target as HTMLInputElement).value);
  }

  seleccionarAlimento(alimento: Alimento) {
    const pesoNum = parseFloat(this.pesoInput());
    if (isNaN(pesoNum) || pesoNum <= 0) {
      this.service.mostrarToast('Peso inválido. Ingresa un valor mayor a 0.');
      return;
    }

    const exito = this.service.agregarAlimento(
      this.userComidaKey(),
      alimento,
      pesoNum
    );
    if (exito) {
      this.busquedaTexto.set('');
      this.pesoInput.set('');
    }
  }

  eliminarAlimento(index: number) {
    this.service.eliminarAlimento(this.userComidaKey(), index);
  }

  revertirDivision() {
    this.service.revertirDivision(this.userComidaKey());
  }

  aplicarDivision() {
    const div = parseFloat(this.divisorTexto());
    this.service.dividirAlimentos(this.userComidaKey(), div);
  }

  toggleGrafico() {
    this.service.toggleGrafico(this.userComidaKey());
  }

  toggleSeccion() {
    this.service.toggleSeccion(this.userComidaKey());
  }

  toggleTabla() {
    this.service.toggleTabla(this.userComidaKey());
  }

  toggleNutrientesVacios() {
    this.service.toggleNutrientesVacios(this.userComidaKey());
  }

  toggleDescripcion(nombre: string) {
    const map = { ...this.descripcionesAbiertas() };
    map[nombre] = !map[nombre];
    this.descripcionesAbiertas.set(map);
  }

  // --- Helpers de display para alimentos agregados ---
  getNombreManual(display: string): string {
    const parts = (display || '').trim().split(' ');
    parts.pop(); // unidad
    parts.pop(); // cantidad
    return parts.join(' ');
  }

  getCantidadManual(display: string): string {
    const parts = (display || '').trim().split(' ');
    parts.pop(); // unidad
    return parts.pop() || '';
  }

  getUnidadManual(display: string): string {
    const parts = (display || '').trim().split(' ');
    return parts.pop() || '';
  }

  // --- Cálculos y valores de Nutrientes en Tabla ---
  esNutrienteVisible(nombre: string): boolean {
    if (this.mostrarTodosNutrientes()) return true;
    const v = this.totales()[nombre];
    return v != null && v !== 0;
  }

  tieneSubcategoriaVisible(sub: { items: NutrienteItem[] }): boolean {
    if (this.mostrarTodosNutrientes()) return true;
    return sub.items.some((n) => this.esNutrienteVisible(n.nombre));
  }

  tieneNutrientesVisibles(cat: CategoriaTabla): boolean {
    if (this.mostrarTodosNutrientes()) return true;
    return cat.subcategorias.some((sub) =>
      sub.items.some((n) => this.esNutrienteVisible(n.nombre))
    );
  }

  getValorFormateado(nombre: string): string {
    const rawVal = this.totales()[nombre];
    if (rawVal == null || rawVal === 0) return '0.00';
    if (Number.isInteger(rawVal)) return rawVal.toString();
    return rawVal.toFixed(2);
  }

  getPorcentajeVDR(nombre: string): string {
    if (
      nombre === 'pH (alimento)' ||
      nombre === 'pH estimado en estómago'
    ) {
      return '-';
    }
    const user = this.service.currentUsuario();
    const base = user?.vdr?.[nombre] || 0;
    if (!base) return '0.0%';
    const rawVal = this.totales()[nombre] || 0;
    return ((rawVal / base) * 100).toFixed(1) + '%';
  }

  getColorVDR(nombre: string): string {
    if (
      nombre === 'pH (alimento)' ||
      nombre === 'pH estimado en estómago'
    ) {
      return '#000';
    }
    const user = this.service.currentUsuario();
    const base = user?.vdr?.[nombre] || 0;
    if (!base) return COLORES_VDR.rojo;

    const rawVal = this.totales()[nombre] || 0;
    const p = (rawVal / base) * 100;
    const obj = user.distribucionVDR[this.comida()] || 25;
    const m = obj * 0.05;

    if (p >= obj - m && p <= obj + m) return COLORES_VDR.verde;
    if (
      (p >= obj - 2 * m && p < obj - m) ||
      (p > obj + m && p <= obj + 2 * m)
    ) {
      return COLORES_VDR.amarillo;
    }
    return COLORES_VDR.rojo;
  }

  // --- Editor Manual ---
  toggleEditorManual() {
    const key = this.userComidaKey();
    if (this.editorManualAbierto()) {
      // Aplicar
      this.aplicarManual();
      this.service.toggleEditorManual(key);
    } else {
      // Abrir: limpiar datos manuales
      this.manualCantidades.set({});
      this.manualUnidades.set({});
      this.service.toggleEditorManual(key);
    }
  }

  getOpcionesUnidades(nombre: string, unidadOriginal: string): string[] {
    const tipo = tipoUnidad(unidadOriginal);
    if (!tipo) return [unidadOriginal];
    let unidades = Object.keys(CONVERSIONES[tipo]);
    if (
      (tipo === 'masa' || tipo === 'volumen') &&
      nombre === 'Agua'
    ) {
      const extra = tipo === 'masa' ? 'volumen' : 'masa';
      unidades = [
        ...new Set([...unidades, ...Object.keys(CONVERSIONES[extra])]),
      ];
    }
    return unidades;
  }

  getManualInputValor(nombre: string): string {
    const v = this.manualCantidades()[nombre];
    return v !== undefined && v !== 0 ? v.toString() : '';
  }

  onManualInputValor(nombre: string, e: Event) {
    const input = e.target as HTMLInputElement;
    let clean = input.value.replace(/[^0-9.]/g, '');
    const partes = clean.split('.');
    if (partes.length > 2) clean = partes[0] + '.' + partes.slice(1).join('');
    if (clean.length > 7) clean = clean.slice(0, 7);
    input.value = clean;

    const num = parseFloat(clean) || 0;
    const map = { ...this.manualCantidades() };
    map[nombre] = num;
    this.manualCantidades.set(map);
  }

  getManualUnidad(nombre: string, unidadDefault: string): string {
    return this.manualUnidades()[nombre] || unidadDefault;
  }

  onManualUnidadChange(nombre: string, e: Event) {
    const sel = (e.target as HTMLSelectElement).value;
    const map = { ...this.manualUnidades() };
    map[nombre] = sel;
    this.manualUnidades.set(map);
  }

  getManualVDR(nombre: string, unidadOriginal: string): string {
    const user = this.service.currentUsuario();
    const base = user?.vdr?.[nombre] || 0;
    if (!base) return '0.0%';

    const valManual = this.manualCantidades()[nombre] || 0;
    const uActual = this.getManualUnidad(nombre, unidadOriginal);
    const converted = convertir(valManual, uActual, unidadOriginal);
    const actual = this.totales()[nombre] || 0;
    const total = actual + converted;

    return ((total / base) * 100).toFixed(1) + '%';
  }

  getManualColorVDR(nombre: string): string {
    const user = this.service.currentUsuario();
    const base = user?.vdr?.[nombre] || 0;
    if (!base) return COLORES_VDR.rojo;

    const nInfo = NUTRIENTES_PLANOS.find((n) => n.nombre === nombre);
    const uOriginal = nInfo?.unidad || 'g';
    const valManual = this.manualCantidades()[nombre] || 0;
    const uActual = this.getManualUnidad(nombre, uOriginal);
    const converted = convertir(valManual, uActual, uOriginal);
    const actual = this.totales()[nombre] || 0;
    const total = actual + converted;

    const p = (total / base) * 100;
    const obj = user.distribucionVDR[this.comida()] || 25;
    const m = obj * 0.05;

    if (p >= obj - m && p <= obj + m) return COLORES_VDR.verde;
    if (
      (p >= obj - 2 * m && p < obj - m) ||
      (p > obj + m && p <= obj + 2 * m)
    ) {
      return COLORES_VDR.amarillo;
    }
    return COLORES_VDR.rojo;
  }

  private aplicarManual() {
    const cantidades = this.manualCantidades();
    let hubo = false;

    for (const [nombre, cant] of Object.entries(cantidades)) {
      if (!cant || cant <= 0) continue;
      const nInfo = NUTRIENTES_PLANOS.find((n) => n.nombre === nombre);
      if (!nInfo) continue;

      const uIngresada = this.getManualUnidad(nombre, nInfo.unidad);
      const converted = convertir(cant, uIngresada, nInfo.unidad);

      // Check limit
      const actual = this.totales()[nombre] || 0;
      if (actual + converted > 9999999) {
        this.service.mostrarToast(
          `No se puede agregar "${nombre}", superaría el límite de 7 dígitos enteros.`
        );
        continue;
      }

      this.service.agregarAlimento(
        this.userComidaKey(),
        {
          nombre,
          categoria: 'Manual',
          unidad: uIngresada,
          esManual: true,
          displayManual: `${nombre} ${cant} ${uIngresada}`,
          composicion: { [nombre]: converted },
        },
        100
      );
      hubo = true;
    }

    if (hubo) {
      this.manualCantidades.set({});
      this.manualUnidades.set({});
    }
  }

  // --- Compartir Resultados ---
  compartirResultados() {
    const user = this.service.currentUsuario();
    const nombreUsuario = (user.nombreVisual || user.nombre).replace(
      /[^\p{L}\s]/gu,
      ''
    );
    const comidaNombre = this.comida();
    const titulo = `🍽️ ${comidaNombre} de ${nombreUsuario}`;
    let texto = `${titulo}\n\n`;

    const totales = this.totales();
    NUTRIENTES_PLANOS.forEach((n) => {
      const val = +(totales[n.nombre] || 0).toFixed(2);
      if (val === 0) return;

      const base = user.vdr[n.nombre] || 0;
      let porcTxt = '-';
      let icono = '';

      if (
        n.nombre !== 'pH (alimento)' &&
        n.nombre !== 'pH estimado en estómago'
      ) {
        if (base) {
          const porc = +((val / base) * 100).toFixed(1);
          porcTxt = porc + '%';

          const obj = user.distribucionVDR[comidaNombre] || 25;
          const m = obj * 0.05;
          icono =
            porc >= obj - m && porc <= obj + m
              ? '✔️'
              : (porc >= obj - 2 * m && porc < obj - m) ||
                  (porc > obj + m && porc <= obj + 2 * m)
                ? '❗'
                : '❌';
        }
      }

      texto += `${icono} ${n.nombre}: ${val} ${n.unidad} (${porcTxt})\n`;
    });

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(texto).catch((err: unknown) => {
        if (err) {
          // Clipboard write failed
        }
      });
    }

    const mensajeToast = `${
      comidaNombre.charAt(0).toUpperCase() + comidaNombre.slice(1)
    } de ${nombreUsuario} copiado correctamente.`;
    this.service.mostrarToast(mensajeToast);
  }

  // --- Compartir alimentos con perfiles ---
  abrirCompartirAlimentosModal() {
    const usuarioOrigen = this.service.usuarioActivo();
    const map = this.service.usuariosMap();
    const orden = this.service.ordenUsuarios();

    const todosHumanos = Object.keys(map).filter(
      (u) => u !== 'Calculadora Nutricional'
    );
    const listaOrdenada: string[] = [];
    orden.forEach((u) => {
      if (todosHumanos.includes(u) && !listaOrdenada.includes(u)) {
        listaOrdenada.push(u);
      }
    });
    todosHumanos.forEach((u) => {
      if (!listaOrdenada.includes(u)) {
        listaOrdenada.push(u);
      }
    });

    const otrosUsuarios = listaOrdenada.filter((u) => u !== usuarioOrigen);

    if (otrosUsuarios.length === 0) {
      this.service.mostrarToast('No hay otros usuarios para compartir');
      return;
    }

    const soloLetras = (str: string) => str.replace(/[^\p{L}\s]/gu, '');

    const perfilesOpciones: PerfilCompartirOpcion[] = otrosUsuarios.map((u) => {
      const nombreOriginal = map[u]?.nombreVisual || u;
      return {
        clave: u,
        nombre: soloLetras(nombreOriginal),
        seleccionado: true,
      };
    });

    this.service.mostrarModalCompartir(
      perfilesOpciones,
      (seleccionados: string[]) => {
        if (seleccionados.length === 0) {
          this.service.mostrarToast('No seleccionaste ningún usuario');
          return;
        }

        const items = this.items();
        if (items.length === 0) {
          this.service.mostrarToast('No hay alimentos para compartir');
          return;
        }

        const exitos: string[] = [];
        const bloqueados: { usuario: string; motivos: string[] }[] = [];

        for (const destUser of seleccionados) {
          const destTotales =
            this.service.calcularComida(destUser, this.comida()) || {};
          let falla = false;
          const motivos = new Set<string>();

          for (const i of items) {
            const peso = i.peso || 0;
            const compos = i.alimento?.composicion || {};
            for (const [nutriente, valorPor100] of Object.entries(compos)) {
              const incremento = valorPor100 * (peso / 100);
              const actual = (destTotales[nutriente] as number) || 0;
              if (actual + incremento > 9999999) {
                falla = true;
                motivos.add(nutriente);
              }
            }
          }

          if (falla) {
            bloqueados.push({
              usuario: destUser,
              motivos: Array.from(motivos),
            });
          } else {
            exitos.push(destUser);
          }
        }

        if (exitos.length > 0) {
          this.service.copiarAlimentosAUsuarios(
            exitos,
            this.comida(),
            items
          );

          const nombresExitos = exitos.map((u) =>
            soloLetras(map[u]?.nombreVisual || u)
          );
          this.service.mostrarToast(
            `
            <div style="
              width: 50vw;
              max-width: none;
              line-height: 1.2;
              text-align: center;
              font-family: inherit;
            ">
              <span style="display:block; font-weight:600;">Alimentos compartidos con:</span>
              <div style="text-align:left; margin-top:10px;">
                ${nombresExitos
                  .map(
                    (n) => `
                  <div style="display:flex; align-items:center; margin-bottom:2px;">
                    <span style="line-height:0;">●</span>
                    <span style="margin-left:2px;">${n}</span>
                  </div>
                `
                  )
                  .join('')}
              </div>
            </div>
          `,
            2000
          );
        }

        if (bloqueados.length > 0) {
          const nombresBloqueados = bloqueados
            .map((b) => {
              const nombre = soloLetras(
                map[b.usuario]?.nombreVisual || b.usuario
              );
              return `
                <div style="display:flex; align-items:center; margin-bottom:2px;">
                  <span style="line-height:0;">●</span>
                  <span style="margin-left:2px; color:black; font-weight:bold;">${nombre}</span>
                </div>
              `;
            })
            .join('');

          this.service.mostrarToast(
            `
            <div style="
              width: 50vw;
              max-width: none;
              line-height: 1.2;
              text-align: center;
              font-family: inherit;
            ">
              <span style="display:block; font-weight:600; margin-bottom:6px;">
                No se pudo compartir alimentos con:
              </span>
              <div style="text-align:left; margin-top:10px;">
                ${nombresBloqueados}
              </div>
              <div style="margin-top:10px;">
                Porque uno o más nutrientes superarían el límite de 10 millones.
              </div>
            </div>
          `,
            3000
          );
        }
      },
      () => {
        this.service.mostrarToast('Operación cancelada');
      }
    );
  }

  // --- Chart.js Rendering ---
  private renderOrUpdateChart() {
    if (typeof window === 'undefined') return;
    const canvas = this.chartCanvas()?.nativeElement;
    if (!canvas) return;

    const labels = ['Energía', 'Proteínas', 'Carbohidratos', 'Grasas totales'];
    const datos = labels.map((l) => (this.totales()[l] as number) || 0);

    if (!this.chartInstance) {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      this.chartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels,
          datasets: [
            {
              data: datos,
              backgroundColor: ['#00BCD4', '#4CAF50', '#FFEB3B', '#F44336'],
            },
          ],
        },
        options: {
          responsive: true,
          animation: { duration: 0 },
          plugins: {
            legend: {
              position: 'bottom',
              labels: { color: '#000' },
            },
          },
        },
      });
    } else {
      this.chartInstance.data.datasets[0].data = datos;
      this.chartInstance.update();
    }
  }

  private destroyChart() {
    if (this.chartInstance) {
      this.chartInstance.destroy();
      this.chartInstance = null;
    }
  }

  ngOnDestroy() {
    this.destroyChart();
  }
}
