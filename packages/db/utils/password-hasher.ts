import * as bcrypt from "bcryptjs";

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
 * Compares a plaintext password with a hash.
 * @param password The plaintext password string.
 * @param hash The stored hash string.
 * @returns True if the password matches the hash, false otherwise.
 */
export async function comparePassword(
	password: string,
	hash: string,
): Promise<boolean> {
	return bcrypt.compare(password, hash);
}
