/**
 * Enterprise Geolocation Acquisition Service
 * 
 * Provides robust, multi-sample, progressive GPS location acquisition.
 * Handles device differences (Android Chrome, iOS Safari, Desktop browsers),
 * weak indoor signals, satellite warm-up delays, and precise error classification.
 */

export interface GpsCoordinates {
	latitude: number;
	longitude: number;
	accuracy: number; // in meters
	altitude?: number | null;
	heading?: number | null;
	speed?: number | null;
	deviceTimestamp: string;
}

export type GeolocationStatus =
	| "idle"
	| "locating"
	| "refining"
	| "acquired"
	| "error";

export interface GeolocationProgress {
	status: GeolocationStatus;
	message: string;
	currentAccuracy?: number;
	attempts?: number;
}

export interface AcquireLocationOptions {
	/** Desired high accuracy threshold in meters. If a reading achieves <= this, resolves immediately. Default: 25 */
	desiredAccuracy?: number;
	/** Maximum allowable accuracy in meters. Readings worse than this are rejected. Default: 500 */
	maxAcceptableAccuracy?: number;
	/** Maximum time in ms to attempt acquiring and refining location. Default: 12000 (12s) */
	timeoutMs?: number;
	/** Time in ms to wait for better accuracy after receiving first reading. Default: 3500 (3.5s) */
	refinementWindowMs?: number;
	/** Progress callback for UI feedback */
	onProgress?: (progress: GeolocationProgress) => void;
}

const isDev = process.env.NODE_ENV !== "production";

function logDebug(...args: unknown[]) {
	if (isDev) {
		console.debug("[Geolocation]", ...args);
	}
}

/**
 * Acquire GPS location using high accuracy and progressive multi-sample refinement.
 */
export async function acquireAccurateLocation(
	options: AcquireLocationOptions = {},
): Promise<GpsCoordinates> {
	const {
		desiredAccuracy = 25,
		maxAcceptableAccuracy = 500,
		timeoutMs = 12000,
		refinementWindowMs = 3500,
		onProgress,
	} = options;

	if (typeof window === "undefined" || !("navigator" in window)) {
		throw new Error("Geolocation is not available in non-browser environments.");
	}

	if (!("geolocation" in navigator)) {
		throw new Error(
			"Your browser or device does not support GPS/geolocation services.",
		);
	}

	// Verify Secure Context (HTTPS or localhost)
	if (window.isSecureContext === false && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") {
		throw new Error(
			"Geolocation requires a secure HTTPS connection. Please access the application over HTTPS.",
		);
	}

	// Check Permission API if supported
	if ("permissions" in navigator && navigator.permissions?.query) {
		try {
			const perm = await navigator.permissions.query({ name: "geolocation" as PermissionName });
			if (perm.state === "denied") {
				throw new Error(
					"Location permission is denied. Please enable location access in your browser or device settings.",
				);
			}
		} catch (permErr: any) {
			if (permErr?.message?.includes("permission is denied")) {
				throw permErr;
			}
			// Permissions API might not support 'geolocation' query on all browsers, continue
		}
	}

	onProgress?.({
		status: "locating",
		message: "Acquiring GPS location...",
		attempts: 0,
	});

	return new Promise<GpsCoordinates>((resolve, reject) => {
		let bestReading: GpsCoordinates | null = null;
		let watchId: number | null = null;
		let totalTimeoutTimer: ReturnType<typeof setTimeout> | null = null;
		let refinementTimer: ReturnType<typeof setTimeout> | null = null;
		let attempts = 0;
		let isSettled = false;

		const cleanup = () => {
			if (watchId !== null) {
				navigator.geolocation.clearWatch(watchId);
				watchId = null;
			}
			if (totalTimeoutTimer !== null) {
				clearTimeout(totalTimeoutTimer);
				totalTimeoutTimer = null;
			}
			if (refinementTimer !== null) {
				clearTimeout(refinementTimer);
				refinementTimer = null;
			}
		};

		const finishWithSuccess = (coords: GpsCoordinates) => {
			if (isSettled) return;
			isSettled = true;
			cleanup();
			logDebug(`Acquired valid position: accuracy=${coords.accuracy}m, lat=${coords.latitude}, lon=${coords.longitude}`);
			onProgress?.({
				status: "acquired",
				message: `Location verified (accuracy: ±${Math.round(coords.accuracy)}m)`,
				currentAccuracy: coords.accuracy,
				attempts,
			});
			resolve(coords);
		};

		const finishWithError = (errMessage: string) => {
			if (isSettled) return;
			isSettled = true;
			cleanup();
			logDebug(`Failed to acquire position: ${errMessage}`);
			onProgress?.({
				status: "error",
				message: errMessage,
				currentAccuracy: bestReading?.accuracy,
				attempts,
			});
			reject(new Error(errMessage));
		};

		const handlePosition = (pos: GeolocationPosition) => {
			attempts++;
			const rawAccuracy = pos.coords.accuracy ?? 100;
			const reading: GpsCoordinates = {
				latitude: pos.coords.latitude,
				longitude: pos.coords.longitude,
				accuracy: rawAccuracy,
				altitude: pos.coords.altitude,
				heading: pos.coords.heading,
				speed: pos.coords.speed,
				deviceTimestamp: new Date(pos.timestamp).toISOString(),
			};

			logDebug(`Attempt #${attempts}: lat=${reading.latitude}, lon=${reading.longitude}, accuracy=${rawAccuracy}m`);

			// Update best reading if this reading has better accuracy
			if (!bestReading || reading.accuracy < bestReading.accuracy) {
				bestReading = reading;
			}

			// If accuracy is already within desired high accuracy (e.g. <= 25m), resolve immediately
			if (reading.accuracy <= desiredAccuracy) {
				finishWithSuccess(reading);
				return;
			}

			// We have a usable reading (> desiredAccuracy). Update progress and schedule refinement completion
			onProgress?.({
				status: "refining",
				message: `Refining GPS accuracy... (current: ±${Math.round(bestReading.accuracy)}m)`,
				currentAccuracy: bestReading.accuracy,
				attempts,
			});

			// If not already refining, start the refinement grace window to let hardware settle
			if (!refinementTimer) {
				refinementTimer = setTimeout(() => {
					if (bestReading && bestReading.accuracy <= maxAcceptableAccuracy) {
						finishWithSuccess(bestReading);
					} else if (bestReading) {
						finishWithError(
							`GPS accuracy is currently low (±${Math.round(bestReading.accuracy)}m vs ${maxAcceptableAccuracy}m required). Move near a window or outdoors and try again.`,
						);
					}
				}, refinementWindowMs);
			}
		};

		const handleError = (error: GeolocationPositionError) => {
			logDebug(`Geolocation error: code=${error.code}, msg=${error.message}`);
			// If we already have a reasonably good reading, prefer using it over failing completely
			if (bestReading && bestReading.accuracy <= maxAcceptableAccuracy) {
				finishWithSuccess(bestReading);
				return;
			}

			let msg: string;
			switch (error.code) {
				case error.PERMISSION_DENIED:
					msg = "Location permission denied. Please enable location access in your browser or device settings.";
					break;
				case error.POSITION_UNAVAILABLE:
					msg = "GPS location unavailable. Please check that GPS/location services are turned on.";
					break;
				case error.TIMEOUT:
					if (bestReading && bestReading.accuracy <= maxAcceptableAccuracy) {
						finishWithSuccess(bestReading);
						return;
					}
					msg = "Location request timed out. Please check your GPS signal and retry.";
					break;
				default:
					msg = error.message || "Failed to acquire device location.";
					break;
			}
			finishWithError(msg);
		};

		try {
			// Start watching position for continuous high-accuracy stream
			watchId = navigator.geolocation.watchPosition(
				handlePosition,
				handleError,
				{
					enableHighAccuracy: true,
					timeout: timeoutMs,
					maximumAge: 0,
				},
			);
		} catch (err: any) {
			finishWithError(err?.message || "Could not initialize geolocation watch.");
		}

		// Overall global timeout guard
		totalTimeoutTimer = setTimeout(() => {
			if (bestReading && bestReading.accuracy <= maxAcceptableAccuracy) {
				finishWithSuccess(bestReading);
			} else if (bestReading) {
				finishWithError(
					`Location accuracy is currently low (±${Math.round(bestReading.accuracy)}m). Move to an open area and try again.`,
				);
			} else {
				finishWithError(
					"Could not acquire GPS position within time limit. Please ensure location is enabled and retry.",
				);
			}
		}, timeoutMs);
	});
}
