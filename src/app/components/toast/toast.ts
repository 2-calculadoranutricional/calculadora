import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { NutritionService } from '../../services/nutrition.service';

@Component({
  selector: 'app-toast',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (currentToast()) {
      <div
        id="toast"
        class="mostrar"
        (click)="service.cerrarToast()"
        (keydown.escape)="service.cerrarToast()"
        role="alert"
        aria-live="polite"
        tabindex="0"
      >
        <div
          class="toast-contenido"
          [innerHTML]="mensajeSeguro()"
        ></div>
      </div>
    }
  `,
})
export class Toast {
  readonly service = inject(NutritionService);
  private readonly sanitizer = inject(DomSanitizer);
  readonly currentToast = this.service.currentToast;

  readonly mensajeSeguro = computed<SafeHtml>(() => {
    const raw = this.currentToast()?.mensaje || '';
    return this.sanitizer.bypassSecurityTrustHtml(raw);
  });
}
