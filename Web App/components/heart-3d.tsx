"use client"

import { useEffect, useRef } from "react"
import * as THREE from "three"
import { motion } from "framer-motion"

interface Heart3DProps {
  heartRate: number
  isActive: boolean
  size?: number
}

export default function Heart3D({ heartRate, isActive, size = 120 }: Heart3DProps) {
  const mountRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<THREE.Scene>()
  const rendererRef = useRef<THREE.WebGLRenderer>()
  const heartRef = useRef<THREE.Group>()
  const animationRef = useRef<number>()

  useEffect(() => {
    if (!mountRef.current) return

    // Scene setup
    const scene = new THREE.Scene()
    sceneRef.current = scene

    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000)
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    rendererRef.current = renderer

    renderer.setSize(size, size)
    renderer.setClearColor(0x000000, 0)
    mountRef.current.appendChild(renderer.domElement)

    // Create heart shape with more detailed geometry
    const heartGroup = new THREE.Group()
    heartRef.current = heartGroup

    // Enhanced heart shape using curves for more realistic look
    const heartShape = new THREE.Shape()
    
    // Create a more anatomically correct heart shape
    const x = 0, y = 0
    heartShape.moveTo(x, y)
    
    // Left ventricle curve
    heartShape.bezierCurveTo(x - 0.5, y - 0.3, x - 0.8, y - 0.1, x - 0.6, y + 0.2)
    heartShape.bezierCurveTo(x - 0.6, y + 0.4, x - 0.3, y + 0.7, x, y + 1.2)
    
    // Right ventricle curve
    heartShape.bezierCurveTo(x + 0.3, y + 0.7, x + 0.6, y + 0.4, x + 0.6, y + 0.2)
    heartShape.bezierCurveTo(x + 0.8, y - 0.1, x + 0.5, y - 0.3, x, y)

    // Extrude settings for 3D effect
    const extrudeSettings = {
      depth: 0.3,
      bevelEnabled: true,
      bevelSegments: 8,
      steps: 4,
      bevelSize: 0.08,
      bevelThickness: 0.06,
    }

    const heartGeometry = new THREE.ExtrudeGeometry(heartShape, extrudeSettings)
    
    // Create gradient-like material for more realistic look
    const heartMaterial = new THREE.MeshPhongMaterial({
      color: 0xff2d55,
      shininess: 100,
      transparent: true,
      opacity: 0.95,
      specular: 0xff6b6b,
    })

    const heartMesh = new THREE.Mesh(heartGeometry, heartMaterial)
    heartMesh.scale.set(0.8, -0.8, 0.8) // Flip vertically and scale
    heartMesh.rotation.z = Math.PI // Rotate to correct orientation
    heartGroup.add(heartMesh)

    // Add inner glow effect
    const glowGeometry = heartGeometry.clone()
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0xff4757,
      transparent: true,
      opacity: 0.3,
      side: THREE.BackSide,
    })
    const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial)
    glowMesh.scale.set(0.85, -0.85, 0.85)
    glowMesh.rotation.z = Math.PI
    heartGroup.add(glowMesh)

    scene.add(heartGroup)

    // Enhanced lighting for better 3D effect
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4)
    scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(2, 2, 2)
    directionalLight.castShadow = true
    scene.add(directionalLight)

    const pointLight = new THREE.PointLight(0xff4757, 1.5, 100)
    pointLight.position.set(0, 0, 3)
    scene.add(pointLight)

    // Add rim lighting
    const rimLight = new THREE.DirectionalLight(0xff6b9d, 0.5)
    rimLight.position.set(-2, -1, 1)
    scene.add(rimLight)

    // Camera position for better view
    camera.position.z = 2.5
    camera.position.y = 0.2
    camera.lookAt(0, 0, 0)

    // Animation loop
    let time = 0
    const animate = () => {
      animationRef.current = requestAnimationFrame(animate)
      time += 0.016 // ~60fps

      if (heartRef.current) {
        // Calculate beating animation based on heart rate
        const bpm = isActive ? heartRate : 60 // Default to 60 BPM when inactive
        const beatFrequency = (bpm / 60) * 2 // Convert BPM to beats per second, multiply by 2 for more noticeable effect
        
        // Create realistic heartbeat pattern (lub-dub)
        const beatCycle = (time * beatFrequency) % 1
        let scale = 1
        
        if (beatCycle < 0.15) {
          // First beat (lub) - stronger
          scale = 1 + Math.sin(beatCycle * Math.PI / 0.15) * 0.25
        } else if (beatCycle < 0.25) {
          // Brief pause
          scale = 1
        } else if (beatCycle < 0.35) {
          // Second beat (dub) - weaker
          scale = 1 + Math.sin((beatCycle - 0.25) * Math.PI / 0.1) * 0.15
        } else {
          // Rest period
          scale = 1
        }

        heartRef.current.scale.setScalar(scale)
        
        // Subtle rotation for dynamic effect
        heartRef.current.rotation.y = Math.sin(time * 0.5) * 0.1
        heartRef.current.rotation.x = Math.sin(time * 0.3) * 0.05
        
        // Pulsing glow effect
        const glowIntensity = 0.3 + Math.sin(time * beatFrequency * 2 * Math.PI) * 0.2
        if (glowMesh.material instanceof THREE.MeshBasicMaterial) {
          glowMesh.material.opacity = Math.max(0.1, glowIntensity)
        }
        
        // Dynamic point light intensity based on heartbeat
        pointLight.intensity = 1.5 + Math.sin(time * beatFrequency * 2 * Math.PI) * 0.5
      }

      renderer.render(scene, camera)
    }

    animate()

    // Cleanup function
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement)
      }
      renderer.dispose()
      heartGeometry.dispose()
      heartMaterial.dispose()
      glowGeometry.dispose()
      glowMaterial.dispose()
    }
  }, [heartRate, isActive, size])

  return (
    <motion.div
      ref={mountRef}
      className="flex items-center justify-center"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      style={{ width: size, height: size }}
    />
  )
}
