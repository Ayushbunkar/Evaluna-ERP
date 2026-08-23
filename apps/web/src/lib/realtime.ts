import { EventEmitter } from "events";
import { type RouterOutputs } from "@/lib/trpc/router";

/**
 * Real-time update service for broadcasting data changes to connected clients.
 * Uses an in-memory EventEmitter for pub/sub functionality.
 */
class RealtimeService {
  private emitter: EventEmitter;
  private readonly EVENT_PREFIX = "dashboard:update";

  constructor() {
    this.emitter = new EventEmitter();
    // Set max listeners to handle many subscribers
    this.emitter.setMaxListeners(100);
  }

  /**
   * Subscribe to updates for a specific dashboard type and branch
   * @param callback - Function to call when updates are received
   * @returns Unsubscribe function
   */
  subscribe<T extends keyof RouterOutputs>(
    dashboardType: T,
    branchId: number | null,
    callback: (data: RouterOutputs[T]) => void
  ) {
    const eventName = `${this.EVENT_PREFIX}:${dashboardType}:${branchId ?? "global"}`;

    const handler = (data: RouterOutputs[T]) => {
      callback(data);
    };

    this.emitter.on(eventName, handler);

    // Return unsubscribe function
    return () => {
      this.emitter.off(eventName, handler);
    };
  }

  /**
   * Publish an update for a specific dashboard type and branch
   * @param dashboardType - Type of dashboard being updated
   * @param branchId - Branch ID for scoped updates (null for global)
   * @param data - The updated data to broadcast
   */
  publish<T extends keyof RouterOutputs>(
    dashboardType: T,
    branchId: number | null,
    data: RouterOutputs[T]
  ) {
    const eventName = `${this.EVENT_PREFIX}:${dashboardType}:${branchId ?? "global"}`;
    this.emitter.emit(eventName, data);
  }

  /**
   * Publish an update to all subscribers of a dashboard type (all branches)
   */
  broadcast<T extends keyof RouterOutputs>(
    dashboardType: T,
    data: RouterOutputs[T]
  ) {
    // Publish to global subscribers
    this.publish(dashboardType, null, data);

    // In a real implementation, you might want to broadcast to all branches
    // For now, we'll rely on individual branch subscriptions
  }

  /**
   * Get number of subscribers for a specific event (for debugging)
   */
  getSubscriberCount(dashboardType: keyof RouterOutputs, branchId: number | null): number {
    const eventName = `${this.EVENT_PREFIX}:${dashboardType}:${branchId ?? "global"}`;
    // @ts-ignore - EventEmitter doesn't expose listener count easily in older versions
    return this.emitter.listeners(eventName).length;
  }
}

// Export a singleton instance
export const realtimeService = new RealtimeService();