import {
    getCategoriesWithCount,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory
} from '../../models/recipes/categories.js';

/**
 * Display category management page
 */
const manageCategoriesPage = async (req, res) => {
    try {
        const categories = await getCategoriesWithCount();
        
        // Get flash message if any
        const flashMessage = req.session.flashMessage;
        delete req.session.flashMessage;
        
        res.render('admin/categories', {
            title: 'Manage Categories',
            categories,
            flashMessage
        });
    } catch (error) {
        console.error('Error loading categories:', error);
        res.status(500).render('errors/500', {
            title: 'Error',
            error: 'Failed to load categories',
            stack: error.stack
        });
    }
};

/**
 * Handle create category
 */
const createCategoryHandler = async (req, res) => {
    try {
        const { category_name, description } = req.body;
        
        if (!category_name || category_name.trim().length === 0) {
            req.session.flashMessage = {
                type: 'error',
                message: 'Category name is required'
            };
            return res.redirect('/admin/categories');
        }
        
        const category = await createCategory(category_name, description);
        
        req.session.flashMessage = {
            type: 'success',
            message: `Category "${category.category_name}" created successfully`
        };
        
        res.redirect('/admin/categories');
    } catch (error) {
        console.error('Error creating category:', error);
        
        req.session.flashMessage = {
            type: 'error',
            message: error.message || 'Failed to create category'
        };
        
        res.redirect('/admin/categories');
    }
};

/**
 * Handle update category
 */
const updateCategoryHandler = async (req, res) => {
    try {
        const categoryId = parseInt(req.params.categoryId);
        const { category_name, description } = req.body;
        
        if (!category_name || category_name.trim().length === 0) {
            req.session.flashMessage = {
                type: 'error',
                message: 'Category name is required'
            };
            return res.redirect('/admin/categories');
        }
        
        const category = await updateCategory(categoryId, category_name, description);
        
        if (!category) {
            req.session.flashMessage = {
                type: 'error',
                message: 'Category not found'
            };
            return res.redirect('/admin/categories');
        }
        
        req.session.flashMessage = {
            type: 'success',
            message: `Category "${category.category_name}" updated successfully`
        };
        
        res.redirect('/admin/categories');
    } catch (error) {
        console.error('Error updating category:', error);
        
        req.session.flashMessage = {
            type: 'error',
            message: error.message || 'Failed to update category'
        };
        
        res.redirect('/admin/categories');
    }
};

/**
 * Handle delete category
 */
const deleteCategoryHandler = async (req, res) => {
    try {
        const categoryId = parseInt(req.params.categoryId);
        
        const category = await deleteCategory(categoryId);
        
        if (!category) {
            req.session.flashMessage = {
                type: 'error',
                message: 'Category not found'
            };
            return res.redirect('/admin/categories');
        }
        
        req.session.flashMessage = {
            type: 'success',
            message: `Category "${category.category_name}" deleted successfully`
        };
        
        res.redirect('/admin/categories');
    } catch (error) {
        console.error('Error deleting category:', error);
        
        req.session.flashMessage = {
            type: 'error',
            message: 'Failed to delete category'
        };
        
        res.redirect('/admin/categories');
    }
};

export {
    manageCategoriesPage,
    createCategoryHandler,
    updateCategoryHandler,
    deleteCategoryHandler
};