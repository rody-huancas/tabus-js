import type { ITransport } from "./transport.interface";
import type { TabusMessage } from "../core/types";

/** Transport backed by the browser / worker `BroadcastChannel` API. */
export class BroadcastTransport implements ITransport {
  private readonly bc: BroadcastChannel;

  constructor(channelName: string) {
    this.bc = new BroadcastChannel(channelName);
  }

  send(msg: TabusMessage): void {
    this.bc.postMessage(msg);
  }

  onMessage(listener: (msg: TabusMessage) => void): void {
    this.bc.addEventListener("message", (ev: MessageEvent<TabusMessage>) =>
      listener(ev.data),
    );
  }

  destroy(): void {
    this.bc.close();
  }
}
