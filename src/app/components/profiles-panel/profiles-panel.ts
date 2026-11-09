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
import Sortable from 'sortablejs';
import {
  CATEGORIAS_EMOJIS,
  EmojiItem,
  TONOS_PIEL,
  aplicarTono,
  soportaTonos,
  stripSkinTones,
} from '../../models/emoji.data';
import { UsuarioPerfil } from '../../models/nutrition.models';
import { NutritionService } from '../../services/nutrition.service';

interface CategoriaEmojiRender {
  categoria: string;
  items: EmojiItem[];
}

@Component({
  selector: 'app-profiles-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      id="panel1"
      [style.display]="service.panelAbierto() === 'panel1' ? 'block' : 'none'"
    >
      <!-- VISTA PRINCIPAL (LISTA DE PERFILES) -->
      <div
        id="panel1-vista-principal"
        [style.display]="editorAbierto() ? 'none' : 'block'"
      >
        <div class="barra">
          <button
            type="button"
            class="cerrar"
            (click)="cerrarPanel()"
            aria-label="Cerrar panel"
          >
            ×
          </button>
          <h3 class="titulo-calculadora">Calculadora Nutricional</h3>
          <button type="button" (click)="abrirDistribucionVDR()">
            VDR%
          </button>
        </div>

        <!-- LISTA DE USUARIOS -->
        <div class="menu-izquierdo">
          <div
            #listaUsuariosDiv
            id="lista-usuarios"
            [class.con-perfiles]="perfilesHumanos().length > 0"
          >
            @for (u of perfilesHumanos(); track u.nombre) {
              <div
                class="perfil-card"
                [class.active]="u.nombre === service.usuarioActivo()"
                [attr.data-nombre]="u.nombre"
                (click)="seleccionarUsuario(u.nombre)"
                (keydown.enter)="seleccionarUsuario(u.nombre)"
                role="button"
                tabindex="0"
              >
                <div class="perfil-avatar">
                  <span class="emoji">{{ u.emoji || '🙂' }}</span>
                  <p>{{ limpiarNombre(u.nombreVisual) }}</p>
                </div>
              </div>
            }

            <!-- BOTÓN CREAR PERFIL -->
            <div
              class="perfil-card add"
              (click)="abrirEditorNuevoUsuario()"
              (keydown.enter)="abrirEditorNuevoUsuario()"
              role="button"
              tabindex="0"
            >
              <div class="perfil-avatar add">
                <span class="emoji">+</span>
                <p>Crear perfil</p>
              </div>
            </div>
          </div>
        </div>

        <!-- BOTÓN EDITAR PERFILES -->
        @if (perfilesHumanos().length > 0) {
          <div style="text-align:center;">
            <button
              type="button"
              id="btn-editar-perfiles"
              style="margin-top:2rem; padding:14px 14px; font-weight:bold; font-size:1rem; border-radius:3rem; background:#000000; color:white; border: 1px solid #000000; cursor:pointer;"
              (click)="abrirEditorUsuarioActivo()"
            >
              Editar perfiles
            </button>
          </div>
        }
      </div>

      <!-- EDITOR DE USUARIO -->
      <div
        id="editor-usuario"
        [style.display]="editorAbierto() ? 'block' : 'none'"
      >
        <div class="barra">
          @if (esModoEdicion()) {
            <button
              type="button"
              id="btn-eliminar-usuario"
              style="color:red;"
              (click)="confirmarEliminarUsuario()"
            >
              Eliminar
            </button>
          } @else {
            <button
              type="button"
              id="btn-cancelar"
              (click)="cerrarEditorUsuario()"
            >
              Cancelar
            </button>
          }
          <h3 id="titulo-editor">
            {{ esModoEdicion() ? 'Editar perfil' : 'Nuevo perfil' }}
          </h3>
          <button
            type="button"
            id="btn-guardar-usuario"
            (click)="guardarUsuario()"
          >
            Guardar
          </button>
        </div>

        <div class="datos-usuario">
          <div
            id="avatar-preview"
            class="perfil-avatar"
            style="margin:0 auto; font-size:4rem;"
          >
            {{ avatarSeleccionado() }}
          </div>

          <!-- NOMBRE -->
          <div class="campo-integrado campo-nombre">
            <label for="input-nombre-usuario">Nombre</label>
            <input
              id="input-nombre-usuario"
              type="text"
              class="input-integrado w-full text-center"
              maxlength="23"
              [value]="formNombre()"
              (input)="onNombreInput($event)"
              placeholder="Nombre del perfil"
            />
          </div>

          <!-- FILA CAMPOS -->
          <div class="fila-campos">
            <!-- FECHA NACIMIENTO -->
            <div class="campo-integrado">
              <label for="input-fecha">Fecha de nacimiento</label>
              <input
                id="input-fecha"
                type="text"
                class="input-integrado w-full text-center"
                maxlength="10"
                [value]="formFecha()"
                (input)="onFechaInput($event)"
                placeholder="Ej: 14/01/1997"
              />
            </div>

            <!-- EDAD -->
            <div class="campo-integrado">
              <label for="input-edad">Edad</label>
              <input
                id="input-edad"
                type="text"
                inputmode="decimal"
                class="input-integrado w-full text-center"
                maxlength="3"
                [value]="formEdad() !== null ? formEdad() : ''"
                (input)="onEdadInput($event)"
                placeholder="Ej: 28 (años)"
              />
            </div>

            <!-- ALTURA -->
            <div class="campo-integrado">
              <label for="input-altura">Altura</label>
              <input
                id="input-altura"
                type="text"
                inputmode="decimal"
                class="input-integrado w-full text-center"
                maxlength="3"
                [value]="formAltura() !== null ? formAltura() : ''"
                (input)="onAlturaInput($event)"
                placeholder="Ej: 178 (cm)"
              />
            </div>

            <!-- PESO -->
            <div class="campo-integrado">
              <label for="input-peso">Peso</label>
              <input
                id="input-peso"
                type="text"
                inputmode="decimal"
                class="input-integrado w-full text-center"
                maxlength="3"
                [value]="formPeso() !== null ? formPeso() : ''"
                (input)="onPesoInput($event)"
                placeholder="Ej: 65 (kg)"
              />
            </div>
          </div>
        </div>

        <!-- LISTA EMOJIS -->
        <div
          id="lista-emojis"
          style="display:flex; flex-direction:column; margin-top:1rem; padding: 0 1rem;"
        >
          @for (cat of categoriasEmojisRender; track cat.categoria) {
            <p
              style="font-weight:bold; margin:0.5rem 0 0.2rem 0; font-size:1rem;"
            >
              {{ cat.categoria }}
            </p>
            <div
              class="fila-emoji"
              style="height:65px; display:flex; align-items:center; overflow-x:auto; overflow-y:hidden; gap:4px; margin-bottom:1rem;"
            >
              @for (item of cat.items; track $index) {
                @let baseEmoji = getBaseEmojiString(item);
                <span
                  class="emoji-item"
                  style="font-size:3rem; user-select:none; position:relative; cursor:pointer;"
                  role="button"
                  tabindex="0"
                  (click)="seleccionarEmoji(item)"
                  (keydown.enter)="seleccionarEmoji(item)"
                  (contextmenu)="abrirTonePicker(item, $event)"
                >
                  {{ baseEmoji }}
                  @if (permitePicker(item)) {
                    <span
                      style="position:absolute; width:0; height:0; border-left:5px solid transparent; border-right:5px solid transparent; border-top:5px solid rgba(0,0,0,0.2); bottom:4px; right:4px; transform:rotate(-45deg);"
                    ></span>
                  }
                </span>
              }
            </div>
          }
        </div>
      </div>

      <!-- PAPELERA FLOTANTE -->
      <div
        #trashBin
        id="trash-bin"
        style="display:none; position:fixed; top:50%; left:50%; transform:translate(-50%, -50%); font-size:4rem; z-index:1000; pointer-events:none; filter:drop-shadow(0 0 1px rgba(0,0,0,0.5)); transition:transform .12s ease;"
      >
        🗑️
      </div>

      <!-- TONE PICKER DIALOG -->
      @if (tonePickerVisible()) {
        <div
          id="tone-picker"
          style="position:fixed; background:#f9f9f9; border:1px solid #ccc; border-radius:10px; padding:6px; z-index:2000; display:flex; gap:6px; align-items:center; box-shadow: 0 4px 12px rgba(0,0,0,0.15);"
          [style.left.px]="tonePickerX()"
          [style.top.px]="tonePickerY()"
          role="dialog"
          tabindex="0"
          (keydown.escape)="tonePickerVisible.set(false)"
        >
          @for (v of tonePickerVariantes(); track v) {
            <button
              type="button"
              style="font-size:2rem; padding:1px; border:none; background:transparent; cursor:pointer;"
              (click)="seleccionarVarianteTono(v)"
            >
              {{ v }}
            </button>
          }
        </div>
      }
    </div>
  `,
})
export class ProfilesPanel implements OnInit, OnDestroy {
  readonly service = inject(NutritionService);
  private readonly listaUsuariosDiv =
    viewChild<ElementRef<HTMLElement>>('listaUsuariosDiv');
  private readonly trashBin = viewChild<ElementRef<HTMLElement>>('trashBin');

  readonly editorAbierto = signal(false);
  readonly esModoEdicion = signal(false);
  readonly usuarioEditandoKey = signal<string | null>(null);

  readonly avatarSeleccionado = signal('🙂');
  readonly formNombre = signal('');
  readonly formFecha = signal('');
  readonly formEdad = signal<number | null>(null);
  readonly formAltura = signal<number | null>(null);
  readonly formPeso = signal<number | null>(null);

  // Tone Picker
  readonly tonePickerVisible = signal(false);
  readonly tonePickerVariantes = signal<string[]>([]);
  readonly tonePickerX = signal(0);
  readonly tonePickerY = signal(0);

  private sortable: Sortable | null = null;
  private animTimer: ReturnType<typeof setTimeout> | null = null;

  // Variables de arrastre y scroll
  private dragCard: HTMLElement | null = null;
  private dragNombre: string | null = null;
  private isDragging = false;
  private isOverTrash = false;
  private lastScrollTime = 0;
  private lastPointerX = 0;
  private lastPointerY = 0;
  private currentScrollAnimation: { frame: number } | null = null;
  private scrollCheckFrame: number | null = null;

  readonly perfilesHumanos = computed(() => {
    const map = this.service.usuariosMap();
    const orden = this.service.ordenUsuarios();
    const todos = Object.keys(map).filter(
      (k) => k !== 'Calculadora Nutricional'
    );
    const result: UsuarioPerfil[] = [];

    orden.forEach((k) => {
      if (map[k] && k !== 'Calculadora Nutricional') {
        result.push(map[k]);
      }
    });

    todos.forEach((k) => {
      if (!orden.includes(k) && map[k]) {
        result.push(map[k]);
      }
    });

    return result;
  });

  readonly categoriasEmojisRender: CategoriaEmojiRender[] = [];

  constructor() {
    afterNextRender(() => {
      this.initSortable();
    });

    effect(() => {
      const panel = this.service.panelAbierto();
      if (panel === 'panel1') {
        // Asegurar que Sortable esté listo al abrir el panel
        setTimeout(() => this.initSortable(), 50);
      }
    });
  }

  ngOnInit() {
    this.construirCatalogoEmojis();
  }

  private construirCatalogoEmojis() {
    const orden = [
      'Emoticones y personas',
      'Animales y naturaleza',
      'Comidas y bebidas',
      'Actividades',
      'Viajes y lugares',
      'Objetos',
      'Símbolos',
      'Banderas',
    ];

    orden.forEach((cat) => {
      const items: EmojiItem[] = [];
      Object.keys(CATEGORIAS_EMOJIS).forEach((key) => {
        if (key.startsWith(cat)) {
          items.push(...CATEGORIAS_EMOJIS[key]);
        }
      });
      if (items.length > 0) {
        this.categoriasEmojisRender.push({
          categoria: cat,
          items: items.slice(0, 35),
        });
      }
    });
  }

  private initSortable() {
    if (typeof window === 'undefined') return;
    const el = this.listaUsuariosDiv()?.nativeElement;
    if (!el) return;
    if (this.sortable) return;

    this.sortable = new Sortable(el, {
      group: 'usuarios',
      animation: 300,
      draggable: '.perfil-card:not(.add)',
      handle: '.perfil-avatar .emoji',
      filter: '.add',
      forceFallback: true,
      ghostClass: 'drag-ghost',
      fallbackClass: 'drag-fallback',
      delay: 100,
      swapThreshold: 0.4,
      delayOnTouchOnly: true,
      scroll: false,

      onStart: (evt: Sortable.SortableEvent) => {
        this.dragCard = evt.item;
        this.dragNombre = this.dragCard?.getAttribute('data-nombre') || null;
        this.posicionarTrashBin();
        this.isOverTrash = false;
        this.isDragging = true;

        window.addEventListener('mousemove', this.onPointerMove);
        window.addEventListener('touchmove', this.onPointerMove, {
          passive: true,
        });

        this.scrollCheckFrame = requestAnimationFrame(this.checkScroll);
      },

      onEnd: (evt: Sortable.SortableEvent) => {
        this.isDragging = false;
        window.removeEventListener('mousemove', this.onPointerMove);
        window.removeEventListener('touchmove', this.onPointerMove);

        if (this.scrollCheckFrame) {
          cancelAnimationFrame(this.scrollCheckFrame);
          this.scrollCheckFrame = null;
        }
        if (this.currentScrollAnimation) {
          cancelAnimationFrame(this.currentScrollAnimation.frame);
          this.currentScrollAnimation = null;
        }

        this.lastScrollTime = 0;
        this.lastPointerX = 0;
        this.lastPointerY = 0;

        const bin = this.trashBin()?.nativeElement;
        if (bin) {
          bin.style.display = 'none';
        }
        this.toggleAvatarYBtn(1);

        const nuevoOrden = Array.from(el.children)
          .filter(
            (c) =>
              c.classList.contains('perfil-card') &&
              !c.classList.contains('add')
          )
          .map((c) => c.getAttribute('data-nombre') || '')
          .filter((k) => k !== '');

        if (this.isOverTrash) {
          const nombreArrastrado =
            this.dragNombre ||
            (evt.item && evt.item.getAttribute('data-nombre'));
          if (nombreArrastrado) {
            this.eliminarUsuarioPorNombre(nombreArrastrado);
          }
        } else {
          this.service.reordenarUsuarios(nuevoOrden);
        }

        this.dragCard = null;
        this.dragNombre = null;
        this.isOverTrash = false;
      },
    });
  }

  private toggleAvatarYBtn(opacity: number) {
    const avatar = document.getElementById('avatar-preview');
    const btnEditar = document.getElementById('btn-editar-perfiles');

    [avatar, btnEditar].forEach((elem) => {
      if (!elem) return;
      elem.style.transition = 'opacity 0s ease';
      elem.style.opacity = opacity.toString();
    });
  }

  private posicionarTrashBin() {
    const bin = this.trashBin()?.nativeElement;
    if (!bin) return;

    const avatar = document.getElementById('avatar-preview');
    const btnEditar = document.getElementById('btn-editar-perfiles');
    let targetEl: HTMLElement | null = null;

    if (avatar && avatar.offsetParent !== null) {
      targetEl = avatar;
    } else if (btnEditar && btnEditar.offsetParent !== null) {
      targetEl = btnEditar;
    }

    if (targetEl) {
      const rect = targetEl.getBoundingClientRect();
      Object.assign(bin.style, {
        position: 'fixed',
        top: `${rect.top + rect.height / 2}px`,
        left: `${rect.left + rect.width / 2}px`,
        transform: 'translate(-50%, -50%) scale(1)',
        display: 'block',
      });
      this.toggleAvatarYBtn(0);
    } else {
      Object.assign(bin.style, {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%) scale(1)',
        display: 'block',
      });
    }
  }

  private animateScroll(
    container: HTMLElement,
    distance: number,
    duration = 300
  ) {
    if (this.currentScrollAnimation) {
      cancelAnimationFrame(this.currentScrollAnimation.frame);
    }

    const start = container.scrollLeft;
    const startTime = performance.now();

    const step = (time: number) => {
      const t = Math.min(1, (time - startTime) / duration);
      const eased = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      container.scrollLeft = start + distance * eased;
      if (t < 1) {
        this.currentScrollAnimation = { frame: requestAnimationFrame(step) };
      } else {
        this.currentScrollAnimation = null;
      }
    };

    this.currentScrollAnimation = { frame: requestAnimationFrame(step) };
  }

  private readonly checkScroll = () => {
    if (typeof window === 'undefined' || !this.isDragging || !this.dragCard) return;

    const container = this.listaUsuariosDiv()?.nativeElement;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const now = Date.now();

    const insideContainer =
      this.lastPointerX >= rect.left &&
      this.lastPointerX <= rect.right &&
      this.lastPointerY >= rect.top &&
      this.lastPointerY <= rect.bottom;

    const nearEdge =
      this.lastPointerX - rect.left < 25 || rect.right - this.lastPointerX < 25;
    if (this.sortable) {
      this.sortable.option('swapThreshold', nearEdge ? 1 : 0.4);
    }

    if (insideContainer && now - this.lastScrollTime >= 310) {
      this.lastScrollTime = now;

      const card = container.querySelector(
        '.perfil-card'
      ) as HTMLElement | null;
      if (card) {
        const cardWidth = card.offsetWidth;

        if (this.lastPointerX - rect.left < 25) {
          this.animateScroll(container, -cardWidth);
        } else if (rect.right - this.lastPointerX < 25) {
          this.animateScroll(container, cardWidth);
        }
      }
    }

    this.scrollCheckFrame = requestAnimationFrame(this.checkScroll);
  };

  private readonly onPointerMove = (e: MouseEvent | TouchEvent) => {
    if (typeof window === 'undefined') return;
    const clientX =
      'touches' in e && e.touches.length > 0
        ? e.touches[0].clientX
        : (e as MouseEvent).clientX;
    const clientY =
      'touches' in e && e.touches.length > 0
        ? e.touches[0].clientY
        : (e as MouseEvent).clientY;

    this.lastPointerX = clientX;
    this.lastPointerY = clientY;

    const bin = this.trashBin()?.nativeElement;
    if (!bin) return;

    const rect = bin.getBoundingClientRect();
    const nowOver =
      clientX >= rect.left &&
      clientX <= rect.right &&
      clientY >= rect.top &&
      clientY <= rect.bottom;

    if (nowOver !== this.isOverTrash) {
      this.isOverTrash = nowOver;
      if (this.isOverTrash) {
        bin.style.transform = 'translate(-50%, -50%) scale(1.05)';
        bin.style.filter = 'drop-shadow(0 0 1px rgba(0, 0, 0, 0.5))';
      } else {
        bin.style.transform = 'translate(-50%, -50%) scale(1)';
        bin.style.filter = 'drop-shadow(0 0 1px rgba(0, 0, 0, 0.5))';
      }
    }
  };

  eliminarUsuarioPorNombre(nombreClave: string) {
    if (!nombreClave || nombreClave === 'Calculadora Nutricional') return;
    const u = this.service.usuariosMap()[nombreClave];
    const nombreVisual = u ? u.nombreVisual : nombreClave;

    this.service.mostrarConfirmacion(
      `¿Eliminar usuario ${nombreVisual}?`,
      () => {
        this.service.eliminarUsuario(nombreClave);
        if (this.editorAbierto()) {
          this.cerrarEditorUsuario();
        }
        this.service.mostrarToast('Usuario eliminado correctamente');
      },
      undefined,
      { textoAceptar: 'Eliminar', colorTexto: 'red' }
    );
  }

  cerrarPanel() {
    this.service.setPanelAbierto(null);
  }

  abrirDistribucionVDR() {
    this.service.setPanelAbierto('panel2');
  }

  limpiarNombre(str: string): string {
    return (str || '').replace(/[^\p{L}\s]/gu, '');
  }

  seleccionarUsuario(clave: string) {
    this.service.seleccionarUsuario(clave);
  }

  abrirEditorNuevoUsuario() {
    this.usuarioEditandoKey.set(null);
    this.esModoEdicion.set(false);
    this.avatarSeleccionado.set('🙂');
    this.formNombre.set('');
    this.formFecha.set('');
    this.formEdad.set(null);
    this.formAltura.set(null);
    this.formPeso.set(null);
    this.editorAbierto.set(true);

    // Animación de lengua
    if (this.animTimer) clearTimeout(this.animTimer);
    this.animTimer = setTimeout(() => {
      this.avatarSeleccionado.set('😛');
      this.animTimer = setTimeout(() => {
        this.avatarSeleccionado.set('🙂');
      }, 500);
    }, 2000);
  }

  abrirEditorUsuarioActivo() {
    const activoKey = this.service.usuarioActivo();
    const user = this.service.usuariosMap()[activoKey];
    if (!user || activoKey === 'Calculadora Nutricional') return;

    this.usuarioEditandoKey.set(activoKey);
    this.esModoEdicion.set(true);
    this.avatarSeleccionado.set(user.emoji || '🙂');
    this.formNombre.set(user.nombreVisual || '');
    this.formFecha.set(user.fechaNacimiento || '');
    this.formEdad.set(user.edad ?? null);
    this.formAltura.set(user.altura ?? null);
    this.formPeso.set(user.peso ?? null);
    this.editorAbierto.set(true);
  }

  cerrarEditorUsuario() {
    this.editorAbierto.set(false);
    this.tonePickerVisible.set(false);
    if (this.animTimer) clearTimeout(this.animTimer);
  }

  onNombreInput(e: Event) {
    const val = (e.target as HTMLInputElement).value;
    this.formNombre.set(val);
  }

  onFechaInput(e: Event) {
    const val = (e.target as HTMLInputElement).value;
    this.formFecha.set(val);
    const edad = this.calcularEdadDesdeTexto(val);
    if (edad !== null) {
      this.formEdad.set(edad);
    }
  }

  onEdadInput(e: Event) {
    const input = e.target as HTMLInputElement;
    const clean = input.value.replace(/[^0-9]/g, '');
    input.value = clean;
    this.formEdad.set(clean ? parseInt(clean, 10) : null);
  }

  onAlturaInput(e: Event) {
    const input = e.target as HTMLInputElement;
    const clean = input.value.replace(/[^0-9]/g, '');
    input.value = clean;
    this.formAltura.set(clean ? parseFloat(clean) : null);
  }

  onPesoInput(e: Event) {
    const input = e.target as HTMLInputElement;
    const clean = input.value.replace(/[^0-9]/g, '');
    input.value = clean;
    this.formPeso.set(clean ? parseFloat(clean) : null);
  }

  calcularEdadDesdeTexto(texto: string): number | null {
    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(texto)) return null;
    const [d, m, y] = texto.split('/').map((n) => parseInt(n, 10));
    const fecha = new Date(y, m - 1, d);
    if (isNaN(fecha.getTime())) return null;

    const hoy = new Date();
    let edad = hoy.getFullYear() - y;
    if (
      hoy.getMonth() < m - 1 ||
      (hoy.getMonth() === m - 1 && hoy.getDate() < d)
    ) {
      edad--;
    }
    return edad >= 0 ? edad : null;
  }

  guardarUsuario() {
    const nombre = this.formNombre().trim();
    if (!nombre) {
      this.service.mostrarToast('Escribe un nombre para el perfil');
      return;
    }

    const editando = this.usuarioEditandoKey();
    const map = this.service.usuariosMap();

    const existe = editando
      ? Object.values(map).some(
          (u) => u.nombreVisual === nombre && u.nombre !== editando
        )
      : Object.values(map).some((u) => u.nombreVisual === nombre);

    if (existe) {
      this.service.mostrarToast('Ese nombre ya existe');
      return;
    }

    this.service.mostrarConfirmacion('¿Quieres guardar este perfil?', () => {
      this.service.guardarUsuario(
        nombre,
        this.avatarSeleccionado(),
        this.formFecha(),
        this.formEdad(),
        this.formPeso(),
        this.formAltura(),
        editando
      );
      this.cerrarEditorUsuario();
      this.service.mostrarToast('Perfil guardado correctamente');
    });
  }

  confirmarEliminarUsuario() {
    const key = this.usuarioEditandoKey();
    if (!key || key === 'Calculadora Nutricional') return;
    this.eliminarUsuarioPorNombre(key);
  }

  // --- Emojis y Tone Picker ---
  getBaseEmojiString(item: EmojiItem): string {
    return Array.isArray(item) ? item[0] : item;
  }

  permitePicker(item: EmojiItem): boolean {
    if (Array.isArray(item)) return true;
    return soportaTonos(item);
  }

  seleccionarEmoji(item: EmojiItem) {
    const base = this.getBaseEmojiString(item);
    this.avatarSeleccionado.set(base.replace(/\uFE0F/g, ''));
    this.tonePickerVisible.set(false);
  }

  abrirTonePicker(item: EmojiItem, event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();

    let variantes: string[] = [];
    if (Array.isArray(item)) {
      variantes = item;
    } else {
      const clean = stripSkinTones(item);
      variantes = [clean, ...TONOS_PIEL.map((t) => aplicarTono(clean, t))];
    }

    this.tonePickerVariantes.set(variantes);
    this.tonePickerX.set(Math.max(10, event.clientX - 100));
    this.tonePickerY.set(Math.max(10, event.clientY - 60));
    this.tonePickerVisible.set(true);
  }

  seleccionarVarianteTono(v: string) {
    this.avatarSeleccionado.set(v.replace(/\uFE0F/g, ''));
    this.tonePickerVisible.set(false);
  }

  ngOnDestroy() {
    if (this.sortable) {
      this.sortable.destroy();
      this.sortable = null;
    }
    if (typeof window !== 'undefined') {
      if (this.scrollCheckFrame && typeof cancelAnimationFrame !== 'undefined') {
        cancelAnimationFrame(this.scrollCheckFrame);
        this.scrollCheckFrame = null;
      }
      if (this.currentScrollAnimation && typeof cancelAnimationFrame !== 'undefined') {
        cancelAnimationFrame(this.currentScrollAnimation.frame);
        this.currentScrollAnimation = null;
      }
      window.removeEventListener('mousemove', this.onPointerMove);
      window.removeEventListener('touchmove', this.onPointerMove);
    }
    if (this.animTimer) clearTimeout(this.animTimer);
  }
}
