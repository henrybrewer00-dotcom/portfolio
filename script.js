const output = document.querySelector("#terminalOutput");
const form = document.querySelector("#terminalForm");
const input = document.querySelector("#terminalInput");
const promptLabel = document.querySelector(".prompt");
const pageShell = document.querySelector("#pageShell");
const openTerminal = document.querySelector("#openTerminal");
const gameTimer = document.querySelector("#gameTimer");

const state = {
  history: [],
  historyIndex: 0,
  terminalOpen: false,
  game: null,
  timerId: null,
  cwd: "~",
};

const commandList = [
  ["/help", "show the full command list"],
  ["/whoami", "quick bio and what Henry likes building"],
  ["/whoamii", "same as /whoami, typo friendly"],
  ["ls", "list portfolio files"],
  ["cat projects.txt", "print the project index"],
  ["/robot-car", "autonomous robot car build log"],
  ["/hackathons", "hackathon projects and wins"],
  ["/submarine", "underwater engineering notes"],
  ["/grades", "academics, classes, and study stats"],
  ["/github", "GitHub profile and open source contributions"],
  ["/opensource", "open source contribution summary"],
  ["/nano <folder>", "open a simulated nano note for any folder or file"],
  ["/typing-game", "try your hand at outtyping a 13 year old"],
  ["/hire-game", "race to create hire_henry=true in a file"],
  ["/randomstuff", "misc experiments, tiny tools, and half-serious ideas"],
  ["/skills", "hardware, software, design, and team skills"],
  ["/timeline", "selected milestones"],
  ["/contact", "ways to reach Henry"],
  ["/now", "what is currently in progress"],
  ["/stack", "favorite tools and technologies"],
  ["/black", "keep the site locked to pure black"],
  ["/minimal", "explain the current design mode"],
  ["/clear", "clear the screen"],
  ["pwd", "print current directory"],
  ["cd robot-car", "enter a project directory"],
  ["clear", "clear the screen"],
  ["history", "show commands used this session"],
  ["date", "print the current date"],
  ["echo hello", "repeat text back"],
  ["/resume", "wow, already here"],
  ["sudo make me cool", "try it, obviously"],
];

const fileSystem = {
  "~": {
    dirs: ["robot-car", "hackathons", "submarine", "grades", "randomstuff"],
    files: ["about.md", "projects.txt", "open-source.md", "github.url", "contact.card"],
  },
  "~/robot-car": {
    dirs: [],
    files: ["README.md", "robot-car.log", "wiring.txt"],
  },
  "~/hackathons": {
    dirs: [],
    files: ["README.md", "rap-battle-maker.md", "pawbot.md", "hackathons.json"],
  },
  "~/submarine": {
    dirs: [],
    files: ["README.md", "submarine-notes.md"],
  },
  "~/grades": {
    dirs: [],
    files: ["grades.csv"],
  },
  "~/randomstuff": {
    dirs: [],
    files: ["README.md", "tiny-tools.md", "ideas.txt"],
  },
};

const projectCards = [
  {
    title: "Robot Car",
    desc: "A compact autonomous car concept with sensors, steering logic, calibration notes, and a dashboard mindset.",
    tags: ["Arduino", "sensors", "control"],
  },
  {
    title: "Submarine",
    desc: "A small underwater build idea focused on buoyancy, watertight electronics, thrusters, and careful testing.",
    tags: ["marine", "CAD", "physics"],
  },
  {
    title: "Hackathons",
    desc: "Fast prototypes, clean demos, and practical ideas shipped under pressure with a team.",
    tags: ["prototype", "pitch", "teamwork"],
  },
  {
    title: "Random Stuff",
    desc: "Small utilities, weird experiments, browser toys, scripts, notes, and ideas too good to delete.",
    tags: ["experiments", "web", "fun"],
  },
];

const commands = {
  "/help": () => renderHelp(),
  "help": () => renderHelp(),
  "/whoami": () => [
    text("Yo! My names Henry, im a 13 year old entrupener.", "output-block"),
    text("Main lane is building software, tho love robotics, open source, hackathons, and school projects.", "output-block"),
    text("Made some open source contributions to platforms such as OpenClaw, Ollama, Astro, Appwrite, and Grafana.", "output-block"),
    text("Try /robot-car, /submarine, /hackathons, /grades, /github, or /randomstuff.", "accent-cyan"),
  ],
  "/whoamii": () => commands["/whoami"](),
  "ls": () => listDirectory(),
  "dir": () => commands.ls(),
  "pwd": () => text(state.cwd, "output-block"),
  "cat projects.txt": () => (state.cwd === "~" ? renderCards(projectCards) : readFile("projects.txt")),
  "/projects": () => renderCards(projectCards),
  "/robot-car": () =>
    renderDetail("robot-car.log", [
      [
        "mission",
        "lowkey needed smth to chase my dogs around because I was too busy building stuff, so I built S.I.E.G.E. (Self-Intelligent Entity for Guided Exploration).",
      ],
      ["next", "Gonna make it lower latency, add route replay, and clean up the wiring."],
      ["wiring", "Looks worse than those comical wiring jobs."],
    ]),
  "/hackathons": () =>
    renderDetail("hackathons.json", [
      ["style", "Make the demo understandable in ten seconds, then make the internals surprisingly solid."],
      ["Rap Battle Maker", "Makes a rap battle between any 2 ppl."],
      ["PawBot", "Helps seniors navigate computers."],
      ["role", "Built the entire thing."],
    ]),
  "/submarine": () =>
    renderDetail("submarine-notes.md", [
      ["goal", "Explore a small remotely operated submarine concept that survives real water, not just diagrams."],
      ["focus", "Buoyancy, seals, wiring, thrust, battery safety, and test plans before the scary part."],
      ["vibe", "Less sci-fi submarine, more careful engineering notebook with a very cool payoff."],
    ]),
  "/grades": () =>
    renderDetail("grades.csv", [
      ["Math", "99.5"],
      ["PE", "99"],
      ["Science", "97"],
      ["Spanish", "94"],
      ["English", "95"],
      ["History", "96.3"],
    ]),
  "/github": () => renderGithub(),
  "/opensource": () => renderGithub(),
  "/typing-game": () => startTypingGame(),
  "/type-game": () => startTypingGame(),
  "/hire-game": () => startHireGame(),
  "/hire": () => startHireGame(),
  "/randomstuff": () =>
    renderCards([
      {
        title: "Tiny Tools",
        desc: "One-evening utilities that solve a problem before the problem gets dramatic.",
        tags: ["scripts", "browser", "automation"],
      },
      {
        title: "Design Experiments",
        desc: "Interfaces, micro-interactions, terminal tricks, and polished details.",
        tags: ["UI", "motion", "details"],
      },
      {
        title: "Build Notes",
        desc: "Photos, part lists, test logs, and the honest middle stage where projects become real.",
        tags: ["notes", "logs", "iteration"],
      },
      {
        title: "Odd Ideas",
        desc: "Half serious concepts kept around because they might become the next project.",
        tags: ["ideas", "sketches", "what-if"],
      },
    ]),
  "/skills": () =>
    renderDetail("skills.md", [
      ["hardware", "Sensors, microcontrollers, soldering basics, CAD thinking, and mechanical debugging."],
      ["software", "HTML, CSS, JavaScript, Python, data dashboards, small automations, and API experiments."],
      ["people", "Hackathon teamwork, explaining tradeoffs, demo writing, and keeping calm when the build gets spicy."],
    ]),
  "/timeline": () =>
    renderDetail("timeline.log", [
      ["now", "Building a cleaner portfolio and collecting project evidence."],
      ["recent", "Robot car, submarine planning, hackathon prototypes, and grade highlights."],
      ["next", "Publish deeper case studies with photos, diagrams, and demo videos."],
    ]),
  "/contact": () =>
    renderDetail("contact.card", [
      ["phone", "925 962 7535"],
      ["email", "henrybrewer00@gmail.com"],
      ["github", "github.com/henrybrewer00-dotcom"],
      ["note", "Best way to reach me is phone or email."],
    ]),
  "/now": () => text("Current status: polishing project writeups, building things that move, and making this portfolio feel alive.", "output-block"),
  "/stack": () =>
    text("JavaScript · Python · Arduino · CAD · Git · sensors · web UI · data visualization · duct-tape-level persistence", "output-block"),
  "/black": () => text("black only. no fake window, no theme switch, no decorative glow.", "output-block"),
  "/minimal": () => text("one page, one input, plain text, sharp edges. the content does the work.", "output-block"),
  "clear": () => {
    state.game = null;
    stopGameTimer();
    input.placeholder = "type a command";
    output.innerHTML = "";
    return null;
  },
  "/clear": () => commands.clear(),
  "history": () => text(state.history.map((item, index) => `${index + 1}  ${item}`).join("\n") || "No commands yet.", "output-block"),
  "date": () => text(new Date().toLocaleString(undefined, { dateStyle: "full", timeStyle: "short" }), "output-block"),
  "/resume": () => text("wow, already here.", "output-block"),
  "resume": () => commands["/resume"](),
  "open resume": () => commands["/resume"](),
  "sudo make me cool": () => text("Permission denied: already cool enough. Try /projects.", "accent-green"),
};

function text(content, className = "output-block") {
  const pre = document.createElement("pre");
  pre.className = className;
  pre.textContent = content;
  return pre;
}

function renderHelp() {
  const wrap = document.createElement("div");
  wrap.className = "command-grid";

  commandList.forEach(([name, description]) => {
    const item = document.createElement("div");
    item.className = "command-item";
    item.innerHTML = `<span class="command-name">${escapeHtml(name)}</span><span class="command-desc">${escapeHtml(description)}</span>`;
    wrap.append(item);
  });

  return wrap;
}

function renderCards(cards) {
  const grid = document.createElement("div");
  grid.className = "card-grid";

  cards.forEach((card) => {
    const article = document.createElement("article");
    article.className = "project-card";
    article.innerHTML = `
      <h3>${escapeHtml(card.title)}</h3>
      <p>${escapeHtml(card.desc)}</p>
      <div class="tag-row">${card.tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}</div>
    `;
    grid.append(article);
  });

  return grid;
}

function renderDetail(title, rows) {
  const block = document.createElement("div");
  block.className = "output-block";
  const heading = document.createElement("p");
  heading.innerHTML = `<strong>${escapeHtml(title)}</strong>`;
  block.append(heading);

  rows.forEach(([key, value]) => {
    const row = document.createElement("p");
    row.innerHTML = `<span class="accent-cyan">${escapeHtml(key)}</span>: ${escapeHtml(value)}`;
    block.append(row);
  });

  return block;
}

function listDirectory() {
  const node = fileSystem[state.cwd];
  const dirs = node.dirs.map((dir) => `${dir}/`);
  return text([...dirs, ...node.files].join("    "), "output-block");
}

function changeDirectory(rawTarget) {
  const target = rawTarget.trim() || "~";
  let nextPath;

  if (target === "~" || target === "/" || target === "home") {
    nextPath = "~";
  } else if (target === "..") {
    nextPath = state.cwd === "~" ? "~" : "~";
  } else if (target.startsWith("~/")) {
    nextPath = target;
  } else {
    nextPath = state.cwd === "~" ? `~/${target.replace(/\/$/, "")}` : `${state.cwd}/${target.replace(/\/$/, "")}`;
  }

  if (!fileSystem[nextPath]) return text(`cd: ${target}: no such directory`, "line error");
  state.cwd = nextPath;
  updatePrompt();
  return text(state.cwd, "output-block");
}

function readFile(rawName) {
  const name = rawName.trim();
  const node = fileSystem[state.cwd];
  if (!node.files.includes(name)) return text(`cat: ${name}: file not found`, "line error");

  if (state.cwd === "~" && name === "projects.txt") return renderCards(projectCards);
  if (state.cwd === "~" && name === "open-source.md") return renderGithub();
  if (state.cwd === "~" && name === "github.url") return text("https://github.com/henrybrewer00-dotcom", "output-block");
  if (state.cwd === "~" && name === "contact.card") return commands["/contact"]();
  if (state.cwd === "~" && name === "about.md") return commands["/whoami"]();
  if (state.cwd === "~/robot-car") return commands["/robot-car"]();
  if (state.cwd === "~/hackathons") return commands["/hackathons"]();
  if (state.cwd === "~/submarine") return commands["/submarine"]();
  if (state.cwd === "~/grades") return commands["/grades"]();
  if (state.cwd === "~/randomstuff") return commands["/randomstuff"]();

  return text(`${name}: nothing written yet.`, "output-block");
}

function renderGithub() {
  const block = document.createElement("div");
  block.className = "output-block";
  block.innerHTML = `
    <p><strong>github.url</strong></p>
    <p><a class="output-link" href="https://github.com/henrybrewer00-dotcom" target="_blank" rel="noreferrer">github.com/henrybrewer00-dotcom</a></p>
    <p>Made some open source contributions to platforms such as OpenClaw, Ollama, Astro, Appwrite, and Grafana.</p>
  `;
  return block;
}

function renderNano(rawTarget) {
  const target = rawTarget.trim() || "untitled";
  const knownNotes = {
    grades: ["Straight A's", "Math: 99.5", "Science / engineering / CS / math focus"],
    "grades.csv": ["subject,grade", "math,99.5", "overall,straight A's"],
    github: ["github.com/henrybrewer00-dotcom", "Open source: OpenClaw, Ollama, Astro, Appwrite, Grafana"],
    "open-source.md": ["# open source", "Made some open source contributions to OpenClaw, Ollama, Astro, Appwrite, and Grafana."],
    "robot-car": ["# robot-car", "Sensors, steering logic, calibration, route replay ideas."],
    randomstuff: ["# randomstuff", "Tiny tools, web experiments, half-serious ideas."],
    submarine: ["# submarine", "Buoyancy, seals, thrusters, battery safety, test plans."],
  };
  const lines = knownNotes[target] || [
    `# ${target}`,
    "New folder note opened.",
    "Type any /nano name and this portfolio will make a readable note for it.",
  ];

  const block = document.createElement("div");
  block.className = "nano-window";
  block.innerHTML = `
    <div class="nano-bar">GNU nano 7.2 <span>${escapeHtml(target)}</span></div>
    <pre>${escapeHtml(lines.join("\n"))}</pre>
    <div class="nano-footer">^G help   ^O write out   ^X exit</div>
  `;
  return block;
}

function startTypingGame() {
  const phrase = "software robots and open source ship faster when you stay curious";
  state.game = {
    type: "typing",
    phrase,
    ready: true,
    start: null,
  };
  input.placeholder = "type start";

  const block = document.createElement("div");
  block.className = "game-card";
  block.innerHTML = `
    <p><strong>typing-game</strong></p>
    <p>Try your hand at outtyping a 13 year old. Henry types at 125 WPM.</p>
    <p class="game-target">${escapeHtml(phrase)}</p>
    <p>Type <strong>start</strong> when you are ready. Timer starts after that.</p>
  `;
  return block;
}

function startHireGame() {
  state.game = {
    type: "hire",
    step: 0,
    ready: true,
    start: null,
    expected: ["mkdir henry", "cd henry", "touch file", "echo hire_henry=true > file"],
  };
  input.placeholder = "type start";

  const block = document.createElement("div");
  block.className = "game-card";
  block.innerHTML = `
    <p><strong>hire-game</strong></p>
    <p>Set up a new directory, cd into it, create a file named <strong>file</strong>, then put <strong>hire_henry=true</strong> inside.</p>
    <p>No command list. Type <strong>start</strong> when you are ready. Timer starts after that.</p>
  `;
  return block;
}

function handleGameInput(command) {
  if (state.game.ready) return armGame(command);
  if (state.game.type === "typing") return finishTypingGame(command);
  if (state.game.type === "hire") return advanceHireGame(command);
  return text("game state got weird. type /clear and try again.", "line error");
}

function armGame(command) {
  if (command !== "start") return text("type start when you are ready.", "line error");
  state.game.ready = false;
  state.game.start = Date.now();

  if (state.game.type === "typing") {
    startGameTimer("typing duel");
    input.placeholder = "type the sentence exactly";
    return text("timer started. type the target sentence now.", "output-block");
  }

  startGameTimer("hire challenge");
  input.placeholder = state.game.expected[0];
  return text("timer started. build it.", "output-block");
}

function finishTypingGame(command) {
  const elapsedMs = Math.max(Date.now() - state.game.start, 1000);
  const elapsedMinutes = elapsedMs / 60000;
  const words = state.game.phrase.trim().split(/\s+/).length;
  const wpm = Math.round(words / elapsedMinutes);
  const accuracy = getAccuracy(command, state.game.phrase);
  const won = wpm >= 125 && accuracy >= 90;
  stopGameTimer();
  state.game = null;
  input.placeholder = "type a command";

  return renderDetail("typing-game.result", [
    ["wpm", `${wpm}`],
    ["accuracy", `${accuracy}%`],
    ["target", "125 WPM"],
    ["result", won ? "Wow, so proud of you. You outtyped a 13 year old." : "damm you lost to a 13 year old."],
  ]);
}

function advanceHireGame(command) {
  const expected = state.game.expected[state.game.step];
  if (command !== expected) {
    return text("not it. think like a shell.", "line error");
  }

  state.game.step += 1;
  if (state.game.step < state.game.expected.length) {
    const next = state.game.expected[state.game.step];
    input.placeholder = next;
    return text(`ok. step ${state.game.step}/4 complete.`, "output-block");
  }

  const elapsedSeconds = ((Date.now() - state.game.start) / 1000).toFixed(1);
  stopGameTimer();
  state.game = null;
  input.placeholder = "type a command";
  return renderDetail("hire-game.complete", [
    ["file", "hire_henry=true"],
    ["time", `${elapsedSeconds}s`],
    ["result", "directory built. file created. hire flag enabled."],
  ]);
}

function getAccuracy(inputValue, targetValue) {
  const length = Math.max(inputValue.length, targetValue.length, 1);
  let matches = 0;
  for (let index = 0; index < length; index += 1) {
    if (inputValue[index] === targetValue[index]) matches += 1;
  }
  return Math.round((matches / length) * 100);
}

function startGameTimer(label) {
  stopGameTimer();
  gameTimer.classList.add("active");
  gameTimer.textContent = `${label}: 0.0s`;
  state.timerId = window.setInterval(() => {
    if (!state.game) return;
    const elapsedSeconds = ((Date.now() - state.game.start) / 1000).toFixed(1);
    gameTimer.textContent = `${label}: ${elapsedSeconds}s`;
  }, 100);
}

function stopGameTimer() {
  if (state.timerId) window.clearInterval(state.timerId);
  state.timerId = null;
  gameTimer.classList.remove("active");
  gameTimer.textContent = "";
}

function runCommand(rawCommand) {
  const command = rawCommand.trim();
  if (!command) return;
  openTerminalView();

  state.history.push(command);
  state.historyIndex = state.history.length;
  appendLine(`${state.cwd} $ ${command}`, "line command");

  let response;
  if (state.game && command !== "/clear" && command !== "clear") {
    response = handleGameInput(command);
  } else if (commands[command]) {
    response = commands[command]();
  } else if (command === "cd") {
    response = changeDirectory("~");
  } else if (command.startsWith("cd ")) {
    response = changeDirectory(command.slice(3));
  } else if (command.startsWith("/nano")) {
    response = renderNano(command.replace(/^\/nano\s*/, ""));
  } else if (command.startsWith("echo ")) {
    response = text(command.slice(5), "output-block");
  } else if (command.startsWith("cat ")) {
    response = readFile(command.slice(4));
  } else {
    response = text(`Command not found: ${command}. Type /help for the map.`, "line error");
  }

  appendResponse(response);
  input.value = "";
  output.scrollTop = output.scrollHeight;
  focusInput();
}

function appendLine(content, className) {
  const p = document.createElement("p");
  p.className = className;
  p.textContent = content;
  output.append(p);
}

function appendResponse(response) {
  if (!response) return;
  if (Array.isArray(response)) {
    response.forEach((node) => output.append(node));
    return;
  }
  output.append(response);
}

function boot() {
  appendLine("henry.txt", "line dim");
  appendLine("type /help, or just start typing", "line type-cursor");
  updatePrompt();
}

function autocomplete() {
  const value = input.value.trim();
  if (!value) return;
  const current = fileSystem[state.cwd];
  const all = [...commandList.map(([name]) => name), ...Object.keys(commands), ...current.dirs, ...current.files];
  const match = all.find((item) => item.startsWith(value));
  if (match) input.value = match;
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (char) => {
    const map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" };
    return map[char];
  });
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  runCommand(input.value);
});

input.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    runCommand(input.value);
  }

  if (event.key === "ArrowUp") {
    event.preventDefault();
    state.historyIndex = Math.max(0, state.historyIndex - 1);
    input.value = state.history[state.historyIndex] || "";
  }

  if (event.key === "ArrowDown") {
    event.preventDefault();
    state.historyIndex = Math.min(state.history.length, state.historyIndex + 1);
    input.value = state.history[state.historyIndex] || "";
  }

  if (event.key === "Tab") {
    event.preventDefault();
    autocomplete();
  }
});

document.querySelectorAll("[data-command]").forEach((button) => {
  button.addEventListener("click", () => {
    openTerminalView();
    runCommand(button.dataset.command);
  });
});

openTerminal.addEventListener("click", () => {
  if (state.terminalOpen) {
    closeTerminalView();
    return;
  }
  openTerminalView();
  focusInput();
});

document.addEventListener("keydown", (event) => {
  const tag = document.activeElement.tagName;
  if (tag !== "INPUT" && tag !== "TEXTAREA" && event.key.length === 1) {
    focusInput();
  }
});

function focusInput() {
  if (!window.matchMedia("(pointer: fine)").matches) return;
  input.focus({ preventScroll: true });
}

function updatePrompt() {
  promptLabel.textContent = `${state.cwd} $`;
}

function openTerminalView() {
  if (state.terminalOpen) return;
  state.terminalOpen = true;
  pageShell.classList.remove("terminal-closed");
  pageShell.classList.add("terminal-open");
  openTerminal.textContent = "home";
}

function closeTerminalView() {
  state.terminalOpen = false;
  pageShell.classList.remove("terminal-open");
  pageShell.classList.add("terminal-closed");
  openTerminal.textContent = "open terminal";
  stopGameTimer();
  state.game = null;
  input.placeholder = "type a command";
  window.scrollTo({ top: 0, left: 0 });
}

boot();
if (state.terminalOpen) focusInput();
window.scrollTo({ top: 0, left: 0 });
