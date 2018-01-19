
// Game background

OverDrive.Game = (function(gamelib, canvas, context) {

  gamelib.Background = function(imageURL) {

    var self = this;
    this.canvas2 = OverDrive.canvas2;
    this.context2 = OverDrive.context2;

    this.onLoaded = function() {

      self.backgroundLoaded = true;
    }

    this.draw = function() {

      if (self.backgroundLoaded) {

          context.clearRect(-canvas.width, -canvas.height, canvas.width * 3, canvas.height * 3);
          context.drawImage(self.image, 0, 0, canvas.width, canvas.height);
      }
    }

    this.draw2 = function() {
        if (self.backgroundLoaded) {

            this.context2.clearRect(-this.canvas2.width, -this.canvas2.height, this.canvas2.width * 3, this.canvas2.height * 3);
            this.context2.save();
            this.context2.drawImage(self.image, 0, 0, this.canvas2.width, this.canvas2.height);
            this.context2.restore();
        }
    }

    this.backgroundLoaded = false;
    this.image = new Image();
    this.image.onload = this.onLoaded();
    this.image.src = imageURL;
  }


  return gamelib;

})((OverDrive.Game || {}), OverDrive.canvas, OverDrive.context);
