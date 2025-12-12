// /src/models/setup.js (COMPLETE FILE - Branch 1)
import db from './db.js';

/**
 * SQL to create the users table if it doesn't exist
 */
const createUsersTableIfNotExists = `
    CREATE TABLE IF NOT EXISTS users (
        user_id SERIAL PRIMARY KEY,
        email VARCHAR(150) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'contributor', 'user')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
`;

/**
 * SQL to create the recipes table if it doesn't exist
 * MODIFIED: Added is_featured and featured_at columns
 */
const createRecipesTableIfNotExists = `
    CREATE TABLE IF NOT EXISTS recipes (
        recipe_id SERIAL PRIMARY KEY,
        title VARCHAR(200) NOT NULL,
        description TEXT,
        instructions TEXT NOT NULL,
        prep_time INTEGER,
        cook_time INTEGER,
        servings INTEGER,
        difficulty VARCHAR(20) CHECK (difficulty IN ('easy', 'medium', 'hard')),
        image_url VARCHAR(500),
        owner_id INTEGER NOT NULL,
        original_recipe_id INTEGER,
        is_featured BOOLEAN DEFAULT false,
        featured_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (owner_id) REFERENCES users(user_id) ON DELETE CASCADE,
        FOREIGN KEY (original_recipe_id) REFERENCES recipes(recipe_id) ON DELETE SET NULL
    )
`;

/**
 * SQL to create the recipe_shares table if it doesn't exist
 */
const createRecipeSharesTableIfNotExists = `
    CREATE TABLE IF NOT EXISTS recipe_shares (
        share_id SERIAL PRIMARY KEY,
        recipe_id INTEGER NOT NULL,
        shared_by INTEGER NOT NULL,
        shared_with INTEGER NOT NULL,
        shared_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (recipe_id) REFERENCES recipes(recipe_id) ON DELETE CASCADE,
        FOREIGN KEY (shared_by) REFERENCES users(user_id) ON DELETE CASCADE,
        FOREIGN KEY (shared_with) REFERENCES users(user_id) ON DELETE CASCADE,
        UNIQUE (recipe_id, shared_with)
    )
`;

/**
 * SQL to create the categories table if it doesn't exist
 */
const createCategoriesTableIfNotExists = `
    CREATE TABLE IF NOT EXISTS categories (
        category_id SERIAL PRIMARY KEY,
        category_name VARCHAR(100) UNIQUE NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
`;

/**
 * SQL to create the recipe_categories junction table if it doesn't exist
 */
const createRecipeCategoriesTableIfNotExists = `
    CREATE TABLE IF NOT EXISTS recipe_categories (
        recipe_id INTEGER NOT NULL,
        category_id INTEGER NOT NULL,
        PRIMARY KEY (recipe_id, category_id),
        FOREIGN KEY (recipe_id) REFERENCES recipes(recipe_id) ON DELETE CASCADE,
        FOREIGN KEY (category_id) REFERENCES categories(category_id) ON DELETE CASCADE
    )
`;

/**
 * SQL to create the ingredients table if it doesn't exist
 */
const createIngredientsTableIfNotExists = `
    CREATE TABLE IF NOT EXISTS ingredients (
        ingredient_id SERIAL PRIMARY KEY,
        recipe_id INTEGER NOT NULL,
        ingredient_name VARCHAR(200) NOT NULL,
        quantity VARCHAR(100) NOT NULL,
        order_index INTEGER,
        FOREIGN KEY (recipe_id) REFERENCES recipes(recipe_id) ON DELETE CASCADE
    )
`;

/**
 * SQL to create the recipe_submissions table if it doesn't exist
 * This tracks the multi-stage workflow for featuring recipes
 */
const createRecipeSubmissionsTableIfNotExists = `
    CREATE TABLE IF NOT EXISTS recipe_submissions (
        submission_id SERIAL PRIMARY KEY,
        recipe_id INTEGER NOT NULL,
        submitted_by INTEGER NOT NULL,
        status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'under_review', 'approved', 'rejected')),
        reviewed_by INTEGER,
        submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        reviewed_at TIMESTAMP,
        review_notes TEXT,
        FOREIGN KEY (recipe_id) REFERENCES recipes(recipe_id) ON DELETE CASCADE,
        FOREIGN KEY (submitted_by) REFERENCES users(user_id) ON DELETE CASCADE,
        FOREIGN KEY (reviewed_by) REFERENCES users(user_id) ON DELETE SET NULL
    )
`;

/**
 * Initial seed data for categories (admin-managed)
 */
const initialCategories = [
    { name: 'Breakfast', description: 'Morning meals and brunch recipes' },
    { name: 'Lunch', description: 'Midday meals and light dishes' },
    { name: 'Dinner', description: 'Evening meals and hearty dishes' },
    { name: 'Desserts', description: 'Sweet treats and baked goods' },
    { name: 'Appetizers', description: 'Starters and small bites' },
    { name: 'Soups & Stews', description: 'Warm and comforting soups' },
    { name: 'Salads', description: 'Fresh and healthy salads' },
    { name: 'Beverages', description: 'Drinks and smoothies' },
    { name: 'Snacks', description: 'Quick bites and finger foods' },
    { name: 'Main Dishes', description: 'Primary course recipes' }
];

/**
 * Insert initial categories into the database
 */
const insertInitialCategories = async (verbose = true) => {
    const query = `
        INSERT INTO categories (category_name, description)
        VALUES ($1, $2)
        ON CONFLICT (category_name) DO NOTHING
        RETURNING category_id, category_name;
    `;

    for (const category of initialCategories) {
        const result = await db.query(query, [category.name, category.description]);
        if (result.rows.length > 0 && verbose) {
            console.log(`Created category: ${result.rows[0].category_name}`);
        }
    }
};

/**
 * Check if all tables exist in the current schema
 */
const allTablesExist = async () => {
    const tables = [
        'users',
        'recipes',
        'recipe_shares',
        'categories',
        'recipe_categories',
        'ingredients',
        'recipe_submissions'
    ];

    const res = await db.query(
        `
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = ANY($1)
        `,
        [tables]
    );

    return res.rowCount === tables.length;
};

/**
 * Check if the database has been initialized already
 */
const isAlreadyInitialized = async (verbose = true) => {
    if (verbose) {
        console.log('Checking existing schema…');
    }

    const tablesOk = await allTablesExist();
    return tablesOk;
};

/**
 * Sets up the database by creating tables and inserting initial data.
 * This function should be called when the server starts.
 */
const setupDatabase = async () => {
    const verbose = process.env.ENABLE_SQL_LOGGING === 'true';

    try {
        // Skip if schema is already present
        if (await isAlreadyInitialized(verbose)) {
            if (verbose) console.log('DB already initialized — skipping setup.');
            return true;
        }

        if (verbose) console.log('Setting up database…');

        // Create tables in correct order (respecting foreign key dependencies)
        await db.query(createUsersTableIfNotExists);
        await db.query(createRecipesTableIfNotExists);
        await db.query(createRecipeSharesTableIfNotExists);
        await db.query(createCategoriesTableIfNotExists);
        await db.query(createRecipeCategoriesTableIfNotExists);
        await db.query(createIngredientsTableIfNotExists);
        await db.query(createRecipeSubmissionsTableIfNotExists);

        // Insert initial category data
        await insertInitialCategories(verbose);

        if (verbose) {
            console.log('Database setup complete');
        }
        return true;
    } catch (error) {
        console.error('Error setting up database:', error.message);
        throw error;
    }
};

/**
 * Tests the database connection by executing a simple query.
 */
const testConnection = async () => {
    try {
        const result = await db.query('SELECT NOW() as current_time');
        console.log('Database connection successful:', result.rows[0].current_time);
        return true;
    } catch (error) {
        console.error('Database connection failed:', error.message);
        throw error;
    }
};

export { setupDatabase, testConnection };