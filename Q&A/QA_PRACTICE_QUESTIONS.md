# Q&A Practice Questions - Challenge Preparation

This document contains types of questions that might appear in Challenge-Response Q&A. Use for self-testing and understanding code.

---

## 🔴 Level 1 - Basic Concepts (Should answer easily)

### 1. What does the project do?
**Expected Answer**:
- Full-stack e-commerce website
- Users can browse and shop (shopping cart functionality)
- Admin can manage products and categories
- Uses Node.js + SQLite backend

**Good if you mention**: Frontend, backend, shopping, management

---

### 2. What are the main technologies you used?
**Expected Answer**:
- Backend: Node.js, Express.js
- Database: SQLite3
- Frontend: HTML, CSS, JavaScript
- File upload: Multer, Sharp

**Checkpoint**: Able to list at least 3 technologies

---

### 3. What are the two main tables in your database?
**Expected Answer**:
1. **Categories Table**: Store product categories (Gaming, Food, etc.)
   - Fields: catid (ID), name (category name)

2. **Products Table**: Store product information
   - Fields: pid, catid, name, price, description, image_url, thumbnail_url

**Checkpoint**: Can name tables and main fields

---

### 4. What's the main purpose of server.js?
**Expected Answer**:
- Create Express application server
- Define API routes
- Handle client HTTP requests
- Interact with database
- Handle file uploads

**Simple Version**: "It's the backend server handling all API requests"

---

### 5. How does frontend get data from backend?
**Expected Answer**:
- Use JavaScript `fetch()` function
- Send HTTP request to API endpoint (e.g., `/api/products`)
- AJAX asynchronous call (no page refresh)
- Convert data to JSON format

**Example**:
```javascript
fetch('/api/products')
  .then(response => response.json())
  .then(data => console.log(data))
```

---

## 🟡 Level 2 - Design Understanding (Requires thought)

### 6. How is the shopping cart saved?
**Expected Answer**:
- Use browser `localStorage`
- Store in JSON format
- Persists even after browser closes
- Use product ID (pid) as key

**Statement**: "Shopping cart data stored locally on client using localStorage"

---

### 7. What's the purpose of thumbnails?
**Expected Answer**:
- Display small version of image in product list
- Faster page loading
- Save bandwidth
- Auto-generated using Sharp library

**Simple Answer**: "Thumbnails are smaller image versions for list display, loading faster than originals"

---

### 8. Why validate file type when uploading?
**Expected Answer**:
- Security: Prevent uploading malicious files
- Performance: Only accept image files
- Reduce storage waste
- Multer fileFilter validates MIME type

**Simple Answer**: "Prevent users from uploading non-image files, protecting server security"

---

### 9. Why use parameterized queries (? placeholders)?
**Expected Answer**:
- Prevent SQL injection attacks
- Safely handle user input
- Auto-escape special characters

**Code Example**:
```javascript
// ✅ Safe
db.run('WHERE id = ?', [userInput])

// ❌ Unsafe (vulnerable to injection)
db.run('WHERE id = ' + userInput)
```

---

### 10. Why are products deleted when category is deleted?
**Expected Answer**:
- FOREIGN KEY constraint set
- Use `ON DELETE CASCADE`
- Child table (products) also deleted with parent table (categories)
- Maintain data consistency

**Simple Answer**: "Because products belong to categories, when category deletes products should too (CASCADE setting)"

---

## 🟠 Level 3 - Code Analysis (Deep understanding)

### 11. Trace complete API request flow: User adds product to cart

**Expected Answer Flow**:
```
1. User clicks "Add to Cart" button on client
2. JavaScript handleCartButtons() captures click event
3. Call shoppingCartUI.addItem(productId, 1)
4. cart.js addItem() checks if product already in cart
5. If not, call fetch('/api/products/' + pid) to get product info
6. fetch sends GET request to server.js
7. app.get('/api/products/:pid') route triggered
8. Database query: db.get() executes SELECT to find product
9. Return product JSON data to client
10. cart.js receives data, adds to Map (cart data structure)
11. Call save() to persist cart to localStorage
12. UI updates: Show "Added" feedback, cart counter +1
```

**Scoring Points**:
- ✅ Mention event listeners
- ✅ Mention fetch call
- ✅ Mention API route
- ✅ Mention database query
- ✅ Mention localStorage save
- ✅ Explain frontend-backend bridge

---

### 12. What's the tab-switching logic in admin.js?
**Expected Answer**:
```javascript
// When user clicks tab button
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const tabName = btn.dataset.tab;
    
    // 1. Remove active class from all buttons
    // 2. Remove active class from all content areas
    // 3. Add active class to clicked button
    // 4. Add active class to corresponding content area
    // 5. Call loadProducts() or loadCategories() to load data
  });
});
```

**Understanding Points**:
- Use CSS class to toggle visibility
- Event delegation with data attributes
- Single Page Application (SPA) pattern

---

### 13. Complete image upload to database flow
**Expected Answer**:
```
1. User selects image file in admin.html
2. JavaScript uses FormData to package file
3. Call fetch('/api/products', { method: 'POST', body: formData })
4. Send to server.js POST /api/products route

On Server (server.js):
5. Multer middleware intercepts and validates file
   - Check MIME type (only images)
   - Check file size (max 10MB)
   - Save to /uploads/ folder
6. Sharp library reads uploaded image
7. Sharp resizes and compresses to create thumbnail
8. Thumbnail saved to /uploads/thumbnails/
9. Database saves image URLs:
   - image_url: '/uploads/[filename]'
   - thumbnail_url: '/uploads/thumbnails/[filename]'
10. Return success response to client
11. Page refresh showing product with image
```

**Checkpoints**:
- Understand FormData purpose
- Understand Multer validation flow
- Understand Sharp thumbnail generation
- Understand file storage location

---

### 14. If I wanted to add new API endpoint, what steps?

**Expected Answer**:
```
Say you want to add GET /api/products-by-price?minPrice=X&maxPrice=Y

1. Add new route in server.js:
   app.get('/api/products-by-price', (req, res) => {
     const { minPrice, maxPrice } = req.query;
     
     // Validate input
     if (!minPrice || !maxPrice) {
       return res.status(400).json({ error: 'Missing parameters' });
     }
     
     // Database query
     db.all(
       'SELECT * FROM products WHERE price >= ? AND price <= ?',
       [minPrice, maxPrice],
       (err, rows) => {
         if (err) return res.status(500).json({ error: err.message });
         res.json(rows);
       }
     );
   });

2. Call from frontend JavaScript:
   fetch('/api/products-by-price?minPrice=10&maxPrice=50')
     .then(res => res.json())
     .then(data => console.log(data));

3. Test the API
```

**Steps**:
- ✅ Define new route
- ✅ Add parameter validation
- ✅ Write database query
- ✅ Return JSON response
- ✅ Call API from frontend

---

## 🔴 Level 4 - Troubleshooting (Practical)

### 15. If shopping cart data isn't saving, what to check?

**Diagnosis Steps**:
1. Open browser console (F12)
2. Check for JavaScript errors
3. Check localStorage: `localStorage.getItem('shoppingCart')`
4. Verify `cart.js` `save()` method is being called
5. Check if browser private mode disabled localStorage

**Possible Causes**:
- `save()` not called correctly
- localStorage disabled by browser
- JSON.stringify() threw exception
- Map object not converted properly

---

### 16. Why can uploaded image display on product card but not in admin panel?

**Troubleshooting Steps**:
1. Check if image_url saved correctly in database
2. Check if file actually stored in `/uploads/` folder
3. Check Express static file route configuration
4. Verify image URL constructed correctly

**Possible Causes**:
- Static file route not configured: `app.use(express.static('public'))`
- Multer filename generation incorrect
- Database URL format error
- `/uploads/` folder permission issue

---

### 17. If category deletion fails, what to check?

**Troubleshooting Steps**:
1. Check if category has products (CASCADE handling)
2. Review server error logs
3. Verify DELETE route is correct
4. Check database connection is active
5. Verify foreign key constraints set up correctly

**Prevention Measure**:
```javascript
// Check dependencies before deleting
db.get('SELECT COUNT(*) as count FROM products WHERE catid = ?', 
  [catid], 
  (err, row) => {
    if (row.count > 0) {
      return res.json({ error: 'Cannot delete category with products' });
    }
    // Execute delete
  }
);
```

---

## 📋 Bonus Questions

### 18. Explain `const params = new URLSearchParams(window.location.search);`

**Answer**:
- `window.location.search` gets URL query string (?catid=1)
- `URLSearchParams` parses query parameters
- `params.get('catid')` extracts catid value
- Used to filter products by category

---

### 19. What are FOREIGN KEY and CASCADE?

**Answer**:
- FOREIGN KEY: Establish relationship between tables
- CASCADE: Auto-delete child records when parent deleted
- In this project: Delete category → auto-delete all related products

---

### 20. Why does cart.js use Map instead of plain object?

**Answer**:
- Map designed for key-value pair storage
- Easier to find by pid (product ID)
- `.has()` method clearly checks existence
- `.get()` and `.set()` operations more intuitive
- Easy to traverse: `.forEach()`

---

## 💡 Interview Tips

### ✅ **Good Answer Style**
- Start explaining from overall architecture
- Mention frontend, backend, database three layers
- Use code snippets as examples
- Explain "why" not just "what"
- Mention security or performance considerations

### ❌ **Avoid**
- Just saying "I don't know"
- Making up technical details you're unsure about
- Over-complicating explanation
- Ignoring system architecture perspective

### 🎯 **Suggested Answer Template**

**Question: How does [any feature] work?**

Answer template:
1. **User Action**: "User does [action] on HTML page"
2. **Frontend**: "JavaScript in [file] captures event, calls [function]"
3. **API Call**: "Use fetch to send [HTTP method] request to /api/[endpoint]"
4. **Backend**: "[route] in server.js handles this request"
5. **Database**: "Execute SQL query on [table] table"
6. **Return Result**: "Return data to frontend, update [UI element]"

---

## 🧪 Self-Assessment Checklist

Before accepting the challenge, check if you can answer these:

- [ ] Can explain project in one sentence
- [ ] Can list 5 technology names
- [ ] Can draw or describe frontend-backend-database flow
- [ ] Can explain why localStorage is used
- [ ] Can explain why thumbnails needed
- [ ] Can explain complete API call process
- [ ] Can explain file upload process
- [ ] Can explain database table relationships
- [ ] Can explain security validation purpose
- [ ] Can identify design patterns in code

If all checked, you're ready for Q&A challenge!

---

Best of luck! 💪
