import * as bcrypt from "bcryptjs";
import crypto from "node:crypto";

// Hashing configuration
const SALT_ROUNDS = 10;

/**
 * Hashes a plaintext password using bcrypt.
 * @param password The plaintext password string.
 * @returns The hashed password string.
 */
export async function hashPassword(password: string): Promise<string> {
	if (!password) {
		// Securely handle an empty password request - this should be validated upstream,
		// but as a fail-safe, throw an error.
		throw new Error("Password cannot be empty.");
	}
	const salt = await bcrypt.genSalt(SALT_ROUNDS);
	const hash = await bcrypt.hash(password, salt);
	return hash;
}

/**
 * Compares a plaintext password with a hash (supporting bcrypt and scrypt).
 * @param password The plaintext password string.
 * @param hash The stored hash string.
 * @returns True if the password matches the hash, false otherwise.
 */
export async function comparePassword(
	password: string,
	hash: string,
): Promise<boolean> {
	if (!password || !hash) return false;
	try {
		if (
			hash.startsWith("$2a$") ||
			hash.startsWith("$2b$") ||
			hash.startsWith("$2y$")
		) {
			return await bcrypt.compare(password, hash);
		}

		if (hash.includes(":")) {
			const [salt, key] = hash.split(":");
			if (salt && key) {
				const keyBuffer = Buffer.from(key, "hex");
				const derivedKey = await new Promise<Buffer>((resolve, reject) => {
					crypto.scrypt(
						password.normalize(),
						salt,
						keyBuffer.length || 64,
						(err, derived) => {
							if (err) reject(err);
							else resolve(derived as Buffer);
						},
					);
				});
				if (keyBuffer.length === derivedKey.length) {
					return crypto.timingSafeEqual(keyBuffer, derivedKey);
				}
			}
		}

		return await bcrypt.compare(password, hash);
	} catch {
		return false;
	}
}
