/**
 * In-memory cache for encryption keys to avoid regenerating them
 * This significantly speeds up message encryption
 */

interface CacheEntry {
  key: string;
  timestamp: number;
}

// Simple in-memory cache with TTL
class EncryptionKeyCache {
  private cache: Map<string, CacheEntry> = new Map();
  private readonly ttl = 5 * 60 * 1000; // 5 minutes TTL
  
  set(cacheKey: string, encryptionKey: string): void {
    this.cache.set(cacheKey, {
      key: encryptionKey,
      timestamp: Date.now()
    });
  }
  
  get(cacheKey: string): string | null {
    const entry = this.cache.get(cacheKey);
    if (!entry) return null;
    
    // Check if entry is expired
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(cacheKey);
      return null;
    }
    
    return entry.key;
  }
  
  // Generate cache key from conversation ID and member IDs
  static generateCacheKey(conversationId: string, memberIds: string[]): string {
    const sortedIds = [...memberIds].sort();
    return `${conversationId}:${sortedIds.join(',')}`;
  }
}

// Singleton instance
export const encryptionKeyCache = new EncryptionKeyCache();

/**
 * Get encryption key with caching
 */
export const getCachedEncryptionKey = (
  conversationId: string,
  memberIds: string[],
  generateKey: () => string
): string => {
  const cacheKey = EncryptionKeyCache.generateCacheKey(conversationId, memberIds);
  
  // Try to get from cache first
  const cached = encryptionKeyCache.get(cacheKey);
  if (cached) {
    return cached;
  }
  
  // Generate new key and cache it
  const newKey = generateKey();
  encryptionKeyCache.set(cacheKey, newKey);
  
  return newKey;
};
