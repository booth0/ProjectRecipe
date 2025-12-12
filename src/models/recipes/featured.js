import db from '../db.js';

/**
 * Get all featured recipes
 */
const getAllFeaturedRecipes = async () => {
    try {
        const query = `
            SELECT 
                r.recipe_id,
                r.title,
                r.description,
                r.prep_time,
                r.cook_time,
                r.servings,
                r.difficulty,
                r.image_url,
                r.featured_at,
                u.first_name,
                u.last_name,
                u.email
            FROM recipes r
            JOIN users u ON r.owner_id = u.user_id
            WHERE r.is_featured = true
            ORDER BY r.featured_at DESC
        `;
        
        const result = await db.query(query);
        return result.rows;
    } catch (error) {
        console.error('Error getting featured recipes:', error.message);
        return [];
    }
};

/**
 * Search featured recipes by title
 */
const searchFeaturedRecipes = async (searchTerm) => {
    try {
        const query = `
            SELECT 
                r.recipe_id,
                r.title,
                r.description,
                r.prep_time,
                r.cook_time,
                r.servings,
                r.difficulty,
                r.image_url,
                r.featured_at,
                u.first_name,
                u.last_name
            FROM recipes r
            JOIN users u ON r.owner_id = u.user_id
            WHERE r.is_featured = true AND r.title ILIKE $1
            ORDER BY r.featured_at DESC
        `;
        
        const result = await db.query(query, [`%${searchTerm}%`]);
        return result.rows;
    } catch (error) {
        console.error('Error searching featured recipes:', error.message);
        return [];
    }
};

/**
 * Get featured recipe by ID (public view)
 */
const getFeaturedRecipeById = async (recipeId) => {
    try {
        // Get recipe
        const recipeQuery = `
            SELECT 
                r.recipe_id,
                r.title,
                r.description,
                r.instructions,
                r.prep_time,
                r.cook_time,
                r.servings,
                r.difficulty,
                r.image_url,
                r.owner_id,
                r.featured_at,
                r.created_at,
                u.first_name,
                u.last_name,
                u.email
            FROM recipes r
            JOIN users u ON r.owner_id = u.user_id
            WHERE r.recipe_id = $1 AND r.is_featured = true
        `;
        
        const recipeResult = await db.query(recipeQuery, [recipeId]);
        
        if (recipeResult.rows.length === 0) {
            return null;
        }
        
        const recipe = recipeResult.rows[0];
        
        // Get ingredients
        const ingredientsQuery = `
            SELECT ingredient_name, quantity, order_index
            FROM ingredients
            WHERE recipe_id = $1
            ORDER BY order_index
        `;
        
        const ingredientsResult = await db.query(ingredientsQuery, [recipeId]);
        recipe.ingredients = ingredientsResult.rows;
        
        // Get categories
        const categoriesQuery = `
            SELECT c.category_id, c.category_name
            FROM categories c
            JOIN recipe_categories rc ON c.category_id = rc.category_id
            WHERE rc.recipe_id = $1
        `;
        
        const categoriesResult = await db.query(categoriesQuery, [recipeId]);
        recipe.categories = categoriesResult.rows;
        
        return recipe;
    } catch (error) {
        console.error('Error getting featured recipe by ID:', error.message);
        return null;
    }
};

/**
 * Remove featured status from a recipe (contributor/admin only)
 */
const unfeatureRecipe = async (recipeId) => {
    try {
        const query = `
            UPDATE recipes
            SET is_featured = false,
                featured_at = NULL
            WHERE recipe_id = $1 AND is_featured = true
            RETURNING recipe_id, title
        `;
        
        const result = await db.query(query, [recipeId]);
        
        if (result.rows.length === 0) {
            return null;
        }
        
        return result.rows[0];
    } catch (error) {
        console.error('Error unfeaturing recipe:', error.message);
        throw error;
    }
};

/**
 * Get featured recipes by category
 */
const getFeaturedRecipesByCategory = async (categoryId) => {
    try {
        const query = `
            SELECT 
                r.recipe_id,
                r.title,
                r.description,
                r.prep_time,
                r.cook_time,
                r.servings,
                r.difficulty,
                r.image_url,
                r.featured_at,
                u.first_name,
                u.last_name
            FROM recipes r
            JOIN users u ON r.owner_id = u.user_id
            JOIN recipe_categories rc ON r.recipe_id = rc.recipe_id
            WHERE r.is_featured = true AND rc.category_id = $1
            ORDER BY r.featured_at DESC
        `;
        
        const result = await db.query(query, [categoryId]);
        return result.rows;
    } catch (error) {
        console.error('Error getting featured recipes by category:', error.message);
        return [];
    }
};

export {
    getAllFeaturedRecipes,
    searchFeaturedRecipes,
    getFeaturedRecipeById,
    unfeatureRecipe,
    getFeaturedRecipesByCategory
};