const WebSocket = require('ws');


// Read message from
// Robot stuff
class Pose {
    constructor(pose, moveType='absolute', poseType='pose', workFrame='tool', tool=[0,0,0,0,0,0], work=[0,0,0,0,0,0]) {
        this.pose = pose;
        this.moveType = moveType;
        if(moveType=='relative') { this.poseType = 'pose'; }
        else { this.poseType = poseType; }
        this.workFrame = workFrame;
        this.tool = tool;
        this.work = work;
    }
}


// Format messge for transmission
function SendMessage(socket, message) {
    socket.send(message+'\0');
}


function UpdateStatus(socket) { 
    SendMessage(socket, 'GetStatusRobot');
    SendMessage(socket, 'GetPose');
}


const ReadMessage = function (event) { 
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


class Robot {
    constructor(
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
    }

    Connect(address) {
        // Comms
        const socketURL = 'ws://' + address + ':10000';
        this.socket = new WebSocket(socketURL);
        // this.socket.onmessage = ReadMessage;
        // this.socket.on('open', function open() { UpdateStatus(this.socket); });
    }

    Move(pose) {
        if(pose.moveType=='absolute') {
            switch(pose.poseType) {
                case 'joint':
                    moveCommand = 'MoveJoints(';
                    break;
                case 'pose':
                    moveCommand = 'MovePose(';
                    break;
                case 'linear':
                    moveCommand = 'MoveLin(';
                    break;
            }
        } else if(pose.moveType=='relative') {
            switch(pose.workFrame) {
                case 'tool':
                    moveCommand = 'MoveLinRelTRF(';
                    break;
                case 'work':
                    moveCommand = 'MoveLinRelWRF(';
                    break;
            }
        }
        SendMessage(this.socket, moveCommand+pose.pose[0]+','+pose.pose[1]+','+pose.pose[2]+','+pose.pose[3]+','+pose.pose[4]+','+pose.pose[5]+')')
        this.pose = pose;
    }

    Speed(percentage) {
        this.speed = percentage;
        SendMessage(this.socket, 'SetCartAcc('+percentage+')');
        SendMessage(this.socket, 'SetCartAngVel('+3*percentage+')');
        SendMessage(this.socket, 'SetCartLinVel('+10*percentage+')');
        SendMessage(this.socket, 'SetJointAcc('+1.5*percentage+')');
        SendMessage(this.socket, 'SetJointVel('+percentage+')');
    }
}


var mecademic = new Robot;
mecademic.Connect('192.168.1.30')

function shake(robot) {
    robot.Speed(60);
    robot.SendMessage(robot.socket, 'SetTRF(0,0,-50,0,0,0)');
    robot.SendMessage(robot.socket, 'SetBlending(90)');
    const startPose = new Pose([140,16,250,-180,0,0]);
    const wigglePose = new Pose([0,0,0,-5,0,0], moveType='relative');
    robot.Move(startPose);
    robot.Move(wigglePose);
    wigglePose.pose[3] = 10;
    for(i=0;i<6;i++) {
        robot.Move(wigglePose);
        wigglePose.pose[3] *= -1;
    }
    robot.SendMessage(robot.socket, 'SetTRF(0,0,0,0,0,0)');
}

// Run test function
