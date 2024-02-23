const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const schemas = require('../models/schemas');


router.post('/contact/:a', async (req, res) => {
    const { name, email, phone, address, website, message } = req.body;
    const action = req.params.a;

    switch (action) {
        case "send":
            const contactData = { name, email, phone, address, website, message };
            const newContact = new schemas.Contact(contactData);

            try {
                const saveContact = await newContact.save();
                res.send('Message sent. Thank you.');
            } catch (error) {
                console.error('Error saving contact:', error);
                res.status(500).send('Failed to send message.');
            }
            break;

        default:
            res.status(400).send('Invalid Request');
            break;
    }
});

router.get('/users', async (req, res) => {
    try {
        const users = await schemas.Users.find({}).exec();
        if (users.length > 0) {
            res.send(JSON.stringify(users));
        } else {
            res.status(404).send('Users not found.');
        }
    } catch (error) {
        console.error('Error retrieving users:', error);
        res.status(500).send('Internal Server Error');
    }
});



// POST method for saving users data 
router.post('/users', async (req, res) => {
    const { name, email, phone, address, userId, password, role } = req.body;
  
    try {
      // Check if user with the same email or userId already exists
      const existingUser = await schemas.Users.findOne({ $or: [{ email }, { userId }] });
  
      if (existingUser) {
          return res.status(400).send('User with the same email or userId already exists.');
      }
  
      // Hash the password before saving
      const hashedPassword = await bcrypt.hash(password, 10);
  
      // Create a new user
      const newUser = new schemas.Users({ name, email, phone, address, userId, password: hashedPassword, role });
      const savedUser = await newUser.save();
  
      res.status(201).json(savedUser);
    } catch (error) {
      console.error('Error creating user:', error);
      res.status(500).send('Internal Server Error');
    }
  });
  




// POST method for user login
router.post('/login', async (req, res) => {
    const { userId, password } = req.body;

    try {
        // Check if the user exists
        const user = await schemas.Users.findOne({ userId });

        if (!user) {
            console.log('User Not Exist');
            return res.status(401).send('Invalid User');
        }

        // Compare the entered password with the hashed password
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            console.log('Invalid Password');
            return res.status(401).send('Invalid credentials');
        }

        // If credentials are valid, generate a token with user information, including role
        const token = jwt.sign({ userId: user.userId, role: user.role }, 'your-secret-key', { expiresIn: '1h' });

        // Send the token along with user role in the response
        res.json({ token, role: user.role });
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).send('Internal Server Error');
    }
});



// Example route to check user role
router.get('/check-role', (req, res) => {
    const token = req.headers.authorization;

    if (!token) {
        return res.status(401).json({ error: 'Authorization header missing' });
    }

    try {
        const decodedToken = jwt.verify(token.split(' ')[1], 'your-secret-key');
        const userRole = decodedToken.role;
        res.json({ role: userRole });
    } catch (error) {
        console.error('Error decoding token:', error);
        res.status(401).json({ error: 'Invalid token' });
    }
});



// Route to change user role
router.post('/change-role', async (req, res) => {
    const { userId, newRole } = req.body;

    try {
        // Find the user by userId and update the role
        const updatedUser = await schemas.Users.findOneAndUpdate({ userId }, { role: newRole }, { new: true });

        if (!updatedUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Generate a new token with updated user information
        const token = jwt.sign({ userId: updatedUser.userId, role: updatedUser.role }, 'your-secret-key', { expiresIn: '1h' });

        res.json({ token, role: updatedUser.role });
    } catch (error) {
        console.error('Error changing user role:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});



// Change the backend route for fetching users to /all-users
router.get('/all-users', async (req, res) => {
    try {
        const users = await schemas.Users.find({}).exec();
        if (users.length > 0) {
            res.send(JSON.stringify(users));
        } else {
            res.status(404).send('Users not found.');
        }
    } catch (error) {
        console.error('Error retrieving users:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Updating User details
// Existing endpoint for updating user details
router.post('/update-User', async (req, res) => {
  const { userId, ...updatedUserData } = req.body;

  try {
    const updatedUser = await schemas.Users.findOneAndUpdate({ userId }, updatedUserData, { new: true });

    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});




// Delete user endpoint
router.delete('/delete-user/:userId', async (req, res) => {
    const userIdToDelete = req.params.userId;

    console.log('Deleting user with userId:', userIdToDelete);

    try {
        // Find the user by userId and delete it
        const deletedUser = await schemas.Users.findOneAndDelete({ userId: userIdToDelete });

        if (!deletedUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

  

  
module.exports = router;
