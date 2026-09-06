// Centralized JWT secret.
//
// Previously, routes/auth.js hardcoded its own secret ("super_secret_placement_portal_key")
// while middleware/authMiddleware.js verified against a DIFFERENT default
// ('your_jwt_secret'). If JWT_SECRET was not set in the environment, every
// token issued at login would fail verification on the very next request.
//
// Both signing and verification must now import JWT_SECRET from this single
// module so they can never drift apart again.
//
// Set JWT_SECRET in backend/.env for real use. The fallback below exists only
// so the app doesn't crash if .env hasn't been created yet, and should not be
// relied on outside local development.
const JWT_SECRET = process.env.JWT_SECRET || 'dev_only_insecure_fallback_secret_change_me';

if (!process.env.JWT_SECRET) {
    console.warn('⚠️  JWT_SECRET is not set in the environment. Using an insecure development fallback. Set JWT_SECRET in backend/.env before deploying.');
}

module.exports = { JWT_SECRET };