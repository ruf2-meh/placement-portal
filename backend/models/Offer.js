const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema({
    // TEMP: Mixed instead of `{ type: ObjectId, ref: 'Application' }` because
    // Application still lives in SQLite with integer IDs on this branch.
    // Once Application migrates to Mongoose, change this (and the three
    // fields below) to `{ type: mongoose.Schema.Types.ObjectId, ref: 'Application' }`
    // etc. — matching main's Interview.js exactly. No other changes needed.
    application: { type: mongoose.Schema.Types.Mixed, required: true },
    job:         { type: mongoose.Schema.Types.Mixed, required: true },
    student:     { type: mongoose.Schema.Types.Mixed, required: true },
    company:     { type: mongoose.Schema.Types.Mixed, required: true },

    position:    { type: String },
    salary:      { type: String },
    startDate:   { type: Date },
    letterBody:  { type: String },

    status: {
        type: String,
        enum: ['sent', 'accepted', 'rejected', 'withdrawn'],
        default: 'sent'
    }
}, { timestamps: true });

module.exports = mongoose.model('Offer', offerSchema);
