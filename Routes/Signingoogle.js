const express = require('express');
const { OAuth2Client } = require('google-auth-library'); // Import the Google OAuth2 client
const dotenv = require('dotenv');
const mongoose = require("mongoose"); // Import mongoose module that will be used to connect to MongoDB.
const User = require('../Models/User'); // Import the User model
const { verify } = require('jsonwebtoken');

dotenv.config();

const router = express.Router();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID); // Initialize the client with the environment variable

// Session middleware (consider adding this middleware if needed)
router.use(express.json()); // Ensure you can parse JSON request bodies

// Google sign-in endpoint
router.post('/', async (req, res) => {
  const { token } = req.body;
  console.log('Received token:', token);
  
  let payload;
  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID, // Use the environment variable
    });
    console.log('Verification ticket:', ticket);
    payload = ticket.getPayload();
    console.log('Payload:', payload);
  } catch (error) {
    console.error('Error verifying token:', error);
    return res.status(401).json({ error: 'Invalid token' });
  }

  const { email, name } = payload;
  console.log('Processing user:', name);

  try {
    // Check if the user exists in the database
    let user = await User.findOne({ email });

    // If the user does not exist, create a new one
    if (!user) {
      user = new User({
        email,
        name,
        password: 'google', // Consider using a hashed password for security
        user_type: null, // Set user type
        verify: true, // Set user as verified
        is_google: true, // Set user as a Google user
      });
      await user.save(); // Save the new user to the database
      console.log('User created:', user);
    } else {
      verifyuser=await User.findOneAndUpdate({email},{verify:true})

      
      
      console.log('User already exists:', verifyuser);
    }

    // Send the response once
    res.status(200).json({ message: 'User processed successfully', user });

  } catch (error) {
    console.error('Error with Google sign-in:', error);
    if (!res.headersSent) { // Ensure that headers haven't been sent before sending an error response
      res.status(500).json({ error: 'Internal server error' });
      
    }
  }
});

module.exports = router;
