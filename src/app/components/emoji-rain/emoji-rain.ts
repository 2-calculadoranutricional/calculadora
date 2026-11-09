import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  effect,
  inject,
  viewChild,
} from '@angular/core';
import { NutritionService } from '../../services/nutrition.service';

const EMOJIS_COMIDA = [
  '🍏', '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈', '🍒', '🍑', '🥭', '🍍',
  '🥥', '🥝', '🍅', '🍆', '🥑', '🫛', '🥦', '🥬', '🥒', '🌶️', '🫑', '🌽', '🥕', '🫒', '🧄',
  '🧅', '🥔', '🍠', '🫚', '🥐', '🥯', '🍞', '🥖', '🥨', '🧀', '🥚', '🍳', '🧈', '🥞',
  '🧇', '🥓', '🥩', '🍗', '🍖', '🦴', '🌭', '🍔', '🍟', '🍕', '🫓', '🥪', '🥙', '🧆', '🌮',
  '🌯', '🫔', '🥗', '🥘', '🫕', '🥫', '🫙', '🍝', '🍜', '🍲', '🍛', '🍣', '🍱', '🥟', '🦪',
  '🍤', '🍙', '🍚', '🍘', '🍥', '🥠', '🥮', '🍢', '🍡', '🍧', '🍨', '🍦', '🥧', '🧁', '🍰',
  '🎂', '🍮', '🍭', '🍬', '🍫', '🍿', '🍩', '🍪', '🌰', '🥜', '🫘',
];

interface EmojiItemFall {
  el: HTMLElement;
  y: number;
  velocidad: number;
}

const AUDIO_BASE64 =
  'data:audio/mpeg;base64,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';

@Component({
  selector: 'app-emoji-rain',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (service.lluviaActiva()) {
      <div
        #rainContainer
        id="lluvia-emojis"
        style="position:fixed; top:0; left:0; width:100%; height:100%; pointer-events:none; overflow:hidden; z-index:9999;"
      ></div>
    }
  `,
})
export class EmojiRain implements OnDestroy {
  readonly service = inject(NutritionService);
  private readonly rainContainer = viewChild<ElementRef<HTMLElement>>('rainContainer');

  private emojisActivos: EmojiItemFall[] = [];
  private spawnInterval: ReturnType<typeof setInterval> | null = null;
  private animFrameId: number | null = null;
  private audioBite: HTMLAudioElement | null = null;

  constructor() {
    effect(() => {
      const activa = this.service.lluviaActiva();
      if (activa) {
        setTimeout(() => this.iniciarLluvia(), 50);
      } else {
        this.detenerLluvia();
      }
    });
  }

  private initAudio() {
    if (!this.audioBite && typeof window !== 'undefined') {
      try {
        this.audioBite = new Audio(AUDIO_BASE64);
        this.audioBite.volume = 0.5;
      } catch {
        // audio deshabilitado
      }
    }
  }

  private iniciarLluvia() {
    this.detenerLluvia();
    this.initAudio();

    this.spawnInterval = setInterval(() => {
      this.crearEmoji();
    }, 1200);

    this.animar();
  }

  private crearEmoji() {
    const container = this.rainContainer()?.nativeElement;
    if (!container || typeof window === 'undefined') return;

    const span = document.createElement('span');
    const fontSize = 48;
    span.innerText =
      EMOJIS_COMIDA[Math.floor(Math.random() * EMOJIS_COMIDA.length)];
    span.style.position = 'absolute';
    span.style.top = '0px';
    span.style.fontSize = `${fontSize}px`;
    span.style.filter = 'drop-shadow(0 0 2px rgba(0, 0, 0, 0.7))';
    span.style.willChange = 'transform';
    span.style.pointerEvents = 'auto';
    span.style.cursor = 'pointer';

    const maxLeft = Math.max(0, window.innerWidth - fontSize);
    span.style.left = `${Math.random() * maxLeft}px`;

    span.onclick = (e) => {
      e.stopPropagation();
      if (this.audioBite) {
        if (!this.audioBite.paused) {
          this.audioBite.pause();
          this.audioBite.currentTime = 0;
        }
        this.audioBite.play().catch((err: unknown) => {
          if (err) {
            // Audio playback silenced
          }
        });
      }
      span.remove();
      this.emojisActivos = this.emojisActivos.filter((item) => item.el !== span);
    };

    container.appendChild(span);
    this.emojisActivos.push({
      el: span,
      y: -fontSize,
      velocidad: 1 + Math.random() * 1,
    });
  }

  private animar = () => {
    if (!this.service.lluviaActiva() || typeof window === 'undefined') return;

    const alturaViewport = window.innerHeight;
    for (let i = this.emojisActivos.length - 1; i >= 0; i--) {
      const e = this.emojisActivos[i];
      e.y += e.velocidad;
      e.el.style.transform = `translate3d(0, ${e.y}px, 0)`;

      if (e.y > alturaViewport + 50) {
        e.el.remove();
        this.emojisActivos.splice(i, 1);
      }
    }

    this.animFrameId = requestAnimationFrame(this.animar);
  };

  private detenerLluvia() {
    if (this.spawnInterval) {
      clearInterval(this.spawnInterval);
      this.spawnInterval = null;
    }
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    this.emojisActivos.forEach((e) => e.el.remove());
    this.emojisActivos = [];
  }

  ngOnDestroy() {
    this.detenerLluvia();
  }
}
