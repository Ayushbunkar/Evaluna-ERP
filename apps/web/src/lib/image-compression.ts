/**
 * Ultra-efficient Client-Side Image Compression for ERP Avatars
 *
 * Technique:
 * 1. Reads the user's uploaded image file (any resolution, up to 20MB) via FileReader.
 * 2. Loads into an offscreen HTML Image element.
 * 3. Calculates square center-crop dimensions (aspect-ratio 1:1) with max dimension 160x160 px.
 * 4. Renders onto an HTML5 Canvas using high-quality image smoothing.
 * 5. Exports as WebP (with JPEG fallback) at quality 0.72.
 * 6. Generates a compact base64 data URL string (< 6 KB - 12 KB).
 * 7. Instant storage directly in the database text column without external dependencies or disk bloat.
 */
export async function compressAvatar(file: File): Promise<string> {
	return new Promise((resolve, reject) => {
		if (!file.type.startsWith("image/")) {
			return reject(new Error("Please upload a valid image file."));
		}

		// Reject files larger than 25MB as a sanity check
		if (file.size > 25 * 1024 * 1024) {
			return reject(new Error("Image file is too large. Max size is 25MB."));
		}

		const reader = new FileReader();
		reader.onerror = () => reject(new Error("Failed to read image file."));
		reader.onload = () => {
			const img = new Image();
			img.onerror = () => reject(new Error("Failed to decode image."));
			img.onload = () => {
				const canvas = document.createElement("canvas");
				const size = 160; // 160x160 px is razor-sharp for 32px-80px avatar rendering
				canvas.width = size;
				canvas.height = size;
				const ctx = canvas.getContext("2d");
				if (!ctx) return reject(new Error("Canvas context unavailable."));

				ctx.imageSmoothingEnabled = true;
				ctx.imageSmoothingQuality = "high";

				// Center-crop to 1:1 square
				const minDim = Math.min(img.width, img.height);
				const sx = (img.width - minDim) / 2;
				const sy = (img.height - minDim) / 2;

				ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);

				// Try WebP first for optimal compression (~5KB - 8KB)
				try {
					const webpData = canvas.toDataURL("image/webp", 0.72);
					if (webpData.startsWith("data:image/webp")) {
						return resolve(webpData);
					}
				} catch {
					// Fall through to jpeg
				}

				// Fallback to JPEG (~8KB - 12KB)
				const jpegData = canvas.toDataURL("image/jpeg", 0.75);
				resolve(jpegData);
			};
			img.src = reader.result as string;
		};
		reader.readAsDataURL(file);
	});
}
