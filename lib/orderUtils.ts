// Format order number with 6 digits starting from 000317
export function formatOrderNumber(orderId: string): string {
  const STARTING_NUMBER = 317;
  const MAX_NUMBER = 999999;
  const RANGE_SIZE = MAX_NUMBER - STARTING_NUMBER + 1; // 999683 possible numbers
  
  // Try to extract a number from the order ID
  const numericId = parseInt(orderId, 10);
  
  if (isNaN(numericId)) {
    // If ID is not numeric, use hash-based approach
    let hash = 0;
    for (let i = 0; i < orderId.length; i++) {
      hash = ((hash << 5) - hash) + orderId.charCodeAt(i);
      hash = hash & hash;
    }
    // Use modulo to keep within range, then add starting number
    const orderNumber = (Math.abs(hash) % RANGE_SIZE) + STARTING_NUMBER;
    return orderNumber.toString().padStart(6, '0');
  }
  
  // For timestamp-based IDs, use modulo to keep within valid range
  // This ensures numbers cycle within 317-999999 range
  const orderNumber = (numericId % RANGE_SIZE) + STARTING_NUMBER;
  
  return orderNumber.toString().padStart(6, '0');
}
