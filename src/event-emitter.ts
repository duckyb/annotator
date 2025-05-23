/**
 * A simple event emitter implementation to replace RxJS Subject
 */

import type { EventEmitterInterface } from './types';

/**
 * EventEmitter class for handling events in a framework-agnostic way
 */
export class EventEmitter implements EventEmitterInterface {
  private listeners: Map<string, Array<(data: unknown) => void>> = new Map();

  /**
   * Register an event listener
   * @param event The event name to listen for
   * @param callback The callback function to execute when the event occurs
   * @returns A function to remove the listener
   */
  on(event: string, callback: (data: unknown) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }

    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.push(callback);
    }

    // Return a function to remove this listener
    return () => {
      const listeners = this.listeners.get(event);
      if (listeners) {
        const index = listeners.indexOf(callback);
        if (index !== -1) {
          listeners.splice(index, 1);
        }
      }
    };
  }

  /**
   * Emit an event with data
   * @param event The event name to emit
   * @param data The data to pass to listeners
   */
  emit(event: string, data: unknown): void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Remove all listeners for an event
   * @param event The event name to clear listeners for
   */
  removeAllListeners(event?: string): void {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }
}
