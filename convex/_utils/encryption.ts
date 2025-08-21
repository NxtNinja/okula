/**
 * Server-side encryption utilities for Convex
 * These functions run in the Convex backend
 */

/**
 * Simple hash function for server-side use
 */
const simpleHash = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
};

/**
 * Generates a deterministic encryption key based on conversation and participants
 * This ensures all participants can derive the same key
 */
export const generateServerEncryptionKey = (
  conversationId: string,
  participantIds: string[]
): string => {
  // Sort participant IDs to ensure consistent key generation
  const sortedIds = [...participantIds].sort();
  const combined = `${conversationId}-${sortedIds.join('-')}-${process.env.ENCRYPTION_SALT || 'default-salt'}`;
  return simpleHash(combined);
};

/**
 * Manual AES-like encryption (simplified for Convex environment)
 * In production, consider using a proper crypto library or external service
 */
const aesEncrypt = (text: string, key: string): string => {
  // This is a simplified encryption - in production use proper AES
  // For now, we'll use a more robust character encoding
  const keyHash = simpleHash(key);
  let encrypted = '';
  
  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i);
    const keyChar = keyHash.charCodeAt(i % keyHash.length);
    // XOR with key and add position-based salt
    const encryptedChar = charCode ^ keyChar ^ (i * 13);
    // Convert to hex for safe storage
    encrypted += encryptedChar.toString(16).padStart(4, '0');
  }
  
  // Add a simple checksum for integrity
  const checksum = simpleHash(text + key).substring(0, 8);
  return checksum + ':' + encrypted;
};

/**
 * Encrypts a message on the server
 */
export const serverEncryptMessage = (message: string, key: string): string => {
  try {
    return aesEncrypt(message, key);
  } catch (error) {
    console.error('Server encryption error:', error);
    throw new Error('Failed to encrypt message');
  }
};

/**
 * Encrypts an array of messages on the server
 */
export const serverEncryptMessageArray = (messages: string[], key: string): string[] => {
  return messages.map(msg => serverEncryptMessage(msg, key));
};

/**
 * Creates a hash of the key for verification
 */
export const serverHashKey = (key: string): string => {
  return simpleHash(key);
};

/**
 * Decrypts a message on the server
 */
export const serverDecryptMessage = (encryptedMessage: string, key: string): string => {
  try {
    // Check if message has the expected format
    if (!encryptedMessage.includes(':')) {
      return encryptedMessage; // Not encrypted
    }
    
    // Split checksum and encrypted data
    const parts = encryptedMessage.split(':');
    if (parts.length !== 2) {
      throw new Error('Invalid encrypted format');
    }
    
    const [checksum, encrypted] = parts;
    const keyHash = simpleHash(key);
    let decrypted = '';
    
    // Decrypt each character
    for (let i = 0; i < encrypted.length; i += 4) {
      const hex = encrypted.substring(i, i + 4);
      const encryptedChar = parseInt(hex, 16);
      const keyChar = keyHash.charCodeAt((i / 4) % keyHash.length);
      // Reverse the XOR operation
      const charCode = encryptedChar ^ keyChar ^ ((i / 4) * 13);
      decrypted += String.fromCharCode(charCode);
    }
    
    // Verify checksum
    const expectedChecksum = simpleHash(decrypted + key).substring(0, 8);
    if (checksum !== expectedChecksum) {
      console.warn('Checksum mismatch - message may be corrupted');
    }
    
    return decrypted;
  } catch (error) {
    console.error('Server decryption error:', error);
    return '[Decryption failed]';
  }
};

/**
 * Decrypts an array of messages on the server
 */
export const serverDecryptMessageArray = (messages: string[], key: string): string[] => {
  return messages.map(msg => serverDecryptMessage(msg, key));
};
