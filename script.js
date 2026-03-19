// ============================================
// script.js — Runs after THREE, gsap, 
// ScrollTrigger are all loaded and DOM is ready
// ============================================

// --- Safety check ---
if (typeof THREE === "undefined") {
  console.error("THREE.js not loaded");
}
if (typeof gsap === "undefined") {
  console.error("GSAP not loaded");
}

// ============================================
// LOADING STATE
// ============================================
let threeJsReady = false;
let modelViewerReady = false;
let loadingScreenHidden = false;

function checkAllLoaded() {
  if (threeJsReady && modelViewerReady && !loadingScreenHidden) {
    hideLoadingScreen();
  }
}

// Fallback timeout
setTimeout(() => {
  if (!loadingScreenHidden) {
    hideLoadingScreen();
  }
}, 8000);

function hideLoadingScreen() {
  if (loadingScreenHidden) return;
  loadingScreenHidden = true;

  const loadingScreen = document.getElementById("loading-screen");
  if (!loadingScreen) return;
  loadingScreen.classList.add("loading-hidden");
  setTimeout(() => {
    loadingScreen.style.display = "none";
  }, 1000);
}

// ============================================
// MODEL VIEWER
// ============================================
function initModelViewer() {
  const modelViewer = document.getElementById("avatar-model");

  if (!modelViewer) {
    modelViewerReady = true;
    checkAllLoaded();
    return;
  }

  if (modelViewer.loaded) {
    modelViewerReady = true;
    checkAllLoaded();
    return;
  }

  modelViewer.addEventListener("load", () => {
    modelViewerReady = true;
    checkAllLoaded();
  });

  modelViewer.addEventListener("error", () => {
    modelViewerReady = true;
    checkAllLoaded();
  });

  if (!customElements.get("model-viewer")) {
    customElements
      .whenDefined("model-viewer")
      .then(() => {
        if (modelViewer.loaded) {
          modelViewerReady = true;
          checkAllLoaded();
        }
      })
      .catch(() => {
        modelViewerReady = true;
        checkAllLoaded();
      });
  }
}

// ============================================
// THREE.JS
// ============================================
let scene, camera, renderer, particles, torus;
let mouseX = 0,
  mouseY = 0;

let bgBaseRotX = 0,
  bgBaseRotY = 0;
let bgMouseRotX = 0,
  bgMouseRotY = 0;
let torusBaseRotX = 0,
  torusBaseRotY = 0;
let torusMouseRotX = 0,
  torusMouseRotY = 0;

let targetCameraZ = 5,
  currentCameraZ = 5;
let currentScrollY = 0,
  targetScrollY = 0;

const isMobile =
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  ) || window.innerWidth < 768;

function initThree() {
  const container = document.getElementById("canvas-container");
  if (!container) {
    console.error("canvas-container not found");
    threeJsReady = true;
    checkAllLoaded();
    return;
  }

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.z = 5;

  renderer = new THREE.WebGLRenderer({
    antialias: !isMobile,
    alpha: true,
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(
    isMobile
      ? Math.min(window.devicePixelRatio, 1.5)
      : Math.min(window.devicePixelRatio, 2)
  );
  container.appendChild(renderer.domElement);

  // Particles
  const particlesGeometry = new THREE.BufferGeometry();
  const count = isMobile ? 1500 : 3000;
  const posArray = new Float32Array(count * 3);
  for (let i = 0; i < count * 3; i++) {
    posArray[i] = (Math.random() - 0.5) * 15;
  }
  particlesGeometry.setAttribute(
    "position",
    new THREE.BufferAttribute(posArray, 3)
  );
  const particlesMaterial = new THREE.PointsMaterial({
    size: isMobile ? 0.008 : 0.005,
    color: 0xffffff,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending,
  });
  particles = new THREE.Points(particlesGeometry, particlesMaterial);
  scene.add(particles);

  // Torus Knot
  const segments = isMobile ? 80 : 150;
  const geometry = new THREE.TorusKnotGeometry(1.3, 0.4, segments, 20);
  const material = new THREE.MeshStandardMaterial({
    color: 0x222222,
    roughness: 0.1,
    metalness: 1,
    wireframe: true,
  });
  torus = new THREE.Mesh(geometry, material);
  scene.add(torus);

  // Lights
  scene.add(new THREE.AmbientLight(0xffffff, 0.5));
  const pointLight = new THREE.PointLight(0x0066ff, 2);
  pointLight.position.set(2, 3, 4);
  scene.add(pointLight);
  const pointLight2 = new THREE.PointLight(0xff0066, 2);
  pointLight2.position.set(-2, -3, 4);
  scene.add(pointLight2);

  animate();

  threeJsReady = true;
  checkAllLoaded();
}

function animate() {
  requestAnimationFrame(animate);

  bgBaseRotY += 0.001;
  bgBaseRotX += 0.0005;
  bgMouseRotY += (mouseX * 0.25 - bgMouseRotY) * 0.06;
  bgMouseRotX += (-mouseY * 0.18 - bgMouseRotX) * 0.06;

  if (particles) {
    particles.rotation.y = bgBaseRotY + bgMouseRotY;
    particles.rotation.x = bgBaseRotX + bgMouseRotX;
  }

  if (torus) {
    torusBaseRotX += 0.005;
    torusBaseRotY += 0.005;
    torusMouseRotX += (mouseY * 0.5 - torusMouseRotX) * 0.08;
    torusMouseRotY += (mouseX * 0.5 - torusMouseRotY) * 0.08;
    torus.rotation.x = torusBaseRotX + torusMouseRotX;
    torus.rotation.y = torusBaseRotY + torusMouseRotY;
  }

  currentScrollY += (targetScrollY - currentScrollY) * 0.08;
  targetCameraZ = 5 + currentScrollY * 0.001;
  currentCameraZ += (targetCameraZ - currentCameraZ) * 0.05;
  camera.position.z = currentCameraZ;

  renderer.render(scene, camera);
}

// ============================================
// GSAP ANIMATIONS
// ============================================
function initGsapAnimations() {
  gsap.registerPlugin(ScrollTrigger);

  gsap.from(".reveal", {
    opacity: 0,
    y: 100,
    duration: 1.5,
    ease: "power4.out",
    stagger: 0.2,
  });

  gsap.utils.toArray(".glass:not(#home .glass)").forEach((card) => {
    gsap.from(card, {
      scrollTrigger: {
        trigger: card,
        start: "top bottom-=100px",
        toggleActions: "play none none reverse",
      },
      opacity: 0,
      y: 50,
      duration: 1,
      ease: "power3.out",
    });
  });

  // Only animate .award-banner if it exists in the DOM
  const awardBanner = document.querySelector(".award-banner");
  if (awardBanner) {
    gsap.from(awardBanner, {
      scrollTrigger: {
        trigger: awardBanner,
        start: "top bottom-=50px",
        toggleActions: "play none none reverse",
      },
      opacity: 0,
      scale: 0.95,
      duration: 0.2,
      ease: "power3.out",
    });
  }

  gsap.utils.toArray(".skill-progress").forEach((bar) => {
    gsap.from(bar, {
      scrollTrigger: {
        trigger: bar,
        start: "top bottom-=50px",
        toggleActions: "play none none reverse",
      },
      scaleX: 0,
      duration: 1.5,
      ease: "power3.out",
    });
  });

  gsap.utils.toArray(".text-gradient").forEach((title) => {
    gsap.from(title, {
      scrollTrigger: {
        trigger: title,
        start: "top bottom-=100px",
        toggleActions: "play none none reverse",
      },
      opacity: 0,
      x: -50,
      duration: 1,
      ease: "power3.out",
    });
  });

  gsap.utils.toArray(".highlight-card").forEach((card, i) => {
    gsap.from(card, {
      scrollTrigger: {
        trigger: card,
        start: "top bottom-=80px",
        toggleActions: "play none none reverse",
      },
      opacity: 0,
      y: 60,
      duration: 0.8,
      delay: i * 0.15,
      ease: "power3.out",
    });
  });
}

// ============================================
// CURSOR
// ============================================
function initCursor() {
  if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

  document
    .querySelectorAll(
      "a, button, .group, .service-card, .highlight-card, .bento-item, input, textarea, select"
    )
    .forEach((el) => {
      el.addEventListener("mouseenter", () =>
        gsap.to("#cursor", {
          scale: 3,
          backgroundColor: "rgba(255,255,255,0.1)",
        })
      );
      el.addEventListener("mouseleave", () =>
        gsap.to("#cursor", { scale: 1, backgroundColor: "transparent" })
      );
    });
}

// ============================================
// EVENT LISTENERS
// ============================================
window.addEventListener(
  "scroll",
  () => {
    targetScrollY = window.scrollY;
  },
  { passive: true }
);

window.addEventListener("mousemove", (e) => {
  mouseX = e.clientX / window.innerWidth - 0.5;
  mouseY = e.clientY / window.innerHeight - 0.5;

  if (typeof gsap !== "undefined") {
    gsap.to("#cursor", {
      x: e.clientX - 10,
      y: e.clientY - 10,
      duration: 0.2,
    });
  }
});

if (isMobile) {
  window.addEventListener(
    "touchmove",
    (e) => {
      if (e.touches.length > 0) {
        mouseX = e.touches[0].clientX / window.innerWidth - 0.5;
        mouseY = e.touches[0].clientY / window.innerHeight - 0.5;
      }
    },
    { passive: true }
  );

  window.addEventListener(
    "touchend",
    () => {
      mouseX = 0;
      mouseY = 0;
    },
    { passive: true }
  );
}

window.addEventListener("resize", () => {
  // Guard: only resize if Three.js objects are initialized
  if (camera && renderer) {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
});

// ============================================
// RUN EVERYTHING
// ============================================
initThree();
initGsapAnimations();
initCursor();
initModelViewer();