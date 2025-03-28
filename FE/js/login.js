// login.js
// Base API URL
const baseURL = 'http://localhost:3000';

// Wait for the DOM to fully load
$(document).ready(() => {

    const loginContainer = $('#loginContainer')

    // Select elements
    const emailInput = $('#email');
    const passwordInput = $('#password');
    const loginButton = $('#login');
    const emailError = emailInput.next('.error-message');
    const passwordError = passwordInput.next('.error-message');

    // Email validation on input
    emailInput.on('input', () => {
        const email = emailInput.val().trim();
        const isValidEmail = validator.isEmail(email);
        emailInput.toggleClass('is-invalid', !email || !isValidEmail);
        if (!isValidEmail && email) {
            emailError.text('Please enter a valid email');
        } else if (!email) {
            emailError.text('Email is required');
        }
    });

    // Password validation on input
    passwordInput.on('input', () => {
        const password = passwordInput.val();
        const isStrongPassword = validator.isStrongPassword(password, {
            minLength: 8,
            minLowercase: 1,
            minUppercase: 1,
            minNumbers: 1,
            minSymbols: 1
        });
        passwordInput.toggleClass('is-invalid', !password || !isStrongPassword);
        if (!password) {
            passwordError.text('Password is required');
        } else if (password.length < 8) {
            passwordError.text('Password must be at least 8 characters and uppercase, lowercase, number, and symbol ');
        } else if (!isStrongPassword) {
            passwordError.text('Password must include uppercase, lowercase, number, and symbol');
        }
    });

    // Login button click handler
    loginContainer.on('submit', async (e) => {
       e.preventDefault() // Prevent default button behavior
       $('#loginContainer').attr('novalidate', ''); // إلغاء التحقق للحقول

        // Get input values
        const email = emailInput.val().trim();
        const password = passwordInput.val();
        const isValidEmail = validator.isEmail(email);
        const isStrongPassword = validator.isStrongPassword(password, {
            minLength: 8,
            minLowercase: 1,
            minUppercase: 1,
            minNumbers: 1,
            minSymbols: 1
        });

        // Client-side validation
        if (!isValidEmail || !isStrongPassword) {
            emailInput.toggleClass('is-invalid', !isValidEmail);
            passwordInput.toggleClass('is-invalid', !isStrongPassword);
            if (!isValidEmail) {
                emailError.text(email ? 'Please enter a valid email' : 'Email is required');
            }
            if (!isStrongPassword) {
                if (password.length < 8) {
                    passwordError.text('Password must be at least 8 characters');
                } else {
                    passwordError.text('Password must include uppercase, lowercase, number, and symbol');
                }
            }
            return; // Stop if validation fails
        }

        // Prepare data payload for API
        const data = { email, password };
        console.log('Sending data:', data);

        try {
            // Send POST request to backend
            const response = await axios({
                method: 'post',
                url: `${baseURL}/user/login`,
                data: data,
                headers: { 'Content-Type': 'application/json; charset=UTF-8' }
            });

            console.log('Response:', response);
            const { success, token } = response.data;

            // Handle successful login
            if (success) {
                localStorage.setItem('token', token);
                console.log(loginContainer);

                $('#loginContainer').addClass('movingHide')


                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1500);
            } else {
                console.log('Invalid email or password');
                emailInput.addClass('is-invalid shake');
                passwordInput.addClass('is-invalid shake');
                passwordError.text('Invalid email or password');
                setTimeout(() => {
                    emailInput.removeClass('shake');
                    passwordInput.removeClass('shake');
                });

            }} catch (error) {
                // Handle API errors
                console.error('Login error:', error);
                console.error(error.response?.data?.error);
                const errorMsg = error.response?.data?.error || 'Something went wrong';
                emailInput.addClass('is-invalid shake');
                passwordInput.addClass('is-invalid shake');
                passwordError.text(errorMsg);
                emailError.text(errorMsg);
                setTimeout(() => {
                    emailInput.removeClass('shake');
                    passwordInput.removeClass('shake');
                }, 500);
            }
        });
});