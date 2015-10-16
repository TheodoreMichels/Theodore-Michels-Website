/*
Raycaster
Interactive, Procedurally Generated Banner Graphics
Theodore Michels 2015
Last updated: 07/12/2015
*/

// Put this in a function instance so that everything is out of the global namespace
var raycaster = function (r) {
    var numLines = 200; // How many lines at once?
    var rays = []; // Contains all of the "LineRay" objects.

    var rotationAngle = 135.0; // Angle to rotate all of the lines.

    /**** UI ****/
    var showUI = false;
    var overToggle = false;
    var overSlider = false;
    var toggleSize = 20;
    var sliders = [];

    var canvas
    r.setup = function () {
        canvas = r.createCanvas(r.windowWidth, r.windowHeight);
        canvas.mousePressed(uiCheck); // Add mousePressed listener
        canvas.mouseReleased(releaseCheck);
        r.background(0);
        r.smooth();

        /**** INITIALIZE SLIDERS ****/
        sliders[0] = new Slider(r.width / 2, toggleSize, r.width / 2, toggleSize, r.color(255, 80)); // Speed slider

        sliders[1] = new Slider(toggleSize, r.height / 2, toggleSize, r.height / 2, r.color(255, 0, 0, 120)); // Red value slider
        sliders[1].sliderValue = 0.2; // Arbitrary initial values
        sliders[2] = new Slider(toggleSize * 3, r.height / 2, toggleSize, r.height / 2, r.color(0, 255, 0, 120)); // Green value slider
        sliders[2].sliderValue = 0.5;
        sliders[3] = new Slider(toggleSize * 5, r.height / 2, toggleSize, r.height / 2, r.color(0, 0, 255, 120)); // Blue value slider
        sliders[3].sliderValue = 0.5;

        /**** INITIALIZE RAYS ****/
        for (var i = 0; i < numLines; i++) {
            rays[i] = new LineRay();
            rays[i].init();
        }
    }

    r.draw = function () {
        r.background(0);
        /******** RAYS ********/
        // Translate rays to the center for easy rotation around a central point.
        r.push();
        r.translate(r.width / 2, r.height / 2);
        r.rotate(r.radians(rotationAngle));
        for (var i = 0; i < numLines; i++) {
            rays[i].update();
        }
        r.pop();

        /******** UI ********/

        /**** Toggle ****/
        r.noFill();
        r.stroke(255);
        r.rectMode(r.CENTER);
        // Check to see if the mouse is over the toggle
        if (r.mouseX > toggleSize - (toggleSize / 2) &&
            r.mouseX < toggleSize + (toggleSize / 2) &&
            r.mouseY > (toggleSize / 2) &&
            r.mouseY < toggleSize + (toggleSize / 2)) {
            overToggle = true;
        } else {
            overToggle = false;
        }
        if (overToggle) {
            r.strokeWeight(2);
        } // highlight on mouse over
        else {
            r.strokeWeight(1);
        }

        if (showUI) {
            r.fill(255, 80);
        } else {
            r.noFill();
        }
        r.rect(toggleSize, toggleSize, toggleSize, toggleSize); // Draw the toggle

        if (showUI) {
            /**** Sliders ****/
            overSlider = false;
            for (var i = 0; i < sliders.length; i++) {
                sliders[i].update();
                if (sliders[i].mouseOver) {
                    overSlider = true; // true if over ANY sliders
                }
            }
            /**** Rotator ****/
            r.strokeWeight(2);
            r.stroke(255);
            r.noFill();
            var rotatorSize = r.height / 2;

            if (r.mouseIsPressed && !overToggle & !overSlider) { // If not over the toggle or sliders, then activate the rotator!
                var endVec = new p5.Vector(r.mouseX, r.mouseY);
                var centralVector = new p5.Vector(r.width / 2, r.height / 2);
                var pointVector = endVec.copy();
                pointVector.sub(centralVector); // Points from the center of the screen to the mouse.
                pointVector.normalize();
                pointVector.mult(rotatorSize / 2); // Normalize and scale so the line lands on the circle

                r.push();
                var angle = r.degrees(p5.Vector.angleBetween(new p5.Vector(-1, 0), pointVector)); // Get angle between left vector and mouse
                var angleAdjust;
                var finalAngle;
                if (r.mouseY > r.height / 2) { // .angleBetween only return acute angles, so convert them here when necessary
                    angleAdjust = 180 - angle;
                    angle = 180 + angleAdjust;
                }
                rotationAngle = angle; // Rotate the lines accordingly
                r.translate(r.width / 2, r.height / 2); // Move to the middle to draw the pointVector line
                r.line(0, 0, pointVector.x, pointVector.y);
                r.fill(255, 40);
                r.pop();
            }

            r.push(); // Using push and pop here to simplify rotations
            r.translate(r.width / 2, r.height / 2); // Jump to the center to draw
            r.arc(0, 0, rotatorSize / 2, rotatorSize / 2, r.PI, r.radians(rotationAngle) + r.PI); // Draw an arc between the left vector and the pointer vector
            r.noFill();
            r.line(-rotatorSize / 2, 0, 0, 0); // Draw the ellipses and line
            r.ellipse(0, 0, rotatorSize, rotatorSize);
            r.ellipse(-rotatorSize / 2, 0, 20, 20);
            r.pop();
        }

        /**** Text ****/
        r.noStroke();
        r.textSize(60);
        r.textAlign(r.CENTER, r.CENTER);
        if (!showUI) {
            r.fill(255, 180);
        } else {
            r.fill(255, 20); // Fade out when showing UI
        }
        r.text("YOUR TEXT HERE", r.width / 2, r.height / 2); // Put whatever you want here!
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
            this.lineSpeed = r.random(0.01, 0.02);

            this.currentLerpPoint = 0.0;
            this.currentLineAlpha = 80;

            this.lineColor = r.color( // Set the color based on color slider values
                r.random(100, 255) * sliders[1].sliderValue,
                r.random(100, 255) * sliders[2].sliderValue,
                r.random(100, 255) * sliders[3].sliderValue,
                this.currentLineAlpha);

            this.origin = new p5.Vector(-r.width, r.random(-r.width / 2, r.width / 2)); // Pick a random spot on the left
            this.destination = new p5.Vector(r.width, this.origin.y); // The destination is the same y-position, but on the right side of the canvas
        }

        this.update = function () {
            if (this.reset) {
                this.init();
            }
            this.currentPosition = p5.Vector.lerp(this.origin, this.destination, this.currentLerpPoint); // lerp between the origin and the destination 
            this.currentLerpPoint += this.lineSpeed * sliders[0].sliderValue; // increment lerp speed and multiply by slider value

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

    function Slider(_x, _y, _width, _height, _fillColor) { // Just a UI class - nothing too interesting here.
        this.x = _x;
        this.y = _y;
        this.sWidth = _width;
        this.sHeight = _height;
        this.fillColor = _fillColor;

        this.mouseOver = false;
        this.grabbed = false;
        this.sliderValue = 0.5; // Ranges from 0 to 1

        this.LR = true; // Slider orientation
        // If wider than it is tall, it's a left-right slider, otherwise it's up-down
        if (this.sWidth > this.sHeight) {
            this.LR = true;
        } else {
            this.LR = false;
        }

        this.update = function () {
            r.rectMode(r.CENTER);

            if ( // Check for mouse over
                r.mouseX > this.x - this.sWidth / 2 &&
                r.mouseX < this.x + this.sWidth / 2 &&
                r.mouseY > this.y - this.sHeight / 2 &&
                r.mouseY < this.y + this.sHeight / 2) {
                this.mouseOver = true;
            } else if (!this.grabbed) {
                this.mouseOver = false;
            }
            // Slider Fill
            r.fill(this.fillColor);
            r.noStroke();
            if (this.LR) {
                r.rect(this.x, this.y, this.sWidth * this.sliderValue, this.sHeight); // Fill left to right
            } else {
                r.rect(this.x, this.y, this.sWidth, this.sHeight * this.sliderValue); // Fill bottom to top
            }

            if (this.mouseOver) { // If the mouse is over, highlight
                r.strokeWeight(2);
                if (this.grabbed) {
                    if (this.LR) { // Find distance from left or bottom as appropriate
                        this.distance = r.mouseX - (this.x - this.sWidth / 2);
                        this.sliderValue = this.distance / this.sWidth;

                    } else {
                        this.distance = (this.y + this.sHeight / 2) - r.mouseY;
                        this.sliderValue = this.distance / this.sHeight;
                    }
                    if (this.sliderValue < 0) this.sliderValue = 0.0;
                    if (this.sliderValue > 1) this.sliderValue = 1.0;
                }
            } else {
                r.strokeWeight(1);
            }
            r.stroke(255);
            r.noFill();
            r.rect(this.x, this.y, this.sWidth, this.sHeight); // Slider Border    
        }
    }

    function mousePressed() { // Toggle the UI when the toggle is clicked.
    }

    function mouseReleased() {}

    function uiCheck() {
        if (overToggle) {
            showUI = !showUI;
        }
        for (var i = 0; i < sliders.length; i++) {
            if (sliders[i].mouseOver) {
                sliders[i].grabbed = true; // Used to "latch on" to sliders so you can still affect them when not over them
            }
        }
    }

    function releaseCheck() { // If the mouse is released, then none of the sliders are grabbed.

        for (var i = 0; i < sliders.length; i++) {
            sliders[i].grabbed = false;
        }
    }
}

var p5_r = new p5(raycaster, "p5Canvas");