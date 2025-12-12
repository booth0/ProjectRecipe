// /src/controllers/routes.js (UPDATED for Branch 2)
import { Router } from 'express';

// Create a new router instance
const router = Router();

// Import controllers
import { homePage, aboutPage, testErrorPage } from './index.js';
import { notFoundHandler, globalErrorHandler } from './errors.js';
import { loginPage, loginUser, registerPage, registerUser, logoutUser } from './auth/auth.js';
import { 
    myRecipesPage, 
    newRecipePage, 
    createRecipeHandler, 
    recipeDetailPage, 
    editRecipePage, 
    updateRecipeHandler, 
    deleteRecipeHandler, 
    copyRecipeHandler 
} from './recipes/recipes.js';
import {
    submitRecipeHandler,
    submissionsPage,
    reviewSubmissionPage,
    approveSubmissionHandler,
    rejectSubmissionHandler
} from './recipes/submissions.js';
import {
    featuredRecipesPage,
    featuredRecipeDetailPage,
    copyFeaturedRecipeHandler,
    unfeatureRecipeHandler,
    deleteFeaturedRecipeHandler
} from './recipes/featured.js';

// Import middleware
import { requireAuth, requireAdmin, requireContributor, redirectIfAuthenticated } from '../middleware/auth.js';

// Home and basic pages
router.get('/', homePage);
router.get('/about', aboutPage);

// Authentication routes
router.get('/login', redirectIfAuthenticated, loginPage);
router.post('/login', loginUser);
router.get('/register', redirectIfAuthenticated, registerPage);
router.post('/register', registerUser);
router.post('/logout', logoutUser);

// Featured recipes (public access)
router.get('/featured', featuredRecipesPage);
router.get('/featured/:recipeId', featuredRecipeDetailPage);
router.post('/featured/:recipeId/copy', requireAuth, copyFeaturedRecipeHandler);
router.post('/featured/:recipeId/unfeature', requireContributor, unfeatureRecipeHandler);
router.post('/featured/:recipeId/delete', requireAuth, deleteFeaturedRecipeHandler);

// Recipe routes (user's personal recipes)
router.get('/recipes', requireAuth, myRecipesPage);
router.get('/recipes/new', requireAuth, newRecipePage);
router.post('/recipes', requireAuth, createRecipeHandler);
router.get('/recipes/:recipeId', requireAuth, recipeDetailPage);
router.get('/recipes/:recipeId/edit', requireAuth, editRecipePage);
router.post('/recipes/:recipeId/edit', requireAuth, updateRecipeHandler);
router.post('/recipes/:recipeId/delete', requireAuth, deleteRecipeHandler);
router.post('/recipes/:recipeId/copy', requireAuth, copyRecipeHandler);

// Submission routes
router.post('/recipes/:recipeId/submit', requireAuth, submitRecipeHandler);

// Contributor routes
router.get('/contributor/submissions', requireContributor, submissionsPage);
router.get('/contributor/submissions/:submissionId', requireContributor, reviewSubmissionPage);
router.post('/contributor/submissions/:submissionId/approve', requireContributor, approveSubmissionHandler);
router.post('/contributor/submissions/:submissionId/reject', requireContributor, rejectSubmissionHandler);

// Sharing routes (to be implemented)
// router.get('/shared', requireAuth, sharedWithMePage);
// router.post('/recipes/:recipeId/share', requireAuth, shareRecipe);
// router.post('/shares/:shareId/remove', requireAuth, removeShare);

// Admin routes (to be implemented)
// router.get('/admin', requireAdmin, adminDashboard);
// router.get('/admin/categories', requireAdmin, manageCategoriesPage);
// router.post('/admin/categories', requireAdmin, createCategory);
// router.post('/admin/categories/:categoryId/delete', requireAdmin, deleteCategory);
// router.get('/admin/users', requireAdmin, manageUsersPage);
// router.post('/admin/users/:userId/role', requireAdmin, updateUserRole);

// Route to trigger a test error
router.get('/test-error', testErrorPage);

// Error handlers (these should be registered last)
router.use(notFoundHandler);
router.use(globalErrorHandler);

export default router;