# Handling Convex Write Conflicts

## Issue
The error "Documents read from or written to the table changed while this mutation was being run" occurs when multiple mutations try to modify the same document concurrently.

## Solutions Applied

1. **Removed unnecessary updates**: Removed the `keyHash` update from `message:create` mutation since it's deterministic and doesn't need frequent updates.

2. **Separated concerns**: Keep mutations focused on single responsibilities to minimize conflicts.

## Best Practices to Avoid Conflicts

1. **Minimize document updates**: Only update documents when absolutely necessary.

2. **Use optimistic updates on client**: Update UI immediately without waiting for server confirmation.

3. **Batch operations**: If multiple updates are needed, try to do them in a single mutation.

4. **Consider using separate tables**: For frequently updated data, consider splitting into separate tables.

5. **Rate limiting**: If conflicts persist, implement client-side rate limiting for rapid operations.

## Additional Optimization Options

If conflicts continue:

1. **Debounce markRead calls**: Don't call markRead on every message view, but batch them.

2. **Use background jobs**: Move non-critical updates to scheduled functions.

3. **Implement retry logic**: Add exponential backoff on the client for failed mutations.
