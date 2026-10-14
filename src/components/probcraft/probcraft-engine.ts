// 3D Voxel Minecraft-Style Engine for ProbCraft
// High-performance Three.js first-person player controller with AABB collisions,
// procedural voxel textures, raycast targeting, pointer lock, and audio cues.

import * as THREE from "three"
import { type ProbWorld, type VoxelCoord, type VoxelBlockType } from "@/data/probcraft-worlds"
import { probAudio } from "./probcraft-audio"

export interface EngineCallbacks {
  onTargetChange: (target: { id: string; name: string; oddsDesc: string; expectedValue: number } | null) => void
  onBlockMine: (coord: VoxelCoord) => void
  onPlayerMove?: (pos: [number, number, number]) => void
}

// Generate an authentic 16x16 pixelated voxel texture using HTML5 Canvas
function createPixelTexture(baseColor: string, speckleColor?: string, isGrassTop = false): THREE.CanvasTexture {
  const canvas = document.createElement("canvas")
  canvas.width = 16
  canvas.height = 16
  const ctx = canvas.getContext("2d")!

  ctx.fillStyle = baseColor
  ctx.fillRect(0, 0, 16, 16)

  // Pixel speckles for voxel texture depth
  for (let x = 0; x < 16; x++) {
    for (let y = 0; y < 16; y++) {
      const rand = Math.random()
      if (rand > 0.75) {
        ctx.fillStyle = "rgba(0, 0, 0, 0.12)"
        ctx.fillRect(x, y, 1, 1)
      } else if (rand < 0.25) {
        ctx.fillStyle = "rgba(255, 255, 255, 0.12)"
        ctx.fillRect(x, y, 1, 1)
      }
    }
  }

  if (speckleColor) {
    ctx.fillStyle = speckleColor
    // Place ore speckles
    const spots = [[3, 4], [4, 4], [8, 10], [9, 10], [12, 3], [13, 3], [5, 12], [6, 12]]
    spots.forEach(([sx, sy]) => {
      ctx.fillRect(sx, sy, 2, 2)
    })
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.magFilter = THREE.NearestFilter
  texture.minFilter = THREE.NearestFilter
  return texture
}

export class ProbCraftEngine {
  private container: HTMLDivElement
  private scene: THREE.Scene
  private camera: THREE.PerspectiveCamera
  private renderer: THREE.WebGLRenderer
  private animationFrameId: number | null = null
  private callbacks: EngineCallbacks

  // Physics & Player State
  private playerPos = new THREE.Vector3(0, 2, 6)
  private playerVel = new THREE.Vector3(0, 0, 0)
  private yaw = 0
  private pitch = 0
  private isGrounded = false
  private keys: Record<string, boolean> = {}

  // World Voxels
  private currentWorld: ProbWorld
  private blockMeshes = new Map<string, THREE.Mesh>()
  private solidBoxes: THREE.Box3[] = []
  private wireframeBox: THREE.LineSegments
  private targetedBlockCoord: VoxelCoord | null = null

  // Texture Cache
  private materialCache = new Map<VoxelBlockType, THREE.Material | THREE.Material[]>()
  private stepAccumulator = 0

  constructor(container: HTMLDivElement, world: ProbWorld, callbacks: EngineCallbacks) {
    this.container = container
    this.currentWorld = world
    this.callbacks = callbacks

    // 1. Scene & Camera Setup
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0x14161a) // var(--paper) dark tone
    this.scene.fog = new THREE.FogExp2(0x14161a, 0.025)

    const aspect = container.clientWidth / Math.max(1, container.clientHeight)
    this.camera = new THREE.PerspectiveCamera(70, aspect, 0.1, 100)

    // 2. WebGL Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" })
    this.renderer.setSize(container.clientWidth, container.clientHeight)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    container.appendChild(this.renderer.domElement)

    // 3. Lighting Setup
    const ambient = new THREE.AmbientLight(0xffffff, 1.2)
    this.scene.add(ambient)

    const sun = new THREE.DirectionalLight(0xfff7ed, 2.0)
    sun.position.set(20, 40, 20)
    sun.castShadow = true
    sun.shadow.mapSize.width = 1024
    sun.shadow.mapSize.height = 1024
    this.scene.add(sun)

    // 4. Targeted Block Outline Box
    const wireframeGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(1.02, 1.02, 1.02))
    const wireframeMat = new THREE.LineBasicMaterial({ color: 0x2f8f5b, linewidth: 2 }) // var(--accent)
    this.wireframeBox = new THREE.LineSegments(wireframeGeo, wireframeMat)
    this.wireframeBox.visible = false
    this.scene.add(this.wireframeBox)

    // 5. Initialize Materials & World
    this.initMaterials()
    this.loadWorld(world)

    // 6. Bind Event Listeners
    this.bindEvents()

    // 7. Start Render Loop
    this.lastTime = performance.now()
    this.animate()
  }

  private initMaterials() {
    const grassTop = createPixelTexture("#3f6212", undefined, true)
    const dirtSide = createPixelTexture("#713f12")
    const stoneTex = createPixelTexture("#4b5563")
    const cobbleTex = createPixelTexture("#374151")
    const goldTex = createPixelTexture("#4b5563", "#eab308")
    const diamondTex = createPixelTexture("#4b5563", "#06b6d4")
    const coalTex = createPixelTexture("#4b5563", "#18181b")
    const obsidianTex = createPixelTexture("#1e1b4b", "#4338ca")
    const lavaTex = createPixelTexture("#ea580c", "#fbbf24")
    const chestTex = createPixelTexture("#b45309", "#f59e0b")
    const bedrockTex = createPixelTexture("#111827")
    const diceTex = createPixelTexture("#d97706", "#ffffff")
    const redstoneTex = createPixelTexture("#dc2626", "#f87171")

    // Grass block has grass on top, dirt on sides and bottom
    const grassMats = [
      new THREE.MeshStandardMaterial({ map: dirtSide, roughness: 0.8 }),
      new THREE.MeshStandardMaterial({ map: dirtSide, roughness: 0.8 }),
      new THREE.MeshStandardMaterial({ map: grassTop, roughness: 0.8 }),
      new THREE.MeshStandardMaterial({ map: dirtSide, roughness: 0.8 }),
      new THREE.MeshStandardMaterial({ map: dirtSide, roughness: 0.8 }),
      new THREE.MeshStandardMaterial({ map: dirtSide, roughness: 0.8 }),
    ]
    this.materialCache.set("grass", grassMats)

    const makeMat = (tex: THREE.CanvasTexture, emissive?: number, opacity = 1) =>
      new THREE.MeshStandardMaterial({
        map: tex,
        roughness: 0.7,
        metalness: 0.1,
        transparent: opacity < 1,
        opacity,
        emissive: emissive ? new THREE.Color(emissive) : undefined,
        emissiveIntensity: emissive ? 0.35 : 0,
      })

    this.materialCache.set("dirt", makeMat(dirtSide))
    this.materialCache.set("stone", makeMat(stoneTex))
    this.materialCache.set("cobble", makeMat(cobbleTex))
    this.materialCache.set("wood", makeMat(chestTex))
    this.materialCache.set("gold_ore", makeMat(goldTex))
    this.materialCache.set("diamond_ore", makeMat(diamondTex, 0x06b6d4))
    this.materialCache.set("coal_ore", makeMat(coalTex))
    this.materialCache.set("obsidian", makeMat(obsidianTex))
    this.materialCache.set("portal", new THREE.MeshStandardMaterial({ color: 0x7e22ce, emissive: 0x9333ea, emissiveIntensity: 0.8, transparent: true, opacity: 0.75 }))
    this.materialCache.set("lava", makeMat(lavaTex, 0xea580c))
    this.materialCache.set("chest", makeMat(chestTex))
    this.materialCache.set("bedrock", makeMat(bedrockTex))
    this.materialCache.set("dice_block", makeMat(diceTex, 0xf59e0b))
    this.materialCache.set("glass", new THREE.MeshStandardMaterial({ color: 0x93c5fd, transparent: true, opacity: 0.45, roughness: 0.1 }))
    this.materialCache.set("redstone", makeMat(redstoneTex, 0xdc2626))
  }

  public loadWorld(world: ProbWorld) {
    this.currentWorld = world

    // Remove existing block meshes
    this.blockMeshes.forEach(mesh => {
      this.scene.remove(mesh)
      mesh.geometry.dispose()
    })
    this.blockMeshes.clear()
    this.solidBoxes = []

    // Set spawn point
    this.playerPos.set(world.playerSpawn[0], world.playerSpawn[1], world.playerSpawn[2])
    this.playerVel.set(0, 0, 0)

    const lookTarget = new THREE.Vector3(world.cameraLookAt[0], world.cameraLookAt[1], world.cameraLookAt[2])
    const dir = new THREE.Vector3().subVectors(lookTarget, this.playerPos).normalize()
    this.yaw = Math.atan2(-dir.x, -dir.z)
    this.pitch = Math.asin(dir.y)

    // Build Voxel Mesh Blocks
    const boxGeo = new THREE.BoxGeometry(1, 1, 1)

    world.blocks.forEach(block => {
      if (block.type === "air") return

      const mat = this.materialCache.get(block.type) || new THREE.MeshStandardMaterial({ color: 0x6b7280 })
      const mesh = new THREE.Mesh(boxGeo.clone(), mat)
      mesh.position.set(block.x, block.y, block.z)
      mesh.castShadow = true
      mesh.receiveShadow = true
      mesh.userData = { coord: block }

      this.scene.add(mesh)
      const key = `${block.x},${block.y},${block.z}`
      this.blockMeshes.set(key, mesh)

      // Solid collision bounding box (except portal and lava which are triggers)
      if (block.type !== "portal" && block.type !== "lava") {
        this.solidBoxes.push(new THREE.Box3(
          new THREE.Vector3(block.x - 0.5, block.y - 0.5, block.z - 0.5),
          new THREE.Vector3(block.x + 0.5, block.y + 0.5, block.z + 0.5)
        ))
      }
    })

    probAudio.playPortal()
  }

  // Raycast to find the block right in front of the camera
  private checkTarget() {
    const raycaster = new THREE.Raycaster()
    raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera)
    raycaster.far = 6.0 // 6 block reach

    const meshes = Array.from(this.blockMeshes.values())
    const intersects = raycaster.intersectObjects(meshes, false)

    if (intersects.length > 0) {
      const hit = intersects[0]
      const mesh = hit.object as THREE.Mesh
      const coord = mesh.userData.coord as VoxelCoord

      this.targetedBlockCoord = coord
      this.wireframeBox.position.copy(mesh.position)
      this.wireframeBox.visible = true

      // Find if this matches an interactive target in the world
      const interactive = this.currentWorld.interactiveTargets.find(
        t => Math.round(t.x) === Math.round(coord.x) && Math.round(t.y) === Math.round(coord.y) && Math.round(t.z) === Math.round(coord.z)
      )

      if (interactive) {
        this.callbacks.onTargetChange(interactive)
      } else {
        this.callbacks.onTargetChange({
          id: `block-${coord.x}-${coord.y}-${coord.z}`,
          name: coord.label || `${coord.type.replace("_", " ").toUpperCase()}`,
          oddsDesc: "Voxel Material Block",
          expectedValue: 1.0,
        })
      }
    } else {
      this.targetedBlockCoord = null
      this.wireframeBox.visible = false
      this.callbacks.onTargetChange(null)
    }
  }

  public interactCurrentTarget() {
    if (this.targetedBlockCoord) {
      probAudio.playMine()
      this.callbacks.onBlockMine(this.targetedBlockCoord)
    }
  }

  // Player Controls & Event Handlers
  private onKeyDown = (e: KeyboardEvent) => {
    this.keys[e.code] = true

    if (e.code === "Space" && this.isGrounded) {
      this.playerVel.y = 7.0 // Jump impulse
      this.isGrounded = false
      probAudio.playStep()
    }

    if (e.code === "KeyE") {
      this.interactCurrentTarget()
    }
  }

  private onKeyUp = (e: KeyboardEvent) => {
    this.keys[e.code] = false
  }

  private onMouseMove = (e: MouseEvent) => {
    // Only adjust view if pointer is locked, or if dragging
    if (document.pointerLockElement === this.renderer.domElement || this.isDragging) {
      const sensitivity = 0.0022
      this.yaw -= e.movementX * sensitivity
      this.pitch -= e.movementY * sensitivity
      const maxPitch = (85 * Math.PI) / 180
      this.pitch = Math.max(-maxPitch, Math.min(maxPitch, this.pitch))
    }
  }

  private isDragging = false
  private dragStartX = 0
  private dragStartY = 0

  private onMouseDown = (e: MouseEvent) => {
    if (e.button === 0) {
      // Left click: request pointer lock for desktop mouse feel
      if (document.pointerLockElement !== this.renderer.domElement) {
        this.renderer.domElement.requestPointerLock()
      } else {
        this.interactCurrentTarget()
      }
    }
    this.isDragging = true
    this.dragStartX = e.clientX
    this.dragStartY = e.clientY
  }

  private onMouseUp = () => {
    this.isDragging = false
  }

  // Touch Support for Landscape Mode on Phones / Tablets
  private onTouchMove = (e: TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0]
      const dx = touch.clientX - this.dragStartX
      const dy = touch.clientY - this.dragStartY
      this.dragStartX = touch.clientX
      this.dragStartY = touch.clientY

      const sensitivity = 0.004
      this.yaw -= dx * sensitivity
      this.pitch -= dy * sensitivity
      const maxPitch = (85 * Math.PI) / 180
      this.pitch = Math.max(-maxPitch, Math.min(maxPitch, this.pitch))
    }
  }

  private onTouchStart = (e: TouchEvent) => {
    if (e.touches.length === 1) {
      this.dragStartX = e.touches[0].clientX
      this.dragStartY = e.touches[0].clientY
    }
  }

  private onResize = () => {
    if (!this.container) return
    const width = this.container.clientWidth
    const height = Math.max(1, this.container.clientHeight)
    this.renderer.setSize(width, height)
    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()
  }

  private resizeObserver: ResizeObserver | null = null

  private bindEvents() {
    window.addEventListener("keydown", this.onKeyDown)
    window.addEventListener("keyup", this.onKeyUp)
    window.addEventListener("mousemove", this.onMouseMove)
    this.renderer.domElement.addEventListener("mousedown", this.onMouseDown)
    window.addEventListener("mouseup", this.onMouseUp)

    this.renderer.domElement.addEventListener("touchstart", this.onTouchStart, { passive: true })
    this.renderer.domElement.addEventListener("touchmove", this.onTouchMove, { passive: true })

    this.resizeObserver = new ResizeObserver(this.onResize)
    this.resizeObserver.observe(this.container)
  }

  // Physics Update with Voxel Bounding Box Collisions
  private lastTime = 0
  private updatePhysics(delta: number) {
    const moveSpeed = 6.0
    const moveDir = new THREE.Vector3()

    if (this.keys["KeyW"] || this.keys["ArrowUp"]) moveDir.z -= 1
    if (this.keys["KeyS"] || this.keys["ArrowDown"]) moveDir.z += 1
    if (this.keys["KeyA"] || this.keys["ArrowLeft"]) moveDir.x -= 1
    if (this.keys["KeyD"] || this.keys["ArrowRight"]) moveDir.x += 1

    if (moveDir.lengthSq() > 0) {
      moveDir.normalize()
      // Rotate by player yaw
      const forward = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw))
      const right = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw))

      const deltaMove = new THREE.Vector3()
        .addScaledVector(forward, -moveDir.z)
        .addScaledVector(right, moveDir.x)
        .multiplyScalar(moveSpeed)

      this.playerVel.x = deltaMove.x
      this.playerVel.z = deltaMove.z

      // Footstep audio cadence
      this.stepAccumulator += delta
      if (this.stepAccumulator > 0.36 && this.isGrounded) {
        probAudio.playStep()
        this.stepAccumulator = 0
      }
    } else {
      this.playerVel.x *= 0.75
      this.playerVel.z *= 0.75
    }

    // Apply Gravity
    const gravity = -18.0
    this.playerVel.y += gravity * delta

    // Predict next position
    const nextPos = this.playerPos.clone().addScaledVector(this.playerVel, delta)

    // Player AABB Bounding Box: width 0.6, height 1.8
    const playerBox = new THREE.Box3(
      new THREE.Vector3(nextPos.x - 0.3, nextPos.y - 1.6, nextPos.z - 0.3),
      new THREE.Vector3(nextPos.x + 0.3, nextPos.y + 0.2, nextPos.z + 0.3)
    )

    this.isGrounded = false
    // Collision against solid voxel boxes
    for (const box of this.solidBoxes) {
      if (playerBox.intersectsBox(box)) {
        // Check vertical collision (ground / ceiling)
        if (this.playerVel.y < 0 && this.playerPos.y - 1.6 >= box.max.y - 0.2) {
          nextPos.y = box.max.y + 1.6
          this.playerVel.y = 0
          this.isGrounded = true
        } else if (this.playerVel.y > 0 && this.playerPos.y + 0.2 <= box.min.y + 0.2) {
          nextPos.y = box.min.y - 0.21
          this.playerVel.y = 0
        }
      }
    }

    // Fall into void safety reset
    if (nextPos.y < -8) {
      nextPos.set(this.currentWorld.playerSpawn[0], this.currentWorld.playerSpawn[1], this.currentWorld.playerSpawn[2])
      this.playerVel.set(0, 0, 0)
      probAudio.playPortal()
    }

    this.playerPos.copy(nextPos)

    // Camera update (head position at playerPos)
    this.camera.position.copy(this.playerPos)
    const euler = new THREE.Euler(this.pitch, this.yaw, 0, "YXZ")
    this.camera.quaternion.setFromEuler(euler)

    this.callbacks.onPlayerMove?.([this.playerPos.x, this.playerPos.y, this.playerPos.z])
  }

  private animate = () => {
    const now = performance.now()
    const delta = Math.min((now - this.lastTime) / 1000, 0.1) // clamp delta to prevent tunneling
    this.lastTime = now

    this.updatePhysics(delta)
    this.checkTarget()

    this.renderer.render(this.scene, this.camera)
    this.animationFrameId = requestAnimationFrame(this.animate)
  }

  public dispose() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId)
    }

    window.removeEventListener("keydown", this.onKeyDown)
    window.removeEventListener("keyup", this.onKeyUp)
    window.removeEventListener("mousemove", this.onMouseMove)
    this.renderer.domElement.removeEventListener("mousedown", this.onMouseDown)
    window.removeEventListener("mouseup", this.onMouseUp)
    this.renderer.domElement.removeEventListener("touchstart", this.onTouchStart)
    this.renderer.domElement.removeEventListener("touchmove", this.onTouchMove)

    this.resizeObserver?.disconnect()

    this.renderer.dispose()
    if (this.container.contains(this.renderer.domElement)) {
      this.container.removeChild(this.renderer.domElement)
    }

    this.scene.traverse(obj => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose()
      }
    })
  }
}
