import { createContext, useContext, useEffect, useMemo, useReducer, useRef } from 'react'
import { normalizePlayer, normalizePlayers, slugify, uniqueId } from '../lib/data'
import { loadState, saveState, loadApiKey, saveApiKey } from '../lib/storage'

const DraftContext = createContext(null)

// Which slices of state get persisted to localStorage.
const PERSIST_KEYS = [
  'statuses',
  'heartsOverride',
  'notesOverride',
  'edits',
  'customPlayers',
  'importedPlayers',
  'events',
  'watchList',
  'teams',
  'theme',
]

const initialState = {
  players: [],         // loaded from the file (baked-in base board)
  loaded: false,
  error: null,
  statuses: {},        // id -> 'available' | 'mine' | 'gone'
  heartsOverride: {},  // id -> number (user override of player.hearts)
  notesOverride: {},   // id -> string (user override of player.notes)
  edits: {},           // id -> partial player fields (in-app edits)
  customPlayers: [],   // players added in-app
  importedPlayers: null, // a full imported board that overrides the file
  events: [],          // ordered list of player ids as they leave the board
  watchList: [],       // [{ name, ts }]
  teams: 12,
  theme: 'system',     // 'system' | 'light' | 'dark'
  compareIds: [],      // ephemeral: up to 3 ids for Compare mode
  apiKey: '',          // AI key — NOT persisted with the board; stored separately
}

// All ids currently in use, so new/imported players never collide.
function takenIds(state) {
  const ids = new Set()
  const base = state.importedPlayers && state.importedPlayers.length ? state.importedPlayers : state.players
  for (const p of base) ids.add(p.id)
  for (const p of state.customPlayers || []) ids.add(p.id)
  return ids
}

function withEvent(events, id, status) {
  const exists = events.includes(id)
  if (status === 'available') {
    return exists ? events.filter((e) => e !== id) : events
  }
  return exists ? events : [...events, id]
}

function reducer(state, action) {
  switch (action.type) {
    case 'INIT_PLAYERS': {
      const players = action.players
      // Seed statuses from the file only when we have no saved draft yet.
      let statuses = state.statuses
      if (!statuses || Object.keys(statuses).length === 0) {
        statuses = {}
        for (const p of players) {
          if (p.seedStatus && p.seedStatus !== 'available') statuses[p.id] = p.seedStatus
        }
      }
      return { ...state, players, statuses, loaded: true, error: null }
    }
    case 'LOAD_ERROR':
      return { ...state, error: action.error, loaded: true }
    case 'HYDRATE':
      return { ...state, ...action.state }

    case 'SET_STATUS': {
      const { id, status } = action
      const statuses = { ...state.statuses }
      if (status === 'available') delete statuses[id]
      else statuses[id] = status
      return { ...state, statuses, events: withEvent(state.events, id, status) }
    }
    case 'UNDO_LAST': {
      if (state.events.length === 0) return state
      const events = state.events.slice(0, -1)
      const lastId = state.events[state.events.length - 1]
      const statuses = { ...state.statuses }
      delete statuses[lastId]
      return { ...state, events, statuses }
    }
    case 'RESET_DRAFT':
      return { ...state, statuses: {}, events: [] }

    case 'SET_HEARTS': {
      const heartsOverride = { ...state.heartsOverride, [action.id]: action.value }
      return { ...state, heartsOverride }
    }
    case 'SET_NOTES': {
      const notesOverride = { ...state.notesOverride, [action.id]: action.text }
      return { ...state, notesOverride }
    }
    case 'TOGGLE_COMPARE': {
      const has = state.compareIds.includes(action.id)
      if (has) return { ...state, compareIds: state.compareIds.filter((i) => i !== action.id) }
      if (state.compareIds.length >= 3) return state
      return { ...state, compareIds: [...state.compareIds, action.id] }
    }
    case 'CLEAR_COMPARE':
      return { ...state, compareIds: [] }
    case 'SET_TEAMS':
      return { ...state, teams: Math.max(2, Math.min(20, action.teams)) }
    case 'SET_THEME':
      return { ...state, theme: action.theme }

    case 'ADD_WATCH': {
      const name = action.name.trim()
      if (!name) return state
      if (state.watchList.some((w) => w.name.toLowerCase() === name.toLowerCase())) return state
      return { ...state, watchList: [...state.watchList, { name, ts: action.ts }] }
    }
    case 'REMOVE_WATCH':
      return { ...state, watchList: state.watchList.filter((w) => w.name !== action.name) }

    case 'ADD_PLAYER': {
      const player = normalizePlayer(action.record)
      player.id = uniqueId(slugify(player.name) || 'player', takenIds(state))
      // Adding a player also clears them off any watch list by the same name.
      const watchList = state.watchList.filter(
        (w) => w.name.toLowerCase() !== player.name.toLowerCase()
      )
      return { ...state, customPlayers: [...state.customPlayers, player], watchList }
    }
    case 'UPDATE_PLAYER': {
      const clean = normalizePlayer({ id: action.id, ...action.fields })
      // Keep only the fields the editor actually set (plus id passthrough).
      const patch = {}
      for (const k of Object.keys(action.fields)) patch[k] = clean[k]
      // If it's a custom player, edit it in place; otherwise store an override.
      if (state.customPlayers.some((c) => c.id === action.id)) {
        const customPlayers = state.customPlayers.map((c) =>
          c.id === action.id ? { ...c, ...patch } : c
        )
        return { ...state, customPlayers }
      }
      return { ...state, edits: { ...state.edits, [action.id]: { ...state.edits[action.id], ...patch } } }
    }
    case 'DELETE_PLAYER': {
      const customPlayers = state.customPlayers.filter((c) => c.id !== action.id)
      const importedPlayers = state.importedPlayers
        ? state.importedPlayers.filter((c) => c.id !== action.id)
        : state.importedPlayers
      const statuses = { ...state.statuses }
      delete statuses[action.id]
      const edits = { ...state.edits }
      delete edits[action.id]
      return {
        ...state,
        customPlayers,
        importedPlayers,
        statuses,
        edits,
        events: state.events.filter((id) => id !== action.id),
      }
    }
    case 'IMPORT_REPLACE': {
      const importedPlayers = normalizePlayers(action.list)
      // Seed statuses from the imported file for anything not already tracked.
      const statuses = { ...state.statuses }
      for (const p of importedPlayers) {
        if (p.seedStatus && p.seedStatus !== 'available' && !statuses[p.id]) statuses[p.id] = p.seedStatus
      }
      return { ...state, importedPlayers, customPlayers: [], edits: {}, statuses }
    }
    case 'IMPORT_MERGE': {
      const incoming = normalizePlayers(action.list)
      const existing = new Map(
        [...(state.importedPlayers && state.importedPlayers.length ? state.importedPlayers : state.players),
        ...state.customPlayers].map((p) => [p.name.toLowerCase(), p])
      )
      const taken = takenIds(state)
      const additions = []
      const edits = { ...state.edits }
      for (const p of incoming) {
        const match = existing.get(p.name.toLowerCase())
        if (match) {
          // Update evaluation fields on the matched player.
          edits[match.id] = {
            ...edits[match.id],
            juice: p.juice,
            role: p.role,
            trend: p.trend,
            draftWindow: p.draftWindow,
            points2025: p.points2025,
            why: p.why,
            bye: p.bye,
            team: p.team,
            position: p.position,
          }
        } else {
          p.id = uniqueId(slugify(p.name) || 'player', taken)
          taken.add(p.id)
          additions.push(p)
        }
      }
      return { ...state, customPlayers: [...state.customPlayers, ...additions], edits }
    }
    case 'SET_API_KEY':
      return { ...state, apiKey: action.key }
    case 'CLEAR_DATA':
      // Reset imported/custom players and all edits back to the baked-in file.
      return {
        ...state,
        importedPlayers: null,
        customPlayers: [],
        edits: {},
        heartsOverride: {},
        notesOverride: {},
      }

    default:
      return state
  }
}

export function DraftProvider({ children }) {
  // Hydrate persisted slices synchronously so there's no flash of empty state.
  const [state, dispatch] = useReducer(reducer, initialState, (init) => {
    const saved = loadState()
    const hydrated = saved ? { ...init, ...pick(saved, PERSIST_KEYS) } : init
    return { ...hydrated, apiKey: loadApiKey() }
  })

  // Load the player database (offline JSON) once.
  const didLoad = useRef(false)
  useEffect(() => {
    if (didLoad.current) return
    didLoad.current = true
    const base = import.meta.env.BASE_URL || '/'
    fetch(`${base}players.json`)
      .then((r) => {
        if (!r.ok) throw new Error(`Could not load players.json (${r.status})`)
        return r.json()
      })
      .then((list) => dispatch({ type: 'INIT_PLAYERS', players: normalizePlayers(list) }))
      .catch((err) => dispatch({ type: 'LOAD_ERROR', error: err.message }))
  }, [])

  // Persist the relevant slices whenever they change.
  useEffect(() => {
    saveState(pick(state, PERSIST_KEYS))
  }, PERSIST_KEYS.map((k) => state[k])) // eslint-disable-line react-hooks/exhaustive-deps

  // Persist the AI key on its own — deliberately excluded from the board blob
  // and from Export, so it never leaves this browser.
  useEffect(() => {
    saveApiKey(state.apiKey)
  }, [state.apiKey])

  // Apply theme to <html data-theme>.
  useEffect(() => {
    const root = document.documentElement
    if (state.theme === 'system') root.removeAttribute('data-theme')
    else root.setAttribute('data-theme', state.theme)
  }, [state.theme])

  const value = useMemo(() => ({ state, dispatch }), [state])
  return <DraftContext.Provider value={value}>{children}</DraftContext.Provider>
}

export function useDraft() {
  const ctx = useContext(DraftContext)
  if (!ctx) throw new Error('useDraft must be used within DraftProvider')
  return ctx
}

function pick(obj, keys) {
  const out = {}
  for (const k of keys) if (obj[k] !== undefined) out[k] = obj[k]
  return out
}
