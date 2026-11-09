import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NutritionService } from '../../services/nutrition.service';

@Component({
  selector: 'app-top-bar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="barra">
      <button
        type="button"
        class="cerrar"
        (click)="abrirPanelPerfiles()"
        aria-label="Abrir perfiles"
      >
        +
      </button>
      <h3 class="titulo-calculadora">
        {{ service.currentUsuario()?.nombreVisual || 'Calculadora Nutricional' }}
      </h3>
      <button
        type="button"
        (click)="abrirPanelVDR()"
        aria-label="Personalizar VDR"
      >
        VDR%
      </button>
    </header>
  `,
})
export class TopBar {
  readonly service = inject(NutritionService);

  abrirPanelPerfiles() {
    this.service.setPanelAbierto('panel1');
  }

  abrirPanelVDR() {
    this.service.setPanelAbierto('panel');
  }
}
