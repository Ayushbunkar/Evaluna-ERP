import { EventEmitter } from "node:events";

export interface StockChangeEvent {
	productId?: number;
	branchId?: number;
	timestamp: number;
}

declare global {
	var __stockEventBus: EventEmitter | undefined;
}

const stockEventBus: EventEmitter =
	globalThis.__stockEventBus || new EventEmitter();
stockEventBus.setMaxListeners(200);

if (process.env.NODE_ENV !== "production") {
	globalThis.__stockEventBus = stockEventBus;
}

export function notifyStockChanged(productId?: number, branchId?: number) {
	const event: StockChangeEvent = {
		productId,
		branchId,
		timestamp: Date.now(),
	};
	stockEventBus.emit("stock_changed", event);
}

export function subscribeStockChanged(
	callback: (event: StockChangeEvent) => void,
) {
	stockEventBus.on("stock_changed", callback);
	return () => {
		stockEventBus.off("stock_changed", callback);
	};
}

export { stockEventBus };
