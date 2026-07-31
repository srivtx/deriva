"use client"

import { useEffect, useRef } from "react"
import { useState, type CSSProperties } from "react"
import * as THREE from "three"

export default function StackClimberScene({ depth, phase, motionKey }: { depth: number; phase: string; motionKey: number }) {
  const host = useRef<HTMLDivElement>(null)
  const [fallback, setFallback] = useState(false)
  const state = useRef({ depth, phase, motionKey, pointerX: 0, pointerY: 0 })
  state.current.depth = depth
  state.current.phase = phase
  state.current.motionKey = motionKey

  useEffect(() => {
    const element = host.current
    if (!element) return
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(34, 1, .1, 100)
    camera.position.set(0, 0.2, 7)
    camera.lookAt(0, 0, 0)
    let renderer: THREE.WebGLRenderer
    const probe = document.createElement("canvas")
    if (!probe.getContext("webgl2") && !probe.getContext("webgl")) { setFallback(true); return }
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    } catch {
      setFallback(true)
      return
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(element.clientWidth, element.clientHeight, false)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    element.appendChild(renderer.domElement)

    scene.add(new THREE.AmbientLight(0xffffff, 1.5))
    const light = new THREE.DirectionalLight(0xffffff, 2.4)
    light.position.set(3, 4, 5)
    scene.add(light)

    const group = new THREE.Group()
    scene.add(group)
    const colors = [0x5b8def, 0x7c3aed, 0xec4899, 0xf59e0b, 0x10b981]
    const blocks = Array.from({ length: 5 }, (_, index) => {
      const material = new THREE.MeshStandardMaterial({ color: colors[index], roughness: .28, metalness: .2, emissive: colors[index], emissiveIntensity: .08 })
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(1.3, .42, .48), material)
      mesh.position.set((index % 2 ? .12 : -.12), -1.3 + index * .56, 0)
      mesh.rotation.z = index % 2 ? -.07 : .07
      group.add(mesh)
      return mesh
    })
    const floor = new THREE.Mesh(new THREE.CircleGeometry(2.5, 48), new THREE.MeshBasicMaterial({ color: 0x7c3aed, transparent: true, opacity: .12 }))
    floor.rotation.x = -Math.PI / 2
    floor.position.y = -1.65
    group.add(floor)

    const resize = () => {
      renderer.setSize(element.clientWidth, element.clientHeight, false)
      camera.aspect = element.clientWidth / Math.max(1, element.clientHeight)
      camera.updateProjectionMatrix()
    }
    const observer = new ResizeObserver(resize)
    observer.observe(element)
    const onPointerMove = (event: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect()
      state.current.pointerX = ((event.clientX - rect.left) / rect.width - .5) * .7
      state.current.pointerY = ((event.clientY - rect.top) / rect.height - .5) * .35
    }
    renderer.domElement.addEventListener("pointermove", onPointerMove)

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const startedAt = performance.now()
    let frame = 0
    const animate = () => {
      const elapsed = (performance.now() - startedAt) / 1000
      const current = state.current
      const visible = Math.max(1, Math.min(5, current.depth))
      blocks.forEach((block, index) => {
        const targetY = -1.3 + index * .56 + (index < visible ? 0 : -.28)
        block.position.y += (targetY - block.position.y) * .12
        block.position.x += (((index % 2 ? .12 : -.12) + current.pointerX * (index + 1) * .06) - block.position.x) * .08
        block.rotation.y = current.phase === "return" ? Math.sin(elapsed * 4 + index) * .18 : Math.sin(elapsed * .8 + index) * .04
        block.material.opacity = index < visible ? 1 : .28
        block.material.transparent = index >= visible
      })
      if (!reduced) {
        group.rotation.x += (current.pointerY - group.rotation.x) * .04
        group.rotation.y += (current.pointerX - group.rotation.y) * .04
        floor.rotation.z = elapsed * .08
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
        if (!(object instanceof THREE.Mesh)) return
        object.geometry.dispose()
        const material = object.material
        if (Array.isArray(material)) material.forEach(item => item.dispose())
        else material.dispose()
      })
    }
  }, [])

  return <div ref={host} className="stack-climber-3d" role="img" aria-label="Animated 3D recursion stack">
    {fallback && <div className="stack-3d-fallback">{Array.from({ length: 5 }, (_, index) => <span key={index} style={{ "--i": index } as CSSProperties}>sum_to({5 - index})</span>)}</div>}
  </div>
}
