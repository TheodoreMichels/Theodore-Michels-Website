/*
Assembler
 Procedurally Generated Banner Graphics
 Theodore Michels 2015
 Last updated: 07/22/2015
 */

// Put this in a function instance so that everything is out of the global namespace
var assembler = function (a) {
    var numPoints = 50; // The starting number of points.

    var smartPoints = []; // Contains each of the points which will look for other points to connect to.

    var moving = false; // Is the composition currently moving?
    var moveDuration = 300; // For how long should the composition move (frames)?
    var timeMoving = 0;
    var stillDuration = 0; // For how long should the composition remain still?
    var timeStill = 0;

    /**** Colors ****/
    // Keep track of previous colors to interpolate between them.
    var bgColor;
    var bgColorLast;
    var currentBgColor = a.color(0, 0, 0);

    var triColor;
    var triColorLast;
    var currentTriColor = a.color(0, 0, 0);

    a.setup = function () {
        canvas = a.createCanvas(a.windowWidth, a.windowHeight);
        a.smooth();
        a.background(0);
        for (var i = 0; i < numPoints; i++) {
            smartPoints[i] = new SmartPoint(); // Create the initial number of "Smart Points" (class listed below...)
        }
        // Random starting colors.
        bgColorLast = a.color(a.random(180), a.random(180), a.random(180));
        bgColor = a.color(a.random(180), a.random(180), a.random(180));
        triColorLast = a.color(a.random(255), a.random(255), a.random(255), 80);
        triColor = a.color(a.random(255), a.random(255), a.random(255), 80);
    }

    a.draw = function () {

        a.background(currentBgColor); // Fill with the currently lerped bgColor  
        // Move once the time is up.
        if (timeStill > stillDuration) {
            moving = true;
        } else {
            moving = false;
        }

        if (moving) {
            timeMoving++;
            // While moving, interpolate the colors of the background and triangles between random values
            currentBgColor = a.lerpColor(bgColorLast, bgColor, timeMoving / moveDuration);
            currentTriColor = a.lerpColor(triColorLast, triColor, timeMoving / moveDuration);
            // Once the movement time is up, generate some new random values and reset counters.
            if (timeMoving > moveDuration) {
                stillDuration = a.random(200, 600);
                moveDuration = a.random(100, 400);
                timeStill = 0;
                timeMoving = 0;

                bgColorLast = bgColor; // This color is now the last one; then generate a new one.
                bgColor = a.color(a.random(180), a.random(180), a.random(180));

                triColorLast = triColor;
                triColor = a.color(a.random(255), a.random(255), a.random(255), 80);
            }
        } else {
            timeStill++;
        }

        for (var i = 0; i < smartPoints.length; i++) {
            smartPoints[i].update(); // Update all points    

            if (smartPoints[i].done) {
                // After removing inactive points, add new ones.
                smartPoints[i] = new SmartPoint();
            }
        }
    }

    /******** CLASSES ********/
    function SmartPoint() {
        // This "SmartPoint" looks for its 2 nearest neighbors and draws a triangle using itself and the other 2 points.
        this.offscreen = false; // If this point is "out of bounds", it should stop looking for connections.
        this.done = false;

        this.size = a.random(10, 60);
        this.alphaValue = 0.0;

        this.currentPosition = new p5.Vector(a.random(a.width), a.random(a.height)); // Position of this point.
        this.currentEndPoint1 = new p5.Vector(); // Where are the points of the triangle currently?
        this.currentEndPoint2 = new p5.Vector();
        this.movement = p5.Vector.random2D(); // Generate a random movement direction for this point.
        this.movement.mult(a.random(0.2, 1.0));
        // Are the other ends of the triangle moving? If so, how far have they gotten?
        this.moving1 = false;
        this.moveCounter1 = 0.0;
        this.moving2 = false;
        this.moveCounter2 = 0.0;

        // The other "Smart Points" that this point is linked to.
        // Also keep track of the "OLD" points for interpolation.
        this.sibling_1 = this;
        this.sibling_1_OLD = this;
        this.sibling_2 = this;
        this.sibling_2_OLD = this;

        this.update = function () { // The class' central function

            // Check to see if the point is offscreen (with some padding)
            if (this.currentPosition.x > a.width + a.width / 4 ||
                this.currentPosition.x < 0 - a.width / 4 ||
                this.currentPosition.y > a.height + a.height / 4 ||
                this.currentPosition.y < 0 - a.height / 4) {
                if (!this.offscreen) { // This should only happen once.
                    this.offscreen = true;
                }
            }

            if (moving) {
                this.currentPosition.add(this.movement); // Add the random movement vector if applicable
            }
            /******** FIND 2 NEAREST POINTS ********/
            // If this point is not offscreen, and if neither of its points are moving, then continue looking for the closest points.
            if (!this.offscreen && !this.moving1 && !this.moving2) {
                for (var i = 0; i < smartPoints.length; i++) { // Look through every other point.
                    this.curPoint = smartPoints[i]; // Placeholder for simplification
                    if (this.curPoint != this && // Don't look at self.
                        this.curPoint != this.sibling_2 && // Don't look if already connected via "sibling_2"
                        this.curPoint.sibling_1 != this && // Ignore if other points are already connected to this one.
                        this.curPoint.sibling_2 != this) {
                        // Finally, if the currently examined point is closer that the current "sibling", then this point will be its new sibling.
                        if (this.sibling_1 == this ||
                            this.sibling_1.offscreen ||
                            p5.Vector.dist(this.currentPosition, this.curPoint.currentPosition) < p5.Vector.dist(this.currentPosition, this.sibling_1.currentPosition)
                        ) {
                            this.sibling_1 = this.curPoint;
                        }
                        // Now, do the same thing again to get the second point.
                        if (this.curPoint != this.sibling_1) { // Ignore sibling_1
                            if (this.sibling_2 == this ||
                                p5.Vector.dist(this.currentPosition, this.curPoint.currentPosition) < p5.Vector.dist(this.currentPosition, this.sibling_2.currentPosition) ||
                                this.sibling_2.offscreen
                            ) {
                                this.sibling_2 = this.curPoint;
                            }
                        }
                    }
                }
            }

            /******** MOVE TO NEAREST POINTS ********/
            /**** First Point ****/
            if (this.sibling_1 != this.sibling_1_OLD || this.offscreen) { // If the nearest sibling has changed...then move to it.
                this.moving1 = true;
            }

            if (this.moving1) { // If moving...interpolate between points based on a number of factors.
                this.moveCounter1 += 0.05; // Increment the counter for interpolation.
                if (!this.offscreen) { // If not offscreen, lerp between the old position and the new.
                    this.currentEndPoint1 = p5.Vector.lerp(this.sibling_1_OLD.currentPosition, this.sibling_1.currentPosition, this.moveCounter1);
                } else { // Otherwise, "retract" by lerping between the nearest point and the current position.
                    this.currentEndPoint1 = p5.Vector.lerp(this.sibling_1.currentPosition, this.currentPosition, this.moveCounter1);
                }
            } else { // If finished moving, the end point is just the sibling's position.
                this.currentEndPoint1 = this.sibling_1.currentPosition;
            }

            if (this.moveCounter1 >= 1.0) { // If the counter is greater than 1 (at the destination), then stop moving.
                this.moving1 = false; // Stop moving and reset the counter.
                this.moveCounter1 = 0.0;
                if (!this.offscreen) {
                    this.sibling_1_OLD = this.sibling_1; // The old and current siblings are now the same.
                } else {
                    this.done = true; // If offscreen, this point is ready for removal.
                }
            }
            /**** Second Point ****/
            if (this.sibling_2 != this.sibling_2_OLD || this.offscreen) { // Now do the same thing for the second point.
                this.moving2 = true;
            }

            if (this.moving2) {
                this.moveCounter2 += 0.05;
                if (!this.offscreen) {
                    this.currentEndPoint2 = p5.Vector.lerp(this.sibling_2_OLD.currentPosition, this.sibling_2.currentPosition, this.moveCounter2);
                } else {
                    this.currentEndPoint2 = p5.Vector.lerp(this.sibling_2.currentPosition, this.currentPosition, this.moveCounter2);
                }
            } else {
                this.currentEndPoint2 = this.sibling_2.currentPosition;
            }

            if (this.moveCounter2 >= 1.0) {
                this.moving2 = false;
                this.moveCounter2 = 0.0;
                if (!this.offscreen) {
                    this.sibling_2_OLD = this.sibling_2;
                } else {
                    this.done = true;
                }
            }

            /******** DISPLAY ********/
            a.noStroke(); // No stroke, we'll draw an "incomplete" border below with line()
            a.strokeWeight(1);
            a.fill(currentTriColor);
            // Draw a triangle between this point and its two siblings.
            a.triangle(this.currentPosition.x, this.currentPosition.y, this.currentEndPoint1.x, this.currentEndPoint1.y, this.currentEndPoint2.x, this.currentEndPoint2.y);

            // Fade in the ellipses
            if (this.alphaValue < 80) {
                this.alphaValue += 1;
                if (this.alphaValue >= 80) {
                    this.alphaValue = 80.0;
                }
            }

            a.stroke(255, this.alphaValue * 2.0);
            a.strokeWeight(2);
            a.noFill();
            a.ellipse(this.currentPosition.x, this.currentPosition.y, this.size * 1.2, this.size * 1.2); // The larger, outer ring.

            this.ellipseColor = a.lerpColor(currentTriColor, currentBgColor);
            this.ellipseColor = a.color(this.ellipseColor.getRed, this.ellipseColor.getGreen, this.ellipseColor.getBlue, this.alphaValue);
            a.fill(this.ellipseColor); // A color between the background and triangles.
            a.stroke(255, this.alphaValue);
            a.strokeWeight(1);
            a.ellipse(this.currentPosition.x, this.currentPosition.y, this.size, this.size); // The smaller, inner ring.

            // Find a bunch of points between all of the triangle's corners.
            this.start1 = p5.Vector.lerp(this.currentPosition, this.currentEndPoint1, 0.4);
            this.end1 = p5.Vector.lerp(this.currentPosition, this.currentEndPoint1, 0.6);
            this.start2 = p5.Vector.lerp(this.currentPosition, this.currentEndPoint2, 0.4);
            this.end2 = p5.Vector.lerp(this.currentPosition, this.currentEndPoint2, 0.6);
            this.start3 = p5.Vector.lerp(this.currentEndPoint1, this.currentEndPoint2, 0.4);
            this.end3 = p5.Vector.lerp(this.currentEndPoint1, this.currentEndPoint2, 0.6);
            a.strokeWeight(1);
            a.strokeCap(a.SQUARE);
            a.stroke(255, 80);
            // Draw the border lines
            a.line(this.currentPosition.x, this.currentPosition.y, this.start1.x, this.start1.y);
            a.line(this.currentEndPoint1.x, this.currentEndPoint1.y, this.end1.x, this.end1.y);
            a.line(this.currentPosition.x, this.currentPosition.y, this.start2.x, this.start2.y);
            a.line(this.currentEndPoint2.x, this.currentEndPoint2.y, this.end2.x, this.end2.y);
            a.line(this.currentEndPoint1.x, this.currentEndPoint1.y, this.start3.x, this.start3.y);
            a.line(this.currentEndPoint2.x, this.currentEndPoint2.y, this.end3.x, this.end3.y);
        }
    }
}

var p5_a = new p5(assembler, "p5Canvas");