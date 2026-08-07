import { createContext, useContext, useEffect, useMemo, useReducer, useRef } from 'react'
import { normalizePlayers } from '../lib/data'
import { loadState, saveState } from '../lib/storage'

const DraftContext = createContext(null)

// Which slices of state get persisted to localStorage.
const PERSIST_KEYS = ['statuses', 'heartsOverride', 'notesOverride', 'events', 'watchList', 'teams', 'theme']

const initialState = {
  players: [],
  loaded: false,
  error: null,
  statuses: {},        // id -> 'available' | 'mine' | 'gone'
  heartsOverride: {},  // id -> number (user override of player.hearts)
  notesOverride: {},   // id -> string (user override of player.notes)
  events: [],          // ordered list of player ids as they leave the board
  watchList: [],       // [{ name, ts }]
  teams: 12,
  theme: 'system',     // 'system' | 'light' | 'dark'
  compareIds: [],      // ephemeral: up to 3 ids for Compare mode
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

    default:
      return state
  }
}

export function DraftProvider({ children }) {
  // Hydrate persisted slices synchronously so there's no flash of empty state.
  const [state, dispatch] = useReducer(reducer, initialState, (init) => {
    const saved = loadState()
    return saved ? { ...init, ...pick(saved, PERSIST_KEYS) } : init
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
