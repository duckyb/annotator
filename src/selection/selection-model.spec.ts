import { SelectionModel, EventEmitter } from './selection-model';

describe('EventEmitter', () => {
  it('should emit values to subscribers', () => {
    const emitter = new EventEmitter<string>();
    const listener = jest.fn();

    emitter.subscribe(listener);
    emitter.emit('test');

    expect(listener).toHaveBeenCalledWith('test');
  });

  it('should allow unsubscribing from events', () => {
    const emitter = new EventEmitter<string>();
    const listener = jest.fn();

    const subscription = emitter.subscribe(listener);
    subscription.unsubscribe();
    emitter.emit('test');

    expect(listener).not.toHaveBeenCalled();
  });

  it('should handle multiple subscribers', () => {
    const emitter = new EventEmitter<string>();
    const listener1 = jest.fn();
    const listener2 = jest.fn();

    emitter.subscribe(listener1);
    emitter.subscribe(listener2);
    emitter.emit('test');

    expect(listener1).toHaveBeenCalledWith('test');
    expect(listener2).toHaveBeenCalledWith('test');
  });

  it('should handle unsubscribing one of multiple subscribers', () => {
    const emitter = new EventEmitter<string>();
    const listener1 = jest.fn();
    const listener2 = jest.fn();

    emitter.subscribe(listener1);
    const subscription = emitter.subscribe(listener2);
    subscription.unsubscribe();
    emitter.emit('test');

    expect(listener1).toHaveBeenCalledWith('test');
    expect(listener2).not.toHaveBeenCalled();
  });
});

describe('SelectionModel', () => {
  let selectionModel: SelectionModel;
  let mockDocument: Document;
  let mockSelection: Selection;
  let mockRange: Range;

  beforeEach(() => {
    // Create a partial mock of Range with only the properties we need
    mockRange = {
      // Properties
      collapsed: false,
      startContainer: document.createElement('div'),
      endContainer: document.createElement('div'),
      startOffset: 0,
      endOffset: 5,
      // Methods
      setStart: jest.fn(),
      setEnd: jest.fn(),
      cloneRange: jest.fn().mockReturnThis(),
    } as unknown as Range;

    // Mock Selection
    mockSelection = {
      rangeCount: 1,
      getRangeAt: jest.fn().mockReturnValue(mockRange),
      removeAllRanges: jest.fn(),
      addRange: jest.fn(),
      empty: jest.fn(),
    } as unknown as Selection;

    // Mock Document
    mockDocument = {
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      getSelection: jest.fn().mockReturnValue(mockSelection),
      createRange: jest.fn().mockReturnValue(mockRange),
    } as unknown as Document;

    // Create SelectionModel with mocked document
    selectionModel = new SelectionModel(mockDocument);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with the provided document and call listen', () => {
      expect(mockDocument.addEventListener).toHaveBeenCalledWith(
        'mouseup',
        expect.any(Function)
      );
    });

    it('should use window document by default if none provided', () => {
      // Create a spy on document.addEventListener
      const addEventListenerSpy = jest.spyOn(document, 'addEventListener');

      // Clear previous calls
      addEventListenerSpy.mockClear();

      // Create a new SelectionModel without providing a document
      new SelectionModel();

      // Verify that addEventListener was called on the document
      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'mouseup',
        expect.any(Function)
      );

      // Restore the spy
      addEventListenerSpy.mockRestore();
    });
  });

  describe('setRootDocument', () => {
    it('should update the root document and reinitialize listeners', () => {
      // Create a new mock document
      const newMockDocument = {
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        getSelection: jest.fn(),
      } as unknown as Document;

      // Create a spy on the unsubscribe method
      const unsubscribeSpy = jest.spyOn(selectionModel, 'unsubscribe');

      // Call setRootDocument
      selectionModel.setRootDocument(newMockDocument);

      // Verify that unsubscribe was called and the new document has addEventListener called
      expect(unsubscribeSpy).toHaveBeenCalled();
      expect(newMockDocument.addEventListener).toHaveBeenCalledWith(
        'mouseup',
        expect.any(Function)
      );

      // Restore the spy
      unsubscribeSpy.mockRestore();
    });

    it('should do nothing if provided document is falsy', () => {
      selectionModel.setRootDocument(null as unknown as Document);
      expect(mockDocument.removeEventListener).not.toHaveBeenCalled();
    });
  });

  describe('getCurrentSelection', () => {
    it('should return the current selection', () => {
      // Trigger selection change to set currentSelection
      const handler = (mockDocument.addEventListener as jest.Mock).mock
        .calls[0][1];
      handler();

      expect(selectionModel.getCurrentSelection()).toBe(mockSelection);
    });

    it('should return null if no selection is set', () => {
      // Create a new mock range with collapsed=true
      const collapsedRange = {
        ...mockRange,
        collapsed: true,
      } as Range;

      // Update the mock to return the collapsed range
      (mockSelection.getRangeAt as jest.Mock).mockReturnValueOnce(
        collapsedRange
      );

      // Trigger selection change
      const handler = (mockDocument.addEventListener as jest.Mock).mock
        .calls[0][1];
      handler();

      expect(selectionModel.getCurrentSelection()).toBeNull();
    });
  });

  describe('getCurrentRange', () => {
    it('should return the current range', () => {
      // Trigger selection change to set currentRange
      const handler = (mockDocument.addEventListener as jest.Mock).mock
        .calls[0][1];
      handler();

      expect(selectionModel.getCurrentRange()).toBe(mockRange);
    });

    it('should return null if no range is set', () => {
      // Create a new mock range with collapsed=true
      const collapsedRange = {
        ...mockRange,
        collapsed: true,
      } as Range;

      // Update the mock to return the collapsed range
      (mockSelection.getRangeAt as jest.Mock).mockReturnValueOnce(
        collapsedRange
      );

      // Trigger selection change
      const handler = (mockDocument.addEventListener as jest.Mock).mock
        .calls[0][1];
      handler();

      expect(selectionModel.getCurrentRange()).toBeNull();
    });
  });

  describe('clearSelection', () => {
    it('should clear selection using empty() if available', () => {
      selectionModel.clearSelection();
      expect(mockSelection.empty).toHaveBeenCalled();
    });

    it('should clear selection using removeAllRanges() if empty is not available', () => {
      // Remove empty method
      delete (mockSelection as any).empty;

      selectionModel.clearSelection();
      expect(mockSelection.removeAllRanges).toHaveBeenCalled();
    });

    it('should do nothing if no selection is available', () => {
      (mockDocument.getSelection as jest.Mock).mockReturnValueOnce(null);

      selectionModel.clearSelection();

      expect(mockSelection.empty).not.toHaveBeenCalled();
      expect(mockSelection.removeAllRanges).not.toHaveBeenCalled();
    });
  });

  describe('listen', () => {
    it('should add event listener to the document', () => {
      // Reset mock to clear constructor call
      jest.clearAllMocks();

      // Call listen method directly
      (selectionModel as any).listen();

      expect(mockDocument.addEventListener).toHaveBeenCalledWith(
        'mouseup',
        expect.any(Function)
      );
    });
  });

  describe('unsubscribe', () => {
    it('should remove event listener from document', () => {
      selectionModel.unsubscribe();
      expect(mockDocument.removeEventListener).toHaveBeenCalled();
    });

    it('should handle case when subscription is undefined', () => {
      // Set subscription to undefined
      (selectionModel as any).subscription = undefined;

      // Should not throw error
      expect(() => selectionModel.unsubscribe()).not.toThrow();
    });
  });

  describe('setSelectionFromRange', () => {
    it('should create a new range and update selection', () => {
      selectionModel.setSelectionFromRange(mockRange);

      expect(mockDocument.createRange).toHaveBeenCalled();
      expect(mockRange.setStart).toHaveBeenCalled();
      expect(mockRange.setEnd).toHaveBeenCalled();
      expect(mockSelection.removeAllRanges).toHaveBeenCalled();
      expect(mockSelection.addRange).toHaveBeenCalled();
    });

    it('should update current selection and range', () => {
      const changedEmitSpy = jest.spyOn(
        (selectionModel as any).changed$,
        'emit'
      );

      selectionModel.setSelectionFromRange(mockRange);

      expect(changedEmitSpy).toHaveBeenCalled();
    });

    it('should handle case when selection is null', () => {
      (mockDocument.getSelection as jest.Mock).mockReturnValueOnce(null);

      selectionModel.setSelectionFromRange(mockRange);

      expect(mockDocument.createRange).toHaveBeenCalled();
      expect(mockSelection.addRange).not.toHaveBeenCalled();
    });
  });

  describe('onSelectionChange', () => {
    it('should update current selection and range when valid selection exists', () => {
      const changedEmitSpy = jest.spyOn(
        (selectionModel as any).changed$,
        'emit'
      );

      (selectionModel as any).onSelectionChange();

      expect(changedEmitSpy).toHaveBeenCalled();
      expect(selectionModel.getCurrentSelection()).toBe(mockSelection);
      expect(selectionModel.getCurrentRange()).toBe(mockRange);
    });

    it('should reset selection and range when range is collapsed', () => {
      // Create a new mock range with collapsed=true
      const collapsedRange = {
        ...mockRange,
        collapsed: true,
      } as Range;

      // Update the mock to return the collapsed range
      (mockSelection.getRangeAt as jest.Mock).mockReturnValueOnce(
        collapsedRange
      );

      (selectionModel as any).onSelectionChange();

      expect(selectionModel.getCurrentSelection()).toBeNull();
      expect(selectionModel.getCurrentRange()).toBeNull();
    });

    it('should reset selection and range when no ranges exist', () => {
      (mockSelection as any).rangeCount = 0;

      (selectionModel as any).onSelectionChange();

      expect(selectionModel.getCurrentSelection()).toBeNull();
      expect(selectionModel.getCurrentRange()).toBeNull();
    });

    it('should reset selection and range when no selection exists', () => {
      (mockDocument.getSelection as jest.Mock).mockReturnValueOnce(null);

      (selectionModel as any).onSelectionChange();

      expect(selectionModel.getCurrentSelection()).toBeNull();
      expect(selectionModel.getCurrentRange()).toBeNull();
    });
  });

  describe('getSelection', () => {
    it('should return selection from document if available', () => {
      const result = (selectionModel as any).getSelection();

      expect(mockDocument.getSelection).toHaveBeenCalled();
      expect(result).toBe(mockSelection);
    });

    it('should fall back to window.getSelection if document.getSelection is not available', () => {
      const windowSelectionSpy = jest.spyOn(window, 'getSelection');
      (mockDocument as any).getSelection = undefined;

      (selectionModel as any).getSelection();

      expect(windowSelectionSpy).toHaveBeenCalled();
    });
  });

  describe('storeRange', () => {
    it('should clone and store the current range', () => {
      selectionModel.storeRange();

      expect(mockSelection.getRangeAt).toHaveBeenCalledWith(0);
      expect(mockRange.cloneRange).toHaveBeenCalled();
      expect(selectionModel.getStoredRange()).toBe(mockRange);
    });

    it('should throw error if no selection is found', () => {
      (mockDocument.getSelection as jest.Mock).mockReturnValueOnce(null);

      expect(() => selectionModel.storeRange()).toThrow('No selection found');
    });
  });

  describe('getStoredRange', () => {
    it('should return the stored range', () => {
      // Store a range first
      selectionModel.storeRange();

      expect(selectionModel.getStoredRange()).toBe(mockRange);
    });

    it('should return null if no range is stored', () => {
      // Create new instance without storing range
      const newModel = new SelectionModel(mockDocument);

      expect(newModel.getStoredRange()).toBeNull();
    });
  });

  describe('changed$ EventEmitter', () => {
    it('should emit when selection changes', () => {
      const listener = jest.fn();
      (selectionModel as any).changed$.subscribe(listener);

      // Trigger selection change
      const handler = (mockDocument.addEventListener as jest.Mock).mock
        .calls[0][1];
      handler();

      expect(listener).toHaveBeenCalled();
    });
  });
});
