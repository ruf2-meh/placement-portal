const express = require('express');
const router = express.Router();

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require('../models/User');


const JWT_SECRET = process.env.JWT_SECRET;


// =============================
// REGISTER
// =============================

router.post('/register', async(req,res)=>{

    try{

        const {
            name,
            email,
            password,
            role
        } = req.body;


        let user = await User.findOne({
            email
        });


        if(user){

            return res.status(400).json({
                message:'User already exists'
            });

        }


        const salt = await bcrypt.genSalt(10);

        const hashedPassword =
            await bcrypt.hash(password,salt);



        user = await User.create({

            name,
            email,
            password:hashedPassword,
            role

        });


        res.status(201).json({

            message:'User registered successfully!'

        });



    }catch(err){

        console.error(err);

        res.status(500).json({
            message:'Server Error'
        });

    }

});





// =============================
// LOGIN
// =============================

router.post('/login', async(req,res)=>{


    try{


        const {
            email,
            password
        } = req.body;



        const user = await User.findOne({
            email
        });


        // DEBUG CHECK
        console.log("Login email:", email);
        console.log("Found user:", user);



        if(!user){

            return res.status(400).json({

                message:'Invalid credentials (Email not found)'

            });

        }





        const isMatch =
        await bcrypt.compare(
            password,
            user.password
        );



        if(!isMatch){

            return res.status(400).json({

                message:'Invalid credentials (Wrong password)'

            });

        }





        const payload = {

            user:{

                id:user._id,
                role:user.role

            }

        };





        jwt.sign(

            payload,

            JWT_SECRET,

            {expiresIn:'1h'},


            (err,token)=>{


                if(err) throw err;



                res.json({


                    token,


                    user:{

                        id:user._id,
                        name:user.name,
                        email:user.email,
                        role:user.role

                    }

                });


            }


        );





    }catch(err){


        console.error(err);


        res.status(500).json({

            message:'Server Error'

        });


    }


});



module.exports = router;