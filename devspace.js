const WebSocket = require('ws');

// Comms
const address = '192.168.1.30'
const socketURL = 'ws://' + address + ':10000';
const socket = new WebSocket(socketURL);


// Format messge for transmission
function SendMessage(message) {
    socket.send(message+'\0');
}


function UpdateStatus() { 
    SendMessage('GetStatusRobot');
    SendMessage('GetPose');
}


socket.onmessage = function (event) { 
    // Parse robot message
    // Example message: [2007][PAUSED]
    const message = event.data.split('][');
    const code = parseInt(message[0].split('[')[1]);
    const response = message[1].split(']')[0];
    switch(code) {
        // Home if not homed
        case 1005:
            console.log('Robot not activated! Activating...');
            SendMessage('ActivateRobot');
        case 1006:
            console.log('Robot not homed! Homing...');
            SendMessage('Home');
        // Override error
        case 1011:
            console.log('Robot is in error! Clearing error...');        // Determine error
            SendMessage('ResetError');
            SendMessage('ResumeMotion');
        case 2007:
            const statuses = response.split(',');
            if(statuses[4]==1) {
                console.log('Robot is pauseod');
                SendMessage('ResumeMotion')
            }
            if(statuses[3]==1) {
                console.log('Robot is in error');
                SendMessage('ResetError')
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

    }
    // Log response
    console.log(code, response);
}



// Read message from
// Robot stuff
class Pose {
    constructor(
        pose,
        moveType='absolute',
        poseType='pose',
        workFrame='tool',
        tool=[0,0,0,0,0,0],
        work=[0,0,0,0,0,0]
    ) {
        this.pose = pose;
        this.moveType = moveType;
        if(moveType=='relative') { this.poseType = 'pose'; }
        else { this.poseType = poseType; }
        this.workFrame = workFrame;
        this.tool = tool;
        this.work = work;
    }
}


class Robot {
    constructor(
        axes=6,
        workFrame='tool',
        tool=[0,0,0,0,0,0],
        work=[0,0,0,0,0,0]
    ) {
        this.connected = false;
        this.axes = axes;
        this.workFrame = workFrame;
        this.tool = tool;
        this.work = work;
        this.home = new Pose([140,16,250,-180,0,0]); 
    }

    Move(pose) {
        var moveCommand = '';
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
        SendMessage(moveCommand+pose.pose[0]+','+pose.pose[1]+','+pose.pose[2]+','+pose.pose[3]+','+pose.pose[4]+','+pose.pose[5]+')')
        this.pose = pose;
    }

    Home() {
        this.Move(this.home);
    }

    Speed(percentage) {
        this.speed = percentage;
        SendMessage('SetCartAcc('+this.speed+')');
        SendMessage('SetCartAngVel('+3*this.speed+')');
        SendMessage('SetCartLinVel('+10*this.speed+')');
        SendMessage('SetJointAcc('+1.5*this.speed+')');
        SendMessage('SetJointVel('+this.speed+')');
    }

    Defaults() {
        this.Speed(25);
        SendMessage('SetBlending(0)');
        SendMessage('SetTRF(0,0,0,0,0,0)');
        SendMessage('SetWRF(0,0,0,0,0,0)');
        this.tool=[0,0,0,0,0,0];
        this.work=[0,0,0,0,0,0];
        this.home = new Pose([140,16,250,-180,0,0]); 
    }
}

var mecademic = new Robot();
const startPose = new Pose([140,16,250,-180,0,0]);

function shake(robot) {
    robot.Speed(60);
    robot.Loose();
    SendMessage('SetTRF(0,0,-50,0,0,0)');
    SendMessage('SetBlending(90)');
    const wigglePose = new Pose([0,0,0,-5,0,0], moveType='relative');
    robot.Move(startPose);
    robot.Move(wigglePose);
    wigglePose.pose[3] = 10;
    for(i=0;i<6;i++) {
        robot.Move(wigglePose);
        wigglePose.pose[3] *= -1;
    }
    robot.Defaults();
}


function bounce(robot, dist=25, loops=2) {
    robot.Speed(20);
    SendMessage('SetBlending(10)');
    const bouncePose = new Pose([0,0,dist,0,0,0], moveType='relative');
    robot.Move(startPose);
    for(i=0;i<loops;i++) {
        robot.Move(bouncePose);
        bouncePose.pose[2] *= -1;
    }
    robot.Defaults();
}


function dance(robot) {
    const value = 0;
}

socket.on('open', function open() {
    UpdateStatus();
    console.log('Connected!');
    shake(mecademic);
    bounce(mecademic);
});
