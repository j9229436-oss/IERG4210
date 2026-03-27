    console.log("Register.js loaded!");

    const registerForm = document.getElementById('registerForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const passwordConfirmInput = document.getElementById('passwordConfirm');
    const errorMsg = document.getElementById('errorMsg');
    const successMsg = document.getElementById('successMsg');
    const loadingDiv = document.getElementById('loading');

    // Password requirement checkers
    const reqLength = document.getElementById('req-length');
    const reqUpper = document.getElementById('req-upper');
    const reqNumber = document.getElementById('req-number');

    // Client-side input validation
    emailInput.addEventListener('input', function () {
      this.value = this.value.toLowerCase().trim();
    });

    passwordInput.addEventListener('input', function () {
      if (this.value.length > 100) {
        this.value = this.value.substring(0, 100);
      }

      // Check password requirements
      const password = this.value;
      const hasLength = password.length >= 8;
      const hasUpper = /[A-Z]/.test(password);
      const hasNumber = /[0-9]/.test(password);

      reqLength.classList.toggle('met', hasLength);
      reqUpper.classList.toggle('met', hasUpper);
      reqNumber.classList.toggle('met', hasNumber);
    });

    passwordConfirmInput.addEventListener('input', function () {
      if (this.value.length > 100) {
        this.value = this.value.substring(0, 100);
      }
    });

    registerForm.addEventListener('submit', async function (e) {
      e.preventDefault();

      // Clear previous messages
      errorMsg.classList.remove('show');
      successMsg.classList.remove('show');
      errorMsg.textContent = '';
      successMsg.textContent = '';

      // Client-side validation
      const email = emailInput.value.trim();
      const password = passwordInput.value;
      const passwordConfirm = passwordConfirmInput.value;

      if (!email) {
        errorMsg.textContent = 'Please enter your email address.';
        errorMsg.classList.add('show');
        return;
      }

      if (!password) {
        errorMsg.textContent = 'Please enter a password.';
        errorMsg.classList.add('show');
        return;
      }

      if (password.length < 8) {
        errorMsg.textContent = 'Password must be at least 8 characters.';
        errorMsg.classList.add('show');
        return;
      }

      if (!/[A-Z]/.test(password)) {
        errorMsg.textContent =
          'Password must contain at least one uppercase letter.';
        errorMsg.classList.add('show');
        return;
      }

      if (!/[0-9]/.test(password)) {
        errorMsg.textContent = 'Password must contain at least one number.';
        errorMsg.classList.add('show');
        return;
      }

      if (password !== passwordConfirm) {
        errorMsg.textContent = 'Passwords do not match.';
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

        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email, password, passwordConfirm, csrfToken: csrfData.csrfToken })
        });

        const data = await response.json();

        if (!response.ok) {
          loadingDiv.style.display = 'none';
          errorMsg.textContent =
            data.error || 'Registration failed. Please try again.';
          errorMsg.classList.add('show');
          return;
        }

        successMsg.textContent =
          'Registration successful! Redirecting to login...';
        successMsg.classList.add('show');

        setTimeout(() => {
          window.location.href = 'login.html';
        }, 1500);
      } catch (error) {
        loadingDiv.style.display = 'none';
        errorMsg.textContent =
          'An error occurred. Please try again later.';
        errorMsg.classList.add('show');
        console.error('Registration error:', error);
      }
    });