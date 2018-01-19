//
// Model main players
//

OverDrive.Game = (function(gamelib, canvas, context) {

  gamelib.Player = function(config) {

    // Matter.js module aliases
    var Engine = Matter.Engine,
      Render = Matter.Render,
      World = Matter.World,
      Bodies = Matter.Bodies,
      Body = Matter.Body,
      Composite = Matter.Composite;

    var self = this;

    this.canvas2 = OverDrive.canvas;
    this.context2 = OverDrive.context2;

    this.strength = 100;
    this.score = 0;
    this.scale = config.scale;
    this.mBody = null;
    this.size = null;
    this.pid = config.pid;
    this.rechargeRate = 1;
    this.forwardForce = config.forwardForce;
    this.rotateSpeed = config.rotateSpeed;

    this.sprite = new OverDrive.Game.Sprite(

      config.spriteURI,

      function(w, h) {

        let size = {
          width: w * self.scale * config.boundingVolumeScale,
          height: h * self.scale * config.boundingVolumeScale
        };

        self.mBody = Bodies.rectangle(config.x, config.y, size.width, size.height);
        Body.setAngle(self.mBody, config.angle);
        self.size = size;

        Body.setMass(self.mBody, config.mass);

        self.mBody.collisionFilter.group = config.collisionGroup;
        self.mBody.collisionFilter.category = OverDrive.Game.CollisionModel.Player.Category;
        self.mBody.collisionFilter.mask = OverDrive.Game.CollisionModel.Player.Mask;

        self.mBody.frictionAir = track_friction;
        // Set friction to 0 to fix wall collisions
        self.mBody.friction = 0.0;

        self.mBody.hostObject = self;

        World.add(config.world, [self.mBody]);

        self.preUpdate = config.preUpdate;
        self.postUpdate = config.postUpdate;
      }
    );

    // Projectile / fire handling
    this.fireRechargeTime = 0;


    //
    // Rendering interface
    //

    this.draw = function() {

      if (this.mBody) {

        context.save();

        var pos = this.mBody.position;
        var theta = this.mBody.angle;

        context.translate(pos.x, pos.y);
        context.rotate(theta);
        context.translate(-this.sprite.image.width * this.scale / 2, -this.sprite.image.height * this.scale / 2);
        this.sprite.draw(0, 0, this.scale);

        context.restore();
      }

    }

    this.draw2 = function() {

        if (this.mBody) {

            this.context2.save();

            var pos = this.mBody.position;
            var theta = this.mBody.angle;

            this.context2.translate(pos.x, pos.y);
            this.context2.rotate(theta);
            this.context2.translate(-this.sprite.image.width * this.scale / 2, -this.sprite.image.height * this.scale / 2);
            this.sprite.draw2(0, 0, this.scale, this.canvas2, this.context2);

            this.context2.restore();
        }

    }

    // Draw player bounding volume (Geometry of Matter.Body mBody)
    this.drawBoundingVolume = function(bbColour) {

      if (this.mBody) {

        // Render basis vectors

        // Get bi-tangent (y basis vector)
        var by = this.forwardDirection();

        // Calculate tangent (x basis vector) via perp-dot-product
        var bx = {

          x: -by.y,
          y: by.x
        }

        var pos = this.mBody.position;

        var w = this.sprite.image.width * this.scale / 2;
        var h = this.sprite.image.height * this.scale / 2;

        context.lineWidth = 2;

        context.strokeStyle = '#FF0000';
        context.beginPath();
        context.moveTo(pos.x, pos.y);
        context.lineTo(pos.x + bx.x * w, pos.y + bx.y * w);
        context.stroke();

        context.strokeStyle = '#00FF00';
        context.beginPath();
        context.moveTo(pos.x, pos.y);
        context.lineTo(pos.x + by.x * h, pos.y + by.y * h);
        context.stroke();



        // Record path of mBody geometry
        context.beginPath();

        var vertices = this.mBody.vertices;

        context.moveTo(vertices[0].x, vertices[0].y);

        for (var j = 1; j < vertices.length; ++j) {

          context.lineTo(vertices[j].x, vertices[j].y);
        }

        context.lineTo(vertices[0].x, vertices[0].y);

        // Render geometry
        context.lineWidth = 1;
        context.strokeStyle = bbColour;
        context.stroke();
      }
    }



    //
    // Control interface
    //

    this.forwardDirection = function() {

      if (this.mBody) {

        var theta = this.mBody.angle;

        return {
          x: -Math.sin(-theta),
          y: -Math.cos(-theta)
        };
      }
    }


    // Apply force at pos p on body 'this'
    this.applyForce = function(pos, direction) {

      Body.applyForce(this.mBody, pos, direction);
    }



    this.applyTorque = function(pos, t) {

      var F = this.forwardDirection();
      var T = {
        x: -F.y,
        y: F.x
      };

      player1.applyForce(pos, {
        x: T.x * t,
        y: T.y * t
      });

      // Apply inverse force to centre of mass to only induce rotation (TOO SPECIFIC TO OVERDRIVE???)
      player1.applyForce(player1.mBody.position, {
        x: T.x * -t,
        y: T.y * -t
      });
    }


    this.rotate = function(dTheta) {

      Body.rotate(this.mBody, dTheta);
    }


    this.addStrength = function(energyDelta) {

      this.strength = Math.max(0, Math.min(100, this.strength + energyDelta));
    }


    this.addPoints = function(scoreDelta) {

      this.score = Math.max(0, this.score + scoreDelta);
    }

    //increase and decrease the forward forece by getting a powerup
    this.addSpeed = function(speedDelta) {

      this.forwardForce =  Math.max(0.001, this.forwardForce + speedDelta);
    }

    this.increaseSize = function(size) {

      this.scale = Math.max(0.5, this.scale + size);
    }

    this.friction = function(frictionDelta) {

      this.rotateSpeed = frictionDelta;
    }

    this.updateStrength = function(strengthDelta) {

      this.strength = this.strength + strengthDelta;
    }

    this.increaseFireRate = function(fireRateScale) {

      this.rechargeRate = this.rechargeRate * fireRateScale;
    }

    this.increaseDiskCount = function(count){
      if(this.diskCount != 0){
      this.diskCount = this.diskCount + count;
      }
      else {
        this.diskCount = count;
      }
    }

    this.fireDisk = function(){
      if(this.diskCount > 0){
        // Now you can fire a shell
        // config requirements
        // type, owner, type.range, type.strength, type.mass, type.range,type.rechargeTime,type.spriteURI

        Matter.World.add(overdrive.engine.world, []);
      }
    }
    //
    // Collision interface
    //

    this.doCollision = function(otherBody, env) {
      // DEBUGGING MESS  UNCOMMENT TO SEE ALL COLLISIONS
      //console.log('Collision with ' + otherBody.mbody.type + ' at ' + otherBody.mBody.position.x + ', ' + otherBody.mBody.position.y);
      //console.log('doCollision called');
      // console.log('This');
      //console.log(this);
      //console.log('otherBody');
      //console.log(otherBody);
      otherBody.collideWithPlayer(this, {

        objA: env.objB,
        objB: env.objA,
        host: env.host
      });
    }

    this.collideWithPlayer = function(otherPlayer, env) {

      console.log('Oi, knock it off!');
    }

    this.collideWithProjectile = function(projectile, env) {}

    this.collideWithPickup = function(pickup, env) {
      console.log('collided with pickup at ' + pickup.x + '  ' + pickup.y);
      pickup.collideWithPlayer(this, {

        objA: env.objB,
        objB: env.objA,
        host: env.host
      });
    }

    this.collideWithNPC = function(npc, env) {

      console.log('Ouch from player!');
    }

    this.collideWithPath = function(path, env) {
      //console.log('Collided with path');
      //console.log(path);
      path.collideWithPlayer(this, {

        objA: env.objB,
        objB: env.objA,
        host: env.host
      });
    }
  }

  return gamelib;

})((OverDrive.Game || {}), OverDrive.canvas, OverDrive.context);
