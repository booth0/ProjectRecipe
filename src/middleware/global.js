/**
 * Middleware to add important local variables to res.locals for all templates.
 * These variables will be available in all EJS templates.
 */
const addImportantLocalVariables = (req, res, next) => {
    // Set current year for use in templates (e.g., copyright footer)
    res.locals.currentYear = new Date().getFullYear();

    // Make NODE_ENV available to all templates
    res.locals.NODE_ENV = process.env.NODE_ENV?.toLowerCase() || 'production';

    // Make req.query available to all templates for things like sorting, filtering
    res.locals.queryParams = { ...req.query };

    // Make user session available to all templates
    res.locals.user = req.session?.user || null;
    res.locals.isAuthenticated = !!req.session?.user;
    res.locals.isAdmin = req.session?.user?.role === 'admin';
    res.locals.isContributor = req.session?.user?.role === 'contributor' || req.session?.user?.role === 'admin';
    res.locals.isStandardUser = req.session?.user?.role === 'user';

    // Continue to the next middleware or route handler
    next();
};

export { addImportantLocalVariables };