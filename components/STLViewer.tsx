"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { STLLoader } from "three/addons/loaders/STLLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { motion } from "framer-motion";

interface STLViewerProps {
  url: string;
  className?: string;
}

export default function STLViewer({ url, className = "" }: STLViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111111);

    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 0, 5);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Lights — warm industrial
    const ambient = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambient);

    const key = new THREE.DirectionalLight(0xffeedd, 0.9);
    key.position.set(5, 8, 4);
    scene.add(key);

    const fill = new THREE.DirectionalLight(0xff4d00, 0.15);
    fill.position.set(-3, -2, -4);
    scene.add(fill);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 1.0;

    // Load STL
    const loader = new STLLoader();
    loader.load(url, (geometry) => {
      const material = new THREE.MeshStandardMaterial({
        color: 0xff4d00,
        roughness: 0.5,
        metalness: 0.2,
      });

      const mesh = new THREE.Mesh(geometry, material);
      geometry.computeBoundingBox();
      const box = geometry.boundingBox!;
      const center = new THREE.Vector3();
      box.getCenter(center);
      mesh.position.sub(center);

      const size = new THREE.Vector3();
      box.getSize(size);
      const maxDim = Math.max(size.x, size.y, size.z);
      mesh.scale.setScalar(3 / maxDim);

      scene.add(mesh);
    });

    let frameId: number;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", onResize);
      controls.dispose();
      renderer.dispose();
      container.removeChild(renderer.domElement);
    };
  }, [url]);

  return (
    <motion.div
      ref={containerRef}
      className={className}
      style={{ borderRadius: "var(--radius)", border: "1px solid var(--ash)" }}
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
    />
  );
}
