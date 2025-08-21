/**
 * Server-side encryption utilities for Convex
 * These functions run in the Convex backend
 */

// Polyfills for Convex runtime
if (typeof Buffer === 'undefined') {
  (globalThis as any).Buffer = {
    from: (data: string, encoding?: string): { toString: (enc: string) => string } => {
      return {
        toString: (enc: string) => {
          if (enc === 'base64') {
            // Convert binary string to base64
            return btoa(data);
          }
          return data;
        }
      };
    },
  };
}

// Base64 polyfill if btoa/atob not available
if (typeof btoa === 'undefined') {
  (globalThis as any).btoa = (str: string): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    let result = '';
    let i = 0;
    
    while (i < str.length) {
      const a = str.charCodeAt(i++);
      const b = i < str.length ? str.charCodeAt(i++) : 0;
      const c = i < str.length ? str.charCodeAt(i++) : 0;
      
      const bitmap = (a << 16) | (b << 8) | c;
      
      result += chars.charAt((bitmap >> 18) & 63);
      result += chars.charAt((bitmap >> 12) & 63);
      result += i - 2 < str.length ? chars.charAt((bitmap >> 6) & 63) : '=';
      result += i - 1 < str.length ? chars.charAt(bitmap & 63) : '=';
    }
    
    return result;
  };
}

if (typeof atob === 'undefined') {
  (globalThis as any).atob = (str: string): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    let result = '';
    let i = 0;
    
    str = str.replace(/=+$/, '');
    
    while (i < str.length) {
      const encoded1 = chars.indexOf(str.charAt(i++));
      const encoded2 = chars.indexOf(str.charAt(i++));
      const encoded3 = chars.indexOf(str.charAt(i++));
      const encoded4 = chars.indexOf(str.charAt(i++));
      
      const bitmap = (encoded1 << 18) | (encoded2 << 12) | (encoded3 << 6) | encoded4;
      
      result += String.fromCharCode((bitmap >> 16) & 255);
      if (encoded3 !== 64) result += String.fromCharCode((bitmap >> 8) & 255);
      if (encoded4 !== 64) result += String.fromCharCode(bitmap & 255);
    }
    
    return result;
  };
}

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

// Cache for key hashes to avoid recomputation
const keyHashCache = new Map<string, string>();

/**
 * Ultra-fast encryption optimized for real-time messaging
 * Uses efficient XOR with base64 encoding
 */
const fastEncrypt = (text: string, key: string): string => {
  try {
    // Use cached key hash or compute new one
    let keyHash = keyHashCache.get(key);
    if (!keyHash) {
      keyHash = simpleHash(key);
      // Keep cache size reasonable
      if (keyHashCache.size > 100) {
        keyHashCache.clear();
      }
      keyHashCache.set(key, keyHash);
    }
    
    const textLength = text.length;
    const keyLength = keyHash.length;
    
    // Pre-allocate Uint8Array for better performance
    const encrypted = new Uint8Array(textLength);
    
    // Optimized XOR operation
    for (let i = 0; i < textLength; i++) {
      encrypted[i] = text.charCodeAt(i) ^ keyHash.charCodeAt(i % keyLength);
    }
    
    // Convert Uint8Array to string for base64 encoding
    let binaryString = '';
    const chunkSize = 8192; // Process in chunks for better performance
    
    for (let i = 0; i < encrypted.length; i += chunkSize) {
      const chunk = encrypted.slice(i, i + chunkSize);
      binaryString += String.fromCharCode.apply(null, Array.from(chunk));
    }
    
    // Fast base64 encoding
    return btoa(binaryString);
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Encryption failed');
  }
};

/**
 * Encrypts a message on the server
 */
export const serverEncryptMessage = (message: string, key: string): string => {
  try {
    return fastEncrypt(message, key);
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
 * Fast decryption for messages
 */
export const serverDecryptMessage = (encryptedMessage: string, key: string): string => {
  try {
    // Handle empty or null messages
    if (!encryptedMessage) {
      return '';
    }
    
    // Check if it's base64 encoded (our fast encryption format)
    if (encryptedMessage.match(/^[A-Za-z0-9+/]+=*$/)) {
      try {
        const keyHash = simpleHash(key);
        const decoded = atob(encryptedMessage);
        const decrypted = [];
        
        for (let i = 0; i < decoded.length; i++) {
          const charCode = decoded.charCodeAt(i);
          const keyChar = keyHash.charCodeAt(i % keyHash.length);
          decrypted.push(String.fromCharCode(charCode ^ keyChar));
        }
        
        return decrypted.join('');
      } catch (e) {
        console.error('Decryption error:', e);
        return encryptedMessage; // Return as-is if decryption fails
      }
    }
    
    // Handle legacy format with checksum
    if (encryptedMessage.includes(':')) {
      const parts = encryptedMessage.split(':');
      if (parts.length === 2) {
        const [, encrypted] = parts;
        const keyHash = simpleHash(key);
        const decrypted = [];
        
        // Decrypt hex format
        for (let i = 0; i < encrypted.length; i += 4) {
          const hex = encrypted.substring(i, i + 4);
          const encryptedChar = parseInt(hex, 16);
          if (!isNaN(encryptedChar)) {
            const keyChar = keyHash.charCodeAt((i / 4) % keyHash.length);
            const charCode = encryptedChar ^ keyChar ^ ((i / 4) * 13);
            decrypted.push(String.fromCharCode(charCode));
          }
        }
        
        return decrypted.join('');
      }
    }
    
    // Not encrypted, return as-is
    return encryptedMessage;
  } catch (error) {
    console.error('Server decryption error:', error);
    return encryptedMessage; // Return original on error
  }
};

/**
 * Decrypts an array of messages on the server
 */
export const serverDecryptMessageArray = (messages: string[], key: string): string[] => {
  return messages.map(msg => serverDecryptMessage(msg, key));
};
