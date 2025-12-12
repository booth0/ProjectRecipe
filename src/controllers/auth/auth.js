import { createUser, verifyPassword, getUserByEmail } from '../../models/users/users.js';

/**
 * Display login page
 */
const loginPage = (req, res) => {
    const redirectUrl = req.query.redirect || '/recipes';

    res.render('auth/login', {
        title: 'Login',
        error: null,
        redirectUrl
    });
};

/**
 * Handle login form submission
 */
const loginUser = async (req, res) => {
    const { email, password, redirectUrl } = req.body;

    try {
        if (!email || !password) {
            return res.render('auth/login', {
                title: 'Login',
                error: 'Email and password are required',
                redirectUrl: redirectUrl || '/recipes'
            });
        }

        const user = await verifyPassword(email, password);

        if (!user) {
            return res.render('auth/login', {
                title: 'Login',
                error: 'Invalid email or password',
                redirectUrl: redirectUrl || '/recipes'
            });
        }

        req.session.user = {
            user_id: user.user_id,
            email: user.email,
            firstName: user.first_name,
            lastName: user.last_name,
            role: user.role
        };

        const destination = redirectUrl || '/recipes';
        res.redirect(destination);

    }   catch (error) {
        console.error('Login error:', error);
        res.render('auth/login', {
            title: 'Login',
            error: 'An error occured during login. Please try again.',
            redirectUrl: redirectUrl || '/recipes'
        });
    }    
};

/**
 * Display registration page
 */
const registerPage = (req, res) => {
    res.render('auth/register', {
        title: 'Register',
        error: null,
        formData: {}
    });
}

/**
 * Handle registration form submission
 */
const registerUser = async (req, res) => {
    const {email, password, confirmPassword, firstName, lastName } = req.body;

    try {
        // Validate inputs
        const errors = [];

        if (!email || !password || !confirmPassword || !firstName || !lastName) {
            errors.push('All fields are required');
        }

        if (password && password.length < 8) {
            errors.push('Password must be at least 8 characters long');
        }

        if (password !== confirmPassword) {
            errors.push('Passwords do not match');
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (email&& !emailRegex.test(email)) {
            errors.push('Invalid email format');
        }

        if (errors.length > 0) {
            return res.render('auth/register', {
                title: 'Register',
                error: errors.join(', '),
                formData: { email, firstName, lastName }
            });
        }

        // Check if email already exists
        const existingUser = await getUserByEmail(email);
        if (existingUser) {
            return res.render('auth/register', {
                title: 'Register',
                error: 'An account with this email already exists',
                formData: { email, firstName, lastName }
            });
        }

        // Create user (the default 'user' role is selected by default)
        const newUser = await createUser(email, password, firstName, lastName, 'user');

        // Create session for new user
        req.session.user = {
            user_id: newUser.user_id,
            email: newUser.email,
            firstName: newUser.first_name,
            lastName: newUser.last_name,
            role: newUser.role
        };

        // Redirect to recipes page
        res.redirect('/recipes');

    } catch (error) {
        console.error('Registration error:', error);

        let errorMessage = 'An error occurred during registration. Please try again.';

        // Handle specific error cases
        if (error.message === 'Email already registered') {
            errorMessage = 'An account with this email already exists';
        }

        res.render('auth/register', {
            title: 'Register',
            error: errorMessage,
            formData: { email, firstName, lastName }
        });
    }
};

/**
 * Handle logout
 */
const logoutUser = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Logout error:', err);
        }
        res.redirect('/');
    });
};

export { loginPage, loginUser, registerPage, registerUser, logoutUser };