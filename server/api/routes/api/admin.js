const express = require('express');
const mongoose = require('mongoose');

// importing the mongoose models ///////////////////////////////////////////////////////////////////////////////

const devices = require('../../models/devices');  // importing the mongoose model for the collection 'devices'
const admins = require('../../models/admins');  // importing the mongoose model for the collection 'admins'

////////// proctor accessible collections

const proctors = require('../../models/proctors');  // importing the mongoose model for the collection 'proctors'
const students = require('../../models/students');  // importing the mongoose model for the collection 'students'
const recordings = require('../../models/recordings');  // importing the mongoose model for the collection 'recordings'

////////// student accessible collections

const courses = require('../../models/courses');  // importing the mongoose model for the collection 'courses'
const exams = require('../../models/exams');  // importing the mongoose model for the collection 'exams'
const exam_rooms = require('../../models/exam_rooms');  // importing the mongoose model for the collection 'exam_rooms'

////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const router = express.Router();


/**
 * API calls to the admins collection
 */
// add new admin to the database
router.post('/admins', async (req, res) => {
    // method to add a new entry to the user relation in the database
    /**
     * write code to add student to the database
     */

    const record = req.body;
    console.log('Request body: ' + record);
    
    const response = await admins.create(record);  // response is the return value from mongoDB
    console.log('Created new admin entry: ' + response);
 
    res.json({status: 'Addded new admin to the database'});  // response after succcesfully creating a new exam schedule


    // redirecting to the login page after a successful registration
    // res.redirect('/*path of the page to redirect to after regitering */'); 
});

// reading administrator by email (REDUNDANT --> in proctor.js)
router.get('/admins', async (req, res) => {
    const req_body = req.body;
    console.log('Request body: ' + req_body);

    const records = await admins.find(req_body);
    console.log('Sending response: ' + records);

    res.json(records);
});

/**
 * API calls to the students collection
 */
// add new student to the database
router.post('/students', async (req, res) => {
    // method to add a new entry to the user relation in the database
    /**
     * write code to add student to the database
     */

    const record = req.body;
    console.log('Request body: ' + record);
    
    const response = await students.create(record);  // response is the return value from mongoDB
    console.log('Created new student entry: ' + response);
 
    res.json({status: 'Addded new student to the database'});  // response after succcesfully creating a new exam schedule


    // redirecting to the login page after a successful registration
    // res.redirect('/*path of the page to redirect to after regitering */'); 
});

/**
 * API calls to the proctors collection
 */
// add a new proctor to the database
router.post('/proctors', async (req, res) => {
    // method to add a new entry to the user relation in the database
    /**
     * write code to add student to the database
     */

    const record = req.body;
    console.log('Request body: ' + record);
    
    const response = await proctors.create(record);  // response is the return value from mongoDB
    console.log('Created new proctor entry: ' + response);
 
    res.json({status: 'Addded new proctor to the database'});  // response after succcesfully creating a new exam schedule


    // redirecting to the login page after a successful registration
    // res.redirect('/*path of the page to redirect to after regitering */'); 
});

/**
 * API calls to the courses collection
 */
// add a new course to the database
router.post('/courses', async (req, res) => {
    // method to add a new entry to the user relation in the database
    /**
     * write code to add student to the database
     */

    const record = req.body;
    console.log('Request body: ' + record);
    
    const response = await courses.create(record);  // response is the return value from mongoDB
    console.log('Created new course entry: ' + response);
 
    res.json({status: 'Addded new course to the database'});  // response after succcesfully creating a new exam schedule


    // redirecting to the login page after a successful registration
    // res.redirect('/*path of the page to redirect to after regitering */'); 
});

/**
 * API calls to the devices collection
 */
// add a new device to the database
router.post('/devices', async (req, res) => {
    // method to add a new entry to the user relation in the database
    /**
     * write code to add device to the database
     */

    const record = req.body;
    console.log('Request body: ' + record);
    
    const response = await devices.create(record);  // response is the return value from mongoDB
    console.log('Created new device entry: ' + response);
 
    res.json({status: 'Addded new device to the database'});  // response after succcesfully creating a new exam schedule


    // redirecting to the login page after a successful registration
    // res.redirect('/*path of the page to redirect to after regitering */'); 
});

/**
 * API calls to the exams collection
 */
// scheduling and exam (REDUNDANT --> in proctor.js)
router.post('/exams', async (req, res) => {
    /**
     * add code to add a new exam to the database
     * add a auto generated id 
     * have to generate a URL/link for the meeting and store in the database
     */

    const record = req.body;
    console.log('Request body: ' + record);

    const response = await exams.create(record);  // response is the return value from mongoDB
    console.log('Created new exam: ' + response);

    res.json({status: 'Addded new exam schedule'});  // response after succcesfully creating a new exam schedule
     
});
////////////////////////////////////////////////////////////////////////////////////////////////////////////

module.exports = router;