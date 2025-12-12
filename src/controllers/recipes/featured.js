import {
    getAllFeaturedRecipes,
    searchFeaturedRecipes,
    getFeaturedRecipeById,
    unfeatureRecipe
} from '../../models/recipes/featured.js';
import { copyRecipe } from '../../models/recipes/recipes.js';

/**
 * Display featured recipes page (public)
 */
const featuredRecipesPage = async (req, res) => {
    try {
        const searchTerm = req.query.search || '';
        
        let recipes;
        if (searchTerm) {
            recipes = await searchFeaturedRecipes(searchTerm);
        } else {
            recipes = await getAllFeaturedRecipes();
        }
        
        // Get flash message if any
        const flashMessage = req.session.flashMessage;
        delete req.session.flashMessage;
        
        res.render('recipes/featured', {
            title: 'Featured Recipes',
            recipes,
            searchTerm,
            flashMessage
        });
    } catch (error) {
        console.error('Error loading featured recipes:', error);
        res.status(500).render('errors/500', {
            title: 'Error',
            error: 'Failed to load featured recipes',
            stack: error.stack
        });
    }
};

/**
 * Display featured recipe detail page (public)
 */
const featuredRecipeDetailPage = async (req, res) => {
    try {
        const recipeId = req.params.recipeId;
        
        const recipe = await getFeaturedRecipeById(recipeId);
        
        if (!recipe) {
            return res.status(404).render('errors/404', {
                title: 'Recipe Not Found'
            });
        }
        
        // Check if current user owns this recipe
        const isOwner = req.session.user && recipe.owner_id === req.session.user.user_id;
        
        res.render('recipes/featured-detail', {
            title: recipe.title,
            recipe,
            isOwner
        });
    } catch (error) {
        console.error('Error loading featured recipe:', error);
        res.status(500).render('errors/500', {
            title: 'Error',
            error: 'Failed to load recipe',
            stack: error.stack
        });
    }
};

/**
 * Copy a featured recipe to user's collection
 */
const copyFeaturedRecipeHandler = async (req, res) => {
    try {
        const recipeId = req.params.recipeId;
        const userId = req.session.user.user_id;
        
        // Verify recipe is featured
        const recipe = await getFeaturedRecipeById(recipeId);
        if (!recipe) {
            return res.status(404).json({ 
                success: false, 
                error: 'Featured recipe not found' 
            });
        }
        
        // Don't allow users to copy their own featured recipes
        if (recipe.owner_id === userId) {
            req.session.flashMessage = {
                type: 'error',
                message: 'You already own this recipe'
            };
            return res.redirect(`/featured/${recipeId}`);
        }
        
        const newRecipe = await copyRecipe(recipeId, userId);
        
        req.session.flashMessage = {
            type: 'success',
            message: 'Recipe copied to your collection!'
        };
        
        res.redirect(`/recipes/${newRecipe.recipe_id}`);
    } catch (error) {
        console.error('Error copying featured recipe:', error);
        
        req.session.flashMessage = {
            type: 'error',
            message: 'Failed to copy recipe'
        };
        
        res.redirect(`/featured/${req.params.recipeId}`);
    }
};

/**
 * Remove featured status from a recipe (contributor/admin only)
 */
const unfeatureRecipeHandler = async (req, res) => {
    try {
        const recipeId = req.params.recipeId;
        
        const result = await unfeatureRecipe(recipeId);
        
        if (!result) {
            return res.status(404).json({ 
                success: false, 
                error: 'Featured recipe not found' 
            });
        }
        
        req.session.flashMessage = {
            type: 'success',
            message: 'Recipe removed from featured list'
        };
        
        res.redirect('/featured');
    } catch (error) {
        console.error('Error unfeaturing recipe:', error);
        
        req.session.flashMessage = {
            type: 'error',
            message: 'Failed to remove featured status'
        };
        
        res.redirect('/featured');
    }
};

/**
 * Delete a featured recipe (owner, contributor, or admin)
 */
const deleteFeaturedRecipeHandler = async (req, res) => {
    try {
        const recipeId = req.params.recipeId;
        const userId = req.session.user.user_id;
        const userRole = req.session.user.role;
        
        const recipe = await getFeaturedRecipeById(recipeId);
        
        if (!recipe) {
            return res.status(404).json({ error: 'Recipe not found' });
        }
        
        // Check permissions: owner can delete OR contributor/admin can delete any
        const canDelete = recipe.owner_id === userId || ['contributor', 'admin'].includes(userRole);
        
        if (!canDelete) {
            return res.status(403).json({ error: 'Access denied' });
        }
        
        // Import deleteRecipe here to avoid circular dependency
        const { deleteRecipe } = await import('../../models/recipes/recipes.js');
        await deleteRecipe(recipeId);
        
        req.session.flashMessage = {
            type: 'success',
            message: 'Recipe deleted successfully'
        };
        
        res.redirect('/featured');
    } catch (error) {
        console.error('Error deleting featured recipe:', error);
        res.status(500).json({ error: 'Failed to delete recipe' });
    }
};

export {
    featuredRecipesPage,
    featuredRecipeDetailPage,
    copyFeaturedRecipeHandler,
    unfeatureRecipeHandler,
    deleteFeaturedRecipeHandler
};