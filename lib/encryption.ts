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
    // Split checksum and encrypted data
    const parts = encryptedWithChecksum.split(':');
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
  // If message doesn't look encrypted, return as-is
  if (!encryptedMessage || !encryptedMessage.includes(':')) {
    console.warn('Message does not appear to be encrypted, returning as-is');
    return encryptedMessage;
  }
  
  try {
    return aesDecrypt(encryptedMessage, key);
  } catch (error) {
    console.error('Custom decryption error:', error);
    // Try standard AES decryption as fallback
    try {
      return decryptMessage(encryptedMessage, key);
    } catch (aesError) {
      // Return the original message if decryption fails
      console.error('All decryption methods failed, returning original');
      return encryptedMessage;
    }
  }
};

/**
 * Decrypts an array of XOR encrypted strings
 */
export const decryptXorMessageArray = (encryptedMessages: string[], key: string): string[] => {
  return encryptedMessages.map(msg => decryptXorMessage(msg, key));
};
