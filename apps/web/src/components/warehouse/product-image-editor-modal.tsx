"use client";

import { Button } from "@evaluna/ui/components/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@evaluna/ui/components/dialog";
import {
	CheckIcon,
	Grid3X3Icon,
	Loader2Icon,
	MoveIcon,
	RotateCcwIcon,
	RotateCwIcon,
	Undo2Icon,
	ZoomInIcon,
	ZoomOutIcon,
} from "lucide-react";
import { useLocale } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

interface ProductImageEditorModalProps {
	isOpen: boolean;
	onClose: () => void;
	imageUrl: string;
	fileName?: string;
	onSave: (editedFile: File) => Promise<void> | void;
	isSaving?: boolean;
}

export function ProductImageEditorModal({
	isOpen,
	onClose,
	imageUrl,
	fileName = "product-image.jpg",
	onSave,
	isSaving = false,
}: ProductImageEditorModalProps) {
	const locale = useLocale();

	// Transformations
	const [zoom, setZoom] = useState<number>(1);
	const [rotation, setRotation] = useState<number>(0);
	const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
	const [showGrid, setShowGrid] = useState<boolean>(true);
	const [isProcessing, setIsProcessing] = useState<boolean>(false);

	// Dragging state
	const isDraggingRef = useRef(false);
	const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
	const currentPanRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

	// Viewport & Image references
	const viewportRef = useRef<HTMLDivElement>(null);
	const imgRef = useRef<HTMLImageElement>(null);

	// Reset state when opening a new image
	useEffect(() => {
		if (isOpen) {
			setZoom(1);
			setRotation(0);
			setPan({ x: 0, y: 0 });
			currentPanRef.current = { x: 0, y: 0 };
			setShowGrid(true);
		}
	}, [isOpen, imageUrl]);

	// Zoom handlers (zoom in / zoom back)
	const handleZoomChange = (newZoom: number) => {
		const clamped = Math.max(0.5, Math.min(3, Number(newZoom.toFixed(2))));
		setZoom(clamped);
	};

	const handleZoomIn = () => {
		handleZoomChange(zoom + 0.15);
	};

	const handleZoomOut = () => {
		handleZoomChange(zoom - 0.15);
	};

	const handleReset = () => {
		setZoom(1);
		setRotation(0);
		setPan({ x: 0, y: 0 });
		currentPanRef.current = { x: 0, y: 0 };
	};

	// Rotation handlers
	const handleRotateCw = () => {
		setRotation((prev) => (prev + 90) % 360);
	};

	const handleRotateCcw = () => {
		setRotation((prev) => (prev - 90 + 360) % 360);
	};

	// Pointer Drag / Pan handlers
	const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
		if (e.button !== 0) return; // Primary mouse button only
		isDraggingRef.current = true;
		dragStartRef.current = {
			x: e.clientX - pan.x,
			y: e.clientY - pan.y,
		};
		(e.target as HTMLElement).setPointerCapture(e.pointerId);
	};

	const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
		if (!isDraggingRef.current) return;
		const nextX = e.clientX - dragStartRef.current.x;
		const nextY = e.clientY - dragStartRef.current.y;
		setPan({ x: nextX, y: nextY });
		currentPanRef.current = { x: nextX, y: nextY };
	};

	const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
		if (isDraggingRef.current) {
			isDraggingRef.current = false;
			try {
				(e.target as HTMLElement).releasePointerCapture(e.pointerId);
			} catch {}
		}
	};

	// Save edited image using HTML5 Canvas
	const handleApply = async () => {
		if (!imageUrl) return;
		setIsProcessing(true);

		try {
			const img = new Image();
			if (!imageUrl.startsWith("blob:") && !imageUrl.startsWith("data:")) {
				img.crossOrigin = "anonymous";
			}

			await new Promise<void>((resolve, reject) => {
				img.onload = () => resolve();
				img.onerror = () =>
					reject(new Error("Failed to load image for editing."));
				img.src = imageUrl;
			});

			const canvas = document.createElement("canvas");
			const outputSize = 800; // 800x800 square standard
			canvas.width = outputSize;
			canvas.height = outputSize;

			const ctx = canvas.getContext("2d");
			if (!ctx) throw new Error("Could not initialize image editing canvas.");

			// Enable smooth rendering
			ctx.imageSmoothingEnabled = true;
			ctx.imageSmoothingQuality = "high";

			// Fill white background for products (clean catalog look)
			ctx.fillStyle = "#ffffff";
			ctx.fillRect(0, 0, outputSize, outputSize);

			// Viewport dimension ratio
			const viewportSize = viewportRef.current?.clientWidth || 320;
			const ratio = outputSize / viewportSize;

			// Transform canvas context
			ctx.save();
			ctx.translate(
				outputSize / 2 + pan.x * ratio,
				outputSize / 2 + pan.y * ratio,
			);
			ctx.rotate((rotation * Math.PI) / 180);
			ctx.scale(zoom, zoom);

			// Calculate centered drawing coordinates preserving aspect ratio
			const imgWidth = img.naturalWidth || img.width;
			const imgHeight = img.naturalHeight || img.height;
			const maxDim = Math.max(imgWidth, imgHeight);

			// Fit image nicely into viewport base
			const scaleToFit = outputSize / maxDim;
			const renderW = imgWidth * scaleToFit;
			const renderH = imgHeight * scaleToFit;

			ctx.drawImage(img, -renderW / 2, -renderH / 2, renderW, renderH);
			ctx.restore();

			// Export to Blob
			const blob = await new Promise<Blob | null>((resolve) => {
				canvas.toBlob((b) => resolve(b), "image/jpeg", 0.92);
			});

			if (!blob) throw new Error("Failed to process edited image blob.");

			const cleanName = `${fileName.replace(/\.[^/.]+$/, "")}-edited.jpg`;
			const editedFile = new File([blob], cleanName, { type: "image/jpeg" });

			await onSave(editedFile);
			toast.success(
				locale === "hi"
					? "फोटो सफलतापूर्वक संपादित और सेव की गई!"
					: "Image edited and saved successfully!",
			);
			onClose();
		} catch (err: unknown) {
			console.error("[ProductImageEditorModal] Error applying edits:", err);
			const errorMsg =
				err instanceof Error ? err.message : "Failed to process image edits.";
			toast.error(errorMsg);
		} finally {
			setIsProcessing(false);
		}
	};

	return (
		<Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
			<DialogContent className="max-h-[95vh] max-w-xl overflow-y-auto p-5 sm:p-6">
				<DialogHeader className="pb-2">
					<DialogTitle className="flex items-center gap-2 font-bold text-base sm:text-lg">
						<RotateCwIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
						<span>
							{locale === "hi"
								? "उत्पाद फोटो संपादित करें (Edit, Zoom & Rotate)"
								: "Edit Product Photo (Zoom, Grid & Rotate)"}
						</span>
					</DialogTitle>
					<DialogDescription className="text-xs">
						{locale === "hi"
							? "ज़ूम इन/आउट करें, फोटो घुमाएँ, और ग्रिड लाइनों की मदद से इमेज को सही स्थिति में सेट करें।"
							: "Zoom in/out, rotate 90°, and use grid lines to perfectly align and center your product photo."}
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4 py-2">
					{/* Interactive Viewport Area */}
					<div className="flex flex-col items-center">
						<div
							ref={viewportRef}
							onPointerDown={handlePointerDown}
							onPointerMove={handlePointerMove}
							onPointerUp={handlePointerUp}
							className="relative h-72 w-72 cursor-grab touch-none select-none overflow-hidden rounded-xl border-2 border-slate-300 bg-slate-900 shadow-inner active:cursor-grabbing sm:h-80 sm:w-80 dark:border-slate-700"
							title={
								locale === "hi"
									? "फोटो को खिसकाने के लिए ड्रैग करें"
									: "Click and drag to reposition image"
							}
						>
							{/* Background transparency checkerboard */}
							<div
								className="absolute inset-0 opacity-15"
								style={{
									backgroundImage:
										"radial-gradient(#ffffff 1px, transparent 1px)",
									backgroundSize: "16px 16px",
								}}
							/>

							{/* Transformed Image */}
							<div
								className="pointer-events-none absolute inset-0 flex items-center justify-center transition-transform duration-75 ease-out"
								style={{
									transform: `translate(${pan.x}px, ${pan.y}px) rotate(${rotation}deg) scale(${zoom})`,
									transformOrigin: "center center",
								}}
							>
								<img
									ref={imgRef}
									src={imageUrl}
									alt="Preview to edit"
									className="pointer-events-none max-h-full max-w-full object-contain"
									draggable={false}
								/>
							</div>

							{/* Rule of Thirds Grid Lines Overlay */}
							{showGrid && (
								<div className="pointer-events-none absolute inset-0 z-10">
									{/* Vertical grid lines */}
									<div className="absolute top-0 bottom-0 left-1/3 w-[1px] border-white/60 border-r border-dashed bg-white/40 shadow-[0_0_2px_rgba(0,0,0,0.8)]" />
									<div className="absolute top-0 bottom-0 left-2/3 w-[1px] border-white/60 border-r border-dashed bg-white/40 shadow-[0_0_2px_rgba(0,0,0,0.8)]" />

									{/* Horizontal grid lines */}
									<div className="absolute top-1/3 right-0 left-0 h-[1px] border-white/60 border-b border-dashed bg-white/40 shadow-[0_0_2px_rgba(0,0,0,0.8)]" />
									<div className="absolute top-2/3 right-0 left-0 h-[1px] border-white/60 border-b border-dashed bg-white/40 shadow-[0_0_2px_rgba(0,0,0,0.8)]" />

									{/* Center alignment crosshair */}
									<div className="pointer-events-none absolute top-1/2 left-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 opacity-60">
										<div className="absolute top-1/2 right-0 left-0 h-[1.5px] -translate-y-1/2 bg-amber-400" />
										<div className="absolute top-0 bottom-0 left-1/2 w-[1.5px] -translate-x-1/2 bg-amber-400" />
									</div>

									{/* Corner frame markers */}
									<div className="absolute top-2 left-2 h-4 w-4 border-white/70 border-t-2 border-l-2" />
									<div className="absolute top-2 right-2 h-4 w-4 border-white/70 border-t-2 border-r-2" />
									<div className="absolute bottom-2 left-2 h-4 w-4 border-white/70 border-b-2 border-l-2" />
									<div className="absolute right-2 bottom-2 h-4 w-4 border-white/70 border-r-2 border-b-2" />
								</div>
							)}

							{/* Reposition hint pill */}
							<div className="pointer-events-none absolute bottom-2 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 font-medium text-[10px] text-white backdrop-blur-xs">
								<MoveIcon className="h-2.5 w-2.5" />
								<span>
									{locale === "hi" ? "ड्रैग करके सेट करें" : "Drag to reposition"}
								</span>
							</div>
						</div>
					</div>

					{/* Control Toolbar */}
					<div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-3.5 dark:border-slate-800 dark:bg-slate-900/60">
						{/* 1. Zoom in and Zoom back Controls */}
						<div className="space-y-1.5">
							<div className="flex items-center justify-between font-semibold text-xs">
								<span className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200">
									<ZoomInIcon className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
									<span>
										{locale === "hi"
											? "ज़ूम इन / ज़ूम बैक (Zoom)"
											: "Zoom In / Zoom Back"}
									</span>
								</span>
								<span className="font-mono text-[11px] text-muted-foreground">
									{Math.round(zoom * 100)}%
								</span>
							</div>

							<div className="flex items-center gap-2">
								<Button
									type="button"
									size="icon"
									variant="outline"
									onClick={handleZoomOut}
									disabled={zoom <= 0.5}
									className="h-7 w-7 shrink-0 text-slate-700 dark:text-slate-300"
									title={locale === "hi" ? "ज़ूम बैक (-)" : "Zoom Out / Back (-)"}
								>
									<ZoomOutIcon className="h-3.5 w-3.5" />
								</Button>

								<input
									type="range"
									min="0.5"
									max="3"
									step="0.05"
									value={zoom}
									onChange={(e) =>
										handleZoomChange(Number.parseFloat(e.target.value))
									}
									className="h-2 flex-1 cursor-pointer appearance-none rounded-lg bg-slate-200 accent-blue-600 dark:bg-slate-700"
								/>

								<Button
									type="button"
									size="icon"
									variant="outline"
									onClick={handleZoomIn}
									disabled={zoom >= 3}
									className="h-7 w-7 shrink-0 text-slate-700 dark:text-slate-300"
									title={locale === "hi" ? "ज़ूम इन (+)" : "Zoom In (+)"}
								>
									<ZoomInIcon className="h-3.5 w-3.5" />
								</Button>

								<Button
									type="button"
									size="sm"
									variant="ghost"
									onClick={() => handleZoomChange(1)}
									className="h-7 shrink-0 px-2 font-mono text-[11px] text-muted-foreground hover:text-foreground"
									title="Reset zoom to 100%"
								>
									1x (Fit)
								</Button>
							</div>
						</div>

						{/* 2. Rotate & Grid Lines Toolbar */}
						<div className="flex flex-wrap items-center justify-between gap-2 border-slate-200/80 border-t pt-2 dark:border-slate-800/80">
							{/* Rotate buttons */}
							<div className="flex items-center gap-1.5">
								<span className="mr-1 hidden font-semibold text-muted-foreground text-xs sm:inline">
									{locale === "hi" ? "रोटेट:" : "Rotate:"}
								</span>
								<Button
									type="button"
									size="sm"
									variant="outline"
									onClick={handleRotateCcw}
									className="h-7 gap-1 px-2 text-xs"
									title={
										locale === "hi"
											? "90° बाएँ घुमाएँ"
											: "Rotate 90° Counter-Clockwise"
									}
								>
									<RotateCcwIcon className="h-3 w-3" />
									<span>-90°</span>
								</Button>

								<Button
									type="button"
									size="sm"
									variant="outline"
									onClick={handleRotateCw}
									className="h-7 gap-1 px-2 text-xs"
									title={
										locale === "hi" ? "90° दाएँ घुमाएँ" : "Rotate 90° Clockwise"
									}
								>
									<RotateCwIcon className="h-3 w-3" />
									<span>+90°</span>
								</Button>

								{rotation !== 0 && (
									<span className="px-1 font-mono font-semibold text-[11px] text-blue-600 dark:text-blue-400">
										{rotation}°
									</span>
								)}
							</div>

							{/* Grid lines toggle and Reset button */}
							<div className="flex items-center gap-1.5">
								<Button
									type="button"
									size="sm"
									variant={showGrid ? "default" : "outline"}
									onClick={() => setShowGrid(!showGrid)}
									className={`h-7 gap-1 px-2.5 text-xs ${
										showGrid
											? "bg-blue-600 text-white hover:bg-blue-700"
											: "text-slate-700 dark:text-slate-300"
									}`}
									title={
										locale === "hi"
											? "ग्रिड लाइनें ऑन/ऑफ"
											: "Toggle 3x3 Grid Lines"
									}
								>
									<Grid3X3Icon className="h-3 w-3" />
									<span>{locale === "hi" ? "ग्रिड लाइनें" : "Grid Lines"}</span>
								</Button>

								<Button
									type="button"
									size="sm"
									variant="ghost"
									onClick={handleReset}
									disabled={
										zoom === 1 && rotation === 0 && pan.x === 0 && pan.y === 0
									}
									className="h-7 gap-1 px-2 text-muted-foreground text-xs hover:text-foreground"
									title={
										locale === "hi"
											? "सभी बदलाव रीसेट करें"
											: "Reset Zoom & Rotation"
									}
								>
									<Undo2Icon className="h-3 w-3" />
									<span>{locale === "hi" ? "रीसेट" : "Reset"}</span>
								</Button>
							</div>
						</div>
					</div>
				</div>

				<DialogFooter className="flex flex-row items-center justify-end gap-2 border-slate-200/80 border-t pt-2 dark:border-slate-800/80">
					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={onClose}
						disabled={isProcessing || isSaving}
					>
						{locale === "hi" ? "रद्द करें" : "Cancel"}
					</Button>

					<Button
						type="button"
						size="sm"
						onClick={handleApply}
						disabled={isProcessing || isSaving}
						className="gap-1.5 bg-blue-600 font-semibold text-white text-xs hover:bg-blue-700"
					>
						{isProcessing || isSaving ? (
							<>
								<Loader2Icon className="h-3.5 w-3.5 animate-spin" />
								<span>
									{locale === "hi" ? "सेव हो रहा है..." : "Applying..."}
								</span>
							</>
						) : (
							<>
								<CheckIcon className="h-3.5 w-3.5" />
								<span>
									{locale === "hi"
										? "बदलाव लागू करें (Apply & Save)"
										: "Apply & Save"}
								</span>
							</>
						)}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
