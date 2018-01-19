OverDrive.Game = (function(gamelib, canvas, context) {

    gamelib.InputMode = {
        Keyboard: 0,
        Gamepad: 1
    };

    gamelib.CameraMode = {
        Test: 0,
        Normal: 1,
        Fixed: 2
    };
    gamelib.cameraWindowScale = 5;

    // Model orthographic projection camera that follows players around the canvas.  The aspect ratio of the camera IS ALWAYS THE SAME as the aspect ratio of the canvas.
    gamelib.OrthoCamera = function(initMode) {

        var self = this;

        this.pos1 = {
            x: canvas.width / 2,
            y: canvas.height / 2
        };
        this.pos2 = {
            x: canvas.width / 2,
            y: canvas.height / 2
        };
        this.width = 200;
        this.height = this.width * (canvas.height / canvas.width);
        this.netRotation = 0;
        this.mode = initMode;


        this.calculateCameraWindow = function(player1, player2) {

            // apply transfer function to save player distance to camera window extent
            var fn = function(x) {

                //return x * gamelib.cameraWindowScale; // linear

                // Exponential window scale decay
                const sigma = 0.0025; //0.005;
                const phi = 2.5;
                return (1 / Math.exp(x * sigma) * phi + 1) * x;
            }

            // The position of the camera depends on (i) the average player position (calculated in preCalculatePosition) and (ii) their distance apart (which also determines the camera window).  The reason this is the case is that the camera window cannot fall outside the canvas coordinate area.
            // Note: self.pos is in an intermediate state after calling this function.
            var preCalculatePosition = function(player1, player2) {

                self.pos1.x = player1.mBody.position.x;
                self.pos1.y = player1.mBody.position.y;
                self.pos2.x = player2.mBody.position.x;
                self.pos2.y = player2.mBody.position.y;
            }

            var calculateWindowExtent = function(player1, player2) {

                /*var dx = Math.abs(player1.mBody.position.x - player2.mBody.position.x);
                var dy = Math.abs(player1.mBody.position.y - player2.mBody.position.y);

                //var dist = Math.max(dx, dy);
                var dist = Math.sqrt(dx * dx + dy * dy);

                self.width = 100;
                self.height = this.width * (canvas.height / canvas.width);*/
            }

            if (player1.mBody && player2.mBody) {

                preCalculatePosition(player1, player2);
                calculateWindowExtent(player1, player2);

                this.netRotation1 = player1.mBody.angle;
                this.netRotation2 = player2.mBody.angle;
            }
        }

        this.drawTestWindow = function() {
/*
            if (self.mode == gamelib.CameraMode.Test) {

                context.beginPath();

                context.moveTo(self.pos.x - self.width / 2, self.pos.y - self.height / 2);
                context.lineTo(self.pos.x + self.width / 2, self.pos.y - self.height / 2);
                context.lineTo(self.pos.x + self.width / 2, self.pos.y + self.height / 2);
                context.lineTo(self.pos.x - self.width / 2, self.pos.y + self.height / 2);

                context.closePath();

                context.lineWidth = 1;
                context.strokeStyle = '#FFF';
                context.stroke();
            }*/
        }
    }


    return gamelib;

})((OverDrive.Game || {}), OverDrive.canvas, OverDrive.context);


OverDrive.Stages.MainGame = (function(stage, canvas, context) {

    // Private API

    let overdrive = OverDrive.Game.system;
    let tracks = OverDrive.Game.tracks;
    let scenery = OverDrive.Game.scenery;

    // Should be 3, currently is 1 for testing
    let lapsToWin = CONFIG_lapsToWin;


    //
    // Public interface
    //

    // Factory method

    stage.Create = function() {
        console.log('Creating maingame_stage');
        return new stage.MainGame();
    }


    stage.MainGame = function() {

        var self = this;

        this.transitionLinks = {

            mainMenu: null
        };

        this.setTransition = function(id, target) {

            self.transitionLinks[id] = target;
        }

        // Exit transition state (picked up by leaveStage)
        this.leaveState = {

            id: null,
            params: null
        };


        // Main game-state specific variables
        this.level = OverDrive.Stages.MainGame.trackIndex;
        this.trackIndex = 0; //Sets starting track index

        this.backgroundImage = null;

        this.orthoCamera = null;

        this.keyDown = null;

        this.raceStarted = false;

        this.paused = false; // show paused menu
        this.levelComplete = false;
        this.winner = null;

        this.regions = null; // track regions
        this.sceneryRegions = null;

        this.baseTime = 0;
        this.lapTime = 0;

        this.pickupTypes = null; // Pickup TYPES
        //Array of intially randomly creeated pickups
        this.initialPickups = null;
        this.pickupArray = null;


        this.canvas = OverDrive.canvas;
        this.context = OverDrive.context;
        this.canvas2 = OverDrive.canvas2;
        this.context2 = OverDrive.context2;

        //
        // Stage interface implementation
        //

        // Pre-start stage with relevant parameters
        // Not called for initial state!
        this.preTransition = function(params) {

            self.level = params.level;
            self.trackIndex = self.level;

            console.log('entering level ' + self.trackIndex);
        }

        this.init = function() {

            // Setup keyboard
            if (self.keyDown === null) {

                self.keyDown = new Array(256);
            }

            for (var i = 0; i < 256; ++i) {

                self.keyDown[i] = false;
            }

            $(document).on('keyup', self.onKeyUp);
            $(document).on('keydown', self.onKeyDown);

            var track = tracks[self.trackIndex];


            // Call front-end method to setup key elements of game environment
            self.setup();


            self.path = new OverDrive.Game.Path(self.regions, overdrive.engine.world, lapsToWin);

            self.player1.pathLocation = self.path.initPathPlacement();
            self.player2.pathLocation = self.path.initPathPlacement();


            // Setup gravity configuration for this stage
            OverDrive.Game.system.engine.world.gravity.y = 0;


            // Add bounds so you cannot go off the screen
            var b0 = Matter.Bodies.rectangle(-50, canvas.height / 2, 100, canvas.height, {
                isStatic: true
            });
            var b1 = Matter.Bodies.rectangle(canvas.width + 50, canvas.height / 2, 100, canvas.height, {
                isStatic: true
            });
            var b2 = Matter.Bodies.rectangle(canvas.width / 2, -50, canvas.width, 100, {
                isStatic: true
            });
            var b3 = Matter.Bodies.rectangle(canvas.width / 2, canvas.height + 50, canvas.width, 100, {
                isStatic: true
            });

            b0.collisionFilter.group = 0;
            b0.collisionFilter.category = OverDrive.Game.CollisionModel.StaticScene.Category;
            b0.collisionFilter.mask = OverDrive.Game.CollisionModel.StaticScene.Mask;

            b1.collisionFilter.group = 0;
            b1.collisionFilter.category = OverDrive.Game.CollisionModel.StaticScene.Category;
            b1.collisionFilter.mask = OverDrive.Game.CollisionModel.StaticScene.Mask;

            b2.collisionFilter.group = 0;
            b2.collisionFilter.category = OverDrive.Game.CollisionModel.StaticScene.Category;
            b2.collisionFilter.mask = OverDrive.Game.CollisionModel.StaticScene.Mask;

            b3.collisionFilter.group = 0;
            b3.collisionFilter.category = OverDrive.Game.CollisionModel.StaticScene.Category;
            b3.collisionFilter.mask = OverDrive.Game.CollisionModel.StaticScene.Mask;

            Matter.World.add(OverDrive.Game.system.engine.world, [b0, b1, b2, b3]);


            // Register on-collision event
            Matter.Events.on(OverDrive.Game.system.engine, 'collisionStart', function(event) {

                let pairs = event.pairs;

                for (var i = 0; i < pairs.length; ++i) {

                    if (pairs[i].bodyA.hostObject !== undefined &&
                        pairs[i].bodyB.hostObject !== undefined) {

                        pairs[i].bodyA.hostObject.doCollision(
                            pairs[i].bodyB.hostObject, {
                                objA: pairs[i].bodyA,
                                objB: pairs[i].bodyB,
                                host: self // host environment
                            }
                        ); // objA === collider of first dispatch responder
                    }
                }
            });


            // Register pre-update call (handle app-specific stuff)
            Matter.Events.on(OverDrive.Game.system.engine, 'beforeUpdate', function(event) {

                var world = event.source.world;

                for (var i = 0; i < world.bodies.length; ++i) {

                    if (world.bodies[i].hostObject !== undefined &&
                        world.bodies[i].hostObject.preUpdate !== undefined) {

                        world.bodies[i].hostObject.preUpdate(world.bodies[i].hostObject, OverDrive.Game.system.gameClock.deltaTime, self);
                    }
                };
            });


            // Register post-update call (handle app-specific stuff)
            Matter.Events.on(OverDrive.Game.system.engine, 'afterUpdate', function(event) {

                var world = event.source.world;

                for (var i = 0; i < world.bodies.length; ++i) {

                    if (world.bodies[i].hostObject !== undefined &&
                        world.bodies[i].hostObject.postUpdate !== undefined) {

                        world.bodies[i].hostObject.postUpdate(world.bodies[i].hostObject, OverDrive.Game.system.gameClock.deltaTime, self);
                    }
                };
            });

            if (self.pickupTypes == null) {

                self.pickupTypes = [];
                //gain 100 points
                self.pickupTypes['points_pickup'] = new OverDrive.Pickup.PickupType({
                    spriteURI: 'Assets//Images//pw1.png',
                    collisionGroup: 0,
                    handler: function(collector) {

                        console.log('points pickup');
                        collector.addPoints(50);
                    }
                });

                //gain temporary speed boost (2 seconds) and 50 points
                self.pickupTypes['speed_pickup'] = new OverDrive.Pickup.PickupType({
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

                //increases car size (5 seconds)
                self.pickupTypes['scale_pickup'] = new OverDrive.Pickup.PickupType(
                  {
                    spriteURI : 'Assets//Images//pw3.png',
                    collisionGroup : 0,
                    handler : function(collector) {

                      console.log('scale pickup');
                      collector.scale = 0.3;
                      setTimeout(function(){collector.scale = 0.15},5000);
                      //add 10 points for collecting a pickup
                      collector.addPoints(10);
                    }
                  } );

                  // //decrease car size (5 seconds)
                  // self.pickupTypes['scaledown_pickup'] = new OverDrive.Pickup.PickupType(
                  //   {
                  //     spriteURI : 'Assets//Images//pw5.png',
                  //     collisionGroup : 0,
                  //     handler : function(collector) {
                  //
                  //       console.log('scaledown pickup');
                  //       collector.scale = 0.05;
                  //       setTimeout(function(){collector.scale = 0.15},5000);
                  //       //add 10 points for collecting a pickup
                  //       collector.addPoints(10);
                  //     }
                  //   } );

                //slowdown opponent (3 seconds)
                self.pickupTypes['slowdown_pickup'] = new OverDrive.Pickup.PickupType({
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
                self.pickupTypes['friction_pickup'] = new OverDrive.Pickup.PickupType({
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

                //wildcard chooses from the available pickups

            }
            // Register pickups
            self.pickupArray = [];
            self.pickup_timer = pickup_time_delay;

            //Always gotta add the random one in
            self.pickupTypes['random_pickup'] = new OverDrive.Pickup.PickupType({
                spriteURI: 'Assets//Images//pw4.png',
                collisionGroup: 0,
                handler: function(collector) {
                    var numOfPickups = 5;
                    var choice = Math.floor(Math.random() * (numOfPickups)) + 1;

                    if (choice == 1) { //add 50 points

                        console.log('points pickup');
                        collector.addPoints(50);
                    } else if (choice == 2) { //increase speed

                        console.log('speed pickup');
                        collector.addSpeed(0.004);
                        setTimeout(function() {
                            collector.addSpeed(-0.004)
                        }, 2000);
                    }
                    else if (choice == 3) {   //increase car size

                      console.log('scale pickup');
                      collector.scale = 0.3;
                      setTimeout(function(){collector.scale = 0.15},5000);
                    }
                    // else if (choice == 4) { //decrease car size
                    //
                    //   console.log('scaledown pickup');
                    //   collector.increaseSize(-0.5);
                    //   setTimeout(function(){collector.increaseSize(0.5)},5000);
                    // }
                    else if (choice == 4) { //slowdown opponent

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
                    } else if (choice == 5) { //rotate speed set to 500

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

                }
            });


            self.countDownSecondsElapsed = 0;
            overdrive.gameClock.tick();

            self.raceStarted = false;

            window.requestAnimationFrame(self.phaseInLoop);
        }



        this.phaseInLoop = function() {
            this.initial = true;
            // Update clock
            overdrive.gameClock.tick();

            var secondsDelta = overdrive.gameClock.convertTimeIntervalToSeconds(overdrive.gameClock.deltaTime);

            self.countDownSecondsElapsed += secondsDelta;


            // Redraw scene
            self.renderMainScene();
            self.renderSecondScene();

            // Draw countdown
            context.fillStyle = '#FFF';
            context.font = '30pt ' + main_game_font;

            var timeToDisplay = 3 - Math.floor(self.countDownSecondsElapsed);
            var textMetrics = context.measureText(timeToDisplay);

            context.fillText(timeToDisplay, canvas.width * 0.5 - textMetrics.width / 2, 300);

            // Draw Status
            OverDrive.Game.drawHUD(self.player1, self.player2, false, self.lapTime, self.path.maxIterations);

            // Iterate through countdown
            if (self.countDownSecondsElapsed < 3) {

                window.requestAnimationFrame(self.phaseInLoop);
            } else {

                // Reset clock base time and goto main game loop

                self.paused = false;
                self.levelComplete = false;

                self.baseTime = overdrive.gameClock.gameTimeElapsed();
                self.lapTime = 0;

                self.raceStarted = true;

                window.requestAnimationFrame(self.mainLoopActual);
            }
        }

        this.mainLoopActual = function() {


            // Manage pickups
            let pickupStatus = OverDrive.Pickup.processPickups(
                OverDrive.Stages.MainGame.pickupTypes,
                overdrive.engine,
                self.pickup_timer,
                overdrive.gameClock.convertTimeIntervalToSeconds(overdrive.gameClock.deltaTime),
                self.regions);

            self.pickup_timer = pickupStatus.timer;
            // if its the first loop a dd the initial pickups to the game
            if (this.initial) {
                self.initialPickups = OverDrive.Stages.MainGame.starting_pickups;
                this.initial = false;
                for (i = 0; i < self.initialPickups.length; i++) {
                    Matter.World.add(overdrive.engine.world, [self.initialPickups[i].mBody]);
                    self.pickupArray.push(self.initialPickups[i]);
                }
            } else if (pickupStatus.newPickup) {

                Matter.World.add(overdrive.engine.world, [pickupStatus.newPickup.mBody]);
                self.pickupArray.push(pickupStatus.newPickup);
            }


            self.mainLoop();
        }

        this.initPhaseOut = function() {

            // Add 200 points for winner
            self.winner.score += 200;
            //.toFixed(4)
            self.winner.time = self.lapTime.toFixed(2);
            console.log('Winner time: ' + self.winner.time);
            self.winnerMessage = self.winner.pid + ' Wins!!!!!';

            window.requestAnimationFrame(self.phaseOutLoop);
        }

        this.phaseOutLoop = function() {

            // Update system clock
            OverDrive.Game.system.gameClock.tick();

            self.lapTime = overdrive.gameClock.gameTimeElapsed() - self.baseTime;

            // Update main physics engine state
            Matter.Engine.update(overdrive.engine, overdrive.gameClock.deltaTime);

            self.renderMainScene();
            self.renderSecondScene();

            // Draw winner message
            context.fillStyle = '#FFF';
            context.font = '30pt ' + main_game_font;
            var textMetrics = context.measureText(self.winnerMessage);
            context.fillText(self.winnerMessage, canvas.width * 0.5 - textMetrics.width / 2, 300);

            if (self.keyPressed('ESC')) {
                // When game is over you need to hit escape to exit.
                // How to make this move to next map?
                window.requestAnimationFrame(self.leaveStage);
            } else {

                window.requestAnimationFrame(self.phaseOutLoop);
            }
        }

        // function that adds element to scores array and slices off elements past index 9
        this.insertToLeaderboard = function(wscore, wname, wtime, wtrack) {

            if (overdrive.scores === null) {
                overdrive.scores = [];
            }
            overdrive.scores.push({
                name: wname,
                score: wscore,
                time: wtime,
                track: wtrack
            });
            overdrive.sortScores();
            overdrive.scores.splice(10);
            this.storeLeaderboard();
        }
        // Stores leaderboard in JSON format in localStorage
        this.storeLeaderboard = function() {
            window.localStorage.setItem('leaderboard', JSON.stringify(overdrive.scores));
            console.log('Scores added to LS');
        }

        this.leaveStage = function() {

            // Add to leaderboard anad store leadboard for later
            self.insertToLeaderboard(self.winner.score, self.winner.pid, self.winner.time, OverDrive.Stages.MainGame.trackIndex);

            // Tear-down stage
            $(document).on('keyup', self.onKeyUp);
            $(document).on('keydown', self.onKeyDown);

            Matter.Events.off(OverDrive.Game.system.engine);

            Matter.World.clear(overdrive.engine.world, false);

            self.backgroundImage = null;

            self.orthoCamera = null;

            self.gamepads = {};

            self.paused = false; // show paused menu
            self.levelComplete = false;
            self.winner = null;

            self.regions = null; // track regions
            self.sceneryRegions = null;

            self.baseTime = 0;
            self.lapTime = 0;

            self.pickupTypes = null;
            self.pickupArray = null;

            // Setup leave state parameters and target - this is explicit!
            self.leaveState.id = 'mainMenu';
            self.leaveState.params = {}; // params setup as required by target state


            var target = self.transitionLinks[self.leaveState.id];

            // Handle pre-transition (in target, not here! - encapsulation!)
            target.preTransition(self.leaveState.params);

            // Final transition from current stage
            window.requestAnimationFrame(target.init);

            // Clear leave state once done
            self.leaveState.id = null;
            self.leaveState.params = null;
        }


        // Event handling functions

        this.onKeyDown = function(event) {

            self.keyDown[event.keyCode] = true;
        }

        this.onKeyUp = function(event) {

            self.keyDown[event.keyCode] = false;
        }



        // Stage processing functions

        this.renderMainScene = function() {

            // Update camera
            self.orthoCamera.calculateCameraWindow(self.player1, self.player2);

            if (self.orthoCamera.mode == OverDrive.Game.CameraMode.Normal) {

                context.save();

                context.scale(canvas.width / self.orthoCamera.width, canvas.height / self.orthoCamera.height);
                context.translate(-(self.orthoCamera.pos1.x - (self.orthoCamera.width / 2)), -(self.orthoCamera.pos1.y - (self.orthoCamera.height / 2)));

                // Center rotation axis on player
                context.translate(self.orthoCamera.pos1.x,
                  self.orthoCamera.pos1.y);
                // Rotate map to align with player orientation
                context.rotate(-self.orthoCamera.netRotation1);
                // Revert canvas to original position
                context.translate(-self.orthoCamera.pos1.x, -self.orthoCamera.pos1.y);
            }


            // Render latest frame
            self.drawLevel();


            if (self.orthoCamera.mode == OverDrive.Game.CameraMode.Normal) {

                context.restore();
            } else if (self.orthoCamera.mode == OverDrive.Game.CameraMode.Test) {

                self.orthoCamera.drawTestWindow();
            }
        }


        this.renderSecondScene = function() {

              // Update camera
              //self.orthoCamera.calculateCameraWindow(self.player1, self.player2);

              if (self.orthoCamera.mode == OverDrive.Game.CameraMode.Normal) {

                self.context2.save();

                self.context2.scale(self.canvas2.width / self.orthoCamera.width, self.canvas2.height / self.orthoCamera.height);
                self.context2.translate(-(self.orthoCamera.pos2.x - (self.orthoCamera.width / 2)), -(self.orthoCamera.pos2.y - (self.orthoCamera.height / 2)));

                // Center rotation axis on player
                self.context2.translate(self.orthoCamera.pos2.x,
                  self.orthoCamera.pos2.y);
                // Rotate map to align with player orientation
                self.context2.rotate(-self.orthoCamera.netRotation2);
                // Revert canvas to original position
                self.context2.translate(-self.orthoCamera.pos2.x, -self.orthoCamera.pos2.y);
              }

              // Render latest frame
              self.drawLevel2();


              if (self.orthoCamera.mode == OverDrive.Game.CameraMode.Normal) {

                self.context2.restore();
              } else if (self.orthoCamera.mode == OverDrive.Game.CameraMode.Test) {

                self.orthoCamera.drawTestWindow();
              }
        }

        this.drawLevel = function() {

            // Draw background
            if (self.backgroundImage) {

                self.backgroundImage.draw();
            }

            // Draw player1
            if (self.player1) {

                self.player1.draw();
                //self.player1.drawBoundingVolume('#FFF');
            }

            // Draw player2
            if (self.player2) {

                self.player2.draw();
                //self.player2.drawBoundingVolume('#FFF');
            }

            // Render pickups
            OverDrive.Game.drawObjects(self.pickupArray);
        }

        this.drawLevel2 = function() {

              // Draw background
              if (self.backgroundImage) {

                self.backgroundImage.draw2(self.canvas2, self.context2);
              }

              // Draw player1
              if (self.player1) {

                self.player1.draw2(self.canvas2, self.context2);
                //self.player1.drawBoundingVolume('#FFF');
              }

              // Draw player2
              if (self.player2) {

                self.player2.draw2(self.canvas2, self.context2);
                //self.player2.drawBoundingVolume('#FFF');
              }

              // Render pickups
              OverDrive.Game.drawObjects2(self.pickupArray);
        }

        // Return true if any key is pressed at the time the function is called
        this.keyPressed = function(keyCode) {

            return this.keyDown[overdrive.Keys[keyCode]];
        }


        this.updatePlayer1 = function(player, deltaTime, env) {

            // Limit player velocity
            if (player.mBody.speed > player_top_speed) {

                var vel = Matter.Vector.normalise(player.mBody.velocity);

                vel.x *= player_top_speed;
                vel.y *= player_top_speed;

                Matter.Body.setVelocity(player.mBody, vel);
            }

            const p1InputMethod = overdrive.settings.players[0].mode;

            // Gamepad input
            if (p1InputMethod == OverDrive.Game.InputMode.Gamepad) {

                this.handleGamepadInput(player, 0, deltaTime);
            } else if (p1InputMethod == OverDrive.Game.InputMode.Keyboard) {

                // Keyboard input

                if (this.keyPressed(overdrive.settings.players[0].keys.forward)) {

                    var F = player.forwardDirection();

                    player.applyForce(player.mBody.position, {
                        x: F.x * player.forwardForce,
                        y: F.y * player.forwardForce
                    });
                }

                if (this.keyPressed(overdrive.settings.players[0].keys.reverse)) {

                    var F = player.forwardDirection();

                    player.applyForce(player.mBody.position, {
                        x: -F.x * player.forwardForce,
                        y: -F.y * player.forwardForce
                    });
                }

                if (this.keyPressed(overdrive.settings.players[0].keys.left)) {

                    Matter.Body.setAngularVelocity(player.mBody, 0);
                    player.rotate((-Math.PI / 180) * player.rotateSpeed * (deltaTime / 1000));
                }

                if (this.keyPressed(overdrive.settings.players[0].keys.right)) {

                    Matter.Body.setAngularVelocity(player.mBody, 0);
                    player.rotate((Math.PI / 180) * player.rotateSpeed * (deltaTime / 1000));
                }
            }


        }


        this.updatePlayer2 = function(player, deltaTime, env) {

            // Limit player velocity
            if (player.mBody.speed > player_top_speed) {

                var vel = Matter.Vector.normalise(player.mBody.velocity);

                vel.x *= player_top_speed;
                vel.y *= player_top_speed;

                Matter.Body.setVelocity(player.mBody, vel);
            }

            const inputMethod = overdrive.settings.players[1].mode;

            // Gamepad input
            if (inputMethod == OverDrive.Game.InputMode.Gamepad) {

                this.handleGamepadInput(player, 1, deltaTime);
            } else if (inputMethod == OverDrive.Game.InputMode.Keyboard) {

                if (this.keyPressed(overdrive.settings.players[1].keys.forward)) {

                    var F = player.forwardDirection();

                    player.applyForce(player.mBody.position, {
                        x: F.x * player.forwardForce,
                        y: F.y * player.forwardForce
                    });
                }

                if (this.keyPressed(overdrive.settings.players[1].keys.reverse)) {

                    var F = player.forwardDirection();

                    player.applyForce(player.mBody.position, {
                        x: -F.x * player.forwardForce,
                        y: -F.y * player.forwardForce
                    });
                }

                if (this.keyPressed(overdrive.settings.players[1].keys.left)) {

                    Matter.Body.setAngularVelocity(player.mBody, 0);
                    player.rotate((-Math.PI / 180) * player.rotateSpeed * (deltaTime / 1000));
                    //player.rotate(-Math.PI * player.rotateSpeed);
                }

                if (this.keyPressed(overdrive.settings.players[1].keys.right)) {

                    Matter.Body.setAngularVelocity(player.mBody, 0);
                    player.rotate((Math.PI / 180) * player.rotateSpeed * (deltaTime / 1000));
                    //player.rotate(Math.PI * player.rotateSpeed);
                }
            }
        }


        // Controller input handlers
        this.handleGamepadInput = function(player, playerIndex, deltaTime) {

            const gamepadIndex = overdrive.Gamepad.bindings[playerIndex].gamepadIndex;

            // Ensure still connected
            var pad = overdrive.Gamepad.gamepads[gamepadIndex];

            if (pad && pad.connected) {

                if (pad.buttons[0].pressed) {

                    var F = player.forwardDirection();

                    player.applyForce(player.mBody.position, {
                        x: F.x * player.forwardForce,
                        y: F.y * player.forwardForce
                    });
                }

                if (pad.buttons[1].pressed) {

                    var F = player.forwardDirection();

                    player.applyForce(player.mBody.position, {
                        x: -F.x * player.forwardForce * 0.25,
                        y: -F.y * player.forwardForce * 0.25
                    }); // scale reverse force
                }

                // Calculate turn as a continuous function of pad.axes[0]
                Matter.Body.setAngularVelocity(player.mBody, 0);

                if (Math.abs(pad.axes[0]) > 0.1) {

                    player.rotate((Math.PI / 180) * player.rotateSpeed * pad.axes[0] * (deltaTime / 1000));
                }
            }
        }


    };


    return stage;

})((OverDrive.Stages.MainGame || {}), OverDrive.canvas, OverDrive.context);
