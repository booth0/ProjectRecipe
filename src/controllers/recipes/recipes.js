/**
 * Display user's recipes page (placeholder)
 */
const myRecipesPage = async (req, res) => {
    // TODO: Fetch user's recipes from database
    const userId = req.session.user.user_id;
    
    res.render('recipes/my-recipes', {
        title: 'My Recipes',
        recipes: [] // Placeholder - will fetch from database later
    });
};

export { myRecipesPage };