// App transition engine — layered open/close motion built on the Web
// Animations API. Works on every device without viewport snapshots.

const EASE = "cubic-bezier(.2, 0, 0, 1)"

export function playIconPress(origin: Element | null | undefined) {
  origin?.animate(
    [
      { transform: "scale(1)" },
      { transform: "scale(.88)", opacity: 0.75 },
      { transform: "scale(1.1)", opacity: 1 },
    ],
    { duration: 240, easing: EASE },
  )
}

export function playContentOut(content: Element | null) {
  content?.animate(
    [
      { opacity: 1, transform: "none" },
      { opacity: 0, transform: "translateY(10px) scale(.988)" },
    ],
    { duration: 150, easing: "ease-out", fill: "forwards" },
  )
}

export function playContentIn(content: Element | null) {
  const animation = content?.animate(
    [
      { opacity: 0, transform: "translateY(12px) scale(.995)" },
      { opacity: 1, transform: "none" },
    ],
    { duration: 260, easing: EASE },
  )
  animation?.finished.catch(() => {})
}

export function clearContentAnimations(content: Element | null) {
  content?.getAnimations().forEach(animation => animation.cancel())
}

export function navigateWithAppTransition(navigate: () => void, origin?: Element | null) {  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    navigate()
    return
  }
  const content = document.querySelector(".app-content")
  playIconPress(origin)
  playContentOut(content)
  window.setTimeout(navigate, 140)
}
