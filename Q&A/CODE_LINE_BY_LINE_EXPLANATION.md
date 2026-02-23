# Line-by-Line Code Explanation - All Core Files

---

## 📄 db.js - Database Initialization

### Line-by-Line Breakdown

```javascript
// LINE 1-2: Import sqlite3 library
// Purpose: Load SQLite3 module and get verbose mode for detailed errors
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
```
**What's happening:**
- `require('sqlite3')` loads the SQL database library
- `.verbose()` activates debug mode that logs all database operations

```javascript
// LINE 5-6: Define database file path
// Purpose: Create absolute path to ecommerce.db in project root
const DB_PATH = path.join(__dirname, 'ecommerce.db');
// __dirname = current directory (/workspaces/IERG4210)
// DB_PATH = /workspaces/IERG4210/ecommerce.db
```

```javascript
// LINE 8-12: Create and connect to database
// Purpose: Initialize SQLite connection
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);  // If connection fails, show error
  } else {
    console.log('Connected to SQLite database at:', DB_PATH); // If success, show message
  }
});
```
**Flow:**
1. `new sqlite3.Database(DB_PATH, callback)` creates database file (if doesn't exist)
2. Callback function runs when connection attempt finishes
3. If error: Log error message
4. If success: Log success message

---

### Table Creation Section

```javascript
// LINE 15: Start synchronized block
// Purpose: Run database operations in sequence (one after another)
db.serialize(() => {
```
**Why `serialize()`?**
- Without it: All db.run() commands fire at the same time (could cause conflicts)
- With it: Commands wait for previous one to finish

```javascript
// LINE 17-22: Create categories table
db.run(`CREATE TABLE IF NOT EXISTS categories (
  catid INTEGER PRIMARY KEY AUTOINCREMENT,     // Auto-incrementing ID (1, 2, 3...)
  name TEXT NOT NULL UNIQUE                    // Category name (required, no duplicates)
)`, (err) => {
  if (err) console.error('Error creating categories table:', err);
  else console.log('Categories table ready');
});
```
**Line Explanation:**
- `CREATE TABLE IF NOT EXISTS` - Create table only if it doesn't already exist
- `catid INTEGER PRIMARY KEY AUTOINCREMENT` - ID automatically increases (1→2→3...)
- `name TEXT NOT NULL UNIQUE` - Name field that can't be empty and can't repeat
- Callback shows error OR success message

```javascript
// LINE 24-33: Create products table
db.run(`CREATE TABLE IF NOT EXISTS products (
  pid INTEGER PRIMARY KEY AUTOINCREMENT,
  catid INTEGER NOT NULL,                                    // Must belong to a category
  name TEXT NOT NULL,                                        // Product name (required)
  price REAL NOT NULL,                                       // Float value like 29.99
  description TEXT,                                          // Product description (optional)
  image_url TEXT,                                           // Path to original image
  thumbnail_url TEXT,                                       // Path to small image
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,            // Auto-set to current time
  FOREIGN KEY(catid) REFERENCES categories(catid) ON DELETE CASCADE
  //                                     ↑ Links to categories table
  //                                                 ↑ Delete products if category deleted
)`, ...);
```

---

### Sample Data Insertion Section

```javascript
// LINE 35-38: Check if data already exists
db.get(`SELECT COUNT(*) as count FROM categories`, (err, row) => {
  if (err) {
    console.error('Error checking categories:', err);
    return;  // Stop if error
  }
  
  // row.count = number of categories in database
  if (!row || row.count === 0) {  // If NO categories exist yet:
```

```javascript
// LINE 41-44: Insert "Gaming" category
db.run(`INSERT INTO categories (name) VALUES ('Gaming')`, (err) => {
  if (err) console.error('Error inserting Gaming category:', err);
  else console.log('Gaming category inserted');
});
// This creates: catid=1, name='Gaming' (catid auto-increments)
```

```javascript
// LINE 56-59: Insert "Gaming Controller" product
db.run(`INSERT INTO products 
  (catid, name, price, description, image_url, thumbnail_url) 
  VALUES (1, 'Gaming Controller', 29.99, '...', '/images/controller.jpg', '/images/controller.jpg')`, ...);
// VALUES order MUST match column order in INSERT
// catid=1 means belongs to Gaming category
```

---

## 🖥️ server.js - Backend Server

### Lines 1-8: Imports and Setup

```javascript
// LINE 1-7: Import all required libraries
const express = require('express');              // Web server framework
const multer = require('multer');                // File upload handler
const sharp = require('sharp');                  // Image processing library
const path = require('path');                    // File path utilities
const fs = require('fs');                        // File system operations
const db = require('./db');                      // Import our database setup
const { body, validationResult, query } = require('express-validator'); // Input validation

const app = express();                           // Create Express application instance
const PORT = 3000;                               // Server listens on port 3000
```

### Lines 12-17: Middleware Setup

```javascript
// LINE 12-14: Middleware for parsing request body
app.use(express.json());                         // Parse JSON in request body → req.body object
app.use(express.urlencoded({ extended: true })); // Parse form data (like <form>) → req.body
app.use(express.static(path.join(__dirname, 'public'))); 
// Serve files from /public folder
// If request = GET /index.html, Express looks in public/index.html automatically
```

### Lines 19-28: Create Upload Directories

```javascript
// LINE 19-20: Create paths for storing uploaded files
const uploadsDir = path.join(__dirname, 'uploads');
const thumbsDir = path.join(uploadsDir, 'thumbnails');
// uploadsDir = /workspaces/IERG4210/uploads
// thumbsDir = /workspaces/IERG4210/uploads/thumbnails

// LINE 22-27: Create directories if they don't exist
if (!fs.existsSync(uploadsDir)) {
  // If /uploads doesn't exist:
  fs.mkdirSync(uploadsDir, { recursive: true });
  // Create it (and any parent directories needed)
}
if (!fs.existsSync(thumbsDir)) {
  // If /uploads/thumbnails doesn't exist:
  fs.mkdirSync(thumbsDir, { recursive: true });
  // Create it
}
```

### Lines 30-48: Multer File Upload Configuration

```javascript
// LINE 30-35: Configure where to save uploaded files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // When file uploaded, save it to uploadsDir
    cb(null, uploadsDir);
    // cb(error, path) - null means no error, save to uploadsDir
  },
  filename: (req, file, cb) => {
    // Rename file to prevent name collisions
    const ext = path.extname(file.originalname);  // Get extension like .jpg
    cb(null, Date.now() + ext);
    // Rename to: 1234567890123.jpg (current timestamp + extension)
  }
});
```

```javascript
// LINE 37-42: Validate file type
const fileFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  // Only allow these image formats
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);  // Accept file
  } else {
    cb(new Error('Invalid file type...'));  // Reject file
  }
};
```

```javascript
// LINE 44-48: Create multer instance with validation
const upload = multer({
  storage: storage,                      // Use diskStorage config above
  fileFilter: fileFilter,                // Use validation rules above
  limits: { fileSize: 10 * 1024 * 1024 } // Max file size: 10MB
});
```

---

### API Route: Get All Categories

```javascript
// LINE 60-67: GET /api/categories
// Purpose: Return all categories as JSON
app.get('/api/categories', (req, res) => {
  // When browser requests GET /api/categories:
  
  db.all('SELECT * FROM categories ORDER BY name ASC', (err, rows) => {
    // Query: Get all categories, sort by name (A→Z)
    
    if (err) {
      // If query fails:
      return res.status(500).json({ error: err.message });
      // Return HTTP 500 error with error message
    }
    
    res.json(rows);  // Return categories as JSON
    // Browser receives: [{ catid: 1, name: 'Gaming' }, { catid: 2, name: 'Food' }]
  });
});
```

---

### API Route: Get Single Category

```javascript
// LINE 69-80: GET /api/categories/:catid
// Purpose: Return one specific category by ID
app.get('/api/categories/:catid', (req, res) => {
  const { catid } = req.params;
  // Extract catid from URL
  // If URL = /api/categories/1 → catid = 1
  
  db.get('SELECT * FROM categories WHERE catid = ?', [catid], (err, row) => {
    // Query: Get category by ID
    // ? = placeholder, [catid] = replace ? with this value (prevents SQL injection)
    
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      // If no category found with this ID:
      return res.status(404).json({ error: 'Category not found' });
      // Return HTTP 404: Not Found
    }
    res.json(row);  // Return the category object
  });
});
```

---

### API Route: Create Category

```javascript
// LINE 82-99: POST /api/categories
// Purpose: Create new category
app.post('/api/categories',
  body('name').trim().isLength({ min: 1 }).escape(),
  // Middleware that validates 'name' field:
  // .trim() = remove leading/trailing spaces
  // .isLength({ min: 1 }) = must have at least 1 character
  // .escape() = convert special chars (<, >, ", &) to safe HTML entities
  
  (req, res) => {
    const errors = validationResult(req);
    // Check if validation failed
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
      // If validation failed, return HTTP 400 with error list
    }

    const { name } = req.body;
    // Extract name from request body (JSON or form data)
    
    db.run('INSERT INTO categories (name) VALUES (?)', [name], function(err) {
      // Insert new category
      // function(err) - NOT arrow function! Needs 'this' context
      
      if (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          // Special error handling: name already exists
          return res.status(400).json({ error: 'Category name already exists' });
        }
        return res.status(500).json({ error: err.message });
      }
      
      res.json({ catid: this.lastID, name });
      // this.lastID = auto-generated ID (catid)
      // Return new category object: { catid: 3, name: 'New Category' }
    });
  }
);
```

**Key Concept `this.lastID`:**
- After INSERT statement, database auto-increments primary key
- `this.lastID` captures that auto-generated ID
- Example: If database had 2 categories, new one gets catid=3

---

### API Route: Update Category

```javascript
// LINE 101-121: PUT /api/categories/:catid
// Purpose: Update existing category name
app.put('/api/categories/:catid',
  body('name').trim().isLength({ min: 1 }).escape(),
  (req, res) => {
    // Same validation as POST
    
    const { catid } = req.params;   // ID from URL path
    const { name } = req.body;      // New name from request body
    
    db.run('UPDATE categories SET name = ? WHERE catid = ?', [name, catid], function(err) {
      // Change category name where ID matches
      // ? placeholders prevent SQL injection
      
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        // No rows were updated (category ID doesn't exist)
        return res.status(404).json({ error: 'Category not found' });
      }
      res.json({ catid, name });  // Return updated category
    });
  }
);
```

**Key Concept `this.changes`:**
- Shows how many rows were affected by the UPDATE
- If 0: The category ID doesn't exist
- If 1: Successfully updated

---

### API Route: Delete Category

```javascript
// LINE 123-133: DELETE /api/categories/:catid
// Purpose: Remove a category
app.delete('/api/categories/:catid', (req, res) => {
  const { catid } = req.params;
  
  db.run('DELETE FROM categories WHERE catid = ?', [catid], function(err) {
    // Delete from categories table where ID matches
    // Note: Products in this category also deleted (due to ON DELETE CASCADE)
    
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      // No rows deleted (category doesn't exist)
      return res.status(404).json({ error: 'Category not found' });
    }
    res.json({ message: 'Category deleted successfully' });
  });
});
```

---

### API Route: Get All Products

```javascript
// LINE 135-151: GET /api/products?catid=1 (optional filter)
// Purpose: Return products (optionally filtered by category)
app.get('/api/products',
  query('catid').optional().isInt(),
  // Validate URL query parameter
  // .optional() = catid is not required
  // .isInt() = if provided, must be integer
  
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { catid } = req.query;  // Get catid from query string
    // If URL = /api/products?catid=1 → catid = '1'
    
    let query = 'SELECT * FROM products';
    const params = [];

    if (catid) {
      // If catid provided, filter by category:
      query += ' WHERE catid = ?';
      params.push(catid);
      // Result: 'SELECT * FROM products WHERE catid = ?' with [1]
    }

    query += ' ORDER BY created_at DESC';
    // Sort by creation time (newest first)

    db.all(query, params, (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(rows);  // Return array of products
    });
  }
);
```

---

### API Route: Get Single Product

```javascript
// LINE 153-163: GET /api/products/:pid
// Purpose: Return details of one product
app.get('/api/products/:pid', (req, res) => {
  const { pid } = req.params;  // Product ID from URL
  
  db.get('SELECT * FROM products WHERE pid = ?', [pid], (err, row) => {
    // db.get() returns ONE row (not array)
    // db.all() returns array of rows
    
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(row);  // Return single product object
  });
});
```

---

### API Route: Create Product (Complex)

```javascript
// LINE 165-244: POST /api/products
// Purpose: Create new product with image upload
app.post('/api/products',
  upload.single('image'),  // Middleware: Handle single file upload
  // Single file = max 1 file, saved to uploadsDir
  
  body('catid').isInt(),                        // Category ID must be integer
  body('name').trim().isLength({ min: 1 }).escape(),
  body('price').isFloat({ min: 0 }),           // Price must be positive float
  body('description').trim().escape(),
  
  async (req, res) => {  // async = function can use await
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // Clean up: If validation fails, delete the uploaded file
      if (req.file) {
        fs.unlink(req.file.path, err => {
          if (err) console.error('Error deleting file:', err);
        });
      }
      return res.status(400).json({ errors: errors.array() });
    }

    const { catid, name, price, description } = req.body;
    let imageUrl = null;      // Will store path if image uploaded
    let thumbnailUrl = null;

    // Step 1: Verify category exists
    db.get('SELECT catid FROM categories WHERE catid = ?', [catid], async (err, cat) => {
      if (err) {
        // Error checking category: Clean up file and return error
        if (req.file) fs.unlinkSync(req.file.path);
        return res.status(500).json({ error: err.message });
      }
      if (!cat) {
        // Category doesn't exist: Clean up file and return error
        if (req.file) fs.unlinkSync(req.file.path);
        return res.status(400).json({ error: 'Invalid category ID' });
      }

      // Step 2: Insert product into database first (to get auto-generated ID)
      db.run(
        'INSERT INTO products (catid, name, price, description) VALUES (?, ?, ?, ?)',
        [catid, name, price, description],
        async function(err) {
          // function(err) = need 'this' for this.lastID
          
          if (err) {
            if (req.file) fs.unlinkSync(req.file.path);
            return res.status(500).json({ error: err.message });
          }

          const pid = this.lastID;  // Get auto-generated product ID

          // Step 3: Process image if uploaded
          if (req.file) {
            try {
              const ext = path.extname(req.file.originalname).toLowerCase();
              // Extract file extension (.jpg, .png, etc.)
              
              const fullImageName = `product_${pid}${ext}`;
              const thumbImageName = `product_${pid}_thumb${ext}`;
              // Naming: product_123.jpg, product_123_thumb.jpg
              
              const fullImagePath = path.join(uploadsDir, fullImageName);
              const thumbImagePath = path.join(thumbsDir, thumbImageName);
              // Full paths: /uploads/product_123.jpg, /uploads/thumbnails/product_123_thumb.jpg

              // Scale and save FULL IMAGE
              await sharp(req.file.path)
                .resize(1024, 1024, { fit: 'inside', withoutEnlargement: true })
                // Fit inside 1024x1024 box, maintain aspect ratio, don't enlarge small images
                .toFile(fullImagePath);
              // Save to /uploads/product_123.jpg

              // Scale and save THUMBNAIL
              await sharp(req.file.path)
                .resize(300, 300, { fit: 'inside', withoutEnlargement: true })
                // Fit inside 300x300 box for faster loading
                .toFile(thumbImagePath);
              // Save to /uploads/thumbnails/product_123_thumb.jpg

              // Delete temporary uploaded file
              fs.unlinkSync(req.file.path);

              imageUrl = `/uploads/${fullImageName}`;
              thumbnailUrl = `/uploads/thumbnails/${thumbImageName}`;
              // Store paths for database

              // Step 4: Update product with image URLs
              db.run(
                'UPDATE products SET image_url = ?, thumbnail_url = ? WHERE pid = ?',
                [imageUrl, thumbnailUrl, pid],
                (err) => {
                  if (err) {
                    return res.status(500).json({ error: err.message });
                  }
                  // Return complete product object
                  res.json({ pid, catid, name, price, description, image_url: imageUrl, thumbnail_url: thumbnailUrl });
                }
              );
            } catch (imageErr) {
              // Image processing failed
              if (fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);  // Clean up
              }
              return res.status(500).json({ error: 'Error processing image: ' + imageErr.message });
            }
          } else {
            // No image uploaded: Return product without images
            res.json({ pid, catid, name, price, description, image_url: null, thumbnail_url: null });
          }
        }
      );
    });
  }
);
```

**Key Concepts:**
- **`async/await`**: Makes code wait for operations to finish
- **`this.lastID`**: Captures auto-generated ID for next step
- **`sharp` library**: Resizes images (creates thumbnail version)
- **`fs.unlinkSync()`**: Deletes file from disk
- **Error handling**: Always clean up files if something fails

---

## 🛒 cart.js - Shopping Cart System

### Lines 1-26: ShoppingCart Class - Constructor

```javascript
// LINE 6-12: Define ShoppingCart class
class ShoppingCart {
  constructor() {
    this.items = new Map();  // JavaScript Map: pid → { pid, qty, name, price, image_url }
    // Map is like JavaScript object but optimized for storing key-value pairs
    // Keys = product IDs (123, 456)
    // Values = { pid: 123, qty: 2, name: 'Controller', price: 29.99, image_url: '/img.jpg' }
    
    this.storageKey = 'shoppingCart';  // Key name for localStorage
    this.init();  // Load saved cart from browser storage
  }
```

**Why Map instead of Object?**
- Maps are faster for add/remove operations
- Built-in `.has()`, `.get()`, `.delete()` methods
- Can use any data type as key (not just strings)

```javascript
// LINE 14-24: Initialize cart from browser storage
init() {
  const stored = localStorage.getItem(this.storageKey);
  // Try to get 'shoppingCart' from browser's localStorage
  // localStorage persists data even after browser closes
  
  if (stored) {
    // If saved data exists:
    try {
      const data = JSON.parse(stored);  // Convert JSON string → JavaScript object
      this.items = new Map(data);  // Convert array → Map
    } catch (e) {
      // If parsing fails (corrupted data):
      console.error('Error loading cart from localStorage:', e);
      this.items = new Map();  // Start with empty cart
    }
  }
}
```

---

### Lines 28-60: Add Item to Cart

```javascript
// LINE 27-60: ASYNC function to add product to cart
async addItem(pid, quantity = 1) {
  // async = function contains operations that take time (fetch)
  
  pid = parseInt(pid);      // Convert '123' (string) → 123 (number)
  quantity = parseInt(quantity);

  if (quantity <= 0) return false;  // Reject if quantity invalid

  if (this.items.has(pid)) {
    // If product already in cart:
    const item = this.items.get(pid);  // Get existing item
    item.qty += quantity;               // Increase quantity
    this.items.set(pid, item);          // Update the map
  } else {
    // If product NOT in cart yet:
    try {
      const response = await fetch(`/api/products/${pid}`);
      // async: Wait for server to respond (don't continue until response received)
      // fetch() sends HTTP GET request to backend
      
      if (!response.ok) {
        console.error('Product not found:', pid);
        return false;  // Return failure if product doesn't exist
      }
      
      const product = await response.json();
      // async: Wait for response body to be parsed as JSON
      // product = { pid: 123, name: 'Controller', price: 29.99, ... }
      
      this.items.set(pid, {
        // Store in Map with auto-generated ID as key
        pid: pid,
        qty: quantity,
        name: product.name,
        price: product.price,
        image_url: product.image_url || product.thumbnail_url || '/images/placeholder.jpg'
        // If image_url missing, use thumbnail; if both missing, use placeholder
      });
    } catch (e) {
      console.error('Error fetching product:', e);
      return false;  // Return failure if fetch error
    }
  }

  this.save();  // After adding/updating, save to localStorage
  return true;  // Return success
}
```

**Key Concept - async/await:**
```javascript
// Without async/await (old way):
fetch(url).then(res => res.json()).then(data => { ... });

// With async/await (cleaner):
const res = await fetch(url);        // Wait for fetch
const data = await res.json();       // Wait for JSON parsing
// Continue with data
```

---

### Lines 62-74: Remove Item

```javascript
// LINE 62-65: Remove product from cart
removeItem(pid) {
  pid = parseInt(pid);
  this.items.delete(pid);  // Map.delete(key) removes key-value pair
  this.save();  // Save updated cart
}
```

---

### Lines 76-92: Update Quantity

```javascript
// LINE 76-92: Update product quantity
updateQuantity(pid, quantity) {
  pid = parseInt(pid);
  quantity = parseInt(quantity);

  if (quantity <= 0) {
    // If quantity becomes 0 or negative: Remove product
    this.removeItem(pid);
  } else if (this.items.has(pid)) {
    // If product exists and quantity is positive:
    const item = this.items.get(pid);
    item.qty = quantity;  // Change quantity to new value
    this.items.set(pid, item);  // Update in Map
    this.save();  // Save to localStorage
  }
}
```

---

### Lines 94-142: Cart Totals and Retrieval

```javascript
// LINE 94-101: Calculate total price
getTotalPrice() {
  let total = 0;
  for (const item of this.items.values()) {
    // Loop through all items in Map
    // .values() gets all the product objects (not keys)
    
    total += item.price * item.qty;  // Add: (price × quantity) to total
  }
  return total;  // Return sum of all items
}

// LINE 103-108: Count total quantity
getTotalQuantity() {
  let total = 0;
  for (const item of this.items.values()) {
    total += item.qty;  // Add up quantities of all items
  }
  return total;  // Return sum of quantities
}

// LINE 110-114: Get all items as array
getItems() {
  return Array.from(this.items.values());
  // Convert Map values to array
  // Result: [{ pid: 123, qty: 2, ... }, { pid: 456, qty: 1, ... }]
}

// LINE 116-120: Get single item
getItem(pid) {
  pid = parseInt(pid);
  return this.items.get(pid);  // Return item object or undefined
}

// LINE 122-126: Clear entire cart
clear() {
  this.items.clear();  // Map.clear() removes all key-value pairs
  this.save();  // Save empty state
}

// LINE 128-135: Save cart to browser
save() {
  try {
    const data = Array.from(this.items);
    // Convert Map to array: [[pid1, {...}], [pid2, {...}]]
    
    localStorage.setItem(this.storageKey, JSON.stringify(data));
    // Convert array → JSON string → save with key 'shoppingCart'
  } catch (e) {
    console.error('Error saving cart to localStorage:', e);
  }
}
```

---

## 📱 admin.js - Admin Dashboard

### Lines 1-21: Tab Switching

```javascript
// LINE 1-2: Setup tab buttons
document.querySelectorAll('.tab-btn').forEach(btn => {
  // Get all buttons with class 'tab-btn'
  // .forEach(btn => { ... }) = run function for each button
  
  btn.addEventListener('click', () => {
    // When button clicked:
    
    const tabName = btn.dataset.tab;
    // Get tab name from data-tab attribute
    // Example: <button data-tab="products"> → tabName = 'products'
    
    // Remove 'active' class from ALL buttons
    document.querySelectorAll('.tab-btn').forEach(b => 
      b.classList.remove('active')
    );
    
    // Remove 'active' class from ALL content areas
    document.querySelectorAll('.tab-content').forEach(c => 
      c.classList.remove('active')
    );
    
    // Add 'active' class to CLICKED button
    btn.classList.add('active');
    
    // Add 'active' class to CORRESPONDING content area
    document.getElementById(`${tabName}-tab`).classList.add('active');
    // If tabName = 'products' → find element with id='products-tab'
    
    // Load data for the selected tab
    if (tabName === 'products') {
      loadProducts();
      loadCategories();  // Categories needed for dropdown
    } else if (tabName === 'categories') {
      loadCategories();
    }
  });
});

// CSS handles display:
// <div class="tab-content active"> = shown
// <div class="tab-content"> = hidden
```

---

### Lines 23-32: Display Messages

```javascript
// LINE 23-32: Show temporary status message
function showMessage(elementId, message, type = 'success') {
  const msgElement = document.getElementById(elementId);
  // Get message element (like <div id="product-message">)
  
  msgElement.textContent = message;
  // Set message text
  
  msgElement.className = `message ${type}`;
  // Set class to apply appropriate styling
  // Example: 'message success' (green) or 'message error' (red)
  
  msgElement.style.display = 'block';
  // Make message visible
  
  setTimeout(() => {
    msgElement.style.display = 'none';
    // Hide message after 5 seconds
  }, 5000);
}
```

---

### Lines 34-60: Load and Display Products

```javascript
// LINE 36-60: Fetch and display all products
function loadProducts() {
  fetch('/api/products')
    // Send GET request to backend
    .then(response => response.json())
    // Wait for response → parse as JSON
    
    .then(data => {
      // data = array of products from database
      
      const container = document.getElementById('products-container');
      
      if (!data || data.length === 0) {
        // If no products exist:
        container.innerHTML = '<p>No products yet.</p>';
        return;  // Stop execution
      }
      
      container.innerHTML = data.map(product => `
        // map() = transform each product into HTML string
        <div class="product-item">
          <div style="display: flex; align-items: center; width: 100%;">
            ${product.thumbnail_url ? `<img src="${product.thumbnail_url}" alt="${product.name}" />` : ''}
            // Ternary operator: If thumbnail exists, show image; else show nothing
            
            <div class="product-info">
              <strong>${product.name}</strong><br />
              <small>ID: ${product.pid} | Price: $${parseFloat(product.price).toFixed(2)} | Category ID: ${product.catid}</small><br />
              <small>${product.description}</small>
            </div>
          </div>
          <div class="item-actions">
            <button onclick="editProduct(${product.pid})">Edit</button>
            <button class="delete" onclick="deleteProduct(${product.pid})">Delete</button>
          </div>
        </div>
      `).join('');  // .join('') = combine all HTML strings into one big string
    })
    .catch(err => console.error('Error loading products:', err));
}
```

---

### Lines 62-74: Edit Product

```javascript
// LINE 62-74: Load product data into edit form
function editProduct(pid) {
  fetch(`/api/products/${pid}`)
    // Get specific product from backend
    .then(response => response.json())
    .then(product => {
      // Populate form fields with product data:
      
      document.getElementById('product-id').value = product.pid;
      // Hidden field: Remember which product we're editing
      
      document.getElementById('product-category').value = product.catid;
      document.getElementById('product-name').value = product.name;
      document.getElementById('product-price').value = product.price;
      document.getElementById('product-description').value = product.description;
      
      // Scroll form into view so user can see it
      document.getElementById('product-form').scrollIntoView({ behavior: 'smooth' });
    })
    .catch(err => console.error('Error loading product:', err));
}
```

---

### Lines 76-96: Delete Product

```javascript
// LINE 76-96: Remove product
function deleteProduct(pid) {
  if (confirm('Are you sure you want to delete this product?')) {
    // Show confirmation dialog; only continue if user clicks OK
    
    fetch(`/api/products/${pid}`, { method: 'DELETE' })
    // Send DELETE request to backend
    // This tells backend to remove product with this ID
    
    .then(response => response.json().then(data => ({ data, ok: response.ok, status: response.status })))
    // Parse response AND check HTTP status
    
    .then(({ data, ok, status }) => {
      if (!ok) {
        // If status is NOT 200-299 (error response)
        showMessage('product-message', data.error || `Error deleting product (Status: ${status})`, 'error');
        return;
      }
      
      showMessage('product-message', data.message || 'Product deleted successfully', 'success');
      loadProducts();  // Refresh product list
    })
    .catch(err => {
      showMessage('product-message', 'Error deleting product', 'error');
      console.error('Error:', err);
    });
  }
}
```

---

### Lines 98-152: Handle Product Form Submission

```javascript
// LINE 98-152: When user submits product form
document.getElementById('product-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  // Prevent browser from defaultreloading page on form submit
  
  // Get values from form fields:
  const pid = document.getElementById('product-id').value;  // Empty string if creating new
  const catid = document.getElementById('product-category').value;
  const name = document.getElementById('product-name').value;
  const price = document.getElementById('product-price').value;
  const description = document.getElementById('product-description').value;
  const imageFile = document.getElementById('product-image').files[0];
  // .files[0] = first selected file (or undefined if none selected)
  
  // VALIDATION:
  if (!catid) {
    showMessage('product-message', 'Please select a category', 'error');
    return;  // Stop execution
  }
  if (!name.trim()) {
    showMessage('product-message', 'Please enter a product name', 'error');
    return;
  }
  if (!price || parseFloat(price) < 0) {
    showMessage('product-message', 'Please enter a valid price', 'error');
    return;
  }
  if (!description.trim()) {
    showMessage('product-message', 'Please enter a description', 'error');
    return;
  }
  
  // Prepare form data (including file):
  const formData = new FormData();
  // FormData = special object for file uploads
  // Can't use JSON for file uploads (must use FormData)
  
  formData.append('catid', catid);
  formData.append('name', name);
  formData.append('price', price);
  formData.append('description', description);
  
  if (imageFile) {
    formData.append('image', imageFile);  // Add file to FormData
  }
  
  // Decide whether to CREATE or UPDATE:
  const url = pid ? `/api/products/${pid}` : '/api/products';
  // If pid exists (not empty): UPDATE /api/products/123
  // If pid empty: CREATE /api/products
  
  const method = pid ? 'PUT' : 'POST';
  // PUT = update existing
  // POST = create new
  
  try {
    const response = await fetch(url, { method, body: formData });
    // Send request with FormData
    // backend receives file via Multer middleware
    
    const data = await response.json();
    
    if (!response.ok) {
      showMessage('product-message', data.error || 'Error saving product', 'error');
      return;  // Stop if error
    }
    
    // Success!
    showMessage('product-message', 
      pid ? 'Product updated successfully' : 'Product created successfully',
      'success'
    );
    
    // Clear form for next entry:
    document.getElementById('product-form').reset();
    // reset() clears all input values
    
    document.getElementById('product-id').value = '';
    // Clear the hidden ID field
    
    loadProducts();  // Refresh product list
  } catch (err) {
    showMessage('product-message', 'Error saving product', 'error');
    console.error('Error:', err);
  }
});
```

---

## 📄 index-dynamic.js - Homepage Product Loader

```javascript
// LINE 1-4: Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
  // When HTML is fully loaded and parsed:
  loadCategories();  // Fetch and display categories
  loadProducts();    // Fetch and display products
});

// LINE 6-18: Load categories from backend
function loadCategories() {
  fetch('/api/categories')  // GET /api/categories
    .then(response => response.json())
    .then(categories => {
      // categories = [{ catid: 1, name: 'Gaming' }, ...]
      
      const categoryList = document.getElementById('category-list');
      // <ul id="category-list">
      
      categories.forEach(category => {
        // For each category:
        const li = document.createElement('li');  // Create <li></li>
        
        li.innerHTML = `<a href="index.html?catid=${category.catid}">${category.name}</a>`;
        // Create link: <a href="index.html?catid=1">Gaming</a>
        // ?catid=1 = query parameter for filtering
        
        categoryList.appendChild(li);  // Add <li> to <ul>
      });
    })
    .catch(err => console.error('Error loading categories:', err));
}

// LINE 20-54: Load products (optionally filtered)
function loadProducts() {
  // Get URL query parameters:
  const params = new URLSearchParams(window.location.search);
  // If URL = index.html?catid=1
  // Then params = { catid: '1' }
  
  const catid = params.get('catid');
  // Get value of 'catid' parameter (or null if not specified)
  
  let url = '/api/products';
  if (catid) {
    url += `?catid=${catid}`;  // Add filter: /api/products?catid=1
  }
  
  fetch(url)
    .then(response => response.json())
    .then(products => {
      const grid = document.getElementById('product-grid');
      grid.innerHTML = '';  // Clear previous products
      
      if (!products || products.length === 0) {
        grid.innerHTML = '<p style="grid-column: 1/-1;">No products available.</p>';
        return;
      }
      
      products.forEach(product => {
        const article = document.createElement('article');
        article.className = 'product';  // <article class="product">
        
        // Use thumbnail for faster loading:
        const imageUrl = product.thumbnail_url || '/images/placeholder.jpg';
        
        article.innerHTML = `
          <a href="product.html?id=${product.pid}" class="product-link">
            // Link to detail page with product ID in URL
            // product.html?id=123 → detail page loads product 123
            
            <img src="${imageUrl}" alt="${product.name}" />
            <h3>${product.name}</h3>
            <p class="price">$${parseFloat(product.price).toFixed(2)}</p>
          </a>
          <button class="add-to-cart" data-product-id="${product.pid}">Add to Cart</button>
          // data-product-id = custom attribute storing product ID
          // Used in event listener to identify which product clicked
        `;
        
        grid.appendChild(article);  // Add product to grid
      });
      
      handleCartButtons();  // Set up click listeners on buttons
    })
    .catch(err => console.error('Error loading products:', err));
}

// LINE 56-74: Handle "Add to Cart" button clicks
function handleCartButtons() {
  document.querySelectorAll('.add-to-cart').forEach(btn => {
    // Get all "Add to Cart" buttons
    
    btn.addEventListener('click', async function(e) {
      e.preventDefault();  // Button is <button> not link, but prevent default anyway
      
      const productId = this.dataset.productId;
      // Get product ID from data-product-id attribute
      // this.dataset = all data-* attributes on this element
      
      if (shoppingCartUI) {
        // If shopping cart exists:
        const success = await shoppingCartUI.addItem(productId, 1);
        // Add 1 unit of this product to cart
        
        if (success) {
          // If added successfully:
          const originalText = this.textContent;  // "Add to Cart"
          this.textContent = 'Added!';  // Change button text
          this.style.background = '#28a745';  // Change color to green
          
          setTimeout(() => {
            // After 1.5 seconds:
            this.textContent = originalText;  // Restore original text
            this.style.background = '';  // Restore original color
          }, 1500);
        }
      }
    });
  });
}
```

---

## 🛍️ product-dynamic.js - Product Detail Page

```javascript
// LINE 1-8: Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const productId = params.get('id');
  // If URL = product.html?id=123 → productId = '123'
  
  if (productId) {
    loadProductDetails(productId);  // Fetch this product from backend
  } else {
    document.querySelector('.product-info h2').textContent = 'Product not found';
    // If no ID in URL, show error
  }
});

// LINE 10-28: Fetch product from backend
function loadProductDetails(productId) {
  const numericId = parseInt(productId);  // Convert '123' → 123
  
  fetch(`/api/products/${numericId}`)  // GET /api/products/123
    .then(response => {
      if (!response.ok) {
        throw new Error('Product not found');  // Trigger error handling
      }
      return response.json();
    })
    .then(product => {
      displayProduct(product);  // Show product details
    })
    .catch(err => {
      // If fetch failed or product not found:
      console.error('Error loading product:', err);
      document.querySelector('.product-info h2').textContent = 'Product not found';
      document.querySelector('.product-info p').textContent = 'The requested product could not be found.';
    });
}

// LINE 30-90: Display product information
function displayProduct(product) {
  // Update browser tab title:
  document.title = product.name;  // <title>Product Name</title>
  
  // Update heading:
  document.querySelector('.product-info h2').textContent = product.name;
  
  // Update price:
  document.querySelector('.product-info .price').textContent = `$${parseFloat(product.price).toFixed(2)}`;
  
  // Update description:
  document.querySelector('.product-info .description').textContent = product.description;
  
  // Update image carousel:
  const swiperWrapper = document.querySelector('.swiper-wrapper');
  swiperWrapper.innerHTML = '';  // Clear previous images
  
  // Add main image:
  if (product.image_url) {
    const slide = document.createElement('div');
    slide.className = 'swiper-slide';  // <div class="swiper-slide">
    slide.innerHTML = `<img src="${product.image_url}" alt="${product.name}" />`;
    swiperWrapper.appendChild(slide);
  }
  
  // Add thumbnail as alternative:
  if (product.thumbnail_url && product.thumbnail_url !== product.image_url) {
    // Only add if DIFFERENT from main image
    
    const slide = document.createElement('div');
    slide.className = 'swiper-slide';
    slide.innerHTML = `<img src="${product.thumbnail_url}" alt="${product.name}" />`;
    swiperWrapper.appendChild(slide);
  }
  
  // Add placeholder if no images:
  if (!product.image_url && !product.thumbnail_url) {
    const slide = document.createElement('div');
    slide.className = 'swiper-slide';
    slide.innerHTML = `<img src="/images/placeholder.jpg" alt="${product.name}" style="..." />`;
    swiperWrapper.appendChild(slide);
  }
  
  // Initialize Swiper image carousel:
  const swiper = new Swiper('.product-swiper', {
    direction: 'horizontal',  // Swipe left-right
    loop: true,  // When reach end, loop back to start
    pagination: {
      el: '.swiper-pagination',  // Dot indicators
      clickable: true  // Can click dots to jump to slide
    },
    navigation: {
      nextEl: '.swiper-button-next',  // Next arrow
      prevEl: '.swiper-button-prev'   // Previous arrow
    }
  });
  
  // Update "Add to Cart" button:
  const addBtn = document.querySelector('.add-to-cart-btn');
  
  addBtn.addEventListener('click', async () => {
    // When button clicked:
    if (shoppingCartUI) {
      const success = await shoppingCartUI.addItem(product.pid, 1);
      
      if (success) {
        const originalText = addBtn.textContent;
        addBtn.textContent = '✓ Added to Cart!';
        addBtn.style.background = '#28a745';
        
        setTimeout(() => {
          addBtn.textContent = originalText;
          addBtn.style.background = '';
        }, 1500);
      }
    }
  });
}
```

---

## 🎓 Key Takeaways for Q&A Exam

### Critical Concepts

1. **Map vs Object**
   - Use Map for storing cart items (better performance)
   - Map methods: `.has()`, `.get()`, `.set()`, `.delete()`

2. **async/await**
   - `async` function can use `await`
   - `await` pauses execution until Promise finishes
   - Better than `.then()` chains for readability

3. **Parameterized Queries**
   - Use `?` placeholders: `db.run('WHERE id = ?', [id])`
   - Prevents SQL injection attacks
   - NEVER concatenate user input directly into SQL

4. **this.lastID vs this.changes**
   - `this.lastID` = ID of inserted row
   - `this.changes` = number of rows affected by UPDATE/DELETE

5. **Form Submission**
   - File uploads require `FormData` (not JSON)
   - Regular data can use `JSON.stringify()`

6. **Image Processing**
   - Sharp library resizes images automatically
   - Create thumbnail version for faster loading (300x300)
   - Save original image for detail page (1024x1024)

7. **localStorage**
   - Persists data in browser (survives page refresh/close)
   - Store as JSON strings (`.stringify()` and `.parse()`)
   - Key-value storage: `localStorage.setItem(key, value)`

Good luck on your Q&A exam! These line-by-line explanations should help you understand exactly what the code does.
