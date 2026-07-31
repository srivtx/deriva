"use client"

import { useEffect, useRef, type CSSProperties } from "react"
import * as THREE from "three"
import type { SubwayChoice, SubwayStationId } from "@/games/subway-switch-runner"

type SubwaySwitchSceneProps = {
  station: SubwayStationId
  choices: SubwayChoice[]
  visited: SubwayStationId[]
  memoryUnlocked: boolean
  motionKey: number
  onSelectChoice: (choiceId: string) => void
}

function makeLabel(text: string, accent: string) {
  const canvas = document.createElement("canvas")
  canvas.width = 256
  canvas.height = 72
  const context = canvas.getContext("2d")
  if (!context) return null
  context.clearRect(0, 0, canvas.width, canvas.height)
  context.fillStyle = "rgba(8, 18, 36, .92)"
  context.roundRect(8, 8, 240, 56, 14)
  context.fill()
  context.strokeStyle = accent
  context.lineWidth = 3
  context.stroke()
  context.fillStyle = "#faf9f6"
  context.font = "700 24px ui-monospace, monospace"
  context.textAlign = "center"
  context.textBaseline = "middle"
  context.fillText(text, 128, 36)
  const texture = new THREE.CanvasTexture(canvas)
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false })
  const sprite = new THREE.Sprite(material)
  sprite.scale.set(1.08, .31, 1)
  return sprite
}

export default function SubwaySwitchScene({ station, choices, visited, memoryUnlocked, motionKey, onSelectChoice }: SubwaySwitchSceneProps) {
  const host = useRef<HTMLDivElement>(null)
  const state = useRef({ station, choices, visited, memoryUnlocked, motionKey, onSelectChoice })
  state.current = { station, choices, visited, memoryUnlocked, motionKey, onSelectChoice }

  useEffect(() => {
    const element = host.current
    if (!element) return
    const probe = document.createElement("canvas")
    if (!probe.getContext("webgl2") && !probe.getContext("webgl")) return

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(39, 1, .1, 100)
    camera.position.set(0, 3.25, 6.9)
    camera.lookAt(0, .8, -1)
    let renderer: THREE.WebGLRenderer
    try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }) } catch { return }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.setSize(element.clientWidth, element.clientHeight, false)
    element.appendChild(renderer.domElement)

    scene.add(new THREE.AmbientLight(0xffffff, 1.5))
    const light = new THREE.DirectionalLight(0xffffff, 2.5)
    light.position.set(-3, 6, 5)
    scene.add(light)

    const world = new THREE.Group()
    scene.add(world)
    const choiceMeshes = new Map<string, THREE.Mesh>()
    const labels: THREE.Sprite[] = []
    const laneX = [-2.1, 0, 2.1]
    const trackColors = [0xef476f, 0xfbbf24, 0x5b8def]

    const platform = new THREE.Mesh(new THREE.BoxGeometry(7.5, .18, 7), new THREE.MeshStandardMaterial({ color: 0x111c34, roughness: .8, metalness: .1 }))
    platform.position.y = -.16
    world.add(platform)

    for (let lane = 0; lane < 3; lane++) {
      const x = laneX[lane]
      const railMaterial = new THREE.MeshBasicMaterial({ color: trackColors[lane], transparent: true, opacity: .58 })
      for (const offset of [-.24, .24]) {
        const rail = new THREE.Mesh(new THREE.BoxGeometry(.045, .045, 7), railMaterial)
        rail.position.set(x + offset, .03, -1)
        world.add(rail)
      }
      for (let sleeper = 0; sleeper < 9; sleeper++) {
        const tie = new THREE.Mesh(new THREE.BoxGeometry(1.1, .04, .09), new THREE.MeshBasicMaterial({ color: 0x344569, transparent: true, opacity: .65 }))
        tie.position.set(x, .015, 2.1 - sleeper * .78)
        world.add(tie)
      }
      const gate = new THREE.Mesh(new THREE.BoxGeometry(1.18, 1.05, .16), new THREE.MeshStandardMaterial({ color: trackColors[lane], emissive: trackColors[lane], emissiveIntensity: .15, transparent: true, opacity: .7, roughness: .35 }))
      gate.position.set(x, .58, -3.85)
      world.add(gate)
    }

    const tunnelTop = new THREE.Mesh(new THREE.BoxGeometry(7.8, .18, 7), new THREE.MeshBasicMaterial({ color: 0x25365b, transparent: true, opacity: .55 }))
    tunnelTop.position.y = 3.25
    world.add(tunnelTop)
    for (const x of [-3.65, 3.65]) {
      const wall = new THREE.Mesh(new THREE.BoxGeometry(.18, 3.4, 7), new THREE.MeshStandardMaterial({ color: 0x1b2948, roughness: .7 }))
      wall.position.set(x, 1.5, -1)
      world.add(wall)
    }

    choices.forEach((choice, index) => {
      const color = trackColors[index % trackColors.length]
      const switchMesh = new THREE.Mesh(new THREE.OctahedronGeometry(.44, 0), new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: .35, roughness: .28, metalness: .25 }))
      switchMesh.position.set(laneX[index], .46, 1.72)
      switchMesh.userData.choiceId = choice.id
      world.add(switchMesh)
      choiceMeshes.set(choice.id, switchMesh)
      const label = makeLabel(choice.label.split(" → ")[0], `#${color.toString(16).padStart(6, "0")}`)
      if (label) {
        label.position.set(laneX[index], 1.06, 1.72)
        world.add(label)
        labels.push(label)
      }
    })

    const runner = new THREE.Group()
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(.22, .42, 5, 12), new THREE.MeshStandardMaterial({ color: 0xfaf9f6, emissive: 0xffffff, emissiveIntensity: .45, roughness: .2, metalness: .22 }))
    body.rotation.z = Math.PI / 2
    runner.add(body)
    const glow = new THREE.Mesh(new THREE.TorusGeometry(.42, .025, 8, 30), new THREE.MeshBasicMaterial({ color: 0x34d399, transparent: true, opacity: .85 }))
    glow.rotation.x = Math.PI / 2
    runner.add(glow)
    runner.position.set(0, .62, 2.62)
    world.add(runner)

    const raycaster = new THREE.Raycaster()
    const pointer = new THREE.Vector2()
    const clickables = [...choiceMeshes.values()]
    const onPointerDown = (event: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect()
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
      raycaster.setFromCamera(pointer, camera)
      const hit = raycaster.intersectObjects(clickables, false)[0]
      if (hit) state.current.onSelectChoice(hit.object.userData.choiceId as string)
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
      choiceMeshes.forEach((mesh, id) => {
        const choice = current.choices.find(item => item.id === id)
        const material = mesh.material as THREE.MeshStandardMaterial
        const blocked = current.memoryUnlocked && !!choice && current.visited.includes(choice.target as SubwayStationId)
        material.opacity = blocked ? .28 : .95
        material.transparent = blocked
        mesh.scale.setScalar(blocked ? .75 : 1 + (reduced ? 0 : Math.sin(elapsed * 3 + id.length) * .05))
      })
      const lane = Math.max(0, current.choices.findIndex(choice => choice.id === current.station))
      const destinationX = laneX[(current.motionKey + lane) % laneX.length] || 0
      runner.position.x += (destinationX - runner.position.x) * (reduced ? 1 : .06)
      runner.position.y = .62 + (reduced ? 0 : Math.sin(elapsed * 4) * .04)
      glow.rotation.z = reduced ? 0 : elapsed * .8
      if (!reduced) world.position.z = Math.sin(elapsed * .45) * .025
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
        if (object instanceof THREE.Mesh) object.geometry.dispose()
        if (!(object instanceof THREE.Mesh || object instanceof THREE.Sprite)) return
        const material = object.material
        if (Array.isArray(material)) material.forEach(item => item.dispose())
        else {
          if ("map" in material && material.map) material.map.dispose()
          material.dispose()
        }
      })
    }
  }, [choices, station])

  const sceneStyle = { "--subway-accent": memoryUnlocked ? "#34d399" : "#fbbf24" } as CSSProperties
  return <div ref={host} className="subway-switch-scene" style={sceneStyle} role="img" aria-label={`${station} subway switch with ${visited.length} visited stations`}>
    <span className="subway-scene-hint">Tap a switch or use the track controls below</span>
    <span className="subway-scene-memory">{memoryUnlocked ? "station stamps active" : "no visited memory"}</span>
    <span className="subway-motion-key" aria-hidden="true">{motionKey}</span>
  </div>
}
