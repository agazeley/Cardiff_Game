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
        var imageData = this.context2.getImageData(0, 0, this.canvas.width, this.canvas.height);
        var data = imageData.data;
        var dataBuffer = data.slice();
        context.clearRect(0, 0, canvas.width, canvas.height);
        for (var i = 0; i < data.length; i += 4) {
          var horizon = -300; //adjust if needed
          var fov = 60000;

          var idx = i / 4;
          var x = ((idx % canvas.width)) - canvas.width / 2;
          var y = Math.floor(idx / canvas.width) - canvas.height / 2;

          var px = x * 1100;
          var py = fov;
          var pz = y - horizon;

          //projection
          var sx = Math.floor(px / pz);
          var sy = Math.floor(py / pz);
          sy = (canvas.height - sy) + canvas.height / 2;
          sx = sx + canvas.height / 2

          var _idx = (sy * (canvas.width) * 4) + (sx * 4);
          //var screenIdx = data.length - i;

          data[i] = dataBuffer[_idx];
          data[i + 1] = dataBuffer[_idx + 1];
          data[i + 2] = dataBuffer[_idx + 2];
        }

        /*for (var i = 0; i < data.length; i += 4) {
          var horizon = -100; //adjust if needed
          var fov = 50;

          var idx = i / 4;
          var x = (idx % canvas.width);
          var y = Math.floor(idx / canvas.width);

          var px = x;
          var py = fov;
          var pz = y + horizon;

          //projection
          var sx = Math.floor(px / pz);
          var sy = Math.floor(py / pz);

          var scaling = 100; //adjust if needed, depends of texture size


          var _idx = (sy * (canvas.width)) + (sx * 4);
          //console.log(_idx);
          //console.log(data.length);
          data[i] = dataBuffer[_idx];
          data[i + 1] = dataBuffer[_idx + 1];
          data[i + 2] = dataBuffer[_idx + 2];
          data[i + 3] = dataBuffer[_idx + 3];
          //put (color) at (x, y) on screen

          //data[i] = 255 - data[i]; // red
          //data[i + 1] = 255 - data[i + 1]; // green
          //data[i + 2] = 255 - data[i + 2]; // blue
        }*/

        this.context.putImageData(imageData, 0, 0);
        /*var fov = 250;
        //grabbing a screenshot of the canvas using getImageData
        var imagedata = this.context.getImageData(0, 0, this.canvas.width, this.canvas.height);
        //looping through all pixel points
        var i = imagedata.length / 4;
        while (i--) {
          //var pixel = imagedata.data[i*4];
          //calculating 2d position for 3d coordinates
          //fov = field of view = denotes how far the pixels are from us.
          //the scale will control how the spacing between the pixels will decrease with increasing distance from us.
          //var scale = fov / (fov + pixel.z);
          var pIdx = i * 4;
          var y = Math.floor(pIdx / this.canvas.height);
          var x = (pIdx % this.canvas.width) / 4;
          var scale = 100;
          var x2d = x * scale + this.canvas.width / 2;
          var y2d = y * scale + this.canvas.height / 2;
          //marking the points green - only if they are inside the screen
          if (x2d >= 0 && x2d <= this.canvas.width && y2d >= 0 && y2d <= this.canvas.height) {
            //imagedata.width gives the width of the captured region(canvas) which is multiplied with the Y coordinate and then added to the X coordinate. The whole thing is multiplied by 4 because of the 4 numbers saved to denote r,g,b,a. The final result gives the first color data(red) for the pixel.
            var c = (Math.round(y2d) * imagedata.width + Math.round(x2d)) * 4;
            imagedata.data[c] = imagedata.data[pIdx]; //red
            imagedata.data[c + 1] = imagedata.data[pIdx + 1]; //green
            imagedata.data[c + 2] = imagedata.data[pIdx + 2]; //blue
            imagedata.data[c + 3] = imagedata.data[pIdx + 3]; //alpha
          }
          //pixel.z -= 1;
          //if (pixel.z < -fov) pixel.z += 2 * fov;
        }
        //putting imagedata back on the canvas
        this.context.putImageData(imagedata, 0, 0);*/
        this.context.restore();
      }
    }

    this.draw2 = function() {

      if (self.backgroundLoaded) {

        this.context2.clearRect(-this.canvas2.width, -this.canvas2.height, this.canvas2.width * 3, this.canvas2.height * 3);
        this.context2.save();
        this.context2.drawImage(self.image, 0, 0);
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