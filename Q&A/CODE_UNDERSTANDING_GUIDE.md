# Code Understanding Guide - E-Commerce Website

## 📋 Project Overview
This is a **full-stack E-Commerce website** that includes:
- **Frontend**: HTML/CSS/JavaScript user interface with shopping cart functionality
- **Backend**: Node.js Express server with RESTful API
- **Database**: SQLite3 storing products, categories, and order information

---

## 🏗️ System Architecture

```
Client (Browser)
    ↓
Public Folder (public/)
    ├── HTML Pages
    ├── CSS Styles
    └── JavaScript Dynamic Operations
    ↓
Express Server (server.js)
    ├── Route Management
    ├── File Upload Processing
    └── Data Validation
    ↓
SQLite Database (ecommerce.db)
    ├── Categories Table
    └── Products Table
```

---

## 📁 Core Files Explanation

### **1. Server.js - Backend Application Server**

**Purpose**: Main server file handling all API requests and business logic

**Main Functions**:
- Configure Express application
- Set up middleware (JSON parsing, static file serving)
- Define API routes
- Handle file uploads and image thumbnails

**Core Concept**:
```javascript
const express = require('express');
const app = express();

// Middleware: Parse JSON and form data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static file serving: Allow browser to access public folder
app.use(express.static(path.join(__dirname, 'public')));
```

**Multer File Upload**:
- Handles image uploads
- Limits: Max 10MB, only allows JPEG/PNG/WebP/GIF
- Automatically creates upload and thumbnail folders

---

### **2. db.js - Database Initialization**

**Purpose**: Initialize SQLite database and table structure

**Main Tables**:

#### **Categories Table**
```sql
CREATE TABLE categories (
  catid INTEGER PRIMARY KEY AUTOINCREMENT,  -- Category ID (auto-increment)
  name TEXT NOT NULL UNIQUE                 -- Category Name (unique)
)
```
- Purpose: Store product categories (e.g., "Gaming", "Food")

#### **Products Table**
```sql
CREATE TABLE products (
  pid INTEGER PRIMARY KEY AUTOINCREMENT,    -- Product ID
  catid INTEGER NOT NULL,                   -- Category ID (foreign key)
  name TEXT NOT NULL,                       -- Product Name
  price REAL NOT NULL,                      -- Price (float)
  description TEXT,                         -- Product Description
  image_url TEXT,                           -- Original Image URL
  thumbnail_url TEXT,                       -- Thumbnail URL
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP, -- Creation Time
  FOREIGN KEY(catid) REFERENCES categories(catid) ON DELETE CASCADE
)
```

**Sample Data**:
- Gaming Category: Gaming Controller, Gaming Keyboard, Gaming Glasses
- Food Category: Basic White Bread, Fresh Beef

---

### **3. Frontend HTML Files**

#### **index.html - Homepage**
- Display all products or filtered by category
- Includes shopping cart sidebar
- Category navigation bar

#### **admin.html - Admin Dashboard**
- Tabbed interface
- Product Management: Create, Edit, Delete products
- Category Management: Create, Edit, Delete categories
- File upload functionality

#### **product.html - Product Detail Page**
- Display single product details
- Add to cart button

#### **category1.html - Category Page**
- Display products of specific category

---

### **4. Frontend JavaScript Files**

#### **cart.js - Shopping Cart Management System**

**ShoppingCart Class Structure**:
```javascript
class ShoppingCart {
  constructor()      // Initialize shopping cart
  init()            // Load saved cart from localStorage
  addItem()         // Add product to cart
  removeItem()      // Remove product
  getTotal()        // Calculate total price
  save()            // Save to localStorage
}
```

**Workflow**:
1. User clicks "Add to Cart" button
2. JavaScript fetches product details from API
3. Add product to Map (pid as key)
4. Save to browser's localStorage
5. Update shopping cart UI

**localStorage Format**:
```javascript
{
  "123": { "pid": 123, "qty": 2, "name": "Product X", "price": 10.99 },
  "456": { "pid": 456, "qty": 1, "name": "Product Y", "price": 25.00 }
}
```

#### **index-dynamic.js - Homepage Dynamic Loading**

**Main Functions**:

1. **loadCategories()**
   - Call `/api/categories` API
   - Fetch all categories
   - Dynamically generate category links in navigation
   - Link format: `index.html?catid=1`

2. **loadProducts()**
   - Check `catid` parameter in URL
   - Call `/api/products` or `/api/products?catid=X`
   - Generate product cards (image, name, price, add to cart button)
   - Use thumbnail image for faster loading

3. **handleCartButtons()**
   - Add click listeners to all "Add to Cart" buttons
   - Call `shoppingCartUI.addItem()` on click
   - Button changes color to show "Added" feedback

**Workflow**:
```
User visits index.html
    ↓
DOMContentLoaded event triggered
    ↓
loadCategories() - Fetch and display categories
loadProducts()   - Load products based on URL parameter
    ↓
User sees dynamically generated product list
```

#### **admin.js - Admin Dashboard Logic**

**Main Features**:

1. **Tab Switching**
   - User clicks "Products" or "Categories" tab button
   - Show/hide corresponding content area
   - Auto-load corresponding data

2. **loadProducts()**
   - Call `/api/products` to get all products
   - Display product thumbnail, name, price, description
   - Each product has "Edit" and "Delete" buttons

3. **editProduct(pid)**
   - Called when "Edit" button clicked
   - Call `/api/products/:pid` to get product details
   - Populate form fields
   - User modifies and submits to update

4. **deleteProduct(pid)**
   - Confirmation prompt
   - Call DELETE `/api/products/:pid`
   - Reload product list after successful deletion

5. **Product Form Submission**
   - Validate all required fields
   - Use FormData to upload file
   - Create (POST) or Update (PUT) based on product-id
   - Show success/failure message

#### **products.js - Product Dynamic Loading**
- Similar to index-dynamic.js
- Used for other pages needing dynamic product loading

#### **product-dynamic.js - Product Detail Page**
- Get product ID from URL parameter
- Call API to fetch single product details
- Display complete product information

#### **script.js - Common Script**
- Shopping cart UI initialization
- Generic event handling

---

## 🔌 API Endpoints (RESTful API)

### **Category API**

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/categories` | Get all categories |
| GET | `/api/categories/:catid` | Get single category |
| POST | `/api/categories` | Create new category |
| PUT | `/api/categories/:catid` | Update category |
| DELETE | `/api/categories/:catid` | Delete category |

**Example**:
```
GET /api/categories
→ Returns: [
    { "catid": 1, "name": "Gaming" },
    { "catid": 2, "name": "Food" }
  ]
```

### **Product API**

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products` | Get all products (optional: ?catid=X for filter) |
| GET | `/api/products/:pid` | Get single product details |
| POST | `/api/products` | Create new product (supports file upload) |
| PUT | `/api/products/:pid` | Update product (supports file upload) |
| DELETE | `/api/products/:pid` | Delete product |

**Examples**:
```
GET /api/products?catid=1
→ Returns all products in category 1 (Gaming)

POST /api/products
→ body: { "catid": 1, "name": "Product", "price": 29.99, ... }
→ Creates new product

DELETE /api/products/123
→ Deletes product with pid=123
```

---

## 📊 Data Flow Examples

### **Scenario 1: User Browsing Products**

```
1. User visits https://website.com/index.html?catid=1
2. JavaScript executes loadCategories()
   ├─ Call GET /api/categories
   └─ Dynamically generate category navigation
3. JavaScript executes loadProducts()
   ├─ Detect catid=1 parameter in URL
   ├─ Call GET /api/products?catid=1
   └─ Get thumbnail_url from each product, generate product cards
4. User sees all products in Gaming category
```

### **Scenario 2: User Adding Product to Cart**

```
1. User clicks "Add to Cart" button (data-product-id=123)
2. handleCartButtons() captures event
3. Call shoppingCartUI.addItem(123, 1) (add 1 product)
4. addItem() function in cart.js:
   ├─ Check if product exists in localStorage
   ├─ If not: Call GET /api/products/123 to fetch details
   ├─ Store { pid, qty, name, price, image_url } in Map
   └─ Call save() to persist to localStorage
5. UI updates: Cart size +1, total price updated
6. Button shows "Added!" (restores after 1.5 seconds)
```

### **Scenario 3: Admin Editing Product**

```
1. Admin visits admin.html, clicks "Products" tab
2. loadProducts() calls GET /api/products, lists all products
3. Admin clicks product "Edit" button (pid=123)
4. editProduct(123):
   ├─ Call GET /api/products/123
   └─ Populate form (name, price, description, etc.)
5. Admin modifies form fields
6. Admin clicks submit button
7. Form validates all fields
8. If new image: Prepare FormData with image file
9. Call PUT /api/products/123
10. Server:
    ├─ Receive updated product data
    ├─ If new image:
    │  ├─ Use Sharp library to scale thumbnail
    │  ├─ Save original image to /uploads/
    │  └─ Save thumbnail to /uploads/thumbnails/
    └─ Update database
11. Return success message
12. Reload product list showing updated information
```

---

## 🔒 Security Features

### **Input Validation (express-validator)**
- **Purpose**: Prevent malicious input (SQL injection, XSS attacks, etc.)
- **Example**:
  ```javascript
  body('name').trim().isLength({ min: 1 }).escape()
  // trim() - Remove leading/trailing spaces
  // isLength({ min: 1 }) - At least 1 character
  // escape() - Escape special characters
  ```

### **File Upload Validation**
- **Allowed file types**: Only images (JPEG, PNG, WebP, GIF)
- **File size limit**: Max 10MB
- **Storage path**: Files saved in `/uploads/` directory

### **Database Security**
- **Parameterized queries**: Use `?` placeholders to prevent SQL injection
  ```javascript
  db.run('INSERT INTO products (...) VALUES (?, ?, ?)', [val1, val2, val3])
  ```

---

## 📦 Technology Stack

### **Backend**
- **Express.js** - Web framework
- **SQLite3** - Relational database
- **Multer** - File upload middleware
- **Sharp** - Image processing library
- **express-validator** - Input validation

### **Frontend**
- **HTML5** - Page structure
- **CSS3** - Styling and responsive design
- **JavaScript (Vanilla)** - DOM manipulation, AJAX calls
- **localStorage API** - Client-side data persistence

### **Deployment**
- **Nginx** - Reverse proxy
- **Azure VM** - Cloud server
- **Node.js** - Runtime environment

---

## 🚀 Application Startup Flow

```bash
npm start              # Execute node server.js

1. db.js initializes database and tables
2. Express application starts, listening on PORT 3000
3. Static files folder mounted (/public)
4. Upload folder check/creation
5. All API routes established
6. Wait for client requests
```

---

## ❓ FAQ

### **Q: Why use localStorage?**
A: 
- Save shopping cart in browser locally
- Data persists even after browser closes
- No need for backend session management

### **Q: What's the purpose of thumbnails?**
A: 
- Original high-quality images for product detail page
- Thumbnails for list display (faster loading)
- Auto-scaled and compressed using Sharp

### **Q: What happens during file upload?**
A: 
1. Client uploads file to server
2. Multer validates file type and size
3. Sharp creates thumbnail version
4. Filename generated: Product ID + original extension
5. Storage path saved to database

### **Q: How to prevent SQL injection?**
A: 
- Use parameterized queries: `db.run('...WHERE id = ?', [id])`
- Question mark `?` auto-escapes user input
- Never concatenate strings directly into SQL

### **Q: What's the relationship between categories and products?**
A: 
- Categories is parent table, products is child table
- Each product must belong to one category (FOREIGN KEY)
- Deleting category deletes all its products (CASCADE)

### **Q: How to filter products by category?**
A: 
- Frontend: `GET /api/products?catid=1`
- Backend checks catid parameter, returns matching products
- URL navigation: `index.html?catid=1`

---

## 🎓 Key Learning Points

**Understanding these concepts helps answer most questions**:

1. ✅ **Architecture**: Frontend (HTML/CSS/JS) + Backend (Express) + Database (SQLite)
2. ✅ **API Calls**: Use `fetch()` to call RESTful API
3. ✅ **Database**: Table structure, primary keys, foreign keys, CASCADE delete
4. ✅ **Shopping Cart System**: Use Map for storage, localStorage for persistence
5. ✅ **File Upload**: Multer validation, Sharp thumbnail generation
6. ✅ **Security**: express-validator, parameterized queries
7. ✅ **DOM Operations**: Dynamic HTML generation, event listeners
8. ✅ **Async Programming**: Promise, async/await, fetch API

---

## 📝 Quick Reference

### Important Paths
- Server entry: [server.js](server.js)
- Database init: [db.js](db.js)
- Homepage logic: [public/js/index-dynamic.js](public/js/index-dynamic.js)
- Shopping cart: [public/js/cart.js](public/js/cart.js)
- Admin dashboard: [public/js/admin.js](public/js/admin.js)

### Default Port
- Application: `localhost:3000`
- Image upload: `/api/products` (POST/PUT)

---

Good luck on your Q&A exam! Remember, understanding how the architecture works together is more important than memorizing every line of code.
