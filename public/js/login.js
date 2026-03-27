
    const loginForm = document.getElementById('loginForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const errorMsg = document.getElementById('errorMsg');
    const successMsg = document.getElementById('successMsg');
    const loadingDiv = document.getElementById('loading');

    // Client-side input validation
    emailInput.addEventListener('input', function () {
      // Remove invalid characters and restrict to email format
      this.value = this.value.toLowerCase().trim();
    });

    passwordInput.addEventListener('input', function () {
      // Restrict password length to reasonable max (100 characters)
      if (this.value.length > 100) {
        this.value = this.value.substring(0, 100);
      }
    });

    loginForm.addEventListener('submit', async function (e) {
      e.preventDefault();

      // Clear previous messages
      errorMsg.classList.remove('show');
      successMsg.classList.remove('show');
      errorMsg.textContent = '';
      successMsg.textContent = '';

      // Client-side validation
      const email = emailInput.value.trim();
      const password = passwordInput.value;

      if (!email) {
        errorMsg.textContent = 'Please enter your email address.';
        errorMsg.classList.add('show');
        return;
      }

      if (!password) {
        errorMsg.textContent = 'Please enter your password.';
        errorMsg.classList.add('show');
        return;
      }

      if (password.length > 100) {
        errorMsg.textContent = 'Password is too long.';
        errorMsg.classList.add('show');
        return;
      }

      loadingDiv.style.display = 'block';

      try {
        // Get CSRF token
        const csrfResponse = await fetch('/api/auth/csrf-token');
        const csrfData = await csrfResponse.json();

        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email, password, csrfToken: csrfData.csrfToken })
        });

        const data = await response.json();

        if (!response.ok) {
          loadingDiv.style.display = 'none';
          errorMsg.textContent =
            data.error || 'Login failed. Please try again.';
          errorMsg.classList.add('show');
          return;
        }

        successMsg.textContent = 'Login successful! Redirecting...';
        successMsg.classList.add('show');

        setTimeout(() => {
          window.location.href = data.redirect || 'index.html';
        }, 1500);
      } catch (error) {
        loadingDiv.style.display = 'none';
        errorMsg.textContent =
          'An error occurred. Please try again later.';
        errorMsg.classList.add('show');
        console.error('Login error:', error);
      }
    });