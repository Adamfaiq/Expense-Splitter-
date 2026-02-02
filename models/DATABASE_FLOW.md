# DATABASE FLOW - EXPENSE SPLITTER

## RELATIONSHIP
```
User (Ahmad, Amir, Farid)
  ↓
Group ("Geng Makan")
  ↓
Expense (Ahmad bayar RM30)
  ↓
ExpenseItem (Nasi Goreng RM10, Mee Goreng RM10, Air Limau RM10)
```

## EXAMPLE DATA

### 1. Users
```javascript
{_id: "u1", username: "Ahmad"}
{_id: "u2", username: "Amir"}
{_id: "u3", username: "Farid"}
```

### 2. Group
```javascript
{
  _id: "g1",
  groupName: "Geng Makan",
  members: ["u1", "u2", "u3"],
  createdBy: "u1"
}
```

### 3. Expense
```javascript
{
  _id: "e1",
  groupId: "g1",
  paidBy: "u1",  // Ahmad bayar
  totalAmount: 30,
  description: "Dinner"
}
```

### 4. Expense Items
```javascript
// Item 1 - Personal
{
  _id: "i1",
  expenseId: "e1",
  itemName: "Nasi Goreng",
  price: 10,
  type: "personal",
  participants: ["u1"]  // Ahmad je
}

// Item 2 - Personal
{
  _id: "i2",
  expenseId: "e1",
  itemName: "Mee Goreng",
  price: 10,
  type: "personal",
  participants: ["u2"]  // Amir je
}

// Item 3 - Shared
{
  _id: "i3",
  expenseId: "e1",
  itemName: "Air Limau",
  price: 10,
  type: "shared",
  participants: ["u1", "u2", "u3"]  // Semua 3 orang
}
```

## CALCULATION LOGIC (Nanti kita code)

Ahmad bayar RM30.
- Nasi Goreng RM10 → Ahmad consume = RM10
- Mee Goreng RM10 → Amir consume = RM10
- Air Limau RM10 ÷ 3 = RM3.33 setiap orang

Ahmad spend: RM10 + RM3.33 = RM13.33
Amir spend: RM10 + RM3.33 = RM13.33
Farid spend: RM3.33

Ahmad paid: RM30
Ahmad consume: RM13.33
Ahmad deserve back: RM30 - RM13.33 = RM16.67

Amir owe Ahmad: RM13.33
Farid owe Ahmad: RM3.33

Total owe to Ahmad: RM13.33 + RM3.33 = RM16.67 ✅
