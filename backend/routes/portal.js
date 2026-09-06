const express = require('express');
const router = express.Router();

const Job = require('../models/Job');
const Project = require('../models/Project');
const Application = require('../models/Application');
const Notification = require('../models/Notification');
const User = require('../models/User');


// ============================================================
// FEATURE 9: Student Project Showcase Profile
// ============================================================


// POST: Add student project
router.post('/projects', async (req, res) => {

    try {

        const {
            student_id,
            title,
            description,
            link
        } = req.body;


        if (!student_id || !title) {
            return res.status(400).json({
                message: "Student ID and project title are required."
            });
        }


        const project = await Project.create({

            student: student_id,
            title,
            description,
            link

        });


        res.status(201).json({

            message:"Project added successfully!",
            project

        });


    } catch(err){

        console.error(err);

        res.status(500).json({

            message:"Error adding project."

        });

    }

});




// GET: Student projects

router.get('/projects/:student_id', async(req,res)=>{


    try{


        const projects = await Project.find({

            student:req.params.student_id

        })
        .sort({
            createdAt:-1
        });



        res.status(200).json(projects);



    }catch(err){


        console.error(err);


        res.status(500).json({

            message:"Error fetching projects."

        });


    }


});




// ============================================================
// FEATURE 4 & 6: Job Search + Filter
// ============================================================



router.get('/jobs/search', async(req,res)=>{


    try{


        const keyword = req.query.keyword;


        let query={};



        if(keyword && keyword.trim()){


            query={

                $or:[

                    {
                        title:{
                            $regex:keyword,
                            $options:"i"
                        }
                    },

                    {
                        location:{
                            $regex:keyword,
                            $options:"i"
                        }
                    }

                ]

            };


        }



        const jobs = await Job.find(query)
            .sort({
                createdAt:-1
            });



        res.status(200).json(jobs);



    }catch(err){


        console.error(err);


        res.status(500).json({

            message:"Error searching jobs."

        });



    }


});




// ============================================================
// FEATURE 10 + FEATURE 23
// Apply Job + Notification
// ============================================================



router.post('/jobs/apply', async(req,res)=>{


    try{


        const {
            job_id,
            student_id
        } = req.body;



        if(!job_id || !student_id){

            return res.status(400).json({

                message:"Job ID and student ID are required."

            });

        }



        const job = await Job.findById(job_id);



        if(!job){

            return res.status(404).json({

                message:"Job not found."

            });

        }




        // deadline check

        const today = new Date();

        const deadline = new Date(job.deadline);



        if(deadline < today){


            return res.status(400).json({

                message:"Application deadline has passed."

            });


        }




        // prevent duplicate application


        const existingApplication = await Application.findOne({

            job:job_id,

            student:student_id

        });



        if(existingApplication){


            return res.status(400).json({

                message:"You have already applied."

            });


        }




        const application = await Application.create({

            job:job_id,

            student:student_id

        });





        await Notification.create({

            user:student_id,

            message:`Your application for "${job.title}" was submitted and is waiting for faculty review.`

        });





        res.status(201).json({

            message:"Application submitted successfully!",

            application

        });




    }catch(err){


        console.error(err);


        res.status(500).json({

            message:"Error processing application."

        });



    }


});




// ============================================================
// FEATURE 11: Faculty Application Review List
// ============================================================


router.get('/faculty/applications', async(req,res)=>{


    try{


        const applications = await Application.find()

            .populate('student','name email')

            .populate({

                path:'job',

                populate:{

                    path:'company',

                    select:'name email'

                }

            })

            .sort({

                createdAt:-1

            });




        res.status(200).json(applications);




    }catch(err){


        console.error(
            "Error fetching faculty applications:",
            err
        );


        res.status(500).json({

            message:"Error fetching faculty applications."

        });



    }


});
// ============================================================
// FEATURE 12: Faculty Recommendation Notes + Review
// ============================================================


router.patch('/faculty/applications/:application_id/review', async(req,res)=>{


    try{


        const {

            faculty_id,

            review_status,

            recommendation_note


        } = req.body;




        if(!faculty_id || !review_status){


            return res.status(400).json({

                message:"Faculty ID and review status are required."

            });


        }




        if(!['Approved','Rejected'].includes(review_status)){


            return res.status(400).json({

                message:"Review status must be Approved or Rejected."

            });


        }




        const faculty = await User.findById(faculty_id);



        if(!faculty){


            return res.status(404).json({

                message:"Faculty user not found."

            });


        }




        if(faculty.role !== "Faculty"){


            return res.status(403).json({

                message:"Only Faculty users can review applications."

            });


        }




        const application = await Application.findById(
            req.params.application_id
        );



        if(!application){


            return res.status(404).json({

                message:"Application not found."

            });


        }




        application.review_status = review_status;


        application.recommendation_note = recommendation_note || "";


        application.reviewed_by = faculty_id;


        application.reviewed_at = new Date();



        await application.save();





        const job = await Job.findById(application.job);




        // Notify company if approved

        if(review_status === "Approved" && job){


            await Notification.create({

                user:job.company,

                message:`A faculty-approved student application is ready for your job: "${job.title}".`

            });


        }





        // Notify student


        await Notification.create({

            user:application.student,

            message:

            review_status === "Approved"

            ?

            `Your application for "${job ? job.title : "the job"}" was approved by faculty.`

            :

            `Your application for "${job ? job.title : "the job"}" was rejected by faculty.`


        });





        res.status(200).json({

            message:`Application ${review_status.toLowerCase()} successfully.`,

            application

        });




    }catch(err){


        console.error(
            "Error reviewing application:",
            err
        );


        res.status(500).json({

            message:"Error reviewing application."

        });



    }


});




// ============================================================
// FEATURE 23: Notification Dashboard
// ============================================================


// Get notifications

router.get('/notifications/:user_id', async(req,res)=>{


    try{


        const notifications = await Notification.find({

            user:req.params.user_id

        })
        .sort({

            createdAt:-1

        });



        res.status(200).json(notifications);



    }catch(err){


        console.error(err);


        res.status(500).json({

            message:"Error fetching notifications."

        });



    }


});





// Get unread count


router.get('/notifications/:user_id/unread-count', async(req,res)=>{


    try{


        const unreadCount = await Notification.countDocuments({

            user:req.params.user_id,

            is_read:false

        });



        res.status(200).json({

            unreadCount

        });



    }catch(err){


        console.error(err);


        res.status(500).json({

            message:"Error fetching unread count."

        });


    }


});






// Mark single notification as read


router.patch('/notifications/:notification_id/read', async(req,res)=>{


    try{


        const {user_id} = req.body;




        const notification = await Notification.findOne({

            _id:req.params.notification_id,

            user:user_id

        });




        if(!notification){


            return res.status(404).json({

                message:"Notification not found."

            });


        }




        notification.is_read = true;


        await notification.save();




        res.status(200).json({

            message:"Notification marked as read.",

            notification

        });




    }catch(err){


        console.error(err);


        res.status(500).json({

            message:"Error updating notification."

        });



    }


});







// Mark all notifications read


router.patch('/notifications/:user_id/read-all', async(req,res)=>{


    try{


        const result = await Notification.updateMany(

            {

                user:req.params.user_id,

                is_read:false

            },

            {

                is_read:true

            }

        );



        res.status(200).json({

            message:"All notifications marked as read.",

            updatedCount:result.modifiedCount

        });




    }catch(err){


        console.error(err);


        res.status(500).json({

            message:"Error updating notifications."

        });



    }


});




// ============================================================
// Company Specific Jobs
// ============================================================


router.get('/jobs/company/:company_id', async(req,res)=>{


    try{


        const jobs = await Job.find({

            company:req.params.company_id

        })
        .sort({

            createdAt:-1

        });



        res.status(200).json(jobs);



    }catch(err){


        console.error(err);


        res.status(500).json({

            message:"Error fetching company jobs."

        });



    }


});





module.exports = router;