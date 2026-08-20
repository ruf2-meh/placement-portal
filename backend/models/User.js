const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { 
        type: String 
    },
    email: { 
        type: String, 
        required: true, 
        unique: true 
    },
    password: { 
        type: String, 
        required: true 
    },
    role: { 
        type: String, 
        enum: ['student', 'admin', 'company'], 
        default: 'student' 
    },
    skills: {
        type: [String],
        default: []
    },
    keySkills: {
        type: [String],
        default: []
    }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);