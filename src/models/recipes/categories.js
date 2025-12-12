import db from '../db.js';

/**
 * Get all categories
 */
const getAllCategories = async () => {
    try {
        const query = `
            SELECT category_id, category_name, description, created_at
            FROM categories
            ORDER BY category_name ASC
        `;
        
        const result = await db.query(query);
        return result.rows;
    } catch (error) {
        console.error('Error getting all categories:', error.message);
        return [];
    }
};

/**
 * Get category by ID
 */
const getCategoryById = async (categoryId) => {
    try {
        const query = `
            SELECT category_id, category_name, description, created_at
            FROM categories
            WHERE category_id = $1
        `;
        
        const result = await db.query(query, [categoryId]);
        
        if (result.rows.length === 0) {
            return null;
        }
        
        return result.rows[0];
    } catch (error) {
        console.error('Error getting category by ID:', error.message);
        return null;
    }
};

/**
 * Create a new category (admin only)
 */
const createCategory = async (categoryName, description = null) => {
    try {
        const query = `
            INSERT INTO categories (category_name, description)
            VALUES ($1, $2)
            RETURNING category_id, category_name, description, created_at
        `;
        
        const result = await db.query(query, [categoryName.trim(), description?.trim() || null]);
        return result.rows[0];
    } catch (error) {
        console.error('Error creating category:', error.message);
        
        // Check for unique constraint violation
        if (error.code === '23505') {
            throw new Error('A category with this name already exists');
        }
        
        throw error;
    }
};

/**
 * Update a category (admin only)
 */
const updateCategory = async (categoryId, categoryName, description = null) => {
    try {
        const query = `
            UPDATE categories
            SET category_name = $1,
                description = $2
            WHERE category_id = $3
            RETURNING category_id, category_name, description, created_at
        `;
        
        const result = await db.query(query, [
            categoryName.trim(),
            description?.trim() || null,
            categoryId
        ]);
        
        if (result.rows.length === 0) {
            return null;
        }
        
        return result.rows[0];
    } catch (error) {
        console.error('Error updating category:', error.message);
        
        if (error.code === '23505') {
            throw new Error('A category with this name already exists');
        }
        
        throw error;
    }
};

/**
 * Delete a category (admin only)
 */
const deleteCategory = async (categoryId) => {
    try {
        const query = `
            DELETE FROM categories
            WHERE category_id = $1
            RETURNING category_id, category_name
        `;
        
        const result = await db.query(query, [categoryId]);
        
        if (result.rows.length === 0) {
            return null;
        }
        
        return result.rows[0];
    } catch (error) {
        console.error('Error deleting category:', error.message);
        throw error;
    }
};

/**
 * Add category to recipe
 */
const addCategoryToRecipe = async (recipeId, categoryId) => {
    try {
        const query = `
            INSERT INTO recipe_categories (recipe_id, category_id)
            VALUES ($1, $2)
            ON CONFLICT (recipe_id, category_id) DO NOTHING
            RETURNING recipe_id, category_id
        `;
        
        const result = await db.query(query, [recipeId, categoryId]);
        return result.rows.length > 0;
    } catch (error) {
        console.error('Error adding category to recipe:', error.message);
        throw error;
    }
};

/**
 * Remove category from recipe
 */
const removeCategoryFromRecipe = async (recipeId, categoryId) => {
    try {
        const query = `
            DELETE FROM recipe_categories
            WHERE recipe_id = $1 AND category_id = $2
            RETURNING recipe_id, category_id
        `;
        
        const result = await db.query(query, [recipeId, categoryId]);
        return result.rows.length > 0;
    } catch (error) {
        console.error('Error removing category from recipe:', error.message);
        throw error;
    }
};

/**
 * Set recipe categories (replaces all existing categories)
 */
const setRecipeCategories = async (recipeId, categoryIds) => {
    const client = await db.connect();
    
    try {
        await client.query('BEGIN');
        
        // Remove all existing categories
        await client.query('DELETE FROM recipe_categories WHERE recipe_id = $1', [recipeId]);
        
        // Add new categories
        if (categoryIds && categoryIds.length > 0) {
            const insertQuery = `
                INSERT INTO recipe_categories (recipe_id, category_id)
                VALUES ($1, $2)
            `;
            
            for (const categoryId of categoryIds) {
                await client.query(insertQuery, [recipeId, categoryId]);
            }
        }
        
        await client.query('COMMIT');
        return true;
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error setting recipe categories:', error.message);
        throw error;
    } finally {
        client.release();
    }
};

/**
 * Get recipe categories
 */
const getRecipeCategories = async (recipeId) => {
    try {
        const query = `
            SELECT c.category_id, c.category_name, c.description
            FROM categories c
            JOIN recipe_categories rc ON c.category_id = rc.category_id
            WHERE rc.recipe_id = $1
            ORDER BY c.category_name ASC
        `;
        
        const result = await db.query(query, [recipeId]);
        return result.rows;
    } catch (error) {
        console.error('Error getting recipe categories:', error.message);
        return [];
    }
};

/**
 * Get category with recipe count
 */
const getCategoriesWithCount = async () => {
    try {
        const query = `
            SELECT 
                c.category_id,
                c.category_name,
                c.description,
                c.created_at,
                COUNT(rc.recipe_id) as recipe_count
            FROM categories c
            LEFT JOIN recipe_categories rc ON c.category_id = rc.category_id
            GROUP BY c.category_id, c.category_name, c.description, c.created_at
            ORDER BY c.category_name ASC
        `;
        
        const result = await db.query(query);
        return result.rows;
    } catch (error) {
        console.error('Error getting categories with count:', error.message);
        return [];
    }
};

export {
    getAllCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory,
    addCategoryToRecipe,
    removeCategoryFromRecipe,
    setRecipeCategories,
    getRecipeCategories,
    getCategoriesWithCount
};