import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import {
  NUTRIENTES,
  NutrienteItem,
  VDRMap,
} from '../../models/nutrition.models';
import { NutritionService } from '../../services/nutrition.service';

interface CategoriaVdrRender {
  categoria: string;
  subcategorias: {
    nombre?: string;
    items: NutrienteItem[];
  }[];
}

@Component({
  selector: 'app-vdr-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (service.panelAbierto() === 'panel') {
      <div id="panel" style="display:block;">
        <div class="barra">
          <button type="button" class="cerrar" (click)="cerrarVDR()">×</button>
          <h3>Personalizar VDR%</h3>
          <button type="button" (click)="confirmarGuardarVDR()">VDR%</button>
        </div>

        <div id="tabla-vdr">
          @for (cat of categoriasVdr; track cat.categoria) {
            <section style="margin: 0.5rem;">
              <table>
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
                      style="text-align:center; background:#f0f0f0; font-weight:600;"
                    >
                      {{ cat.categoria }}
                    </td>
                  </tr>

                  @for (sub of cat.subcategorias; track sub.nombre || $index) {
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
                            class="input-editor"
                            style="width:100%; border:none; text-align:center; background:transparent; font-size:.8rem;"
                            [value]="getValorNutriente(n.nombre)"
                            (input)="setValorNutriente(n.nombre, $event)"
                            placeholder="0.00"
                          />
                        </td>
                        <td>{{ n.unidad }}</td>
                        <td style="color:#2e7d32;">100%</td>
                      </tr>
                    }
                  }
                </tbody>
              </table>
            </section>
          }
        </div>
      </div>
    }
  `,
})
export class VdrPanel implements OnInit {
  readonly service = inject(NutritionService);
  readonly categoriasVdr: CategoriaVdrRender[] = [];
  readonly vdrTemp = signal<VDRMap>({});

  ngOnInit() {
    this.estructurarCategorias();
    this.resetearValoresTemp();
  }

  private resetearValoresTemp() {
    const user = this.service.currentUsuario();
    this.vdrTemp.set(user?.vdr ? { ...user.vdr } : {});
  }

  private estructurarCategorias() {
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
      this.categoriasVdr.push({
        categoria: catNombre,
        subcategorias,
      });
    }
  }

  getValorNutriente(nombre: string): string {
    const v = this.vdrTemp()[nombre];
    return typeof v === 'number' && !isNaN(v) ? v.toString() : '';
  }

  setValorNutriente(nombre: string, event: Event) {
    const input = event.target as HTMLInputElement;
    let valStr = input.value.replace(/[^0-9.]/g, '');
    if (valStr.length > 7) valStr = valStr.slice(0, 7);
    input.value = valStr;

    const num = parseFloat(valStr);
    const map = { ...this.vdrTemp() };
    if (!isNaN(num)) {
      map[nombre] = num;
    } else {
      delete map[nombre];
    }
    this.vdrTemp.set(map);
  }

  cerrarVDR() {
    this.service.setPanelAbierto(null);
  }

  confirmarGuardarVDR() {
    const usuario = this.service.usuarioActivo();
    this.service.mostrarConfirmacion('¿Quieres guardar los VDR%?', () => {
      this.service.actualizarVDRUsuario(usuario, this.vdrTemp());
      this.service.setPanelAbierto(null);
      this.service.mostrarToast('VDR% guardados correctamente.');
    });
  }
}
