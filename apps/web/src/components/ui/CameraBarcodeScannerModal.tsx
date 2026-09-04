"use client";

import { Button } from "@evaluna/ui/components/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@evaluna/ui/components/dialog";
import { Html5Qrcode } from "html5-qrcode";
import {
	CameraIcon,
	CheckCircle2Icon,
	RefreshCwIcon,
	SwitchCameraIcon,
	XIcon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface CameraBarcodeScannerModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onScan: (barcode: string) => void;
	title?: string;
	description?: string;
}

export function CameraBarcodeScannerModal({
	open,
	onOpenChange,
	onScan,
	title = "Scan Item Barcode with Camera",
	description = "Point your phone camera or webcam at the item barcode to scan automatically.",
}: CameraBarcodeScannerModalProps) {
	const scannerRef = useRef<Html5Qrcode | null>(null);
	const [cameraError, setCameraError] = useState<string | null>(null);
	const [cameras, setCameras] = useState<{ id: string; label: string }[]>([]);
	const [selectedCameraId, setSelectedCameraId] = useState<string>("");
	const [isScanning, setIsScanning] = useState(false);
	const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);

	const regionId = "html5qr-code-full-region";

	useEffect(() => {
		if (open) {
			setCameraError(null);
			setLastScannedCode(null);
			// Fetch available cameras
			Html5Qrcode.getCameras()
				.then((devices) => {
					if (devices && devices.length > 0) {
						setCameras(devices);
						// Prefer back camera if available
						const backCam = devices.find(
							(d) =>
								d.label.toLowerCase().includes("back") ||
								d.label.toLowerCase().includes("environment"),
						);
						setSelectedCameraId(backCam ? backCam.id : devices[0].id);
					} else {
						setCameraError("No camera devices found on this device.");
					}
				})
				.catch((err) => {
					console.error("Error getting cameras:", err);
					setCameraError("Camera permission denied or camera unavailable.");
				});
		} else {
			stopScanner();
		}
	}, [open]);

	useEffect(() => {
		if (open && selectedCameraId) {
			startScanner(selectedCameraId);
		}
		return () => {
			stopScanner();
		};
	}, [selectedCameraId, open]);

	const startScanner = async (cameraId: string) => {
		await stopScanner();
		try {
			const html5Qrcode = new Html5Qrcode(regionId);
			scannerRef.current = html5Qrcode;

			await html5Qrcode.start(
				cameraId,
				{
					fps: 10,
					qrbox: { width: 250, height: 180 },
					aspectRatio: 1.0,
				},
				(decodedText) => {
					// Audio feedback beep
					playBeepSound();
					setLastScannedCode(decodedText);
					onScan(decodedText);
					// Flash green then close or wait for next scan
					setTimeout(() => {
						onOpenChange(false);
					}, 500);
				},
				(errorMessage) => {
					// Ignore parse frame errors
				},
			);
			setIsScanning(true);
		} catch (err: any) {
			console.error("Failed to start camera scanner:", err);
			setCameraError(
				"Unable to start video stream: " + (err?.message || "Unknown error"),
			);
		}
	};

	const stopScanner = async () => {
		if (scannerRef.current && isScanning) {
			try {
				await scannerRef.current.stop();
				scannerRef.current.clear();
			} catch (err) {
				console.error("Failed to stop scanner:", err);
			}
			setIsScanning(false);
		}
	};

	const playBeepSound = () => {
		try {
			const ctx = new (
				window.AudioContext || (window as any).webkitAudioContext
			)();
			const osc = ctx.createOscillator();
			const gain = ctx.createGain();
			osc.type = "sine";
			osc.frequency.setValueAtTime(880, ctx.currentTime); // 880 Hz beep
			gain.gain.setValueAtTime(0.1, ctx.currentTime);
			osc.connect(gain);
			gain.connect(ctx.destination);
			osc.start();
			osc.stop(ctx.currentTime + 0.15);
		} catch (e) {
			// Ignore audio context errors
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[450px]">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
						<CameraIcon className="h-5 w-5 text-blue-600" />
						{title}
					</DialogTitle>
					<DialogDescription className="text-xs sm:text-sm">
						{description}
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-3 py-2">
					{/* Camera Selector Dropdown */}
					{cameras.length > 1 && (
						<div className="flex items-center gap-2 text-xs">
							<SwitchCameraIcon className="h-4 w-4 text-gray-500" />
							<select
								className="flex-1 rounded-md border border-input bg-background px-3 py-1.5 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
								value={selectedCameraId}
								onChange={(e) => setSelectedCameraId(e.target.value)}
							>
								{cameras.map((c) => (
									<option key={c.id} value={c.id}>
										{c.label || `Camera ${c.id}`}
									</option>
								))}
							</select>
						</div>
					)}

					{/* Camera Video Viewfinder */}
					<div className="relative flex min-h-[260px] flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-blue-500 border-dashed bg-black">
						<div id={regionId} className="h-full min-h-[250px] w-full" />

						{lastScannedCode && (
							<div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-green-900/90 p-4 text-center text-white">
								<CheckCircle2Icon className="mb-2 h-12 w-12 animate-bounce text-green-300" />
								<p className="font-bold text-lg">Barcode Scanned!</p>
								<p className="mt-1 rounded bg-black/40 px-3 py-1 font-mono text-sm">
									{lastScannedCode}
								</p>
							</div>
						)}

						{cameraError && (
							<div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/95 p-6 text-center text-destructive">
								<XIcon className="mb-2 h-10 w-10 opacity-80" />
								<p className="font-semibold text-sm">{cameraError}</p>
								<Button
									variant="outline"
									size="sm"
									className="mt-3"
									onClick={() =>
										selectedCameraId && startScanner(selectedCameraId)
									}
								>
									<RefreshCwIcon className="mr-1 h-3.5 w-3.5" /> Retry Camera
								</Button>
							</div>
						)}
					</div>

					<p className="text-center text-[11px] text-muted-foreground">
						Position the barcode inside the box frame. Fits standard EAN-13,
						Code-128 & QR barcodes.
					</p>
				</div>
			</DialogContent>
		</Dialog>
	);
}
