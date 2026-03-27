const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const db = require('./db');
const { body, validationResult, query } = require('express-validator');

const app = express();
const PORT = 4000;

// ==================== SECURITY MIDDLEWARE ====================

// Set security headers (HELMET)
app.use(helmet());

// Set Content Security Policy header
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    imgSrc: ["'self'", 'data:', 'https:'],
    connectSrc: ["'self'"],
    fontSrc: ["'self'"],
    objectSrc: ["'none'"],
    mediaSrc: ["'self'"],
    frameSrc: ["'none'"],
  }
}));

// Set additional security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// ==================== STANDARD MIDDLEWARE ====================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files from public folder

// ==================== SESSION & CSRF MANAGEMENT ====================

// Store active sessions and CSRF tokens in memory (in production, use Redis or database)
const activeSessions = new Map();
const csrfTokens = new Map();

// Generate secure session ID
function generateSessionId() {
  return uuidv4();
}

// Generate secure CSRF token
function generateCsrfToken() {
  return uuidv4();
}

// Middleware to attach CSRF token to request for forms
app.use((req, res, next) => {
  // Generate new CSRF token for each request if not already set
  if (!req.cookies.csrfToken) {
    const csrfToken = generateCsrfToken();
    csrfTokens.set(csrfToken, Date.now());
    res.cookie('csrfToken', csrfToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 1000 * 60 * 60 // 1 hour
    });
  }
  next();
});

// Middleware to verify CSRF token
function verifyCsrfToken(req, res, next) {
  const csrfToken = req.body.csrfToken || req.headers['x-csrf-token'];
  const cookieCsrfToken = req.cookies.csrfToken;

  if (!csrfToken || !cookieCsrfToken || csrfToken !== cookieCsrfToken) {
    return res.status(403).json({ error: 'CSRF token validation failed' });
  }

  // Clean up old CSRF tokens (older than 2 hours)
  const now = Date.now();
  for (const [token, timestamp] of csrfTokens.entries()) {
    if (now - timestamp > 1000 * 60 * 60 * 2) {
      csrfTokens.delete(token);
    }
  }

  next();
}

// Middleware to check authentication from cookies
function checkAuth(req, res, next) {
  const sessionId = req.cookies.sessionId;

  if (!sessionId || !activeSessions.has(sessionId)) {
    req.user = null;
    return next();
  }

  // Check if session is expired
  const session = activeSessions.get(sessionId);
  if (Date.now() > session.expiresAt) {
    activeSessions.delete(sessionId);
    res.clearCookie('sessionId', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });
    req.user = null;
    return next();
  }

  req.user = session.user;
  next();
}

app.use(checkAuth);

// Middleware to require authentication
function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required. Please login.' });
  }
  next();
}

// Middleware to require admin role
function requireAdmin(req, res, next) {
  if (!req.user || !req.user.is_admin) {
    return res.status(403).json({ error: 'Admin access required.' });
  }
  next();
}

// ==================== UPLOADS CONFIGURATION ====================

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
const thumbsDir = path.join(uploadsDir, 'thumbnails');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
if (!fs.existsSync(thumbsDir)) {
  fs.mkdirSync(thumbsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + ext);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.'));
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// ==================== AUTHENTICATION API ROUTES ====================

// Login route
app.post('/api/auth/login',
  body('email').trim().isEmail().normalizeEmail(),
  body('password').trim().isLength({ min: 1, max: 100 }),
  verifyCsrfToken,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Invalid email or password format' });
    }

    const { email, password } = req.body;

    db.get('SELECT userid, email, password, is_admin FROM users WHERE email = ?', [email], async (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!user) {
        // Return generic error to prevent email enumeration
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      try {
        // Compare password with hash
        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
          return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Generate secure session ID
        const sessionId = generateSessionId();
        const expiresAt = Date.now() + (3 * 24 * 60 * 60 * 1000); // 3 days

        // Store session
        activeSessions.set(sessionId, {
          user: {
            userid: user.userid,
            email: user.email,
            is_admin: user.is_admin
          },
          expiresAt: expiresAt
        });

        // Set secure session cookie
        res.cookie('sessionId', sessionId, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 3 * 24 * 60 * 60 * 1000 // 3 days
        });

        const redirect = user.is_admin ? '/admin.html' : '/index.html';

        res.json({
          message: 'Login successful',
          user: {
            userid: user.userid,
            email: user.email,
            is_admin: user.is_admin
          },
          redirect: redirect
        });
      } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'An error occurred during login' });
      }
    });
  }
);

// Register route
app.post('/api/auth/register',
  body('email').trim().isEmail().normalizeEmail(),
  body('password').trim().isLength({ min: 8, max: 100 }),
  body('passwordConfirm').trim().isLength({ min: 8, max: 100 }),
  verifyCsrfToken,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Invalid input. Password must be at least 8 characters.' });
    }

    const { email, password, passwordConfirm } = req.body;

    // Validate password strength
    if (!/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
      return res.status(400).json({ error: 'Password must contain at least one uppercase letter and one number' });
    }

    if (password !== passwordConfirm) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }

    try {
      // Hash password (salt rounds: 10)
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insert new user
      db.run(
        'INSERT INTO users (email, password, is_admin) VALUES (?, ?, 0)',
        [email, hashedPassword],
        function(err) {
          if (err) {
            if (err.message.includes('UNIQUE constraint failed')) {
              return res.status(400).json({ error: 'Email is already registered' });
            }
            console.error('Registration error:', err);
            return res.status(500).json({ error: 'An error occurred during registration' });
          }

          res.json({
            message: 'Registration successful. Please login.',
            userid: this.lastID,
            email: email
          });
        }
      );
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'An error occurred during registration' });
    }
  }
);

// Logout route
app.post('/api/auth/logout', requireAuth, (req, res) => {
  const sessionId = req.cookies.sessionId;

  if (sessionId) {
    activeSessions.delete(sessionId);
  }

  res.clearCookie('sessionId', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  });

  res.json({ message: 'Logout successful' });
});

// Change password route
app.post('/api/auth/change-password',
  requireAuth,
  body('currentPassword').trim().isLength({ min: 1, max: 100 }),
  body('newPassword').trim().isLength({ min: 8, max: 100 }),
  body('newPasswordConfirm').trim().isLength({ min: 8, max: 100 }),
  verifyCsrfToken,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Invalid input' });
    }

    const { currentPassword, newPassword, newPasswordConfirm } = req.body;

    if (newPassword !== newPasswordConfirm) {
      return res.status(400).json({ error: 'New passwords do not match' });
    }

    // Validate new password strength
    if (!/[A-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      return res.status(400).json({ error: 'New password must contain at least one uppercase letter and one number' });
    }

    db.get('SELECT password FROM users WHERE userid = ?', [req.user.userid], async (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }

      try {
        // Verify current password
        const passwordMatch = await bcrypt.compare(currentPassword, user.password);

        if (!passwordMatch) {
          return res.status(401).json({ error: 'Current password is incorrect' });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password
        db.run(
          'UPDATE users SET password = ? WHERE userid = ?',
          [hashedPassword, req.user.userid],
          (err) => {
            if (err) {
              console.error('Password change error:', err);
              return res.status(500).json({ error: 'An error occurred while changing password' });
            }

            // Clear all sessions for this user (force re-login)
            const sessionId = req.cookies.sessionId;
            if (sessionId) {
              activeSessions.delete(sessionId);
            }

            res.clearCookie('sessionId', {
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'strict'
            });

            res.json({
              message: 'Password changed successfully. Please login again.',
              redirect: '/login.html'
            });
          }
        );
      } catch (error) {
        console.error('Password change error:', error);
        res.status(500).json({ error: 'An error occurred while changing password' });
      }
    });
  }
);

// Get current user info
app.get('/api/auth/me', requireAuth, (req, res) => {
  res.json({
    user: req.user
  });
});

// Get CSRF token for frontend
app.get('/api/auth/csrf-token', (req, res) => {
  const csrfToken = req.cookies.csrfToken;
  res.json({ csrfToken });
});

// ==================== CATEGORIES API ====================

// Get all categories
app.get('/api/categories', (req, res) => {
  db.all('SELECT * FROM categories ORDER BY name ASC', (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(rows || []);
  });
});

// Get single category
app.get('/api/categories/:catid',
  query('catid').isInt(),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Invalid category ID' });
    }

    const { catid } = req.params;
    db.get('SELECT * FROM categories WHERE catid = ?', [catid], (err, row) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (!row) {
        return res.status(404).json({ error: 'Category not found' });
      }
      res.json(row);
    });
  }
);

// Create category (admin only)
app.post('/api/categories',
  requireAdmin,
  body('name').trim().isLength({ min: 1, max: 100 }).escape(),
  verifyCsrfToken,
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Invalid category name' });
    }

    const { name } = req.body;
    db.run('INSERT INTO categories (name) VALUES (?)', [name], function(err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          return res.status(400).json({ error: 'Category name already exists' });
        }
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({ catid: this.lastID, name });
    });
  }
);

// Update category (admin only)
app.put('/api/categories/:catid',
  requireAdmin,
  body('name').trim().isLength({ min: 1, max: 100 }).escape(),
  verifyCsrfToken,
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Invalid category name' });
    }

    const { catid } = req.params;
    const { name } = req.body;
    
    db.run('UPDATE categories SET name = ? WHERE catid = ?', [name, catid], function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Category not found' });
      }
      res.json({ catid, name });
    });
  }
);

// Delete category (admin only)
app.delete('/api/categories/:catid',
  requireAdmin,
  verifyCsrfToken,
  (req, res) => {
    const { catid } = req.params;
    
    db.run('DELETE FROM categories WHERE catid = ?', [catid], function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Category not found' });
      }
      res.json({ message: 'Category deleted successfully' });
    });
  }
);

// ==================== PRODUCTS API ====================

// Get all products (with optional category filter)
app.get('/api/products',
  query('catid').optional().isInt(),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Invalid category ID' });
    }

    const { catid } = req.query;
    let sqlQuery = 'SELECT * FROM products';
    const params = [];

    if (catid) {
      sqlQuery += ' WHERE catid = ?';
      params.push(catid);
    }

    sqlQuery += ' ORDER BY created_at DESC';

    db.all(sqlQuery, params, (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(rows || []);
    });
  }
);

// Get single product
app.get('/api/products/:pid', (req, res) => {
  const { pid } = req.params;
  db.get('SELECT * FROM products WHERE pid = ?', [pid], (err, row) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (!row) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(row);
  });
});

// Create product (admin only)
app.post('/api/products',
  requireAdmin,
  upload.single('image'),
  body('catid').isInt(),
  body('name').trim().isLength({ min: 1, max: 255 }).escape(),
  body('price').isFloat({ min: 0 }),
  body('description').trim().isLength({ max: 2000 }).escape(),
  verifyCsrfToken,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      if (req.file) {
        fs.unlink(req.file.path, err => {
          if (err) console.error('Error deleting file:', err);
        });
      }
      return res.status(400).json({ error: 'Invalid product data' });
    }

    const { catid, name, price, description } = req.body;

    // Verify category exists
    db.get('SELECT catid FROM categories WHERE catid = ?', [catid], async (err, cat) => {
      if (err) {
        if (req.file) fs.unlinkSync(req.file.path);
        return res.status(500).json({ error: 'Database error' });
      }
      if (!cat) {
        if (req.file) fs.unlinkSync(req.file.path);
        return res.status(400).json({ error: 'Invalid category ID' });
      }

      // Insert product
      db.run(
        'INSERT INTO products (catid, name, price, description) VALUES (?, ?, ?, ?)',
        [catid, name, price, description],
        async function(err) {
          if (err) {
            if (req.file) fs.unlinkSync(req.file.path);
            return res.status(500).json({ error: 'Database error' });
          }

          const pid = this.lastID;

          // Process image if uploaded
          if (req.file) {
            try {
              const ext = path.extname(req.file.originalname).toLowerCase();
              const fullImageName = `product_${pid}${ext}`;
              const thumbImageName = `product_${pid}_thumb${ext}`;
              
              const fullImagePath = path.join(uploadsDir, fullImageName);
              const thumbImagePath = path.join(thumbsDir, thumbImageName);

              // Resize and save full image
              await sharp(req.file.path)
                .resize(1024, 1024, { fit: 'inside', withoutEnlargement: true })
                .toFile(fullImagePath);

              // Create thumbnail
              await sharp(req.file.path)
                .resize(300, 300, { fit: 'inside', withoutEnlargement: true })
                .toFile(thumbImagePath);

              fs.unlinkSync(req.file.path);

              const imageUrl = `/uploads/${fullImageName}`;
              const thumbnailUrl = `/uploads/thumbnails/${thumbImageName}`;

              // Update product with image URLs
              db.run(
                'UPDATE products SET image_url = ?, thumbnail_url = ? WHERE pid = ?',
                [imageUrl, thumbnailUrl, pid],
                (err) => {
                  if (err) {
                    return res.status(500).json({ error: 'Database error' });
                  }
                  res.json({ pid, catid, name, price, description, image_url: imageUrl, thumbnail_url: thumbnailUrl });
                }
              );
            } catch (imageErr) {
              if (fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
              }
              return res.status(500).json({ error: 'Error processing image' });
            }
          } else {
            res.json({ pid, catid, name, price, description, image_url: null, thumbnail_url: null });
          }
        }
      );
    });
  }
);

// Update product (admin only)
app.put('/api/products/:pid',
  requireAdmin,
  upload.single('image'),
  body('catid').isInt(),
  body('name').trim().isLength({ min: 1, max: 255 }).escape(),
  body('price').isFloat({ min: 0 }),
  body('description').trim().isLength({ max: 2000 }).escape(),
  verifyCsrfToken,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'Invalid product data' });
    }

    const { pid } = req.params;
    const { catid, name, price, description } = req.body;

    // Verify product exists
    db.get('SELECT * FROM products WHERE pid = ?', [pid], async (err, product) => {
      if (err) {
        if (req.file) fs.unlinkSync(req.file.path);
        return res.status(500).json({ error: 'Database error' });
      }
      if (!product) {
        if (req.file) fs.unlinkSync(req.file.path);
        return res.status(404).json({ error: 'Product not found' });
      }

      // Verify category exists
      db.get('SELECT catid FROM categories WHERE catid = ?', [catid], async (err, cat) => {
        if (err) {
          if (req.file) fs.unlinkSync(req.file.path);
          return res.status(500).json({ error: 'Database error' });
        }
        if (!cat) {
          if (req.file) fs.unlinkSync(req.file.path);
          return res.status(400).json({ error: 'Invalid category ID' });
        }

        let imageUrl = product.image_url;
        let thumbnailUrl = product.thumbnail_url;

        // Process new image if uploaded
        if (req.file) {
          try {
            // Delete old images if they exist
            if (product.image_url) {
              const oldImagePath = path.join(__dirname, product.image_url);
              if (fs.existsSync(oldImagePath)) fs.unlinkSync(oldImagePath);
            }
            if (product.thumbnail_url) {
              const oldThumbPath = path.join(__dirname, product.thumbnail_url);
              if (fs.existsSync(oldThumbPath)) fs.unlinkSync(oldThumbPath);
            }

            const ext = path.extname(req.file.originalname).toLowerCase();
            const fullImageName = `product_${pid}${ext}`;
            const thumbImageName = `product_${pid}_thumb${ext}`;
            
            const fullImagePath = path.join(uploadsDir, fullImageName);
            const thumbImagePath = path.join(thumbsDir, thumbImageName);

            // Resize and save full image
            await sharp(req.file.path)
              .resize(1024, 1024, { fit: 'inside', withoutEnlargement: true })
              .toFile(fullImagePath);

            // Create thumbnail
            await sharp(req.file.path)
              .resize(300, 300, { fit: 'inside', withoutEnlargement: true })
              .toFile(thumbImagePath);

            fs.unlinkSync(req.file.path);

            imageUrl = `/uploads/${fullImageName}`;
            thumbnailUrl = `/uploads/thumbnails/${thumbImageName}`;
          } catch (imageErr) {
            if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
            return res.status(500).json({ error: 'Error processing image' });
          }
        }

        // Update product
        db.run(
          'UPDATE products SET catid = ?, name = ?, price = ?, description = ?, image_url = ?, thumbnail_url = ? WHERE pid = ?',
          [catid, name, price, description, imageUrl, thumbnailUrl, pid],
          (err) => {
            if (err) {
              return res.status(500).json({ error: 'Database error' });
            }
            res.json({ pid, catid, name, price, description, image_url: imageUrl, thumbnail_url: thumbnailUrl });
          }
        );
      });
    });
  }
);

// Delete product (admin only)
app.delete('/api/products/:pid',
  requireAdmin,
  verifyCsrfToken,
  (req, res) => {
    const { pid } = req.params;

    db.get('SELECT * FROM products WHERE pid = ?', [pid], (err, product) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }

      // Delete images
      if (product.image_url) {
        const imagePath = path.join(__dirname, product.image_url);
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      }
      if (product.thumbnail_url) {
        const thumbPath = path.join(__dirname, product.thumbnail_url);
        if (fs.existsSync(thumbPath)) {
          fs.unlinkSync(thumbPath);
        }
      }

      // Delete from database
      db.run('DELETE FROM products WHERE pid = ?', [pid], function(err) {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }
        res.json({ message: 'Product deleted successfully' });
      });
    });
  }
);

// ==================== ERROR HANDLER ====================
app.use((err, req, res, next) => {
  console.error(err);
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 10MB.' });
    }
  }
  res.status(500).json({ error: 'An error occurred' });
});

// Start server
app.listen(PORT, '0.0.0.0', () => { 
  console.log(`Server running at http://localhost:${PORT}`); 
});
