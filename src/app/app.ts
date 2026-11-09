import {
  ChangeDetectionStrategy,
  Component,
  afterNextRender,
  inject,
} from '@angular/core';
import { ConfirmModal } from './components/confirm-modal/confirm-modal';
import { EmojiRain } from './components/emoji-rain/emoji-rain';
import { MealSection } from './components/meal-section/meal-section';
import { ProfilesPanel } from './components/profiles-panel/profiles-panel';
import { Toast } from './components/toast/toast';
import { TopBar } from './components/top-bar/top-bar';
import { TotalSection } from './components/total-section/total-section';
import { VdrDistributionPanel } from './components/vdr-distribution-panel/vdr-distribution-panel';
import { VdrPanel } from './components/vdr-panel/vdr-panel';
import { COMIDAS } from './models/nutrition.models';
import { NutritionService } from './services/nutrition.service';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TopBar,
    ProfilesPanel,
    VdrPanel,
    VdrDistributionPanel,
    MealSection,
    TotalSection,
    ConfirmModal,
    Toast,
    EmojiRain,
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  readonly service = inject(NutritionService);
  readonly comidas = COMIDAS;

  constructor() {
    afterNextRender(() => {
      document.addEventListener('fullscreenchange', () => {
        const barras = document.querySelectorAll<HTMLElement>('.barra');
        barras.forEach((b) => {
          if (document.fullscreenElement) {
            b.style.height = `calc(${getComputedStyle(b).height} + 1.5rem)`;
            b.style.paddingTop = '1.5rem';
          } else {
            b.style.height = '';
            b.style.paddingTop = '';
          }
        });
      });
    });
  }
}
