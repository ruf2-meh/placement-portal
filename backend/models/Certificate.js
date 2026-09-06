const mongoose = require('mongoose');


const certificateSchema = new mongoose.Schema(
{

    student:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true
    },


    job:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Job',
        required:true
    },


    company:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true
    },


    certificateId:{
        type:String,
        unique:true,
        required:true
    },


    issueDate:{
        type:Date,
        default:Date.now
    }

},
{
    timestamps:true
});


module.exports = mongoose.model(
    'Certificate',
    certificateSchema
);