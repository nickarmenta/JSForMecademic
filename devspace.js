const WebSocket = require('ws');

/*
// Comms
const robotaddress = '192.168.1.30'
const socketURL = 'ws://' + robotaddress + ':10000';
robotsocket = new WebSocket(socketURL);


// Format messge for transmission
function SendMessage(message) {
    robotsocket.send(message+'\0');
}


function UpdateStatus() { 
    SendMessage('GetStatusRobot');
    SendMessage('GetPose');
}


robotsocket.onmessage = function (event) { 
    // Parse robot message
    // Example message: [2007][PAUSED]
    const message = event.data.split('][');
    const code = parseInt(message[0].split('[')[1]);
    const response = message[1].split(']')[0];
    switch(code) {
        // Determine error
        case 2007:
            const statuses = response.split(',');
            if(statuses[4]==1) {
                console.log('Robot is paused');
            }
            if(statuses[3]==1) {
                console.log('Robot is in error');
            }
            break;
        // Receive coordinates 
        case 2027:
            const coords = response.split(',');
            const pose = [parseFloat(coords[0]),parseFloat(coords[1]),parseFloat(coords[2]),parseFloat(coords[3]),parseFloat(coords[4]),parseFloat(coords[5])]
            break;
        // Ignore
        case 3001:
            process.exit(1);
        // Override error
        case 1011:
            console.log('Robot is in error');
    }
    // Log response
    console.log(code, response);
}


robotsocket.on('open', function open() { UpdateStatus(); });


// Format messge for transmission
function SendMessage(socket, message) {
    socket.send(message+'\0');
}


function UpdateStatus(socket) { 
    SendMessage(socket, 'GetStatusRobot');
    SendMessage(socket, 'GetPose');
}

class Robot {
    constructor(
        address='192.168.0.100',
        axes=6,
        workFrame='tool',
        tool=[0,0,0,0,0,0],
        work=[0,0,0,0,0,0]
    ) {
        this.axes = axes;
        this.workFrame = workFrame;
        this.tool = tool;
        this.work = work;
        // May want to set default speed later
        this.speed = 10;
        const socketURL = 'ws://' + address + ':10000';
        this.socket = new WebSocket(socketURL);
        this.socket.onmessage = function (event) { 
            // Parse robot message
            // Example message: [2007][PAUSED]
            const message = event.data.split('][');
            const code = parseInt(message[0].split('[')[1]);
            const response = message[1].split(']')[0];
            switch(code) {
                // Determine error
                case 2007:
                    const statuses = response.split(',');
                    if(statuses[4]==1) {
                        console.log('Robot is paused');
                    }
                    if(statuses[3]==1) {
                        console.log('Robot is in error');
                    }
                    break;
                // Receive coordinates 
                case 2027:
                    const coords = response.split(',');
                    this.pose = [parseFloat(coords[0]),parseFloat(coords[1]),parseFloat(coords[2]),parseFloat(coords[3]),parseFloat(coords[4]),parseFloat(coords[5])]
                    break;
                // Ignore
                case 3001:
                    process.exit(1);
                // Override error
                case 1011:
                    console.log('Robot is in error');
            }
            // Log response
            console.log(code, response);
        }
        this.socket.on('open', function open() {
            UpdateStatus(this.socket);
            console.log('Connected!');
        });
    }
}

var mecademic = new Robot(address='192.168.1.30');
*/

class Robot {
    constructor(
        axes=6,
        workFrame='tool',
        tool=[0,0,0,0,0,0],
        work=[0,0,0,0,0,0]
    ) {
        console.log('Hello!');
        this.connected = false
    }

    // Format messge for transmission
    SendMessage(message) {
        this.socket.send(message+'\0');
    }

    UpdateStatus() { 
        this.SendMessage('GetStatusRobot');
        this.SendMessage('GetPose');
    }

    Connect(address) {
        const socketURL = 'ws://' + address + ':10000';
        this.socket = new WebSocket(socketURL);
        this.socket.onmessage = function (event) { 
            // Parse robot message
            // Example message: [2007][PAUSED]
            const message = event.data.split('][');
            const code = parseInt(message[0].split('[')[1]);
            const response = message[1].split(']')[0];
            switch(code) {
                // Determine error
                case 2007:
                    const statuses = response.split(',');
                    if(statuses[4]==1) {
                        console.log('Robot is paused');
                    }
                    if(statuses[3]==1) {
                        console.log('Robot is in error');
                    }
                    break;
                // Receive coordinates 
                case 2027:
                    const coords = response.split(',');
                    const pose = [parseFloat(coords[0]),parseFloat(coords[1]),parseFloat(coords[2]),parseFloat(coords[3]),parseFloat(coords[4]),parseFloat(coords[5])]
                    break;
                // Ignore
                case 3001:
                    process.exit(1);
                // Override error
                case 1011:
                    console.log('Robot is in error');
            }
            // Log response
            console.log(code, response);
        }

        this.socket.on('open', function open() {
            console.log('Connected to robot at'+address);
            this.connected = true;
        });
    }

    Test() {
        console.log('In Test');
    }

    CallTest() {
        this.Test();
    }
}

var mecademic = new Robot();
mecademic.CallTest();
mecademic.Connect('192.168.1.30');
