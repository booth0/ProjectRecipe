// /src/controllers/recipes/submissions.js
import {
    submitRecipeForReview,
    getPendingSubmissions,
    getSubmissionById,
    markSubmissionUnderReview,
    approveSubmission,
    rejectSubmission
} from '../../models/recipes/submissions.js';
import { userOwnsRecipe } from '../../models/recipes/recipes.js';

/**
 * Handle recipe submission for review
 */
const submitRecipeHandler = async (req, res) => {
    try {
        const recipeId = req.params.recipeId;
        const userId = req.session.user.user_id;
        
        // Verify ownership
        const isOwner = await userOwnsRecipe(userId, recipeId);
        if (!isOwner) {
            return res.status(403).json({ 
                success: false, 
                error: 'You can only submit your own recipes' 
            });
        }
        
        const submission = await submitRecipeForReview(recipeId, userId);
        
        req.session.flashMessage = {
            type: 'success',
            message: 'Recipe submitted for review! You will be notified once it has been reviewed.'
        };
        
        res.redirect(`/recipes/${recipeId}`);
    } catch (error) {
        console.error('Error submitting recipe:', error);
        
        req.session.flashMessage = {
            type: 'error',
            message: error.message || 'Failed to submit recipe for review'
        };
        
        res.redirect(`/recipes/${req.params.recipeId}`);
    }
};

/**
 * Display submissions page for contributors
 */
const submissionsPage = async (req, res) => {
    try {
        const submissions = await getPendingSubmissions();
        
        res.render('contributor/submissions', {
            title: 'Review Submissions',
            submissions
        });
    } catch (error) {
        console.error('Error loading submissions:', error);
        res.status(500).render('errors/500', {
            title: 'Error',
            error: 'Failed to load submissions',
            stack: error.stack
        });
    }
};

/**
 * Display submission review page
 */
const reviewSubmissionPage = async (req, res) => {
    try {
        const submissionId = req.params.submissionId;
        const userId = req.session.user.user_id;
        
        const submission = await getSubmissionById(submissionId);
        
        if (!submission) {
            return res.status(404).render('errors/404', {
                title: 'Submission Not Found'
            });
        }
        
        // Mark as under review if still pending
        if (submission.status === 'pending') {
            await markSubmissionUnderReview(submissionId, userId);
            submission.status = 'under_review';
        }
        
        res.render('contributor/review-submission', {
            title: `Review: ${submission.title}`,
            submission
        });
    } catch (error) {
        console.error('Error loading submission for review:', error);
        res.status(500).render('errors/500', {
            title: 'Error',
            error: 'Failed to load submission',
            stack: error.stack
        });
    }
};

/**
 * Handle submission approval
 */
const approveSubmissionHandler = async (req, res) => {
    try {
        const submissionId = req.params.submissionId;
        const userId = req.session.user.user_id;
        const { notes } = req.body;
        
        const result = await approveSubmission(submissionId, userId, notes);
        
        if (!result) {
            return res.status(404).json({ 
                success: false, 
                error: 'Submission not found' 
            });
        }
        
        req.session.flashMessage = {
            type: 'success',
            message: 'Recipe approved and added to Featured Recipes!'
        };
        
        res.redirect('/contributor/submissions');
    } catch (error) {
        console.error('Error approving submission:', error);
        
        req.session.flashMessage = {
            type: 'error',
            message: 'Failed to approve submission'
        };
        
        res.redirect('/contributor/submissions');
    }
};

/**
 * Handle submission rejection
 */
const rejectSubmissionHandler = async (req, res) => {
    try {
        const submissionId = req.params.submissionId;
        const userId = req.session.user.user_id;
        const { notes } = req.body;
        
        if (!notes || notes.trim().length === 0) {
            return res.status(400).json({ 
                success: false, 
                error: 'Please provide a reason for rejection' 
            });
        }
        
        const result = await rejectSubmission(submissionId, userId, notes);
        
        if (!result) {
            return res.status(404).json({ 
                success: false, 
                error: 'Submission not found' 
            });
        }
        
        req.session.flashMessage = {
            type: 'success',
            message: 'Recipe rejected. The owner has been notified.'
        };
        
        res.redirect('/contributor/submissions');
    } catch (error) {
        console.error('Error rejecting submission:', error);
        
        req.session.flashMessage = {
            type: 'error',
            message: 'Failed to reject submission'
        };
        
        res.redirect('/contributor/submissions');
    }
};

export {
    submitRecipeHandler,
    submissionsPage,
    reviewSubmissionPage,
    approveSubmissionHandler,
    rejectSubmissionHandler
};