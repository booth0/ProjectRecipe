import express from 'express';
import session from 'express-session';
import path from 'path';
import { fileURLToPath } from 'url';

// Import database setup
import { setupDatabase, testConnection } from './src/models/setup.js';

// Import MVC components
import routes from './src/controllers/routes.js';
import { addImportantLocalVariables } from './src/middleware/global.js';

/**
 * Server configuration
 */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const NODE_ENV = process.env.NODE_ENV?.toLowerCase() || 'production';
const PORT = process.env.PORT || 3000;

/**
 * Setup Express Server
 */
const app = express();

/**
 * Configure Express
 */
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true })); // Parse form data
app.use(express.json()); // Parse JSON data
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src/views'));

/**
 * Session Configuration
 */
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: NODE_ENV === 'production', // Use secure cookies in production
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24 * 7 // 1 week
    }
}));

/**
 * Global Middleware
 */
app.use(addImportantLocalVariables);

/**
 * Routes
 */
app.use('/', routes);

/**
 * Initialize Database and Start Server
 */
const startServer = async () => {
    try {
        // Test database connection
        await testConnection();
        
        // Setup database tables and seed data
        await setupDatabase();
        
        // Start WebSocket Server in Development Mode for live reloading
        if (NODE_ENV.includes('dev')) {
            const ws = await import('ws');

            try {
                const wsPort = parseInt(PORT) + 1;
                const wsServer = new ws.WebSocketServer({ port: wsPort });

                wsServer.on('listening', () => {
                    console.log(`WebSocket server is running on port ${wsPort}`);
                });

                wsServer.on('error', (error) => {
                    console.error('WebSocket server error:', error);
                });
            } catch (error) {
                console.error('Failed to start WebSocket server:', error);
            }
        }
        
        // Start Express Server
        app.listen(PORT, () => {
            console.log(`Server is running on http://127.0.0.1:${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();