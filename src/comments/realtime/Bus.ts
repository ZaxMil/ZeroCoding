export type BusEvent =
  | { type: 'comments:changed'; payload?: any }
  | { type: 'comments:moderation'; payload?: any };

export class Bus {
  private channel?: BroadcastChannel;
  private listeners: Set<(e: BusEvent) => void> = new Set();

  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      this.channel = new BroadcastChannel('comments:bus');
      this.channel.onmessage = (ev) => this.emit(ev.data as BusEvent);
    }
  }

  on(listener: (e: BusEvent) => void) {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  }

  emit(e: BusEvent) {
    for (const l of this.listeners) l(e);
  }

  publish(e: BusEvent) {
    if (this.channel) this.channel.postMessage(e);
    this.emit(e);
  }
}

export const bus = new Bus();
