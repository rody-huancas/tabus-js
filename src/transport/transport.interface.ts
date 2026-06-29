import type { TabusMessage } from "../core/types";

export interface ITransport {
  /**
   * Sends a message to all listeners registered on the channel.
   * @param msg - The message to broadcast.
   */
  send(msg: TabusMessage): void;

  /**
   * Registers an incoming-message listener.
   * @param listener - Callback invoked with each incoming message.
   */
  onMessage(listener: (msg: TabusMessage) => void): void;

  /**
   * Tears down the transport and releases all held resources.
   */
  destroy(): void;
}
