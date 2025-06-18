import * as THREE from './three';
import { OrbitControls } from './three/examples/jsm/controls/OrbitControls.js';

// Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111111);

// Camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 0, 10);

// Renderer
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('canvas'), antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setClearColor(0x111111);

// Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enablePan = false;
controls.enableZoom = false;
controls.enableRotate = true;

// 🧠 Smooth upright heart shape with refined control points
const heartShape = new THREE.Shape();
heartShape.moveTo(0, 3);
heartShape.bezierCurveTo(0, 4, -2, 4, -2, 2.5);
heartShape.bezierCurveTo(-2, 1.5, -1, 1, 0, 0);
heartShape.bezierCurveTo(1, 1, 2, 1.5, 2, 2.5);
heartShape.bezierCurveTo(2, 4, 0, 4, 0, 3);

// Extrude settings
const extrudeSettings = {
  depth: 1,
  bevelEnabled: true,
  bevelThickness: 0.1,
  bevelSize: 0.15,
  bevelSegments: 5,
};

// Geometry and material
const geometry = new THREE.ExtrudeGeometry(heartShape, extrudeSettings);
geometry.center();

// Create heart material
const heartMaterial = new THREE.MeshPhongMaterial({
  color: 0xff69b4,
  emissive: 0xff1493,
  emissiveIntensity: 0.5,
  shininess: 100,
  side: THREE.DoubleSide,
  transparent: true,
  opacity: 1
});

const heartMesh = new THREE.Mesh(geometry, heartMaterial);
scene.add(heartMesh);

// Array of media files in the public/images folder
const mediaFiles = [
  '/images/IMG_20250525_221616123_PORTRAIT.jpg',
  '/images/IMG_20250525_221828264_HDR_AE.jpg',
  '/images/IMG_20250525_222313199_HDR.jpg',
  '/images/IMG-20250318-WA0009.jpg',
  '/images/IMG-20250421-WA0009.jpg',
  '/images/IMG-20250429-WA0001.jpg',
  '/images/IMG-20250501-WA0005.jpg',
  '/images/IMG-20250601-WA0003.jpg',
  '/images/IMG-20250601-WA0007.jpg',
  '/images/VID-20250420-WA0054.mp4',
  '/images/VID-20250428-WA0057.mp4',
  '/images/VID-20250428-WA0058.mp4',
  '/images/VID-20250428-WA0059.mp4',
  '/images/VID-20250428-WA0060.mp4',
  '/images/VID-20250428-WA0061.mp4',
  '/images/VID-20250428-WA0062.mp4',
  '/images/VID-20250428-WA0063.mp4',
  '/images/VID-20250501-WA0004.mp4',
  '/images/VID-20250501-WA0013.mp4',
  '/images/VID-20250505-WA0082.mp4',
  '/images/VID-20250505-WA0083.mp4',
  '/images/VID-20250505-WA0084.mp4',
  '/images/VID-20250505-WA0085.mp4',
  '/images/VID-20250505-WA0086.mp4',
  '/images/VID-20250505-WA0087.mp4',
  '/images/VID-20250505-WA0088.mp4',
  '/images/VID-20250525-WA0013.mp4',
  '/images/VID-20250601-WA0002.mp4',
  '/images/VID-20250601-WA0004.mp4',
  '/images/VID-20250601-WA0005.mp4',
  '/images/VID-20250601-WA0006.mp4',
  // Add more media files as needed
].filter(Boolean);

// Function to get all media files from the images folder (works in development and production)
async function getMediaFiles() {
  try {
    // This will be replaced by Vite at build time
    const modules = import.meta.glob('/images/*.{jpg,jpeg,png,mp4,webm,ogg}', { as: 'url', eager: true });
    return Object.values(modules).map(url => url.default || url);
  } catch (e) {
    console.warn('Could not load media files dynamically, using fallback', e);
    return mediaFiles;
  }
}

// Initialize media files
let allMediaFiles = [];
getMediaFiles().then(files => {
  allMediaFiles = files;
  console.log('Loaded media files:', allMediaFiles);
});

// Create a container for the media overlay
const mediaContainer = document.createElement('div');
mediaContainer.style.position = 'fixed';
mediaContainer.style.top = '0';
mediaContainer.style.left = '0';
mediaContainer.style.width = '100%';
mediaContainer.style.height = '100%';
mediaContainer.style.display = 'none';
mediaContainer.style.justifyContent = 'center';
mediaContainer.style.alignItems = 'center';
mediaContainer.style.backgroundColor = '#000';
mediaContainer.style.zIndex = '1000';
mediaContainer.style.cursor = 'pointer';
mediaContainer.style.transition = 'opacity 1s ease-in-out';
mediaContainer.style.opacity = '0';
document.body.appendChild(mediaContainer);

// Audio setup
const audio = new Audio('/audio/audio.mp3');
const FADE_DURATION = 5000; // 3 seconds for fade in/out
const TARGET_VOLUME = 0.3; // 30% volume
let isFadingOut = false;
let fadeInterval;

audio.volume = 0; // Start at 0 volume

// Set start time to 1 minute (60 seconds) when audio is ready
audio.addEventListener('loadedmetadata', () => {
  audio.currentTime = 75; // Skip first minute
  
  // Set up timeupdate listener to handle loop fade out/in
  audio.addEventListener('timeupdate', handleTimeUpdate);
});

function fadeAudio(targetVolume, onComplete) {
  clearInterval(fadeInterval);
  const initialVolume = audio.volume;
  const volumeChange = targetVolume - initialVolume;
  const startTime = performance.now();
  
  fadeInterval = setInterval(() => {
    const elapsed = performance.now() - startTime;
    const progress = Math.min(elapsed / FADE_DURATION, 1);
    audio.volume = initialVolume + (volumeChange * progress);
    
    if (progress === 1) {
      clearInterval(fadeInterval);
      if (onComplete) onComplete();
    }
  }, 16); // ~60fps
}

function handleTimeUpdate() {
  const fadeOutTime = 5; // Start fading out 3 seconds before end
  const duration = audio.duration - 75; // Adjusted for 1-minute offset
  const currentTime = audio.currentTime - 75; // Adjusted time
  
  // If we're within fadeOutTime seconds of the end and not already fading out
  if (currentTime >= duration - fadeOutTime && !isFadingOut) {
    isFadingOut = true;
    fadeAudio(0, () => {
      // When fade out is complete, loop back to 1 minute and fade in
      audio.currentTime = 75;
      fadeAudio(TARGET_VOLUME, () => {
        isFadingOut = false;
      });
    });
  }
}

// Current media element reference
let currentMedia = null;

// fadeAudio function is now used for all volume transitions

// Start audio after 3 seconds and fade in
setTimeout(() => {
  audio.play().catch(e => console.log('Audio playback failed:', e));
  fadeAudio(TARGET_VOLUME);
}, 3000);

// Function to create a media element
function createMediaElement(mediaPath) {
  // Remove previous media if exists
  if (currentMedia) {
    mediaContainer.removeChild(currentMedia);
  }

  const isVideo = /\.(mp4|webm|ogg)$/i.test(mediaPath);
  
  if (isVideo) {
    const video = document.createElement('video');
    video.src = mediaPath;
    video.autoplay = true;
    video.muted = true;
    video.style.maxWidth = '90%';
    video.style.maxHeight = '90%';
    video.style.objectFit = 'contain';
    
    // Set video to hide after 5 seconds or when it ends, whichever comes first
    const hideTimeout = setTimeout(hideMedia, 5000);
    
    // Hide immediately if video ends before timeout
    video.onended = () => {
      clearTimeout(hideTimeout);
      hideMedia();
    };
    
    currentMedia = video;
  } else {
    const img = new Image();
    img.src = mediaPath;
    img.style.maxWidth = '70%';
    img.style.maxHeight = '70%';
    img.style.objectFit = 'contain';
    img.style.opacity = '0';
    img.style.transition = 'opacity 1s ease-in-out';
    
    img.onload = () => {
      // Fade in the image
      setTimeout(() => {
        img.style.opacity = '1';
        // Set display time: 2 seconds for images
        setTimeout(hideMedia, 2000);
      }, 10);
    };
    
    currentMedia = img;
  }
  
  mediaContainer.appendChild(currentMedia);
  return currentMedia;
}

// Function to hide the media and show the heart
function hideMedia() {
  // Fade out the media container
  mediaContainer.style.opacity = '0';
  
  setTimeout(() => {
    // Hide the container
    mediaContainer.style.display = 'none';
    
      // Pause video if it's playing and reset position
    if (currentMedia && currentMedia.pause) {
      currentMedia.pause();
      currentMedia.currentTime = 0;
    }
    
    // Show and fade in the heart
    heartMesh.visible = true;
    heartMesh.material.opacity = 0;
    const fadeIn = () => {
      heartMesh.material.opacity += 0.05;
      if (heartMesh.material.opacity < 1) {
        requestAnimationFrame(fadeIn);
      }
    };
    fadeIn();
  }, 500); // Match this with the CSS transition time
}

// Function to show a random media
function showRandomMedia() {
  if (mediaFiles.length === 0) return;
  
  // Fade out the heart
  heartMesh.material.opacity = 1;
  const fadeOut = () => {
    heartMesh.material.opacity -= 0.05;
    if (heartMesh.material.opacity > 0) {
      requestAnimationFrame(fadeOut);
    } else {
      heartMesh.visible = false;
    }
  };
  fadeOut();
  
  // Get a random media path
  const randomIndex = Math.floor(Math.random() * mediaFiles.length);
  const mediaPath = mediaFiles[randomIndex];
  
  // Create and show new media
  createMediaElement(mediaPath);
  mediaContainer.style.display = 'flex';
  
  // Force reflow and fade in
  void mediaContainer.offsetWidth;
  mediaContainer.style.opacity = '1';
  
  // Add pulse animation to the heart (for when it returns)
  heartMesh.scale.set(1.2, 1.2, 1.2);
  setTimeout(() => {
    heartMesh.scale.set(1, 1, 1);
  }, 200);
}

// Close the media when clicking anywhere
mediaContainer.addEventListener('click', hideMedia);

// Add click event to the heart
renderer.domElement.addEventListener('click', (event) => {
  // Check if the click was on the heart
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  
  // Calculate mouse position in normalized device coordinates
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
  
  // Update the picking ray with the camera and mouse position
  raycaster.setFromCamera(mouse, camera);
  
  // Calculate objects intersecting the picking ray
  const intersects = raycaster.intersectObject(heartMesh);
  
  if (intersects.length > 0) {
    showRandomMedia();
  }
});

// Lights
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 5, 5);
scene.add(directionalLight);

const ambientLight = new THREE.AmbientLight(0x404040);
scene.add(ambientLight);

// Animation variables
let time = 0;
const pulseSpeed = 1.5;
const pulseAmount = 0.1;

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  
  // Rotate the heart
  heartMesh.rotation.y += 0.005;
  
  // Add a subtle pulsing effect
  const pulse = Math.sin(Date.now() * 0.002) * 0.05 + 1;
  heartMesh.scale.set(pulse, pulse, pulse);
  
  renderer.render(scene, camera);
}

// Handle page visibility changes for better audio management
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    audio.pause();
  } else {
    audio.play().catch(e => console.log('Audio resume failed:', e));
  }
});
animate();

// Resize handler
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
