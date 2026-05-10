# Why React would help this project

A short, beginner-friendly tour of what React is, why people reach for it, and whether it makes sense for TCG Card Maker specifically. Read this if the words "component" or "state management" still feel a little fuzzy.

## What we have today

The app is **Electron + vanilla HTML/CSS/JS**:

- `src/main.js` runs the desktop window and handles things only the OS can do (file dialogs, saving images to disk).
- `src/index.html` is the **renderer** — the actual UI. After our recent cleanup it's still about **4,300 lines**, of which roughly **3,800 are inline JavaScript**.
- The pure helpers (placeholder substitution, image lookup, snap math, sheet layout) now live in `src/renderer/core/*.js` and are imported by tests.

It works. It ships. So why even talk about React?

## Where the current stack starts to hurt

Look at how the renderer keeps the screen in sync with the data:

```js
let elements = [];       // the card's layers
let importedData = null; // rows from the spreadsheet
let imageStore = {};     // filename -> data URL

function addElement(preset) {
  elements.push({ id: uid(), ...preset });
  pushHistory();
  renderAll();           // <-- you, the human, must remember this
}
```

Every function that changes state has to remember to call `renderAll()`, `renderLayers()`, `renderProps()`, or `renderGuides()` afterward. Forget one, and the UI silently lies to the user. That's the **manual sync tax** — and it grows quadratically with features.

A few concrete symptoms of that tax in this codebase:

1. **State is global.** `elements`, `imageStore`, `importedData`, `history`, `currentRow`, `selectedId`… all sit at module scope. To know what a function depends on, you have to read it line by line.
2. **Rendering is imperative.** `document.getElementById('layers-list').innerHTML = '...'` builds HTML strings, then re-binds click handlers. Every render hand-manages DOM identity.
3. **Event listeners leak.** When you re-render layers, the old `<div>` nodes (and their click handlers) get thrown away — but only because you replaced `innerHTML`. The pattern is fragile and easy to get wrong.
4. **Tests stop at the DOM boundary.** We can unit-test `resolve()` and `getSheetLayout()` because we just extracted them. We **can't** unit-test "clicking the Duplicate button keeps the new element selected" without spinning up the whole app.

## What React would change

React's one big idea: **describe the UI as a function of state**, and let the framework figure out which parts of the DOM need to change.

You'd write something like:

```jsx
function LayersPanel({ elements, selectedId, onSelect, onDelete }) {
  return (
    <ul className="layers">
      {elements.map(el => (
        <li
          key={el.id}
          className={el.id === selectedId ? 'selected' : ''}
          onClick={() => onSelect(el.id)}
        >
          {el.label}
          <button onClick={() => onDelete(el.id)}>×</button>
        </li>
      ))}
    </ul>
  );
}
```

You never call `renderLayers()`. You change `elements` (via `setElements(...)`), React notices, and only the parts of the DOM that actually changed get updated.

### Concrete wins for this codebase

| Problem today | What React buys you |
| --- | --- |
| `renderAll()` calls scattered across 30+ functions | Gone. Change state, UI re-renders automatically. |
| 3,800-line inline `<script>` | Naturally splits into ~8–15 components (`CardCanvas`, `LayersPanel`, `PropertiesPanel`, `DataEditor`, `TemplatePicker`, `Toast`, `ContextMenu`, …). Each lives in its own file. |
| Undo/redo by snapshotting `elements` and re-rendering everything | Same shape, but trivial: state is already a plain object; libraries like Zustand or a tiny custom reducer handle history in ~50 lines. |
| Hard to test selection / drag / interaction logic | React Testing Library lets you fire a click and assert what the user sees. No browser, no Electron. |
| No hot reload during dev | Vite gives you sub-second feedback — change a component, see it in the running app immediately. |
| Adding a new property panel field means hand-writing more DOM and remembering to wire `onChange` + `renderProps()` | Add one line to a component, done. |

### Things you wouldn't lose

- **Electron still works the same.** React only changes the renderer. `main.js` (file dialogs, `capturePage`, project save) stays as-is. The IPC handlers are untouched.
- **Your pure logic is already React-ready.** `src/renderer/core/*.js` are pure functions — they'd import cleanly into a React component on day one.

## What it would cost

Honest list, not a sales pitch:

1. **A real build step.** You'd add Vite (or `electron-vite`) — `npm start` would run Vite in dev mode and Electron together. Today, opening `index.html` "just works" with no compilation. That simplicity is genuinely nice and you'd lose some of it.
2. **A rewrite, not a tweak.** The renderer is ~3,800 lines of imperative DOM code. Porting it incrementally is possible (mount a React tree inside one `<div>` and migrate piece by piece) but takes real time — probably weeks, not days.
3. **Bundle size.** React + ReactDOM adds ~140 KB gzipped. Inside an Electron app you don't really care, but it's a non-zero number.
4. **A new vocabulary.** Hooks (`useState`, `useEffect`, `useMemo`), keys, controlled vs uncontrolled inputs, refs, context. None of it is hard, but a newbie does have to learn it.
5. **Lock-in to an ecosystem.** Once you're in React, you start pulling in React-flavored libraries (state, routing, forms). Hard to back out later.

## When React is *not* the right answer for this kind of app

Worth saying out loud, because it's tempting to assume the popular thing is always right:

- **The app is "done enough."** If new features are rare and the team is small, the cost of the rewrite never pays back.
- **You like the zero-build simplicity.** A single HTML file you can open in a browser to debug is a real productivity win.
- **You're more comfortable in vanilla JS.** A confident vanilla codebase beats a shaky React one every time.

For this project, here's the honest read: the renderer is **at the size where the manual-sync tax is just starting to bite**, but it isn't catastrophic yet. The cleanup we just did — extracting CSS and pure logic — buys a lot of clarity for very little disruption. A reasonable next step before committing to React is to keep extracting: pull rendering functions into their own module, then pull state mutations into a small store. If *that* starts to feel like reinventing React, that's your signal it's time to switch.

## Suggested reading order if you decide to learn React

1. [react.dev/learn](https://react.dev/learn) — the official tutorial. Two hours.
2. The "Thinking in React" page on the same site — explains the mental model.
3. `electron-vite` docs — the standard way to combine React + Electron today.

Don't read about Redux, MobX, or Recoil yet. For an app this size, `useState` + a single `useReducer` for the elements array is more than enough.
