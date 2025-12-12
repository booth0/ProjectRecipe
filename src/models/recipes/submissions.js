// /src/models/recipes/submissions.js
import db from '../db.js';

/**
 * Submit a recipe for review to be featured
 */
const submitRecipeForReview = async (recipeId, userId) => {
    try {
        // Check if recipe is already submitted
        const checkQuery = `
            SELECT submission_id, status
            FROM recipe_submissions
            WHERE recipe_id = $1 AND status IN ('pending', 'under_review')
        `;
        
        const existingSubmission = await db.query(checkQuery, [recipeId]);
        
        if (existingSubmission.rows.length > 0) {
            throw new Error('Recipe is already submitted for review');
        }
        
        const query = `
            INSERT INTO recipe_submissions (recipe_id, submitted_by, status)
            VALUES ($1, $2, 'pending')
            RETURNING submission_id, recipe_id, submitted_by, status, submitted_at
        `;
        
        const result = await db.query(query, [recipeId, userId]);
        return result.rows[0];
    } catch (error) {
        console.error('Error submitting recipe:', error.message);
        throw error;
    }
};

/**
 * Get all pending submissions (for contributors)
 */
const getPendingSubmissions = async () => {
    try {
        const query = `
            SELECT 
                rs.submission_id,
                rs.recipe_id,
                rs.status,
                rs.submitted_at,
                r.title,
                r.description,
                r.difficulty,
                r.image_url,
                r.prep_time,
                r.cook_time,
                r.servings,
                u.first_name,
                u.last_name,
                u.email
            FROM recipe_submissions rs
            JOIN recipes r ON rs.recipe_id = r.recipe_id
            JOIN users u ON rs.submitted_by = u.user_id
            WHERE rs.status = 'pending'
            ORDER BY rs.submitted_at ASC
        `;
        
        const result = await db.query(query);
        return result.rows;
    } catch (error) {
        console.error('Error getting pending submissions:', error.message);
        return [];
    }
};

/**
 * Get submission by ID with full recipe details
 */
const getSubmissionById = async (submissionId) => {
    try {
        const query = `
            SELECT 
                rs.submission_id,
                rs.recipe_id,
                rs.status,
                rs.submitted_at,
                rs.reviewed_at,
                rs.review_notes,
                r.title,
                r.description,
                r.instructions,
                r.difficulty,
                r.image_url,
                r.prep_time,
                r.cook_time,
                r.servings,
                r.owner_id,
                u.first_name,
                u.last_name,
                u.email,
                reviewer.first_name as reviewer_first_name,
                reviewer.last_name as reviewer_last_name
            FROM recipe_submissions rs
            JOIN recipes r ON rs.recipe_id = r.recipe_id
            JOIN users u ON rs.submitted_by = u.user_id
            LEFT JOIN users reviewer ON rs.reviewed_by = reviewer.user_id
            WHERE rs.submission_id = $1
        `;
        
        const result = await db.query(query, [submissionId]);
        
        if (result.rows.length === 0) {
            return null;
        }
        
        const submission = result.rows[0];
        
        // Get ingredients
        const ingredientsQuery = `
            SELECT ingredient_name, quantity, order_index
            FROM ingredients
            WHERE recipe_id = $1
            ORDER BY order_index
        `;
        
        const ingredientsResult = await db.query(ingredientsQuery, [submission.recipe_id]);
        submission.ingredients = ingredientsResult.rows;
        
        return submission;
    } catch (error) {
        console.error('Error getting submission by ID:', error.message);
        return null;
    }
};

/**
 * Mark submission as under review
 */
const markSubmissionUnderReview = async (submissionId, reviewerId) => {
    try {
        const query = `
            UPDATE recipe_submissions
            SET status = 'under_review',
                reviewed_by = $1
            WHERE submission_id = $2 AND status = 'pending'
            RETURNING submission_id, status
        `;
        
        const result = await db.query(query, [reviewerId, submissionId]);
        
        if (result.rows.length === 0) {
            return null;
        }
        
        return result.rows[0];
    } catch (error) {
        console.error('Error marking submission under review:', error.message);
        throw error;
    }
};

/**
 * Approve a submission and mark recipe as featured
 */
const approveSubmission = async (submissionId, reviewerId, notes = null) => {
    const client = await db.connect();
    
    try {
        await client.query('BEGIN');
        
        // Update submission status
        const updateSubmissionQuery = `
            UPDATE recipe_submissions
            SET status = 'approved',
                reviewed_by = $1,
                reviewed_at = CURRENT_TIMESTAMP,
                review_notes = $2
            WHERE submission_id = $3
            RETURNING recipe_id, submitted_by
        `;
        
        const submissionResult = await client.query(updateSubmissionQuery, [
            reviewerId,
            notes,
            submissionId
        ]);
        
        if (submissionResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return null;
        }
        
        const { recipe_id } = submissionResult.rows[0];
        
        // Mark recipe as featured (we'll add a featured flag to recipes table)
        const updateRecipeQuery = `
            UPDATE recipes
            SET is_featured = true,
                featured_at = CURRENT_TIMESTAMP
            WHERE recipe_id = $1
        `;
        
        await client.query(updateRecipeQuery, [recipe_id]);
        
        await client.query('COMMIT');
        return submissionResult.rows[0];
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error approving submission:', error.message);
        throw error;
    } finally {
        client.release();
    }
};

/**
 * Reject a submission
 */
const rejectSubmission = async (submissionId, reviewerId, notes) => {
    try {
        const query = `
            UPDATE recipe_submissions
            SET status = 'rejected',
                reviewed_by = $1,
                reviewed_at = CURRENT_TIMESTAMP,
                review_notes = $2
            WHERE submission_id = $3
            RETURNING recipe_id, submitted_by
        `;
        
        const result = await db.query(query, [reviewerId, notes, submissionId]);
        
        if (result.rows.length === 0) {
            return null;
        }
        
        return result.rows[0];
    } catch (error) {
        console.error('Error rejecting submission:', error.message);
        throw error;
    }
};

/**
 * Check if a recipe is currently submitted
 */
const isRecipeSubmitted = async (recipeId) => {
    try {
        const query = `
            SELECT submission_id
            FROM recipe_submissions
            WHERE recipe_id = $1 AND status IN ('pending', 'under_review')
        `;
        
        const result = await db.query(query, [recipeId]);
        return result.rows.length > 0;
    } catch (error) {
        console.error('Error checking recipe submission status:', error.message);
        return false;
    }
};

/**
 * Check if a recipe is featured
 */
const isRecipeFeatured = async (recipeId) => {
    try {
        const query = `
            SELECT recipe_id
            FROM recipes
            WHERE recipe_id = $1 AND is_featured = true
        `;
        
        const result = await db.query(query, [recipeId]);
        return result.rows.length > 0;
    } catch (error) {
        console.error('Error checking if recipe is featured:', error.message);
        return false;
    }
};

/**
 * Get user's submission history
 */
const getUserSubmissions = async (userId) => {
    try {
        const query = `
            SELECT 
                rs.submission_id,
                rs.recipe_id,
                rs.status,
                rs.submitted_at,
                rs.reviewed_at,
                rs.review_notes,
                r.title,
                r.description,
                r.image_url,
                reviewer.first_name as reviewer_first_name,
                reviewer.last_name as reviewer_last_name
            FROM recipe_submissions rs
            JOIN recipes r ON rs.recipe_id = r.recipe_id
            LEFT JOIN users reviewer ON rs.reviewed_by = reviewer.user_id
            WHERE rs.submitted_by = $1
            ORDER BY rs.submitted_at DESC
        `;
        
        const result = await db.query(query, [userId]);
        return result.rows;
    } catch (error) {
        console.error('Error getting user submissions:', error.message);
        return [];
    }
};

export {
    submitRecipeForReview,
    getPendingSubmissions,
    getSubmissionById,
    markSubmissionUnderReview,
    approveSubmission,
    rejectSubmission,
    isRecipeSubmitted,
    isRecipeFeatured,
    getUserSubmissions
};