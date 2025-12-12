import { getAllUsers, getUserByEmail, updateUserRole } from '../../models/users/users.js';

/**
 * Display admin dashboard with user management
 */
const adminDashboardPage = async (req, res) => {
    try {
        const searchEmail = req.query.search || '';
        
        let users;
        if (searchEmail) {
            // Search for specific user by email
            const user = await getUserByEmail(searchEmail);
            users = user ? [user] : [];
        } else {
            // Get all users
            users = await getAllUsers();
        }
        
        // Get flash message if any
        const flashMessage = req.session.flashMessage;
        delete req.session.flashMessage;
        
        res.render('admin/dashboard', {
            title: 'Admin Dashboard',
            users,
            searchEmail,
            flashMessage
        });
    } catch (error) {
        console.error('Error loading admin dashboard:', error);
        res.status(500).render('errors/500', {
            title: 'Error',
            error: 'Failed to load admin dashboard',
            stack: error.stack
        });
    }
};

/**
 * Handle user role update
 */
const updateUserRoleHandler = async (req, res) => {
    try {
        const userId = parseInt(req.params.userId);
        const { role } = req.body;
        
        // Validate role
        if (!['user', 'contributor', 'admin'].includes(role)) {
            req.session.flashMessage = {
                type: 'error',
                message: 'Invalid role selected'
            };
            return res.redirect('/admin');
        }
        
        // Prevent admin from changing their own role
        if (userId === req.session.user.user_id) {
            req.session.flashMessage = {
                type: 'error',
                message: 'You cannot change your own role'
            };
            return res.redirect('/admin');
        }
        
        const updatedUser = await updateUserRole(userId, role);
        
        if (!updatedUser) {
            req.session.flashMessage = {
                type: 'error',
                message: 'User not found'
            };
            return res.redirect('/admin');
        }
        
        req.session.flashMessage = {
            type: 'success',
            message: `Successfully updated ${updatedUser.email} to ${role}`
        };
        
        res.redirect('/admin');
    } catch (error) {
        console.error('Error updating user role:', error);
        
        req.session.flashMessage = {
            type: 'error',
            message: 'Failed to update user role'
        };
        
        res.redirect('/admin');
    }
};

export {
    adminDashboardPage,
    updateUserRoleHandler
};