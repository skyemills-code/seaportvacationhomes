import { useDraft } from '../context/DraftContext'

// Convenience dispatchers shared across components. No confirmations — one
// click drafts or removes a player, per the sub-10-second workflow.
export function useActions() {
  const { dispatch } = useDraft()
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
  }
}
