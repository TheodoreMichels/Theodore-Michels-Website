var glVis = true;
var audioContext = new AudioContext;
var muted = true;
var masterGain = audioContext.createGain();
masterGain.gain.value = 0;
masterGain.connect(audioContext.destination);

// Create scene, camera (ortho), light, and renderer.
var widthScale = 1.0;
var heightScale = 0.4;

var motionAmplitude = 1.5;

var scene = new THREE.Scene();
var camera = new THREE.OrthographicCamera(
	window.innerWidth * widthScale /-100,
	window.innerWidth * widthScale/100,
	window.innerHeight * heightScale/100,
	window.innerHeight * heightScale/-100,
	1, 10);

// Full intensity white light.
var directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
directionalLight.position.set(1, 1, 1);
scene.add(directionalLight);

// Turn on antialiasing
var renderer = new THREE.WebGLRenderer({antialias:true, alpha:true});
renderer.setSize(window.innerWidth*widthScale, window.innerHeight*heightScale);
// White background
//renderer.setClearColor(0xffffff);
// Enable Shadows
//renderer.shadowMapEnabled = true;
// Add the renderer to the HTML
document.getElementById("glContainer").appendChild(renderer.domElement);

/******** AUDIO ********/
var notesArray = [
155.56,
185.00,
207.65,
233.08,
277.18,
311.13,
369.99,
311.13,
277.18,
233.08,
207.65,
185.00,
155.56
];
/*
var notesArray = [
138.59,
155.56,
185.00,
207.65,
233.08,
277.18,
311.13,
369.99,
415.30,
466.16,
554.37,
622.25,
739.99,
830.61,
923.33
];
*/

/******** LINE ********/
var lineMat = new THREE.LineBasicMaterial({
	color: 0x000000
});
lineMat.transparent = true;
lineMat.opacity = 0.5;

var lineGeom = new THREE.Geometry();

var line = new THREE.Line(lineGeom, lineMat);

scene.add(line);

/******** SHAPES ********/
var numShapes = 13;
var shapesArray = [];

var highlightMat = new THREE.MeshLambertMaterial(
{color:0xFF223D}
);
var material = new THREE.MeshLambertMaterial(
{color:0xffffff}
);
material.transparent = true;
material.opacity = 0.5;
material.shading = THREE.FlatShading;

// A low res sphere.
var shape = new THREE.SphereGeometry(0.4, 2, 2);
var circleGeom = new THREE.CircleGeometry(0.5, 6);

// Create an array of the low res spheres.
for(var i = 0; i < numShapes; i++){
	shapesArray[i] = new SpecialShape(i);
	scene.add(shapesArray[i].mesh);
	scene.add(shapesArray[i].circMesh);
	shapesArray[i].mesh.position.x = i+0.5-(numShapes/2);
	shapesArray[i].circMesh.position.x = i+0.5-(numShapes/2);
}
scene.add(line);

camera.position.z = 5;

var posCounter = 0;

// Looping function to display shapes.
function render(){
    
	requestAnimationFrame(render);	
	
	// Create an empty array to be filled below.
	var lineVerts = [];
	// Look through all of the shapes in the array...
	for(var i = 0; i < numShapes; i++){	
		
		if(shapesArray[i].moving){
			shapesArray[i].counter+=0.04;
			// Change their rotation according to the counter (with offsets for i)
			shapesArray[i].mesh.rotation.x = shapesArray[i].counter+i;
			shapesArray[i].mesh.rotation.y = shapesArray[i].counter+i;
			
			// Move position according to sin function (with offsets for i)
			shapesArray[i].mesh.position.y = Math.sin(shapesArray[i].counter+(i)) * motionAmplitude;
			
			if(shapesArray[i].mesh.position.y < 1.3){
				shapesArray[i].gainNode.gain.value = 0;
			}else{
				shapesArray[i].gainNode.gain.value = (shapesArray[i].mesh.position.y - 1.3) / 2;
			}
			
			if(shapesArray[i].mesh.position.y > 1.45 && !shapesArray[i].circleShowing){
				shapesArray[i].circMesh.position.y = shapesArray[i].mesh.position.y;
				shapesArray[i].circleShowing = true;
				shapesArray[i].circleMat.opacity = 0.5;
			}
			if(shapesArray[i].circleShowing && shapesArray[i].circleMat.opacity > 0){
				shapesArray[i].circleMat.opacity -= 0.01;
			}
			if(shapesArray[i].circleMat.opacity <= 0){
				shapesArray[i].circleShowing = false;
			}
			
			var tempScale = shapesArray[i].circleMat.opacity + 0.5;
			
			shapesArray[i].circMesh.scale.set(tempScale, tempScale, tempScale);
			shapesArray[i].circMesh.rotation.z = shapesArray[i].circleMat.opacity * 5;
		}
		
		// Get the first vertex in the geometry and make a copy.
		var newVector = shapesArray[i].mesh.geometry.vertices[0].clone();
		// Get its world matrix.
		newVector.applyMatrix4(shapesArray[i].mesh.matrixWorld);
		
		// Add to the array.
		lineVerts[i] = newVector;
		
	}

	// Set the line's vertices.	
	lineGeom.vertices = lineVerts;
    if(!glVis){
        return;
    }
	renderer.render(scene, camera);
	// Make sure that verticesNeedUpdate is true so that the line will continue to follow the shapes' vertices.
	lineGeom.verticesNeedUpdate = true;
}

function SpecialShape(id){
	this.counter = 0;
	this.moving = true;	
	this.circleShowing = false;
	
	this.circleMat = new THREE.MeshLambertMaterial(
	{color:0xFF223D}
	);
	this.circleMat.transparent = true;
	this.circleMat.opacity = 0.0;
	
	this.mesh = new THREE.Mesh(shape, material);
	this.circMesh = new THREE.Mesh(circleGeom, this.circleMat);
	
	/**** AUDIO ****/
	this.oscillator = audioContext.createOscillator();
	this.oscillator.type="sine";
	this.oscillator.frequency.value = notesArray[id];
	this.oscillator.start();
	//this.oscillator.type = "triangle";
	this.gainNode = audioContext.createGain();	
	this.oscillator.connect(this.gainNode);
	this.gainNode.connect(masterGain);
	this.gainNode.gain.value = 0.001;
}

render();