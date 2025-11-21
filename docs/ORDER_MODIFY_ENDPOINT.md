# Order Modify Endpoint Documentation

## Overview

The Order Modify endpoint (`PATCH /api/orders/:id/modify`) allows users to modify existing limit orders without canceling and recreating them. This preserves queue position and provides flexibility in managing active orders.

## Endpoint Details

### Request

```http
PATCH /api/orders/:id/modify
Content-Type: application/json
Authorization: Bearer <token>

{
  "action": "modify_price" | "modify_quantity" | "convert_to_market",
  "newPrice": number (optional, for modify_price),
  "newQuantity": number (optional, for modify_quantity)
}
```

### Response

```json
{
  "success": true,
  "order": {
    "id": "order_123",
    "userId": "user_456",
    "type": "limit",
    "side": "buy",
    "price": 50000.00,
    "quantity": 0.5,
    "filled": 0.2,
    "remaining": 0.3,
    "status": "open",
    "timeInForce": "GTC",
    "createdAt": "2025-11-21T15:30:00Z",
    "updatedAt": "2025-11-21T15:45:00Z",
    "modifications": [
      {
        "timestamp": "2025-11-21T15:45:00Z",
        "action": "modify_price",
        "oldValue": 49000,
        "newValue": 50000
      }
    ]
  }
}
```

## Use Cases

### 1. Modify Price

Adjust the limit price of an order without losing queue position.

**Request:**
```json
{
  "action": "modify_price",
  "newPrice": 50000.00
}
```

**Use Case:**
- Market conditions change and you want to adjust your limit price
- More competitive pricing needed to match market
- Rebalancing strategy requires price adjustment

**Validation:**
- New price must be positive
- Order must be a limit order
- Order must be in `open` or `partially_filled` status

---

### 2. Modify Quantity

Increase or decrease the order size. Respects already filled quantity.

**Request:**
```json
{
  "action": "modify_quantity",
  "newQuantity": 1.0
}
```

**Use Case:**
- Dollar cost averaging: gradually increase position size
- Risk management: reduce exposure by decreasing quantity
- Portfolio rebalancing requires size adjustment

**Validation:**
- New quantity must be greater than already filled quantity
- Must have sufficient balance if increasing quantity
- New quantity must be positive

**Balance Recalculation:**

#### Increasing Quantity (Buy Order)
```javascript
oldLockedAmount = oldQuantity * price
newLockedAmount = newQuantity * price
additionalLock = newLockedAmount - oldLockedAmount

// Check if user has sufficient available balance
if (availableBalance < additionalLock) {
  throw "Insufficient balance"
}

// Lock additional funds
availableBalance -= additionalLock
lockedBalance += additionalLock
```

#### Decreasing Quantity (Buy Order)
```javascript
oldLockedAmount = oldQuantity * price
newLockedAmount = newQuantity * price
amountToUnlock = oldLockedAmount - newLockedAmount

// Unlock excess funds
lockedBalance -= amountToUnlock
availableBalance += amountToUnlock
```

---

### 3. Convert to Market

Execute the remaining quantity immediately at market price via hybrid engine.

**Request:**
```json
{
  "action": "convert_to_market"
}
```

**Use Case:**
- Need immediate execution for remaining quantity
- Market conditions favorable for instant fill
- Time-sensitive trade execution required

**Execution Flow:**
1. Calculate remaining quantity: `remaining = quantity - filled`
2. Route remaining quantity through hybrid matching engine
3. Try internal orderbook first
4. Use 1inch API for unfilled portion
5. Update order status to `completed` or `partially_filled`
6. Unlock excess funds if applicable

**Balance Impact:**
```javascript
// For buy order
lockedAmount = remaining * limitPrice
actualCost = remaining * marketPrice

// Unlock difference if market price is lower
if (actualCost < lockedAmount) {
  unlockAmount = lockedAmount - actualCost
  lockedBalance -= unlockAmount
  availableBalance += unlockAmount
}
```

---

## Smart Balance Management

The endpoint automatically handles balance locking/unlocking based on modification type:

### Increase Quantity
1. Calculate additional funds needed
2. Validate sufficient available balance
3. Lock additional funds atomically
4. Update order quantity

### Decrease Quantity
1. Calculate excess locked funds
2. Unlock excess funds
3. Update available balance
4. Update order quantity

### Modify Price
1. Calculate new required lock amount
2. Compare with current locked amount
3. Lock additional or unlock excess funds
4. Update order price

### Convert to Market
1. Execute remaining quantity via hybrid engine
2. Calculate actual execution cost
3. Unlock any excess locked funds
4. Update order status

---

## Error Handling

### Common Errors

| Error Code | Message | Cause |
|------------|---------|-------|
| 404 | Order not found | Invalid order ID |
| 403 | Unauthorized | User doesn't own the order |
| 400 | Invalid action | Unknown modification action |
| 400 | Invalid quantity | Quantity less than filled amount |
| 400 | Insufficient balance | Not enough funds for quantity increase |
| 400 | Cannot modify | Order status doesn't allow modification |
| 409 | Order completed | Order already fully filled |

### Example Error Response

```json
{
  "success": false,
  "error": "Insufficient balance for quantity increase",
  "details": {
    "required": 1000.00,
    "available": 500.00,
    "shortfall": 500.00
  }
}
```

---

## Atomic Transactions

All modifications use Firestore transactions to ensure data consistency:

```typescript
await db.runTransaction(async (transaction) => {
  // 1. Read current order state
  const orderDoc = await transaction.get(orderRef)
  const order = orderDoc.data()
  
  // 2. Validate modification
  validateModification(order, modifyRequest)
  
  // 3. Calculate balance changes
  const balanceChanges = calculateBalanceChanges(order, modifyRequest)
  
  // 4. Update order
  transaction.update(orderRef, {
    ...modifyRequest,
    updatedAt: now(),
    modifications: [...order.modifications, modification]
  })
  
  // 5. Update user balance
  transaction.update(userBalanceRef, balanceChanges)
  
  // 6. Log modification
  transaction.create(logRef, modificationLog)
})
```

---

## Integration with 1inch

When converting to market, the endpoint uses the hybrid execution engine which integrates with 1inch API:

```typescript
// 1. Try internal matching first
const internalFill = await matchAgainstOrderbook(order)

// 2. Route remaining to 1inch
if (internalFill.remaining > 0) {
  const oneinchQuote = await fetch('https://api.1inch.dev/swap/v6.0/1/quote', {
    headers: {
      'Authorization': `Bearer ${ONEINCH_API_KEY}`
    },
    params: {
      src: order.fromToken,
      dst: order.toToken,
      amount: internalFill.remaining
    }
  })
  
  const oneinchSwap = await executeSwap(oneinchQuote)
}

// 3. Combine results
return {
  filled: internalFill.filled + oneinchSwap.filled,
  avgPrice: calculateWeightedAvgPrice([internalFill, oneinchSwap])
}
```

---

## Testing Guide

### 1. Test Modify Price

```bash
# Place limit buy order
curl -X POST http://localhost:3000/api/trade/limit \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "pair": "BTC/USDT",
    "side": "buy",
    "price": 49000,
    "quantity": 1.0,
    "timeInForce": "GTC"
  }'

# Modify price to 50000
curl -X PATCH http://localhost:3000/api/orders/ORDER_ID/modify \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "modify_price",
    "newPrice": 50000
  }'
```

### 2. Test Modify Quantity

```bash
# Increase quantity from 1.0 to 2.0
curl -X PATCH http://localhost:3000/api/orders/ORDER_ID/modify \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "modify_quantity",
    "newQuantity": 2.0
  }'
```

### 3. Test Convert to Market

```bash
# Convert remaining quantity to market order
curl -X PATCH http://localhost:3000/api/orders/ORDER_ID/modify \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "convert_to_market"
  }'
```

---

## UI Integration Patterns

### Modify Order Dialog

```tsx
import { useState } from 'react'
import { Dialog, Button, Input, Select } from '@/components/ui'

function ModifyOrderDialog({ order, onClose }) {
  const [action, setAction] = useState('modify_price')
  const [newPrice, setNewPrice] = useState(order.price)
  const [newQuantity, setNewQuantity] = useState(order.quantity)
  
  const handleModify = async () => {
    const payload = action === 'modify_price' 
      ? { action, newPrice }
      : action === 'modify_quantity'
      ? { action, newQuantity }
      : { action: 'convert_to_market' }
    
    const response = await fetch(`/api/orders/${order.id}/modify`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })
    
    if (response.ok) {
      onClose()
      refreshOrders()
    }
  }
  
  return (
    <Dialog>
      <h2>Modify Order #{order.id}</h2>
      
      <Select value={action} onChange={setAction}>
        <option value="modify_price">Modify Price</option>
        <option value="modify_quantity">Modify Quantity</option>
        <option value="convert_to_market">Convert to Market</option>
      </Select>
      
      {action === 'modify_price' && (
        <Input
          type="number"
          value={newPrice}
          onChange={setNewPrice}
          label="New Price"
        />
      )}
      
      {action === 'modify_quantity' && (
        <Input
          type="number"
          value={newQuantity}
          onChange={setNewQuantity}
          label="New Quantity"
          min={order.filled}
        />
      )}
      
      <Button onClick={handleModify}>Modify Order</Button>
    </Dialog>
  )
}
```

---

## Security Considerations

1. **Ownership Validation**: Always verify the user owns the order before modification
2. **Balance Checks**: Atomic validation of sufficient balance for increases
3. **Status Validation**: Only allow modifications on `open` or `partially_filled` orders
4. **Rate Limiting**: Implement rate limits to prevent abuse
5. **Audit Logging**: Log all modifications with timestamp and user ID
6. **Transaction Safety**: Use Firestore transactions for all balance updates

---

## Performance Optimization

1. **Batch Updates**: Queue multiple modifications and process in batch
2. **Caching**: Cache user balances with TTL for read optimization
3. **Indexing**: Create Firestore indexes on `userId`, `status`, `updatedAt`
4. **Connection Pooling**: Reuse 1inch API connections
5. **Async Processing**: Process convert-to-market requests asynchronously

---

## Future Enhancements

1. **Bulk Modify**: Modify multiple orders in single request
2. **Scheduled Modifications**: Schedule price/quantity changes for future time
3. **Conditional Modifications**: Trigger modifications based on market conditions
4. **Partial Convert**: Convert only portion of remaining quantity to market
5. **Modification History**: Detailed audit trail with revert capability

---

## Related Endpoints

- `POST /api/trade/limit` - Place limit order
- `GET /api/orders` - List orders
- `GET /api/orders/:id` - Order details
- `DELETE /api/orders/:id/cancel` - Cancel order
- `POST /api/trade/market` - Place market order

---

## Support

For issues or questions:
- GitHub Issues: [fort-knox-exchange/issues](https://github.com/anurag698/fort-knox-exchange/issues)
- Documentation: [docs/](https://github.com/anurag698/fort-knox-exchange/tree/main/docs)
- API Reference: `docs/backend.json`