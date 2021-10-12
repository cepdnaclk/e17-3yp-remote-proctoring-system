const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// importing the mongoose models ///////////////////////////////////////////////////////////////////////////////

const devices = require('../../models/devices');  // importing the mongoose model for the collection 'devices'
const admins = require('../../models/admins');  // importing the mongoose model for the collection 'admins'

////////// proctor accessible collections

const proctors = require('../../models/proctors');  // importing the mongoose model for the collection 'proctors'

const recordings = require('../../models/recordings');  // importing the mongoose model for the collection 'recordings'

////////// student accessible collections

const students = require('../../models/students');  // importing the mongoose model for the collection 'students'
const courses = require('../../models/courses');  // importing the mongoose model for the collection 'courses'
const exams = require('../../models/exams');  // importing the mongoose model for the collection 'exams'
const exam_rooms = require('../../models/exam_rooms');  // importing the mongoose model for the collection 'exam_rooms'
const { findOneAndDelete } = require('../../models/proctors');

////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const { protectAdmin } = require('../../middleware/adminAuth');

const router = express.Router();


////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////

/**
 * API calls for registration
 * admin emails and detailt will be added by the super-admin
 * when astudent tries to register --> check DB for given email
 * if email exists --> astudent can add a password of his/her choice.
 * astudent setting a password is considered as registering
 */

// API call to register proctor
router.post('/register', (req, res) => {
    const {email, password0, password1} = req.body;

    // let errors = [];

    // checking of required fields is done by the frontend

    // checking this just incase because suri is dumb
    if(password0 != password1) {
        // errors.push({msg: 'Passwords do not match'});
        res.status(400).json({status: 'failure', message: 'Entered passwords do not match'})  // CHECK THE STATUS CODE
    }
    else {
        // validation passed
        admins.findOne({email}).select('+password')  // finds the admin by email
        .then(admin => {
            if(admin) {  // given email exists as a admin
                // checks whether the email is set or not. to check whether the admin has already registered or not
                console.log(admin);
                if(admin.password == '') {  // admin not yet register
                    bcrypt.genSalt(10, (err, salt) => {
                        bcrypt.hash(password0, salt, (err, hash) => {
                            if(err) throw err;  // HANDLE WHAT HAPPENS HERE
                            // setting admin's password to hashed value
                            admin.password = hash;
                            // saving the admin with the new password hash
                            admin.save()
                            .then(() => {
                                // success
                                res.json({status: 'success', message: 'Admin is now registered'});
                            })
                            .catch(err => {
                                res.status(400).json({status: 'failure', message: 'Error occured while trying to save the password hash', error: String(err)})  // CHECK THE STATUS CODE
                            }); 
                        })
                    })
                }
                else {  // admin has already registered
                    res.status(400).json({status: 'failure', message: 'Admin has already been registered'})  // CHECK THE STATUS CODE
                }

            }
            else {  // no user with the given email is entered as a admin by the admin
                res.status(400).json({status: 'failure', message: 'The email has not been assigned as a admin by the super-admin'})  // CHECK THE STATUS CODE
            }
        })
        .catch(err => {
            res.status(400).json({status: 'failure', message: 'Error occured while trying to find the admin with the given email', error: String(err)})  // CHECK THE STATUS CODE
        });
    }
});

// API call to login admin
router.post('/login', (req, res) => {
    // frontend does email password field validations
    const email = req.body.email;
    const password = req.body.password;

    if(!email || !password){
        return res.status(400).json({status: 'failure', message: 'Enter both email and password fields'})
    }
    // try{
    admins.findOne({ email }).select("+password")  
    .then(async admin => {
        // console.log(admin);
        if(!admin){
            return res.status(404).json({status: 'failure', message: "Email does not exist"});
        }
        else if(admin.password == '') {  // to check if the user has not yet registered
            return res.status(400).json({status: 'failure', message: "Admin has not registered"});
        }
        
        try {
            const isMatch = await admin.matchPasswords(password);  // AWAIT WORKS
            // console.log(isMatch);

            if(!isMatch){
                return res.status(405).json({status: 'failure', message: "Invalid credentials"});
            }
            // password match
            // login successful
            // sending token to admin
            const token = await admin.getSignedToken();  // AWAIT WORKS
            // console.log(token);
            // sending the token to the user
            res.json({status: 'success', token});

        }catch(err) {
            res.status(406).json({status: 'failure', message:'Error occured', error: err.message});
        }
        // admin.matchPasswords(password, isMatch => {
        //     // console.log('inside callbak from matchPasswords');
        //     // console.log(err);
        //     // console.log(isMatch);
        //     // if(err)  // exiting if error occured
        //     //     return res.status(400).json({status: 'failure', message: 'Error occured while trying match passwords', error: String(err)});
        //     if(!isMatch){  // if passwords don't match
        //         return res.status(405).json({status: 'failure', message: "Invalid credentials"});
        //     }
        //     // password match
        //     // login successful
        //     // sending token to admin
        //     admin.getSignedToken((token) => {
        //         // if(err)
        //         //     return res.status(400).json({status: 'failure', message: 'Error occured when calling self.getSignedToken()', error: String(err)})
        //         res.json({status: 'success', token});
        //     });
        //     // .then(token => {
        //     //     res.json({status: 'success', token});
        //     // })
        //     // .catch(err => res.status(400).json({status: 'failure', message: 'Error occured when calling self.getSignedToken()', error: String(err)}));
        // });
        // .then(isMatch => {
        //     console.log('hutto: ' + isMatch);
        //     if(!isMatch){  // if passwords don't match
        //         return res.status(405).json({status: 'failure', message: "Invalid credentials"});
        //     }
        //     console.log(isMatch);
        //     // password match
        //     // login successful
        //     // sending token to admin
        //     admin.getSignedToken()
        //     .then(token => {
        //         res.json({status: 'success', token});
        //     })
        //     .catch(err => res.status(400).json({status: 'failure', message: 'Error occured when calling self.getSignedToken()', error: String(err)}));
        // })
        // .catch(err => res.status(400).json({status: 'failure', message: 'Error occured while trying to match password', error: String(err)}));
    })
    .catch(err => {
        console.log(err);
        res.status(400).json({status: 'failure', message: 'Error occured while trying to find the admin by given email', error: err})
    });
    
    // }catch(error){
    //     res.status(406).json({status: 'failure', error: error.message});
    // }

});


////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////

/**
 * API calls to the admins collection
 */
// add new admin to the database
router.post('/admins/single', (req, res) => {
    // method to add a new entry to the user relation in the database
    /**
     * write code to add student to the database
     */

    const record = req.body;
    // console.log('Request body: ' + record);
    
    // const response = await admins.create(record);  // response is the return value from mongoDB
    // gives the request body straight away as the object to be created
    const newAdmin = new admins(record);
    // saves the new admin object
    newAdmin.save()
    .then(() => {
        res.json({status: 'success', message: 'Addded new admin to the database', createdEntry: newAdmin});
        console.log('Created new admin entry: ' + newAdmin);
    })
    .catch(err => res.status(400).json({status: 'failure', message: "Following error occured while trying to create a new admin entry", error: String(err)}));
    
 
    // res.json({status: 'Addded new admin to the database'});  // response after succcesfully creating a new exam schedule


    // redirecting to the login page after a successful registration
    // res.redirect('/*path of the page to redirect to after regitering */'); 
});

// reading all administrators
router.get('/admins/all', (req, res) => {
    const req_body = req.body;
    // console.log('Request body: ' + req_body);

    // const records = await admins.find(req_body);
    // console.log('Sending response: ' + records);

    admins.find()
    .then(result => res.json(result))
    .catch(err => res.status(400).json({status: 'failure', message: "Following error occured while trying to read all admins", error: String(err)}));
});

// reading an admin by id (self info to populate the page)
router.get('/admins/self/:id', (req, res) => {
    // const req_body = req.body;
    // console.log('Request body: ' + req_body);

    // const records = await admins.find(req_body);
    // console.log('Sending response: ' + records);

    admins.findById(req.params.id)
    .then(result => res.json(result))
    .catch(err => res.status(400).json({status: 'failure', message: "Following error occured while trying to read self admin record", error: String(err)}));
});

// updating self info
// front end has to send all the fields of the new entry (both updated and non updated fields)
router.put('/admins/self/:id', (req, res) => {
    admins.findById(req.params.id)
    .then(admin => {
        admin.name = req.body.name;
        admin.email = req.body.email;
        admin.role = req.body.role;

        admin.save()
        .then(() => res.json({status: 'success', message: 'Updated the admin info', updatedEntry: admin}))
        .catch(err => res.status(400).json({status: 'failure', message: 'Error occured while trying to save the updated entry', error: String(err)}));
    })
    .catch(err => res.status(400).json({status: 'failure', message: "Error occured while trying to read self admin record", error: String(err)}));
});

// updating info of another admin
// sends the email of the the updated admin as a request parameter
// front end has to send all the fields of the new entry (both updated and non updated fields)
router.put('/admins/single/:email', (req, res) => {
    admins.findOne({email: req.params.email})
    .then(admin => {
        admin.name = req.body.name;
        admin.email = req.body.email;
        admin.role = req.body.role;

        admin.save()    
        .then(() => res.json({status: 'success', message: 'Updated the admin info', updatedEntry: admin}))
        .catch(err => res.status(400).json({status: 'failure', message: 'Error occured while trying to save the updated entry', error: String(err)}));
    })
    .catch(err => res.status(400).json({status: 'failure', message: "Error occured while trying to find the admin record", error: String(err)}));
});

// deleting an admin
// only the super-admin can call this
// finds an admin by email and deletes
router.delete('/admins/single/:email', (req, res) => {
    admins.findOneAndDelete({email: req.params.email})
    .then(deleted => {
        if(deleted == null)
            res.status(400).json({status: 'failure', message: 'Admin with given email does not exist'});
        else
            res.json({status: 'success', message: 'Deleted admin', deletedEntry: deleted})
    })
    .catch(err => res.status(400).json({status: 'failure', message: "Error occured while trying to delete admin", error: String(err)}));
});

// // deleting all admins
// // only the super-admin can call this
// router.delete('/admins/all', (req, res) => {
//     admins.find()
//     .then(result => {
//         admins.deleteMany({})  // expected to delete all the admins
//         .then(deleted => res.json({status: 'success', message: 'Deleted all thr admin', deletedEntry: result}))  // TRY GIVING DELETED INSTEAD OF RESULT
//         .catch(err => res.status(400).json({status: 'failure', message: "Error occured while trying to delete all admins", error: String(err)}));
//     })
//     .catch(err => res.status(400).json({status: 'failure', message: "Error occured while trying to find all admins", error: String(err)}));
// });
////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////

/**
 * API calls to the students collection
 */

// add new student to the database
router.post('/students/single', (req, res) => {
    // method to add a new entry to the user relation in the database
    /**
     * write code to add student to the database
     */

    const record = req.body;
    // console.log('Request body: ' + record);

    // const response = await students.create(record);  // response is the return value from mongoDB
    // adds the request body straight away as the object to be created
    const newStudent = new students(record);
    // saves the new student
    newStudent.save()
    .then(() => {
        console.log('Created new student entry: ' + newStudent);
        res.json({status: 'success', message: 'Addded new student to the database', createdEntry: newStudent});
    })
    .catch(err => res.status(400).json({status: 'failure', message: 'Error occured while trying to save new student', error: String(err)}));

    // console.log('Created new student entry: ' + response);
 
    // res.json({status: 'Addded new student to the database'});  // response after succcesfully creating a new exam schedule


    // redirecting to the login page after a successful registration
    // res.redirect('/*path of the page to redirect to after regitering */'); 
});

// add multiple stuedents from a sheet 
// receiving object => {"uploaded file": "students", "details": [[], [], [start], ..., [end]]}
router.post('/students/multiple', async (req, res, next) => {
    const record = req.body;
    console.log('Request body: ' + record);
    // console.log(record.details[0][0]);
    const createdEntry = [];
    
    for (let i = 2; i < record.details.length; i++) {  // ADD CODE TO CHECK DATABASE FOR ALREADY EXISTING STUDENT, AND ONLY TRY TO ADD IF NOT
        if(record.details[i].length ==  5) {  // skips an entire record if it doesn't have 5 fields
            const regNo = record.details[i][1];
            const name = record.details[i][2];
            const email = record.details[i][3];
            const department = record.details[i][4];

            // const response = await students.create({regNo, name, email, department});  // response is the return value from mongoDB
            // console.log('Created new student entry (' + i-1 + '): ' + response);

            // checking of the student already exist in the database
            // students.findOne({regNo: regNo})
            // .then(result => {
                // if(result == null) {
                // console.log('onna creating new entry');
            const newStudent = new students({regNo, name, email, department});
            // saves the new student
            newStudent.save()
            .then(() => {
                // console.log('Created new student entry: ' + newStudent);
                createdEntry.push(newStudent);
                // res.json({status: 'Addded new student to the database'});
            })
            .catch(err => {
                console.log(i);
                console.log("Error occured: " + err);

            });  
                // }
                // else{
                //     console.log(i);
                //     console.log('Tried to enter already existing student');
                // }
            // })
            // .catch(err => {
            //     console.log('Error occured while trying to find student in the students collection:\n' + err);
            // });

        }
    }
    /**
     * have to handle errors of =>  trying to add a student without a required field
     */
    // console.log('enddd');
    res.json({status: 'response under construction'});
});

// call to read all students
router.get('/students/all', (req, res) => {
    const req_body = req.body;
    // console.log('Request body: ' + req_body);

    // const records = await admins.find(req_body);
    // console.log('Sending response: ' + records);

    students.find()
    .then(result => res.json(result))
    .catch(err => res.status(400).json({status: 'failure', message: 'Error occured while trying to find all students', error: String(err)}));
});

// updating info of a single student
// sends the email of the the updated student as a request parameter
// front end has to send all the fields of the new entry (both updated and non updated fields)
router.put('/students/single/:email', (req, res) => {
    students.findOne({email: req.params.email})
    .then(student => {
        student.name = req.body.name;
        student.regNo = req.body.regNo;
        student.email = req.body.email;
        student.department = req.body.department;
        student.device = req.body.device;

        student.save()    
        .then(() => res.json({status: 'success', message: 'Updated the student info', updatedEntry: student}))
        .catch(err => res.status(400).json({status: 'failure', message: 'Error occured while trying to save the updated entry', error: String(err)}));
    })
    .catch(err => res.status(400).json({status: 'failure', message: "Error occured while trying to find the student record", error: String(err)}));
});

// deleting a single student
// sends the email of the the updated student as a request parameter
router.delete('/students/single/:email', (req, res) => {
    students.findOneAndDelete({email: req.params.email})
    .then(deleted => {
        if(deleted == null)
            res.status(400).json({status: 'failure', message: 'Student with given email does not exist'});
        else
            res.json({status: 'success', message: 'Deleted student', deletedEntry: deleted});
    })
    .catch(err => res.status(400).json({status: 'failure', message: "Error occured while trying to delete student", error: String(err)}));
});

// deleting all students
// only the super-admin can call this
router.delete('/students/all', (req, res) => {
    students.find()
    .then(result => {
        students.deleteMany({})  // expected to delete all the students
        .then(deleted => res.json({status: 'success', message: 'Deleted all the students', deleted, deletedEntry: result}))  // TRY GIVING DELETED INSTEAD OF RESULT
        .catch(err => res.status(400).json({status: 'failure', message: "Error occured while trying to delete all students", error: String(err)}));
    })
    .catch(err => res.status(400).json({status: 'failure', message: "Error occured while trying to find all the students", error: String(err)}));
});

////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////

/**
 * API calls to the proctors collection
 */
// add a new proctor to the database
router.post('/proctors/single', (req, res) => {
    // method to add a new entry to the user relation in the database
    /**
     * write code to add student to the database
     */

    const record = req.body;
    // console.log('Request body: ' + record);
    
    // const response = await proctors.create(record);  // response is the return value from mongoDB

    const newProctor = new proctors(record);
    //saving the new proctor
    newProctor.save()
    .then(() => {
        // console.log('Created new proctor entry: ' + newProctor);
        res.json({status: 'success', message: 'Addded new proctor to the database', createdEntry: newProctor});  // response after succcesfully creating a new exam schedule

    })
    .catch(err => res.status(400).json({status: 'failure', message: 'Error occured while trying to save a new proctor', error: String(err)}));

    // console.log('Created new proctor entry: ' + response);
 
    // res.json({status: 'Addded new proctor to the database'});  // response after succcesfully creating a new exam schedule

    // redirecting to the login page after a successful registration
    // res.redirect('/*path of the page to redirect to after regitering */'); 
});

// call to read all proctors
router.get('/proctors/all', (req, res) => {
    const req_body = req.body;
    console.log('Request body: ' + req_body);

    // const records = await admins.find(req_body);
    // console.log('Sending response: ' + records);

    proctors.find()
    .then(result => res.json(result))
    .catch(err => res.status(400).json({status: 'failure', message: 'Error occured while trying to find all proctors', error: String(err)}));
});

// updating info of a single proctor
// sends the email of the the updated proctor as a request parameter
// front end has to send all the fields of the new entry (both updated and non updated fields)
router.put('/proctors/single/:email', (req, res) => {
    proctors.findOne({email: req.params.email})
    .then(proctor => {
        proctor.name = req.body.name;
        proctor.email = req.body.email;

        proctor.save()    
        .then(() => res.json({status: 'success', message: 'Updated the proctor info', updatedEntry: proctor}))
        .catch(err => res.status(400).json({status: 'failure', message: 'Error occured while trying to save the updated entry', error: String(err)}));
    })
    .catch(err => res.status(400).json({status: 'failure', message: "Error occured while trying to find the proctor record", error: String(err)}));
});

// deleting a single proctor
// sends the email of the the updated proctor as a request parameter
router.delete('/proctors/single/:email', (req, res) => {
    proctors.findOneAndDelete({email: req.params.email})
    .then(deleted => {
        if(deleted == null)
            res.status(400).json({status: 'failure', message: 'Proctor with given email does not exist'});
        else
            res.json({status: 'success', message: 'Deleted proctor', deletedEntry: deleted});
    })
    .catch(err => res.status(400).json({status: 'failure', message: "Error occured while trying to delete proctor", error: String(err)}));
});

// deleting all proctors
// only the super-admin can call this
router.delete('/proctors/all', (req, res) => {
    proctors.find()
    .then(result => {
        proctors.deleteMany({})  // expected to delete all the proctors
        .then(deleted => res.json({status: 'success', message: 'Deleted all the proctors', deleted, deletedEntry: result}))  // TRY GIVING DELETED INSTEAD OF RESULT
        .catch(err => res.status(400).json({status: 'failure', message: "Error occured while trying to delete all proctors", error: String(err)}));
    })
    .catch(err => res.status(400).json({status: 'failure', message: "Error occured while trying to find all the proctors", error: String(err)}));
});
////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////

/**
 * API calls to the courses collection
 */
// add 1 new course to the database
router.post('/courses/single', (req, res) => {
    // method to add a new entry to the user relation in the database
    /**
     * write code to add student to the database
     */

    const record = req.body;
    // console.log('Request body: ' + record);
    
    // const response = await courses.create(record);  // response is the return value from mongoDB

    // adds the request body straight away as the object to be created
    const newCourse = new courses(record);
    // saves the new student
    newCourse.save()
    .then(() => {
        // console.log('Created new course entry: ' + newCourse);
        res.json({status: 'success', message: 'Addded new course to the database', createdEntry: newCourse});
    })
    .catch(err => res.status(400).json({status: 'failure', message: 'Following error occured while trying to create a course', error: String(err)}));

    // console.log('Created new course entry: ' + response);
 
    // res.json({status: 'Addded new course to the database'});  // response after succcesfully creating a new exam schedule


    // redirecting to the login page after a successful registration
    // res.redirect('/*path of the page to redirect to after regitering */'); 
});

// add multiple courses from a mastersheet 
// receiving object => {"uploaded file": "courses", "details": [[], [start], [], ..., [end]]}
router.post('/courses/mastersheet', async (req, res) => {
    const record = req.body;
    // console.log('Request body: ' + record);
    var createdEntries = [];
    var errorOccured = false;
    // console.log(record.details[0][0]);

    for (let i = 1; i < record.details.length; i++) {  // ADD ERROR HANDLING TO CHECK WHETHER A COURSE ALREADY EXISTS BEFORE ADDING, AND ONLY ADD IF NOT
        if(errorOccured)
            break; // breaking the loop if atleast a single error happens

        const shortname = record.details[i][0];
        const fullname = record.details[i][1];
        const department = record.details[i][2];
        const semester = record.details[i][3];

        // const response = await courses.create({shortname, fullname, department, semester});  // response is the return value from mongoDB
        // console.log('Created new course entry (' + i + '): ' + response);
        const newCourse = new courses({shortname, fullname, department, semester});
        // saves the new student
        newCourse.save()  // without the await, the loop will carry on without waiting for the save().then().catch()
        .then(() => {
            // console.log('Created new course entry: ' + newCourse);
            createdEntries.push(newCourse);
            // console.log(i);
            // res.json({status: 'Addded new student to the database'});
        })
        .catch(err => {
            console.log(i);
            // res.status(400).json({status: 'failure', message: 'Following error occured while trying to create a course', error: String(err)});
            // return true;
            console.log("Error occured: " + err);
            errorOccured = true;
            // next();
        });  // MIGHT GIVE AN ERROR 
    }   // WRITE CODE TO DELETE THE PREVIOUSLY ADDED COURSES FROM THIS MASTERSHEET (MAKE ADDING FROM MASTERSHEET ATOMIC)
    /**
     * have to handle errors of => adding an already existing course, trying to add a course without a required field
     */
    // console.log('going to send success response');
    // if(!errorOccured)
    res.json({status: 'response under construction'});
});

// call to read all courses
router.get('/courses/all', (req, res) => {
    // const req_body = req.body;
    // console.log('Request body: ' + req_body);

    // const records = await admins.find(req_body);
    // console.log('Sending response: ' + records);

    courses.find()
    .then(result => res.json(result))
    .catch(err => res.status(400).json({status: 'failure', message: 'Following error occured while trying to read all the courses', error: String(err) }));
});


// updating info of a single course
// sends the shortname of the the updated course as a request parameter
// front end has to send all the fields of the new entry (both updated and non updated fields)
router.put('/courses/single/:shortname', (req, res) => {
    courses.findOne({shortname: req.params.shortname})
    .then(course => {
        course.name = req.body.shortname;
        course.regNo = req.body.fullname;
        course.email = req.body.department;
        course.department = req.body.coordinator;
        course.lecturers = req.body.lecturers;  // this will be an array
        course.students = req.body.students;  // this will be an array
        // hasExam field cannot be edited by the admin

        course.save()    
        .then(() => res.json({status: 'success', message: 'Updated the course info', updatedEntry: course}))
        .catch(err => res.status(400).json({status: 'failure', message: 'Error occured while trying to save the updated entry', error: String(err)}));
    })
    .catch(err => res.status(400).json({status: 'failure', message: "Error occured while trying to find the course record", error: String(err)}));
});

// deleting a single course
// sends the shortname of the the updated course as a request parameter
router.delete('/courses/single/:shortname', (req, res) => {
    courses.findOne({shortname: req.params.shortname})
    .then(result => {
        if (result == null) {
            res.status(400).json({status: 'failure', message: 'No course with the given short name'});
        }
        else {
            if(result.hasExam) {
                res.status(400).json({status: 'failure', message: 'Tried to delete a course which has a scheduled exam'});
            }
            else {
                courses.findOneAndDelete({shortname: req.params.shortname})
                .then(deleted => {
                    // if(deleted == null)
                    //     res.status(400).json({status: 'failure', message: 'Course with given shortname does not exist'});
                    // else
                    res.json({status: 'success', message: 'Deleted course', deletedEntry: deleted});
                })
                .catch(err => res.status(400).json({status: 'failure', message: "Error occured while trying to delete course", error: String(err)}));
            }
        }
    })
    .catch(err => res.status(400).json({status: 'failure', message: "Error occured while trying to find the course record", error: String(err)}))
});

// deleting all courses
// only the super-admin can call this
router.delete('/courses/all', (req, res) => {
    // checks whether there's atleast one exam --> if so cannot delete all courses
    exams.findOne()  
    .then(result => {
        if(result == null) {
            courses.find()
            .then(result => {
                courses.deleteMany({})  // expected to delete all the courses
                .then(deleted => res.json({status: 'success', message: 'Deleted all the courses', deleted, deletedEntry: result}))  // TRY GIVING DELETED INSTEAD OF RESULT
                .catch(err => res.status(400).json({status: 'failure', message: "Error occured while trying to delete all courses", error: String(err)}));
            })
            .catch(err => res.status(400).json({status: 'failure', message: "Error occured while trying to find all the courses", error: String(err)}));
        }
        else {  
            console.log(result);
            res.status(400).json({status: 'failure', message: 'Tried to delete a all course when there are scheduled exams'})
        }
    })
    .catch(err => res.status(400).json({status: 'failure', message: "Error occured while trying to find all exams", error: String(err)}))
});


////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////


/**
 * API calls to the devices collection
 */
// add a new device to the database
router.post('/devices/single', (req, res) => {
    // method to add a new entry to the user relation in the database
    /**
     * write code to add device to the database
     */

    const record = req.body;
    // console.log('Request body: ' + record);
    
    // const response = await devices.create(record);  // response is the return value from mongoDB
    
    const newDevice = new devices(record);
    // saves the new device
    newDevice.save()
    .then(() => {
        console.log('Created new device entry: ' + newDevice);
        res.json({status: 'success', message: 'Addded new device to the database', createdEntry: newDevice});
    })
    .catch(err => res.status(400).json({status: 'failure', message: 'Error occured while trying to save new device', error: String(err)}));
    
    // console.log('Created new device entry: ' + response);
 
    // res.json({status: 'Addded new device to the database'});  // response after succcesfully creating a new exam schedule


    // redirecting to the login page after a successful registration
    // res.redirect('/*path of the page to redirect to after regitering */'); 
});

// call to read all devices
router.get('/devices/all', (req, res) => {
    const req_body = req.body;
    console.log('Request body: ' + req_body);

    // const records = await admins.find(req_body);
    // console.log('Sending response: ' + records);

    devices.find()
    .then(result => res.json(result))
    .catch(err => res.status(400).json({status: 'failure', message: 'Error occured while trying to find all the devices', error: String(err) }));
});


////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////

/**
 * API calls to the exams collection
 */

// // scheduling and exam (REDUNDANT --> in proctor.js)
// router.post('/exams/single', async (req, res) => {
//     /**
//      * add code to add a new exam to the database
//      * add a auto generated id 
//      * have to generate a URL/link for the meeting and store in the database
//      */

//     const record = req.body;
//     console.log('Request body: ' + record);

//     // const response = await exams.create(record);  // response is the return value from mongoDB
    
//     const newExam = new courses(record);
//     // saves the new device
//     newExam.save()
//     .then(() => {
//         // console.log('Created new exam entry: ' + newExam);
//         res.json({status: 'success', message: 'Addded new exam to the database'});
//     })
//     .catch(err => res.status(400).json({status: 'failure', message: 'Error occured while trying save the new exam', error: String(err)}));
    
//     // console.log('Created new exam: ' + response);

//     // res.json({status: 'Addded new exam schedule'});  // response after succcesfully creating a new exam schedule
     
// });

// add an exam from the mastersheet 
// receiving object => {"uploaded file": "mastersheet", "details": [[], [], [], ..., []]}
// the course of the exam should exist in the courses collection prior to adding an exam
router.post('/exams/mastersheet', async (req, res) => {
    const record = req.body;
    // console.log('Request body: ' + record);
    var distinct_exam_rooms = [];

    // console.log(record.details[0][0]);
    /////////////////////////////////////////////////
    // creating the date+time string
    const year = record.details[1][3].substr(6, 4);
    const month = record.details[1][3].substr(3, 2);
    const date = record.details[1][3].substr(0, 2);
    const hours = record.details[2][3].substr(0, 2); 
    const mins = record.details[2][3].substr(3, 2); 
    
    const startTime = year+"-"+month+"-"+date+"T"+hours+":"+mins+":00";
    // console.log(startTime);
    /////////////////////////////////////////////////
    const name = record.details[0][2];
    // const startTime: {type: Date, required: true},  // it is a must that a exam has a start time 2023-12-10T10:00:00
    const duration = record.details[3][3];
    const course_coordinator = record.details[4][4];
    const chief_invigilators = [];  // record.details[14][5];
    const invigilators = [];  // record.details[14][6];
    const total_students = record.details[10][5];
    const students = [];
    const course = name.split(" ")[0] + '-' + year;

    // checking if the course is in the courses collection
    // and if not, returning without adding the exam
    // var course_not_found = false;
    courses.findOne({shortname: course})
    .then(result => {
        if(result == null) {  // returns without adding the new course
            // course_not_found = true;
            return res.json({status: 'failure', message: 'The course ' + course + ' does not exist in the database under the courses collection.'});
        }
        for (let i = 14; i < record.details.length; i++) {
            if(record.details[i].length ==  12) {  // skips an entire record if it doesn't have 5 fields
                const regNo = record.details[i][1];
                var eligible = false;
                if(record.details[i][2] == "TRUE") {
                    eligible = true;
                }
                const exam_room = record.details[i][3];
    
                // adding a new distinct exam room 
                if(!distinct_exam_rooms.includes(exam_room)) {  // 
                    distinct_exam_rooms.push(exam_room); 
                    // adding a chief invigilator and an invigilator for a new room
                    chief_invigilators.push({exam_room, name: record.details[i][5]});  
                    invigilators.push({exam_room, name: record.details[i][6]});
                }
                // adding the new student to the students array    
                students.push({regNo, eligible, exam_room});
            }
        }

        // this is a schema method of exams
        // takes the distinct exam rooms as the arguments
        const newExam = new exams({name, startTime, duration, course_coordinator, chief_invigilators, invigilators, total_students, students, course});

        // saving the new exam
        newExam.save()
        .then(async () => {
            // console.log('Created new exam entry: ' + newExam);

            // calling the function to create exam rooms
            // will return true if successfully creates the rooms, and else will return false
            const exam_rooms_created = await exams.addExamRooms({distinct_exam_rooms, name, students, chief_invigilators, invigilators});
            // updates the relevant course according to the new exam
            // will return true if the courses were updated successfully, and else will return false.
            const courses_updated = await exams.updateExamOnCourses({course, students, course_coordinator});
            // USE THE RETURN VALUE OF THE ABOVE 2 VARIABLE AND AND DELETE THE CREATED EXAM RECORD IF EITHER IS FALSE.

            res.json({status: 'success', message: 'Addded new exam to the database, and created the relevant exam rooms', createdEntry: newExam});

            // console.log(exam_rooms_created);
            // if(exam_rooms_created) {
            //     res.json({status: 'success', message: 'Addded new exam to the database, and created the relevant exam rooms', createdEntry: newExam});
            //     // WRITE CODE TO DELETE THE EXAM ENTRY SUCCESSFULLY CREATED BY THIS MASTERSHEET
            // }
            // else
            //     res.status(400).json({status: 'failure', message: 'Error occured when trying to make an exam room'});
        })
        .catch(err => {
            res.status(400).json({status: 'failure', message: 'Following error occured when trying to make an exam', error: String(err)});
            // console.log(err);
        });
    
    })
    .catch(err => {  // returns without adding the new course
        console.log("Error occured while finding the course of the exam in the courses collection");
        // course_not_found = true;
        return res.json({status: 'failure', message: "Error occured while finding the course of the exam in the courses collection", error: String(err)});
    });

    // // returning from the API call if relevant course not found
    // if(course_not_found) {
    //     console.log('\n\ngoing to return from call');
    //     // eturn;
    // }
    // console.log('\n\n\nhari giye na wade\n\n\n');   
    // continues if the course of the exam exists in the coures collection ...


    // for (let i = 14; i < record.details.length; i++) {
    //     if(record.details[i].length ==  12) {  // skips an entire record if it doesn't have 5 fields
    //         const regNo = record.details[i][1];
    //         var eligible = false;
    //         if(record.details[i][2] == "TRUE") {
    //             eligible = true;
    //         }
    //         const exam_room = record.details[i][3];

    //         // adding a new distinct exam room 
    //         if(!distinct_exam_rooms.includes(exam_room)) {  // 
    //             distinct_exam_rooms.push(exam_room); 
    //             // adding a chief invigilator and an invigilator for a new room
    //             chief_invigilators.push({exam_room, name: record.details[i][5]});  
    //             invigilators.push({exam_room, name: record.details[i][6]});
    //         }
    //         // adding the new student to the students array    
    //         students.push({regNo, eligible, exam_room});
    //     }
    // }
    // const response = await exams.create({name, startTime, duration, course_coordinator, chief_invigilator, invigilator, total_students, students});  // response is the return value from mongoDB
    
    
    // // this is a schema method of exams
    // // takes the distinct exam rooms as the arguments
    // const newExam = new exams({name, startTime, duration, course_coordinator, chief_invigilators, invigilators, total_students, students, course});
    // // saving the new exam
    // newExam.save()
    // .then(async () => {
    //     // console.log('Created new exam entry: ' + newExam);

    //     // calling the function to create exam rooms
    //     // will return true if successfully creates the rooms, and else will return false
    //     const exam_rooms_created = await exams.addExamRooms({distinct_exam_rooms, name, students, chief_invigilators, invigilators});
    //     // updates the relevant course according to the new exam
    //     // will return true if the courses were updated successfully, and else will return false.
    //     const courses_updated = await exams.updateExamOnCourses({course, students, course_coordinator});
    //     // USE THE RETURN VALUE OF THE ABOVE 2 VARIABLE AND AND DELETE THE CREATED EXAM RECORD IF EITHER IS FALSE.

    //     res.json({status: 'success', message: 'Addded new exam to the database, and created the relevant exam rooms', createdEntry: newExam});

    //     // console.log(exam_rooms_created);
    //     // if(exam_rooms_created) {
    //     //     res.json({status: 'success', message: 'Addded new exam to the database, and created the relevant exam rooms', createdEntry: newExam});
    //     //     // WRITE CODE TO DELETE THE EXAM ENTRY SUCCESSFULLY CREATED BY THIS MASTERSHEET
    //     // }
    //     // else
    //     //     res.status(400).json({status: 'failure', message: 'Error occured when trying to make an exam room'});
    // })
    // .catch(err => {
    //     res.status(400).json({status: 'failure', message: 'Following error occured when trying to make an exam', error: String(err)});
    //     // console.log(err);
    // });
    // console.log('Created new exam entry : ' + response);
    /**
     * have to handle errors of => adding an already existing student, trying to add a student without a required field
     */
    // res.json({status: 'created an exam successfully!'});
});

// call to read all exams
router.get('/exams/all', (req, res) => {
    const req_body = req.body;
    // console.log('Request body: ' + req_body);

    // const records = await admins.find(req_body);
    // console.log('Sending response: ' + records);

    exams.find()
    .then(result => res.json(result))
    .catch(err => res.status(400).json({status: 'failure', message: 'Error occured while trying to find all exams', error: String(err) }));
});

// deleting a single exam
// sends the shortname of the the updated course as a request parameter
router.delete('/exams/single/:name', (req, res) => {
    // console.log(req.params.name);
    exams.findOneAndDelete({name: req.params.name})
    .then(deleted => {
        if(deleted == null)
            res.status(400).json({status: 'failure', message: 'Exam with given shortname does not exist'});
        else {
            // deleting the exam rooms of the deleted exam
            exam_rooms.deleteMany({exam: deleted.name})
            .then(deleteCount => {
                // changing the hasExam = false for the relevant course f the deleted exam
                courses.findOne({shortname: deleted.course})
                .then(course => {
                    course.hasExam = false

                    course.save()    
                    .then(() => {
                        console.log(course.shortname + '.hasExam set to false after deleting the exam');
                        res.json({status: 'success', message: 'Deleted exam, deleted relevant exam rooms and hasExam of relevant course set to false', deletedExamEntry: deleted, numberOfExamRoomsDeleted: deleteCount});
                    })
                    .catch(err => res.status(400).json({status: 'failure', message: 'Error occured while trying to set hasExam of course to false', error: String(err)}));
                })
                .catch(err => res.status(400).json({status: 'failure', message: "Error occured while trying to find the course relevant to the deleted exam", error: String(err)}));
            })
            .catch(err => res.status(400).json({status: 'failure', message: 'Deleted the exam, but error occured while trying to delete relevant exam rooms', error: String(err) }));
        }
    })
    .catch(err => res.status(400).json({status: 'failure', message: "Error occured while trying to delete exam", error: String(err)}));   
});



////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////

/**
 * API calls to the exam_rooms collection
 */

// call to read all exams_rooms
router.get('/examrooms/all', (req, res) => {
    const req_body = req.body;
    // console.log('Request body: ' + req_body);

    // const records = await admins.find(req_body);
    // console.log('Sending response: ' + records);

    exam_rooms.find()
    .then(result => res.json(result))
    .catch(err => res.status(400).json({status: 'failure', message: 'Error occured while trying to find all exams rooms', error: String(err) }));
});
////////////////////////////////////////////////////////////////////////////////////////////////////////////

module.exports = router;