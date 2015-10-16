/*
Zerthis
Procedural "snake" animation with simple AI.
Theodore Michels 2015
Last updated: 07/11/2015
*/

// Put this in a function instance so that everything is out of the global namespace
var zerthis = function (z) {
    /******** APPEARANCE ********/
    var numSegments = 30;
    var segmentDistance = 10.0;
    var bodyLength = numSegments * (segmentDistance - 1);

    /******** MOVEMENT ********/
    var onTheMove = false;
    // The amplitude of the sinusoidal motion - varies with distance from the target.
    var motionAmplitude = 0;
    // The maximum amplitude of the sinusoidal motion.
    var ampMax = bodyLength / 6;

    // forwardVector always points from the sinusoidal motion's 0 crossing to the destination
    // (It oscillates around this vector)
    var forwardVector = new p5.Vector();
    var acceleration = new p5.Vector();
    var accelCounter = new p5.Vector();
    var topSpeed = 3.0;
    var movementCounter = 0.0;
    var sineCounter = 0.0;
    // A vector perpendicular to the "head" - used for sinusoidal motion
    var sineVector = new p5.Vector();

    // Positions of each body segment
    var positions = [];
    // Where each segment would like to go
    var destinations = [];
    // Where is the snake (head) trying to go?
    var destination = new p5.Vector();

    /******** OTHER ********/
    var food = [];
    var closestFood;
    var foodsEaten = [];

    var numFloaters = 100;
    var floaters = [];

    var eyePulseCounter = 0.0;
    // How quickly does the creature drift downward?
    var creatureGravity = new p5.Vector(0.0, 0.5);

    var canvas
    z.setup = function () {
        canvas = z.createCanvas(z.windowWidth, z.windowHeight);
        canvas.mousePressed(addFood); // Add mousePressed listener
        z.smooth();

        // Initialize segments from top to bottom in the middle of the screen
        for (var i = 0; i < numSegments; i++) {
            positions[i] = new p5.Vector(z.width / 2, segmentDistance * i);
        }
        for (var i = 0; i < numFloaters; i++) {
            floaters[i] = new Floater(z.random(z.width), z.random(z.height));
        }
    }

    z.draw = function () {

        z.background(255);
        /******** AUTO MOVEMENT ********/
        // Get the last position element in the array (the head) for simplicity - it's used a lot elsewhere...
        var headVector = positions[positions.length - 1].copy();

        // If the head is at the bottom of the screen (and the creature isn't already moving)
        // then move towards a random spot at the top of the screen.
        if (headVector.y > z.height - 40 && !onTheMove) {
            forwardVector = headVector.copy();
            movementCounter = 0.0;
            sineCounter = 0.0;
            onTheMove = true;
            // Pick a random destination at the top of the screen.
            destination = new p5.Vector(z.random(0, z.width), z.random(0, z.height / 4));
        }

        /******** FOOD FINDING ********/
        if (food.length > 0) { // If there is any food, then go get it!
            onTheMove = true;
            closestFood = food[0];

            if (food.length > 1) { // If there's more than 1 food, then find the closest one.
                for (var i = 0; i < food.length; i++) {
                    if (headVector.dist(food[i].position) < headVector.dist(closestFood.position)) {
                        closestFood = food[i];
                    }
                }
            }

            destination = closestFood.position.copy(); // The destination is now the closest piece of food.
            // If close enough to the food, then "eat" it.
            if (headVector.dist(destination) < 2.0) {
                foodsEaten.push(closestFood);
                food.splice(food.indexOf(closestFood), 1);
            }
        }

        /******** MOVEMENT ********/
        if (!onTheMove) {
            forwardVector = headVector; // If not moving, constantly set the forwardVector to the head's position
        }
        if (onTheMove) {
            // The movement counter affects the amplitude of sinusoidal motion (it's clamped from 0 to 1)
            movementCounter += 0.002; // Effectively, sinusoidal acceleration...
            if (movementCounter > 1) {
                movementCounter = 1;
            }
            // Increment other counters while moving.
            sineCounter += 0.1;
            accelCounter += 0.07;
            eyePulseCounter += 0.2;

            // If the current destination has already been reached (by checking distance), reset the counters and movement status.
            if (headVector.dist(destination) < 2.0) {
                sineCounter = 0.0;
                accelCounter = 0.0;
                movementCounter = 0.0;
                onTheMove = false;
            } else { // Otherwise, move towards the destination
                forwardVelocity = destination.copy(); // Copy the destination vector
                forwardVelocity.sub(forwardVector); // Subtract the head position from it to get a vector pointing from the head to the target.

                sineVector = new p5.Vector(-forwardVelocity.y, forwardVelocity.x); // Perpendicular to forwardVelocity

                forwardVelocity.normalize();

                if (accelCounter < topSpeed) {
                    forwardVelocity.mult(accelCounter);
                } else {
                    forwardVelocity.mult(topSpeed);
                }
                forwardVector.add(forwardVelocity); // Add to move the forward vector towards the target
                // How much should the creature oscillate?
                // First of all, it should oscillate less as it approaches its destination.
                // It also takes time to get up to speed (via movementCounter)
                motionAmplitude = forwardVector.dist(destination) * movementCounter;

                if (motionAmplitude > ampMax) {
                    motionAmplitude = ampMax; // Clamp to the maximum.
                }

                sineVector.normalize();
                sineVector.mult(z.sin(sineCounter) * motionAmplitude); // Multiply by the amplitude and add to the forward vector.
                sineVector.add(forwardVector);
                // Set the last position in the array (the head) to the sineVector (all others will follow)
                positions[numSegments - 1].set(sineVector);
            }
        }
        // Each segment's destination is the NEXT segment's current POSITION.
        for (var i = 0; i < numSegments - 1; i++) {
            destinations[i] = positions[i + 1];
        }

        /******** DISPLAY ********/
        // Contains the positions of each body segment's perpendicular "vertices"
        var sideVectorsR = [];
        var sideVectorsL = [];
        // Look through each body position...
        for (var i = 0; i < positions.length; i++) {
            positions[i].add(creatureGravity); // Add the external "force"
            var ellipseSize = 0;

            if (i != positions.length - 1) { // For all other positions (besides the head)
                z.stroke(20, 220, 120, 100); // Draw a central line
                z.line(positions[i].x, positions[i].y, positions[i + 1].x, positions[i + 1].y);

                /******** SEGMENT FOLLOWING ********/
                var segmentMove = destinations[i].copy();
                segmentMove.sub(positions[i]); // Vector pointing from this segment to it's destination

                // This feels hackey...basically, while the segment is too far from its destination...
                // Move towards it's destination.
                while (segmentMove.mag() > segmentDistance) {
                    segmentMove.normalize();
                    segmentMove.mult(0.01);
                    positions[i].add(segmentMove);
                    segmentMove = destinations[i].copy();
                    segmentMove.sub(positions[i]);
                }
                // Segments are larger near the head
                ellipseSize = i / 2;

                /******** SIDE VECTORS ********/
                var nextVec = positions[i + 1].copy(); // Get the next position in the array
                nextVec.sub(positions[i]); // Get a vector pointing to it.

                var sideVector = new p5.Vector(-nextVec.y, nextVec.x); // Then get its perpendicular vector
                sideVector.normalize(); // Resize...
                sideVector.mult(ellipseSize);

                var sideVectorOpp = sideVector.copy();
                sideVectorOpp.mult(-1); // Then get the vector on the opposite side
                // Add to the arrays.
                sideVector.add(positions[i]);
                sideVectorOpp.add(positions[i]);

                sideVectorsR[i] = sideVector.copy();
                sideVectorsL[i] = sideVectorOpp.copy();

                z.stroke(0, 100);
                z.line(sideVector.x, sideVector.y, sideVectorOpp.x, sideVectorOpp.y); // A line connecting the two sides

                /******** FOOD COLORING ********/
                // Change color of body segments based on food eaten.
                // Because the head is actually the last element in the array, this part ends up being a little hackey...				
                if (numSegments - 1 - foodsEaten.length <= i) { // -1 for the head...
                    if (i + 1 >= numSegments - foodsEaten.length) {
                        // Fills in colors in reverse order, like beads onto a string.
                        z.fill(foodsEaten[foodsEaten.length - (numSegments - 1 - i)].foodColor);
                    }
                } else {
                    z.noFill(); // otherwise, the segment is empty
                }
                z.ellipse(positions[i].x, positions[i].y, ellipseSize, ellipseSize); // Draw ellipses for each body segment.
            }
        }
        if (onTheMove) { // If moving, pulse the eye
            z.fill(20, 220, 120, 128 * z.sin(eyePulseCounter));
        } else {
            z.noFill();
        }
        z.ellipse(headVector.x, headVector.y, 10, 10); // The eye

        /******** SIDES ********/
        for (var i = 0; i < sideVectorsR.length; i++) {
            if (i != sideVectorsR.length - 1) {
                z.line(sideVectorsR[i].x, sideVectorsR[i].y, sideVectorsR[i + 1].x, sideVectorsR[i + 1].y);
                z.line(sideVectorsL[i].x, sideVectorsL[i].y, sideVectorsL[i + 1].x, sideVectorsL[i + 1].y);
            }
        }

        /******** HEAD ********/
        var noseVector = positions[numSegments - 1].copy(); // Find a point just ahead of the...head (the nose)
        noseVector.sub(positions[numSegments - 2]);
        noseVector.normalize();
        noseVector.mult(40);
        noseVector.add(positions[numSegments - 1]);
        // Line through middle of nose
        z.line(positions[numSegments - 1].x, positions[numSegments - 1].y, noseVector.x, noseVector.y);
        // Sides of the head
        z.line(sideVectorsR[sideVectorsR.length - 1].x, sideVectorsR[sideVectorsR.length - 1].y, noseVector.x, noseVector.y);
        z.line(sideVectorsL[sideVectorsL.length - 1].x, sideVectorsL[sideVectorsL.length - 1].y, noseVector.x, noseVector.y);

        /******** FOOD & PARTICLES********/
        for (var i = 0; i < food.length; i++) { // Draw all of the food.
            food[i].update();
            food[i].display();
        }

        for (var i = 0; i < floaters.length; i++) {
            floaters[i].update();
            floaters[i].display();
            // If the floater dies or is offscreen, reset it.
            if (floaters[i].currentLifeTime < 0 || floaters[i].position.y > z.height) {
                floaters[i] = new Floater(z.random(z.width), z.random(-5, -40));
            }
        }
    }

    /******** CLASSES ********/
    function Food(x, y) {

            this.position = new p5.Vector(x, y);
            this.size = z.random(8.0, 18.0);
            this.spinCounter = 0.0;
            this.spinSpeed = z.random(0.01, 0.1);

            this.gravity = new p5.Vector(0.0, z.random(0.1, 0.5));

            this.foodColor = z.color(z.random(0, 255), z.random(0, 255), z.random(0, 255), 128);

            this.update = function () {
                this.spinCounter += this.spinSpeed;
                this.position.add(this.gravity);
            }

            this.display = function () {
                z.noFill();
                z.push(); // Use push and pop to isolate the rotation.
                z.translate(this.position.x, this.position.y);
                z.rotate(this.spinCounter);
                z.line(-10, 0, 10, 0);
                z.line(0, 15, 0, -15);

                z.fill(this.foodColor);
                z.ellipse(0, 0, this.size, this.size);
                z.pop();
            }
        }
        // Floating particles (just for show)
    function Floater(x, y) {
        this.position = new p5.Vector(x, y);
        this.size = z.random(2, 5);
        this.gravity = new p5.Vector(0.0, z.random(0.1, 0.5)); // Random "gravities" help create depth.
        this.maxLifeTime = z.random(1000.0, 3000.0); // Used for fading out.
        this.currentLifeTime = this.maxLifeTime;

        this.update = function () {
            this.position.add(this.gravity);
            this.currentLifeTime -= 1;
        }
        this.display = function () {
            z.noStroke();
            z.fill(0, 65 * (this.currentLifeTime / this.maxLifeTime));
            z.ellipse(this.position.x, this.position.y, this.size, this.size);
        }
    }

    function mousePressed() {}

    function addFood() {
        food.push(new Food(z.mouseX, z.mouseY)); // Add food whenever the mouse is pressed.
    }
}

var p5_z = new p5(zerthis, "p5Canvas");