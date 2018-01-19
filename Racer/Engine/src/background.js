// Game background

OverDrive.Game = (function(gamelib, canvas, context) {

  gamelib.Background = function(imageURL) {

    var self = this;

    this.canvas = canvas;
    this.context = context;
    this.canvas2 = OverDrive.canvas2;
    this.context2 = OverDrive.context2;

    this.onLoaded = function() {

      self.backgroundLoaded = true;
    }

    this.draw = function() {

      if (self.backgroundLoaded) {

        this.context.clearRect(-this.canvas.width, -this.canvas.height, this.canvas.width * 3, this.canvas.height * 3);
        this.context.save();
        this.context.drawImage(self.image, 0, 0);
        self.image.style.display = 'none';
        var imageData = this.context.getImageData(0, 0, this.canvas.width, this.canvas.height);
        var data = imageData.data;
        var dataBuffer = data.slice();

        var width = this.canvas.width;

        for (var i = 0; i < data.length; i += 4) {
          var horizon = -650;
          var fov = 5;

          var idx = i / 4;
          var x = (idx % width) - width / 2;
          var y = Math.floor(idx / width);

          var px = x*60;
          var py = fov*5000;
          var pz = y;

          //projection
          var sx = Math.floor(px / pz) + width/2;
          var sy = Math.floor(py / pz) + 100;

          var _idx = (sy * width + sx) * 4;

          data[i] = dataBuffer[_idx];
          data[i + 1] = dataBuffer[_idx + 1];
          data[i + 2] = dataBuffer[_idx + 2];
        }

        this.context.putImageData(imageData, 0, 0);
        this.context.restore();
      }
    }

    this.drawNormal = function() {
        this.context.clearRect(-this.canvas.width, -this.canvas.height, this.canvas.width * 3, this.canvas.height * 3);
        this.context.save();
        this.context.drawImage(self.image, 0, 0);
        this.context.restore();
    }

    this.drawNormal2 = function() {
        this.context2.clearRect(-this.canvas2.width, -this.canvas2.height, this.canvas2.width * 3, this.canvas2.height * 3);
        this.context2.save();
        this.context2.drawImage(self.image, 0, 0);
        this.context2.restore();
    }

    this.draw2 = function() {

      if (self.backgroundLoaded) {

          this.context2.clearRect(-this.canvas2.width, -this.canvas2.height, this.canvas2.width * 3, this.canvas2.height * 3);
          this.context2.save();
          OverDrive.context2overlay.save();
          this.context2.drawImage(self.image, 0, 0);
          OverDrive.context2overlay.scale(1, -1);
          OverDrive.context2overlay.translate(0, -OverDrive.canvas2overlay.height);
          OverDrive.context2overlay.drawImage(this.canvas2, 0, 0);
          /*self.image.style.display = 'none';
          var imageData = this.context2.getImageData(0, 0, this.canvas2.width, this.canvas2.height);
          var data = imageData.data;
          var dataBuffer = data.slice();

          var width = this.canvas2.width;

          for (var i = 0; i < data.length; i += 4) {
            var horizon = -250;
            var fov = 5;

            var idx = i / 4;
            var x = (idx % width) - width / 2;
            var y = Math.floor(idx / width);

            var px = x*100;
            var py = fov*8000 + 3000;
            var pz = y - horizon;

            //projection
            var sx = Math.floor(px / pz) + width/2;
            var sy = Math.floor(py / pz);

            var _idx = (sy * width + sx) * 4;

            data[i] = dataBuffer[_idx];
            data[i + 1] = dataBuffer[_idx + 1];
            data[i + 2] = dataBuffer[_idx + 2];
          }

          this.context2.putImageData(imageData, 0, 0);*/
          this.context2.restore();
          OverDrive.context2overlay.restore();
      }
    }

    this.drawFull = function() {

      if (self.backgroundLoaded) {

        OverDrive.fullContext.clearRect(0, 0, OverDrive.fullCanvas.width, OverDrive.fullCanvas.height);
        OverDrive.fullContext.save();
        OverDrive.fullContext.drawImage(self.image, 0, 0, OverDrive.fullCanvas.width, OverDrive.fullCanvas.height);
        OverDrive.fullContext.restore();
      }
    }

    this.backgroundLoaded = false;
    this.image = new Image();
    this.image.onload = this.onLoaded();
    this.image.src = imageURL;
  }


  return gamelib;

})((OverDrive.Game || {}), OverDrive.canvas, OverDrive.context);
