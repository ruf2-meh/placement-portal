const mongoose = require('mongoose');


const projectSchema = new mongoose.Schema(
{

    student:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true
    },


    title:{
        type:String,
        required:true
    },


    description:{
        type:String
    },


    link:{
        type:String
    }

},
{
    timestamps:true
});


module.exports = mongoose.model('Project', projectSchema);