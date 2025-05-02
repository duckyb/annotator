// Import the Annotator class
import { Annotator } from '../dist/index.esm.js';

// Initialize the annotator with the proper context
let annotator;

// Initialize the annotator when the DOM is loaded
document.addEventListener('DOMContentLoaded', initializeAnnotator);

// Function to initialize the annotator and set up the page
function initializeAnnotator() {
  // Create a new instance of the Annotator
  annotator = new Annotator();

  // Set the context for the annotator
  annotator.setContext({
    documentId: 'annotator-demo',
  });

  // Set up custom color picker
  setupColorPicker();

  // Set up event listeners for buttons
  setupEventListeners();

  // Load saved annotations
  loadSavedAnnotations();
}

// Function to get the selected highlight color
function getSelectedColor() {
  // Check if custom color is active
  const customColorInput = document.getElementById('custom-color');
  if (customColorInput.dataset.active === 'true') {
    return customColorInput.value;
  }

  // Otherwise get the selected radio button value
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
            comment: 'This is an important passage',
            tags: ['important', 'review'],
          },
        });

        // Apply custom color styling to highlights
        if (annotationWithHighlights.highlights) {
          // Get the color directly from the annotation object, default to yellow if undefined
          const color = annotationWithHighlights.color || '#FFFF00';
          
          // Convert hex color to rgba with opacity
          const hexColor = color.replace('#', '');
          const r = parseInt(hexColor.substring(0, 2), 16);
          const g = parseInt(hexColor.substring(2, 4), 16);
          const b = parseInt(hexColor.substring(4, 6), 16);

          // Use higher opacity for more vibrant colors
          const backgroundColor = `rgba(${r}, ${g}, ${b}, 0.3)`;

          // Create border colors based on the original colors
          let borderColor;
          if (color === '#FFFF00') {
            borderColor = '#e6c700'; // Yellow border
          } else if (color === '#90EE90') {
            borderColor = '#4caf50'; // Green border
          } else if (color === '#ADD8E6') {
            borderColor = '#2196f3'; // Blue border
          } else if (color === '#FFB6C1') {
            borderColor = '#e91e63'; // Pink border
          } else {
            // For custom colors, use a darker version of the same color
            borderColor = `rgba(${Math.max(0, r - 40)}, ${Math.max(0, g - 40)}, ${Math.max(0, b - 40)}, 0.7}`;
          }

          // Apply the color to each highlight element
          annotationWithHighlights.highlights.forEach((highlight) => {
            // Remove any existing highlight class
            highlight.classList.remove('highlight');

            // Apply inline styles for the highlight color
            highlight.style.backgroundColor = backgroundColor;
            highlight.style.borderBottom = `1px dashed ${borderColor}`;

            // Add the annotation ID as a data attribute
            highlight.setAttribute(
              'data-annotation-id',
              annotationWithHighlights.id
            );

            // Also store the full annotation data as a serialized JSON string
            highlight.setAttribute(
              'data-annotation',
              JSON.stringify(annotationWithHighlights)
            );
          });
        }

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
  if (window.currentAnnotationIds && window.currentAnnotationIds.length > 0) {
    // Get all annotations from the annotator
    const savedAnnotations = [];
    const processedIds = new Set();

    // First try to find annotations with data-annotation-id attribute
    window.currentAnnotationIds.forEach((id) => {
      // Find all highlight elements for this annotation
      const highlightElements = document.querySelectorAll(
        `[data-annotation-id="${id}"]`
      );

      if (highlightElements.length > 0) {
        // Get the annotation data from the highlight attribute
        const annotationData =
          highlightElements[0].getAttribute('data-annotation');
        if (annotationData) {
          try {
            const annotation = JSON.parse(annotationData);
            if (annotation && !processedIds.has(annotation.id)) {
              savedAnnotations.push(annotation);
              processedIds.add(annotation.id);
            }
          } catch (e) {
            console.error('Error parsing annotation data:', e);
          }
        }
      }
    });

    if (savedAnnotations.length > 0) {
      // Store annotations in session storage
      sessionStorage.setItem(
        'savedAnnotations',
        JSON.stringify(savedAnnotations)
      );

      // Show success notification
      showNotification(
        `Saved ${savedAnnotations.length} annotations to session storage`,
        'Save Successful',
        'success'
      );
    } else {
      // Show warning notification
      showNotification('No annotations found to save', 'Warning', 'warning');
    }
  } else {
    // Show info notification
    showNotification('There are no annotations to save', 'Information', 'info');
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
    const savedAnnotations = sessionStorage.getItem('savedAnnotations');

    if (savedAnnotations) {
      // Parse the saved annotations
      const annotations = JSON.parse(savedAnnotations);

      if (annotations && annotations.length > 0) {
        // Clear any existing annotations
        clearAnnotations(false);

        // Initialize the annotation IDs array
        window.currentAnnotationIds = [];

        // Add each annotation to the page
        annotations.forEach((annotation) => {
          try {
            // Make sure the annotation has the color property directly on the object
            // This ensures compatibility with the new approach
            if (annotation.metadata && annotation.metadata.color && !annotation.color) {
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
              // Store the annotation data in the highlight elements
              highlights.forEach((highlight) => {
                // Store the annotation ID and data
                highlight.setAttribute('data-annotation-id', annotation.id);
                highlight.setAttribute(
                  'data-annotation',
                  JSON.stringify(annotation)
                );

                // Remove any existing highlight class
                highlight.classList.remove('highlight');

                // Get the color from the annotation, default to yellow if undefined
                const color = annotation.color || '#FFFF00';
                
                // Convert hex color to rgba with opacity
                const hexColor = color.replace('#', '');
                const r = parseInt(hexColor.substring(0, 2), 16);
                const g = parseInt(hexColor.substring(2, 4), 16);
                const b = parseInt(hexColor.substring(4, 6), 16);
                const backgroundColor = `rgba(${r}, ${g}, ${b}, 0.3)`;

                // Create border colors based on the original colors
                let borderColor;
                if (color === '#FFFF00') {
                  borderColor = '#e6c700'; // Yellow border
                } else if (color === '#90EE90') {
                  borderColor = '#4caf50'; // Green border
                } else if (color === '#ADD8E6') {
                  borderColor = '#2196f3'; // Blue border
                } else if (color === '#FFB6C1') {
                  borderColor = '#e91e63'; // Pink border
                } else {
                  // For custom colors, use a darker version of the same color
                  borderColor = `rgba(${Math.max(0, r - 40)}, ${Math.max(0, g - 40)}, ${Math.max(0, b - 40)}, 0.7}`;
                }
                
                // Apply inline styles - make sure to set them directly
                highlight.style.backgroundColor = backgroundColor;
                highlight.style.borderBottom = `1px dashed ${borderColor}`;
                
                // Store the color in a data attribute for future reference
                highlight.setAttribute('data-highlight-color', color);
              });
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

// Function to set up the color picker
function setupColorPicker() {
  const customColorCircle = document.querySelector('.color-circle.custom');
  const customColorInput = document.getElementById('custom-color');

  // When the rainbow circle is clicked, open the color picker
  customColorCircle.addEventListener('click', () => {
    customColorInput.click();
  });

  // When a color is selected in the color picker
  customColorInput.addEventListener('input', () => {
    // Deselect all radio buttons
    const colorRadios = document.getElementsByName('highlight-color');
    colorRadios.forEach((radio) => {
      radio.checked = false;
    });

    // Mark the custom color as active
    customColorInput.dataset.active = 'true';

    // Update the rainbow circle to show the selected color
    customColorCircle.style.background = customColorInput.value;
  });

  // When a predefined color is selected, deactivate the custom color
  const colorRadios = document.getElementsByName('highlight-color');
  colorRadios.forEach((radio) => {
    radio.addEventListener('change', () => {
      customColorInput.dataset.active = 'false';
      customColorCircle.style.background =
        'linear-gradient(135deg, #FFF 0%, #FFF 25%, #F0F 25%, #F0F 50%, #0FF 50%, #0FF 75%, #FF0 75%, #FF0 100%)';
    });
  });
}

// Function to set up event listeners for buttons
function setupEventListeners() {
  // Get the buttons
  const annotationButton = document.getElementById('annotation-btn');
  const saveButton = document.getElementById('save-btn');
  const clearButton = document.getElementById('clear-btn');

  // Initialize the annotation IDs array
  window.currentAnnotationIds = [];

  // Subscribe to annotator events
  annotator.getEvents().on('highlight', (event) => {
    console.log('Highlight event:', event);
  });

  // Add event listeners
  annotationButton.addEventListener('click', createAnnotation);
  saveButton.addEventListener('click', saveAnnotations);
  clearButton.addEventListener('click', clearAnnotations);
}

// Export functions for global access
window.createAnnotation = createAnnotation;
window.saveAnnotations = saveAnnotations;
window.clearAnnotations = clearAnnotations;
