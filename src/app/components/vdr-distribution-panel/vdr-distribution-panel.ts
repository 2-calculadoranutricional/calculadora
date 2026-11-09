import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import {
  COMIDAS,
  DISTRIBUCION_VDR_DEFAULT,
  DistribucionVDR,
} from '../../models/nutrition.models';
import { NutritionService } from '../../services/nutrition.service';

@Component({
  selector: 'app-vdr-distribution-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (service.panelAbierto() === 'panel2') {
      <div id="panel2" style="display:block;">
        <div class="barra">
          <button type="button" class="cerrar" (click)="cerrarDistribucion()">
            ×
          </button>
          <h3>Distribución VDR%</h3>
          <button type="button" (click)="confirmarGuardarDistribucion()">
            VDR%
          </button>
        </div>

        <div id="tabla-distribucion-vdr">
          <section style="margin: 0.5rem;">
            <table>
              <thead>
                <tr>
                  <th>Comidas / Total</th>
                  <th>Cantidad</th>
                  <th>Unidad</th>
                  <th>VDR%</th>
                </tr>
              </thead>
              <tbody>
                @for (c of filasComidas; track c) {
                  <tr>
                    <td>{{ c }}</td>
                    <td>0.00</td>
                    <td>g</td>
                    <td style="color:#2e7d32;">
                      @if (c === 'Total') {
                        <span>100%</span>
                      } @else {
                        <input
                          type="text"
                          inputmode="decimal"
                          style="width: 38px; border:none; text-align:right; background:transparent; font-size:.8rem; font-weight:600; color:#2e7d32;"
                          [value]="distribucionTemp()[c] ?? 25"
                          (input)="setValorDistribucion(c, $event)"
                          maxlength="3"
                        />%
                      }
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </section>
        </div>
      </div>
    }
  `,
})
export class VdrDistributionPanel implements OnInit {
  readonly service = inject(NutritionService);
  readonly filasComidas = [...COMIDAS, 'Total'];
  readonly distribucionTemp = signal<DistribucionVDR>({
    ...DISTRIBUCION_VDR_DEFAULT,
  });

  ngOnInit() {
    this.resetearValoresTemp();
  }

  private resetearValoresTemp() {
    const user = this.service.currentUsuario();
    this.distribucionTemp.set(
      user?.distribucionVDR
        ? { ...user.distribucionVDR }
        : { ...DISTRIBUCION_VDR_DEFAULT }
    );
  }

  setValorDistribucion(comida: string, event: Event) {
    const input = event.target as HTMLInputElement;
    let valStr = input.value.replace(/[^0-9.]/g, '');
    if (valStr.length > 3) valStr = valStr.slice(0, 3);
    input.value = valStr;

    const num = parseFloat(valStr);
    const map = { ...this.distribucionTemp() };
    map[comida] = !isNaN(num) ? num : 0;
    this.distribucionTemp.set(map);
  }

  cerrarDistribucion() {
    this.resetearValoresTemp();
    this.service.setPanelAbierto('panel1');
  }

  confirmarGuardarDistribucion() {
    const usuario = this.service.usuarioActivo();
    this.service.mostrarConfirmacion('¿Quieres guardar los VDR%?', () => {
      this.service.actualizarDistribucionVDR(usuario, this.distribucionTemp());
      this.service.setPanelAbierto(null);
      this.service.mostrarToast('VDR% guardados correctamente.');
    });
  }
}
