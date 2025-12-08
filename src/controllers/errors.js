/**
 * Error Controllers
 * Handles all error responses for the application
 */

// 404 Not Found handler
const notFoundHandler = (req, res, next) => {
    const err = new Error('Page Not Found');
    err.status = 404;
    next(err);
};

// Global error handler
const globalErrorHandler = (err, req, res, next) => {
    // Determine status and template
    const status = err.status || 500;
    const template = status === 404 ? '404' : '500';

    // Only log non-404 errors for debugging purposes
    if (status !== 404) {
        console.error('Error occurred:', err.message);
        console.error('Stack trace:', err.stack);
    }

    // Prepare data for the template
    const context = {
        title: status === 404 ? 'Page Not Found' : 'Server Error',
        error: err.message,
        stack: err.stack
    };

    // Render the appropriate error template
    res.status(status).render(`errors/${template}`, context);
};

export { notFoundHandler, globalErrorHandler };