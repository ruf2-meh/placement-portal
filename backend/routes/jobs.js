const express = require('express');
const router = express.Router();

const Job = require('../models/Job');


// POST: Create a job posting (Feature 1)

router.post('/', async (req, res) => {

    const {
        company_id,
        title,
        description,
        requirements,
        location,
        deadline
    } = req.body;


    if (!title || !description || !deadline || !company_id) {

        return res.status(400).json({

            message: "Please fill out all required fields."

        });

    }


    try {


        const newJob = await Job.create({

            company: company_id,

            title,

            description,

            requirements,

            location,

            deadline

        });



        res.status(201).json({

            message: "Job posted successfully!",

            jobId: newJob._id

        });



    } catch (err) {


        console.error("JOB CREATE ERROR:", err);


        res.status(500).json({

            message: "Failed to post job.",

            error: err.message

        });


    }


});


module.exports = router;