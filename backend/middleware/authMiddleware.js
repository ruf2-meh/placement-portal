const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_placement_portal_key';

/**
 * Verifies the Bearer JWT and attaches a flat { id, role } payload to req.user.
 * Payload shape is intentionally flat — NOT nested under a 'user' key —
 * matching the shape signed in routes/auth.js (Checkpoint D fix).
 *
 * Correct usage downstream: req.user.id / req.user.role
 * NEVER use req.user.user.id — that was the old nested shape.
 */
const authMiddleware = (req, res, next) => {
    const authHeader = req.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'No token provided, authorization denied.' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        // decoded is { id, role, iat, exp } — flat, no 'user' wrapper
        req.user = { id: decoded.id, role: decoded.role };
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Token is not valid.' });
    }
};

module.exports = authMiddleware;
