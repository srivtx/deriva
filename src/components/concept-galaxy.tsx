"use client"

import { useEffect, useRef, useState, type CSSProperties } from "react"
import * as THREE from "three"
import { GAME_ENGINES } from "@/games/catalog"

const COLORS = [0x5b8def, 0xe879f9, 0x34d399, 0xfbbf24, 0xfb7185, 0x22d3ee, 0xa78bfa, 0xf97316]

export default function ConceptGalaxy() {
  const host = useRef<HTMLDivElement>(null)
  const [selectedId, setSelectedId] = useState(GAME_ENGINES[0].id)
  const [fallback, setFallback] = useState(false)

  useEffect(() => {
    const element = host.current
    if (!element) return

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100)
    camera.position.set(0, 0.2, 8.8)
    camera.lookAt(0, 0, 0)

    let renderer: THREE.WebGLRenderer
    const probe = document.createElement("canvas")
    if (!probe.getContext("webgl2") && !probe.getContext("webgl")) {
      setFallback(true)
      return
    }
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" })
    } catch {
      setFallback(true)
      return
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.setClearColor(0x000000, 0)
    element.appendChild(renderer.domElement)

    scene.add(new THREE.AmbientLight(0xffffff, 1.7))
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.2)
    keyLight.position.set(4, 5, 6)
    scene.add(keyLight)
    const rimLight = new THREE.PointLight(0x7c3aed, 12, 12)
    rimLight.position.set(-3, -2, 4)
    scene.add(rimLight)

    const galaxy = new THREE.Group()
    scene.add(galaxy)

    const core = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.7, 1),
      new THREE.MeshStandardMaterial({ color: 0xfaf9f6, emissive: 0x2e5aac, emissiveIntensity: 0.8, roughness: 0.25, metalness: 0.15 }),
    )
    galaxy.add(core)

    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(1.05, 0.012, 8, 64),
      new THREE.MeshBasicMaterial({ color: 0x8fb2ff, transparent: true, opacity: 0.75 }),
    )
    ring.rotation.x = Math.PI / 2.7
    galaxy.add(ring)

    const nodeGroup = new THREE.Group()
    galaxy.add(nodeGroup)
    const nodes: THREE.Mesh[] = []

    GAME_ENGINES.forEach((engine, index) => {
      const angle = (index / GAME_ENGINES.length) * Math.PI * 2 - Math.PI / 2
      const radius = 2.5 + (index % 2) * 0.2
      const geometry = index % 3 === 0
        ? new THREE.BoxGeometry(0.48, 0.48, 0.48)
        : index % 3 === 1
          ? new THREE.OctahedronGeometry(0.4, 0)
          : new THREE.IcosahedronGeometry(0.42, 0)
      const material = new THREE.MeshStandardMaterial({ color: COLORS[index], emissive: COLORS[index], emissiveIntensity: 0.16, roughness: 0.34, metalness: 0.28 })
      const node = new THREE.Mesh(geometry, material)
      node.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius * 0.62, (index % 2) * 0.35 - 0.15)
      node.userData = { id: engine.id, index }
      nodeGroup.add(node)
      nodes.push(node)

      const lineGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        node.position.clone(),
      ])
      const line = new THREE.Line(lineGeometry, new THREE.LineBasicMaterial({ color: COLORS[index], transparent: true, opacity: 0.22 }))
      galaxy.add(line)
    })

    let width = 0
    let height = 0
    const resize = () => {
      width = element.clientWidth
      height = Math.max(230, element.clientHeight)
      renderer.setSize(width, height, false)
      camera.aspect = width / height
      camera.updateProjectionMatrix()
    }
    resize()
    const observer = new ResizeObserver(resize)
    observer.observe(element)

    const raycaster = new THREE.Raycaster()
    const pointer = new THREE.Vector2()
    const onPointerMove = (event: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect()
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
      raycaster.setFromCamera(pointer, camera)
      const hit = raycaster.intersectObjects(nodes)[0]?.object
      if (hit) {
        const id = hit.userData.id as string
        setSelectedId(current => current === id ? current : id)
        renderer.domElement.style.cursor = "pointer"
      } else {
        renderer.domElement.style.cursor = "default"
      }
    }
    renderer.domElement.addEventListener("pointermove", onPointerMove)

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const startedAt = performance.now()
    let frame = 0
    const animate = () => {
      const elapsed = (performance.now() - startedAt) / 1000
      if (!reduced) {
        galaxy.rotation.y = elapsed * 0.12
        galaxy.rotation.x = Math.sin(elapsed * 0.35) * 0.05
        core.rotation.x = elapsed * 0.3
        core.rotation.y = elapsed * 0.45
        ring.rotation.z = elapsed * 0.25
        nodes.forEach((node, index) => {
          node.rotation.x = elapsed * (0.35 + index * 0.025)
          node.rotation.y = elapsed * (0.5 + index * 0.02)
          node.position.z = Math.sin(elapsed * 1.2 + index) * 0.18
        })
      }
      renderer.render(scene, camera)
      frame = requestAnimationFrame(animate)
    }
    animate()

    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      renderer.domElement.removeEventListener("pointermove", onPointerMove)
      renderer.dispose()
      element.removeChild(renderer.domElement)
      scene.traverse(object => {
        if (!(object instanceof THREE.Mesh) && !(object instanceof THREE.Line)) return
        object.geometry.dispose()
        const material = object.material
        if (Array.isArray(material)) material.forEach(item => item.dispose())
        else material.dispose()
      })
    }
  }, [])

  const selected = GAME_ENGINES.find(engine => engine.id === selectedId) || GAME_ENGINES[0]

  return (
    <div className="concept-galaxy-shell">
      <div ref={host} className="concept-galaxy" role="img" aria-label="Interactive 3D map of Deriva game engines">
        {fallback && <div className="galaxy-fallback">{GAME_ENGINES.map((engine, index) => <span key={engine.id} style={{ "--i": index } as CSSProperties} />)}</div>}
      </div>
      <div className="concept-galaxy-caption">
        <span>Tap a shape to inspect the pattern family</span>
        <b>{selected.title}</b>
        <small>{selected.verb} · {selected.patterns.length} patterns</small>
      </div>
    </div>
  )
}
