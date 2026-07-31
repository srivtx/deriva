// Subway Switch Runner makes graph cycles tangible: the player runs first
// without memory, gets trapped by a loop, then repeats with visited stamps.

export type SubwayStationId = "HUB" | "PARK" | "MUSEUM" | "LOOP" | "TERMINAL"

export type SubwayChoice = {
  id: string
  label: string
  target: SubwayStationId | "DEAD"
  outcome: "advance" | "cycle" | "dead" | "finish"
  safe: boolean
}

export type SubwayStation = {
  id: SubwayStationId
  title: string
  prompt: string
  choices: SubwayChoice[]
}

export const SUBWAY_SWITCH_RUNNER = {
  id: "subway-switch-runner",
  title: "Subway Switch Runner",
  concept: "Visited Sets and Cycles",
  description: "Switch tracks through a looping subway, then learn why graph searches remember where they have been.",
  stations: {
    HUB: {
      id: "HUB",
      title: "Central Hub",
      prompt: "Three tracks leave Central Hub. Which switch keeps the run moving toward the terminal?",
      choices: [
        { id: "red", label: "Red line → Park", target: "PARK", outcome: "advance", safe: true },
        { id: "blue", label: "Blue loop → Loop Station", target: "LOOP", outcome: "cycle", safe: false },
        { id: "green", label: "Green service → Closed platform", target: "DEAD", outcome: "dead", safe: false },
      ],
    },
    PARK: {
      id: "PARK",
      title: "Park Station",
      prompt: "Park Station has one forward line and two tempting shortcuts. Predict the safe switch.",
      choices: [
        { id: "left", label: "Left line → Museum", target: "MUSEUM", outcome: "advance", safe: true },
        { id: "return", label: "Return line → Central Hub", target: "HUB", outcome: "cycle", safe: false },
        { id: "yard", label: "Yard line → Closed platform", target: "DEAD", outcome: "dead", safe: false },
      ],
    },
    MUSEUM: {
      id: "MUSEUM",
      title: "Museum Station",
      prompt: "The terminal is close. Which track reaches it without reopening an old station?",
      choices: [
        { id: "express", label: "Express line → Terminal", target: "TERMINAL", outcome: "finish", safe: true },
        { id: "local", label: "Local line → Park", target: "PARK", outcome: "cycle", safe: false },
        { id: "maintenance", label: "Maintenance line → Closed platform", target: "DEAD", outcome: "dead", safe: false },
      ],
    },
    LOOP: {
      id: "LOOP",
      title: "Loop Station",
      prompt: "This station looks familiar. Which switch should a search avoid when it has already seen the hub?",
      choices: [
        { id: "round", label: "Round line → Central Hub", target: "HUB", outcome: "cycle", safe: false },
        { id: "service", label: "Service line → Park", target: "PARK", outcome: "cycle", safe: false },
        { id: "end", label: "End line → Closed platform", target: "DEAD", outcome: "dead", safe: false },
      ],
    },
    TERMINAL: {
      id: "TERMINAL",
      title: "North Terminal",
      prompt: "The route is complete.",
      choices: [],
    },
  } satisfies Record<SubwayStationId, SubwayStation>,
}
