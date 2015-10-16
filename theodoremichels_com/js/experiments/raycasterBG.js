/*
Raycaster
Interactive, Procedurally Generated Banner Graphics
Theodore Michels 2015
Last updated: 07/12/2015
*/

// Put this in a function instance so that everything is out of the global namespace
var raycastBG = function (r) {
    var numLines = 100; // How many lines at once?
    var rays = []; // Contains all of the "LineRay" objects.

    var rotationAngle = 135.0; // Angle to rotate all of the lines.

    var canvas
    r.setup = function () {
        canvas = r.createCanvas(r.windowWidth, r.windowHeight);

        r.background(255);
        r.smooth();

        /**** INITIALIZE RAYS ****/
        for (var i = 0; i < numLines; i++) {
            rays[i] = new LineRay();
            rays[i].init();
        }
    }

    r.draw = function () {

        r.background(255);
        /******** RAYS ********/
        // Translate rays to the center for easy rotation around a central point.
        r.push();
        r.translate(r.width / 2, r.height / 2);
        r.rotate(r.radians(rotationAngle));
        for (var i = 0; i < numLines; i++) {
            rays[i].update();
        }
        r.pop();

    }

    /******** CLASSES ********/
    function LineRay() {
        this.lineWidth;
        this.lineSpeed;
        this.currentLerpPoint;

        this.currentLineAlpha; // Used to fade out the line
        this.lineColor;

        this.origin;
        this.destination;
        this.currentPosition;

        this.reset; // Should the line be reset?
        // Called to reset the line once it's offscreen.
        this.init = function () {
            this.reset = false;

            this.lineWidth = r.random(2, 20);
            this.lineSpeed = r.random(0.001, 0.005);

            this.currentLerpPoint = 0.0;
            this.currentLineAlpha = 80;

            this.lineColor = r.color( // Set the color based on color slider values
                r.random(100, 255) * .6,
                r.random(100, 255) * .1,
                r.random(100, 255) * .3,
                this.currentLineAlpha);

            this.origin = new p5.Vector(-r.width, r.random(-r.width / 2.5, r.width / 2.5)); // Pick a random spot on the left
            this.destination = new p5.Vector(r.width, this.origin.y); // The destination is the same y-position, but on the right side of the canvas
        }

        this.update = function () {
            if (this.reset) {
                this.init();
            }
            this.currentPosition = p5.Vector.lerp(this.origin, this.destination, this.currentLerpPoint); // lerp between the origin and the destination 
            this.currentLerpPoint += this.lineSpeed; // increment lerp speed and multiply by slider value

            if (this.currentPosition.x > r.width) { // If off screen, then start fading
                this.currentLineAlpha -= 2;
                if (this.currentLineAlpha < 0) { // If completely faded, reset the line
                    this.currentLineAlpha = 0;
                    this.reset = true;
                }
            }
            r.strokeWeight(this.lineWidth);
            this.lineColor = r.color(r.red(this.lineColor), r.green(this.lineColor), r.blue(this.lineColor), this.currentLineAlpha);
            r.stroke(this.lineColor);
            r.strokeCap(r.SQUARE);

            r.line(this.origin.x, this.origin.y, this.currentPosition.x, this.currentPosition.y);
        }
    }
}

var p5_r = new p5(raycastBG, "rayCastBG");