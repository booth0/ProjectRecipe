import db from '../db.js';
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

/**
 * Create a new user account
 */
const createUser = async (email, password, firstName, lastName, role = 'user') => {
    try {
        // Hash the password
        const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

        const query = `
            INSERT INTO users (email, password_hash, first_name, last_name, role)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING user_id, email, first_name, last_name, role, created_at
        `;

        const result = await db.query(query, [
            email.toLowerCase().trim(),
            passwordHash,
            firstName.trim(),
            lastName.trim(),
            role
        ]);

        return result.rows[0];
    } catch (error) {
        console.error('Error creating user:', error.message);
        
        // Check for unique constraint violation on email
        if (error.code === '23505') {
            throw new Error('Email already registered');
        }
        
        throw error;
    }
};

/**
 * Get user by email
 */
const getUserByEmail = async (email) => {
    try {
        const query = `
            SELECT user_id, email, password_hash, first_name, last_name, role, created_at
            FROM users
            WHERE email = $1
        `;

        const result = await db.query(query, [email.toLowerCase().trim()]);

        if (result.rows.length === 0) {
            return null;
        }

        return result.rows[0];
    } catch (error) {
        console.error('Error getting user by email:', error.message);
        return null;
    }
};

/**
 * Get user by ID
 */
const getUserById = async (userId) => {
    try {
        const query = `
            SELECT user_id, email, first_name, last_name, role, created_at
            FROM users
            WHERE user_id = $1
        `;

        const result = await db.query(query, [userId]);

        if (result.rows.length === 0) {
            return null;
        }

        return result.rows[0];
    } catch (error) {
        console.error('Error getting user by ID:', error.message);
        return null;
    }
};

/**
 * Verify user password
 */
const verifyPassword = async (email, password) => {
    try {
        const user = await getUserByEmail(email);

        if (!user) {
            return null;
        }

        const isValid = await bcrypt.compare(password, user.password_hash);

        if (!isValid) {
            return null;
        }

        // Return user without password hash
        const { password_hash, ...userWithoutPassword } = user;
        return userWithoutPassword;
    } catch (error) {
        console.error('Error verifying password:', error.message);
        return null;
    }
};

/**
 * Get all users (admin only)
 */
const getAllUsers = async () => {
    try {
        const query = `
            SELECT user_id, email, first_name, last_name, role, created_at
            FROM users
            ORDER BY created_at DESC
        `;

        const result = await db.query(query);
        return result.rows;
    } catch (error) {
        console.error('Error getting all users:', error.message);
        return [];
    }
};

/**
 * Update user role (admin only)
 */
const updateUserRole = async (userId, newRole) => {
    try {
        if (!['admin', 'contributor', 'user'].includes(newRole)) {
            throw new Error('Invalid role');
        }

        const query = `
            UPDATE users
            SET role = $1
            WHERE user_id = $2
            RETURNING user_id, email, first_name, last_name, role
        `;

        const result = await db.query(query, [newRole, userId]);

        if (result.rows.length === 0) {
            return null;
        }

        return result.rows[0];
    } catch (error) {
        console.error('Error updating user role:', error.message);
        throw error;
    }
};

/**
 * Delete user account
 */
const deleteUser = async (userId) => {
    try {
        const query = `
            DELETE FROM users
            WHERE user_id = $1
            RETURNING user_id, email
        `;

        const result = await db.query(query, [userId]);

        if (result.rows.length === 0) {
            return null;
        }

        return result.rows[0];
    } catch (error) {
        console.error('Error deleting user:', error.message);
        throw error;
    }
};

export {
    createUser,
    getUserByEmail,
    getUserById,
    verifyPassword,
    getAllUsers,
    updateUserRole,
    deleteUser
};