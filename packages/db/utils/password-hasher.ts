// Hashing configuration
const SALT_ROUNDS = 10;

/**
 * Hashes a plaintext password using bcrypt.
 * @param password The plaintext password string.
 * @returns The hashed password string.
 */
export async function hashPassword(password: string): Promise<string> {
	if (!password) {
		throw new Error("Password cannot be empty.");
	}
	const bcrypt = await import("bcryptjs");
	const salt = await bcrypt.genSalt(SALT_ROUNDS);
	const hash = await bcrypt.hash(password, salt);
	return hash;
}

/**
 * Compares a plaintext password with a hash using bcrypt.
 * @param password The plaintext password string.
 * @returns True if the password matches the hash, false otherwise.
 */
export async function comparePassword(
	password: string,
	hash: string,
): Promise<boolean> {
	if (!password || !hash) return false;
	try {
		const bcrypt = await import("bcryptjs");
		return await bcrypt.compare(password, hash);
	} catch {
		return false;
	}
}
