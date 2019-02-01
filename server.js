var players = [];

function Player(socketId, uuid, name) {
  this.socketId = socketId;
  this.uuid = uuid;
  this.name = name;
}

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

console.log("port is: " + port);

const uuidv4 = require('uuid/v4');
var express = require('express');
var app = express();
const server =  app.listen(port);
app.use(express.static('public'));
var socket = require('socket.io');
var io = socket(server);
io.sockets.on('connection', newConnection);
console.log("My server is running");

function removeConnection(socket) {
  console.log('Client has disconnected');
  console.log('User count ' + Object.keys(io.sockets.connected).length);
}

function newConnection(socket) {
  let uuid = uuidv4();
  players.push(new Player(socket.id, uuid, players.length + 1));
  let data = {
    socketId: socket.id,
    uuid: uuid,
    name: players.length,
  };
  socket.emit('yourData', data);

  console.log('New connection: socket.id: ' + socket.id);
  console.log('User count: ' + Object.keys(io.sockets.connected).length);

  if (players.length > 1) {
    io.emit('sendHost');
  }

  socket.on('sentHost',
    function(data) {
      socket.broadcast.emit('createPlayer', data);
    }
  );

  socket.on('updateHost',
    function(data) {
      socket.broadcast.emit('updatePlayer', data);
    }
  );

  socket.on('sendPlayerVisibility',
    function(data) {
      socket.broadcast.emit('setPlayerVisibility', data);
    }
  );

  socket.on('sendlaser',
    function(data) {
      socket.broadcast.emit('drawLaser', data);
    }
  );

  socket.on('killPlayer',
    function(data) {
      io.emit('updateKill', data);
    }
  );

  socket.on('disconnect',
    function() {
      let data = {
        socketId: socket.id,
        name: undefined
      }
      for (var i = players.length - 1; i >= 0; i--) {
        if (players[i].socketId == socket.id) {
          data.name = players[i].name;
          players.splice(i, 1);
        }
      }
      io.emit('removePlayer', data);
      removeConnection();
    }
  );
}
