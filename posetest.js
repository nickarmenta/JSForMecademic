const WebSocket = require('ws');

// Comms
const defaultIPAddress = "192.168.1.30"
address = 'ws://' + defaultIPAddress + ':10000';
const controlWebSocket = new WebSocket(address);

// Format messge for transmission
function SendMessage(message) { controlWebSocket.send(message+'\0'); }


// Read message from robot
controlWebSocket.onmessage = function (event) {
    // Parse robot message
    // Example message: [2007][PAUSED]
    const message = event.data.split('][');
    const code = parseInt(message[0].split('[')[1]);
    const response = message[1].split(']')[0];
    switch(code) {
        // Determine error and override  
        case 2007:
            const statuses = response.split(',');
            if(statuses[4]==1) {
                console.log('Robot is paused');
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
            curPose.pose = [parseFloat(coords[0]),parseFloat(coords[1]),parseFloat(coords[2]),parseFloat(coords[3]),parseFloat(coords[4]),parseFloat(coords[5])]
            break;
        // Ignore
        case 3001:
            process.exit(1);
            break;
        // Override error
        case 1011:
            SendMessage('ResetError');
            SendMessage('ResumeMotion');
  }
  // Log response
  console.log(code, response);
}

function UpdateStatus() { 
    SendMessage('GetStatusRobot');
    SendMessage('GetPose');
}

// Run test function
controlWebSocket.on('open', function open() { UpdateStatus(); shake(); });

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


function Move(pose) {
    if(pose.moveType=='absolute') {
        switch(pose.poseType) {
            case 'joint':
                moveCommand = 'MoveJoints('
                break;
            case 'pose':
                moveCommand = 'MovePose('
                break;
            case 'linear':
                moveCommand = 'MoveLin('
                break;
        }
    } else if(pose.moveType=='relative') {
        switch(pose.workFrame) {
            case 'tool':
                moveCommand = 'MoveLinRelTRF('
                break;
            case 'work':
                moveCommand = 'MoveLinRelWRF('
                break;
        }
    }
    SendMessage(moveCommand+pose.pose[0]+','+pose.pose[1]+','+pose.pose[2]+','+pose.pose[3]+','+pose.pose[4]+','+pose.pose[5]+')')
}

// Ease of use 0-100% global speed adjustment
function SetSpeed(percentage) {
    SendMessage('SetCartAcc('+percentage+')');
    SendMessage('SetCartAngVel('+3*percentage+')');
    SendMessage('SetCartLinVel('+10*percentage+')');
    SendMessage('SetJointAcc('+1.5*percentage+')');
    SendMessage('SetJointVel('+percentage+')');
}


function shake() {
    SetSpeed(60);
    SendMessage('SetTRF(0,0,-50,0,0,0)');
    SendMessage('SetBlending(90)');
    const startPose = new Pose([140,16,250,-180,0,0]);
    const wigglePose = new Pose([0,0,0,-5,0,0], moveType='relative');
    Move(startPose);
    Move(wigglePose);
    wigglePose.pose[3] = 10;
    for(i=0;i<6;i++) {
        Move(wigglePose);
        wigglePose.pose[3] *= -1;
    }
    SendMessage('SetTRF(0,0,0,0,0,0)');
}


var curPose = new Pose([0,0,0,0,0,0]);
