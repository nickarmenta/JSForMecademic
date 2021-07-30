const WebSocket = require('ws');

// Comms
var controlWebSocket;

var defaultIPAdress_ = "192.168.1.36"
adresse = 'ws://' + defaultIPAdress_ + ':10000';
controlWebSocket = new WebSocket(adresse);

controlWebSocket.onmessage = function (event) {
  var message = event.data.split('][');
  var code = parseInt(message[0].split('[')[1]);
  var response = message[1].split(']')[0];
  switch(code) {
      case 2007:
          var statuses = response.split(',');
          if(statuses[4]==1) {
              console.log('Robot is paused');
              SendMessage('ResumeMotion')
          }
          if(statuses[3]==1) {
              console.log('Robot is in error');
              SendMessage('ResetError')
          }
          break;
      case 2027:
          var coords = response.split(',');
          curPose.pose = [parseFloat(coords[0]),parseFloat(coords[1]),parseFloat(coords[2]),parseFloat(coords[3]),parseFloat(coords[4]),parseFloat(coords[5])]
          break;
      case 3001:
          process.exit(1);
          break;
      case 1011:
          SendMessage('ResetError');
          SendMessage('ResumeMotion');
  }
  console.log(code, response);
}

controlWebSocket.on('open', function open() { UpdateStatus(); shake(); });

function SendMessage(message) { controlWebSocket.send(message+'\0'); }

function UpdateStatus() { 
  SendMessage('GetStatusRobot');
  SendMessage('GetPose');
}

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

function checkLimits(pose) {
  console.log('Limit check: ', pose.pose)
  if(pose.poseType!='joint') {
    if(pose.moveType=='absolute') {
      if(pose.pose[0]<110) { return false; }
      if(pose.pose[0]>170) { return false; }
      if(pose.pose[1]<-160) { return false; }
      if(pose.pose[1]>60) { return false; }
      if(pose.pose[2]<20) { return false; }
      if(pose.pose[2]>200) { return false; }
    } else if(pose.moveType=='relative') {
        if(curPose.pose[0]+pose.pose[0]<110) { return false; }
        if(curPose.pose[0]+pose.pose[0]>160) { return false; }
        if(curPose.pose[1]+pose.pose[1]<-160) { return false; }
        if(curPose.pose[1]+pose.pose[1]>50) { return false; }
        if(curPose.pose[2]+pose.pose[2]<20) { return false; }
        if(curPose.pose[2]+pose.pose[2]>200) { return false; }
    } else {
      return false;
    }
  }
  return true;
}

function translatePose(pose) { 
    pose.pose[0]+=120;
    pose.pose[1]-=140;
    pose.pose[2]+=40;
    return pose;
}

function Move(pose) {
    console.log('Target pose: '+pose.pose)
    console.log('Target pose type: '+pose.moveType)

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


function issueCommand(command) {
    var targetPose = new Pose([0,0,0,0,0,0], moveType='relative');
    // Movement distance
    var dist = 25
    var command = message.split('!')[1]

    if(command.startsWith('move')) {
        // extract list of coordinates
        targetPose.workFrame='work';
        targetPose.moveType='absolute';
        try {
            var pose = command.split('move')[1].split('(')[1].split(')')[0].split(',');
            console.log('original pose: ', pose);
            if(pose.length==3) {
                for(i=0;i<3; i++) {
                    pose[i] = parseFloat(pose[i]);
                }
                targetPose.pose = [pose[0],pose[1],pose[2],-180,0,-90];
                targetPose = translatePose(targetPose);
                console.log('translated pose: ', targetPose.pose);
            } else { client.say(target, `Enter values for x, y, and z!`); }
        }
        catch(err) {
            client.say(target, `Needs to be move(x,y,z)`);
        }
    } else {
        // If high-level command is known, let's execute it
        switch(command) {
            case 'up':
                targetPose.pose[2]=dist;
                targetPose.workFrame = 'work';
                break;
            case 'down':
                targetPose.pose[2]=-dist;
                targetPose.workFrame = 'work';
                break;
            case 'left':
                targetPose.pose[1]=-dist;
                targetPose.workFrame = 'work';
                break;
            case 'right':
                targetPose.pose[1]=dist;
                targetPose.workFrame = 'work';
                break;
            case 'back':
                targetPose.pose[0]=dist;
                targetPose.workFrame = 'work';
                break;
            case 'forward':
                targetPose.pose[0]=-dist;
                targetPose.workFrame = 'work';
                break;
            case 'turbo':
                SetSpeed(90);
                break;
            case 'slomo':
                SetSpeed(15);
                break;
            case 'shake':
                shake();
                break;
        }
    }
    if(checkLimits(targetPose)==false) {
        client.say(target, 'Move outside robot limits!');
    } else  { Move(targetPose); }
}

function shake() {
    SetSpeed(60);
    SendMessage('SetTRF(0,0,-50,0,0,0)');
    SendMessage('SetBlending(90)');
    var startPose = new Pose([140,16,250,-180,0,0]);
    var wigglePose = new Pose([0,0,0,-5,0,0], moveType='relative');
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

// Register our event handlers (defined below)
client.on('message', onMessageHandler);
client.on('connected', onConnectedHandler);

// Connect to Twitch:
client.connect();

// Called every time a message comes in
function sendCommand (target, context, msg, self) {
    UpdateStatus();
    console.log('Command: ', message)
    issueCommand(message)
}
