// Admin Panel JavaScript with Authentication

// Check authentication before loading admin panel
async function checkAdminAuth() {
  try {
    const response = await fetch('/api/auth/me');
    if (!response.ok || response.status === 401) {
      window.location.href = '/login.html';
      return false;
    }
    const data = await response.json();
    if (!data.user || !data.user.is_admin) {
      window.location.href = '/index.html';
      return false;
    }
    return true;
  } catch (error) {
    console.error('Auth check error:', error);
    window.location.href = '/login.html';
    return false;
  }
}

// Get CSRF token from cookies
async function getCsrfToken() {
  try {
    const response = await fetch('/api/auth/csrf-token');
    const data = await response.json();
    return data.csrfToken;
  } catch (error) {
    console.error('Error getting CSRF token:', error);
    return null;
  }
}

// Message Display
function showMessage(elementId, message, type = 'success') {
  const msgElement = document.getElementById(elementId);
  msgElement.textContent = message;
  msgElement.className = `message ${type}`;
  msgElement.style.display = 'block';
  
  setTimeout(() => {
    msgElement.style.display = 'none';
  }, 5000);
}

// Logout from admin panel
async function logoutAdmin() {
  if (confirm('Are you sure you want to logout?')) {
    try {
      const response = await fetch('/api/auth/logout', { method: 'POST' });
      if (response.ok) {
        window.location.href = '/index.html';
      }
    } catch (error) {
      console.error('Logout error:', error);
      alert('An error occurred during logout');
    }
  }
}

// Change password modal
function openChangePasswordModal() {
  const modalOverlay = document.createElement('div');
  modalOverlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
  `;

  const modal = document.createElement('div');
  modal.style.cssText = `
    background: white;
    padding: 30px;
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    max-width: 400px;
    width: 90%;
  `;

  modal.innerHTML = `
    <h2 style="margin-top: 0;">Change Password</h2>
    <div id="changePasswordError" style="color: #dc3545; margin-bottom: 15px; display: none;"></div>
    <form id="changePasswordForm">
      <div style="margin-bottom: 15px;">
        <label for="adminCurrentPassword" style="display: block; margin-bottom: 5px; font-weight: bold;">Current Password</label>
        <input type="password" id="adminCurrentPassword" required style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;" />
      </div>
      <div style="margin-bottom: 15px;">
        <label for="adminNewPassword" style="display: block; margin-bottom: 5px; font-weight: bold;">New Password</label>
        <input type="password" id="adminNewPassword" required style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;" />
      </div>
      <div style="margin-bottom: 15px;">
        <label for="adminNewPasswordConfirm" style="display: block; margin-bottom: 5px; font-weight: bold;">Confirm New Password</label>
        <input type="password" id="adminNewPasswordConfirm" required style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;" />
      </div>
      <div style="display: flex; gap: 10px;">
        <button type="submit" style="flex: 1; padding: 10px; background: #0077cc; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">Change Password</button>
        <button type="button" id="adminCancelPasswordBtn" style="flex: 1; padding: 10px; background: #ccc; color: black; border: none; border-radius: 4px; cursor: pointer;">Cancel</button>
      </div>
    </form>
  `;

  modalOverlay.appendChild(modal);
  document.body.appendChild(modalOverlay);

  const form = document.getElementById('changePasswordForm');
  const errorDiv = document.getElementById('changePasswordError');
  const cancelBtn = document.getElementById('adminCancelPasswordBtn');

  cancelBtn.addEventListener('click', () => modalOverlay.remove());

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorDiv.style.display = 'none';

    const currentPassword = document.getElementById('adminCurrentPassword').value;
    const newPassword = document.getElementById('adminNewPassword').value;
    const newPasswordConfirm = document.getElementById('adminNewPasswordConfirm').value;

    if (!currentPassword || !newPassword || !newPasswordConfirm) {
      errorDiv.textContent = 'All fields are required.';
      errorDiv.style.display = 'block';
      return;
    }

    if (newPassword.length < 8) {
      errorDiv.textContent = 'New password must be at least 8 characters.';
      errorDiv.style.display = 'block';
      return;
    }

    if (!/[A-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      errorDiv.textContent = 'New password must contain at least one uppercase letter and one number.';
      errorDiv.style.display = 'block';
      return;
    }

    if (newPassword !== newPasswordConfirm) {
      errorDiv.textContent = 'New passwords do not match.';
      errorDiv.style.display = 'block';
      return;
    }

    try {
      const csrfToken = await getCsrfToken();
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          newPasswordConfirm,
          csrfToken
        })
      });

      const data = await response.json();

      if (!response.ok) {
        errorDiv.textContent = data.error || 'Failed to change password.';
        errorDiv.style.display = 'block';
        return;
      }

      alert('Password changed successfully. You will be redirected to login.');
      setTimeout(() => window.location.href = 'login.html', 1500);
    } catch (error) {
      console.error('Error:', error);
      errorDiv.textContent = 'An error occurred. Please try again.';
      errorDiv.style.display = 'block';
    }
  });

  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) modalOverlay.remove();
  });
}

// Initialize admin panel
document.addEventListener('DOMContentLoaded', async () => {
  const isAuthed = await checkAdminAuth();
  if (!isAuthed) return;

  // Add admin header
  const header = document.querySelector('.top-bar');
  if (header) {
    const adminHeader = document.createElement('div');
    adminHeader.style.cssText = `
      position: absolute;
      top: 15px;
      right: 20px;
      display: flex;
      gap: 15px;
    `;
    adminHeader.innerHTML = `
      <button id="changeAdminPasswordBtn" style="background: rgba(255,255,255,0.2); color: white; padding: 8px 12px; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">Change Password</button>
      <button id="adminLogoutBtn" style="background: rgba(255,255,255,0.2); color: white; padding: 8px 12px; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">Logout</button>
    `;
    header.appendChild(adminHeader);

    document.getElementById('changeAdminPasswordBtn').addEventListener('click', openChangePasswordModal);
    document.getElementById('adminLogoutBtn').addEventListener('click', logoutAdmin);
  }

  // Tab Switching
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tabName = btn.dataset.tab;
      
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      
      btn.classList.add('active');
      document.getElementById(`${tabName}-tab`).classList.add('active');
      
      if (tabName === 'products') {
        loadProducts();
        loadCategories();
      } else if (tabName === 'categories') {
        loadCategories();
      }
    });
  });

  // Load initial data
  loadCategories();
  loadProducts();
});

// PRODUCTS

// Load and display all products
function loadProducts() {
  fetch('/api/products')
    .then(response => response.json())
    .then(data => {
      const container = document.getElementById('products-container');
      
      if (!data || data.length === 0) {
        container.innerHTML = '<p>No products yet.</p>';
        return;
      }
      
      container.innerHTML = data.map(product => `
        <div class="product-item">
          <div style="display: flex; align-items: center; width: 100%;">
            ${product.thumbnail_url ? `<img src="${product.thumbnail_url}" alt="${product.name}" />` : ''}
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
      `).join('');
    })
    .catch(err => console.error('Error loading products:', err));
}

// Edit product
function editProduct(pid) {
  fetch(`/api/products/${pid}`)
    .then(response => response.json())
    .then(product => {
      document.getElementById('product-id').value = product.pid;
      document.getElementById('product-category').value = product.catid;
      document.getElementById('product-name').value = product.name;
      document.getElementById('product-price').value = product.price;
      document.getElementById('product-description').value = product.description;
      
      document.getElementById('product-form').scrollIntoView({ behavior: 'smooth' });
    })
    .catch(err => console.error('Error loading product:', err));
}

// Delete product
async function deleteProduct(pid) {
  if (confirm('Are you sure you want to delete this product?')) {
    try {
      const csrfToken = await getCsrfToken();
      const response = await fetch(`/api/products/${pid}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csrfToken })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        showMessage('product-message', data.error || `Error deleting product (Status: ${response.status})`, 'error');
        return;
      }
      showMessage('product-message', data.message || 'Product deleted successfully', 'success');
      loadProducts();
    } catch (err) {
      showMessage('product-message', 'Error deleting product', 'error');
      console.error('Error:', err);
    }
  }
}

// Handle product form submission
document.addEventListener('DOMContentLoaded', () => {
  const productForm = document.getElementById('product-form');
  if (productForm) {
    productForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const pid = document.getElementById('product-id').value;
      const catid = document.getElementById('product-category').value;
      const name = document.getElementById('product-name').value;
      const price = document.getElementById('product-price').value;
      const description = document.getElementById('product-description').value;
      const imageFile = document.getElementById('product-image').files[0];
      
      if (!catid) {
        showMessage('product-message', 'Please select a category', 'error');
        return;
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
      
      const formData = new FormData();
      formData.append('catid', catid);
      formData.append('name', name);
      formData.append('price', price);
      formData.append('description', description);
      if (imageFile) {
        formData.append('image', imageFile);
      }
      
      const csrfToken = await getCsrfToken();
      formData.append('csrfToken', csrfToken);
      
      const url = pid ? `/api/products/${pid}` : '/api/products';
      const method = pid ? 'PUT' : 'POST';
      
      try {
        const response = await fetch(url, { method, body: formData });
        const data = await response.json();
        
        if (!response.ok) {
          showMessage('product-message', data.error || 'Error saving product', 'error');
          return;
        }
        
        showMessage('product-message', pid ? 'Product updated successfully' : 'Product created successfully', 'success');
        document.getElementById('product-form').reset();
        document.getElementById('product-id').value = '';
        loadProducts();
      } catch (err) {
        showMessage('product-message', 'Error saving product', 'error');
        console.error('Error:', err);
      }
    });
  }
});

// CATEGORIES

// Load and display all categories
function loadCategories() {
  fetch('/api/categories')
    .then(response => response.json())
    .then(data => {
      const select = document.getElementById('product-category');
      const currentValue = select.value;
      const defaultOption = select.querySelector('option[value=""]');
      select.innerHTML = '';
      if (defaultOption) {
        select.appendChild(defaultOption);
      }
      
      data.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat.catid;
        option.textContent = cat.name;
        select.appendChild(option);
      });
      
      if (currentValue) select.value = currentValue;
      
      const container = document.getElementById('categories-container');
      
      if (!data || data.length === 0) {
        container.innerHTML = '<p>No categories yet.</p>';
        return;
      }
      
      container.innerHTML = data.map(cat => `
        <div class="category-item">
          <div class="category-info">
            <strong>${cat.name}</strong><br />
            <small>ID: ${cat.catid}</small>
          </div>
          <div class="item-actions">
            <button onclick="editCategory(${cat.catid})">Edit</button>
            <button class="delete" onclick="deleteCategory(${cat.catid})">Delete</button>
          </div>
        </div>
      `).join('');
    })
    .catch(err => console.error('Error loading categories:', err));
}

// Edit category
function editCategory(catid) {
  fetch(`/api/categories/${catid}`)
    .then(response => response.json())
    .then(category => {
      document.getElementById('category-id').value = category.catid;
      document.getElementById('category-name').value = category.name;
      
      document.getElementById('category-form').scrollIntoView({ behavior: 'smooth' });
    })
    .catch(err => console.error('Error loading category:', err));
}

// Delete category
async function deleteCategory(catid) {
  if (confirm('Are you sure you want to delete this category? Associated products may also be deleted.')) {
    try {
      const csrfToken = await getCsrfToken();
      const response = await fetch(`/api/categories/${catid}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ csrfToken })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        showMessage('category-message', data.error || `Error deleting category (Status: ${response.status})`, 'error');
        return;
      }
      showMessage('category-message', data.message || 'Category deleted successfully', 'success');
      loadCategories();
    } catch (err) {
      showMessage('category-message', 'Error deleting category', 'error');
      console.error('Error:', err);
    }
  }
}

// Handle category form submission
document.addEventListener('DOMContentLoaded', () => {
  const categoryForm = document.getElementById('category-form');
  if (categoryForm) {
    categoryForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const catid = document.getElementById('category-id').value;
      const name = document.getElementById('category-name').value;
      
      if (!name.trim()) {
        showMessage('category-message', 'Please enter a category name', 'error');
        return;
      }
      
      const csrfToken = await getCsrfToken();
      const data = { name, csrfToken };
      
      const url = catid ? `/api/categories/${catid}` : '/api/categories';
      const method = catid ? 'PUT' : 'POST';
      
      try {
        const response = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        const result = await response.json();
        
        if (!response.ok) {
          showMessage('category-message', result.error || 'Error saving category', 'error');
          return;
        }
        
        showMessage('category-message', catid ? 'Category updated successfully' : 'Category created successfully', 'success');
        document.getElementById('category-form').reset();
        document.getElementById('category-id').value = '';
        loadCategories();
      } catch (err) {
        showMessage('category-message', 'Error saving category', 'error');
        console.error('Error:', err);
      }
    });
  }
});
