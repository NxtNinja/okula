import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { deriveKey, generateEncryptionKey } from '@/lib/encryption';

interface EncryptionKey {
  conversationId: string;
  key: string;
}

/**
 * Hook for managing encryption keys securely on the client side
 * Keys are stored in memory and derived from user-specific data
 */
export const useEncryption = () => {
  const { userId } = useAuth();
  const [keys, setKeys] = useState<Map<string, string>>(new Map());

  /**
   * Gets or generates an encryption key for a conversation
   */
  const getOrCreateKey = (conversationId: string): string => {
    // Check if key already exists in memory
    const existingKey = keys.get(conversationId);
    if (existingKey) {
      return existingKey;
    }

    // Generate a new key if not exists
    if (!userId) {
      throw new Error('User not authenticated');
    }

    // For production, you might want to use a more sophisticated key derivation
    // This example uses a combination of userId and conversationId
    const salt = generateEncryptionKey();
    const newKey = deriveKey(userId, conversationId, salt);
    
    // Store in memory (not in localStorage for security)
    setKeys(prev => new Map(prev).set(conversationId, newKey));
    
    return newKey;
  };

  /**
   * Clears all keys from memory (useful on logout)
   */
  const clearKeys = () => {
    setKeys(new Map());
  };

  // Clear keys when user logs out
  useEffect(() => {
    if (!userId) {
      clearKeys();
    }
  }, [userId]);

  return {
    getOrCreateKey,
    clearKeys,
  };
};

/**
 * Alternative approach using sessionStorage for key persistence during session
 * This is less secure but provides better UX as keys persist during page refreshes
 */
export const useSessionEncryption = () => {
  const { userId } = useAuth();
  
  const getOrCreateKey = (conversationId: string): string => {
    if (!userId) {
      throw new Error('User not authenticated');
    }

    const storageKey = `enc_${conversationId}`;
    
    // Check sessionStorage first
    const existingKey = sessionStorage.getItem(storageKey);
    if (existingKey) {
      return existingKey;
    }

    // Generate new key using the same method as server
    // This creates a deterministic key based on conversation ID
    const newKey = conversationId; // Simple key for now, matching server
    
    // Store in sessionStorage (cleared when browser is closed)
    sessionStorage.setItem(storageKey, newKey);
    
    return newKey;
  };

  const clearKeys = () => {
    // Clear all encryption keys from sessionStorage
    const keysToRemove: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && key.startsWith('enc_')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => sessionStorage.removeItem(key));
  };

  // Clear keys when user logs out
  useEffect(() => {
    if (!userId) {
      clearKeys();
    }
  }, [userId]);

  return {
    getOrCreateKey,
    clearKeys,
  };
};
