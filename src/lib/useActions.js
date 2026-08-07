import { useDraft } from '../context/DraftContext'
import { enrichPlayers } from './board'
import { denormalizePlayer } from './data'

// Convenience dispatchers shared across components. No confirmations — one
// click drafts or removes a player, per the sub-10-second workflow.
export function useActions() {
  const { state, dispatch } = useDraft()
  return {
    draftMine: (id) => dispatch({ type: 'SET_STATUS', id, status: 'mine' }),
    markGone: (id) => dispatch({ type: 'SET_STATUS', id, status: 'gone' }),
    makeAvailable: (id) => dispatch({ type: 'SET_STATUS', id, status: 'available' }),
    undo: () => dispatch({ type: 'UNDO_LAST' }),
    resetDraft: () => dispatch({ type: 'RESET_DRAFT' }),
    setHearts: (id, value) => dispatch({ type: 'SET_HEARTS', id, value }),
    cycleHearts: (id, current) => dispatch({ type: 'SET_HEARTS', id, value: (Number(current) + 1) % 4 }),
    setNotes: (id, text) => dispatch({ type: 'SET_NOTES', id, text }),
    toggleCompare: (id) => dispatch({ type: 'TOGGLE_COMPARE', id }),
    clearCompare: () => dispatch({ type: 'CLEAR_COMPARE' }),
    setTeams: (teams) => dispatch({ type: 'SET_TEAMS', teams }),
    setTheme: (theme) => dispatch({ type: 'SET_THEME', theme }),
    addWatch: (name, ts) => dispatch({ type: 'ADD_WATCH', name, ts: ts ?? Date.now() }),
    removeWatch: (name) => dispatch({ type: 'REMOVE_WATCH', name }),

    // Player data management (all local, no rebuild needed).
    addPlayer: (record) => dispatch({ type: 'ADD_PLAYER', record }),
    updatePlayer: (id, fields) => dispatch({ type: 'UPDATE_PLAYER', id, fields }),
    deletePlayer: (id) => dispatch({ type: 'DELETE_PLAYER', id }),
    importReplace: (list) => dispatch({ type: 'IMPORT_REPLACE', list }),
    importMerge: (list) => dispatch({ type: 'IMPORT_MERGE', list }),
    clearData: () => dispatch({ type: 'CLEAR_DATA' }),

    // Build the current board as an array in the on-disk schema.
    exportBoard: () => enrichPlayers(state).map(denormalizePlayer),
  }
}
