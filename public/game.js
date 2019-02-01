var prevTime, sensitivity, velocity, models, blocker, instructions, crosshair, values, leaderBoard, ammoUI, element, me, camera, scene, matrix4, renderer, light, ambient, sortArray, socket, id1, controls, point, position, angle, direction, raycaster, quaternion, intersected = false, showGun = true, rtime = 3000, RESOURCES_LOADED = false, noclip = false, startGame = false, textChanged = false, meshes = {}, players = [], lasers = [], intersectedPlayer = '', controlsEnabled = false, moveForward = false, moveBackward = false, moveLeft = false, moveRight = false, moveUp = false, moveDown = false;

init();
animate();

function init() {
  me = {
    name: undefined,
    socketId: undefined,
    uuid: undefined,
    score: 0,
    canFire: true,
    ammo: 2,
    visible: false,
    dead: false,
  }
  blocker = document.getElementById('blocker');
  instructions = document.getElementById('instructions');
  crosshair = document.getElementById('crosshair');
  values = document.getElementsByClassName('values');
  leaderBoard = document.getElementById('players');
  ammoUI = document.getElementById('ammoUI');
  sensitivity = document.getElementById('sensitivity');

  models = {
    map: {
      obj: "map.obj",
      mtl: "map.mtl",
      mesh: null
    },
    player: {
      obj: "player.obj",
      mtl: "player.mtl",
      mesh: null
    },
    laser: {
      obj: "Laser_Rifle.obj",
      mtl: "Laser_Rifle.mtl",
      mesh: null
    },
  }
	var loadingManager = null;

	camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
  scene = new THREE.Scene();
	renderer = new THREE.WebGLRenderer();
	renderer.setSize( window.innerWidth, window.innerHeight);
	renderer.shadowMap.enabled = true;
	renderer.shadowMap.type = THREE.BasicShadowMap;
	renderer.shadowMap.MapSize = new THREE.Vector2(2048, 2048);
  renderer.setPixelRatio( window.devicePixelRatio );

	loadingManager = new THREE.LoadingManager();
	loadingManager.onProgress = function(item, loaded, total){
		//console.log(item, loaded, total);
	};
	loadingManager.onLoad = function(){
		console.log("loaded all resources");
		RESOURCES_LOADED = true;
		onResourcesLoaded();
	};

	for( var _key in models ){
		(function(key){
			var mtlLoader = new THREE.MTLLoader(loadingManager);
			mtlLoader.load(models[key].mtl, function(materials){
				materials.preload();

				var objLoader = new THREE.OBJLoader(loadingManager);

				objLoader.setMaterials(materials);
				objLoader.load(models[key].obj, function(mesh){

					mesh.traverse(function(node){
						if( node instanceof THREE.Mesh ){
              if (node !== undefined && key == "player") {
								node.geometry.translate(0, -1, 0);
							}
							if (node !== undefined && key == "gun") {
								node.geometry.translate(4, -4.8, -10);
							}
							if (node !== undefined && key == "laser") {
								node.geometry.rotateX(-Math.PI/2);
								node.geometry.rotateY(Math.PI/2);
								node.geometry.translate(10, -19, -17);
							}
							node.castShadow = false;
							node.receiveShadow = false;
						}
					});
					models[key].mesh = mesh;

				});
			});

		})(_key);
	}

	controls = new THREE.PointerLockControls( camera );
	controls.getObject().position.y = 5.76;
  spawnLocation();
	document.body.appendChild( renderer.domElement);
	scene.add( controls.getObject() );
	var keyDown = function ( event ) {
		switch ( event.keyCode ) {
			case 38: // up
				moveUp = true;
				break;
			case 87: // w
				moveForward = true;
				break;
			case 65: // a
				moveLeft = true; break;
			case 40: // down
				moveDown = true;
				break;
			case 83: // s
				moveBackward = true;
				break;
			case 68: // d
				moveRight = true;
				break;
		}
	};
	var keyUp = function ( event ) {
		switch( event.keyCode ) {
			case 38: // up
				moveUp = false
			break;
			case 87: // w
				moveForward = false;
				break;
			case 65: // a
				moveLeft = false;
				break;
			case 40: // down
				moveDown = false;
				break;
			case 83: // s
				moveBackward = false;
				break;
			case 68: // d
				moveRight = false;
				break;
		}
	};
	document.addEventListener( 'keydown', keyDown, false );
	document.addEventListener( 'keyup', keyUp, false );


  var havePointerLock = 'pointerLockElement' in document || 'mozPointerLockElement' in document || 'webkitPointerLockElement' in document;

  if ( havePointerLock ) {
  	element = document.body;
  	var pointerlockchange = function ( event ) {
  		if ( document.pointerLockElement === element || document.mozPointerLockElement === element || document.webkitPointerLockElement === element) {
        controlsEnabled = true;
  		  controls.enabled = true;
  		  blocker.style.display = 'none';
        sensitivity.style.visibility = 'hidden';
        crosshair.style.visibility = 'visible';
        leaderBoard.style.visibility = 'visible';
        ammoUI.style.visibility = 'visible';
        me.visible = true;
        meshes["laser"].visible = true;
        let data = {
          from: me.socketId,
          visible: true,
        }
        socket.emit('sendPlayerVisibility', data);
  		} else {
        crosshair.style.visibility = 'hidden';
  			controlsEnabled = false;
        leaderBoard.style.visibility = 'hidden';
        ammoUI.style.visibility = 'hidden';
  			blocker.style.display = '-webkit-box';
  			blocker.style.display = '-moz-box';
  			blocker.style.display = 'box';
  			instructions.style.display = '';
        sensitivity.style.visibility = 'visible';
        if (me.dead) {
          let data = {
            from: me.socketId,
            visible: false,
          }
          socket.emit('sendPlayerVisibility', data);
        }
  		}
  	};
  	var pointerlockerror = function ( event ) {
  		instructions.style.display = '';
      console.log("Error");
  	};
  	document.addEventListener( 'pointerlockchange', pointerlockchange, false );
  	document.addEventListener( 'mozpointerlockchange', pointerlockchange, false );
  	document.addEventListener( 'webkitpointerlockchange', pointerlockchange, false );
  	document.addEventListener( 'pointerlockerror', pointerlockerror, false );
  	document.addEventListener( 'mozpointerlockerror', pointerlockerror, false );
  	document.addEventListener( 'webkitpointerlockerror', pointerlockerror, false );
    document.addEventListener("click", shoot);
  	instructions.addEventListener( 'click', function ( event ) {
  		if (RESOURCES_LOADED && me.dead == false) {
  		instructions.style.display = 'none';
  		// Ask the browser to lock the pointer
  		element.requestPointerLock = element.requestPointerLock || element.mozRequestPointerLock || element.webkitRequestPointerLock;
  		if ( /Firefox/i.test( navigator.userAgent ) ) {
  			var fullscreenchange = function ( event ) {
  				if ( document.fullscreenElement === element || document.mozFullscreenElement === element || document.mozFullScreenElement === element ) {
  					document.removeEventListener( 'fullscreenchange', fullscreenchange );
  					document.removeEventListener( 'mozfullscreenchange', fullscreenchange );
  					element.requestPointerLock();
  				}
  			};
  			document.addEventListener( 'fullscreenchange', fullscreenchange, false );
  			document.addEventListener( 'mozfullscreenchange', fullscreenchange, false );
  			element.requestFullscreen = element.requestFullscreen || element.mozRequestFullscreen || element.mozRequestFullScreen || element.webkitRequestFullscreen;
  			element.requestFullscreen();
  		} else {
  			element.requestPointerLock();
  		}
                  }
  	}, false );
  } else {
  	instructions.innerHTML = 'Your browser doesn\'t seem to support Pointer Lock API';
  }

  prevTime = performance.now();
  velocity = new THREE.Vector3();
  angle = new THREE.Euler();
  matrix4 = new THREE.Matrix4();
  quaternion = new THREE.Quaternion();
  raycaster = new THREE.Raycaster();
  direction = new THREE.Vector3();

  socket = io.connect('https://limitless-shelf-74745.herokuapp.com');
  //socket = io.connect('localhost:3000');
  socket.on('createPlayer', function(data){checkResourcesLoaded(data)});
  socket.on('yourData', function(data){me.socketId = data.socketId; me.uuid = data.uuid; me.name = data.name});
  socket.on('removePlayer', function(data){removePlayer(data)});
  socket.on('sendHost', function(){sendHost()});
  socket.on('updatePlayer', function(data){updateOtherPlayers(data)});
  socket.on('updateKill', function(data){updateKill(data)});
  socket.on('drawLaser', function(data){drawLaser(data)});
  socket.on('setPlayerVisibility', function(data){setPlayerVisibility(data)});


	light = new THREE.DirectionalLight( 0xffffff, 0.5 );
  light.position.set(0, 50, 0);
  light.castShadow = true;
  scene.add( light );

  ambient = new THREE.AmbientLight( 0xffffff, 0.5 );
  scene.add( ambient );
}

function animate() {
	requestAnimationFrame( animate );
  if (RESOURCES_LOADED == true && textChanged == false) {
	  document.getElementById("text").innerHTML = "Click to Play";
	  textChanged = true;
    if (players.length < 1) {
      setLeaderBoard([1, 0, "M"]);
    }
  }
	if (RESOURCES_LOADED) {
    //document.getElementById("intersected").innerHTML = intersected;
    //document.getElementById("intersectedPlayer").innerHTML = intersectedPlayer;
    document.getElementById("myammo").innerHTML = me.ammo;
    updatePlayers();
    controls.getDirection( direction );
	  var time = performance.now();
	  var delta = ( time - prevTime) / 1000;
	  velocity.x -= velocity.x * 10.0 * delta;
	  velocity.z -= velocity.z * 10.0 * delta;
	  //velocity.y -=  9.8 * 100.0 * delta; // 100.0 = mass
	  moving(delta);
	  if (controlsEnabled) {
      controls.getObject().translateX( velocity.x * delta );
  	  controls.getObject().translateY( velocity.y * delta );
  	  controls.getObject().translateZ( velocity.z * delta );
      checkIntersect();
    }
    sendMypos();
    updateLaser();
	  if (showGun) {
      setGun("laser");
    }
	  prevTime = time;
	}
	renderer.render( scene, camera );
}

function onResourcesLoaded(){
  scene.background = new THREE.Color(0x87ceff);
  meshes["map"] = models["map"].mesh.clone();
	meshes["map"].position.set(0, 10, 11);
    meshes["map"].scale.set(0.1, 0.1, 0.1);
	scene.add(meshes["map"]);
    meshes["laser"] = models["laser"].mesh.clone();
  meshes["laser"].scale.set(0.05, 0.05, 0.05);
    scene.add(meshes["laser"]);
}

function Player(socketId, uuid, x, y, z, name, angle, score, visible, dead) {
  this.dead = dead;
  this.score = score;
  this.angle = angle;
  this.socketId = socketId;
  this.uuid = uuid;
  this.x = x;
  this.y = y;
  this.z = z;
  this.name = name;
  this.mesh = models["player"].mesh.clone();
  this.mesh.position.set(this.x, this.y - 5.6, this.z);
  this.mesh.rotation.y = this.angle;
  this.mesh.visible = visible;
  scene.add(this.mesh);
  this.update = function() {
    this.mesh.position.set(this.x, this.y - 5.6, this.z);
    this.mesh.rotation.y = this.angle + Math.PI;
  }
}

function Laser(x1, y1, z1, x2, y2, z2, mine) {
  matrix4.makeRotationFromQuaternion(quaternion);
  this.pos = new THREE.Vector3();
  this.mine = mine;
  this.dead = false;
  this.life = 5;
  this.geometry = new THREE.Geometry();
  this.geometry.vertices.push(
    new THREE.Vector3(0, 0, 0),
  );
  this.geometry.translate(0.28, -0.18, -1.5);
  this.geometry.applyMatrix(matrix4);
  this.geometry.vertices[0].add(new THREE.Vector3(x1, y1, z1));
  this.geometry.vertices.push(
    new THREE.Vector3(x2, y2, z2),
  );
  this.material = new THREE.LineBasicMaterial({
      color: 0x00ff00,
  });
  this.line = new THREE.Line(this.geometry, this.material);
  this.add = function() {
    scene.add(this.line);
  }
  this.update = function() {
    controls.getObject().getWorldPosition(this.pos);
    matrix4.makeRotationFromQuaternion(quaternion);
    scene.remove(this.line);
    this.geometry.vertices.splice(0, 2);
    this.geometry.vertices.push(
      new THREE.Vector3(0, 0, 0),
    );
    this.geometry.translate(0.28, -0.18, -1.5);
    this.geometry.applyMatrix(matrix4);
    this.geometry.vertices[0].add(new THREE.Vector3(this.pos.x, this.pos.y, this.pos.z));
    if (point != undefined) {
      this.geometry.vertices.push(
        new THREE.Vector3(point.x, point.y, point.z)
      );
    } else {
      this.geometry.vertices.push(
        new THREE.Vector3(x2, y2, z2),
      );
    }
    this.line = new THREE.Line(this.geometry, this.material);
    scene.add(this.line);
    this.life--;
    if (this.life < 0) {
      this.dead = true;
    }
  }
}

function EnemyLaser(data) {
  this.mine = false;
  this.dead = false;
  this.life = 5;
  this.geometry = new THREE.Geometry();
  this.geometry.vertices.push(
    new THREE.Vector3(data.x1, data.y1, data.z1),
    new THREE.Vector3(data.x2, data.y2, data.z2)
  );
  this.material = new THREE.LineBasicMaterial({
      color: 0x00ff00,
  });
  this.line = new THREE.Line(this.geometry, this.material);
  this.update = function() {
    this.life--;
    if (this.life < 0) {
      this.dead = true;
    }
  }
  scene.add(this.line);
}

function shoot() {
  if (me.canFire && me.dead == false && me.visible) {
    let pos = controls.getObject().position;
    if (point != undefined) {
      me.ammo--;
      let data = {
        x1: pos.x,
        x2: point.x,
        y1: pos.y,
        y2: point.y,
        z1: pos.z,
        z2: point.z,
        from: me.socketId
      }
      socket.emit('sendlaser', data);
      let index = lasers.length;
      lasers.push(new Laser(pos.x, pos.y - 0.005, pos.z, point.x, point.y, point.z, true));
      lasers[index].add();
    }
    if (intersected) {
      let data = {
        from: me.socketId,
        kill: intersectedPlayer,
        name: me.name,
      }
      socket.emit('killPlayer', data);
      for (var i = 0; i < players.length; i++) {
        if (players[i].socketId = intersectedPlayer) {
          players[i].mesh.visible = false;
          players[i].dead = true;
        }
      }
    }
    if (me.ammo < 1) {
      me.canFire = false;
      reloadAmmo();
    }
  }
}



function moving(delta) {
  if (me.dead == false && controlsEnabled) {
    var intersects, collide = false, dir = new THREE.Vector3();
    position = controls.getObject().getWorldPosition(new THREE.Vector3());
    position.sub(new THREE.Vector3(0, 5.6, 0));


    if ( moveForward ) {

      dir.multiplyVectors(direction, new THREE.Vector3(1, 0, 1));
      raycaster.set(position, dir);
      intersects = raycaster.intersectObject( meshes["map"], true );
      if (intersects.length > 0 && intersects[0].distance < 2.8 && noclip == false) {
        velocity.z = 0;
        collide = true;
      }

      dir.set(-(Math.cos(3 * Math.PI/4)* direction.x - Math.sin(3 * Math.PI/4) * direction.z), 0, -(Math.sin(3 * Math.PI/4)* direction.x + Math.cos(3 * Math.PI/4) * direction.z));
      raycaster.set(position, dir);

      intersects = raycaster.intersectObject( meshes["map"], true );
      if (intersects.length > 0 && intersects[0].distance < 2.8 && noclip == false) {
        velocity.z = 0;
        collide = true;
      }

      dir.set((Math.cos(Math.PI/4)* direction.x - Math.sin(Math.PI/4) * direction.z), 0, (Math.sin(Math.PI/4)* direction.x + Math.cos(Math.PI/4) * direction.z));
      raycaster.set(position, dir);

      intersects = raycaster.intersectObject( meshes["map"], true );
      if (intersects.length > 0 && intersects[0].distance < 2.8 && noclip == false) {
        velocity.z = 0;
        collide = true;
      }

      if (collide == false) {
        velocity.z -= 400.0 * delta;
      }
    }

    if ( moveBackward ) {

      dir.multiplyVectors(direction, new THREE.Vector3(-1, 0, -1));
      raycaster.set(position, dir);
      intersects = raycaster.intersectObject( meshes["map"], true );
      if (intersects.length > 0 && intersects[0].distance < 2.8 && noclip == false) {
        velocity.z = 0;
        collide = true;
      }

      dir.set((Math.cos(3 * Math.PI/4)* direction.x - Math.sin(3 * Math.PI/4) * direction.z), 0, (Math.sin(3 * Math.PI/4)* direction.x + Math.cos(3 * Math.PI/4) * direction.z));
      raycaster.set(position, dir);

      intersects = raycaster.intersectObject( meshes["map"], true );
      if (intersects.length > 0 && intersects[0].distance < 2.8 && noclip == false) {
        velocity.z = 0;
        collide = true;
      }

      dir.set(-(Math.cos(Math.PI/4)* direction.x - Math.sin(Math.PI/4) * direction.z), 0, -(Math.sin(Math.PI/4)* direction.x + Math.cos(Math.PI/4) * direction.z));
      raycaster.set(position, dir);

      intersects = raycaster.intersectObject( meshes["map"], true );
      if (intersects.length > 0 && intersects[0].distance < 2.8 && noclip == false) {
        velocity.z = 0;
        collide = true;
      }

      if (collide == false) {
        velocity.z += 400.0 * delta;
      }
    }

    if ( moveLeft ) {
      dir.set(-(Math.cos(Math.PI/2)* direction.x - Math.sin(Math.PI/2) * direction.z), 0, -(Math.sin(Math.PI/2)* direction.x + Math.cos(Math.PI/2) * direction.z));
      raycaster.set(position, dir);

      intersects = raycaster.intersectObject( meshes["map"], true );
      if (intersects.length > 0 && intersects[0].distance < 2.8 && noclip == false) {
        velocity.x = 0;
        collide = true;
      }

      dir.set(-(Math.cos(Math.PI/4)* direction.x - Math.sin(Math.PI/4) * direction.z), 0, -(Math.sin(Math.PI/4)* direction.x + Math.cos(Math.PI/4) * direction.z));
      raycaster.set(position, dir);

      intersects = raycaster.intersectObject( meshes["map"], true );
      if (intersects.length > 0 && intersects[0].distance < 2.8 && noclip == false) {
        velocity.z = 0;
        collide = true;
      }

      dir.set(-(Math.cos(3 * Math.PI/4)* direction.x - Math.sin(3 * Math.PI/4) * direction.z), 0, -(Math.sin(3 * Math.PI/4)* direction.x + Math.cos(3 * Math.PI/4) * direction.z));
      raycaster.set(position, dir);

      intersects = raycaster.intersectObject( meshes["map"], true );
      if (intersects.length > 0 && intersects[0].distance < 2.8 && noclip == false) {
        velocity.z = 0;
        collide = true;
      }

      if (collide == false) {
        velocity.x -= 400.0 * delta;
      }
    }

    if ( moveRight ) {
      dir.set((Math.cos(Math.PI/2)* direction.x - Math.sin(Math.PI/2) * direction.z), 0, (Math.sin(Math.PI/2)* direction.x + Math.cos(Math.PI/2) * direction.z));
      raycaster.set(position, dir);

      intersects = raycaster.intersectObject( meshes["map"], true );
      if (intersects.length > 0 && intersects[0].distance < 2.8 && noclip == false) {
        velocity.x = 0;
        collide = true;
      }

      dir.set((Math.cos(3 * Math.PI/4)* direction.x - Math.sin(3 * Math.PI/4) * direction.z), 0, (Math.sin(3 * Math.PI/4)* direction.x + Math.cos(3 * Math.PI/4) * direction.z));
      raycaster.set(position, dir);

      intersects = raycaster.intersectObject( meshes["map"], true );
      if (intersects.length > 0 && intersects[0].distance < 2.8 && noclip == false) {
        velocity.z = 0;
        collide = true;
      }

      dir.set((Math.cos(Math.PI/4)* direction.x - Math.sin(Math.PI/4) * direction.z), 0, (Math.sin(Math.PI/4)* direction.x + Math.cos(Math.PI/4) * direction.z));
      raycaster.set(position, dir);

      intersects = raycaster.intersectObject( meshes["map"], true );
      if (intersects.length > 0 && intersects[0].distance < 2.8 && noclip == false) {
        velocity.z = 0;
        collide = true;
      }

      if (collide == false) {
        velocity.x += 400.0 * delta;
      }
    }
    if ( moveUp ) {
      controls.getObject().position.y += 1
    }
    if ( moveDown ) {
      controls.getObject().position.y -= 1;
    }
  }
}


function checkIntersect() {
  let objects = [meshes["map"]];
  for (var i = 0; i < players.length; i++) {
    objects.push(players[i].mesh);
  }
  raycaster.set(controls.getObject().position, direction);
  var intersects = raycaster.intersectObjects( objects, true );
  if (intersects.length > 0) {
    point = intersects[0].point;
  } else {
    point = undefined;
  }
  if (intersects.length > 0) {
    for (var i = 0; i < players.length; i++) {
      if (intersects[0].object.parent.uuid == players[i].mesh.uuid) {
        intersected = true;
        intersectedPlayer = players[i].socketId;
        break;
      } else {
        intersected = false;
        intersectedPlayer = '';
      }
    }
  }
}

function setGun(gun) {
  quaternion.copy(controls.getObject().quaternion);
  quaternion.multiply(controls.getObject().children[0].quaternion);
  angle.setFromQuaternion(quaternion);
  meshes[gun].setRotationFromEuler(angle);
  meshes[gun].position.set(
    controls.getObject().position.x,
    controls.getObject().position.y,
    controls.getObject().position.z
  );
}

function updatePlayers() {
  for (var i = 0; i < players.length; i++) {
    players[i].update();
  }
}

function updateLaser() {
  for (let i = lasers.length - 1; i >= 0; i--) {
    lasers[i].update();
    if (lasers[i].dead) {
      scene.remove(scene.getObjectById(lasers[i].line.id));
      lasers.splice(i, 1);
    }
  }
}

function createPlayer(data) {
  let checkIfExists = false;
  for (var i = 0; i < players.length; i++) {
    if (players[i].socketId == data.socketId) {
      checkIfExists = true;
      break;
    }
  }
  if (checkIfExists == false) {
    console.log("created Player");
    players.push(new Player(data.socketId, data.uuid, data.x, data.y, data.z, data.name, data.angle, data.score, data.visible, data.dead));
    setArray();
  }
}

function removePlayer(data) {
  for (let i = players.length - 1; i >= 0; i--) {
    if (players[i].socketId == data.socketId) {
      scene.remove(scene.getObjectById(players[i].mesh.id));
      players.splice(i, 1);
      changeNames(data.name);
    }
  }
}

function sendHost() {
  let pos = controls.getObject().getWorldPosition();
  let data = {
    x: pos.x,
    y: pos.y,
    z: pos.z,
    socketId: me.socketId,
    uuid: me.uuid,
    name: me.name,
    angle: controls.getObject().rotation.y,
    score: me.score,
    visible: me.visible,
    dead: me.dead,
  };
  socket.emit('sentHost', data);
}

function updateOtherPlayers(data) {
  for (var i = 0; i < players.length; i++) {
    if (players[i].socketId == data.socketId) {
      players[i].x = data.x;
      players[i].y = data.y;
      players[i].z = data.z;
      players[i].angle = data.angle;
    }
  }
}

function spawnLocation() {
  let random = Math.round((Math.random() * 3));
  switch (random) {
    case 0:
      controls.getObject().position.x = -33.5;
      controls.getObject().position.z = 110;
      break;
    case 1:
      controls.getObject().position.x = 33.5;
      controls.getObject().position.z = 110;
      break;
    case 2:
      controls.getObject().position.x = -33.5;
      controls.getObject().position.z = -110;
      controls.getObject().rotation.y += Math.PI;
      break;
    case 3:
      controls.getObject().position.x = 33.5;
      controls.getObject().position.z = -110;
      controls.getObject().rotation.y += Math.PI;
      break;
  }
}

function checkResourcesLoaded(data) {
  if(RESOURCES_LOADED == false) {
     setTimeout(checkResourcesLoaded.bind(this, data), 1000);
  } else {
    createPlayer(data);
  }
}

function sendMypos() {
  let data = {
    x: controls.getObject().position.x,
    y: controls.getObject().position.y,
    z: controls.getObject().position.z,
    angle: controls.getObject().rotation.y,
    socketId: me.socketId,
  };
  socket.emit('updateHost', data);
}

function updateKill(data) {
  for (var i = 0; i < players.length; i++) {
    if (players[i].socketId == data.kill) {
      //players[i].mesh.visible = false;
    } else if (me.socketId == data.kill) {
      me.dead = true;
      me.visible = false;
      document.getElementById("text").innerHTML = "You were killed by Player" + data.name;
      meshes["laser"].visible = false;
      blocker.style.background = "rgba(0,0,0,0.8)";
      document.exitPointerLock();
      setTimeout(function () {
        respawn();
      }, 2000);
      // death animation
    }
    if (players[i].socketId == data.from) {
      players[i].score += 100;
      setArray();
    }
  }
  if (me.socketId == data.from) {
    me.score += 100;
    setArray();
  }
}

function setLeaderBoard(array) {
  for (var e = "", n = 1, i = 0; i < array.length; i += 3) {
    e += "<div class='playersItem'>",
    e += "<div class='playersCounter'>" + n + ".</div>",
    e += "<div class='playersName" + array[i + 2] + "'>" + "Player" + array[i] + "</div>",
    e += "<div class='playersScore'>" + array[i + 1] + "</div>",
    e += "</div>",
    n++;
    playersContainer.innerHTML = e;
  }
}

function setArray() {
  let sortArray = [me];
  let sendArray = [];
  for (let i = 0; i < players.length; i++) {
    sortArray.push(players[i]);
  }
  sortArray.sort((a, b) => b.score - a.score);
  for (let i = 0; i < sortArray.length; i++) {
    sendArray.push(sortArray[i].name);
    sendArray.push(sortArray[i].score);
    if (sortArray[i] == me) {
      sendArray.push("M");
    } else {
      sendArray.push('');
    }
  }
  setLeaderBoard(sendArray);
}

function reloadAmmo() {
  id1 = setTimeout(function() {
    me.canFire = true;
    me.ammo = 2
  }, rtime);
}

function changeNames(name) {
  let array = [me];
  for (let i = 0; i < players.length; i++) {
    array.push(players[i]);
  }
  for (let x = 0; x < array.length; x++) {
    if (name < array[x].name) {
      array[x].name -= 1;
    }
  }
  setArray();
}

function drawLaser(data) {
  lasers.push(new EnemyLaser(data));
}

function setPlayerVisibility(data) {
  for (var i = 0; i < players.length; i++) {
    if (players[i].socketId == data.from) {
      players[i].mesh.visible = data.visible;
    }
  }
}

function respawn() {
  me.ammo = 2;
  me.dead = false;
  document.getElementById("text").innerHTML = "Click to Play";
  controls.getObject().position.y = 5.76;
  blocker.style.background = "rgba(0,0,0,0.5)";
  controls.getObject().children[0].rotation.x = 0;
  controls.getObject().rotation.y = 0;
  spawnLocation();
}

function setSens(value) {
  sens = value;
  document.getElementById("sensValue").innerHTML = value;
}


/*
var id = setInterval(function(){players[0].mesh.rotation.x += 0.05;if(players[0].mesh.rotation.x >= Math.PI/2){clearInterval(id);}}, 5)
*/
