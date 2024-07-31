import crypto from 'crypto';
import { HashAlgorithm } from '../../docs/docs';

class CryptoManager {
    readonly #_supportedAlgorithms: HashAlgorithm[] = ['SHA256', 'SHA512', 'MD5', 'SHA1'];
    readonly #_config = Object.seal({
        rounds: 37,
    })

    constructor() {
        const roundsStr = process.env.AuthCrypto_ROUNDS;

        if (roundsStr) {
            if (typeof roundsStr !== 'string') { throw new Error(`You must specify the number of rounds (AuthCrypto_ROUNDS) for the AuthCrypto module in the .env file`) }
            const rounds = Number.parseInt(roundsStr, 10);
            if (isNaN(rounds) || rounds < 1) { throw new SyntaxError('The number of rounds must be a valid number and cannot be less than one') }
            this.#_config.rounds = rounds;
        }
    }

    /**
     * Generates a random secret key for use with the HS512 signing algorithm.
     * 
     * The generated secret key is 64 bytes (512 bits) in length, which is suitable for use with the HS512 algorithm.
     * 
     * @returns {string} The generated secret key as a hex string.
     */
    generateSecret(): string {
        return crypto.randomBytes(64).toString('hex'); // 64 bytes = 512 bits
    }

    /**
     * Generates a random salt.
     * 
     * @param length - The length of the salt in bytes. Default is 512 bytes.
     * @returns {string} The generated salt as a hex string.
     * @throws {TypeError} If the length is not a positive integer.
     */
    generateSalt(length = 512): string {
        if (typeof length !== 'number' || length <= 0 || !Number.isInteger(length)) {
            throw new TypeError('The length must be a positive integer.');
        }

        // Convert the desired hex length to bytes
        const byteLength = Math.ceil(length / 2);
        return crypto.randomBytes(byteLength).toString('hex');
    }

    /**
     * Hashes an input string using the specified algorithm.
     * 
     * @param input - The input string to hash.
     * @param algorithm - The hash algorithm to use. Default is 'SHA512'.
     * @returns {string} The resulting hash as a hex string.
     * @throws {TypeError} If the input is not a string.
     * @throws {Error} If the algorithm is not supported.
     */
    hash(input: string, algorithm: HashAlgorithm = 'SHA512'): string {
        if (typeof input !== 'string') {
            throw new TypeError('The input must be a string.');
        }

        if (!this.#_supportedAlgorithms.includes(algorithm)) {
            throw new Error(`The algorithm ${algorithm} is not supported.`);
        }

        let hashedInput = input
        for (let i = 0; i < this.#_config.rounds; i++) {
            hashedInput = crypto.createHash(algorithm).update(hashedInput).digest('hex');
        }

        return hashedInput;
    }

    /**
     * Hashes an input string with a salt using the specified algorithm.
     * 
     * @param input - The input string to hash.
     * @param salt - The salt to use for hashing.
     * @param algorithm - The hash algorithm to use. Default is 'SHA512'.
     * @returns {string} The resulting salted hash as a hex string.
     * @throws {TypeError} If the input or salt is not a string.
     * @throws {Error} If the algorithm is not supported.
     */
    saltHash(input: string, salt: string, algorithm: HashAlgorithm = 'SHA512'): string {
        if (typeof input !== 'string') {
            throw new TypeError('The input must be a string.');
        }

        if (typeof salt !== 'string') {
            throw new TypeError('The salt must be a string.');
        }

        if (!this.#_supportedAlgorithms.includes(algorithm)) {
            throw new Error(`The algorithm ${algorithm} is not supported.`);
        }

        const saltedInput = input + salt;
        return this.hash(saltedInput, algorithm);
    }
}

export default new CryptoManager();