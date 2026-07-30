export interface Problem {
  id: number; stage: number; title: string; pattern: string; skill: string
  statement: string; examples: { input: string; output: string; explain?: string }[]
  why: string; starterCode: string; hints: string[]; solution: string; walkthrough: string; testCode: string
}

export const STAGES_LLD = [
  { id: 0, name: "Entity Reflex", desc: "nouns become classes" },
  { id: 1, name: "Responsibility", desc: "who owns the behavior" },
  { id: 2, name: "Relationships", desc: "has-a vs is-a" },
  { id: 3, name: "State Machines", desc: "objects move between states" },
  { id: 4, name: "Naive (God Class)", desc: "one class does everything" },
  { id: 5, name: "Patterns", desc: "strategy, factory, observer" },
  { id: 6, name: "Mastery", desc: "full object-oriented designs" },
]

export const PROBLEMS_LLD: Problem[] = [
  // ══ STAGE 0 — Entity Reflex ══
  {
    id: 1, stage: 0, title: "Parking Spot Entity", pattern: "entity-modeling", skill: "noun → class with fields",
    statement: "Design the ParkingSpot entity for a parking lot system. Fields: spot_id, floor, spot_type (bike/car/truck), is_occupied. Implement the class with a constructor and __repr__.",
    examples: [
      { input: "ParkingSpot('A1', 1, 'car')", output: "ParkingSpot(A1, floor=1, car, free)", explain: "new spots start unoccupied" },
    ],
    why: "Every LLD interview starts the same way: 'What are the entities?' Nouns in the problem statement become classes. This is the reflex — spot the noun, write the class.",
    starterCode: "class ParkingSpot:\n    def __init__(self, spot_id, floor, spot_type):\n        pass",
    hints: [
      "Store the three constructor args as instance attributes.",
      "is_occupied starts False — a new spot is empty.",
      "__repr__ returns a readable string: f'ParkingSpot({id}, floor={f}, {type}, {status})'",
    ],
    solution: "class ParkingSpot:\n    def __init__(self, spot_id, floor, spot_type):\n        self.spot_id = spot_id\n        self.floor = floor\n        self.spot_type = spot_type\n        self.is_occupied = False\n\n    def __repr__(self):\n        status = 'occupied' if self.is_occupied else 'free'\n        return f'ParkingSpot({self.spot_id}, floor={self.floor}, {self.spot_type}, {status})'",
    walkthrough: "Nouns → classes, adjectives → fields, states → booleans or enums. 'A spot has an id, lives on a floor, has a type, and is either occupied or free' — that sentence IS the class. is_occupied defaults False because construction means 'added to the lot', not 'a car is in it'.",
    testCode: "s = ParkingSpot('A1', 1, 'car')\nassert s.spot_id == 'A1'\nassert s.floor == 1\nassert s.spot_type == 'car'\nassert s.is_occupied == False\ns2 = ParkingSpot('B3', 2, 'bike')\nassert s2.is_occupied == False\nprint('All tests passed!')"
  },
  {
    id: 2, stage: 0, title: "Vehicle Entity Hierarchy", pattern: "entity-modeling", skill: "shared base class",
    statement: "Vehicles in our parking system: Bike, Car, Truck. All have license_plate and vehicle_type. Implement a Vehicle base class and three subclasses.",
    examples: [
      { input: "Car('KA01AB1234')", output: "vehicle_type == 'car'", explain: "subclass sets its own type" },
    ],
    why: "When entities share fields AND differ in kind, that's an inheritance signal. Bike/Car/Truck ARE vehicles (is-a) → subclass. This is the second entity reflex: same-noun-family → shared base.",
    starterCode: "class Vehicle:\n    def __init__(self, license_plate, vehicle_type):\n        pass\n\nclass Bike(Vehicle):\n    pass\n\nclass Car(Vehicle):\n    pass\n\nclass Truck(Vehicle):\n    pass",
    hints: [
      "Vehicle.__init__ stores license_plate and vehicle_type.",
      "Each subclass calls super().__init__(plate, 'bike'|'car'|'truck').",
      "Subclass __init__ takes ONLY license_plate — the type is hardcoded.",
    ],
    solution: "class Vehicle:\n    def __init__(self, license_plate, vehicle_type):\n        self.license_plate = license_plate\n        self.vehicle_type = vehicle_type\n\nclass Bike(Vehicle):\n    def __init__(self, license_plate):\n        super().__init__(license_plate, 'bike')\n\nclass Car(Vehicle):\n    def __init__(self, license_plate):\n        super().__init__(license_plate, 'car')\n\nclass Truck(Vehicle):\n    def __init__(self, license_plate):\n        super().__init__(license_plate, 'truck')",
    walkthrough: "Is-a → inheritance. A Car IS a Vehicle, so Car inherits. The subclass's only job: fix the vehicle_type. Callers write Car('KA01') not Vehicle('KA01', 'car') — the type can't be wrong. That's the entire point of the hierarchy: making wrong states unrepresentable.",
    testCode: "b = Bike('B1')\nassert b.license_plate == 'B1' and b.vehicle_type == 'bike'\nc = Car('C1')\nassert c.vehicle_type == 'car'\nt = Truck('T1')\nassert t.vehicle_type == 'truck'\nassert isinstance(c, Vehicle)\nprint('All tests passed!')"
  },
  {
    id: 3, stage: 0, title: "Ticket Entity with Timestamp", pattern: "entity-modeling", skill: "events become entities too",
    statement: "When a vehicle enters, the lot issues a Ticket with: ticket_id, license_plate, spot_id, entry_time (use time.time()). Implement Ticket with a method hours_parked(now) returning hours since entry.",
    examples: [
      { input: "ticket at t=1000, hours_parked(t=4600)", output: "1.0", explain: "3600 seconds = 1 hour" },
    ],
    why: "Events are entities too. 'Vehicle entered at time T' is a noun (a TICKET) with data and behavior (duration calculation). Finding event-nouns separates good designers from field-collectors.",
    starterCode: "import time\n\nclass Ticket:\n    def __init__(self, ticket_id, license_plate, spot_id):\n        pass\n\n    def hours_parked(self, now):\n        pass",
    hints: [
      "Constructor stores args + entry_time = time.time().",
      "For testability, allow entry_time as optional 4th arg.",
      "hours_parked = (now - entry_time) / 3600.",
    ],
    solution: "import time\n\nclass Ticket:\n    def __init__(self, ticket_id, license_plate, spot_id, entry_time=None):\n        self.ticket_id = ticket_id\n        self.license_plate = license_plate\n        self.spot_id = spot_id\n        self.entry_time = entry_time if entry_time is not None else time.time()\n\n    def hours_parked(self, now):\n        return (now - self.entry_time) / 3600",
    walkthrough: "The Ticket captures an EVENT (entry) as an object. Note the testability trick: entry_time defaults to now but CAN be injected. Tests pass explicit times; production uses the clock. Dependency injection in its simplest form — you'll reuse this in every design.",
    testCode: "t = Ticket('TK1', 'KA01', 'A1', entry_time=1000)\nassert t.ticket_id == 'TK1'\nassert abs(t.hours_parked(4600) - 1.0) < 0.001\nassert abs(t.hours_parked(8200) - 2.0) < 0.001\nt2 = Ticket('TK2', 'KA02', 'A2')\nassert t2.entry_time > 0\nprint('All tests passed!')"
  },
  {
    id: 4, stage: 0, title: "Library Entities: Book vs BookCopy", pattern: "entity-modeling", skill: "concept vs physical instance",
    statement: "Design a library system: Book (isbn, title, author) and BookCopy (copy_id, book, status: available/issued). A library has ONE 'Clean Code' concept but FIVE physical copies. Implement both classes.",
    examples: [
      { input: "book = Book('978-1', 'Clean Code', 'Martin'); copy = BookCopy('C1', book)", output: "copy.status == 'available'", explain: "copies circulate, books describe" },
    ],
    why: "The classic modeling trap: Book (the abstract work) vs BookCopy (the physical item) are DIFFERENT entities. Conflate them and you can't track 5 copies of the same book. This distinction — concept vs instance — appears in every inventory system.",
    starterCode: "class Book:\n    def __init__(self, isbn, title, author):\n        pass\n\nclass BookCopy:\n    def __init__(self, copy_id, book):\n        pass",
    hints: [
      "Book is pure data: isbn, title, author.",
      "BookCopy holds copy_id, a REFERENCE to its Book, and status='available'.",
      "copy.book.title reaches the concept's data through the instance.",
    ],
    solution: "class Book:\n    def __init__(self, isbn, title, author):\n        self.isbn = isbn\n        self.title = title\n        self.author = author\n\nclass BookCopy:\n    def __init__(self, copy_id, book):\n        self.copy_id = copy_id\n        self.book = book\n        self.status = 'available'",
    walkthrough: "Book = concept (one per work). BookCopy = instance (many per Book). The copy HOLDS a reference to its book (composition — Stage 2 preview). Amazon does the same: Product vs Item-in-warehouse. Whenever 'many physical instances of one concept' appears, split the entity.",
    testCode: "b = Book('978-1', 'Clean Code', 'Martin')\nassert b.title == 'Clean Code'\nc1 = BookCopy('C1', b)\nc2 = BookCopy('C2', b)\nassert c1.status == 'available'\nassert c1.book is b\nassert c1.book.title == 'Clean Code'\nassert c1.book is c2.book\nprint('All tests passed!')"
  },
  {
    id: 5, stage: 0, title: "Elevator Entity", pattern: "entity-modeling", skill: "state + direction fields",
    statement: "Model an Elevator: id, current_floor (starts 0), direction ('up'/'down'/'idle'), is_door_open. Implement with a move_to(floor) method that updates current_floor and direction.",
    examples: [
      { input: "e.move_to(5) from floor 0", output: "current_floor=5, direction='up'", explain: "moving up sets direction" },
    ],
    why: "Physical devices are entities with STATE. Current floor, direction, door — these fields ARE the elevator's complete self-description. move_to changes state coherently (floor AND direction together) — methods keep related fields consistent.",
    starterCode: "class Elevator:\n    def __init__(self, eid):\n        pass\n\n    def move_to(self, floor):\n        pass",
    hints: [
      "Constructor: eid, current_floor=0, direction='idle', is_door_open=False.",
      "move_to: direction = 'up' if floor > current else 'down' (or 'idle' if same).",
      "Update current_floor AFTER computing direction.",
    ],
    solution: "class Elevator:\n    def __init__(self, eid):\n        self.eid = eid\n        self.current_floor = 0\n        self.direction = 'idle'\n        self.is_door_open = False\n\n    def move_to(self, floor):\n        if floor > self.current_floor:\n            self.direction = 'up'\n        elif floor < self.current_floor:\n            self.direction = 'down'\n        else:\n            self.direction = 'idle'\n        self.current_floor = floor",
    walkthrough: "The entity holds everything the real device knows: where it is, which way it's going, door state. move_to updates floor AND direction atomically — that pairing matters. Methods exist to keep related fields CONSISTENT. That's what separates a class from a dict.",
    testCode: "e = Elevator('E1')\nassert e.current_floor == 0 and e.direction == 'idle'\ne.move_to(5)\nassert e.current_floor == 5 and e.direction == 'up'\ne.move_to(2)\nassert e.current_floor == 2 and e.direction == 'down'\ne.move_to(2)\nassert e.direction == 'idle'\nprint('All tests passed!')"
  },

  // ══ STAGE 1 — Responsibility ══
  {
    id: 6, stage: 1, title: "Who Assigns the Spot?", pattern: "responsibility-driven", skill: "behavior lives with the data it needs",
    statement: "ParkingLot needs find_free_spot(vehicle_type) that scans its spots and returns the first free one of the right type. Implement ParkingLot holding a list of ParkingSpots (from P1) with this method.",
    examples: [
      { input: "lot with spots [A1(car,free), A2(car,occupied)]", output: "find_free_spot('car') → A1", explain: "first free matching spot" },
    ],
    why: "Responsibility question: who finds free spots? The ParkingLot — because it OWNS the spot collection. Behavior lives with the data it needs. This is RDD (responsibility-driven design), the core of LLD.",
    starterCode: "class ParkingLot:\n    def __init__(self, spots):\n        pass\n\n    def find_free_spot(self, vehicle_type):\n        pass",
    hints: [
      "ParkingLot.__init__ stores the spots list.",
      "find_free_spot iterates, returns first spot where spot_type matches AND not is_occupied.",
      "Return None if nothing found — absence is a valid answer.",
    ],
    solution: "class ParkingLot:\n    def __init__(self, spots):\n        self.spots = spots\n\n    def find_free_spot(self, vehicle_type):\n        for spot in self.spots:\n            if spot.spot_type == vehicle_type and not spot.is_occupied:\n                return spot\n        return None",
    walkthrough: "ParkingLot owns spots → ParkingLot answers 'which spot is free?'. The Vehicle shouldn't search (it doesn't know spots), the Spot shouldn't search (it knows only itself). Ask 'who has the data this behavior needs?' and the method's home becomes obvious.",
    testCode: "from copy import copy\ns1 = ParkingSpot('A1', 1, 'car')\ns2 = ParkingSpot('A2', 1, 'car')\ns2.is_occupied = True\ns3 = ParkingSpot('B1', 1, 'bike')\nlot = ParkingLot([s1, s2, s3])\nassert lot.find_free_spot('car') is s1\nassert lot.find_free_spot('bike') is s3\ns1.is_occupied = True\nassert lot.find_free_spot('car') is None\nprint('All tests passed!')"
  },
  {
    id: 7, stage: 1, title: "Who Calculates the Fee?", pattern: "responsibility-driven", skill: "pricing policy object",
    statement: "Implement FeeCalculator with calculate(hours, vehicle_type): bike ₹10/hr, car ₹20/hr, truck ₹40/hr, minimum 1 hour billed. The Ticket shouldn't know prices; the calculator owns pricing.",
    examples: [
      { input: "calculate(2.5, 'car')", output: "60", explain: "ceil(2.5)=3 hours × ₹20" },
    ],
    why: "Pricing changes (weekend rates, EV discounts). If Ticket calculates fees, every pricing change touches Ticket. A dedicated FeeCalculator owns the policy — change pricing without touching tickets. Single Responsibility in action.",
    starterCode: "import math\n\nclass FeeCalculator:\n    RATES = {'bike': 10, 'car': 20, 'truck': 40}\n\n    def calculate(self, hours, vehicle_type):\n        pass",
    hints: [
      "Bill whole hours: math.ceil(hours), minimum 1.",
      "Look up RATES[vehicle_type], multiply.",
      "Unknown vehicle type → raise ValueError.",
    ],
    solution: "import math\n\nclass FeeCalculator:\n    RATES = {'bike': 10, 'car': 20, 'truck': 40}\n\n    def calculate(self, hours, vehicle_type):\n        if vehicle_type not in self.RATES:\n            raise ValueError(f'Unknown vehicle type: {vehicle_type}')\n        billed = max(1, math.ceil(hours))\n        return billed * self.RATES[vehicle_type]",
    walkthrough: "FeeCalculator owns ONE thing: the pricing policy. RATES is a class-level table — adding 'ev' or weekend multipliers touches this class only. The test of good responsibility placement: 'what changes would touch this class?' If the answer is one kind of change, it's right.",
    testCode: "fc = FeeCalculator()\nassert fc.calculate(2.5, 'car') == 60\nassert fc.calculate(0.3, 'bike') == 10\nassert fc.calculate(1.0, 'truck') == 40\ntry:\n    fc.calculate(1, 'spaceship')\n    assert False\nexcept ValueError:\n    pass\nprint('All tests passed!')"
  },
  {
    id: 8, stage: 1, title: "Deck Owns the Cards", pattern: "responsibility-driven", skill: "collection owner manages invariants",
    statement: "For a card game: Deck holds 52 Cards (suit, rank). Implement Deck with shuffle() and deal_one() that raises if empty. Card is a simple data class.",
    examples: [
      { input: "deck = Deck(); deal 52 times", output: "53rd deal_one() raises RuntimeError", explain: "deck enforces its own invariant" },
    ],
    why: "Who prevents dealing from an empty deck? The Deck — it owns the cards and the invariant. Not the Player, not the Game. The collection owner protects its own consistency. That's encapsulation, stated concretely.",
    starterCode: "import random\n\nclass Card:\n    def __init__(self, suit, rank):\n        self.suit = suit\n        self.rank = rank\n\nclass Deck:\n    SUITS = ['hearts', 'diamonds', 'clubs', 'spades']\n    RANKS = ['A','2','3','4','5','6','7','8','9','10','J','Q','K']\n\n    def __init__(self):\n        pass\n\n    def shuffle(self):\n        pass\n\n    def deal_one(self):\n        pass",
    hints: [
      "Deck builds all 52 (suit, rank) combinations in __init__.",
      "shuffle: random.shuffle(self.cards).",
      "deal_one: raise RuntimeError if empty, else self.cards.pop().",
    ],
    solution: "import random\n\nclass Card:\n    def __init__(self, suit, rank):\n        self.suit = suit\n        self.rank = rank\n\nclass Deck:\n    SUITS = ['hearts', 'diamonds', 'clubs', 'spades']\n    RANKS = ['A','2','3','4','5','6','7','8','9','10','J','Q','K']\n\n    def __init__(self):\n        self.cards = [Card(s, r) for s in self.SUITS for r in self.RANKS]\n\n    def shuffle(self):\n        random.shuffle(self.cards)\n\n    def deal_one(self):\n        if not self.cards:\n            raise RuntimeError('Deck is empty')\n        return self.cards.pop()",
    walkthrough: "Deck owns the invariant 'you cannot deal from empty'. Any object holding a collection owns that collection's rules. Players ASK for cards; the Deck DECIDES if a deal is legal. Invariants live with the data they constrain — always.",
    testCode: "d = Deck()\nassert len(d.cards) == 52\nd.shuffle()\nassert len(d.cards) == 52\ndealt = [d.deal_one() for _ in range(52)]\nassert len(d.cards) == 0\ntry:\n    d.deal_one()\n    assert False\nexcept RuntimeError:\n    pass\nranks = {(c.suit, c.rank) for c in dealt}\nassert len(ranks) == 52\nprint('All tests passed!')"
  },
  {
    id: 9, stage: 1, title: "ATM: Who Holds the Cash?", pattern: "responsibility-driven", skill: "the machine owns the inventory",
    statement: "ATM holds cash inventory: {100: 10, 50: 10, 20: 10} (bill count by denomination). Implement dispense(amount) that greedily gives largest bills, deducts inventory, returns dict of bills — or raises if impossible.",
    examples: [
      { input: "dispense(180)", output: "{100: 1, 50: 1, 20: 1} (plus 10 remaining as unpayable → raises)", explain: "greedy largest-first" },
    ],
    why: "The ATM owns cash, so the ATM decides dispensation. Greedy largest-first is the standard algorithm (and its failure mode — 180 with no 10s — is why you raise instead of silently short-paying).",
    starterCode: "class ATM:\n    def __init__(self, inventory):\n        pass\n\n    def dispense(self, amount):\n        pass",
    hints: [
      "Sort denominations descending, try each: count = min(available, amount // denom).",
      "Track remaining amount. If remaining > 0 at the end → raise ValueError.",
      "Only deduct inventory AFTER confirming full dispense is possible (two passes or copy first).",
    ],
    solution: "class ATM:\n    def __init__(self, inventory):\n        self.inventory = dict(inventory)\n\n    def dispense(self, amount):\n        remaining = amount\n        plan = {}\n        for denom in sorted(self.inventory.keys(), reverse=True):\n            take = min(self.inventory[denom], remaining // denom)\n            if take:\n                plan[denom] = take\n                remaining -= take * denom\n        if remaining > 0:\n            raise ValueError(f'Cannot dispense {amount}')\n        for denom, count in plan.items():\n            self.inventory[denom] -= count\n        return plan",
    walkthrough: "Two phases: PLAN (simulate, no mutation) then COMMIT (deduct). This prevents half-dispensed failures — the ATM never gives partial money then discovers it can't finish. Plan-then-commit is a universal pattern: reserve first, act second.",
    testCode: "atm = ATM({100: 2, 50: 2, 20: 2})\nplan = atm.dispense(170)\nassert plan == {100: 1, 50: 1, 20: 1}\nassert atm.inventory == {100: 1, 50: 1, 20: 1}\ntry:\n    atm.dispense(1000)\n    assert False\nexcept ValueError:\n    pass\nassert atm.inventory == {100: 1, 50: 1, 20: 1}\nprint('All tests passed!')"
  },
  {
    id: 10, stage: 1, title: "ShoppingCart Owns Its Items", pattern: "responsibility-driven", skill: "add/remove/total in one place",
    statement: "ShoppingCart holds items {product_name: (price, qty)}. Implement add(name, price, qty), remove(name), total(). Adding an existing product increases qty.",
    examples: [
      { input: "add('apple', 30, 2); add('apple', 30, 1); total()", output: "90", explain: "qty merges, 3 × 30" },
    ],
    why: "Cart behavior (merge quantities, compute totals) lives with cart data. Sounds obvious — until you see production code with cart logic scattered across Order, Checkout, and Payment. Cohesion: everything about the cart IN the cart.",
    starterCode: "class ShoppingCart:\n    def __init__(self):\n        pass\n\n    def add(self, name, price, qty=1):\n        pass\n\n    def remove(self, name):\n        pass\n\n    def total(self):\n        pass",
    hints: [
      "items = {} in __init__. add: if name exists, add to qty; else new entry.",
      "remove: dict.pop(name, None) — silently ignore missing.",
      "total: sum(price * qty for all entries).",
    ],
    solution: "class ShoppingCart:\n    def __init__(self):\n        self.items = {}\n\n    def add(self, name, price, qty=1):\n        if name in self.items:\n            p, q = self.items[name]\n            self.items[name] = (p, q + qty)\n        else:\n            self.items[name] = (price, qty)\n\n    def remove(self, name):\n        self.items.pop(name, None)\n\n    def total(self):\n        return sum(p * q for p, q in self.items.values())",
    walkthrough: "All cart knowledge in one class: the merge rule (same product = more qty), the total rule (sum price×qty), the removal rule (missing = fine). When Checkout needs the total, it calls cart.total() — it never iterates items itself. Tell, don't ask.",
    testCode: "c = ShoppingCart()\nc.add('apple', 30, 2)\nc.add('apple', 30, 1)\nassert c.total() == 90\nc.add('milk', 50)\nassert c.total() == 140\nc.remove('apple')\nassert c.total() == 50\nc.remove('nonexistent')\nassert c.total() == 50\nprint('All tests passed!')"
  },

  // ══ STAGE 2 — Relationships ══
  {
    id: 11, stage: 2, title: "Is-A vs Has-A: The Car Question", pattern: "inheritance-vs-composition", skill: "choose by substitution",
    statement: "Model: Engine (horsepower, start()), Car (has engine, has 4 wheels, start() delegates to engine). Implement both. Why is Car NOT a subclass of Engine?",
    examples: [
      { input: "car = Car(Engine(150)); car.start()", output: "'Engine started (150hp)'", explain: "Car delegates to its engine" },
    ],
    why: "The substitution test: 'a Car IS an Engine' is absurd — a car HAS an engine. Has-a → composition. Is-a (and substitutable) → inheritance. Getting this wrong is the #1 junior LLD mistake.",
    starterCode: "class Engine:\n    def __init__(self, horsepower):\n        pass\n\n    def start(self):\n        pass\n\nclass Car:\n    def __init__(self, engine):\n        pass\n\n    def start(self):\n        pass",
    hints: [
      "Engine.start returns a string like 'Engine started (150hp)'.",
      "Car stores the engine passed in (composition).",
      "Car.start() returns self.engine.start() — delegation.",
    ],
    solution: "class Engine:\n    def __init__(self, horsepower):\n        self.horsepower = horsepower\n\n    def start(self):\n        return f'Engine started ({self.horsepower}hp)'\n\nclass Car:\n    def __init__(self, engine):\n        self.engine = engine\n        self.wheels = 4\n\n    def start(self):\n        return self.engine.start()",
    walkthrough: "Car HAS an Engine → Car takes engine as a constructor arg (composition). Car.start DELEGATES to engine.start — Car doesn't reimplement starting, it forwards. Bonus: swap ElectricEngine for Engine later without changing Car. Composition > inheritance, by default.",
    testCode: "e = Engine(150)\nassert e.start() == 'Engine started (150hp)'\ncar = Car(e)\nassert car.wheels == 4\nassert car.start() == 'Engine started (150hp)'\ne2 = Engine(400)\ncar2 = Car(e2)\nassert car2.start() == 'Engine started (400hp)'\nprint('All tests passed!')"
  },
  {
    id: 12, stage: 2, title: "University-Department-Professor", pattern: "aggregation-vs-composition", skill: "lifetime coupling",
    statement: "Model: Department has professors (aggregation — professors survive if department closes). University has departments (composition — departments die with university). Implement University with close() that deletes departments but NOT professors.",
    examples: [
      { input: "uni.close()", output: "departments gone, professor objects still exist", explain: "aggregation survives, composition doesn't" },
    ],
    why: "Composition = owns + lifetime-bound (university's departments). Aggregation = references + lifetime-free (department's professors). The question 'does the child die with the parent?' decides which. This precision impresses interviewers.",
    starterCode: "class Professor:\n    def __init__(self, name):\n        self.name = name\n\nclass Department:\n    def __init__(self, name):\n        self.name = name\n        self.professors = []\n\n    def add_professor(self, prof):\n        pass\n\nclass University:\n    def __init__(self, name):\n        self.name = name\n        self.departments = []\n\n    def add_department(self, dept):\n        pass\n\n    def close(self):\n        pass",
    hints: [
      "add_professor appends to dept.professors (aggregation: dept references, doesn't own).",
      "add_department appends to uni.departments (composition: uni owns).",
      "close(): self.departments.clear() — professors list elsewhere survives.",
    ],
    solution: "class Professor:\n    def __init__(self, name):\n        self.name = name\n\nclass Department:\n    def __init__(self, name):\n        self.name = name\n        self.professors = []\n\n    def add_professor(self, prof):\n        self.professors.append(prof)\n\nclass University:\n    def __init__(self, name):\n        self.name = name\n        self.departments = []\n\n    def add_department(self, dept):\n        self.departments.append(dept)\n\n    def close(self):\n        self.departments.clear()",
    walkthrough: "Professors are created OUTSIDE departments and merely referenced (aggregation). Departments are created FOR a university and cleared with it (composition). The test: 'if the parent dies, does the child make sense alone?' Professor: yes. Department-without-university: no.",
    testCode: "p1 = Professor('Dr. A')\ndept = Department('CS')\ndept.add_professor(p1)\nuni = University('MIT')\nuni.add_department(dept)\nassert len(uni.departments) == 1\nassert dept.professors[0] is p1\nuni.close()\nassert len(uni.departments) == 0\nassert p1.name == 'Dr. A'\nprint('All tests passed!')"
  },
  {
    id: 13, stage: 2, title: "Snake & Ladder Board", pattern: "composition-design", skill: "board has cells has jumps",
    statement: "Model a board game: Board has 100 cells; jumps is a dict {from: to} (snakes down, ladders up). Implement Board with next_position(pos, roll) that applies a dice roll then any jump.",
    examples: [
      { input: "pos=4, roll=3, ladder 7→30", output: "30", explain: "land on 7, ladder takes you to 30" },
    ],
    why: "The board OWNS the topology (cells + jumps). Dice don't know boards; players don't know jumps. next_position composes roll + jump in one place — the board answers 'where do you END UP', hiding the two-step logic.",
    starterCode: "class Board:\n    def __init__(self, jumps=None):\n        pass\n\n    def next_position(self, pos, roll):\n        pass",
    hints: [
      "jumps defaults to {}. size = 100.",
      "land = pos + roll. If land > 100, stay (classic rule) or clamp — clamp to 100 here.",
      "Return jumps.get(land, land) — apply jump if exists.",
    ],
    solution: "class Board:\n    def __init__(self, jumps=None):\n        self.size = 100\n        self.jumps = jumps or {}\n\n    def next_position(self, pos, roll):\n        land = min(pos + roll, self.size)\n        return self.jumps.get(land, land)",
    walkthrough: "Board.next_position hides the compound rule: move, then jump. Callers ask ONE question. The jumps dict models snakes AND ladders identically (a mapping from cell to cell) — the direction is just data. Good models collapse cases that look different into the same structure.",
    testCode: "b = Board({7: 30, 25: 5})\nassert b.next_position(4, 3) == 30\nassert b.next_position(23, 2) == 5\nassert b.next_position(0, 6) == 6\nassert b.next_position(98, 5) == 100\nb2 = Board()\nassert b2.next_position(10, 4) == 14\nprint('All tests passed!')"
  },
  {
    id: 14, stage: 2, title: "Order Has OrderItems (Not Products)", pattern: "composition-design", skill: "snapshot composition",
    statement: "Model e-commerce: Product (id, name, price) is the catalog. OrderItem (product, qty, price_at_purchase) freezes the price. Order holds items + total(). Implement all three.",
    examples: [
      { input: "product price changes AFTER order placed", output: "order total unchanged", explain: "snapshot protects history" },
    ],
    why: "Orders must not change when the catalog changes. OrderItem snapshots price_at_purchase — history is immutable. This is the invoice/receipt problem: compose with SNAPSHOTS, not live references, when the past must be frozen.",
    starterCode: "class Product:\n    def __init__(self, pid, name, price):\n        pass\n\nclass OrderItem:\n    def __init__(self, product, qty):\n        pass\n\nclass Order:\n    def __init__(self):\n        pass\n\n    def add_item(self, product, qty):\n        pass\n\n    def total(self):\n        pass",
    hints: [
      "OrderItem stores product REFERENCE but COPIES price into price_at_purchase.",
      "Order.add_item creates an OrderItem and appends.",
      "total: sum(item.price_at_purchase * item.qty).",
    ],
    solution: "class Product:\n    def __init__(self, pid, name, price):\n        self.pid = pid\n        self.name = name\n        self.price = price\n\nclass OrderItem:\n    def __init__(self, product, qty):\n        self.product = product\n        self.qty = qty\n        self.price_at_purchase = product.price\n\nclass Order:\n    def __init__(self):\n        self.items = []\n\n    def add_item(self, product, qty):\n        self.items.append(OrderItem(product, qty))\n\n    def total(self):\n        return sum(i.price_at_purchase * i.qty for i in self.items)",
    walkthrough: "OrderItem is the junction entity with a SNAPSHOT field. Product price rises tomorrow — yesterday's order still shows what the customer paid. Junction entities (OrderItem between Order and Product) carry context the two ends don't have: qty and historical price.",
    testCode: "p = Product('P1', 'Widget', 100)\no = Order()\no.add_item(p, 2)\nassert o.total() == 200\np.price = 150\nassert o.total() == 200\no.add_item(p, 1)\nassert o.total() == 350\nprint('All tests passed!')"
  },
  {
    id: 15, stage: 2, title: "Playlist: Composition Done Right", pattern: "composition-design", skill: "shared references, ordered collection",
    statement: "Model: Song (title, artist, duration_sec). Playlist (name, ordered list of song references — same song in many playlists). Implement Playlist with total_duration() and the constraint that deleting a Playlist never deletes Songs.",
    examples: [
      { input: "song in 2 playlists; delete one playlist", output: "song still exists in the other", explain: "shared references, independent lifetimes" },
    ],
    why: "Playlists reference songs; they don't own them. One song lives in many playlists — shared references with independent lifetimes. Aggregation again (P12's lesson), this time with ORDER mattering in the collection.",
    starterCode: "class Song:\n    def __init__(self, title, artist, duration_sec):\n        pass\n\nclass Playlist:\n    def __init__(self, name):\n        pass\n\n    def add_song(self, song):\n        pass\n\n    def total_duration(self):\n        pass",
    hints: [
      "Song: plain data class.",
      "Playlist.songs = [] — append references, don't copy.",
      "total_duration: sum(s.duration_sec for s in self.songs).",
    ],
    solution: "class Song:\n    def __init__(self, title, artist, duration_sec):\n        self.title = title\n        self.artist = artist\n        self.duration_sec = duration_sec\n\nclass Playlist:\n    def __init__(self, name):\n        self.name = name\n        self.songs = []\n\n    def add_song(self, song):\n        self.songs.append(song)\n\n    def total_duration(self):\n        return sum(s.duration_sec for s in self.songs)",
    walkthrough: "Playlist.add_song stores the REFERENCE. Two playlists share one Song object — edit the song's title and both playlists see it (correct! it IS the same song). Delete a playlist and the song lives on. Reference-sharing is a modeling decision, made deliberately.",
    testCode: "s1 = Song('X', 'Artist', 200)\ns2 = Song('Y', 'Artist', 180)\np1 = Playlist('Gym')\np2 = Playlist('Focus')\np1.add_song(s1); p1.add_song(s2)\np2.add_song(s1)\nassert p1.total_duration() == 380\nassert p2.total_duration() == 200\nassert p1.songs[0] is p2.songs[0]\ndel p1\nassert s1.title == 'X'\nprint('All tests passed!')"
  },

  // ══ STAGE 3 — State Machines ══
  {
    id: 16, stage: 3, title: "Order State Machine", pattern: "state-machine", skill: "legal transitions only",
    statement: "An e-commerce Order moves: PENDING → PAID → SHIPPED → DELIVERED, and PENDING/PAID → CANCELLED. Implement Order.transition(to) that allows ONLY legal transitions and raises on illegal ones.",
    examples: [
      { input: "PENDING → SHIPPED", output: "raises ValueError", explain: "must pay first" },
    ],
    why: "States + legal transitions = a state machine. Encoding transitions in one place (a TRANSITIONS map) makes illegal states unrepresentable. Scattered if-checks across the codebase = bugs; a transition table = proof.",
    starterCode: "class Order:\n    TRANSITIONS = {\n        'PENDING': ['PAID', 'CANCELLED'],\n        'PAID': ['SHIPPED', 'CANCELLED'],\n        'SHIPPED': ['DELIVERED'],\n        'DELIVERED': [],\n        'CANCELLED': [],\n    }\n\n    def __init__(self, oid):\n        pass\n\n    def transition(self, to):\n        pass",
    hints: [
      "State starts 'PENDING'.",
      "transition: if `to` not in TRANSITIONS[self.state] → raise ValueError.",
      "Else self.state = to. Terminal states (empty list) accept nothing.",
    ],
    solution: "class Order:\n    TRANSITIONS = {\n        'PENDING': ['PAID', 'CANCELLED'],\n        'PAID': ['SHIPPED', 'CANCELLED'],\n        'SHIPPED': ['DELIVERED'],\n        'DELIVERED': [],\n        'CANCELLED': [],\n    }\n\n    def __init__(self, oid):\n        self.oid = oid\n        self.state = 'PENDING'\n\n    def transition(self, to):\n        if to not in self.TRANSITIONS[self.state]:\n            raise ValueError(f'Illegal transition: {self.state} → {to}')\n        self.state = to",
    walkthrough: "The TRANSITIONS table IS the business rule, declaratively. 'Can a shipped order be cancelled?' — read the table, don't grep the codebase. When the business adds REFUNDED, you add one line to one table. State machines make rules visible.",
    testCode: "o = Order('O1')\nassert o.state == 'PENDING'\no.transition('PAID')\nassert o.state == 'PAID'\no.transition('SHIPPED')\no.transition('DELIVERED')\nassert o.state == 'DELIVERED'\ntry:\n    o.transition('PENDING')\n    assert False\nexcept ValueError:\n    pass\no2 = Order('O2')\ntry:\n    o2.transition('SHIPPED')\n    assert False\nexcept ValueError:\n    pass\nprint('All tests passed!')"
  },
  {
    id: 17, stage: 3, title: "Vending Machine States", pattern: "state-machine", skill: "behavior depends on state",
    statement: "Vending machine: IDLE → (insert coin) → HAS_MONEY → (select) → DISPENSING → IDLE. Implement insert_coin(amount), select(item), and the state guard: select() in IDLE raises; insert_coin in DISPENSING raises.",
    examples: [
      { input: "select() before any coin", output: "raises RuntimeError('No money inserted')", explain: "state guards the action" },
    ],
    why: "Same method, different behavior per state — that's the state pattern's calling card. insert_coin is legal in two states, select in one, dispense in one. Guards encode 'when is this action allowed' explicitly.",
    starterCode: "class VendingMachine:\n    def __init__(self, price):\n        pass\n\n    def insert_coin(self, amount):\n        pass\n\n    def select(self):\n        pass\n\n    def dispense(self):\n        pass",
    hints: [
      "States: 'IDLE', 'HAS_MONEY', 'DISPENSING'. Track balance.",
      "insert_coin: allowed in IDLE or HAS_MONEY; adds to balance; state → HAS_MONEY.",
      "select: only in HAS_MONEY and balance >= price; → DISPENSING. dispense: only in DISPENSING → reset to IDLE, return item.",
    ],
    solution: "class VendingMachine:\n    def __init__(self, price):\n        self.price = price\n        self.state = 'IDLE'\n        self.balance = 0\n\n    def insert_coin(self, amount):\n        if self.state == 'DISPENSING':\n            raise RuntimeError('Busy dispensing')\n        self.balance += amount\n        self.state = 'HAS_MONEY'\n\n    def select(self):\n        if self.state != 'HAS_MONEY':\n            raise RuntimeError('No money inserted')\n        if self.balance < self.price:\n            raise RuntimeError('Insufficient balance')\n        self.state = 'DISPENSING'\n\n    def dispense(self):\n        if self.state != 'DISPENSING':\n            raise RuntimeError('Nothing selected')\n        change = self.balance - self.price\n        self.balance = 0\n        self.state = 'IDLE'\n        return ('item', change)",
    walkthrough: "Every public method first checks state — the guards ARE the design. IDLE refuses select; DISPENSING refuses coins. This is how real hardware controllers are written, and why state machines beat boolean soup (has_money=True, is_dispensing=False... what do the 4 combinations mean?).",
    testCode: "v = VendingMachine(15)\ntry:\n    v.select()\n    assert False\nexcept RuntimeError:\n    pass\nv.insert_coin(10)\nassert v.state == 'HAS_MONEY'\nv.insert_coin(10)\nitem, change = None, None\nv.select()\nassert v.state == 'DISPENSING'\nitem, change = v.dispense()\nassert change == 5\nassert v.state == 'IDLE'\nprint('All tests passed!')"
  },
  {
    id: 18, stage: 3, title: "Connection Lifecycle (TCP-style)", pattern: "state-machine", skill: "events drive transitions",
    statement: "Model a network connection: CLOSED → LISTEN → CONNECTED → CLOSED (via open/listen/connect/close events). Implement handle(event) returning the new state, raising on impossible event.",
    examples: [
      { input: "CLOSED.handle('connect')", output: "raises — must LISTEN first", explain: "events valid only in matching states" },
    ],
    why: "TCP's famous state diagram is a state machine where EVENTS (not methods) drive transitions. Model it as (state, event) → next_state. This handles out-of-order events safely — the core of protocol implementation.",
    starterCode: "class Connection:\n    TABLE = {\n        ('CLOSED', 'open'): 'LISTEN',\n        ('LISTEN', 'connect'): 'CONNECTED',\n        ('LISTEN', 'close'): 'CLOSED',\n        ('CONNECTED', 'close'): 'CLOSED',\n    }\n\n    def __init__(self):\n        pass\n\n    def handle(self, event):\n        pass",
    hints: [
      "State starts 'CLOSED'.",
      "handle: look up (self.state, event) in TABLE; missing → raise ValueError.",
      "Found → set state, return it.",
    ],
    solution: "class Connection:\n    TABLE = {\n        ('CLOSED', 'open'): 'LISTEN',\n        ('LISTEN', 'connect'): 'CONNECTED',\n        ('LISTEN', 'close'): 'CLOSED',\n        ('CONNECTED', 'close'): 'CLOSED',\n    }\n\n    def __init__(self):\n        self.state = 'CLOSED'\n\n    def handle(self, event):\n        key = (self.state, event)\n        if key not in self.TABLE:\n            raise ValueError(f'Event {event} invalid in state {self.state}')\n        self.state = self.TABLE[key]\n        return self.state",
    walkthrough: "A (state, event) table is MORE powerful than a state→states table: the same state transition can require different events. This is how TCP, TLS handshakes, and game networking code actually works. When events arrive from a network, you need the pair.",
    testCode: "c = Connection()\nassert c.state == 'CLOSED'\nc.handle('open')\nassert c.state == 'LISTEN'\nc.handle('connect')\nassert c.state == 'CONNECTED'\nc.handle('close')\nassert c.state == 'CLOSED'\ntry:\n    c.handle('connect')\n    assert False\nexcept ValueError:\n    pass\nprint('All tests passed!')"
  },
  {
    id: 19, stage: 3, title: "Document Workflow", pattern: "state-machine", skill: "role-gated transitions",
    statement: "A doc flows: DRAFT → (submit) → IN_REVIEW → (approve) → PUBLISHED, IN_REVIEW → (reject) → DRAFT. Only authors submit; only reviewers approve/reject. Implement with role checks.",
    examples: [
      { input: "reviewer tries to submit()", output: "raises PermissionError", explain: "transition AND role both required" },
    ],
    why: "Real workflows gate transitions by ROLE, not just state. The transition table gains a third dimension: (state, action, role). Workflow engines (and every approval system) are state machines with permissions.",
    starterCode: "class Document:\n    RULES = {\n        ('DRAFT', 'submit'): ('IN_REVIEW', 'author'),\n        ('IN_REVIEW', 'approve'): ('PUBLISHED', 'reviewer'),\n        ('IN_REVIEW', 'reject'): ('DRAFT', 'reviewer'),\n    }\n\n    def __init__(self, title):\n        pass\n\n    def perform(self, action, role):\n        pass",
    hints: [
      "State starts 'DRAFT'.",
      "perform: look up (state, action) → (next_state, required_role).",
      "Missing rule → ValueError. Wrong role → PermissionError. Else transition.",
    ],
    solution: "class Document:\n    RULES = {\n        ('DRAFT', 'submit'): ('IN_REVIEW', 'author'),\n        ('IN_REVIEW', 'approve'): ('PUBLISHED', 'reviewer'),\n        ('IN_REVIEW', 'reject'): ('DRAFT', 'reviewer'),\n    }\n\n    def __init__(self, title):\n        self.title = title\n        self.state = 'DRAFT'\n\n    def perform(self, action, role):\n        key = (self.state, action)\n        if key not in self.RULES:\n            raise ValueError(f'Cannot {action} from {self.state}')\n        next_state, required_role = self.RULES[key]\n        if role != required_role:\n            raise PermissionError(f'{action} requires {required_role}')\n        self.state = next_state",
    walkthrough: "(state, action) → (next_state, role). Two failure modes separated: ValueError = impossible transition, PermissionError = legal move, wrong person. CMSs, CI/CD approval gates, and expense systems all reduce to this table.",
    testCode: "d = Document('Spec')\nd.perform('submit', 'author')\nassert d.state == 'IN_REVIEW'\ntry:\n    d.perform('approve', 'author')\n    assert False\nexcept PermissionError:\n    pass\nd.perform('approve', 'reviewer')\nassert d.state == 'PUBLISHED'\ntry:\n    d.perform('submit', 'author')\n    assert False\nexcept ValueError:\n    pass\nprint('All tests passed!')"
  },
  {
    id: 20, stage: 3, title: "Retry with Backoff States", pattern: "state-machine", skill: "failure is a state too",
    statement: "A job runner: PENDING → RUNNING → SUCCESS or FAILED. FAILED jobs retry up to 3 times (FAILED → PENDING), then → DEAD. Implement the full machine including retry counting.",
    examples: [
      { input: "job fails 4 times", output: "state == 'DEAD'", explain: "retries exhausted" },
    ],
    why: "Job queues (Sidekiq, Celery, SQS) live here. Failure isn't the opposite of success — it's a state with its own transitions (retry or dead-letter). Counting attempts inside the object keeps the policy with the data.",
    starterCode: "class Job:\n    MAX_RETRIES = 3\n\n    def __init__(self, jid):\n        pass\n\n    def start(self):\n        pass\n\n    def succeed(self):\n        pass\n\n    def fail(self):\n        pass\n\n    def retry(self):\n        pass",
    hints: [
      "States: PENDING, RUNNING, SUCCESS, FAILED, DEAD. attempts counter starts 0.",
      "start: PENDING→RUNNING. succeed: RUNNING→SUCCESS. fail: RUNNING→FAILED, attempts += 1.",
      "retry: FAILED→PENDING if attempts < MAX_RETRIES; else FAILED→DEAD.",
    ],
    solution: "class Job:\n    MAX_RETRIES = 3\n\n    def __init__(self, jid):\n        self.jid = jid\n        self.state = 'PENDING'\n        self.attempts = 0\n\n    def start(self):\n        if self.state != 'PENDING':\n            raise ValueError(f'Cannot start from {self.state}')\n        self.state = 'RUNNING'\n\n    def succeed(self):\n        if self.state != 'RUNNING':\n            raise ValueError('Not running')\n        self.state = 'SUCCESS'\n\n    def fail(self):\n        if self.state != 'RUNNING':\n            raise ValueError('Not running')\n        self.attempts += 1\n        self.state = 'FAILED'\n\n    def retry(self):\n        if self.state != 'FAILED':\n            raise ValueError('Can only retry failed jobs')\n        if self.attempts < self.MAX_RETRIES:\n            self.state = 'PENDING'\n        else:\n            self.state = 'DEAD'",
    walkthrough: "The retry decision lives INSIDE the job: attempts counted, policy (3 max) as class constant. DEAD is the dead-letter queue — jobs that gave up. Every production queue you'll ever use is this machine plus persistence.",
    testCode: "j = Job('J1')\nj.start()\nj.fail()\nassert j.attempts == 1\nj.retry()\nassert j.state == 'PENDING'\nfor _ in range(2):\n    j.start(); j.fail(); j.retry()\nassert j.state == 'DEAD'\nassert j.attempts == 3\nj2 = Job('J2')\nj2.start(); j2.succeed()\nassert j2.state == 'SUCCESS'\nprint('All tests passed!')"
  },

  // ══ STAGE 4 — Naive (God Class) ══
  {
    id: 21, stage: 4, title: "The God Class: ReportManager", pattern: "god-class", skill: "feel why it's wrong",
    statement: "Build the naive version: ReportManager does fetch data + format CSV + format PDF + email report + log to DB, all in one class with 5 public methods. Implement it (simplified) — then count how many reasons it has to change.",
    examples: [
      { input: "rm = ReportManager(); rm.generate_and_send('sales')", output: "works, but...", explain: "one class, five responsibilities" },
    ],
    why: "You must BUILD the god class to feel the pain. 5 responsibilities = 5 change-reasons = every feature request touches this file = merge conflicts forever. Stage 5 splits it — but first, name the five jobs.",
    starterCode: "class ReportManager:\n    def fetch_data(self, report_type):\n        pass\n\n    def format_csv(self, data):\n        pass\n\n    def send_email(self, content, to):\n        pass\n\n    def log(self, message):\n        pass\n\n    def generate_and_send(self, report_type, to='boss@co.com'):\n        pass",
    hints: [
      "fetch_data returns [{'item': 'widget', 'sales': 100}] (stub).",
      "format_csv joins with commas. send_email returns a string. log appends to a list.",
      "generate_and_send orchestrates: fetch → format → email → log.",
    ],
    solution: "class ReportManager:\n    def __init__(self):\n        self.logs = []\n\n    def fetch_data(self, report_type):\n        return [{'item': 'widget', 'sales': 100}, {'item': 'gadget', 'sales': 250}]\n\n    def format_csv(self, data):\n        rows = ['item,sales'] + [f\"{d['item']},{d['sales']}\" for d in data]\n        return '\\n'.join(rows)\n\n    def send_email(self, content, to):\n        return f'EMAIL to {to}: {len(content)} chars'\n\n    def log(self, message):\n        self.logs.append(message)\n\n    def generate_and_send(self, report_type, to='boss@co.com'):\n        data = self.fetch_data(report_type)\n        csv = self.format_csv(data)\n        result = self.send_email(csv, to)\n        self.log(f'Sent {report_type} report')\n        return result",
    walkthrough: "It works. That's the trap. But: data source changes (API→DB)? Touch it. New format (PDF)? Touch it. Email provider swap? Touch it. Log format? Touch it. FIVE reasons to change one class. P22 splits this exact class — keep this code in mind as the 'before' picture.",
    testCode: "rm = ReportManager()\nout = rm.generate_and_send('sales')\nassert 'EMAIL' in out\nassert len(rm.logs) == 1\ncsv = rm.format_csv([{'item':'x','sales':1}])\nassert csv == 'item,sales\\nx,1'\nprint('All tests passed!')"
  },
  {
    id: 22, stage: 4, title: "Count the Change-Reasons", pattern: "srp-analysis", skill: "responsibility counting",
    statement: "class User: validates email, hashes passwords, saves to DB, sends welcome email, generates profile avatar. List the 5 responsibilities. Which one stays if the DB changes? Implement the class, then in a comment, name the split.",
    examples: [
      { input: "DB schema changes", output: "User class must change — but why does validation care?", explain: "SRP violation exposed" },
    ],
    why: "SRP isn't abstract: 'how many reasons does this class have to change?' If the answer is >1, it's a god class. The fix: one class per responsibility — UserValidator, PasswordHasher, UserRepository, EmailService, AvatarGenerator.",
    starterCode: "class User:\n    def __init__(self, email, password):\n        self.email = email\n        self.password = password\n\n    # RESPONSIBILITY 1: ???\n    def validate(self):\n        pass\n\n    # RESPONSIBILITY 2: ???\n    def hash_password(self):\n        pass\n\n    # RESPONSIBILITY 3: ???\n    def save(self, db):\n        pass\n\n    # RESPONSIBILITY 4: ???\n    def send_welcome(self):\n        pass\n\n    # RESPONSIBILITY 5: ???\n    def make_avatar(self):\n        pass",
    hints: [
      "validate: '@' in email. hash_password: simple sum of ords (stub).",
      "save: db['users'].append(self). send_welcome: return string. make_avatar: initials.",
      "The comments should name each responsibility — that naming IS the exercise.",
    ],
    solution: "class User:\n    def __init__(self, email, password):\n        self.email = email\n        self.password = password\n\n    def validate(self):\n        return '@' in self.email\n\n    def hash_password(self):\n        return sum(ord(c) for c in self.password)\n\n    def save(self, db):\n        db.setdefault('users', []).append(self.email)\n\n    def send_welcome(self):\n        return f'Welcome email to {self.email}'\n\n    def make_avatar(self):\n        return self.email[0].upper()",
    walkthrough: "Five methods, five responsibilities, five change-reasons. The split: UserValidator (rules), PasswordHasher (crypto), UserRepository (persistence), EmailService (delivery), AvatarGenerator (image). Each future change touches exactly ONE class. The naming exercise you just did IS domain modeling.",
    testCode: "u = User('a@b.com', 'secret')\nassert u.validate() == True\ndb = {}\nu.save(db)\nassert db['users'] == ['a@b.com']\nassert u.make_avatar() == 'A'\nassert 'Welcome' in u.send_welcome()\nbad = User('notanemail', 'x')\nassert bad.validate() == False\nprint('All tests passed!')"
  },
  {
    id: 23, stage: 4, title: "If-Else Explosion: Shipping Cost", pattern: "conditional-complexity", skill: "feel the combinatorial pain",
    statement: "Naive shipping: if country=='US': if express: ... elif standard: ... elif country=='EU': ... 3 countries × 2 speeds with if/elif chains. Implement it naively, then count: adding a country means editing how many branches?",
    examples: [
      { input: "calc('US', 'express', 2kg)", output: "2 × 15 = 30", explain: "US express rate" },
    ],
    why: "The if-else tree WORKS but grows combinatorially: 3 countries × 2 speeds = 6 branches; add 2 countries → 10 branches; add a 'priority' speed → 15. The function becomes untouchable. Stage 5's strategy pattern fixes exactly this.",
    starterCode: "def shipping_cost(country, speed, weight_kg):\n    # US: standard 5/kg, express 15/kg\n    # EU: standard 8/kg, express 20/kg\n    # IN: standard 2/kg, express 10/kg\n    pass",
    hints: [
      "Write the nested if/elif exactly as described — the pain is the point.",
      "6 branches total. Raise ValueError for unknown combos.",
      "Count: adding 'JP' means +2 branches AND re-reading all 6 existing ones.",
    ],
    solution: "def shipping_cost(country, speed, weight_kg):\n    if country == 'US':\n        if speed == 'standard':\n            return weight_kg * 5\n        elif speed == 'express':\n            return weight_kg * 15\n    elif country == 'EU':\n        if speed == 'standard':\n            return weight_kg * 8\n        elif speed == 'express':\n            return weight_kg * 20\n    elif country == 'IN':\n        if speed == 'standard':\n            return weight_kg * 2\n        elif speed == 'express':\n            return weight_kg * 10\n    raise ValueError(f'Unknown: {country}/{speed}')",
    walkthrough: "Six branches for a lookup table's worth of data. The data (rates) is trapped in control flow. Adding JP means surgical insertion into a growing nest. The insight that fixes it (P27): the rate table is DATA {(country, speed): rate}; the strategy is POLYMORPHISM. Remember this pain.",
    testCode: "assert shipping_cost('US', 'express', 2) == 30\nassert shipping_cost('EU', 'standard', 3) == 24\nassert shipping_cost('IN', 'express', 1) == 10\ntry:\n    shipping_cost('JP', 'standard', 1)\n    assert False\nexcept ValueError:\n    pass\nprint('All tests passed!')"
  },
  {
    id: 24, stage: 4, title: "Tangled Coupling: OrderService", pattern: "tight-coupling", skill: "new-ing everything is glue",
    statement: "Naive OrderService news up MySQLDatabase, SMTPEmailer, StripeGateway inside its methods. Implement this naive version, then answer: how do you test it without a real DB, SMTP server, and Stripe account?",
    examples: [
      { input: "os = OrderService(); os.place_order(cart)", output: "hits real infra in tests", explain: "construction = coupling" },
    ],
    why: "new Database() inside a method MARRIES the service to that database. Testing needs the real thing. The fix (Stage 5): pass dependencies in the constructor (dependency injection). But first — feel the untestable pain.",
    starterCode: "class MySQLDatabase:\n    def insert(self, table, row):\n        return f'MySQL insert into {table}'\n\nclass SMTPEmailer:\n    def send(self, to, msg):\n        return f'SMTP to {to}'\n\nclass StripeGateway:\n    def charge(self, amount):\n        return f'Stripe charge {amount}'\n\nclass OrderService:\n    def place_order(self, items, total, email):\n        pass",
    hints: [
      "place_order creates MySQLDatabase(), inserts order.",
      "Creates StripeGateway(), charges total.",
      "Creates SMTPEmailer(), sends confirmation. Return all three results.",
    ],
    solution: "class MySQLDatabase:\n    def insert(self, table, row):\n        return f'MySQL insert into {table}'\n\nclass SMTPEmailer:\n    def send(self, to, msg):\n        return f'SMTP to {to}'\n\nclass StripeGateway:\n    def charge(self, amount):\n        return f'Stripe charge {amount}'\n\nclass OrderService:\n    def place_order(self, items, total, email):\n        db = MySQLDatabase()\n        r1 = db.insert('orders', {'items': items})\n        gw = StripeGateway()\n        r2 = gw.charge(total)\n        mailer = SMTPEmailer()\n        r3 = mailer.send(email, 'Order confirmed')\n        return (r1, r2, r3)",
    walkthrough: "Three `new`s inside the method = three hard dependencies. You CANNOT test place_order without MySQL, Stripe, and SMTP running. The fix is one line of reasoning: 'constructing inside = owning forever; passing in = borrowing'. P28 injects these exact dependencies.",
    testCode: "os = OrderService()\nr1, r2, r3 = os.place_order(['widget'], 100, 'a@b.com')\nassert 'MySQL' in r1\nassert 'Stripe' in r2\nassert 'SMTP' in r3\nprint('All tests passed!')"
  },
  {
    id: 25, stage: 4, title: "Mutable Global: GameState", pattern: "global-state", skill: "shared mutable = debugging hell",
    statement: "Naive game uses module-level globals: SCORE=0, LEVEL=1, LIVES=3. Functions add_score(), next_level(), die() mutate them. Implement this, then list: (1) how do you run two games at once? (2) how do you test one function without others leaking state?",
    examples: [
      { input: "test A calls add_score(100); test B reads SCORE", output: "B sees A's leak", explain: "globals leak across tests" },
    ],
    why: "Globals make every function secretly coupled to every other. Tests leak, multiplayer impossible, restart = manually resetting N variables. The fix (Stage 5/6): a GameState OBJECT passed around. First, feel the leak.",
    starterCode: "SCORE = 0\nLEVEL = 1\nLIVES = 3\n\ndef add_score(points):\n    pass\n\ndef next_level():\n    pass\n\ndef die():\n    pass\n\ndef get_state():\n    pass",
    hints: [
      "Each function declares `global SCORE` etc., then mutates.",
      "add_score: SCORE += points. next_level: LEVEL += 1, LIVES = 3 (refill).",
      "die: LIVES -= 1. get_state returns (SCORE, LEVEL, LIVES).",
    ],
    solution: "SCORE = 0\nLEVEL = 1\nLIVES = 3\n\ndef add_score(points):\n    global SCORE\n    SCORE += points\n\ndef next_level():\n    global LEVEL, LIVES\n    LEVEL += 1\n    LIVES = 3\n\ndef die():\n    global LIVES\n    LIVES -= 1\n\ndef get_state():\n    return (SCORE, LEVEL, LIVES)",
    walkthrough: "Works for ONE game, ONE test run, forever entangled. Two games? Impossible. Test isolation? Manual resets everywhere. Restart? Hope you found every global. The object fix: wrap these three fields in GameState and pass it — suddenly multiplayer and testability are free. That's Stage 6's world.",
    testCode: "import importlib\nadd_score(100)\nassert get_state()[0] == 100\nnext_level()\nassert get_state() == (100, 2, 3)\ndie()\nassert get_state() == (100, 2, 2)\nprint('All tests passed!')"
  },

  // ══ STAGE 5 — Patterns ══
  {
    id: 26, stage: 5, title: "Strategy: Shipping Without Ifs", pattern: "strategy-pattern", skill: "polymorphism replaces branching",
    statement: "Fix P23's if-else explosion. Each country is a ShippingStrategy subclass with cost(weight) method. ShippingCalculator takes a strategy and delegates. Adding JP = one new class, zero edits to existing code.",
    examples: [
      { input: "ShippingCalculator(USShipping()).cost(2, 'express')", output: "30", explain: "same answer, no if-chains" },
    ],
    why: "THE fix for conditional complexity: each branch becomes a class, the if-chain becomes polymorphism. Open/Closed Principle — open for extension (new strategy), closed for modification (existing code untouched).",
    starterCode: "class ShippingStrategy:\n    def cost(self, weight, speed):\n        raise NotImplementedError\n\nclass USShipping(ShippingStrategy):\n    pass\n\nclass EUShipping(ShippingStrategy):\n    pass\n\nclass INShipping(ShippingStrategy):\n    pass\n\nclass ShippingCalculator:\n    def __init__(self, strategy):\n        pass\n\n    def cost(self, weight, speed):\n        pass",
    hints: [
      "Each strategy: RATES = {'standard': x, 'express': y}; cost = weight * RATES[speed].",
      "ShippingCalculator stores strategy, delegates: return self.strategy.cost(weight, speed).",
      "New country = new subclass. Nothing else changes.",
    ],
    solution: "class ShippingStrategy:\n    def cost(self, weight, speed):\n        raise NotImplementedError\n\nclass USShipping(ShippingStrategy):\n    RATES = {'standard': 5, 'express': 15}\n    def cost(self, weight, speed):\n        return weight * self.RATES[speed]\n\nclass EUShipping(ShippingStrategy):\n    RATES = {'standard': 8, 'express': 20}\n    def cost(self, weight, speed):\n        return weight * self.RATES[speed]\n\nclass INShipping(ShippingStrategy):\n    RATES = {'standard': 2, 'express': 10}\n    def cost(self, weight, speed):\n        return weight * self.RATES[speed]\n\nclass ShippingCalculator:\n    def __init__(self, strategy):\n        self.strategy = strategy\n\n    def cost(self, weight, speed):\n        return self.strategy.cost(weight, speed)",
    walkthrough: "The if-chain became a class family. Each country's rates live in ITS class. ShippingCalculator doesn't know which country — it just delegates. Compare with P23: adding JP is now `class JPShipping(ShippingStrategy): RATES = {...}`. No existing file touched. That's Open/Closed.",
    testCode: "assert ShippingCalculator(USShipping()).cost(2, 'express') == 30\nassert ShippingCalculator(EUShipping()).cost(3, 'standard') == 24\nassert ShippingCalculator(INShipping()).cost(1, 'express') == 10\nprint('All tests passed!')"
  },
  {
    id: 27, stage: 5, title: "Factory: Creating Notifications", pattern: "factory-pattern", skill: "creation logic in one place",
    statement: "System sends EmailNotification, SMSNotification, PushNotification. Implement NotificationFactory.create(channel, **kwargs) that returns the right object. Callers never say 'EmailNotification(' directly.",
    examples: [
      { input: "factory.create('sms', phone='123')", output: "SMSNotification instance", explain: "factory decides the class" },
    ],
    why: "Creation logic scattered across the codebase = 40 places that know every subclass. A factory centralizes 'string → class' mapping. Adding a channel touches ONE method. This is the most-used pattern in real codebases.",
    starterCode: "class EmailNotification:\n    def __init__(self, address):\n        self.channel = 'email'\n        self.address = address\n\n    def send(self, msg):\n        return f'EMAIL to {self.address}: {msg}'\n\nclass SMSNotification:\n    def __init__(self, phone):\n        self.channel = 'sms'\n        self.phone = phone\n\n    def send(self, msg):\n        return f'SMS to {self.phone}: {msg}'\n\nclass PushNotification:\n    def __init__(self, device_token):\n        self.channel = 'push'\n        self.device_token = device_token\n\n    def send(self, msg):\n        return f'PUSH to {self.device_token[:8]}...: {msg}'\n\nclass NotificationFactory:\n    @staticmethod\n    def create(channel, **kwargs):\n        pass",
    hints: [
      "Map: {'email': (EmailNotification, 'address'), 'sms': (SMSNotification, 'phone'), ...}.",
      "Look up class + required kwarg, construct with kwargs[key].",
      "Unknown channel → raise ValueError.",
    ],
    solution: "class EmailNotification:\n    def __init__(self, address):\n        self.channel = 'email'\n        self.address = address\n\n    def send(self, msg):\n        return f'EMAIL to {self.address}: {msg}'\n\nclass SMSNotification:\n    def __init__(self, phone):\n        self.channel = 'sms'\n        self.phone = phone\n\n    def send(self, msg):\n        return f'SMS to {self.phone}: {msg}'\n\nclass PushNotification:\n    def __init__(self, device_token):\n        self.channel = 'push'\n        self.device_token = device_token\n\n    def send(self, msg):\n        return f'PUSH to {self.device_token[:8]}...: {msg}'\n\nclass NotificationFactory:\n    REGISTRY = {\n        'email': (EmailNotification, 'address'),\n        'sms': (SMSNotification, 'phone'),\n        'push': (PushNotification, 'device_token'),\n    }\n\n    @staticmethod\n    def create(channel, **kwargs):\n        if channel not in NotificationFactory.REGISTRY:\n            raise ValueError(f'Unknown channel: {channel}')\n        cls, key = NotificationFactory.REGISTRY[channel]\n        return cls(kwargs[key])",
    walkthrough: "REGISTRY maps string → (class, required_arg). Callers say create('sms', phone='123') — they never import SMSNotification. Adding WhatsApp: one REGISTRY line + one class. The rest of the codebase literally cannot know it exists until you register it.",
    testCode: "n1 = NotificationFactory.create('email', address='a@b.com')\nassert n1.send('hi') == 'EMAIL to a@b.com: hi'\nn2 = NotificationFactory.create('sms', phone='123')\nassert n2.send('hi') == 'SMS to 123: hi'\nn3 = NotificationFactory.create('push', device_token='abcdef123456')\nassert 'PUSH' in n3.send('hi')\ntry:\n    NotificationFactory.create('pigeon', coop='roof')\n    assert False\nexcept ValueError:\n    pass\nprint('All tests passed!')"
  },
  {
    id: 28, stage: 5, title: "Dependency Injection: Fix OrderService", pattern: "dependency-injection", skill: "pass deps in, don't new them",
    statement: "Fix P24's untestable OrderService: take db, gateway, mailer as constructor args. Then write a test with FAKE versions (FakeDB, FakeGateway, FakeMailer) that records calls without touching real infra.",
    examples: [
      { input: "OrderService(FakeDB(), FakeGateway(), FakeMailer())", output: "place_order works, zero infra", explain: "fakes substitute seamlessly" },
    ],
    why: "DI is THE testability pattern. Constructor takes interfaces; production passes real impls; tests pass fakes. The service doesn't know or care. This one idea unlocks unit testing for every service you'll ever write.",
    starterCode: "class OrderService:\n    def __init__(self, db, gateway, mailer):\n        pass\n\n    def place_order(self, items, total, email):\n        pass\n\nclass FakeDB:\n    def __init__(self):\n        self.rows = []\n\n    def insert(self, table, row):\n        pass\n\nclass FakeGateway:\n    def __init__(self):\n        self.charges = []\n\n    def charge(self, amount):\n        pass\n\nclass FakeMailer:\n    def __init__(self):\n        self.sent = []\n\n    def send(self, to, msg):\n        pass",
    hints: [
      "OrderService stores the three deps, uses them in place_order — same calls as P24.",
      "Each fake records calls into its list and returns a canned string.",
      "Test: place order, then assert fakes recorded the right calls.",
    ],
    solution: "class OrderService:\n    def __init__(self, db, gateway, mailer):\n        self.db = db\n        self.gateway = gateway\n        self.mailer = mailer\n\n    def place_order(self, items, total, email):\n        r1 = self.db.insert('orders', {'items': items})\n        r2 = self.gateway.charge(total)\n        r3 = self.mailer.send(email, 'Order confirmed')\n        return (r1, r2, r3)\n\nclass FakeDB:\n    def __init__(self):\n        self.rows = []\n\n    def insert(self, table, row):\n        self.rows.append((table, row))\n        return 'fake-insert'\n\nclass FakeGateway:\n    def __init__(self):\n        self.charges = []\n\n    def charge(self, amount):\n        self.charges.append(amount)\n        return 'fake-charge'\n\nclass FakeMailer:\n    def __init__(self):\n        self.sent = []\n\n    def send(self, to, msg):\n        self.sent.append((to, msg))\n        return 'fake-send'",
    walkthrough: "P24 news up real classes inside the method — untestable. This version receives everything in the constructor — trivially testable with fakes. SAME method body, different construction. The rule: dependencies flow IN through the constructor, never get created inside. Production wires real ones; tests wire fakes.",
    testCode: "db, gw, mailer = FakeDB(), FakeGateway(), FakeMailer()\nsvc = OrderService(db, gw, mailer)\nsvc.place_order(['widget'], 100, 'a@b.com')\nassert db.rows == [('orders', {'items': ['widget']})]\nassert gw.charges == [100]\nassert mailer.sent == [('a@b.com', 'Order confirmed')]\nprint('All tests passed!')"
  },
  {
    id: 29, stage: 5, title: "Observer: Stock Price Alerts", pattern: "observer-pattern", skill: "subjects notify, observers react",
    statement: "Stock ticker: multiple watchers (EmailAlert, SMSAlert, Logger) subscribe. When price changes, all subscribed watchers get notified. Implement Subject with subscribe/unsubscribe/notify and two observer classes.",
    examples: [
      { input: "ticker.set_price(105)", output: "all watchers called with 105", explain: "one change, N reactions" },
    ],
    why: "When one event interests many parties, polling is death. Observer inverts it: the subject maintains a subscriber list and pushes events. UI frameworks, event buses, and pub/sub systems all build on this pattern.",
    starterCode: "class StockTicker:\n    def __init__(self, symbol):\n        pass\n\n    def subscribe(self, watcher):\n        pass\n\n    def unsubscribe(self, watcher):\n        pass\n\n    def set_price(self, price):\n        pass\n\nclass EmailAlert:\n    def __init__(self, address):\n        self.address = address\n        self.received = []\n\n    def update(self, symbol, price):\n        pass\n\nclass Logger:\n    def __init__(self):\n        self.entries = []\n\n    def update(self, symbol, price):\n        pass",
    hints: [
      "Ticker holds watchers list + current price.",
      "set_price stores price, then calls w.update(symbol, price) on every watcher.",
      "Observers implement .update(symbol, price) and record into their lists.",
    ],
    solution: "class StockTicker:\n    def __init__(self, symbol):\n        self.symbol = symbol\n        self.watchers = []\n        self.price = 0\n\n    def subscribe(self, watcher):\n        self.watchers.append(watcher)\n\n    def unsubscribe(self, watcher):\n        self.watchers.remove(watcher)\n\n    def set_price(self, price):\n        self.price = price\n        for w in self.watchers:\n            w.update(self.symbol, price)\n\nclass EmailAlert:\n    def __init__(self, address):\n        self.address = address\n        self.received = []\n\n    def update(self, symbol, price):\n        self.received.append((symbol, price))\n\nclass Logger:\n    def __init__(self):\n        self.entries = []\n\n    def update(self, symbol, price):\n        self.entries.append(f'{symbol}={price}')",
    walkthrough: "The ticker knows NOTHING about email or logging — it calls .update on anything subscribed. New watcher type? Implement .update, subscribe. Zero changes to the ticker. Decoupling via a shared interface: that's Observer, and it's why event systems scale.",
    testCode: "t = StockTicker('AAPL')\ne = EmailAlert('a@b.com')\nl = Logger()\nt.subscribe(e)\nt.subscribe(l)\nt.set_price(105)\nassert e.received == [('AAPL', 105)]\nassert l.entries == ['AAPL=105']\nt.unsubscribe(e)\nt.set_price(110)\nassert e.received == [('AAPL', 105)]\nassert l.entries == ['AAPL=105', 'AAPL=110']\nprint('All tests passed!')"
  },
  {
    id: 30, stage: 5, title: "Singleton-ish: AppConfig", pattern: "singleton-pattern", skill: "one instance, controlled access",
    statement: "App config must be loaded ONCE and shared everywhere. Implement AppConfig with a class-level _instance and a get() classmethod that creates it lazily. Also implement the reset() used by tests.",
    examples: [
      { input: "AppConfig.get() is AppConfig.get()", output: "True", explain: "same object every time" },
    ],
    why: "Config, connection pools, registries: exactly one must exist. Singletons get a bad name for being global-state-in-disguise (P25's pain) — the lesson is WHEN it's justified: read-mostly, process-wide, immutable-ish state.",
    starterCode: "class AppConfig:\n    _instance = None\n\n    def __init__(self):\n        self.settings = {'env': 'prod', 'debug': False}\n\n    @classmethod\n    def get(cls):\n        pass\n\n    @classmethod\n    def reset(cls):\n        pass",
    hints: [
      "get(): if cls._instance is None: cls._instance = cls(). Return it.",
      "reset(): cls._instance = None — lets tests start fresh.",
      "get() is get() must return True (identity, not equality).",
    ],
    solution: "class AppConfig:\n    _instance = None\n\n    def __init__(self):\n        self.settings = {'env': 'prod', 'debug': False}\n\n    @classmethod\n    def get(cls):\n        if cls._instance is None:\n            cls._instance = cls()\n        return cls._instance\n\n    @classmethod\n    def reset(cls):\n        cls._instance = None",
    walkthrough: "Lazy initialization + class-level holder = the Pythonic singleton. The reset() is the honest part: singletons make tests share state (P25's lesson), so provide an escape hatch. Know both the pattern AND its testability cost.",
    testCode: "AppConfig.reset()\nc1 = AppConfig.get()\nc2 = AppConfig.get()\nassert c1 is c2\nc1.settings['debug'] = True\nassert AppConfig.get().settings['debug'] == True\nAppConfig.reset()\nassert AppConfig.get().settings['debug'] == False\nprint('All tests passed!')"
  },

  // ══ STAGE 6 — Mastery ══
  {
    id: 31, stage: 6, title: "FULL: Parking Lot System", pattern: "complete-design", skill: "compose entities + responsibility + states",
    statement: "Compose P1-P7 into a working ParkingLotSystem: vehicles enter (get ticket + spot assigned), exit (fee calculated, spot freed). Full flow with state changes. This is THE classic LLD interview.",
    examples: [
      { input: "car enters → ticket; exits after 2h → fee 40", output: "spot free again", explain: "complete lifecycle" },
    ],
    why: "Every piece you built assembles here: ParkingSpot (P1), Vehicle hierarchy (P2), Ticket (P3), spot-finding (P6), fee calc (P7). If the pieces were right, composition is clean. If not, you feel the seams — that's the feedback.",
    starterCode: "class ParkingLotSystem:\n    def __init__(self, spots):\n        pass\n\n    def enter(self, vehicle):\n        pass\n\n    def exit(self, ticket, now):\n        pass",
    hints: [
      "Holds spots, tickets {ticket_id: ticket}, a FeeCalculator, a counter for ticket ids.",
      "enter: find_free_spot(vehicle.vehicle_type) → mark occupied → create ticket → return it. None if full.",
      "exit: hours = ticket.hours_parked(now) → fee = calc → free the spot (find by ticket.spot_id) → return fee.",
    ],
    solution: "class ParkingLotSystem:\n    def __init__(self, spots):\n        self.spots = spots\n        self.tickets = {}\n        self.calculator = FeeCalculator()\n        self._counter = 0\n\n    def enter(self, vehicle):\n        for spot in self.spots:\n            if spot.spot_type == vehicle.vehicle_type and not spot.is_occupied:\n                spot.is_occupied = True\n                self._counter += 1\n                ticket = Ticket(f'T{self._counter}', vehicle.license_plate, spot.spot_id)\n                self.tickets[ticket.ticket_id] = ticket\n                return ticket\n        return None\n\n    def exit(self, ticket, now):\n        hours = ticket.hours_parked(now)\n        vtype = next(s.spot_type for s in self.spots if s.spot_id == ticket.spot_id)\n        fee = self.calculator.calculate(hours, vtype)\n        for spot in self.spots:\n            if spot.spot_id == ticket.spot_id:\n                spot.is_occupied = False\n        del self.tickets[ticket.ticket_id]\n        return fee",
    walkthrough: "enter: find → occupy → ticket. exit: time → fee → free. Notice each step delegates to a class you already built and tested: spot search (P6's logic), duration (P3), pricing (P7). The system class is THIN — orchestration only. That's what good composition looks like.",
    testCode: "spots = [ParkingSpot('A1', 1, 'car'), ParkingSpot('A2', 1, 'car'), ParkingSpot('B1', 1, 'bike')]\nsys = ParkingLotSystem(spots)\ncar = Car('KA01')\nt = sys.enter(car)\nassert t is not None and spots[0].is_occupied\nt.entry_time = 1000\nfee = sys.exit(t, 1000 + 7200)\nassert fee == 40\nassert spots[0].is_occupied == False\nspots[0].is_occupied = True\nspots[1].is_occupied = True\nassert sys.enter(Car('KA02')) is None\nprint('All tests passed!')"
  },
  {
    id: 32, stage: 6, title: "FULL: LRU Cache", pattern: "complete-design", skill: "data structure AS object design",
    statement: "Design LRUCache(capacity): get(key) and put(key, value), both O(1). Evict least-recently-used when full. Use dict + doubly-linked list. THE most-asked LLD/DSA hybrid.",
    examples: [
      { input: "cap=2: put(1), put(2), get(1), put(3)", output: "evicts 2 (1 was just used)", explain: "get refreshes recency" },
    ],
    why: "LRU is design + DSA in one: the OBJECT design (clean get/put API, capacity invariant) matters as much as the algorithm. Node class, list ops, hashmap — three structures composed into one class. Interviewers ask this to see both skills at once.",
    starterCode: "class Node:\n    def __init__(self, key, val):\n        pass\n\nclass LRUCache:\n    def __init__(self, capacity):\n        pass\n\n    def get(self, key):\n        pass\n\n    def put(self, key, value):\n        pass",
    hints: [
      "Node: key, val, prev, next. Use dummy head/tail to avoid edge cases.",
      "get: if key in map, move node to front, return val; else -1.",
      "put: update-or-insert at front; if over capacity, remove node before tail, delete from map.",
    ],
    solution: "class Node:\n    def __init__(self, key, val):\n        self.key = key\n        self.val = val\n        self.prev = None\n        self.next = None\n\nclass LRUCache:\n    def __init__(self, capacity):\n        self.cap = capacity\n        self.map = {}\n        self.head = Node(0, 0)\n        self.tail = Node(0, 0)\n        self.head.next = self.tail\n        self.tail.prev = self.head\n\n    def _remove(self, node):\n        node.prev.next = node.next\n        node.next.prev = node.prev\n\n    def _add_front(self, node):\n        node.next = self.head.next\n        node.prev = self.head\n        self.head.next.prev = node\n        self.head.next = node\n\n    def get(self, key):\n        if key not in self.map:\n            return -1\n        node = self.map[key]\n        self._remove(node)\n        self._add_front(node)\n        return node.val\n\n    def put(self, key, value):\n        if key in self.map:\n            self._remove(self.map[key])\n        node = Node(key, value)\n        self.map[key] = node\n        self._add_front(node)\n        if len(self.map) > self.cap:\n            lru = self.tail.prev\n            self._remove(lru)\n            del self.map[lru.key]",
    walkthrough: "dict gives O(1) lookup; the linked list gives O(1) recency reordering. Front = most recent, back = eviction candidate. _remove and _add_front are the only list ops — private helpers keep the public API clean. This exact code passes LeetCode 146 AND answers the LLD version.",
    testCode: "c = LRUCache(2)\nc.put(1, 1)\nc.put(2, 2)\nassert c.get(1) == 1\nc.put(3, 3)\nassert c.get(2) == -1\nc.put(4, 4)\nassert c.get(1) == -1\nassert c.get(3) == 3\nassert c.get(4) == 4\nprint('All tests passed!')"
  },
  {
    id: 33, stage: 6, title: "FULL: Elevator Controller", pattern: "complete-design", skill: "scheduling + state machines",
    statement: "Design ElevatorController managing N elevators. request_floor(floor) assigns the nearest idle elevator (or one heading that way). step() moves each elevator one floor toward its target. Compose P5's Elevator entity.",
    examples: [
      { input: "request 5 with one idle elevator at 0", output: "after 5 steps, elevator at floor 5", explain: "controller dispatches, elevator moves" },
    ],
    why: "The controller pattern: Elevator (P5) knows how to MOVE; ElevatorController knows WHICH should move. Separating entity behavior from scheduling is the design lesson. Nearest-idle-first is the baseline scheduling heuristic.",
    starterCode: "class ElevatorController:\n    def __init__(self, elevators):\n        pass\n\n    def request_floor(self, floor):\n        pass\n\n    def step(self):\n        pass",
    hints: [
      "Each elevator gets a target (None when idle). request_floor picks min distance idle elevator, sets its target.",
      "step: each elevator with a target moves one floor toward it; reaching target clears it.",
      "Reuse Elevator from P5 (eid, current_floor, direction).",
    ],
    solution: "class ElevatorController:\n    def __init__(self, elevators):\n        self.elevators = elevators\n        self.targets = {e.eid: None for e in elevators}\n\n    def request_floor(self, floor):\n        idle = [e for e in self.elevators if self.targets[e.eid] is None]\n        if not idle:\n            return None\n        best = min(idle, key=lambda e: abs(e.current_floor - floor))\n        self.targets[best.eid] = floor\n        return best.eid\n\n    def step(self):\n        for e in self.elevators:\n            t = self.targets[e.eid]\n            if t is None:\n                continue\n            if e.current_floor < t:\n                e.move_to(e.current_floor + 1)\n            elif e.current_floor > t:\n                e.move_to(e.current_floor - 1)\n            if e.current_floor == t:\n                self.targets[e.eid] = None\n                e.direction = 'idle'",
    walkthrough: "Controller dispatches (nearest idle), elevators execute (one floor per step), targets clear on arrival. Elevator (P5) stays dumb about scheduling; controller stays dumb about movement mechanics. Real systems add SCAN scheduling and request queues — but this separation is the foundation.",
    testCode: "e1 = Elevator('E1')\nctrl = ElevatorController([e1])\nassigned = ctrl.request_floor(5)\nassert assigned == 'E1'\nfor _ in range(5):\n    ctrl.step()\nassert e1.current_floor == 5\nassert e1.direction == 'idle'\ne2 = Elevator('E2')\ne2.move_to(10)\nctrl2 = ElevatorController([e1, e2])\nassert ctrl2.request_floor(8) == 'E1'\nprint('All tests passed!')"
  },
  {
    id: 34, stage: 6, title: "FULL: Library Management", pattern: "complete-design", skill: "Book/BookCopy + member + issue flow",
    statement: "Compose P4 into LibrarySystem: add_book, register_member, issue_copy(book_isbn, member_id), return_copy(copy_id). Rules: member max 3 books; can't issue unavailable copies.",
    examples: [
      { input: "issue 2 copies of Clean Code to member M1", output: "both issued; 3 remaining available", explain: "copies tracked independently" },
    ],
    why: "The Book/BookCopy split (P4) pays off: issue tracks COPIES, catalog tracks BOOKS. Business rules (max 3 per member) live in the system class. This is the second most common LLD interview after parking lot.",
    starterCode: "class Member:\n    def __init__(self, mid, name):\n        self.mid = mid\n        self.name = name\n        self.issued = []\n\nclass LibrarySystem:\n    MAX_BOOKS = 3\n\n    def __init__(self):\n        pass\n\n    def add_book(self, book, copy_count):\n        pass\n\n    def register_member(self, mid, name):\n        pass\n\n    def issue_copy(self, isbn, mid):\n        pass\n\n    def return_copy(self, copy_id):\n        pass",
    hints: [
      "Store: books {isbn: Book}, copies {copy_id: BookCopy}, members {mid: Member}.",
      "issue: check member limit, find available copy of isbn, mark issued, append to member.issued.",
      "return: mark copy available, remove from member.issued.",
    ],
    solution: "class Member:\n    def __init__(self, mid, name):\n        self.mid = mid\n        self.name = name\n        self.issued = []\n\nclass LibrarySystem:\n    MAX_BOOKS = 3\n\n    def __init__(self):\n        self.books = {}\n        self.copies = {}\n        self.members = {}\n        self._copy_counter = 0\n\n    def add_book(self, book, copy_count):\n        self.books[book.isbn] = book\n        for _ in range(copy_count):\n            self._copy_counter += 1\n            cid = f'C{self._copy_counter}'\n            self.copies[cid] = BookCopy(cid, book)\n\n    def register_member(self, mid, name):\n        self.members[mid] = Member(mid, name)\n\n    def issue_copy(self, isbn, mid):\n        member = self.members[mid]\n        if len(member.issued) >= self.MAX_BOOKS:\n            raise ValueError('Member limit reached')\n        for copy in self.copies.values():\n            if copy.book.isbn == isbn and copy.status == 'available':\n                copy.status = 'issued'\n                member.issued.append(copy.copy_id)\n                return copy.copy_id\n        return None\n\n    def return_copy(self, copy_id):\n        copy = self.copies[copy_id]\n        copy.status = 'available'\n        for m in self.members.values():\n            if copy_id in m.issued:\n                m.issued.remove(copy_id)",
    walkthrough: "Catalog (books) vs inventory (copies) vs actors (members) — three registries, one orchestrator. The max-3 rule lives in issue_copy, the single place issuance happens. Rules live at the action boundary, not scattered in getters. Full circle from P4's entity split to a working system.",
    testCode: "lib = LibrarySystem()\nb = Book('ISBN1', 'Clean Code', 'Martin')\nlib.add_book(b, 2)\nlib.register_member('M1', 'Alice')\nc1 = lib.issue_copy('ISBN1', 'M1')\nassert c1 is not None\nc2 = lib.issue_copy('ISBN1', 'M1')\nassert lib.issue_copy('ISBN1', 'M1') is None\nlib.return_copy(c1)\nc3 = lib.issue_copy('ISBN1', 'M1')\nassert c3 is not None\nassert lib.copies[c1].status == 'issued'\nprint('All tests passed!')"
  },
  {
    id: 35, stage: 6, title: "FULL: Splitwise Expense Sharing", pattern: "complete-design", skill: "balance graph + simplification",
    statement: "Design Splitwise: add_expense(paid_by, amount, split_among) splits equally. Balances tracked pairwise. settle_up(debtor, creditor) clears debt. get_balances() returns who owes whom.",
    examples: [
      { input: "A pays 90 for A,B,C", output: "B owes A 30, C owes A 30", explain: "equal split, pairwise debts" },
    ],
    why: "Real product, real modeling: expenses create DEBT EDGES between people. The balance is a directed graph of obligations. This is entity design (Expense, Balance) + graph thinking (netting debts) — the interview trifecta.",
    starterCode: "class Splitwise:\n    def __init__(self):\n        pass\n\n    def add_user(self, uid):\n        pass\n\n    def add_expense(self, paid_by, amount, split_among):\n        pass\n\n    def settle_up(self, debtor, creditor):\n        pass\n\n    def get_balances(self):\n        pass",
    hints: [
      "balances[(debtor, creditor)] = amount owed. Never store both (A,B) and (B,A) — net them.",
      "add_expense: share = amount / len(split_among); each non-payer owes payer that share.",
      "settle: reduce the (debtor, creditor) balance to zero.",
    ],
    solution: "class Splitwise:\n    def __init__(self):\n        self.users = set()\n        self.balances = {}\n\n    def add_user(self, uid):\n        self.users.add(uid)\n\n    def _add_debt(self, debtor, creditor, amount):\n        if debtor == creditor:\n            return\n        if (creditor, debtor) in self.balances:\n            self.balances[(creditor, debtor)] -= amount\n            if self.balances[(creditor, debtor)] <= 0:\n                self.balances[(debtor, creditor)] = -self.balances.pop((creditor, debtor))\n                if self.balances[(debtor, creditor)] == 0:\n                    del self.balances[(debtor, creditor)]\n        else:\n            self.balances[(debtor, creditor)] = self.balances.get((debtor, creditor), 0) + amount\n\n    def add_expense(self, paid_by, amount, split_among):\n        share = amount / len(split_among)\n        for uid in split_among:\n            if uid != paid_by:\n                self._add_debt(uid, paid_by, share)\n\n    def settle_up(self, debtor, creditor):\n        self.balances.pop((debtor, creditor), None)\n\n    def get_balances(self):\n        return {k: v for k, v in self.balances.items() if v > 0}",
    walkthrough: "Debts are directed edges; the _add_debt netting keeps exactly one edge per pair. Splitting = creating edges. Settling = removing an edge. The object model IS a graph, and get_balances is just 'list the edges'. Splitwise's full version adds graph simplification (min-transactions) — that's DSA meeting LLD again.",
    testCode: "s = Splitwise()\nfor u in ['A', 'B', 'C']:\n    s.add_user(u)\ns.add_expense('A', 90, ['A', 'B', 'C'])\nbal = s.get_balances()\nassert bal[('B', 'A')] == 30\nassert bal[('C', 'A')] == 30\ns.settle_up('B', 'A')\nassert ('B', 'A') not in s.get_balances()\ns.add_expense('B', 60, ['A', 'B'])\nassert s.get_balances()[('A', 'B')] == 30\nprint('All tests passed!')"
  },
]
