/*
Aquamarine
 Procedurally Generated Banner Graphics
 Theodore Michels 2015
 Last updated: 07/30/2015
 */
// Put this in a function instance so that everything is out of the global namespace
var aquamarine = function (a) {
    // An array of "brushes", which will create all of the strokes
    var numBrushes = 50;
    var theBrushes = [];

    a.setup = function () {
        canvas = a.createCanvas(a.windowWidth, a.windowHeight);
        a.smooth();

        for (var i = 0; i < numBrushes; i++) {
            theBrushes[i] = new Brush(a.random(a.width), a.random(a.height)); // Initialize all of the brushes at random positions
        }
        a.background(0); // Initialize the background.
    }

    a.draw = function () { // Note that no background is drawn here - previous frames are preserved.

        for (var i = 0; i < numBrushes; i++) {
            theBrushes[i].update(); // Update all of the brushes.
            if (theBrushes[i].strokeLifetime > theBrushes[i].strokeDuration * 2) {
                theBrushes[i] = new Brush(a.random(a.width), a.random(a.height)); // If a brush has been drawing for too long, then re-initialize it.

            }
        }
        a.strokeWeight(20);
        a.stroke(0);

    }

    // Consists of several "bristles", which are just ellipses of different sizes and colors,
    // which appear and disappear at different rates.
    function Brush(startX, startY) {
        this.numBristles = 25; // How many different points are drawing lines?

        this.brushPosition = new p5.Vector(startX, startY); // The central brush position.
        this.brushMovement = new p5.Vector(); // The movement vector.

        this.bristlePositions = []; // The position of each "bristle"
        this.bristleSpeeds = []; // Each bristle increases in size at a different rate.
        this.bristleSizes = []; // Keeps track of the current size of each bristle.
        this.bristleColors = []; // Each bristle should have a slightly different color.
        this.startOffsets = []; // Each bristle should start drawing at different times.
        this.maxBristleSize = []; // The maximum size of this bristle.

        this.brushWidth = a.random(30, 60); // How wide is the brush?

        this.strokeDuration = a.random(100, 400); // When should the stroke start tapering off?
        this.strokeLifetime = 0; // How long has the stroke been..."stroking"?

        this.moveCounter = 0; // For drawing curves.
        this.moveRate = a.random(-0.04, 0.04); // How fast is the curve drawn - also affects the "tightness" of the curve
        // Random colors.
        this.colorR = a.random(0, 100);
        this.colorG = a.random(100, 255);
        this.colorB = a.random(180, 255);

        // Each bristle is special and unique - like a snowflake!
        for (var i = 0; i < this.numBristles; i++) {
            this.bristleSizes[i] = 0.0;
            this.maxBristleSize[i] = a.random(1, 3.0);
            this.bristleSpeeds[i] = a.random(0.01, 0.2);
            this.startOffsets[i] = a.random(0, 60);
            this.bristleColors[i] = a.color(a.random(this.colorR / 2, this.colorR), a.random(this.colorG / 2, this.colorG), a.random(this.colorB / 2, this.colorB), 100);
        }

        this.update = function () {
            this.moveCounter += this.moveRate; // Increment the counter.
            this.brushMovement = new p5.Vector(a.sin(this.moveCounter), a.cos(this.moveCounter)); // The brush moves in a circle.
            this.strokeLifetime++; // How many frames has this been around?
            this.brushPosition.add(this.brushMovement); // Add the movement vector to the current position.
            this.perpVector = new p5.Vector(-this.brushMovement.y, this.brushMovement.x); // Get a vector perpendicular to the forward vector.
            this.perpVector.normalize();

            a.noStroke();
            for (var i = 0; i < this.numBristles; i++) {
                if (this.strokeLifetime > this.startOffsets[i]) { // If the stroke has been around longer than its offset, start increasing its size.
                    if (this.strokeLifetime > this.strokeDuration) { // If the lifetime is greater than the duration, start decreasing the stroke size.
                        if (this.strokeLifetime - this.strokeDuration > this.startOffsets[i]) { // Use the start offset again so that strokes start tapering at different times.
                            this.bristleSizes[i] -= this.bristleSpeeds[i];
                        }
                    } else {
                        this.bristleSizes[i] += this.bristleSpeeds[i]; // Increase the bristle size.
                        this.bristleSizes[i] += a.random(-0.4, 0.4); // Add random varation to bristle size for a more "organic" look.
                    }

                    // Clamp the bristle size between 0 and the max.
                    if (this.bristleSizes[i] > this.maxBristleSize[i]) {
                        this.bristleSizes[i] = this.maxBristleSize[i];
                    }
                    if (this.bristleSizes[i] < 0) {
                        this.bristleSizes[i] = 0;
                    }
                }

                this.bristlePositions[i] = this.perpVector.copy();
                // Arrange bristles perpendicular to the forward vector at varying distances.
                this.bristleOffset = (i + 0.5 - this.numBristles / 2.0) * (this.brushWidth / this.numBristles);
                this.bristlePositions[i].mult(this.bristleOffset);
                this.bristlePositions[i].add(this.brushPosition); // Add the offset vector to the current position.

                a.fill(this.bristleColors[i]); // Fill with this particular bristle's color.
                // Each bristle is an ellipses perpendicular to the forward vector.
                a.ellipse(this.bristlePositions[i].x, this.bristlePositions[i].y, this.bristleSizes[i], this.bristleSizes[i]);
            }
        }
    }
}

var p5_aq = new p5(aquamarine, "p5Canvas");