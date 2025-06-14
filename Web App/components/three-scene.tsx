"use client"

import { useEffect, useRef } from "react"
import * as THREE from "three"

export default function ThreeScene() {
  const mountRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<THREE.Scene>()
  const rendererRef = useRef<THREE.WebGLRenderer>()
  const heartRef = useRef<THREE.Group>()

  useEffect(() => {
    if (!mountRef.current) return

    // Scene setup
    const scene = new THREE.Scene()
    sceneRef.current = scene

    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000)
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    rendererRef.current = renderer

    renderer.setSize(300, 200)
    renderer.setClearColor(0x000000, 0)
    mountRef.current.appendChild(renderer.domElement)

    // Create heart shape
    const heartGroup = new THREE.Group()
    heartRef.current = heartGroup

    // Heart geometry using curves
    const heartShape = new THREE.Shape()
    heartShape.moveTo(0, 0)
    heartShape.bezierCurveTo(0, -0.3, -0.6, -0.3, -0.6, 0)
    heartShape.bezierCurveTo(-0.6, 0.3, 0, 0.6, 0, 1)
    heartShape.bezierCurveTo(0, 0.6, 0.6, 0.3, 0.6, 0)
    heartShape.bezierCurveTo(0.6, -0.3, 0, -0.3, 0, 0)

    const extrudeSettings = {
      depth: 0.2,
      bevelEnabled: true,
      bevelSegments: 2,
      steps: 2,
      bevelSize: 0.05,
      bevelThickness: 0.05,
    }

    const heartGeometry = new THREE.ExtrudeGeometry(heartShape, extrudeSettings)
    const heartMaterial = new THREE.MeshPhongMaterial({
      color: 0xff4757,
      shininess: 100,
      transparent: true,
      opacity: 0.9,
    })

    const heartMesh = new THREE.Mesh(heartGeometry, heartMaterial)
    heartMesh.scale.set(0.8, 0.8, 0.8)
    heartGroup.add(heartMesh)

    // Add pulsing effect with additional geometry
    const pulseGeometry = new THREE.ExtrudeGeometry(heartShape, { ...extrudeSettings, depth: 0.1 })
    const pulseMaterial = new THREE.MeshPhongMaterial({
      color: 0xff6b7a,
      transparent: true,
      opacity: 0.3,
    })
    const pulseMesh = new THREE.Mesh(pulseGeometry, pulseMaterial)
    pulseMesh.scale.set(1.1, 1.1, 1.1)
    heartGroup.add(pulseMesh)

    scene.add(heartGroup)

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
    scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(1, 1, 1)
    scene.add(directionalLight)

    const pointLight = new THREE.PointLight(0xff4757, 1, 100)
    pointLight.position.set(0, 0, 2)
    scene.add(pointLight)

    // Camera position
    camera.position.z = 3
    camera.position.y = 0.5

    // Animation
    let time = 0
    const animate = () => {
      requestAnimationFrame(animate)
      time += 0.016 // ~60fps

      if (heartRef.current) {
        // Gentle rotation
        heartRef.current.rotation.y = Math.sin(time * 0.3) * 0.15
        heartRef.current.rotation.x = Math.sin(time * 0.2) * 0.08

        // Realistic heartbeat pulsing effect (lub-dub pattern)
        const heartbeatFreq = 1.2 // beats per second
        const beat = Math.sin(time * heartbeatFreq * Math.PI * 2)
        const doubleBeat = Math.sin(time * heartbeatFreq * Math.PI * 4) * 0.3
        const scale = 1 + (beat + doubleBeat) * 0.08
        heartRef.current.scale.set(scale, scale, scale)
      }

      // Update pulse mesh with synchronized animation
      if (heartGroup.children[1]) {
        const heartbeatFreq = 1.2
        const pulseBeat = Math.sin(time * heartbeatFreq * Math.PI * 2)
        const pulseScale = 1.1 + pulseBeat * 0.15
        heartGroup.children[1].scale.set(pulseScale, pulseScale, pulseScale)

        // Fade in/out with heartbeat
        const opacity = 0.2 + Math.abs(pulseBeat) * 0.3
        ;(heartGroup.children[1].material as THREE.MeshPhongMaterial).opacity = opacity
      }

      renderer.render(scene, camera)
    }

    animate()

    // Cleanup
    return () => {
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement)
      }
      renderer.dispose()
    }
  }, [])

  return <div ref={mountRef} className="w-full h-full flex items-center justify-center" />
}
