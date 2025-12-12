import {
    createRecipe,
    getRecipesByOwner,
    getRecipeById,
    updateRecipe,
    deleteRecipe,
    userOwnsRecipe,
    copyRecipe,
    searchUserRecipes
} from '../../models/recipes/recipes.js';
import { isRecipeSubmitted, isRecipeFeatured } from '../../models/recipes/submissions.js';

/**
 * Display user's recipes page (placeholder)
 */
const myRecipesPage = async (req, res) => {
    try {
        const userId = req.session.user.user_id;
        const searchTerm = req.query.search || '';
        
        let recipes;
        if (searchTerm) {
            recipes = await searchUserRecipes(userId, searchTerm);
        } else {
            recipes = await getRecipesByOwner(userId);
        }
        
        // Get flash message if any
        const flashMessage = req.session.flashMessage;
        delete req.session.flashMessage;
        
        res.render('recipes/my-recipes', {
            title: 'My Recipes',
            recipes,
            searchTerm,
            flashMessage
        });
    } catch (error) {
        console.error('Error loading recipes:', error);
        res.status(500).render('errors/500', {
            title: 'Error',
            error: 'Failed to load recipes',
            stack: error.stack
        });
    }
};

/**
 * Display create recipe page
 */
const newRecipePage = (req, res) => {
    res.render('recipes/new', {
        title: 'Create New Recipe',
        error: null,
        formData: {}
    });
};

/**
 * Handle create recipe form submission
 */
const createRecipeHandler = async (req, res) => {
    try {
        const userId = req.session.user.user_id;
        const { title, description, instructions, prep_time, cook_time, servings, difficulty, image_url } = req.body;
        
        // Validate required fields
        if (!title || !instructions) {
            return res.render('recipes/new', {
                title: 'Create New Recipe',
                error: 'Title and instructions are required',
                formData: req.body
            });
        }
        
        // Parse ingredients from form
        const ingredients = [];
        const ingredientNames = req.body.ingredient_name;
        const ingredientQuantities = req.body.ingredient_quantity;
        
        if (ingredientNames && ingredientQuantities) {
            const names = Array.isArray(ingredientNames) ? ingredientNames : [ingredientNames];
            const quantities = Array.isArray(ingredientQuantities) ? ingredientQuantities : [ingredientQuantities];
            
            for (let i = 0; i < names.length; i++) {
                if (names[i] && quantities[i]) {
                    ingredients.push({
                        name: names[i].trim(),
                        quantity: quantities[i].trim()
                    });
                }
            }
        }
        
        // Create recipe
        const recipeData = {
            title: title.trim(),
            description: description?.trim() || null,
            instructions: instructions.trim(),
            prep_time: prep_time ? parseInt(prep_time) : null,
            cook_time: cook_time ? parseInt(cook_time) : null,
            servings: servings ? parseInt(servings) : null,
            difficulty: difficulty || null,
            image_url: image_url?.trim() || null,
            owner_id: userId
        };
        
        const recipe = await createRecipe(recipeData, ingredients);
        
        res.redirect(`/recipes/${recipe.recipe_id}`);
    } catch (error) {
        console.error('Error creating recipe:', error);
        res.render('recipes/new', {
            title: 'Create New Recipe',
            error: 'Failed to create recipe. Please try again.',
            formData: req.body
        });
    }
};

/**
 * Display recipe detail page
 */
const recipeDetailPage = async (req, res) => {
    try {
        const recipeId = req.params.recipeId;
        const userId = req.session.user.user_id;
        
        const recipe = await getRecipeById(recipeId);
        
        if (!recipe) {
            return res.status(404).render('errors/404', {
                title: 'Recipe Not Found'
            });
        }
        
        // Check if user has access (owner or shared with them)
        const isOwner = recipe.owner_id === userId;
        // TODO: Check if recipe is shared with user
        
        if (!isOwner) {
            return res.status(403).render('errors/500', {
                title: 'Access Denied',
                error: 'You do not have permission to view this recipe',
                stack: ''
            });
        }
        
        // Check submission and featured status
        const isSubmitted = await isRecipeSubmitted(recipeId);
        const isFeatured = await isRecipeFeatured(recipeId);
        
        // Get flash message if any
        const flashMessage = req.session.flashMessage;
        delete req.session.flashMessage;
        
        res.render('recipes/detail', {
            title: recipe.title,
            recipe,
            isOwner,
            isSubmitted,
            isFeatured,
            flashMessage
        });
    } catch (error) {
        console.error('Error loading recipe:', error);
        res.status(500).render('errors/500', {
            title: 'Error',
            error: 'Failed to load recipe',
            stack: error.stack
        });
    }
};

/**
 * Display edit recipe page
 */
const editRecipePage = async (req, res) => {
    try {
        const recipeId = req.params.recipeId;
        const userId = req.session.user.user_id;
        
        const recipe = await getRecipeById(recipeId);
        
        if (!recipe) {
            return res.status(404).render('errors/404', {
                title: 'Recipe Not Found'
            });
        }
        
        // Check ownership
        if (recipe.owner_id !== userId) {
            return res.status(403).render('errors/500', {
                title: 'Access Denied',
                error: 'You can only edit your own recipes',
                stack: ''
            });
        }
        
        // Check if recipe is featured - featured recipes can't be edited
        const isFeatured = await isRecipeFeatured(recipeId);
        if (isFeatured) {
            return res.status(403).render('errors/500', {
                title: 'Cannot Edit Featured Recipe',
                error: 'Featured recipes cannot be edited. Please delete and resubmit if you need to make changes.',
                stack: ''
            });
        }
        
        res.render('recipes/edit', {
            title: `Edit ${recipe.title}`,
            recipe,
            error: null
        });
    } catch (error) {
        console.error('Error loading recipe for edit:', error);
        res.status(500).render('errors/500', {
            title: 'Error',
            error: 'Failed to load recipe',
            stack: error.stack
        });
    }
};

/**
 * Handle edit recipe form submission
 */
const updateRecipeHandler = async (req, res) => {
    try {
        const recipeId = req.params.recipeId;
        const userId = req.session.user.user_id;
        const { title, description, instructions, prep_time, cook_time, servings, difficulty, image_url } = req.body;
        
        // Check ownership
        const isOwner = await userOwnsRecipe(userId, recipeId);
        if (!isOwner) {
            return res.status(403).render('errors/500', {
                title: 'Access Denied',
                error: 'You can only edit your own recipes',
                stack: ''
            });
        }
        
        // Check if recipe is featured
        const isFeatured = await isRecipeFeatured(recipeId);
        if (isFeatured) {
            return res.status(403).render('errors/500', {
                title: 'Cannot Edit Featured Recipe',
                error: 'Featured recipes cannot be edited',
                stack: ''
            });
        }
        
        // Validate required fields
        if (!title || !instructions) {
            const recipe = await getRecipeById(recipeId);
            return res.render('recipes/edit', {
                title: `Edit ${recipe.title}`,
                recipe,
                error: 'Title and instructions are required'
            });
        }
        
        // Parse ingredients
        const ingredients = [];
        const ingredientNames = req.body.ingredient_name;
        const ingredientQuantities = req.body.ingredient_quantity;
        
        if (ingredientNames && ingredientQuantities) {
            const names = Array.isArray(ingredientNames) ? ingredientNames : [ingredientNames];
            const quantities = Array.isArray(ingredientQuantities) ? ingredientQuantities : [ingredientQuantities];
            
            for (let i = 0; i < names.length; i++) {
                if (names[i] && quantities[i]) {
                    ingredients.push({
                        name: names[i].trim(),
                        quantity: quantities[i].trim()
                    });
                }
            }
        }
        
        // Update recipe
        const recipeData = {
            title: title.trim(),
            description: description?.trim() || null,
            instructions: instructions.trim(),
            prep_time: prep_time ? parseInt(prep_time) : null,
            cook_time: cook_time ? parseInt(cook_time) : null,
            servings: servings ? parseInt(servings) : null,
            difficulty: difficulty || null,
            image_url: image_url?.trim() || null
        };
        
        await updateRecipe(recipeId, recipeData, ingredients);
        
        res.redirect(`/recipes/${recipeId}`);
    } catch (error) {
        console.error('Error updating recipe:', error);
        const recipe = await getRecipeById(req.params.recipeId);
        res.render('recipes/edit', {
            title: `Edit ${recipe.title}`,
            recipe,
            error: 'Failed to update recipe. Please try again.'
        });
    }
};

/**
 * Handle delete recipe
 */
const deleteRecipeHandler = async (req, res) => {
    try {
        const recipeId = req.params.recipeId;
        const userId = req.session.user.user_id;
        
        // Check ownership
        const isOwner = await userOwnsRecipe(userId, recipeId);
        if (!isOwner) {
            return res.status(403).json({ error: 'Access denied' });
        }
        
        await deleteRecipe(recipeId);
        
        res.redirect('/recipes');
    } catch (error) {
        console.error('Error deleting recipe:', error);
        res.status(500).json({ error: 'Failed to delete recipe' });
    }
};

/**
 * Handle copy recipe
 */
const copyRecipeHandler = async (req, res) => {
    try {
        const recipeId = req.params.recipeId;
        const userId = req.session.user.user_id;
        
        // TODO: Check if recipe is shared with user or featured
        
        const newRecipe = await copyRecipe(recipeId, userId);
        
        if (!newRecipe) {
            return res.status(404).json({ error: 'Recipe not found' });
        }
        
        res.redirect(`/recipes/${newRecipe.recipe_id}`);
    } catch (error) {
        console.error('Error copying recipe:', error);
        res.status(500).json({ error: 'Failed to copy recipe' });
    }
};

export {
    myRecipesPage,
    newRecipePage,
    createRecipeHandler,
    recipeDetailPage,
    editRecipePage,
    updateRecipeHandler,
    deleteRecipeHandler,
    copyRecipeHandler
};