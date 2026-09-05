const mongoose = require('mongoose');

const JobSchema = new mongoose.Schema(
    {
        company_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        title: { type: String, required: true, trim: true },
        description: { type: String, required: true },
        requirements: { type: String, default: '' },
        location: { type: String, default: '' },
        deadline: { type: Date, required: true }
    },
    { timestamps: true }
);

module.exports = mongoose.model('Job', JobSchema);