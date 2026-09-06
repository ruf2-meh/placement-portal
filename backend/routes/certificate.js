const express = require('express');
const router = express.Router();

const Certificate = require('../models/Certificate');


// Create Certificate

router.post('/create', async(req,res)=>{

    try{

        const {
            student_id,
            job_id,
            company_id
        } = req.body;


        const certificate = await Certificate.create({

            student:student_id,

            job:job_id,

            company:company_id,

            certificateId:
            "CERT-" + Date.now()

        });


        res.status(201).json({

            message:"Certificate created successfully",

            certificate

        });


    }catch(err){

        console.error(err);

        res.status(500).json({

            message:"Failed to create certificate"

        });

    }

});




// Get Student Certificates

router.get('/student/:id', async(req,res)=>{


    try{


        const certificates = await Certificate.find({

            student:req.params.id

        })
        .populate('job','title')
        .populate('company','name');



        res.json(certificates);



    }catch(err){


        console.error(err);


        res.status(500).json({

            message:"Failed to fetch certificates"

        });

    }


});

console.log("Router before export:", typeof router);

module.exports = router;