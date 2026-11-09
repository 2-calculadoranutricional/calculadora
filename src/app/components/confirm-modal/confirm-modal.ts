import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import {
  NutritionService,
  PerfilCompartirOpcion,
} from '../../services/nutrition.service';

@Component({
  selector: 'app-confirm-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (modal()) {
      <div
        id="alerta-modal"
        class="mostrar"
        (click)="clickFondo($event)"
        (keydown.escape)="cancelar()"
        tabindex="0"
        role="dialog"
        aria-modal="true"
      >
        <div class="alerta-contenido">
          @if (modal()?.perfilesCompartir) {
            <p
              id="alerta-texto"
              style="margin-bottom:8px; font-weight:600; font-size:.8rem; color:grey;"
            >
              Compartir alimentos con:
            </p>
            <div style="margin-bottom: 12px;">
              @for (p of modal()!.perfilesCompartir; track p.clave) {
                <label
                  class="compartir-opcion"
                  (click)="togglePerfil(p, $event)"
                  (keydown.space)="togglePerfil(p, $event)"
                  (keydown.enter)="togglePerfil(p, $event)"
                  tabindex="0"
                >
                  <input
                    type="checkbox"
                    class="compartir-check"
                    [value]="p.clave"
                    [checked]="p.seleccionado"
                    (click)="$event.stopPropagation()"
                    (change)="onCheckboxChange(p, $event)"
                  />
                  <span style="color: black; font-weight: bold;">{{
                    p.nombre
                  }}</span>
                </label>
              }
            </div>
          } @else {
            <p id="alerta-texto" [innerHTML]="mensajeSeguro()"></p>
          }

          <div
            style="display:flex; justify-content:center; gap:12px; margin-top:1rem;"
          >
            <button
              id="alerta-cancelar"
              type="button"
              (click)="cancelar()"
            >
              Cancelar
            </button>
            <button
              id="alerta-aceptar"
              type="button"
              [style.color]="modal()?.colorTexto || '#000'"
              (click)="aceptar()"
            >
              {{ modal()?.textoAceptar || (modal()?.perfilesCompartir ? 'Aceptar' : 'Eliminar') }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class ConfirmModal {
  private readonly service = inject(NutritionService);
  private readonly sanitizer = inject(DomSanitizer);
  readonly modal = this.service.modalActivo;

  readonly mensajeSeguro = computed<SafeHtml>(() => {
    const raw = this.modal()?.mensaje || '';
    return this.sanitizer.bypassSecurityTrustHtml(raw);
  });

  togglePerfil(p: PerfilCompartirOpcion, e?: Event) {
    if (e) {
      e.preventDefault();
    }
    p.seleccionado = !p.seleccionado;
  }

  onCheckboxChange(p: PerfilCompartirOpcion, e: Event) {
    const input = e.target as HTMLInputElement;
    p.seleccionado = input.checked;
  }

  clickFondo(e: MouseEvent) {
    if ((e.target as HTMLElement).id === 'alerta-modal') {
      this.cancelar();
    }
  }

  aceptar() {
    const m = this.modal();
    if (m?.onAceptarCompartir && m.perfilesCompartir) {
      const seleccionados = m.perfilesCompartir
        .filter((p) => p.seleccionado)
        .map((p) => p.clave);
      m.onAceptarCompartir(seleccionados);
    } else if (m?.onAceptar) {
      m.onAceptar();
    }
    this.service.cerrarModal();
  }

  cancelar() {
    const m = this.modal();
    if (m?.onCancelar) {
      m.onCancelar();
    }
    this.service.cerrarModal();
  }
}
