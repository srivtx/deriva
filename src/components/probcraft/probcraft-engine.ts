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
  onToggleHud?: () => void
  onToggleKeybindings?: () => void
  onToggleJournal?: () => void
  onToggleCodex?: () => void
  onToggleSound?: () => void
  onTeleportWorld?: (worldNumber: number) => void
  onSelectHotbarSlot?: (slot: number) => void
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

const BLOCK_COLOR_HEX: Record<VoxelBlockType, number> = {
  air: 0x000000,
  grass: 0x4d7c0f,
  dirt: 0x78350f,
  stone: 0x6b7280,
  cobble: 0x4b5563,
  wood: 0x92400e,
  gold_ore: 0xeab308,
  diamond_ore: 0x06b6d4,
  coal_ore: 0x27272a,
  obsidian: 0x312e81,
  portal: 0xa855f7,
  lava: 0xea580c,
  chest: 0xb45309,
  bedrock: 0x18181b,
  dice_block: 0xf59e0b,
  glass: 0x93c5fd,
  redstone: 0xef4444,
}

export class ProbCraftEngine {
  private container: HTMLDivElement
  private scene: THREE.Scene
  private camera: THREE.PerspectiveCamera
  private renderer: THREE.WebGLRenderer
  private animationFrameId: number | null = null
  private callbacks: EngineCallbacks

  // Physics & Player State
  private playerPos = new THREE.Vector3(0, 2.15, 4)
  private playerVel = new THREE.Vector3(0, 0, 0)
  private yaw = 0
  private pitch = 0
  private isGrounded = true
  private keys: Record<string, boolean> = {}

  // World Voxels
  private currentWorld: ProbWorld
  private blockMeshes = new Map<string, THREE.Mesh>()
  private solidBoxes: THREE.Box3[] = []
  private wireframeBox: THREE.LineSegments
  private targetedBlockCoord: VoxelCoord | null = null
  private lastTargetId: string | null = null

  // Texture Cache
  private materialCache = new Map<VoxelBlockType, THREE.Material | THREE.Material[]>()
  private stepAccumulator = 0

  // 3D Visual Feedback: Debris Particles and Floating Text Billboards
  private particles: { mesh: THREE.Mesh; vel: THREE.Vector3; life: number; maxLife: number }[] = []
  private floatingTexts: { sprite: THREE.Sprite; velY: number; life: number; maxLife: number; texture: THREE.CanvasTexture }[] = []

  constructor(container: HTMLDivElement, world: ProbWorld, callbacks: EngineCallbacks) {
    this.container = container
    this.currentWorld = world
    this.callbacks = callbacks

    // 1. Scene & Camera Setup
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0x14161a) // var(--paper) dark tone
    this.scene.fog = new THREE.FogExp2(0x14161a, 0.011)

    const aspect = container.clientWidth / Math.max(1, container.clientHeight)
    this.camera = new THREE.PerspectiveCamera(70, aspect, 0.1, 160)

    // 2. WebGL Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" })
    this.renderer.setSize(container.clientWidth, container.clientHeight)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    container.appendChild(this.renderer.domElement)

    // 3. Lighting Setup
    const ambient = new THREE.AmbientLight(0xffffff, 1.3)
    this.scene.add(ambient)

    const sun = new THREE.DirectionalLight(0xfff7ed, 1.8)
    sun.position.set(20, 40, 20)
    sun.castShadow = true
    sun.shadow.mapSize.width = 512
    sun.shadow.mapSize.height = 512
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
    })
    this.blockMeshes.clear()
    this.solidBoxes = []
    this.lastTargetId = null
    this.targetedBlockCoord = null
    this.wireframeBox.visible = false

    // Clear active particles and floating texts
    this.particles.forEach(p => {
      this.scene.remove(p.mesh)
      p.mesh.geometry.dispose()
      ;(p.mesh.material as THREE.Material).dispose()
    })
    this.particles = []

    this.floatingTexts.forEach(ft => {
      this.scene.remove(ft.sprite)
      ft.sprite.material.dispose()
      ft.texture.dispose()
    })
    this.floatingTexts = []

    // Set spawn point exactly on top of floor
    this.playerPos.set(world.playerSpawn[0], world.playerSpawn[1], world.playerSpawn[2])
    this.playerVel.set(0, 0, 0)
    this.isGrounded = true

    const lookTarget = new THREE.Vector3(world.cameraLookAt[0], world.cameraLookAt[1], world.cameraLookAt[2])
    const dir = new THREE.Vector3().subVectors(lookTarget, this.playerPos).normalize()
    this.yaw = Math.atan2(-dir.x, -dir.z)
    this.pitch = Math.asin(dir.y)

    // Build Voxel Mesh Blocks using shared BoxGeometry
    const boxGeo = new THREE.BoxGeometry(1, 1, 1)

    world.blocks.forEach(block => {
      if (block.type === "air") return

      const mat = this.materialCache.get(block.type) || new THREE.MeshStandardMaterial({ color: 0x6b7280 })
      const mesh = new THREE.Mesh(boxGeo, mat)
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

      const targetId = interactive ? interactive.id : `block-${coord.x}-${coord.y}-${coord.z}`

      // ONLY dispatch React state update when the targeted ID actually changes!
      if (targetId !== this.lastTargetId) {
        this.lastTargetId = targetId
        if (interactive) {
          this.callbacks.onTargetChange(interactive)
        } else {
          this.callbacks.onTargetChange({
            id: targetId,
            name: coord.label || `${coord.type.replace("_", " ").toUpperCase()}`,
            oddsDesc: "Voxel Material Block",
            expectedValue: 1.0,
          })
        }
      }
    } else {
      this.targetedBlockCoord = null
      this.wireframeBox.visible = false
      if (this.lastTargetId !== null) {
        this.lastTargetId = null
        this.callbacks.onTargetChange(null)
      }
    }
  }

  public interactCurrentTarget() {
    if (this.targetedBlockCoord) {
      probAudio.playMine()
      this.spawnDebris(
        new THREE.Vector3(this.targetedBlockCoord.x, this.targetedBlockCoord.y, this.targetedBlockCoord.z),
        this.targetedBlockCoord.type
      )
      this.callbacks.onBlockMine(this.targetedBlockCoord)
    }
  }

  public spawnDebris(pos: THREE.Vector3, type: VoxelBlockType) {
    const colorHex = BLOCK_COLOR_HEX[type] || 0x6b7280
    const miniGeo = new THREE.BoxGeometry(0.12, 0.12, 0.12)
    const count = 12

    for (let i = 0; i < count; i++) {
      const mat = new THREE.MeshBasicMaterial({ color: colorHex })
      const mesh = new THREE.Mesh(miniGeo, mat)
      mesh.position.set(
        pos.x + (Math.random() - 0.5) * 0.5,
        pos.y + (Math.random() - 0.5) * 0.5,
        pos.z + (Math.random() - 0.5) * 0.5
      )
      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 3.6,
        Math.random() * 3.2 + 1.2,
        (Math.random() - 0.5) * 3.6
      )
      this.scene.add(mesh)
      this.particles.push({
        mesh,
        vel,
        life: 0,
        maxLife: 0.6 + Math.random() * 0.25,
      })
    }
  }

  public spawnFloatingNotice(text: string, pos: [number, number, number], color = "#D97757") {
    const canvas = document.createElement("canvas")
    canvas.width = 512
    canvas.height = 128
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Warm Claude dark card background
    ctx.fillStyle = "rgba(24, 23, 22, 0.88)"
    if (typeof ctx.roundRect === "function") {
      ctx.roundRect(16, 20, 480, 88, 10)
    } else {
      ctx.rect(16, 20, 480, 88)
    }
    ctx.fill()
    ctx.lineWidth = 2
    ctx.strokeStyle = "rgba(240, 238, 233, 0.22)"
    ctx.stroke()

    // Clean, crisp typography
    ctx.font = "600 22px -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif"
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.fillStyle = "#FAF9F5"
    ctx.fillText(text, 256, 64)

    const texture = new THREE.CanvasTexture(canvas)
    texture.magFilter = THREE.LinearFilter
    texture.minFilter = THREE.LinearFilter

    const material = new THREE.SpriteMaterial({ map: texture, transparent: true, opacity: 1.0 })
    const sprite = new THREE.Sprite(material)
    sprite.position.set(pos[0], pos[1] + 1.0, pos[2])
    sprite.scale.set(2.6, 0.65, 1)

    this.scene.add(sprite)
    this.floatingTexts.push({
      sprite,
      velY: 0.6,
      life: 0,
      maxLife: 1.4,
      texture,
    })
  }

  // Player Controls & Event Handlers
  public setVirtualControls(ctrl: { forward?: boolean; backward?: boolean; left?: boolean; right?: boolean; jump?: boolean }) {
    if (ctrl.forward !== undefined) this.keys["KeyW"] = ctrl.forward
    if (ctrl.backward !== undefined) this.keys["KeyS"] = ctrl.backward
    if (ctrl.left !== undefined) this.keys["KeyA"] = ctrl.left
    if (ctrl.right !== undefined) this.keys["KeyD"] = ctrl.right
    if (ctrl.jump && this.isGrounded) {
      this.playerVel.y = 7.5
      this.isGrounded = false
      probAudio.playStep()
    }
  }

  private onKeyDown = (e: KeyboardEvent) => {
    // If typing in an input, textarea or content-editable, do not trigger game hotkeys
    const target = e.target as HTMLElement | null
    if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) {
      return
    }

    // Do not interfere with browser / OS shortcuts (e.g. ⌘K, ⌘C, ⌘M, ⌘R)
    if (e.metaKey || e.ctrlKey) {
      return
    }

    this.keys[e.code] = true

    if (e.code === "Space" && this.isGrounded) {
      this.playerVel.y = 7.5 // Jump impulse
      this.isGrounded = false
      probAudio.playStep()
    }

    if (e.code === "KeyE") {
      this.interactCurrentTarget()
    }

    if (e.code === "KeyH") {
      this.callbacks.onToggleHud?.()
    }

    if (e.code === "KeyK" || (e.shiftKey && e.code === "Slash")) {
      this.callbacks.onToggleKeybindings?.()
    }

    if (e.code === "KeyJ") {
      this.callbacks.onToggleJournal?.()
    }

    if (e.code === "KeyC") {
      this.callbacks.onToggleCodex?.()
    }

    if (e.code === "KeyM") {
      this.callbacks.onToggleSound?.()
    }

    // Hotbar slots 1-4
    if (e.code >= "Digit1" && e.code <= "Digit4" && !e.altKey) {
      const slot = parseInt(e.code.replace("Digit", ""), 10) - 1
      this.callbacks.onSelectHotbarSlot?.(slot)
      return
    }

    // Alt + 1-8: Instant World Teleportation
    if (e.altKey && e.code >= "Digit1" && e.code <= "Digit8") {
      const worldNum = parseInt(e.code.replace("Digit", ""), 10)
      this.callbacks.onTeleportWorld?.(worldNum)
      return
    }

    // Digits 5-8 without Alt can also teleport directly
    if (e.code >= "Digit5" && e.code <= "Digit8") {
      const worldNum = parseInt(e.code.replace("Digit", ""), 10)
      this.callbacks.onTeleportWorld?.(worldNum)
      return
    }

    if (e.code === "BracketLeft") {
      this.callbacks.onTeleportWorld?.(Math.max(1, this.currentWorld.worldNumber - 1))
    }

    if (e.code === "BracketRight") {
      this.callbacks.onTeleportWorld?.(Math.min(8, this.currentWorld.worldNumber + 1))
    }
  }

  private onKeyUp = (e: KeyboardEvent) => {
    this.keys[e.code] = false
  }

  private isDragging = false
  private dragStartX = 0
  private dragStartY = 0

  private onMouseMove = (e: MouseEvent) => {
    const isLocked = document.pointerLockElement === this.renderer.domElement
    if (isLocked) {
      // Clamp sudden spikes (e.g. browser recentering during lock activation)
      if (Math.abs(e.movementX) > 100 || Math.abs(e.movementY) > 100) return
      const sensitivity = 0.0022
      this.yaw -= e.movementX * sensitivity
      this.pitch -= e.movementY * sensitivity
      const maxPitch = (85 * Math.PI) / 180
      this.pitch = Math.max(-maxPitch, Math.min(maxPitch, this.pitch))
    } else if (this.isDragging) {
      const dx = e.clientX - this.dragStartX
      const dy = e.clientY - this.dragStartY
      this.dragStartX = e.clientX
      this.dragStartY = e.clientY

      if (Math.abs(dx) > 100 || Math.abs(dy) > 100) return
      const sensitivity = 0.003
      this.yaw -= dx * sensitivity
      this.pitch -= dy * sensitivity
      const maxPitch = (85 * Math.PI) / 180
      this.pitch = Math.max(-maxPitch, Math.min(maxPitch, this.pitch))
    }
  }

  private onMouseDown = (e: MouseEvent) => {
    if (e.button === 0) {
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

      if (Math.abs(dx) > 100 || Math.abs(dy) > 100) return
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

  private onPointerLockChange = () => {
    this.isDragging = false
  }

  private bindEvents() {
    window.addEventListener("keydown", this.onKeyDown)
    window.addEventListener("keyup", this.onKeyUp)
    window.addEventListener("mousemove", this.onMouseMove)
    this.renderer.domElement.addEventListener("mousedown", this.onMouseDown)
    window.addEventListener("mouseup", this.onMouseUp)
    document.addEventListener("pointerlockchange", this.onPointerLockChange)

    this.renderer.domElement.addEventListener("touchstart", this.onTouchStart, { passive: true })
    this.renderer.domElement.addEventListener("touchmove", this.onTouchMove, { passive: true })

    this.resizeObserver = new ResizeObserver(this.onResize)
    this.resizeObserver.observe(this.container)
  }

  // Physics Update with Sequential 3-Axis Collision Resolution (Zero Clipping & Zero Jitter)
  private lastTime = 0
  private updatePhysics(delta: number) {
    const isSprinting = this.keys["ShiftLeft"] || this.keys["ShiftRight"]
    const moveSpeed = isSprinting ? 9.5 : 6.5
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

      // Footstep audio cadence (faster when sprinting)
      this.stepAccumulator += delta
      const stepInterval = isSprinting ? 0.24 : 0.36
      if (this.stepAccumulator > stepInterval && this.isGrounded) {
        probAudio.playStep()
        this.stepAccumulator = 0
      }
    } else {
      this.playerVel.x *= 0.5
      this.playerVel.z *= 0.5
    }

    // Vertical Velocity & Gravity
    if (this.isGrounded) {
      if (this.playerVel.y < 0) {
        this.playerVel.y = 0
      }
    } else {
      const gravity = -20.0
      this.playerVel.y += gravity * delta
      this.playerVel.y = Math.max(-25.0, this.playerVel.y) // Terminal velocity clamp
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Sequential 3-Axis AABB Collision Resolution with Spatial Filtering
    // ──────────────────────────────────────────────────────────────────────────

    // 1. Resolve X Axis
    let nextX = this.playerPos.x + this.playerVel.x * delta
    if (Math.abs(this.playerVel.x) > 0.0001) {
      const boxX = new THREE.Box3(
        new THREE.Vector3(nextX - 0.28, this.playerPos.y - 1.55, this.playerPos.z - 0.28),
        new THREE.Vector3(nextX + 0.28, this.playerPos.y + 0.15, this.playerPos.z + 0.28)
      )
      for (let i = 0; i < this.solidBoxes.length; i++) {
        const block = this.solidBoxes[i]
        if (Math.abs(block.min.x - this.playerPos.x) > 1.8 || Math.abs(block.min.z - this.playerPos.z) > 1.8) continue
        if (boxX.intersectsBox(block)) {
          if (this.playerVel.x > 0) {
            nextX = block.min.x - 0.281
          } else if (this.playerVel.x < 0) {
            nextX = block.max.x + 0.281
          }
          this.playerVel.x = 0
          break
        }
      }
    }
    this.playerPos.x = nextX

    // 2. Resolve Z Axis
    let nextZ = this.playerPos.z + this.playerVel.z * delta
    if (Math.abs(this.playerVel.z) > 0.0001) {
      const boxZ = new THREE.Box3(
        new THREE.Vector3(this.playerPos.x - 0.28, this.playerPos.y - 1.55, nextZ - 0.28),
        new THREE.Vector3(this.playerPos.x + 0.28, this.playerPos.y + 0.15, nextZ + 0.28)
      )
      for (let i = 0; i < this.solidBoxes.length; i++) {
        const block = this.solidBoxes[i]
        if (Math.abs(block.min.x - this.playerPos.x) > 1.8 || Math.abs(block.min.z - this.playerPos.z) > 1.8) continue
        if (boxZ.intersectsBox(block)) {
          if (this.playerVel.z > 0) {
            nextZ = block.min.z - 0.281
          } else if (this.playerVel.z < 0) {
            nextZ = block.max.z + 0.281
          }
          this.playerVel.z = 0
          break
        }
      }
    }
    this.playerPos.z = nextZ

    // 3. Resolve Y Axis (Vertical & Ground Check)
    let nextY = this.playerPos.y + this.playerVel.y * delta
    let landed = false

    const boxY = new THREE.Box3(
      new THREE.Vector3(this.playerPos.x - 0.28, nextY - 1.6, this.playerPos.z - 0.28),
      new THREE.Vector3(this.playerPos.x + 0.28, nextY + 0.18, this.playerPos.z + 0.28)
    )

    for (let i = 0; i < this.solidBoxes.length; i++) {
      const block = this.solidBoxes[i]
      if (Math.abs(block.min.x - this.playerPos.x) > 1.8 || Math.abs(block.min.z - this.playerPos.z) > 1.8) continue
      if (boxY.intersectsBox(block)) {
        if (this.playerVel.y <= 0) {
          // Landing on top of block
          nextY = block.max.y + 1.6
          this.playerVel.y = 0
          landed = true
          break
        } else {
          // Bonking head on ceiling
          nextY = block.min.y - 0.19
          this.playerVel.y = 0
          break
        }
      }
    }

    // Downward floor probe for continuous contact stability
    if (!landed && this.playerVel.y <= 0) {
      const feetProbe = new THREE.Box3(
        new THREE.Vector3(this.playerPos.x - 0.26, nextY - 1.68, this.playerPos.z - 0.26),
        new THREE.Vector3(this.playerPos.x + 0.26, nextY - 1.55, this.playerPos.z + 0.26)
      )
      for (let i = 0; i < this.solidBoxes.length; i++) {
        const block = this.solidBoxes[i]
        if (Math.abs(block.min.x - this.playerPos.x) > 1.8 || Math.abs(block.min.z - this.playerPos.z) > 1.8) continue
        if (feetProbe.intersectsBox(block)) {
          nextY = block.max.y + 1.6
          this.playerVel.y = 0
          landed = true
          break
        }
      }
    }

    this.isGrounded = landed
    this.playerPos.y = nextY

    // Fall into void safety reset: smoothly teleport back to spawn
    if (this.playerPos.y < -12) {
      this.playerPos.set(
        this.currentWorld.playerSpawn[0],
        this.currentWorld.playerSpawn[1],
        this.currentWorld.playerSpawn[2]
      )
      this.playerVel.set(0, 0, 0)
      this.isGrounded = true
      probAudio.playPortal()
    }

    // Camera update (head position at playerPos)
    this.camera.position.copy(this.playerPos)
    const euler = new THREE.Euler(this.pitch, this.yaw, 0, "YXZ")
    this.camera.quaternion.setFromEuler(euler)

    this.callbacks.onPlayerMove?.([this.playerPos.x, this.playerPos.y, this.playerPos.z])
  }

  private animate = () => {
    const now = performance.now()
    const delta = Math.min((now - this.lastTime) / 1000, 0.05) // clamp delta to 50ms to prevent tunneling
    this.lastTime = now

    this.updatePhysics(delta)
    this.checkTarget()

    // Update debris particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i]
      p.life += delta
      if (p.life >= p.maxLife) {
        this.scene.remove(p.mesh)
        p.mesh.geometry.dispose()
        ;(p.mesh.material as THREE.Material).dispose()
        this.particles.splice(i, 1)
      } else {
        p.vel.y -= 14 * delta
        p.mesh.position.addScaledVector(p.vel, delta)
        const scale = Math.max(0.01, 1 - p.life / p.maxLife)
        p.mesh.scale.set(scale, scale, scale)
      }
    }

    // Update floating text billboards
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i]
      ft.life += delta
      if (ft.life >= ft.maxLife) {
        this.scene.remove(ft.sprite)
        ft.sprite.material.dispose()
        ft.texture.dispose()
        this.floatingTexts.splice(i, 1)
      } else {
        ft.sprite.position.y += ft.velY * delta
        ft.sprite.material.opacity = Math.max(0, 1 - ft.life / ft.maxLife)
      }
    }

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
    document.removeEventListener("pointerlockchange", this.onPointerLockChange)
    this.renderer.domElement.removeEventListener("touchstart", this.onTouchStart)
    this.renderer.domElement.removeEventListener("touchmove", this.onTouchMove)

    this.resizeObserver?.disconnect()

    this.particles.forEach(p => {
      this.scene.remove(p.mesh)
      p.mesh.geometry.dispose()
      ;(p.mesh.material as THREE.Material).dispose()
    })
    this.particles = []

    this.floatingTexts.forEach(ft => {
      this.scene.remove(ft.sprite)
      ft.sprite.material.dispose()
      ft.texture.dispose()
    })
    this.floatingTexts = []

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
