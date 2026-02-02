# Expense Splitter - Refactoring Notes (Line by Line)

---

## 📚 TABLE OF CONTENTS

1. [Summary.js - Main Refactoring](#summaryjs---main-refactoring)
2. [Code Patterns Explained](#code-patterns-explained)
3. [Before vs After Comparison](#before-vs-after-comparison)
4. [Common Patterns Recognition](#common-patterns-recognition)

---

## SUMMARY.JS - MAIN REFACTORING

### REFACTORING #1: Track Who Paid What

**Location:** Line 19-27

---

### 🔴 BEFORE (Using forEach)

```javascript
const consumed = {}; // { userId: totalConsumed }
const paid = {}; // { userId: totalPaid }

// Track who paid what
expenses.forEach((expense) => {
  const payerId = expense.paidBy._id.toString();
  paid[payerId] = (paid[payerId] || 0) + expense.totalAmount;
  if (!consumed[payerId]) consumed[payerId] = 0;
});
```

---

### ✅ AFTER (Using reduce)

```javascript
const consumed = {}; // { userId: totalConsumed }

// Track who paid what
const paid = expenses.reduce((acc, expense) => {
  const payerId = expense.paidBy._id.toString();
  acc[payerId] = (acc[payerId] || 0) + expense.totalAmount;
  if (!consumed[payerId]) consumed[payerId] = 0;
  return acc;
}, {});
```

---

## 📖 LINE BY LINE EXPLANATION (Macam Budak 5 Tahun)

### LINE 1: `const consumed = {};`

**Apa dia buat?**
- Buat empty object untuk simpan "siapa makan berapa"
- `{}` = empty object (kotak kosong)

**Kenapa perlu?**
- Nak track setiap orang consume berapa banyak

**Contoh:**
```javascript
// Lepas populate, akan jadi macam ni:
consumed = {
  "user123": 25.50,  // Ali consume RM25.50
  "user456": 30.00   // Siti consume RM30.00
}
```

---

### LINE 4: `const paid = expenses.reduce((acc, expense) => {`

**Apa dia buat?**
- `expenses` = array of all expenses
- `.reduce()` = method untuk "combine" semua expenses jadi satu object
- `acc` = accumulator (tempat kumpul result) - starts as `{}`
- `expense` = each individual expense dalam loop

**Kenapa guna reduce instead of forEach?**
- `forEach` = just loop, kena declare `paid = {}` dulu
- `reduce` = loop + return result sekali gus, lagi clean

**Pattern:**
```javascript
array.reduce((accumulator, currentItem) => {
  // do something with accumulator
  return accumulator;
}, startingValue);
```

---

### LINE 5: `const payerId = expense.paidBy._id.toString();`

**Apa dia buat?**
- `expense.paidBy` = user object yang bayar (from database)
- `._id` = get MongoDB ID
- `.toString()` = convert ObjectId jadi string

**Kenapa perlu toString()?**
- ObjectId cannot be used as object key directly
- Kena convert jadi string dulu

**Contoh:**
```javascript
// Before: ObjectId("507f1f77bcf86cd799439011")
// After: "507f1f77bcf86cd799439011"
```

---

### LINE 6: `acc[payerId] = (acc[payerId] || 0) + expense.totalAmount;`

**Apa dia buat?**
- Check: ada ke payerId dalam acc?
  - Kalau **ADA**: ambil existing value
  - Kalau **TAKDE**: guna 0
- Lepas tu **tambah** dengan expense.totalAmount
- Save balik dalam acc

**Breakdown:**
```javascript
// Step by step:
acc[payerId]           // Try access value (undefined kalau takde)
acc[payerId] || 0      // Kalau undefined, guna 0 instead
(acc[payerId] || 0) + expense.totalAmount  // Add expense amount
acc[payerId] = ...     // Save result
```

**Contoh:**
```javascript
// First expense: Ali paid RM50
acc = {}
acc["ali123"] = (undefined || 0) + 50  // = 50

// Second expense: Ali paid RM30 again
acc = { "ali123": 50 }
acc["ali123"] = (50 || 0) + 30  // = 80

// Final result:
acc = { "ali123": 80 }
```

---

### LINE 7: `if (!consumed[payerId]) consumed[payerId] = 0;`

**Apa dia buat?**
- Check: ada ke payerId dalam consumed object?
- Kalau **TAKDE**: set jadi 0

**Kenapa perlu?**
- Supaya nanti bila calculate balance, semua users ada entry
- Avoid `undefined` errors

**Logic:**
```javascript
!consumed[payerId]  // Check: consumed object takde payerId?
// Kalau TRUE (takde), set jadi 0
```

---

### LINE 8: `return acc;`

**Apa dia buat?**
- Return accumulator untuk next iteration
- **WAJIB** dalam reduce! Kalau tak return, acc jadi undefined

**Flow:**
```javascript
// Iteration 1
acc = {}  // starting value
return acc = { "ali123": 50 }

// Iteration 2
acc = { "ali123": 50 }  // from previous return
return acc = { "ali123": 80 }

// Final
paid = { "ali123": 80 }
```

---

### LINE 9: `}, {});`

**Apa dia buat?**
- `{}` = starting value untuk accumulator
- Empty object sebab kita nak build object result

**Comparison:**
```javascript
// Starting with object
.reduce((acc, item) => {...}, {})  // acc starts as {}

// Starting with number
.reduce((sum, num) => sum + num, 0)  // sum starts as 0

// Starting with array
.reduce((arr, item) => {...}, [])  // arr starts as []
```

---

## REFACTORING #2: Populate Settlement with User Info

**Location:** Line 96-104

---

### 🔴 BEFORE

```javascript
const populatedSettlement = await Promise.all(
  settlement.map(async (s) => {
    const from = await User.findById(s.from, "username");
    const to = await User.findById(s.to, "username");
    return {
      from: from.username,
      to: to.username,
      amount: s.amount,
    };
  }),
);
```

---

### ✅ AFTER (Using Destructuring)

```javascript
const populatedSettlement = await Promise.all(
  settlement.map(async ({ from, to, amount }) => {
    const fromUser = await User.findById(from, "username");
    const toUser = await User.findById(to, "username");
    return {
      from: fromUser.username,
      to: toUser.username,
      amount,
    };
  }),
);
```

---

## 📖 LINE BY LINE EXPLANATION

### LINE 1: `const populatedSettlement = await Promise.all(`

**Apa dia buat?**
- `Promise.all()` = tunggu SEMUA promises siap sekali gus
- `await` = tunggu sampai semua siap
- Save result dalam `populatedSettlement`

**Kenapa guna Promise.all?**
- Sebab ada banyak database calls (User.findById)
- Promise.all run semua **parallel** (serentak), lagi cepat
- Kalau guna normal loop, run **one by one**, lambat

**Comparison:**
```javascript
// Promise.all (FAST - parallel)
// Call 1, 2, 3 run serentak
// Total time: 1 second

// Normal await loop (SLOW - sequential)
// Call 1 → wait → Call 2 → wait → Call 3
// Total time: 3 seconds
```

---

### LINE 2: `settlement.map(async ({ from, to, amount }) => {`

**Apa dia buat?**
- `settlement.map()` = loop through settlement array
- `async` = function ni ada database calls (async operations)
- `{ from, to, amount }` = **destructuring** - extract values terus

**Destructuring Explanation:**
```javascript
// BEFORE (without destructuring)
settlement.map(async (s) => {
  const from = s.from;      // manual extract
  const to = s.to;          // manual extract
  const amount = s.amount;  // manual extract
});

// AFTER (with destructuring)
settlement.map(async ({ from, to, amount }) => {
  // from, to, amount dah ready to use!
});
```

**Pattern Recognition:**
```javascript
// Object destructuring
const { name, age } = person;
// Same as:
const name = person.name;
const age = person.age;

// In function parameter
function greet({ name, age }) {
  console.log(name, age);
}
// Instead of:
function greet(person) {
  console.log(person.name, person.age);
}
```

---

### LINE 3-4: Database Calls

```javascript
const fromUser = await User.findById(from, "username");
const toUser = await User.findById(to, "username");
```

**Apa dia buat?**
- `User.findById(from, "username")` = cari user by ID, ambil username je
- `await` = tunggu database reply dulu
- Save dalam `fromUser` & `toUser`

**Kenapa rename jadi fromUser/toUser?**
- `from` dah guna untuk ID (from destructuring)
- Kalau declare `const from = ...`, conflict!
- `fromUser` lagi clear - "user object for from"

**Before vs After Variable Names:**
```javascript
// BEFORE (confusing)
const from = await User.findById(s.from);
// 'from' = ID (from s.from)
// 'from' = user object (from findById)
// CONFLICT! Same name, different values

// AFTER (clear)
const fromUser = await User.findById(from);
// 'from' = ID (from destructuring)
// 'fromUser' = user object (from findById)
// NO CONFLICT!
```

---

### LINE 5-9: Return Object

```javascript
return {
  from: fromUser.username,
  to: toUser.username,
  amount,
};
```

**Apa dia buat?**
- Build new object dengan username instead of IDs
- `amount` = shorthand property (same as `amount: amount`)

**Shorthand Property Explanation:**
```javascript
// BEFORE (long version)
return {
  from: fromUser.username,
  to: toUser.username,
  amount: amount,  // key sama dengan value name
};

// AFTER (shorthand)
return {
  from: fromUser.username,
  to: toUser.username,
  amount,  // JavaScript auto: amount: amount
};
```

**Pattern:**
```javascript
const name = "Ali";
const age = 25;

// Long version
const person = { name: name, age: age };

// Shorthand
const person = { name, age };
// Both same result: { name: "Ali", age: 25 }
```

---

## 🎯 CODE PATTERNS EXPLAINED

### PATTERN 1: Array.reduce() untuk Build Object

**When to use:**
- Loop through array
- Want to build ONE object from many items
- Track cumulative values

**Template:**
```javascript
const result = array.reduce((accumulator, currentItem) => {
  // Do something with accumulator
  accumulator[key] = value;
  return accumulator;  // MUST return!
}, {});  // Starting value
```

**Real Examples:**

**Example 1: Count Occurrences**
```javascript
const fruits = ['apple', 'banana', 'apple', 'orange', 'banana', 'apple'];

const count = fruits.reduce((acc, fruit) => {
  acc[fruit] = (acc[fruit] || 0) + 1;
  return acc;
}, {});

// Result: { apple: 3, banana: 2, orange: 1 }
```

**Example 2: Group by Category**
```javascript
const products = [
  { name: 'Laptop', category: 'electronics' },
  { name: 'Phone', category: 'electronics' },
  { name: 'Shirt', category: 'clothing' }
];

const grouped = products.reduce((acc, product) => {
  if (!acc[product.category]) {
    acc[product.category] = [];
  }
  acc[product.category].push(product.name);
  return acc;
}, {});

// Result:
// {
//   electronics: ['Laptop', 'Phone'],
//   clothing: ['Shirt']
// }
```

---

### PATTERN 2: Promise.all() + map() untuk Parallel Async Calls

**When to use:**
- Many database calls
- All independent (tak depend on each other)
- Want fast execution

**Template:**
```javascript
const results = await Promise.all(
  array.map(async (item) => {
    const data = await someAsyncCall(item);
    return processedData;
  })
);
```

**Real Example:**

**Scenario: Fetch multiple users**
```javascript
const userIds = ['user1', 'user2', 'user3'];

// ❌ SLOW (sequential - one by one)
const users = [];
for (let id of userIds) {
  const user = await User.findById(id);  // Wait for each
  users.push(user);
}
// Time: 3 seconds (1 sec × 3 calls)

// ✅ FAST (parallel - serentak)
const users = await Promise.all(
  userIds.map(async (id) => {
    return await User.findById(id);
  })
);
// Time: 1 second (all run together)
```

---

### PATTERN 3: Destructuring dalam Function Parameters

**When to use:**
- Function receives object
- Only need certain properties
- Want cleaner code

**Template:**
```javascript
// Instead of this:
function process(data) {
  const name = data.name;
  const age = data.age;
  // use name, age
}

// Do this:
function process({ name, age }) {
  // name, age ready to use!
}
```

**Real Examples:**

**Example 1: API Route Handler**
```javascript
// ❌ BEFORE
router.post('/create', async (req, res) => {
  const groupName = req.body.groupName;
  const members = req.body.members;
  const createdBy = req.body.createdBy;
  // ...
});

// ✅ AFTER
router.post('/create', async (req, res) => {
  const { groupName, members, createdBy } = req.body;
  // ...
});
```

**Example 2: Array Map**
```javascript
const users = [
  { id: 1, name: 'Ali', age: 25 },
  { id: 2, name: 'Siti', age: 30 }
];

// ❌ BEFORE
const names = users.map((user) => {
  return user.name;
});

// ✅ AFTER
const names = users.map(({ name }) => name);
```

---

### PATTERN 4: Shorthand Properties

**When to use:**
- Building object
- Variable name sama dengan object key name

**Template:**
```javascript
const name = "Ali";
const age = 25;

// Long version
const person = {
  name: name,
  age: age
};

// Shorthand
const person = { name, age };
```

**Real Example in Project:**
```javascript
// In summary.js return statement
const fromUser = await User.findById(from);
const toUser = await User.findById(to);
const amount = 50;

// ❌ BEFORE (long)
return {
  from: fromUser.username,
  to: toUser.username,
  amount: amount  // repetitive
};

// ✅ AFTER (shorthand)
return {
  from: fromUser.username,
  to: toUser.username,
  amount  // cleaner
};
```

---

## 🔍 BEFORE VS AFTER COMPARISON

### Full Refactored Section (summary.js Line 19-27)

**BEFORE:**
```javascript
const consumed = {}; // { userId: totalConsumed }
const paid = {}; // { userId: totalPaid }

// Track who paid what
expenses.forEach((expense) => {
  const payerId = expense.paidBy._id.toString();
  paid[payerId] = (paid[payerId] || 0) + expense.totalAmount;
  if (!consumed[payerId]) consumed[payerId] = 0;
});
```

**AFTER:**
```javascript
const consumed = {}; // { userId: totalConsumed }

// Track who paid what
const paid = expenses.reduce((acc, expense) => {
  const payerId = expense.paidBy._id.toString();
  acc[payerId] = (acc[payerId] || 0) + expense.totalAmount;
  if (!consumed[payerId]) consumed[payerId] = 0;
  return acc;
}, {});
```

**What Changed:**
1. ✅ Removed `const paid = {};` declaration
2. ✅ Changed `forEach` to `reduce`
3. ✅ Used accumulator pattern
4. ✅ Added `return acc;`
5. ✅ Added starting value `{}`

**Why Better:**
- More functional programming style
- Declare + populate in one statement
- Clearer intent: "reduce expenses into paid object"

---

## 🧠 PATTERN RECOGNITION GUIDE

### How to Recognize When to Use reduce()

**Trigger Words/Scenarios:**
- "sum all values"
- "build an object from array"
- "count occurrences"
- "group by category"
- "accumulate/combine data"

**If you see this pattern → use reduce:**
```javascript
// Pattern: Empty object + forEach loop
const result = {};
array.forEach(item => {
  result[key] = value;
});

// Convert to reduce:
const result = array.reduce((acc, item) => {
  acc[key] = value;
  return acc;
}, {});
```

---

### How to Recognize When to Use Promise.all()

**Trigger Words/Scenarios:**
- "fetch multiple items"
- "many database calls"
- "parallel operations"
- "independent async tasks"

**If you see this pattern → use Promise.all:**
```javascript
// Pattern: Loop with await
const results = [];
for (let item of items) {
  const data = await asyncCall(item);
  results.push(data);
}

// Convert to Promise.all:
const results = await Promise.all(
  items.map(async item => await asyncCall(item))
);
```

---

### How to Recognize When to Use Destructuring

**Trigger Words/Scenarios:**
- Accessing multiple object properties
- Function receives object parameter
- Extracting values from nested objects

**If you see this pattern → use destructuring:**
```javascript
// Pattern: Multiple property access
function process(user) {
  const name = user.name;
  const age = user.age;
  const email = user.email;
}

// Convert to destructuring:
function process({ name, age, email }) {
  // use directly
}
```

---

## ✅ CHECKLIST: Writing Clean Code

When writing new code, check:

- [ ] **Using forEach to build object?** → Consider `reduce()`
- [ ] **Multiple awaits in loop?** → Consider `Promise.all()`
- [ ] **Extracting many object properties?** → Use destructuring
- [ ] **Variable name same as key?** → Use shorthand properties
- [ ] **Nested callbacks?** → Use `async/await`
- [ ] **No error handling?** → Add `try/catch`

---

## 📊 SUMMARY

### What We Refactored:
1. ✅ summary.js - Convert forEach to reduce
2. ✅ summary.js - Add destructuring in Promise.all

### What Was Already Good:
- ✅ expenses.js - Clean array methods usage
- ✅ groups.js - Proper async/await
- ✅ settlements.js - Good error handling
- ✅ auth.js - Security best practices

### Key Learnings:
1. **reduce()** = Build single value/object from array
2. **Promise.all()** = Run async operations parallel
3. **Destructuring** = Extract object properties cleanly
4. **Shorthand properties** = Cleaner object creation
5. **Pattern recognition** = Know when to use which method

---

## 🎓 NEXT STEPS

1. Practice these patterns in new features
2. Recognize opportunities to refactor
3. Write clean code from the start
4. Review code regularly for improvements

---

**END OF NOTES**
