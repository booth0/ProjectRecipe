import { Router } from 'express';

// Create a new router instance
const router = Router();

// Import controllers
import { homePage, aboutPage, testErrorPage } from './index.js';
import { notFoundHandler, globalErrorHandler } from './errors.js';
import { loginPage, loginUser, registerPage, registerUser, logoutUser } from './auth/auth.js';
import { myRecipesPage } from './recipes/recipes.js';

// Import middleware
import { requireAuth, requireAdmin, requireContributor, redirectIfAuthenticated } from '../middleware/auth.js';

// Home and basic pages
router.get('/', homePage);
router.get('/about', aboutPage);

// Authentication routes (to be implemented)
router.get('/login', redirectIfAuthenticated, loginPage);
router.post('/login', loginUser);
router.get('/register', redirectIfAuthenticated, registerPage);
router.post('/register', registerUser);
router.post('/logout', logoutUser);

// Recipe routes (to be implemented)
router.get('/recipes', requireAuth, myRecipesPage);
// router.get('/recipes/new', requireAuth, newRecipePage);
// router.post('/recipes', requireAuth, createRecipe);
// router.get('/recipes/:recipeId', requireAuth, recipeDetailPage);
// router.get('/recipes/:recipeId/edit', requireAuth, editRecipePage);
// router.post('/recipes/:recipeId/edit', requireAuth, updateRecipe);
// router.post('/recipes/:recipeId/delete', requireAuth, deleteRecipe);
// router.post('/recipes/:recipeId/copy', requireAuth, copyRecipe);

// Sharing routes (to be implemented)
// router.get('/shared', requireAuth, sharedWithMePage);
// router.post('/recipes/:recipeId/share', requireAuth, shareRecipe);
// router.post('/shares/:shareId/remove', requireAuth, removeShare);

// Collection routes (to be implemented)
// router.get('/collections', requireAuth, collectionsPage);
// router.post('/collections', requireAuth, createCollection);
// router.get('/collections/:collectionId', requireAuth, collectionDetailPage);
// router.post('/collections/:collectionId/add-recipe', requireAuth, addRecipeToCollection);
// router.post('/collections/:collectionId/remove-recipe', requireAuth, removeRecipeFromCollection);

// Tag routes (to be implemented)
// router.get('/tags', requireAuth, tagsPage);
// router.post('/recipes/:recipeId/tags', requireAuth, addTagToRecipe);
// router.post('/tags/:tagId/delete', requireAuth, deleteTag);

// Contributor routes (to be implemented)
// router.get('/contributor', requireContributor, contributorDashboard);
// router.get('/contributor/submissions', requireContributor, reviewSubmissionsPage);
// router.post('/contributor/submissions/:submissionId/approve', requireContributor, approveSubmission);
// router.post('/contributor/submissions/:submissionId/reject', requireContributor, rejectSubmission);
// router.post('/contributor/submissions/:submissionId/feature', requireContributor, featureSubmission);

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