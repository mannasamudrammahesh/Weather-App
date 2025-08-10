const searchBox = document.querySelector(".search-box input");
const searchBtn = document.querySelector("#search");
const weatherIcon = document.querySelector(".weather-icon");
const appContainer = document.querySelector(".app-container");
const forecastContainer = document.querySelector("#forecast-container");
const weatherDisplay = document.querySelector(".weather");
const errorDisplay = document.querySelector(".error");


const weatherApiKey = window.ENV?.VITE_WEATHER_API_KEY || 'fallback_key';
const unsplashApiKey = window.ENV?.VITE_UNSPLASH_API_KEY || 'fallback_key';

const weatherApiUrl = `https://api.weatherapi.com/v1/forecast.json?key=${weatherApiKey}&days=8&q=`;
const unsplashApiUrl = `https://api.unsplash.com/search/photos?page=1&per_page=1&query=`;


let scene, camera, renderer, currentAnimation, clock;

function initThreeJS() {
    scene = new THREE.Scene();
    clock = new THREE.Clock();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 50;
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "high-performance" });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    document.getElementById("threejs-container").appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    directionalLight.position.set(50, 100, 75);
    directionalLight.castShadow = true;
    scene.add(directionalLight);
}


function createRain() {
    const particleCount = 5000;
    const particles = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 300;
        positions[i * 3 + 1] = Math.random() * 250 + 50;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 300;

        velocities[i * 3] = (Math.random() - 0.5) * 0.2;
        velocities[i * 3 + 1] = -18 - Math.random() * 6;
        velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.2;
    }

    particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particles.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));

    const material = new THREE.ShaderMaterial({
        uniforms: {
            color: { value: new THREE.Color(0x88aaff) },
        },
        vertexShader: `
            attribute vec3 velocity;
            void main() {
                vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                gl_PointSize = 2.5 * (300.0 / -mvPosition.z);
                gl_Position = projectionMatrix * mvPosition;
            }
        `,
        fragmentShader: `
            uniform vec3 color;
            void main() {
                float dist = length(gl_PointCoord - vec2(0.5));
                if (dist > 0.5) discard;
                gl_FragColor = vec4(color, 1.0 - dist * 2.0);
            }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthTest: false
    });

    const rainSystem = new THREE.Points(particles, material);

    return {
        system: rainSystem,
        update: (delta) => {
            const pos = rainSystem.geometry.attributes.position;
            const vel = rainSystem.geometry.attributes.velocity;
            for (let i = 0; i < pos.count; i++) {
                pos.array[i * 3 + 1] += vel.array[i * 3 + 1] * delta * 2;
                pos.array[i * 3] += vel.array[i * 3] * delta * 2;
                if (pos.array[i * 3 + 1] < -80) {
                    pos.array[i * 3 + 1] = 250;
                    pos.array[i * 3] = (Math.random() - 0.5) * 300;
                }
            }
            pos.needsUpdate = true;
        }
    };
}

function createSnow() {
    const particleCount = 5000;
    const particles = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 350;
        positions[i * 3 + 1] = Math.random() * 200 + 50;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 350;
        velocities[i * 3] = (Math.random() - 0.5) * 0.3;
        velocities[i * 3 + 1] = -0.7 - Math.random() * 0.4;
        velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.3;
        sizes[i] = 0.8 + Math.random() * 1.2;
    }

    particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particles.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
    particles.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.ShaderMaterial({
        uniforms: {
            color: { value: new THREE.Color(0xffffff) },
            opacity: { value: 0.95 }
        },
        vertexShader: `
            attribute float size;
            attribute vec3 velocity;
            varying vec3 vColor;
            void main() {
                vColor = vec3(1.0);
                vec4 mvPosition = modelViewMatrix * vec4(position + velocity * 0.01, 1.0);
                gl_PointSize = size * (300.0 / -mvPosition.z);
                gl_Position = projectionMatrix * mvPosition;
            }
        `,
        fragmentShader: `
            varying vec3 vColor;
            uniform vec3 color;
            uniform float opacity;
            void main() {
                float dist = distance(gl_PointCoord, vec2(0.5));
                if (dist > 0.5) discard;
                gl_FragColor = vec4(color, opacity * (0.7 - dist * 1.4));
            }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending
    });

    const snowSystem = new THREE.Points(particles, material);

    return {
        system: snowSystem,
        update: (delta) => {
            const pos = snowSystem.geometry.attributes.position;
            const vel = snowSystem.geometry.attributes.velocity;
            const time = Date.now() * 0.0006;
            for (let i = 0; i < pos.count; i++) {
                pos.array[i * 3 + 1] += vel.array[i * 3 + 1] * delta * 60;
                pos.array[i * 3] += vel.array[i * 3] + Math.sin(time + i) * 0.03;
                if (pos.array[i * 3 + 1] < -50) {
                    pos.array[i * 3 + 1] = 200;
                    pos.array[i * 3] = (Math.random() - 0.5) * 350;
                }
            }
            pos.needsUpdate = true;
        }
    };
}

function createClouds() {
    const group = new THREE.Group();
    const clouds = [];

    const cloudShader = {
        uniforms: {
            u_color: { value: new THREE.Color(0xffffff) },
            u_time: { value: 0 },
            u_noise_scale: { value: 1.5 },
            u_opacity: { value: 0.7 }
        },
        vertexShader: `
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform vec3 u_color;
            uniform float u_time;
            uniform float u_noise_scale;
            uniform float u_opacity;
            varying vec2 vUv;

            float rand(vec2 co){ return fract(sin(dot(co.xy, vec2(12.9898,78.233))) * 43758.5453); }
            float noise(vec2 co){
                vec2 i = floor(co);
                vec2 f = fract(co);
                float a = rand(i);
                float b = rand(i + vec2(1.0, 0.0));
                float c = rand(i + vec2(0.0, 1.0));
                float d = rand(i + vec2(1.0, 1.0));
                vec2 u = f * f * (3.0 - 2.0 * f);
                return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
            }
            float fbm(vec2 p) {
                float value = 0.0;
                float amplitude = 0.5;
                for (int i = 0; i < 4; i++) {
                    value += amplitude * noise(p);
                    p *= 2.0;
                    amplitude *= 0.5;
                }
                return value;
            }
            void main() {
                float dist = distance(vUv, vec2(0.5));
                float circle_mask = 1.0 - smoothstep(0.4, 0.5, dist);
                vec2 noise_uv = vUv + vec2(u_time * 0.02, u_time * 0.01);
                float noise_val = fbm(noise_uv * u_noise_scale);
                float alpha = circle_mask * noise_val * u_opacity;
                gl_FragColor = vec4(u_color, alpha);
            }
        `
    };

    for (let i = 0; i < 20; i++) {
        const planeGeometry = new THREE.PlaneGeometry(100, 100);
        const cloudMaterial = new THREE.ShaderMaterial({
            ...cloudShader,
            transparent: true,
            blending: THREE.NormalBlending,
            depthWrite: false,
        });

        cloudMaterial.uniforms = THREE.UniformsUtils.clone(cloudShader.uniforms);

        const cloud = new THREE.Mesh(planeGeometry, cloudMaterial);
        cloud.position.set(
            (Math.random() - 0.5) * 800,
            80 + Math.random() * 60,
            -200 - Math.random() * 200
        );
        cloud.scale.setScalar(1.5 + Math.random() * 1.5);

        clouds.push({
            mesh: cloud,
            speed: 0.05 + Math.random() * 0.08,
            initialY: cloud.position.y,
            bobSpeed: 0.0003 + Math.random() * 0.0004,
            noiseScale: 1.0 + Math.random() * 1.5,
            opacity: 0.5 + Math.random() * 0.3
        });
        group.add(cloud);
    }

    return {
        system: group,
        update: (delta, time) => {
            clouds.forEach((cloud, index) => {
                cloud.mesh.position.x += cloud.speed * delta * 60;
                if (cloud.mesh.position.x > 500) {
                    cloud.mesh.position.x = -500;
                }

                cloud.mesh.position.y = cloud.initialY + Math.sin(time * cloud.bobSpeed * 500 + index) * 10;

                cloud.mesh.material.uniforms.u_time.value = time;
                cloud.mesh.material.uniforms.u_noise_scale.value = cloud.noiseScale;
                cloud.mesh.material.uniforms.u_opacity.value = cloud.opacity;

                cloud.mesh.lookAt(camera.position);
            });
        }
    };
}

function createNightClear() {
    const group = new THREE.Group();
    const starCount = 15000;
    const particles = new THREE.BufferGeometry();
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);
    const sizes = new Float32Array(starCount);
    const offsets = new Float32Array(starCount);

    for (let i = 0; i < starCount; i++) {
        const phi = Math.acos(2 * Math.random() - 1);
        const theta = 2 * Math.PI * Math.random();
        const radius = 400 + Math.random() * 200;

        positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
        positions[i * 3 + 2] = radius * Math.cos(phi);

        const temp = Math.random();
        let color;
        if (temp < 0.6) {
            color = new THREE.Color().setHSL(0.6, 0.2, 0.9 + Math.random() * 0.1);
        } else if (temp < 0.85) {
            color = new THREE.Color().setHSL(0.65, 0.4, 0.85 + Math.random() * 0.15);
        } else {
            color = new THREE.Color().setHSL(0.15, 0.3, 0.9 + Math.random() * 0.1);
        }

        colors[i * 3] = color.r;
        colors[i * 3 + 1] = color.g;
        colors[i * 3 + 2] = color.b;
        sizes[i] = Math.random() * 2 + 0.5;
        offsets[i] = Math.random() * Math.PI * 2;
    }

    particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particles.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    particles.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    particles.setAttribute('offset', new THREE.BufferAttribute(offsets, 1));

    const starMaterial = new THREE.ShaderMaterial({
        uniforms: {
            time: { value: 0 }
        },
        vertexShader: `
            attribute vec3 color;
            attribute float size;
            attribute float offset;
            varying vec3 vColor;
            varying float vOffset;
            void main() {
                vColor = color;
                vOffset = offset;
                vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                gl_PointSize = size * (300.0 / -mvPosition.z);
                gl_Position = projectionMatrix * mvPosition;
            }
        `,
        fragmentShader: `
            uniform float time;
            varying vec3 vColor;
            varying float vOffset;
            void main() {
                float dist = distance(gl_PointCoord, vec2(0.5));
                if (dist > 0.5) discard;
                float twinkle = sin(time * 3.0 + vOffset) * 0.4 + 0.8;
                float alpha = (1.0 - dist * 2.0) * twinkle;
                gl_FragColor = vec4(vColor, alpha);
            }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending
    });

    const stars = new THREE.Points(particles, starMaterial);
    group.add(stars);

    const moonGeometry = new THREE.SphereGeometry(15, 32, 32);
    const moonMaterial = new THREE.MeshPhongMaterial({
        color: 0xffffff,
        emissive: 0x222222,
        shininess: 5,
        transparent: true,
        opacity: 0.95
    });
    const moon = new THREE.Mesh(moonGeometry, moonMaterial);
    moon.position.set(150, 100, -200); // Adjusted to top-right
    group.add(moon);

    const glowLayers = [];
    for (let i = 0; i < 3; i++) {
        const glowGeometry = new THREE.SphereGeometry(18 + i * 5, 32, 32);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: new THREE.Color().setHSL(0.15, 0.1, 0.8 - i * 0.2),
            transparent: true,
            opacity: 0.15 - i * 0.04,
            blending: THREE.AdditiveBlending
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        glow.position.copy(moon.position);
        glowLayers.push(glow);
        group.add(glow);
    }

    return {
        system: group,
        update: (delta, time) => {
            stars.material.uniforms.time.value = time;
            stars.rotation.y += 0.0001;
            stars.rotation.x += 0.00005;

            const phase = Math.sin(time * 0.3) * 0.03 + 1;
            moon.scale.set(phase, phase, phase);
            moon.position.y += Math.sin(time * 0.5) * 0.05;

            glowLayers.forEach((glow, i) => {
                const glowPhase = phase * (1.1 + i * 0.05);
                glow.scale.set(glowPhase, glowPhase, glowPhase);
                glow.position.copy(moon.position);
                glow.material.opacity = (0.15 - i * 0.04) * (0.8 + Math.sin(time * 2 + i) * 0.2);
            });
        }
    };
}

function createSunny() {
    const group = new THREE.Group();
    const sunPosition = new THREE.Vector3(150, 100, -200); // Adjusted to top-right of the browser view

    const sunGeometry = new THREE.SphereGeometry(10, 64, 64);
    const sunMaterial = new THREE.ShaderMaterial({
        uniforms: {
            time: { value: 0 },
            color: { value: new THREE.Color(0xfff5b7) }
        },
        vertexShader: `
            varying vec2 vUv;
            varying vec3 vNormal;
            void main() {
                vUv = uv;
                vNormal = normal;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform float time;
            uniform vec3 color;
            varying vec2 vUv;
            varying vec3 vNormal;
            float rand(vec2 co){
                return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
            }
            float noise(vec2 co){
                vec2 i = floor(co);
                vec2 f = fract(co);
                float a = rand(i);
                float b = rand(i + vec2(1.0, 0.0));
                float c = rand(i + vec2(0.0, 1.0));
                float d = rand(i + vec2(1.0, 1.0));
                vec2 u = f * f * (3.0 - 2.0 * f);
                return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
            }
            float fbm(vec2 p) {
                float value = 0.0;
                float amplitude = 0.5;
                for (int i = 0; i < 5; i++) {
                    value += amplitude * noise(p);
                    p *= 2.0;
                    amplitude *= 0.5;
                }
                return value;
            }
            void main() {
                vec2 noise_uv = vUv * 5.0 + vec2(time * 0.1);
                float noise_val = fbm(noise_uv) * 0.3;
                vec3 finalColor = color * (1.0 + noise_val);
                float intensity = pow(dot(vNormal, vec3(0,0,1)), 1.5);
                gl_FragColor = vec4(finalColor, intensity);
            }
        `,
        blending: THREE.NormalBlending,
        transparent: true,
        depthWrite: false
    });

    const sun = new THREE.Mesh(sunGeometry, sunMaterial);
    sun.position.copy(sunPosition);
    group.add(sun);

    const rays = [];
    const rayCount = 16;
    for (let i = 0; i < rayCount; i++) {
        const rayGeometry = new THREE.PlaneGeometry(8, 200);
        const rayMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffaa,
            transparent: true,
            opacity: 0.15 + Math.random() * 0.1,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        const ray = new THREE.Mesh(rayGeometry, rayMaterial);
        ray.position.copy(sunPosition);
        ray.rotation.z = (i / rayCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.1;
        rays.push({
            mesh: ray,
            baseOpacity: ray.material.opacity,
            rotationSpeed: (Math.random() - 0.5) * 0.0005
        });
        group.add(ray);
    }

    const particleCount = 1000;
    const particleGeometry = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleSizes = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
        const radius = 12 + Math.random() * 20;
        const phi = Math.acos(2 * Math.random() - 1);
        const theta = 2 * Math.PI * Math.random();

        particlePositions[i * 3] = sunPosition.x + radius * Math.sin(phi) * Math.cos(theta);
        particlePositions[i * 3 + 1] = sunPosition.y + radius * Math.sin(phi) * Math.sin(theta);
        particlePositions[i * 3 + 2] = sunPosition.z + radius * Math.cos(phi);

        particleSizes[i] = Math.random() * 2.5 + 0.5;
    }

    particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    particleGeometry.setAttribute('size', new THREE.BufferAttribute(particleSizes, 1));

    const particleMaterial = new THREE.ShaderMaterial({
        uniforms: {
            time: { value: 0 },
            color: { value: new THREE.Color(0xfff0a0)}
        },
        vertexShader: `
            attribute float size;
            uniform float time;
            void main() {
                vec3 pos = position;
                pos.y += sin(time * 0.5 + position.x * 0.1) * 2.0;
                pos.x += cos(time * 0.4 + position.y * 0.1) * 2.0;
                vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
                gl_PointSize = size * (200.0 / -mvPosition.z);
                gl_Position = projectionMatrix * mvPosition;
            }
        `,
        fragmentShader: `
            uniform vec3 color;
            void main() {
                float dist = distance(gl_PointCoord, vec2(0.5));
                if (dist > 0.5) discard;
                gl_FragColor = vec4(color, (1.0 - dist * 2.0) * 0.7);
            }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });

    const particles = new THREE.Points(particleGeometry, particleMaterial);
    group.add(particles);

    
    const glowLayers = [];
    for (let i = 0; i < 4; i++) {
        const glowGeometry = new THREE.SphereGeometry(15 + i * 8, 64, 64);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: new THREE.Color().setHSL(0.12, 0.9, 0.9 - i * 0.15),
            transparent: true,
            opacity: 0.2 - i * 0.04,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        glow.position.copy(sunPosition);
        glowLayers.push(glow);
        group.add(glow);
    }

    return {
        system: group,
        update: (delta, time) => {
            sun.material.uniforms.time.value = time;
            const sunScale = 1 + Math.sin(time * 2) * 0.015;
            sun.scale.setScalar(sunScale);

            rays.forEach(rayObj => {
                rayObj.mesh.rotation.z += rayObj.rotationSpeed;
                rayObj.mesh.material.opacity = rayObj.baseOpacity * (0.7 + Math.sin(time * 4 + rayObj.mesh.rotation.z) * 0.3);
            });

            particles.material.uniforms.time.value = time;
            particles.rotation.y += 0.0001;

            glowLayers.forEach((glow, i) => {
                const glowScale = sunScale * (1.05 + i * 0.1);
                glow.scale.set(glowScale, glowScale, glowScale);
                glow.material.opacity = (0.2 - i * 0.04) * (0.85 + Math.sin(time * 1.5 + i) * 0.15);
            });
        }
    };
}

function createMist() {
    const group = new THREE.Group();
    const mists = [];

    const mistShader = {
        uniforms: {
            u_color: { value: new THREE.Color(0xdddddd) }, // Grayish for mist
            u_time: { value: 0 },
            u_noise_scale: { value: 2.0 },
            u_opacity: { value: 0.4 }
        },
        vertexShader: `
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform vec3 u_color;
            uniform float u_time;
            uniform float u_noise_scale;
            uniform float u_opacity;
            varying vec2 vUv;

            float rand(vec2 co){ return fract(sin(dot(co.xy, vec2(12.9898,78.233))) * 43758.5453); }
            float noise(vec2 co){
                vec2 i = floor(co);
                vec2 f = fract(co);
                float a = rand(i);
                float b = rand(i + vec2(1.0, 0.0));
                float c = rand(i + vec2(0.0, 1.0));
                float d = rand(i + vec2(1.0, 1.0));
                vec2 u = f * f * (3.0 - 2.0 * f);
                return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
            }
            float fbm(vec2 p) {
                float value = 0.0;
                float amplitude = 0.5;
                for (int i = 0; i < 5; i++) { // Increased octaves for smoother, more realistic mist
                    value += amplitude * noise(p);
                    p *= 2.0;
                    amplitude *= 0.5;
                }
                return value;
            }
            void main() {
                float dist = distance(vUv, vec2(0.5));
                float circle_mask = 1.0 - smoothstep(0.3, 0.6, dist); // Softer edges
                vec2 noise_uv = vUv + vec2(u_time * 0.03, u_time * 0.02); // Slower movement for realism
                float noise_val = fbm(noise_uv * u_noise_scale) * 1.2;
                float alpha = circle_mask * noise_val * u_opacity * (0.8 + sin(u_time * 0.5) * 0.2); // Gentle pulsing
                gl_FragColor = vec4(u_color, alpha);
            }
        `
    };

    for (let i = 0; i < 30; i++) { // More layers for denser mist
        const planeGeometry = new THREE.PlaneGeometry(150, 150);
        const mistMaterial = new THREE.ShaderMaterial({
            ...mistShader,
            transparent: true,
            blending: THREE.NormalBlending,
            depthWrite: false,
        });

        mistMaterial.uniforms = THREE.UniformsUtils.clone(mistShader.uniforms);

        const mist = new THREE.Mesh(planeGeometry, mistMaterial);
        mist.position.set(
            (Math.random() - 0.5) * 600,
            20 + Math.random() * 40, // Lower position for ground-level mist
            -100 - Math.random() * 150
        );
        mist.scale.setScalar(2.0 + Math.random() * 1.0);

        mists.push({
            mesh: mist,
            speed: 0.02 + Math.random() * 0.04, // Slower speed for drifting mist
            initialY: mist.position.y,
            bobSpeed: 0.0002 + Math.random() * 0.0003,
            noiseScale: 1.5 + Math.random() * 2.0,
            opacity: 0.3 + Math.random() * 0.4
        });
        group.add(mist);
    }

    // Add particle system for volumetric feel
    const particleCount = 2000;
    const particles = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 800;
        positions[i * 3 + 1] = Math.random() * 50;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 800;
        sizes[i] = 5 + Math.random() * 10;
    }

    particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particles.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const particleMaterial = new THREE.ShaderMaterial({
        uniforms: {
            time: { value: 0 },
            color: { value: new THREE.Color(0xcccccc) }
        },
        vertexShader: `
            attribute float size;
            uniform float time;
            void main() {
                vec3 pos = position;
                pos.x += sin(time * 0.2 + position.y) * 2.0;
                pos.z += cos(time * 0.3 + position.x) * 2.0;
                vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
                gl_PointSize = size * (150.0 / -mvPosition.z);
                gl_Position = projectionMatrix * mvPosition;
            }
        `,
        fragmentShader: `
            uniform vec3 color;
            void main() {
                float dist = distance(gl_PointCoord, vec2(0.5));
                if (dist > 0.5) discard;
                gl_FragColor = vec4(color, (0.5 - dist) * 0.6);
            }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });

    const mistParticles = new THREE.Points(particles, particleMaterial);
    group.add(mistParticles);

    return {
        system: group,
        update: (delta, time) => {
            mists.forEach((mist, index) => {
                mist.mesh.position.x += mist.speed * delta * 60;
                if (mist.mesh.position.x > 400) {
                    mist.mesh.position.x = -400;
                }

                mist.mesh.position.y = mist.initialY + Math.sin(time * mist.bobSpeed * 500 + index) * 5; // Subtle bobbing

                mist.mesh.material.uniforms.u_time.value = time;
                mist.mesh.material.uniforms.u_noise_scale.value = mist.noiseScale;
                mist.mesh.material.uniforms.u_opacity.value = mist.opacity;

                mist.mesh.lookAt(camera.position);
            });

            particleMaterial.uniforms.time.value = time;
        }
    };
}

function createClearDay() {
    return createSunny(); // Alias to sunny for clear day
}

function createClearNight() {
    return createNightClear(); // Alias to night_clear for clear night
}


function clearScene() {
    while(scene.children.length > 0){
        const child = scene.children[0];
        scene.remove(child);

        if (child instanceof THREE.Group) {
            child.traverse(obj => {
                if (obj.geometry) obj.geometry.dispose();
                if (obj.material) {
                    if (Array.isArray(obj.material)) {
                        obj.material.forEach(m => m.dispose());
                    } else {
                        obj.material.dispose();
                    }
                }
            });
        } else {
            if (child.geometry) child.geometry.dispose();
            if (child.material) {
                if (Array.isArray(child.material)) {
                    child.material.forEach(m => m.dispose());
                } else {
                    child.material.dispose();
                }
            }
        }
    }
    currentAnimation = null;
}

function updateWeatherAnimation(weatherType) {
    clearScene();

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    directionalLight.position.set(50, 100, 75);
    scene.add(directionalLight);

    switch (weatherType) {
        case 'rain':
            currentAnimation = createRain();
            break;
        case 'snow':
            currentAnimation = createSnow();
            break;
        case 'cloudy':
            currentAnimation = createClouds();
            break;
        case 'mist':
            currentAnimation = createMist();
            break;
        case 'sunny':
            currentAnimation = createSunny();
            break;
        case 'night_clear':
            currentAnimation = createNightClear();
            break;
        case 'clear_day':
            currentAnimation = createClearDay();
            break;
        case 'clear_night':
            currentAnimation = createClearNight();
            break;
        default:
            clearScene();
            return;
    }

    if (currentAnimation && currentAnimation.system) {
        scene.add(currentAnimation.system);
    }
}

function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();
    const elapsedTime = clock.getElapsedTime();
    if (currentAnimation && currentAnimation.update) {
        currentAnimation.update(delta, elapsedTime);
    }
    renderer.render(scene, camera);
}


async function fetchWeatherAndImage(location) {
    if (!location.trim()) return;

    try {
        const weatherResponse = await fetch(`${weatherApiUrl}${encodeURIComponent(location)}`);
        if (!weatherResponse.ok) throw new Error('City not found');
        const weatherData = await weatherResponse.json();

        updateWeatherData(weatherData);
        updateForecastData(weatherData);

        fetchLandmarkImage(weatherData.location.name).catch(err => console.warn("Landmark image fetch failed:", err));
        errorDisplay.style.display = 'none';
        weatherDisplay.style.display = 'block';
    } catch (error) {
        console.error("Weather fetch error:", error);
        errorDisplay.textContent = 'City not found. Please try again.';
        errorDisplay.style.display = 'block';
        weatherDisplay.style.display = 'none';
        appContainer.style.setProperty('--bg-image', 'none');
        updateWeatherAnimation('error');
    }
}

async function fetchLandmarkImage(city) {
    const landmarks = {
        'tirupati': 'tirupati temple',
        'delhi': 'India Gate',
        'kolkata': 'Victoria Memorial white marble dome',
        'mumbai': 'Gateway of India basalt arch monument',
        'jaipur': 'Hawa Mahal pink palace windows',
        'agra': 'Taj Mahal white marble mausoleum',
        'chennai': 'Marina Beach lighthouse coastline',
        'bangalore': 'Vidhana Soudha neo-dravidian architecture',
        'hyderabad': 'Charminar four minarets monument',
        'varanasi': 'Ganges River ghats ancient temples',
        'shimla': 'The Ridge colonial architecture mountains',
        'goa': 'Goa Beach palm trees coastline',
        'new york': 'Manhattan skyline Empire State Building',
        'paris': 'Eiffel Tower iron lattice tower',
        'tokyo': 'Tokyo Tower red steel structure',
        'london': 'Big Ben clock tower Westminster',
        'sydney': 'Sydney Opera House shell architecture',
        'cairo': 'Pyramids of Giza ancient monuments',
        'bhopal': 'Bhopal Upper Lake scenic view'
    };
    const query = landmarks[city.toLowerCase()] || `${city} famous landmark architecture`;
    try {
        const imageResponse = await fetch(`${unsplashApiUrl}${query}&client_id=${unsplashApiKey}&orientation=landscape&per_page=3`);
        const imageData = await imageResponse.json();
        if (imageData.results && imageData.results.length > 0) {
            const imageUrl = imageData.results[0].urls.regular;
            appContainer.style.setProperty('--bg-image', `url(${imageUrl})`);
        } else {
            appContainer.style.setProperty('--bg-image', 'none');
        }
    } catch (error) {
        console.error("Error fetching landmark image:", error);
        appContainer.style.setProperty('--bg-image', 'none');
    }
}

function updateWeatherData(data) {
    document.getElementById("city").textContent = data.location.name;
    document.getElementById("temp").textContent = `${Math.round(data.current.temp_c)}°C`;
    document.querySelector(".humidity").textContent = `${data.current.humidity}%`;
    document.querySelector(".wind").textContent = `${Math.round(data.current.wind_kph)}`;

    const conditionText = data.current.condition.text.toLowerCase();
    document.getElementById("condition").textContent = conditionText;
    const isDay = data.current.is_day === 1;

    if (conditionText.includes('rain') || conditionText.includes('shower') || conditionText.includes('drizzle')) {
        weatherIcon.src = "images/rain.png";
        updateWeatherAnimation('rain');
    } else if (conditionText.includes('snow') || conditionText.includes('blizzard') || conditionText.includes('ice') || conditionText.includes('sleet')) {
        weatherIcon.src = "images/snow.png";
        updateWeatherAnimation('snow');
    } else if (conditionText.includes('cloud') || conditionText.includes('overcast')) {
        weatherIcon.src = "images/clouds.png";
        updateWeatherAnimation('cloudy');
    } else if (conditionText.includes('mist') || conditionText.includes('haze') || conditionText.includes('fog')) {
        weatherIcon.src = "images/mist.png";
        updateWeatherAnimation('mist');
    } else if (conditionText.includes('clear') || conditionText.includes('sunny')) {
        weatherIcon.src = "images/clear.png";
        updateWeatherAnimation(isDay ? 'sunny' : 'night_clear');
    } else {
        weatherIcon.src = "images/clear.png";
        updateWeatherAnimation(isDay ? 'sunny' : 'night_clear');
    }
}

function updateForecastData(data) {
    forecastContainer.innerHTML = '';
    const forecastDays = data.forecast.forecastday.slice(1, 7);
    forecastDays.forEach(day => {
        const dayElement = document.createElement('div');
        dayElement.className = 'forecast-day';
        const date = new Date(day.date);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
        let iconSrc = "images/clear.png";
        const condition = day.day.condition.text.toLowerCase();
        if (condition.includes('rain') || condition.includes('shower')) iconSrc = "images/rain.png";
        else if (condition.includes('snow')) iconSrc = "images/snow.png";
        else if (condition.includes('cloud')) iconSrc = "images/clouds.png";
        else if (condition.includes('mist') || condition.includes('fog')) iconSrc = "images/mist.png";
        dayElement.innerHTML = `
            <div>${dayName}</div>
            <img src="${iconSrc}" alt="${day.day.condition.text}">
            <div>${Math.round(day.day.maxtemp_c)}°</div>
        `;
        forecastContainer.appendChild(dayElement);
    });
}


searchBtn.addEventListener('click', () => fetchWeatherAndImage(searchBox.value));
searchBox.addEventListener('keypress', (e) => { if (e.key === 'Enter') fetchWeatherAndImage(searchBox.value); });

window.addEventListener('resize', () => {
    if (!renderer || !camera) return;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

window.addEventListener('load', () => {
    try {
        initThreeJS();
        animate();
    } catch (error) {
        console.error("Three.js initialization error:", error);
    }
    setTimeout(() => {
        document.getElementById("preloader").style.display = "none";
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => fetchWeatherAndImage(`${position.coords.latitude},${position.coords.longitude}`),
                (error) => {
                    console.error("Geolocation error:", error);
                    fetchWeatherAndImage("London");
                }
            );
        } else {
            fetchWeatherAndImage("London");
        }
    }, 500);
});
