// Require necessary modules and dependencies
const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const mongoose = require('mongoose');

// Create an instance of the express application
const app = express();

// middleware to parse incoming requests with JSON payloads
app.use(express.json());
app.use(express.urlencoded({ extended: false }));


const server = http.createServer(app);
const io = socketio(server);

// Connect to MongoDB
mongoose.connect('mongodb://127.0.0.1/socialmedia-chat-app', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Connected to MongoDB successfully');
}).catch((error) => {
    console.log('Error connecting to MongoDB', error);
});

// Define schema for messages
const MessageSchema = new mongoose.Schema({
    text: String,
    sender: String,
    created: { type: Date, default: Date.now }
});

// Create a Message model using the schema
const Message = mongoose.model('Message', MessageSchema);

// Serve static files
app.use(express.static(__dirname + '/public'));



// Set up a route to handle incoming messages
app.post('/messages', async (req, res) => {
    try {
        const message = await Message.create(req.body);
        console.log('Message saved to MongoDB', message);

    } catch (error) {
        console.log('Error saving message to MongoDB', error);
    }

    // Send the message to all connected users
    io.emit('message', req.body);
});

// Listen for incoming socket connections
io.on('connection', async (socket) => {
    console.log('User connected');

    // Get all messages from MongoDB
    const messages = await Message.find({});
    // Send the messages to the user that just connected
    socket.emit('messages', messages);

    // Listen for a disconnect event
    socket.on('disconnect', () => {
        console.log('User disconnected');
    });



});

// Start the server
const port = 3000;
server.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
});
