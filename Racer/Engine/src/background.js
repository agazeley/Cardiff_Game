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

        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.context.save();
        this.context.drawImage(self.image, 0, 0, this.canvas.width, this.canvas.height);
        /*self.image.style.display = 'none';
        var imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        var data = imageData.data;
        var dataBuffer = data.slice();
        for (var i = 0; i < data.length; i += 4) {
            var horizon = 20; //adjust if needed
            var fov = 200;

            var idx = i / 4;
            var x = idx % canvas.width;
            var y = Math.floor(idx / canvas.width);

            var px = x;
            var py = fov;
            var pz = y + horizon;

            //projection
            var sx = Math.floor(px / pz);
            var sy = Math.floor(py / pz);

            var scaling = 100; //adjust if needed, depends of texture size


            var _idx = (sy * (canvas.width * 4)) + (sx * 4);
            //console.log(_idx);
            //console.log(data.length);
            data[_idx] = data[i];
            data[_idx+1] = data[i+1];
            data[_idx+2] = data[i+2];
            //put (color) at (x, y) on screen

            //data[i]     = 255 - data[i];     // red
            //data[i + 1] = 255 - data[i + 1]; // green
            //data[i + 2] = 255 - data[i + 2]; // blue
        }
        console.log("finished");
        context.putImageData(imageData, 0, 0);*/
        this.context.restore();
      }
    }

    this.draw2 = function() {

      if (self.backgroundLoaded) {

        this.context2.clearRect(0, 0, this.canvas2.width, this.canvas2.height);
        this.context2.save();
        this.context2.drawImage(self.image, 0, 0, this.canvas2.width, this.canvas2.height);
        this.context2.restore();
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