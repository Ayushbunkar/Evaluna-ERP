import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { acquireAccurateLocation } from "../geolocation";

describe("Enterprise Geolocation Acquisition Service", () => {
	const originalNavigator = globalThis.navigator;
	const originalWindow = globalThis.window;

	beforeEach(() => {
		// Mock browser window and navigator
		// @ts-ignore
		globalThis.window = {
			isSecureContext: true,
			location: { hostname: "localhost" },
			navigator: {},
		};
	});

	afterEach(() => {
		// @ts-ignore
		globalThis.navigator = originalNavigator;
		// @ts-ignore
		globalThis.window = originalWindow;
	});

	it("throws an informative error if geolocation is not supported on device", async () => {
		// @ts-ignore
		globalThis.navigator = {};
		// @ts-ignore
		globalThis.window.navigator = {};

		await expect(acquireAccurateLocation()).rejects.toThrow(/does not support GPS/i);
	});

	it("throws error if connection is insecure and not localhost", async () => {
		// @ts-ignore
		globalThis.window.isSecureContext = false;
		// @ts-ignore
		globalThis.window.location.hostname = "erp.example.com";
		// @ts-ignore
		globalThis.navigator = { geolocation: { watchPosition: () => 1, clearWatch: () => {} } };

		await expect(acquireAccurateLocation()).rejects.toThrow(/secure HTTPS connection/i);
	});

	it("resolves immediately when a high-accuracy GPS fix (<= 25m) is received", async () => {
		let clearedWatchId: number | null = null;
		// @ts-ignore
		globalThis.navigator = {
			geolocation: {
				watchPosition: (success: (pos: any) => void) => {
					setTimeout(() => {
						success({
							coords: {
								latitude: 12.9716,
								longitude: 77.5946,
								accuracy: 12,
								altitude: null,
								heading: null,
								speed: null,
							},
							timestamp: Date.now(),
						});
					}, 10);
					return 42;
				},
				clearWatch: (id: number) => {
					clearedWatchId = id;
				},
			},
		};

		const coords = await acquireAccurateLocation({ desiredAccuracy: 25 });
		expect(coords.latitude).toBe(12.9716);
		expect(coords.longitude).toBe(77.5946);
		expect(coords.accuracy).toBe(12);
		expect(clearedWatchId).toBe(42);
	});

	it("selects the best (lowest accuracy value) reading during multi-sample refinement", async () => {
		let clearedWatchId: number | null = null;
		// @ts-ignore
		globalThis.navigator = {
			geolocation: {
				watchPosition: (success: (pos: any) => void) => {
					// 1st sample: coarse reading (85m)
					setTimeout(() => {
						success({
							coords: {
								latitude: 12.9710,
								longitude: 77.5940,
								accuracy: 85,
							},
							timestamp: Date.now(),
						});
					}, 10);

					// 2nd sample: refined reading (35m)
					setTimeout(() => {
						success({
							coords: {
								latitude: 12.9716,
								longitude: 77.5946,
								accuracy: 35,
							},
							timestamp: Date.now(),
						});
					}, 50);

					// 3rd sample: slightly jittered reading (40m)
					setTimeout(() => {
						success({
							coords: {
								latitude: 12.9715,
								longitude: 77.5945,
								accuracy: 40,
							},
							timestamp: Date.now(),
						});
					}, 80);

					return 99;
				},
				clearWatch: (id: number) => {
					clearedWatchId = id;
				},
			},
		};

		const coords = await acquireAccurateLocation({
			desiredAccuracy: 20,
			refinementWindowMs: 120,
			timeoutMs: 500,
		});

		// It should select the 2nd sample with accuracy 35m (best among 85m, 35m, 40m)
		expect(coords.accuracy).toBe(35);
		expect(coords.latitude).toBe(12.9716);
		expect(coords.longitude).toBe(77.5946);
		expect(clearedWatchId).toBe(99);
	});

	it("rejects gracefully when accuracy remains worse than maxAcceptableAccuracy", async () => {
		// @ts-ignore
		globalThis.navigator = {
			geolocation: {
				watchPosition: (success: (pos: any) => void) => {
					setTimeout(() => {
						success({
							coords: {
								latitude: 12.9710,
								longitude: 77.5940,
								accuracy: 850, // very coarse accuracy
							},
							timestamp: Date.now(),
						});
					}, 10);
					return 101;
				},
				clearWatch: () => {},
			},
		};

		await expect(
			acquireAccurateLocation({
				desiredAccuracy: 25,
				maxAcceptableAccuracy: 500,
				refinementWindowMs: 50,
				timeoutMs: 100,
			}),
		).rejects.toThrow(/accuracy is currently low/i);
	});

	it("maps PERMISSION_DENIED error to user-actionable instructions", async () => {
		// @ts-ignore
		globalThis.navigator = {
			geolocation: {
				watchPosition: (_success: any, error: (err: any) => void) => {
					setTimeout(() => {
						error({
							code: 1, // PERMISSION_DENIED
							PERMISSION_DENIED: 1,
							POSITION_UNAVAILABLE: 2,
							TIMEOUT: 3,
							message: "User denied Geolocation",
						});
					}, 10);
					return 102;
				},
				clearWatch: () => {},
			},
		};

		await expect(acquireAccurateLocation()).rejects.toThrow(/permission denied/i);
	});
});
