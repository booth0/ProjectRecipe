/**
 * Middleware to require authentication for protected routes.
 * Redirects to login page if user is not authenticated.
 */
const requireAuth = (req, res, next) => {
    if (!req.session?.user) {
        return res.redirect('/login?redirect=' + encodeURIComponent(req.originalUrl));
    }
    next();
};

/**
 * Middleware to require admin role for admin-only routes.
 * Returns 403 Forbidden if user is not an admin.
 */
const requireAdmin = (req, res, next) => {
    if (!req.session?.user) {
        return res.redirect('/login?redirect=' + encodeURIComponent(req.originalUrl));
    }
    
    if (req.session.user.role !== 'admin') {
        const err = new Error('Forbidden: Admin access required');
        err.status = 403;
        return next(err);
    }
    
    next();
};

/**
 * Middleware to require contributor or admin role.
 * Contributors can review recipes, feature content, and moderate.
 */
const requireContributor = (req, res, next) => {
    if (!req.session?.user) {
        return res.redirect('/login?redirect=' + encodeURIComponent(req.originalUrl));
    }
    
    const allowedRoles = ['contributor', 'admin'];
    if (!allowedRoles.includes(req.session.user.role)) {
        const err = new Error('Forbidden: Contributor or Admin access required');
        err.status = 403;
        return next(err);
    }
    
    next();
};

/**
 * Middleware to redirect authenticated users away from auth pages.
 * Useful for login/register pages - if already logged in, go to recipes.
 */
const redirectIfAuthenticated = (req, res, next) => {
    if (req.session?.user) {
        return res.redirect('/recipes');
    }
    next();
};

export { requireAuth, requireAdmin, requireContributor, redirectIfAuthenticated };