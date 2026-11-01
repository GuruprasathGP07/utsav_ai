/** @fileoverview Accessibility utilities: screen-reader live announcements & focus management. */

let liveRegion: HTMLElement | null = null;

function getLiveRegion(): HTMLElement {
  if (!liveRegion && typeof document !== 'undefined') {
    liveRegion = document.getElementById('utsavai-a11y-announcer');
    if (!liveRegion) {
      liveRegion = document.createElement('div');
      liveRegion.id = 'utsavai-a11y-announcer';
      liveRegion.setAttribute('role', 'status');
      liveRegion.setAttribute('aria-live', 'polite');
      liveRegion.setAttribute('aria-atomic', 'true');
      liveRegion.style.position = 'absolute';
      liveRegion.style.width = '1px';
      liveRegion.style.height = '1px';
      liveRegion.style.padding = '0';
      liveRegion.style.margin = '-1px';
      liveRegion.style.overflow = 'hidden';
      liveRegion.style.clip = 'rect(0, 0, 0, 0)';
      liveRegion.style.whiteSpace = 'nowrap';
      liveRegion.style.border = '0';
      document.body.appendChild(liveRegion);
    }
  }
  return liveRegion!;
}

export function announceToScreenReader(message: string): void {
  try {
    const region = getLiveRegion();
    if (region) {
      // Clear then set to re-trigger assistive tech
      region.textContent = '';
      setTimeout(() => {
        region.textContent = message;
      }, 50);
    }
  } catch {
    // ignore
  }
}

export function trapFocus(element: HTMLElement, e: KeyboardEvent): void {
  const focusables = element.querySelectorAll<HTMLElement>(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
  );
  if (focusables.length === 0) return;

  const first = focusables[0];
  const last = focusables[focusables.length - 1];

  if (e.key === 'Tab') {
    if (e.shiftKey && document.activeElement === first) {
      last?.focus();
      e.preventDefault();
    } else if (!e.shiftKey && document.activeElement === last) {
      first?.focus();
      e.preventDefault();
    }
  }
}

