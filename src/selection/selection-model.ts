/**
 * Simple event emitter to replace RxJS Subject
 */
export class EventEmitter<T = void> {
  private listeners: ((value: T) => void)[] = [];

  emit(value?: T): void {
    this.listeners.forEach((listener) => listener(value as T));
  }

  subscribe(listener: (value: T) => void): { unsubscribe: () => void } {
    this.listeners.push(listener);
    return {
      unsubscribe: () => {
        const index = this.listeners.indexOf(listener);
        if (index !== -1) {
          this.listeners.splice(index, 1);
        }
      },
    };
  }
}

/**
 * Handles document selectionchange event
 * keeping the last selection (currentSelection) and
 * sends a signal (changed$) when the event occurs
 */
export class SelectionModel {
  public changed$ = new EventEmitter<void>();

  private currentSelection: Selection | null = null;

  private currentRange: Range | null = null;

  private subscription?: { unsubscribe: () => void };

  private storedRange: Range | null = null;

  constructor(private rootDocument: Document = document) {
    this.listen();
  }

  setRootDocument(newRootDocument: Document) {
    if (!newRootDocument) return;
    this.rootDocument = newRootDocument;
    this.unsubscribe();
    this.listen();
  }

  public getCurrentSelection() {
    return this.currentSelection;
  }

  public getCurrentRange() {
    return this.currentRange;
  }

  public clearSelection() {
    const selection = this.getSelection();
    if (selection) {
      if (selection.empty) {
        // Chrome
        selection.empty();
      } else {
        // Firefox and others
        selection.removeAllRanges();
      }
    }
  }

  private listen() {
    const handler = () => this.onSelectionChange();
    this.rootDocument.addEventListener('mouseup', handler);
    this.subscription = {
      unsubscribe: () =>
        this.rootDocument.removeEventListener('mouseup', handler),
    };
  }

  public unsubscribe() {
    this.subscription?.unsubscribe();
  }

  public setSelectionFromRange(range: Range) {
    const newSelection = this.getSelection();
    const newRange = this.rootDocument.createRange();
    newRange.setStart(range.startContainer, range.startOffset);
    newRange.setEnd(range.endContainer, range.endOffset);
    if (newSelection) {
      newSelection.removeAllRanges();
      newSelection.addRange(newRange);
    }
    // update current
    this.onSelectionChange();
  }

  private onSelectionChange() {
    this.currentSelection = null;
    this.currentRange = null;
    const selection = this.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      if (!range.collapsed) {
        this.currentSelection = selection;
        this.currentRange = range;
      }
    }
    this.changed$.emit();
  }

  private getSelection(): Selection | null {
    return this.rootDocument?.getSelection
      ? this.rootDocument?.getSelection()
      : window.getSelection();
  }

  public storeRange(): void {
    const selection = this.getSelection();
    if (!selection) throw new Error('No selection found');
    this.storedRange = selection.getRangeAt(0).cloneRange();
  }

  public getStoredRange(): Range | null {
    return this.storedRange;
  }
}
