import db from '../db.js';

/**
 * Create a new recipe with ingredients
 */
const createRecipe = async (recipeData, ingredients) => {
    const client = await db.connect();

    try {
        await client.query('BEGIN');

        const recipeQuery = `
            INSERT INTO recipes (
                title, description, instructions, prep_time, cook_time,
                servings, difficulty, image_url, owner_id
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING recipe_id, title, description, instructions, prep_time, 
                      cook_time, servings, difficulty, image_url, owner_id, 
                      created_at, updated_at
        `;

        const recipeValues = [
            recipeData.title,
            recipeData.description || null,
            recipeData.instructions,
            recipeData.prep_time || null,
            recipeData.cook_time || null,
            recipeData.servings || null,
            recipeData.difficulty || null,
            recipeData.image_url || null,
            recipeData.owner_id
        ];

        const recipeResult = await client.query(recipeQuery, recipeValues);
        const recipe = recipeResult.rows[0];

        if (ingredients && ingredients.length > 0) {
            const ingredientQuery = `
                INSERT INTO ingredients (recipe_id, ingredient_name, quantity, order_index)
                VALUES ($1, $2, $3, $4)
            `;

            for (let i = 0; i<ingredients.length; i++) {
                await client.query(ingredientQuery, [
                    recipe.recipe_id,
                    ingredients[i].name,
                    ingredients[i].quantity,
                    i + 1
                ]);
            }
        }

        await client.query('COMMIT');
        return recipe;
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error creating recipe:', error.message);
        throw error;
    } finally {
        client.release();
    }
};

/**
 * Get all recipes owned by a specific user
 */
const getRecipesByOwner = async (userId) => {
    try {
        const query = `
            SELECT r.recipe_id, r.title, r.description, r.prep_time, r.cook_time, 
                   r.servings, r.difficulty, r.image_url, r.created_at, r.updated_at,
                   r.original_recipe_id
            FROM recipes r
            WHERE r.owner_id = $1
            ORDER BY r.created_at DESC
        `;
        
        const result = await db.query(query, [userId]);
        return result.rows;
    } catch (error) {
        console.error('Error getting recipes by owner:', error.message);
        return [];
    }
};

/**
 * Get a recipe by ID with all its details (ingredients, categories)
 */
const getRecipeById = async (recipeId) => {
    try {
        // Get recipe
        const recipeQuery = `
            SELECT r.recipe_id, r.title, r.description, r.instructions, 
                   r.prep_time, r.cook_time, r.servings, r.difficulty, r.image_url,
                   r.owner_id, r.original_recipe_id, r.created_at, r.updated_at,
                   u.first_name, u.last_name, u.email
            FROM recipes r
            JOIN users u ON r.owner_id = u.user_id
            WHERE r.recipe_id = $1
        `;
        
        const recipeResult = await db.query(recipeQuery, [recipeId]);
        
        if (recipeResult.rows.length === 0) {
            return null;
        }
        
        const recipe = recipeResult.rows[0];
        
        // Get ingredients
        const ingredientsQuery = `
            SELECT ingredient_id, ingredient_name, quantity, order_index
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
        console.error('Error getting recipe by ID:', error.message);
        return null;
    }
};

/**
 * Update a recipe
 */
const updateRecipe = async (recipeId, recipeData, ingredients) => {
    const client = await db.connect();
    
    try {
        await client.query('BEGIN');
        
        // Update recipe
        const recipeQuery = `
            UPDATE recipes
            SET title = $1, description = $2, instructions = $3, prep_time = $4,
                cook_time = $5, servings = $6, difficulty = $7, image_url = $8,
                updated_at = CURRENT_TIMESTAMP
            WHERE recipe_id = $9
            RETURNING recipe_id, title, description, instructions, prep_time,
                      cook_time, servings, difficulty, image_url, owner_id,
                      created_at, updated_at
        `;
        
        const recipeValues = [
            recipeData.title,
            recipeData.description || null,
            recipeData.instructions,
            recipeData.prep_time || null,
            recipeData.cook_time || null,
            recipeData.servings || null,
            recipeData.difficulty || null,
            recipeData.image_url || null,
            recipeId
        ];
        
        const recipeResult = await client.query(recipeQuery, recipeValues);
        
        if (recipeResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return null;
        }
        
        const recipe = recipeResult.rows[0];
        
        // Delete old ingredients
        await client.query('DELETE FROM ingredients WHERE recipe_id = $1', [recipeId]);
        
        // Insert new ingredients
        if (ingredients && ingredients.length > 0) {
            const ingredientQuery = `
                INSERT INTO ingredients (recipe_id, ingredient_name, quantity, order_index)
                VALUES ($1, $2, $3, $4)
            `;
            
            for (let i = 0; i < ingredients.length; i++) {
                await client.query(ingredientQuery, [
                    recipeId,
                    ingredients[i].name,
                    ingredients[i].quantity,
                    i + 1
                ]);
            }
        }
        
        await client.query('COMMIT');
        return recipe;
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error updating recipe:', error.message);
        throw error;
    } finally {
        client.release();
    }
};

/**
 * Delete a recipe
 */
const deleteRecipe = async (recipeId) => {
    try {
        const query = `
            DELETE FROM recipes
            WHERE recipe_id = $1
            RETURNING recipe_id, title
        `;
        
        const result = await db.query(query, [recipeId]);
        
        if (result.rows.length === 0) {
            return null;
        }
        
        return result.rows[0];
    } catch (error) {
        console.error('Error deleting recipe:', error.message);
        throw error;
    }
};

/**
 * Check if user owns a recipe
 */
const userOwnsRecipe = async (userId, recipeId) => {
    try {
        const query = `
            SELECT recipe_id
            FROM recipes
            WHERE recipe_id = $1 AND owner_id = $2
        `;
        
        const result = await db.query(query, [recipeId, userId]);
        return result.rows.length > 0;
    } catch (error) {
        console.error('Error checking recipe ownership:', error.message);
        return false;
    }
};

/**
 * Copy a recipe (when copying from shared recipes)
 */
const copyRecipe = async (originalRecipeId, newOwnerId) => {
    const client = await db.connect();
    
    try {
        await client.query('BEGIN');
        
        // Get original recipe
        const originalRecipe = await getRecipeById(originalRecipeId);
        
        if (!originalRecipe) {
            await client.query('ROLLBACK');
            return null;
        }
        
        // Create new recipe
        const recipeQuery = `
            INSERT INTO recipes (
                title, description, instructions, prep_time, cook_time,
                servings, difficulty, image_url, owner_id, original_recipe_id
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING recipe_id, title, description, instructions, prep_time,
                      cook_time, servings, difficulty, image_url, owner_id,
                      original_recipe_id, created_at, updated_at
        `;
        
        const recipeValues = [
            originalRecipe.title + ' (Copy)',
            originalRecipe.description,
            originalRecipe.instructions,
            originalRecipe.prep_time,
            originalRecipe.cook_time,
            originalRecipe.servings,
            originalRecipe.difficulty,
            originalRecipe.image_url,
            newOwnerId,
            originalRecipeId
        ];
        
        const recipeResult = await client.query(recipeQuery, recipeValues);
        const newRecipe = recipeResult.rows[0];
        
        // Copy ingredients
        if (originalRecipe.ingredients && originalRecipe.ingredients.length > 0) {
            const ingredientQuery = `
                INSERT INTO ingredients (recipe_id, ingredient_name, quantity, order_index)
                VALUES ($1, $2, $3, $4)
            `;
            
            for (const ingredient of originalRecipe.ingredients) {
                await client.query(ingredientQuery, [
                    newRecipe.recipe_id,
                    ingredient.ingredient_name,
                    ingredient.quantity,
                    ingredient.order_index
                ]);
            }
        }
        
        await client.query('COMMIT');
        return newRecipe;
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error copying recipe:', error.message);
        throw error;
    } finally {
        client.release();
    }
};

/**
 * Search recipes by title (for a specific user)
 */
const searchUserRecipes = async (userId, searchTerm) => {
    try {
        const query = `
            SELECT r.recipe_id, r.title, r.description, r.prep_time, r.cook_time,
                   r.servings, r.difficulty, r.image_url, r.created_at
            FROM recipes r
            WHERE r.owner_id = $1 AND r.title ILIKE $2
            ORDER BY r.created_at DESC
        `;
        
        const result = await db.query(query, [userId, `%${searchTerm}%`]);
        return result.rows;
    } catch (error) {
        console.error('Error searching recipes:', error.message);
        return [];
    }
};

export {
    createRecipe,
    getRecipesByOwner,
    getRecipeById,
    updateRecipe,
    deleteRecipe,
    userOwnsRecipe,
    copyRecipe,
    searchUserRecipes
};