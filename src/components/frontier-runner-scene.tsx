"use client"

import { useEffect, useRef, type CSSProperties } from "react"
import * as THREE from "three"
import type { RouteEdge, RouteNode } from "@/games/frontier-runner"

type FrontierRunnerSceneProps = {
  mode: "bfs" | "dijkstra"
  nodes: RouteNode[]
  edges: RouteEdge[]
  visited: string[]
  frontier: string[]
  distances: Record<string, number>
  bikeNode: string
  motionKey: number
  onSelectNode: (id: string) => void
}

function labelSprite(text: string, color: string) {
  const canvas = document.createElement("canvas")
  canvas.width = 128
  canvas.height = 72
  const context = canvas.getContext("2d")
  if (!context) return null
  context.clearRect(0, 0, canvas.width, canvas.height)
  context.fillStyle = "rgba(8, 18, 36, .9)"
  context.roundRect(8, 8, 112, 56, 14)
  context.fill()
  context.strokeStyle = color
  context.lineWidth = 3
  context.stroke()
  context.fillStyle = "#faf9f6"
  context.font = "700 30px ui-monospace, monospace"
  context.textAlign = "center"
  context.textBaseline = "middle"
  context.fillText(text, 64, 36)
  const texture = new THREE.CanvasTexture(canvas)
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false })
  const sprite = new THREE.Sprite(material)
  sprite.scale.set(.72, .4, 1)
  return sprite
}

export default function FrontierRunnerScene({ mode, nodes, edges, visited, frontier, distances, bikeNode, motionKey, onSelectNode }: FrontierRunnerSceneProps) {
  const host = useRef<HTMLDivElement>(null)
  const state = useRef({ mode, visited, frontier, distances, bikeNode, motionKey, onSelectNode })
  state.current = { mode, visited, frontier, distances, bikeNode, motionKey, onSelectNode }

  useEffect(() => {
    const element = host.current
    if (!element) return
    const probe = document.createElement("canvas")
    if (!probe.getContext("webgl2") && !probe.getContext("webgl")) return

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(34, 1, .1, 100)
    camera.position.set(0, 5.8, 7.4)
    camera.lookAt(0, 0, 0)
    let renderer: THREE.WebGLRenderer
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }) } catch { return }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.setSize(element.clientWidth, element.clientHeight, false)
    element.appendChild(renderer.domElement)

    scene.add(new THREE.AmbientLight(0xffffff, 1.7))
    const light = new THREE.DirectionalLight(0xffffff, 2.8)
    light.position.set(-2, 7, 4)
    scene.add(light)

    const world = new THREE.Group()
    scene.add(world)
    const positions = new Map(nodes.map(node => [node.id, new THREE.Vector3(...node.position)]))
    const nodeMeshes = new Map<string, THREE.Mesh>()
    const labels: THREE.Sprite[] = []
    const edgeMaterials: THREE.LineBasicMaterial[] = []

    const floor = new THREE.Mesh(new THREE.CircleGeometry(5.3, 64), new THREE.MeshBasicMaterial({ color: 0x0b1224, transparent: true, opacity: .82 }))
    floor.rotation.x = -Math.PI / 2
    floor.position.y = -.14
    world.add(floor)
    const grid = new THREE.GridHelper(8.4, 12, 0x33436a, 0x1b2948)
    grid.position.y = -.1
    grid.material.transparent = true
    grid.material.opacity = .5
    world.add(grid)

    edges.forEach(edge => {
      const from = positions.get(edge.from)
      const to = positions.get(edge.to)
      if (!from || !to) return
      const geometry = new THREE.BufferGeometry().setFromPoints([from.clone().setY(.06), to.clone().setY(.06)])
      const material = new THREE.LineBasicMaterial({ color: mode === "dijkstra" ? 0xfbbf24 : 0x5b8def, transparent: true, opacity: .48 })
      const line = new THREE.Line(geometry, material)
      world.add(line)
      edgeMaterials.push(material)
    })

    nodes.forEach(node => {
      const material = new THREE.MeshStandardMaterial({ color: 0x64748b, emissive: 0x111827, emissiveIntensity: .4, roughness: .3, metalness: .25 })
      const mesh = new THREE.Mesh(new THREE.IcosahedronGeometry(.29, 1), material)
      mesh.position.set(...node.position)
      mesh.position.y = .2
      mesh.userData.nodeId = node.id
      world.add(mesh)
      nodeMeshes.set(node.id, mesh)
      const label = labelSprite(node.id, mode === "dijkstra" ? "#fbbf24" : "#5b8def")
      if (label) {
        label.position.set(node.position[0], .78, node.position[2])
        world.add(label)
        labels.push(label)
      }
    })

    const bike = new THREE.Group()
    const bikeBody = new THREE.Mesh(new THREE.SphereGeometry(.24, 16, 12), new THREE.MeshStandardMaterial({ color: 0xfaf9f6, emissive: 0xffffff, emissiveIntensity: .6, roughness: .2, metalness: .25 }))
    bikeBody.scale.set(1, .55, 1.35)
    bike.add(bikeBody)
    const bikeRing = new THREE.Mesh(new THREE.TorusGeometry(.4, .025, 8, 32), new THREE.MeshBasicMaterial({ color: mode === "dijkstra" ? 0xfbbf24 : 0x5b8def, transparent: true, opacity: .9 }))
    bikeRing.rotation.x = Math.PI / 2
    bike.add(bikeRing)
    world.add(bike)

    const raycaster = new THREE.Raycaster()
    const pointer = new THREE.Vector2()
    const clickables = [...nodeMeshes.values()]
    const onPointerDown = (event: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect()
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
      raycaster.setFromCamera(pointer, camera)
      const hit = raycaster.intersectObjects(clickables, false)[0]
      if (hit) state.current.onSelectNode(hit.object.userData.nodeId as string)
    }
    renderer.domElement.addEventListener("pointerdown", onPointerDown)

    const resize = () => {
      renderer.setSize(element.clientWidth, element.clientHeight, false)
      camera.aspect = element.clientWidth / Math.max(1, element.clientHeight)
      camera.updateProjectionMatrix()
    }
    const observer = new ResizeObserver(resize)
    observer.observe(element)
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const startedAt = performance.now()
    let frame = 0
    const animate = () => {
      const current = state.current
      const elapsed = (performance.now() - startedAt) / 1000
      const target = positions.get(current.bikeNode) || positions.get(nodes[0].id)!
      const targetPosition = target.clone().setY(.2)
      bike.position.lerp(targetPosition, reduced ? 1 : .09)
      bikeRing.rotation.z = reduced ? 0 : elapsed * .9
      nodeMeshes.forEach((mesh, id) => {
        const material = mesh.material as THREE.MeshStandardMaterial
        const settled = current.visited.includes(id)
        const available = current.frontier.includes(id)
        material.color.setHex(settled ? 0x34d399 : available ? (current.mode === "dijkstra" ? 0xfbbf24 : 0x5b8def) : 0x64748b)
        material.emissive.setHex(settled ? 0x064e3b : available ? 0x172554 : 0x111827)
        material.emissiveIntensity = available ? .75 : .35
        mesh.scale.setScalar(available ? 1.14 + (reduced ? 0 : Math.sin(elapsed * 3 + id.charCodeAt(0)) * .05) : 1)
      })
      edgeMaterials.forEach(material => { material.opacity = current.mode === "dijkstra" ? .58 : .46 })
      if (!reduced) world.rotation.y = Math.sin(elapsed * .22) * .035
      renderer.render(scene, camera)
      frame = requestAnimationFrame(animate)
    }
    animate()
    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      renderer.domElement.removeEventListener("pointerdown", onPointerDown)
      renderer.dispose()
      element.removeChild(renderer.domElement)
      scene.traverse(object => {
        if (object instanceof THREE.Mesh || object instanceof THREE.Line) object.geometry.dispose()
        if (!(object instanceof THREE.Mesh || object instanceof THREE.Line || object instanceof THREE.Sprite)) return
        const material = object.material
        if (Array.isArray(material)) material.forEach(item => item.dispose())
        else {
          if ("map" in material && material.map) material.map.dispose()
          material.dispose()
        }
      })
    }
  }, [edges, mode, nodes])

  const statusStyle = { "--frontier-color": mode === "dijkstra" ? "#fbbf24" : "#5b8def" } as CSSProperties
  return <div ref={host} className="frontier-runner-scene" style={statusStyle} role="img" aria-label={`${mode === "bfs" ? "Unweighted" : "Weighted"} graph frontier map`}>
    <span className="frontier-scene-hint">Tap a glowing node or use the route controls below</span>
    <span className="frontier-scene-key">{mode === "bfs" ? "green = settled · blue = frontier" : "green = settled · gold = frontier"}</span>
    <span className="frontier-motion-key" aria-hidden="true">{motionKey}</span>
  </div>
}
