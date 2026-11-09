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
  signal,
  viewChild,
} from '@angular/core';
import { Chart } from 'chart.js';
import {
  COLORES_VDR,
  COMIDAS,
  NUTRIENTES,
  NUTRIENTES_PLANOS,
  NutrienteItem,
  SISTEMAS_CUERPO,
} from '../../models/nutrition.models';
import { NutritionService } from '../../services/nutrition.service';

interface CategoriaTabla {
  categoria: string;
  subcategorias: {
    nombre?: string;
    items: NutrienteItem[];
  }[];
}

@Component({
  selector: 'app-total-section',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (debeMostrarTotal()) {
      <div
        class="section"
        id="total-seccion"
        style="margin: 0.5rem; padding-bottom: 2rem;"
      >
        <h4>Total</h4>
        <div class="contenedor0">
          <div>
            <button type="button" (click)="toggleSeccion()">
              Gráfico-Tablas-Perfiles
            </button>
          </div>
          <button type="button" (click)="toggleGrafico()">
            {{
              seccionVisible().grafico ? 'Ocultar gráfico' : 'Mostrar gráfico'
            }}
          </button>
          <button type="button" (click)="toggleTabla()">
            {{ seccionVisible().tabla ? 'Ocultar tabla' : 'Mostrar tabla' }}
          </button>
          <button type="button" (click)="togglePerfiles()">
            {{
              seccionVisible().perfiles
                ? 'Ocultar perfiles'
                : 'Mostrar perfiles'
            }}
          </button>
        </div>

        <!-- GRÁFICO TOTAL -->
        @if (seccionVisible().grafico) {
          <div style="margin-top: 1rem; text-align:center;">
            <h5>Gráfico Nutricional</h5>
            <div style="max-width: 320px; margin: 0 auto;">
              <canvas #chartCanvas></canvas>
            </div>
          </div>
        }

        <!-- TABLA NUTRICIONAL TOTAL -->
        @if (seccionVisible().tabla) {
          <div style="margin-top: 1rem;" class="contenedor0">
            <h5>Tabla Nutricional</h5>
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

                    @for (sub of cat.subcategorias; track sub.nombre || $index) {
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
                            <td [style.color]="getColorVDRTotal(n.nombre)">
                              {{ getPorcentajeVDRTotal(n.nombre) }}
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

            <button
              type="button"
              class="btn-compartir"
              style="margin-top:0.5rem;"
              (click)="compartirResultadosTotal()"
            >
              Compartir resultados
            </button>
          </div>
        }

        <!-- SECCIÓN 2: SISTEMAS DEL CUERPO HUMANO -->
        @if (seccionVisible().perfiles) {
          <div style="margin-top: 1.5rem;">
            <h3>Sistemas del cuerpo humano</h3>
            @for (sis of sistemasCuerpoList; track sis.categoria) {
              <div class="section perfil-funcional" style="margin-bottom: 1rem;">
                <section>
                  <h4 style="text-align:center;">{{ sis.categoria }}</h4>
                  @for (sub of sis.subcategorias; track sub.nombre) {
                    <h5 style="text-align:left; margin-bottom:0.5rem;">
                      {{ sub.nombre }}
                    </h5>
                    <table class="tabla" style="margin-bottom:1rem;">
                      <thead>
                        <tr>
                          <th>Nutriente</th>
                          <th>Cantidad</th>
                          <th>Unidad</th>
                          <th>VDR%</th>
                        </tr>
                      </thead>
                      <tbody>
                        @for (nutriente of sub.nutrientes; track nutriente) {
                          @let valor = getValorNutrienteSistema(nutriente);
                          @let unidad = getUnidadNutrienteSistema(nutriente);
                          @let porc = getVdrSistema(nutriente);
                          <tr [attr.data-nutriente]="nutriente">
                            <td>{{ nutriente }}</td>
                            <td class="cantidad">{{ valor }}</td>
                            <td class="unidad">{{ unidad }}</td>
                            <td
                              class="vdr"
                              [style.color]="getColorSistema(nutriente)"
                            >
                              {{ porc }}
                            </td>
                          </tr>
                        }
                      </tbody>
                    </table>
                  }
                </section>
              </div>
            }
          </div>
        }
      </div>
    }
  `,
})
export class TotalSection implements OnInit, OnDestroy {
  readonly service = inject(NutritionService);
  private readonly chartCanvas =
    viewChild<ElementRef<HTMLCanvasElement>>('chartCanvas');

  readonly descripcionesAbiertas = signal<Record<string, boolean>>({});
  private chartInstance: Chart<'doughnut'> | null = null;
  readonly categoriasTabla: CategoriaTabla[] = [];

  readonly totalKey = computed(() => {
    return `total-${this.service.usuarioActivo()}`;
  });

  readonly totales = computed(() => {
    return this.service.calcularComida(this.service.usuarioActivo(), 'total');
  });

  readonly seccionVisible = computed(() => {
    return this.service.getSeccionVisible(this.totalKey());
  });

  readonly debeMostrarTotal = computed(() => {
    const user = this.service.usuarioActivo();
    const map = this.service.datosComidas();
    const comidasConAlimentos = COMIDAS.filter(
      (c) => (map[`${user}-${c}`] || []).length > 0
    );
    return comidasConAlimentos.length >= 2;
  });

  readonly sistemasCuerpoList: {
    categoria: string;
    subcategorias: { nombre: string; nutrientes: string[] }[];
  }[] = [];

  constructor() {
    afterNextRender(() => {
      this.renderOrUpdateChart();
    });

    effect(() => {
      const debe = this.debeMostrarTotal();
      const isVisible = this.seccionVisible().grafico;
      this.totales();
      if (debe && isVisible) {
        setTimeout(() => this.renderOrUpdateChart(), 50);
      } else {
        this.destroyChart();
      }
    });
  }

  ngOnInit() {
    this.construirEstructuraTabla();
    this.construirEstructuraSistemas();
  }

  private construirEstructuraTabla() {
    for (const [catNombre, catContenido] of Object.entries(NUTRIENTES)) {
      if (catNombre.toLowerCase().includes('fisicoquímicas')) continue;

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

  private construirEstructuraSistemas() {
    Object.entries(SISTEMAS_CUERPO).forEach(([cat, subs]) => {
      const subList: { nombre: string; nutrientes: string[] }[] = [];
      Object.entries(subs).forEach(([subNombre, nuts]) => {
        subList.push({ nombre: subNombre, nutrientes: nuts });
      });
      this.sistemasCuerpoList.push({
        categoria: cat,
        subcategorias: subList,
      });
    });
  }

  toggleSeccion() {
    this.service.toggleSeccion(this.totalKey());
  }

  toggleGrafico() {
    this.service.toggleGrafico(this.totalKey());
  }

  toggleTabla() {
    this.service.toggleTabla(this.totalKey());
  }

  togglePerfiles() {
    this.service.togglePerfiles(this.service.usuarioActivo());
  }

  toggleDescripcion(nombre: string) {
    const map = { ...this.descripcionesAbiertas() };
    map[nombre] = !map[nombre];
    this.descripcionesAbiertas.set(map);
  }

  esNutrienteVisible(nombre: string): boolean {
    const v = this.totales()[nombre];
    return v != null && v !== 0;
  }

  tieneSubcategoriaVisible(sub: { items: NutrienteItem[] }): boolean {
    return sub.items.some((n) => this.esNutrienteVisible(n.nombre));
  }

  tieneNutrientesVisibles(cat: CategoriaTabla): boolean {
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

  getPorcentajeVDRTotal(nombre: string): string {
    const user = this.service.currentUsuario();
    const base = user?.vdr?.[nombre] || 0;
    if (!base) return '0.0%';
    const rawVal = this.totales()[nombre] || 0;
    return ((rawVal / base) * 100).toFixed(1) + '%';
  }

  getColorVDRTotal(nombre: string): string {
    const user = this.service.currentUsuario();
    const base = user?.vdr?.[nombre] || 0;
    if (!base) return COLORES_VDR.rojo;

    const rawVal = this.totales()[nombre] || 0;
    const p = (rawVal / base) * 100;

    if (p >= 95 && p <= 105) return COLORES_VDR.verde;
    if ((p >= 90 && p < 95) || (p > 105 && p <= 110)) {
      return COLORES_VDR.amarillo;
    }
    return COLORES_VDR.rojo;
  }

  // --- Sistemas ---
  getValorNutrienteSistema(nombre: string): string {
    const v = this.totales()[nombre] || 0;
    return v !== 0 ? v.toFixed(2) : '0.00';
  }

  getUnidadNutrienteSistema(nombre: string): string {
    return NUTRIENTES_PLANOS.find((n) => n.nombre === nombre)?.unidad || '';
  }

  getVdrSistema(nombre: string): string {
    const user = this.service.currentUsuario();
    const base = user?.vdr?.[nombre] || 0;
    if (!base) return '0.0%';
    const v = this.totales()[nombre] || 0;
    return ((v / base) * 100).toFixed(1) + '%';
  }

  getColorSistema(nombre: string): string {
    const user = this.service.currentUsuario();
    const base = user?.vdr?.[nombre] || 0;
    if (!base) return COLORES_VDR.rojo;
    const v = this.totales()[nombre] || 0;
    const p = (v / base) * 100;
    if (p >= 95 && p <= 105) return COLORES_VDR.verde;
    if ((p >= 90 && p < 95) || (p > 105 && p <= 110)) {
      return COLORES_VDR.amarillo;
    }
    return COLORES_VDR.rojo;
  }

  compartirResultadosTotal() {
    const user = this.service.currentUsuario();
    const nombreUsuario = (user.nombreVisual || user.nombre).replace(
      /[^\p{L}\s]/gu,
      ''
    );
    const titulo = `📊 Resultados Totales de ${nombreUsuario}`;
    let texto = `${titulo}\n\n`;

    const totales = this.totales();
    NUTRIENTES_PLANOS.forEach((n) => {
      const val = +(totales[n.nombre] || 0).toFixed(2);
      if (val === 0) return;

      const base = user.vdr[n.nombre] || 0;
      let porcTxt = '-';
      let icono = '';

      if (base) {
        const porc = +((val / base) * 100).toFixed(1);
        porcTxt = porc + '%';
        icono =
          porc >= 95 && porc <= 105
            ? '✔️'
            : (porc >= 90 && porc < 95) || (porc > 105 && porc <= 110)
              ? '❗'
              : '❌';
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

    this.service.mostrarToast(
      `Total de ${nombreUsuario} copiado correctamente.`
    );
  }

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
