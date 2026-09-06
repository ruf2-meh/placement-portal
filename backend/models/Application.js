const mongoose = require('mongoose');


const applicationSchema = new mongoose.Schema(
{
    job:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Job',
        required:true
    },

    student:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true
    },

    review_status:{
        type:String,
        default:'Pending'
    },

    recommendation_note:{
        type:String,
        default:''
    },

    reviewed_by:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        default:null
    },

    reviewed_at:{
        type:Date,
        default:null
    }

},
{
    timestamps:true
});


module.exports = mongoose.model('Application', applicationSchema);