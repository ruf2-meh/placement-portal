const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        email: { type: String, required: true, unique: true, lowercase: true, trim: true },
        password: { type: String, required: true },
        role: {
            type: String,
            required: true,
            enum: ['Student', 'Company', 'Admin', 'Teacher'],
            default: 'Student'
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model('User', UserSchema);