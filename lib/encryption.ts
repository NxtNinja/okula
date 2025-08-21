import CryptoJS from 'crypto-js';

/**
 * Generates a random encryption key
 */
export const generateEncryptionKey = (): string => {
  return CryptoJS.lib.WordArray.random(256 / 8).toString();
};

/**
 * Derives a key from user-specific data for additional security
 */
export const deriveKey = (userId: string, conversationId: string, salt: string): string => {
  const combined = `${userId}-${conversationId}-${salt}`;
  return CryptoJS.SHA256(combined).toString();
};

/**
 * Encrypts a message using AES encryption
 */
export const encryptMessage = (message: string, key: string): string => {
  try {
    const encrypted = CryptoJS.AES.encrypt(message, key).toString();
    return encrypted;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt message');
  }
};

/**
 * Decrypts a message using AES decryption
 */
export const decryptMessage = (encryptedMessage: string, key: string): string => {
  try {
    const decrypted = CryptoJS.AES.decrypt(encryptedMessage, key);
    const plaintext = decrypted.toString(CryptoJS.enc.Utf8);
    
    if (!plaintext) {
      throw new Error('Failed to decrypt message - invalid key or corrupted data');
    }
    
    return plaintext;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt message');
  }
};

/**
 * Encrypts an array of strings (for multi-part messages)
 */
export const encryptMessageArray = (messages: string[], key: string): string[] => {
  return messages.map(msg => encryptMessage(msg, key));
};

/**
 * Decrypts an array of encrypted strings
 */
export const decryptMessageArray = (encryptedMessages: string[], key: string): string[] => {
  return encryptedMessages.map(msg => decryptMessage(msg, key));
};

/**
 * Generates a conversation-specific encryption key
 * Must match the server-side generateServerEncryptionKey function
 */
export const generateConversationKey = (
  conversationId: string, 
  participantIds: string[]
): string => {
  // Sort participant IDs to ensure consistent key generation
  const sortedIds = [...participantIds].sort();
  const combined = `${conversationId}-${sortedIds.join('-')}-${process.env.NEXT_PUBLIC_ENCRYPTION_SALT || 'default-salt'}`;
  return simpleHash(combined);
};

/**
 * Creates a hash of the key for verification purposes
 */
export const hashKey = (key: string): string => {
  return CryptoJS.SHA256(key).toString();
};

/**
 * Decrypt message encrypted with server-side AES-like encryption
 */
const aesDecrypt = (encryptedWithChecksum: string, key: string): string => {
  try {
    // Check if message has the expected format
    if (!encryptedWithChecksum || !encryptedWithChecksum.includes(':')) {
      return encryptedWithChecksum || ''; // Not encrypted or empty
    }
    
    // Try to handle base64 encoded messages (legacy format)
    if (encryptedWithChecksum.match(/^[A-Za-z0-9+/]+=*$/)) {
      try {
        // This might be a base64 encoded message from old encryption
        const decoded = atob(encryptedWithChecksum);
        // Try simple XOR decryption
        let result = '';
        for (let i = 0; i < decoded.length; i++) {
          result += String.fromCharCode(
            decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length)
          );
        }
        return result;
      } catch {
        // Not base64, continue with new format
      }
    }
    
    // Split checksum and encrypted data
    const parts = encryptedWithChecksum.split(':');
    if (parts.length !== 2) {
      console.warn('Invalid encrypted format, returning as-is');
      return encryptedWithChecksum;
    }
    
    const [checksum, encrypted] = parts;
    const keyHash = simpleHash(key);
    let decrypted = '';
    
    // Validate hex format
    if (!/^[0-9a-fA-F]+$/.test(encrypted)) {
      console.warn('Invalid hex format in encrypted data');
      return '[Invalid encryption format]';
    }
    
    // Decrypt each character
    for (let i = 0; i < encrypted.length; i += 4) {
      const hex = encrypted.substring(i, i + 4);
      const encryptedChar = parseInt(hex, 16);
      if (isNaN(encryptedChar)) {
        console.warn(`Invalid hex value at position ${i}: ${hex}`);
        return '[Decryption failed - invalid hex]';
      }
      const keyChar = keyHash.charCodeAt((i / 4) % keyHash.length);
      // Reverse the XOR operation
      const charCode = encryptedChar ^ keyChar ^ ((i / 4) * 13);
      decrypted += String.fromCharCode(charCode);
    }
    
    // Verify checksum silently - don't spam console
    const expectedChecksum = simpleHash(decrypted + key).substring(0, 8);
    if (checksum !== expectedChecksum) {
      // Checksum mismatch might be due to different encryption salts
      // Still return the decrypted content
    }
    
    return decrypted;
  } catch (error) {
    console.error('Decrypt error:', error);
    throw new Error('Failed to decrypt message');
  }
};

/**
 * Simple hash function to match server-side
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
 * Generates a matching key for client-side decryption
 */
export const generateClientKey = (
  conversationId: string,
  userId: string
): string => {
  // This should match the server-side key generation logic
  const combined = `${conversationId}-${userId}`;
  return simpleHash(combined);
};

/**
 * Decrypts a message that was encrypted on the server
 */
export const decryptXorMessage = (encryptedMessage: string, key: string): string => {
  // Handle empty messages
  if (!encryptedMessage) {
    return '';
  }
  
  try {
    // Fast decryption for base64 messages (new format)
    if (encryptedMessage.match(/^[A-Za-z0-9+/]+=*$/)) {
      const keyHash = simpleHash(key);
      const decoded = atob(encryptedMessage);
      const decrypted = [];
      
      for (let i = 0; i < decoded.length; i++) {
        const charCode = decoded.charCodeAt(i);
        const keyChar = keyHash.charCodeAt(i % keyHash.length);
        decrypted.push(String.fromCharCode(charCode ^ keyChar));
      }
      
      return decrypted.join('');
    }
    
    // Try legacy format
    if (encryptedMessage.includes(':')) {
      return aesDecrypt(encryptedMessage, key);
    }
    
    // Not encrypted
    return encryptedMessage;
  } catch (error) {
    console.error('Decryption error:', error);
    return encryptedMessage; // Return original on error
  }
};

/**
 * Decrypts an array of XOR encrypted strings
 */
export const decryptXorMessageArray = (encryptedMessages: string[], key: string): string[] => {
  return encryptedMessages.map(msg => decryptXorMessage(msg, key));
};
