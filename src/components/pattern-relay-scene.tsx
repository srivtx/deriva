"use client"

import { useEffect, useRef, useState } from "react"
import * as THREE from "three"

const ROOM_COLORS = [0x5b8def, 0x34d399, 0xfbbf24, 0xe879f9, 0xfb7185]

export default function PatternRelayScene({ progress }: { progress: number }) {
  const host = useRef<HTMLDivElement>(null)
  const progressRef = useRef(progress)
  const [fallback, setFallback] = useState(false)
  progressRef.current = progress

  useEffect(() => {
    const element = host.current
    if (!element) return
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(32, 1, .1, 100)
    camera.position.set(0, 1.15, 10.2)
    camera.lookAt(0, 0, 0)
    let renderer: THREE.WebGLRenderer
    const probe = document.createElement("canvas")
    if (!probe.getContext("webgl2") && !probe.getContext("webgl")) { setFallback(true); return }
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }) } catch { setFallback(true); return }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.setSize(element.clientWidth, element.clientHeight, false)
    element.appendChild(renderer.domElement)
    scene.add(new THREE.AmbientLight(0xffffff, 1.7))
    const light = new THREE.DirectionalLight(0xffffff, 2.8)
    light.position.set(2, 5, 6)
    scene.add(light)

    const world = new THREE.Group()
    scene.add(world)
    const rooms: THREE.Mesh[] = []
    const player = new THREE.Mesh(new THREE.IcosahedronGeometry(.32, 1), new THREE.MeshStandardMaterial({ color: 0xfaf9f6, emissive: 0xffffff, emissiveIntensity: .3, roughness: .2, metalness: .3 }))
    player.position.set(-3.4, .9, .65)
    world.add(player)
    const trail = new THREE.Mesh(new THREE.TorusGeometry(.48, .012, 8, 32), new THREE.MeshBasicMaterial({ color: 0xfaf9f6, transparent: true, opacity: .5 }))
    trail.rotation.x = Math.PI / 2
    trail.position.set(-3.4, .9, .65)
    world.add(trail)
    for (let index = 0; index < 5; index++) {
      const x = -3.2 + index * 1.6
      const room = new THREE.Mesh(new THREE.BoxGeometry(.68, .68, .68), new THREE.MeshStandardMaterial({ color: ROOM_COLORS[index], emissive: ROOM_COLORS[index], emissiveIntensity: .2, roughness: .3, metalness: .25 }))
      room.position.set(x, -.1, 0)
      room.rotation.set(.2, .2, .2)
      world.add(room)
      rooms.push(room)
      if (index < 4) {
        const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(x + .4, -.1, 0), new THREE.Vector3(x + 1.2, -.1, 0)]), new THREE.LineBasicMaterial({ color: ROOM_COLORS[index], transparent: true, opacity: .6 }))
        world.add(line)
      }
    }
    const halo = new THREE.Mesh(new THREE.TorusGeometry(.52, .018, 8, 32), new THREE.MeshBasicMaterial({ color: 0xfaf9f6, transparent: true, opacity: .8 }))
    halo.rotation.x = Math.PI / 2
    halo.position.set(-3.4, .9, .65)
    world.add(halo)

    const resize = () => { renderer.setSize(element.clientWidth, element.clientHeight, false); camera.aspect = element.clientWidth / Math.max(1, element.clientHeight); camera.updateProjectionMatrix() }
    const observer = new ResizeObserver(resize)
    observer.observe(element)
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const startedAt = performance.now()
    let frame = 0
    const animate = () => {
      const elapsed = (performance.now() - startedAt) / 1000
      const current = progressRef.current
      const targetX = -3.4 + Math.min(4, current) * 1.6
      player.position.x += (targetX - player.position.x) * .08
      halo.position.x = player.position.x
      halo.position.y = player.position.y
      halo.position.z = player.position.z
      trail.position.x += (player.position.x - trail.position.x) * .16
      trail.position.y = player.position.y
      trail.position.z = player.position.z
      rooms.forEach((room, index) => {
        const material = room.material as THREE.MeshStandardMaterial
        material.opacity = index <= current ? 1 : .38
        material.transparent = index > current
        if (!reduced) room.rotation.y = elapsed * .35 + index * .4
      })
      if (!reduced) { player.rotation.x = elapsed * .8; player.rotation.y = elapsed * 1.1; player.position.y = .9 + Math.sin(elapsed * 2.2) * .08; world.rotation.y = Math.sin(elapsed * .35) * .08; halo.rotation.z = elapsed * .7; trail.rotation.z = elapsed * .7 }
      renderer.render(scene, camera)
      frame = requestAnimationFrame(animate)
    }
    animate()
    return () => { cancelAnimationFrame(frame); observer.disconnect(); renderer.dispose(); element.removeChild(renderer.domElement); scene.traverse(object => { if (object instanceof THREE.Mesh || object instanceof THREE.Line) { object.geometry.dispose(); const material = object.material; if (Array.isArray(material)) material.forEach(item => item.dispose()); else material.dispose() } }) }
  }, [])

  return <div ref={host} className="pattern-relay-scene" aria-label="3D Algorithm Relay map" role="img">{fallback && <div className="relay-fallback">{Array.from({ length: 5 }, (_, index) => <span key={index} className={index <= progress ? "active" : ""}>{index + 1}</span>)}</div>}</div>
}
