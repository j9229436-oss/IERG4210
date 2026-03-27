// Authentication and user info management
const authModule = (() => {
  const userInfoElement = document.getElementById('userInfo');

  // Function to display user information
  async function displayUserInfo() {
    try {
      const response = await fetch('/api/auth/me', {
        method: 'GET'
      });

      if (response.ok) {
        const data = await response.json();
        const user = data.user;

        // User is logged in
        const userNameDisplay = document.createElement('span');
        userNameDisplay.className = 'user-name';
        userNameDisplay.textContent = `Welcome, ${user.email.split('@')[0]}`;

        const changePasswordLink = document.createElement('a');
        changePasswordLink.href = '#';
        changePasswordLink.textContent = '[Change Password]';
        changePasswordLink.addEventListener('click', (e) => {
          e.preventDefault();
          openChangePasswordModal();
        });

        const logoutBtn = document.createElement('button');
        logoutBtn.textContent = '[Logout]';
        logoutBtn.addEventListener('click', logout);

        // Show admin panel link if user is admin
        if (user.is_admin) {
          const adminLink = document.createElement('a');
          adminLink.href = 'admin.html';
          adminLink.textContent = 'Admin Panel';
          adminLink.className = 'admin-link';
          userInfoElement.appendChild(adminLink);
        }

        userInfoElement.appendChild(userNameDisplay);
        userInfoElement.appendChild(changePasswordLink);
        userInfoElement.appendChild(logoutBtn);
      } else {
        // User is not logged in
        displayLoginPrompt();
      }
    } catch (error) {
      console.error('Error checking authentication:', error);
      displayLoginPrompt();
    }
  }

  // Function to display login prompt for unauthenticated users
  function displayLoginPrompt() {
    const guestSpan = document.createElement('span');
    guestSpan.className = 'user-name';
    guestSpan.textContent = 'Guest';

    const loginLink = document.createElement('a');
    loginLink.href = 'login.html';
    loginLink.textContent = 'Login';

    const registerLink = document.createElement('a');
    registerLink.href = 'register.html';
    registerLink.textContent = 'Register';

    userInfoElement.appendChild(guestSpan);
    userInfoElement.appendChild(loginLink);
    userInfoElement.appendChild(registerLink);
  }

  // Function to logout
  async function logout() {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST'
      });

      if (response.ok) {
        // Redirect to home page
        window.location.href = '/index.html';
      } else {
        alert('Logout failed. Please try again.');
      }
    } catch (error) {
      console.error('Logout error:', error);
      alert('An error occurred during logout.');
    }
  }

  // Function to open change password modal
  function openChangePasswordModal() {
    // Create modal elements
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
          <label for="currentPassword" style="display: block; margin-bottom: 5px; font-weight: bold;">Current Password</label>
          <input type="password" id="currentPassword" name="currentPassword" required style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;" />
        </div>
        <div style="margin-bottom: 15px;">
          <label for="newPassword" style="display: block; margin-bottom: 5px; font-weight: bold;">New Password</label>
          <input type="password" id="newPassword" name="newPassword" required style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;" />
        </div>
        <div style="margin-bottom: 15px;">
          <label for="newPasswordConfirm" style="display: block; margin-bottom: 5px; font-weight: bold;">Confirm New Password</label>
          <input type="password" id="newPasswordConfirm" name="newPasswordConfirm" required style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;" />
        </div>
        <div style="display: flex; gap: 10px;">
          <button type="submit" style="flex: 1; padding: 10px; background: #0077cc; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">Change Password</button>
          <button type="button" id="cancelChangePasswordBtn" style="flex: 1; padding: 10px; background: #ccc; color: black; border: none; border-radius: 4px; cursor: pointer;">Cancel</button>
        </div>
      </form>
    `;

    modalOverlay.appendChild(modal);
    document.body.appendChild(modalOverlay);

    const form = document.getElementById('changePasswordForm');
    const errorDiv = document.getElementById('changePasswordError');
    const cancelBtn = document.getElementById('cancelChangePasswordBtn');

    cancelBtn.addEventListener('click', () => {
      modalOverlay.remove();
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      errorDiv.style.display = 'none';

      const currentPassword = document.getElementById('currentPassword').value;
      const newPassword = document.getElementById('newPassword').value;
      const newPasswordConfirm = document.getElementById('newPasswordConfirm').value;

      // Client-side validation
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
        // Get CSRF token
        const csrfResponse = await fetch('/api/auth/csrf-token');
        const csrfData = await csrfResponse.json();

        const response = await fetch('/api/auth/change-password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            currentPassword,
            newPassword,
            newPasswordConfirm,
            csrfToken: csrfData.csrfToken
          })
        });

        const responseData = await response.json();

        if (!response.ok) {
          errorDiv.textContent = responseData.error || 'Failed to change password.';
          errorDiv.style.display = 'block';
          return;
        }

        alert('Password changed successfully. You will be redirected to login.');
        setTimeout(() => {
          window.location.href = responseData.redirect || 'login.html';
        }, 1500);
      } catch (error) {
        console.error('Change password error:', error);
        errorDiv.textContent = 'An error occurred. Please try again.';
        errorDiv.style.display = 'block';
      }
    });

    // Close modal when clicking outside
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) {
        modalOverlay.remove();
      }
    });
  }

  // Initialize on page load
  return {
    init: function() {
      displayUserInfo();
    }
  };
})();

// Initialize auth module when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    authModule.init();
  });
} else {
  authModule.init();
}
