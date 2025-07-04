// Import the Annotator class
import { Annotator } from './index.esm.js';

// Initialize the annotator with the proper context
let annotator;

// Track the currently selected annotation for updating
let selectedAnnotationId = null;
let isUpdateMode = false;

// Initialize the annotator when the DOM is loaded
document.addEventListener('DOMContentLoaded', initializeAnnotator);

// Function to initialize the annotator and set up the page
function initializeAnnotator() {
  // Create a new instance of the Annotator with whitespace highlighting enabled
  annotator = new Annotator({
    allowWhitespace: true, // Enable whitespace highlighting for testing
  });

  // Set the context for the annotator
  annotator.setContext({
    documentId: 'annotator-demo',
  });

  // Set up event listeners for buttons
  setupEventListeners();

  // Load saved annotations
  loadSavedAnnotations();
}

// Function to get the selected highlight color
function getSelectedColor() {
  // Get the selected radio button value
  const colorRadios = document.getElementsByName('highlight-color');
  for (const radio of colorRadios) {
    if (radio.checked) {
      return radio.value;
    }
  }
  return '#FFFF00'; // Default color
}

// Create annotation example
function createAnnotation() {
  const contentElement = document.getElementById('content');
  const selection = window.getSelection();

  if (selection.rangeCount > 0) {
    const range = selection.getRangeAt(0);
    if (!range.collapsed) {
      try {
        // Get the selected color
        const selectedColor = getSelectedColor();

        // Get the user's comment from the textarea
        const commentText = document
          .getElementById('annotation-comment')
          .value.trim();

        // Create a full annotation using the annotator
        const annotationWithHighlights = annotator.createAnnotation({
          root: contentElement,
          range: range,
          context: {
            documentId: 'annotator-demo',
          },
          // Pass the color directly to the createAnnotation method
          color: selectedColor,
          metadata: {
            type: 'annotation',
            createdAt: new Date().toISOString(),
            createdBy: 'demo-user',
            comment: commentText || undefined,
          },
        });

        // Add the highlights to the page
        if (annotationWithHighlights.highlights) {
          annotationWithHighlights.highlights.forEach((highlight) => {
            // Add the annotation ID as a data attribute
            highlight.setAttribute(
              'data-annotation-id',
              annotationWithHighlights.id
            );
          });
        }

        // Store the annotation in a global map for easy retrieval
        window.annotationsMap = window.annotationsMap || {};
        window.annotationsMap[annotationWithHighlights.id] =
          annotationWithHighlights;

        // Store the annotation ID for later reference
        window.currentAnnotationIds = window.currentAnnotationIds || [];
        window.currentAnnotationIds.push(annotationWithHighlights.id);

        // Display the annotation
        document.getElementById('annotation-output').textContent =
          JSON.stringify(annotationWithHighlights, null, 2);

        // Show success notification
        showNotification(
          'Annotation created successfully',
          'Success',
          'success'
        );

        // Clear the selection
        selection.removeAllRanges();

        // Clear the comment field for the next annotation
        document.getElementById('annotation-comment').value = '';
      } catch (e) {
        console.error('Error creating annotation:', e);

        // Clear the annotation output area
        document.getElementById('annotation-output').textContent = '';

        // Show error notification
        showNotification('Error creating annotation: ' + e, 'Error', 'error');
      }
    } else {
      // Don't update the output area with status messages, use toast notifications instead

      // Show warning notification
      showNotification('Please select some text first', 'Warning', 'warning');
    }
  }
}

// Save annotations to session storage
function saveAnnotations() {
  // Initialize an empty array for annotations
  const annotations = [];

  // If we have annotation IDs and a map, process them
  if (
    window.currentAnnotationIds &&
    Array.isArray(window.currentAnnotationIds) &&
    window.annotationsMap
  ) {
    // Process each annotation ID
    window.currentAnnotationIds.forEach((annotationId) => {
      const annotation = window.annotationsMap[annotationId];
      if (annotation) {
        annotations.push(annotation);
      }
    });
  }

  // Always save to session storage, even if the array is empty
  // This allows saving a clean state with no annotations
  sessionStorage.setItem('annotations', JSON.stringify(annotations));

  if (annotations.length > 0) {
    showNotification(
      `Saved ${annotations.length} annotation(s)`,
      'Success',
      'success'
    );
  } else {
    showNotification('Saved clean state (0 annotations)', 'Success', 'success');
  }
}

// Clear all annotations
function clearAnnotations() {
  // Clear current annotations
  if (window.currentAnnotationIds && window.currentAnnotationIds.length > 0) {
    window.currentAnnotationIds.forEach((id) => {
      annotator.removeHighlights(id);
    });
    window.currentAnnotationIds = [];
  }

  // Clear session storage
  sessionStorage.removeItem('savedAnnotations');

  // Show success notification
  showNotification('All annotations have been cleared', 'Cleared', 'success');
}

// Load saved annotations from session storage
function loadSavedAnnotations() {
  try {
    // Get saved annotations from session storage
    const savedAnnotations = sessionStorage.getItem('annotations');

    if (savedAnnotations) {
      // Parse the saved annotations
      const annotations = JSON.parse(savedAnnotations);

      if (annotations && annotations.length > 0) {
        // Clear any existing annotations
        clearAnnotations(false);

        // Initialize the annotation IDs array and annotations map
        window.currentAnnotationIds = [];
        window.annotationsMap = {};

        // Add each annotation to the page
        annotations.forEach((annotation) => {
          try {
            // Make sure the annotation has the color property directly on the object
            // This ensures compatibility with the new approach
            if (
              annotation.metadata &&
              annotation.metadata.color &&
              !annotation.color
            ) {
              annotation.color = annotation.metadata.color;
            }

            // Add the annotation ID to the list
            window.currentAnnotationIds.push(annotation.id);

            // Add the annotation to the page
            const highlights = annotator.addHighlights(
              document.getElementById('content'),
              annotation
            );

            // If highlights were created successfully
            if (highlights && highlights.length > 0) {
              // Store the annotation ID in the highlight elements
              highlights.forEach((highlight) => {
                highlight.setAttribute('data-annotation-id', annotation.id);
              });

              // Store the full annotation in the global map
              const fullAnnotation = { ...annotation, highlights };
              window.annotationsMap[annotation.id] = fullAnnotation;
            }
          } catch (e) {
            console.error('Error loading annotation:', e);
          }
        });

        // Show success notification
        showNotification(
          `Loaded ${annotations.length} annotations from session storage`,
          'Annotations Loaded',
          'success'
        );
      }
    }
  } catch (e) {
    console.error('Error loading saved annotations:', e);

    // Show error notification
    showNotification(
      'Error loading annotations: ' + e.message,
      'Error',
      'error'
    );
  }
}

// Toast notification system
function showNotification(message, title = 'Notification', type = 'info') {
  // Get the toast elements
  const toastElement = document.getElementById('notification-toast');
  const toastTitle = document.getElementById('toast-title');
  const toastMessage = document.getElementById('toast-message');

  // Set the toast content
  toastTitle.textContent = title;
  toastMessage.textContent = message;

  // Remove any existing color classes
  toastElement.classList.remove(
    'bg-success',
    'bg-danger',
    'bg-info',
    'bg-warning'
  );

  // Add the appropriate color class based on the type
  switch (type) {
    case 'success':
      toastElement.classList.add('text-white', 'bg-success');
      break;
    case 'error':
      toastElement.classList.add('text-white', 'bg-danger');
      break;
    case 'warning':
      toastElement.classList.add('text-white', 'bg-warning');
      break;
    case 'info':
    default:
      toastElement.classList.add('text-white', 'bg-info');
      break;
  }

  // Create a Bootstrap toast instance and show it
  const toast = new bootstrap.Toast(toastElement);
  toast.show();
}

// Function to display annotation data in the preview box
function displayAnnotationData(annotation) {
  const outputElement = document.getElementById('annotation-output');

  // Display the annotation as formatted JSON, matching the format used when creating annotations
  outputElement.textContent = JSON.stringify(annotation, null, 2);
}

// Function to handle clicks on annotation highlights
function handleAnnotationClick(event) {
  // Check if the clicked element or any of its parents is a highlight
  let target = event.target;

  // Traverse up the DOM to find a highlight element with annotation ID
  while (target && target !== document) {
    if (target.hasAttribute('data-annotation-id')) {
      // Get the annotation ID
      const annotationId = target.getAttribute('data-annotation-id');

      // Retrieve the annotation from the global map
      const annotationData =
        window.annotationsMap && window.annotationsMap[annotationId];

      if (annotationData) {
        // Store the selected annotation ID for updating
        selectedAnnotationId = annotationId;

        // Enter update mode
        enterUpdateMode(annotationData);

        // Display the annotation data
        displayAnnotationData(annotationData);

        // Add a visual indication that this highlight is selected
        // Remove 'selected' class from all highlights
        document.querySelectorAll('[data-annotation-id]').forEach((el) => {
          el.classList.remove('selected-highlight');
        });

        // Add 'selected' class to the clicked highlight and its siblings with the same ID
        document
          .querySelectorAll(`[data-annotation-id="${annotationId}"]`)
          .forEach((el) => {
            el.classList.add('selected-highlight');
          });

        // Stop event propagation
        event.stopPropagation();
        return;
      }
    }

    // Move up to the parent element
    target = target.parentElement;
  }
}

// Function to enter update mode when an annotation is selected
function enterUpdateMode(annotation) {
  // Set update mode flag
  isUpdateMode = true;

  // Change the annotation button text and function
  const annotationButton = document.getElementById('annotation-btn');
  annotationButton.innerHTML =
    '<i class="material-icons">update</i> Update Annotation';
  annotationButton.classList.remove('btn-primary');
  annotationButton.classList.add('btn-warning');

  // Remove existing click handlers and add the update handler
  annotationButton.removeEventListener('click', createAnnotation);
  annotationButton.addEventListener('click', updateAnnotation);

  // Show the cancel button
  const cancelButton = document.getElementById('cancel-update-btn');
  if (cancelButton) {
    cancelButton.classList.remove('d-none');
  }

  // Update the color selection to match the annotation's color
  if (annotation.color) {
    const colorRadios = document.getElementsByName('highlight-color');
    colorRadios.forEach((radio) => {
      if (radio.value === annotation.color) {
        radio.checked = true;
      } else {
        radio.checked = false;
      }
    });
  }

  // Update the comment field with the annotation's comment
  const commentField = document.getElementById('annotation-comment');
  if (commentField && annotation.metadata && annotation.metadata.comment) {
    commentField.value = annotation.metadata.comment;
  } else if (commentField) {
    commentField.value = '';
  }
}

// Function to exit update mode
function exitUpdateMode() {
  // Reset update mode flag and selected annotation
  isUpdateMode = false;
  selectedAnnotationId = null;

  // Change the annotation button back to create mode
  const annotationButton = document.getElementById('annotation-btn');
  annotationButton.innerHTML =
    '<i class="material-icons">comment</i> Create Annotation';
  annotationButton.classList.remove('btn-warning');
  annotationButton.classList.add('btn-primary');

  // Remove update handler and add back the create handler
  annotationButton.removeEventListener('click', updateAnnotation);
  annotationButton.addEventListener('click', createAnnotation);

  // Hide the cancel button
  const cancelButton = document.getElementById('cancel-update-btn');
  if (cancelButton) {
    cancelButton.classList.add('d-none');
  }

  // Clear the comment field
  const commentField = document.getElementById('annotation-comment');
  if (commentField) {
    commentField.value = '';
  }

  // Clear the annotation output
  document.getElementById('annotation-output').textContent =
    'Select some text and click "Create Annotation" to see the output data here.';

  // Remove selected highlight class from all highlights
  document.querySelectorAll('[data-annotation-id]').forEach((el) => {
    el.classList.remove('selected-highlight');
  });
}

// Function to set up event listeners for buttons
function setupEventListeners() {
  // Get the buttons
  const annotationButton = document.getElementById('annotation-btn');
  const saveButton = document.getElementById('save-btn');
  const clearButton = document.getElementById('clear-btn');
  const contentElement = document.getElementById('content');

  // Initialize the annotation IDs array
  window.currentAnnotationIds = [];

  // Subscribe to annotator events
  annotator.getEvents().on('highlight', (event) => {
    console.log('Highlight event:', event);
  });

  // Add event listeners for buttons
  annotationButton.addEventListener('click', createAnnotation);
  saveButton.addEventListener('click', saveAnnotations);
  clearButton.addEventListener('click', clearAnnotations);

  // Add event listener for annotation clicks using event delegation
  contentElement.addEventListener('click', handleAnnotationClick);

  // Add event listener for clicks in the content area to exit update mode
  contentElement.addEventListener('click', (event) => {
    // Only handle clicks when in update mode
    if (isUpdateMode) {
      // Check if the click is on a highlight
      let target = event.target;
      let isHighlightClick = false;

      // Check if click is on a highlight
      while (target && target !== contentElement) {
        if (target.hasAttribute('data-annotation-id')) {
          isHighlightClick = true;
          break;
        }
        target = target.parentElement;
      }

      // If click is in the content area but not on a highlight, exit update mode
      if (!isHighlightClick) {
        exitUpdateMode();
      }
    }
  });

  // Add a cancel button to exit update mode
  const buttonContainer = annotationButton.parentElement;

  // Create a cancel button that will only be shown in update mode
  const cancelButton = document.createElement('button');
  cancelButton.id = 'cancel-update-btn';
  cancelButton.className = 'btn btn-outline-secondary d-none';
  cancelButton.innerHTML = '<i class="material-icons">cancel</i> Cancel';
  cancelButton.addEventListener('click', exitUpdateMode);

  // Add the cancel button after the annotation button
  buttonContainer.insertBefore(cancelButton, annotationButton.nextSibling);
}

// Function to update an existing annotation
function updateAnnotation() {
  if (
    !selectedAnnotationId ||
    !window.annotationsMap ||
    !window.annotationsMap[selectedAnnotationId]
  ) {
    showNotification('No annotation selected for update', 'Warning', 'warning');
    return;
  }

  // Get the existing annotation
  const existingAnnotation = window.annotationsMap[selectedAnnotationId];

  // Get the content element
  const contentElement = document.getElementById('content');

  // Get the current selection
  const selection = window.getSelection();
  let range = null;

  // Check if there's a new selection
  if (selection && selection.rangeCount > 0 && !selection.isCollapsed) {
    range = selection.getRangeAt(0);
  }

  // Get the selected color
  const selectedColor = getSelectedColor();

  // Get the comment text
  const commentText = document
    .getElementById('annotation-comment')
    .value.trim();

  try {
    // First, remove the existing highlights using the annotator's API
    annotator.removeHighlights(selectedAnnotationId);

    // Create updated metadata
    const metadata = {
      ...existingAnnotation.metadata,
      updatedAt: new Date().toISOString(),
    };

    // Only add comment to metadata if one was provided
    if (commentText) {
      metadata.comment = commentText;
    } else if (metadata.comment) {
      // Remove comment if it existed but is now empty
      delete metadata.comment;
    }

    // Create a new annotation object with updated properties
    let updatedAnnotation;

    if (range) {
      // If we have a new selection, create a completely new annotation
      updatedAnnotation = annotator.createAnnotation({
        root: contentElement,
        range: range,
        context: existingAnnotation.context,
        color: selectedColor,
        metadata: metadata,
      });

      // Keep the original ID
      updatedAnnotation.id = selectedAnnotationId;
    } else {
      // If no new selection, keep the original selectors but update other properties
      updatedAnnotation = {
        ...existingAnnotation,
        color: selectedColor,
        metadata: metadata,
        // Ensure we keep all the original selectors
        rangeSelector: existingAnnotation.rangeSelector,
        textPositionSelector: existingAnnotation.textPositionSelector,
        textQuoteSelector: existingAnnotation.textQuoteSelector,
      };

      // Remove any existing highlights array since we'll create new ones
      delete updatedAnnotation.highlights;
    }

    // Add new highlights using the annotator's API
    const highlights = annotator.addHighlights(
      contentElement,
      updatedAnnotation
    );

    // Add the annotation ID to all highlights
    if (highlights && highlights.length > 0) {
      highlights.forEach((highlight) => {
        highlight.setAttribute('data-annotation-id', selectedAnnotationId);
      });
    }

    // Update the highlights in the annotation object
    updatedAnnotation.highlights = highlights || [];

    // Update the annotation in the global map
    window.annotationsMap[selectedAnnotationId] = updatedAnnotation;

    // Display the updated annotation
    displayAnnotationData(updatedAnnotation);

    // Show success notification
    showNotification('Annotation updated successfully', 'Success', 'success');

    // Exit update mode
    exitUpdateMode();

    // Clear the selection if there is one
    if (selection && selection.rangeCount > 0) {
      selection.removeAllRanges();
    }
  } catch (e) {
    console.error('Error updating annotation:', e);

    // Show error notification
    showNotification('Error updating annotation: ' + e, 'Error', 'error');
  }
}

// Export functions for global access
window.createAnnotation = createAnnotation;
window.saveAnnotations = saveAnnotations;
window.clearAnnotations = clearAnnotations;
window.updateAnnotation = updateAnnotation;
