//
// Main game backend
//
OverDrive.Stages.MainGame = (function(stage, canvas, context) {


    // Private API

    let overdrive = OverDrive.Game.system;
    let tracks = OverDrive.Game.tracks;
    let scenery = OverDrive.Game.scenery;


    stage.MainGame.prototype.createTrack = function() {
        var self = this;

        var track = tracks[self.trackIndex];

        // Setup region model for track
        self.regions = [];

        for (var i = 0; i < track.regions.length; ++i) {

            var r = OverDrive.Region.Create();

            r.points = track.regions[i].points;
            OverDrive.Region.BuildCollisionModel(r);

            self.regions.push(r);
        }

        OverDrive.Graph.BuildGraph(self.regions);

    }

    stage.MainGame.prototype.createScenery = function() {

        var self = this;

        // Setup track and scenery
        var track = tracks[self.trackIndex];

        // Setup scenery regions
        self.sceneryRegions = [];

        for (var i = 0; i < scenery[self.trackIndex].regions.length; ++i) {

            var r = OverDrive.Region.Create();

            r.points = scenery[self.trackIndex].regions[i].points;
            OverDrive.Region.BuildCollisionModel(r);

            // console.log(r);

            self.sceneryRegions.push(r);
        }

        for (var i = 0; i < self.sceneryRegions.length; ++i) {

            var scaledVertices = [];

            var centre = {
                x: 0,
                y: 0
            };

            // Get centre coord
            for (var j = 0; j < self.sceneryRegions[i].collisionModel.vertices.length; ++j) {

                centre.x += self.sceneryRegions[i].collisionModel.vertices[j].x * canvas.width;
                centre.y += self.sceneryRegions[i].collisionModel.vertices[j].y * canvas.height;
            }

            centre.x /= self.sceneryRegions[i].collisionModel.vertices.length;
            centre.y /= self.sceneryRegions[i].collisionModel.vertices.length;

            for (var j = 0; j < self.sceneryRegions[i].collisionModel.vertices.length; ++j) {

                scaledVertices.push({
                    x: self.sceneryRegions[i].collisionModel.vertices[j].x * canvas.width,
                    y: self.sceneryRegions[i].collisionModel.vertices[j].y * canvas.height
                });
            }

            var collisionRegion = Matter.Bodies.fromVertices(centre.x, centre.y, scaledVertices, {
                isStatic: true
            });

            // Set collision properties and add to main world
            collisionRegion.collisionFilter.group = 0;
            collisionRegion.collisionFilter.category = OverDrive.Game.CollisionModel.StaticScene.Category;
            collisionRegion.collisionFilter.mask = OverDrive.Game.CollisionModel.StaticScene.Mask;

            Matter.World.add(overdrive.engine.world, collisionRegion);
        }
    }


    stage.MainGame.prototype.setupBackground = function() {

        var self = this;
        var track = tracks[self.trackIndex];

        self.backgroundImage = new OverDrive.Game.Background(track.trackImage.imageURL);
    }

    stage.MainGame.prototype.initialiseCamera = function() {

        var self = this;

        self.orthoCamera = new OverDrive.Game.OrthoCamera(OverDrive.Game.CameraMode.Normal);
    }

    stage.MainGame.prototype.initialisePickupTypes = function() {
        var self = this;
        OverDrive.Stages.MainGame.pickupTypes = [];

        //gain 100 points
        OverDrive.Stages.MainGame.pickupTypes['points_pickup'] = new OverDrive.Pickup.PickupType({
            spriteURI: 'Assets//Images//pw1.png',
            collisionGroup: 0,
            handler: function(collector) {

                console.log('points pickup');
                collector.addPoints(50);
            }
        });

        //gain temporary speed boost (2 seconds) and 50 points
        OverDrive.Stages.MainGame.pickupTypes['speed_pickup'] = new OverDrive.Pickup.PickupType({
            spriteURI: 'Assets//Images//pw2.png',
            collisionGroup: 0,
            handler: function(collector) {

                console.log('speed pickup');
                collector.addSpeed(0.004);
                setTimeout(function() {
                    collector.addSpeed(-0.004)
                }, 2000);
                //add 10 points for collecting a pickup
                collector.addPoints(10);
            }
        });

        // //increases car size (5 seconds)
        // self.pickupTypes['scale_pickup'] = new OverDrive.Pickup.PickupType(
        //   {
        //     spriteURI : 'Assets//Images//pw3.png',
        //     collisionGroup : 0,
        //     handler : function(collector) {
        //
        //       console.log('scale pickup');
        //       collector.increaseSize(0.5);
        //       setTimeout(function(){collector.increaseSize(-0.5)},5000);
        //       //add 10 points for collecting a pickup
        //       collector.addPoints(10);
        //     }
        //   } );
        //
        //   //decrease car size (5 seconds)
        //   self.pickupTypes['scaledown_pickup'] = new OverDrive.Pickup.PickupType(
        //     {
        //       spriteURI : 'Assets//Images//pw5.png',
        //       collisionGroup : 0,
        //       handler : function(collector) {
        //
        //         console.log('scaledown pickup');
        //         collector.increaseSize(-0.5);
        //         setTimeout(function(){collector.increaseSize(0.5)},5000);
        //         //add 10 points for collecting a pickup
        //         collector.addPoints(10);
        //       }
        //     } );
        //slowdown opponent (3 seconds)
        OverDrive.Stages.MainGame.pickupTypes['slowdown_pickup'] = new OverDrive.Pickup.PickupType({
            spriteURI: 'Assets//Images//pw6.png',
            collisionGroup: 0,
            handler: function(collector) {

                console.log('slowdown pickup');
                if (collector.pid === self.player2.pid) {
                    self.player1.addSpeed(-0.004);
                    setTimeout(function() {
                        self.player1.addSpeed(0.004)
                    }, 3000);
                } else if (collector.pid === self.player1.pid) {
                    self.player2.addSpeed(-0.004);
                    setTimeout(function() {
                        self.player2.addSpeed(0.004)
                    }, 3000);
                }
                //add 10 points for collecting a pickup
                collector.addPoints(10);
            }
        });
        //decreases friction of opponent (5 seconds)
        OverDrive.Stages.MainGame.pickupTypes['friction_pickup'] = new OverDrive.Pickup.PickupType({
            spriteURI: 'Assets//Images//pw7.png',
            collisionGroup: 0,
            handler: function(collector) {

                console.log('friction pickup');
                if (collector.pid === self.player2.pid) {
                    self.player1.friction(500);
                    setTimeout(function() {
                        self.player1.friction(180)
                    }, 5000);
                } else if (collector.pid === self.player1.pid) {
                    self.player2.friction(500);
                    setTimeout(function() {
                        self.player2.friction(180)
                    }, 5000);
                }
                //add 10 points for collecting a pickup
                collector.addPoints(10);
            }
        });
    }

    stage.MainGame.prototype.createStartingPickups = function() {
        var self = this;
        var starting_pickups = OverDrive.Pickup.initPickups(
            initial_pickup_counter,
            OverDrive.Stages.MainGame.pickupTypes,
            overdrive.engine,
            self.regions
        );
        OverDrive.Stages.MainGame.starting_pickups = starting_pickups;
    }

    stage.MainGame.prototype.createPlayer1 = function() {
        var self = this;
        var track = tracks[self.trackIndex];

        self.player1 = new OverDrive.Game.Player({
            pid: overdrive.settings.players[0].name,
            x: track.players[0].pos.x * canvas.width,
            y: track.players[0].pos.y * canvas.height,
            angle: track.players[0].angle,
            scale: track.players[0].scale,
            rotateSpeed: 180, //0.04,
            forwardForce: 0.005,
            spriteURI: track.players[0].playerImageURI,
            world: overdrive.engine.world,
            mass: player_mass,
            boundingVolumeScale: 0.75,
            collisionGroup: -1,
            preUpdate: function(player, deltaTime, env) {

                self.updatePlayer1(player, deltaTime, env);
            },
            postUpdate: function(player, deltaTime, env) {}
        });
    }

    stage.MainGame.prototype.createPlayer2 = function() {

        var self = this;
        var track = tracks[self.trackIndex];

        self.player2 = new OverDrive.Game.Player({
            pid: overdrive.settings.players[1].name,
            x: track.players[1].pos.x * canvas.width,
            y: track.players[1].pos.y * canvas.height,
            angle: track.players[1].angle,
            scale: track.players[1].scale,
            rotateSpeed: 180, //0.01,
            forwardForce: 0.005,
            spriteURI: track.players[1].playerImageURI,
            world: overdrive.engine.world,
            mass: player_mass,
            boundingVolumeScale: 0.75,
            collisionGroup: -2,
            preUpdate: function(player, deltaTime, env) {

                self.updatePlayer2(player, deltaTime, env);
            },
            postUpdate: function(player, deltaTime, env) {}
        });
    }

    stage.MainGame.prototype.startClock = function() {

        overdrive.gameClock.start();
    }


    // Placeholder
    stage.MainGame.prototype.startGameLoop = function() {}


    //
    // Main loop functions
    //

    stage.MainGame.prototype.updateClock = function() {

        var self = this;

        OverDrive.Game.system.gameClock.tick();
        self.lapTime = overdrive.gameClock.gameTimeElapsed() - self.baseTime;
    }

    stage.MainGame.prototype.animatePlayers = function() {

        var self = this;

        Matter.Engine.update(overdrive.engine, overdrive.gameClock.deltaTime);
    }

    stage.MainGame.prototype.drawNewAnimationFrame = function() {

        var self = this;

        self.renderMainScene();

        // Draw Status
        OverDrive.Game.drawHUD(self.player1, self.player2, true, self.lapTime, self.path.maxIterations);


        // Update status elements
        document.getElementById('actualTime').innerHTML = 'Seconds elapsed = ' + overdrive.gameClock.actualTimeElapsed();
        document.getElementById('timeDelta').innerHTML = 'Time Delta = ' + Math.round(overdrive.gameClock.deltaTime);
        document.getElementById('fps').innerHTML = 'FPS = ' + overdrive.gameClock.frameCounter.getAverageFPS();
        document.getElementById('spf').innerHTML = 'SPF = ' + overdrive.gameClock.frameCounter.getAverageSPF();
    }

    stage.MainGame.prototype.player1CrossedFinishLine = function() {

        var self = this;

        if (self.player1.pathLocation.pathComplete) {

            self.winner = self.player1;
            self.levelComplete = true;

            return true;
        } else {

            return false;
        }
    }

    stage.MainGame.prototype.player2CrossedFinishLine = function() {

        var self = this;

        if (self.player2.pathLocation.pathComplete) {

            self.winner = self.player2;
            self.levelComplete = true;

            return true;
        } else {

            return false;
        }
    }

    stage.MainGame.prototype.repeatGameLoop = function() {

        var self = this;

        window.requestAnimationFrame(self.mainLoopActual);
    }

    stage.MainGame.prototype.leaveGameLoop = function() {

        var self = this;

        window.requestAnimationFrame(self.initPhaseOut);
    }


    return stage;

})((OverDrive.Stages.MainGame || {}), OverDrive.canvas, OverDrive.context);
