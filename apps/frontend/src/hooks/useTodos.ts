import { useCallback, useMemo, useSyncExternalStore, useState } from "react";
import { Todo } from "@/types/todo";
import { generateId } from "@/lib/utils";
import { StorageLib } from "@/lib/storage";

const STORAGE_KEY = "demo_todos_state";

export type TodoFilter = "all" | "active" | "completed";

export interface TodoStats {
  total: number;
  completed: number;
  active: number;
}

/* External store for SSR-safe localStorage subscription */
let lastRaw: string | null = null;
let lastParsed: Todo[] = [];

function getClientSnapshot(): Todo[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === lastRaw) return lastParsed;
    lastRaw = raw;
    lastParsed = raw ? (JSON.parse(raw) as Todo[]) : [];
    return lastParsed;
  } catch {
    return lastParsed;
  }
}

function subscribe(callback: () => void) {
  const handler = () => {
    // invalidate cache so next getClientSnapshot re-reads
    lastRaw = null;
    callback();
  };
  window.addEventListener("storage", handler);
  return () => window.removeEventListener("storage", handler);
}

function notify() {
  // invalidate cache before dispatching so subscribers pick up new data
  lastRaw = null;
  window.dispatchEvent(new StorageEvent("storage"));
}

export function useTodos(initialTodos: Todo[] = []) {
  const storeTodos = useSyncExternalStore(
    subscribe,
    getClientSnapshot,
    () => initialTodos
  );

  /* Filter is local UI state, not persisted */
  const [filter, setFilter] = useState<TodoFilter>("all");

  const setTodos = useCallback((updater: (prev: Todo[]) => Todo[]) => {
    const current = StorageLib.get<Todo[]>(STORAGE_KEY, []);
    const next = updater(current);
    StorageLib.set(STORAGE_KEY, next);
    notify();
  }, []);

  const addTodo = useCallback((title: string) => {
    const trimmed = title.trim();
    if (!trimmed) return;
    const newTodo: Todo = {
      id: generateId(),
      title: trimmed,
      completed: false,
      createdAt: Date.now(),
    };
    setTodos((prev) => [newTodo, ...prev]);
  }, [setTodos]);

  const toggleTodo = useCallback((id: string) => {
    setTodos((prev) =>
      prev.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  }, [setTodos]);

  const removeTodo = useCallback((id: string) => {
    setTodos((prev) => prev.filter((todo) => todo.id !== id));
  }, [setTodos]);

  const editTodo = useCallback((id: string, newTitle: string) => {
    const trimmed = newTitle.trim();
    if (!trimmed) return;
    setTodos((prev) =>
      prev.map((todo) =>
        todo.id === id ? { ...todo, title: trimmed } : todo
      )
    );
  }, [setTodos]);

  const clearCompleted = useCallback(() => {
    setTodos((prev) => prev.filter((todo) => !todo.completed));
  }, [setTodos]);

  const filteredTodos = useMemo(() => {
    switch (filter) {
      case "active":
        return storeTodos.filter((t) => !t.completed);
      case "completed":
        return storeTodos.filter((t) => t.completed);
      default:
        return storeTodos;
    }
  }, [storeTodos, filter]);

  const stats: TodoStats = useMemo(
    () => ({
      total: storeTodos.length,
      completed: storeTodos.filter((t) => t.completed).length,
      active: storeTodos.filter((t) => !t.completed).length,
    }),
    [storeTodos]
  );

  return {
    todos: filteredTodos,
    allTodos: storeTodos,
    isLoaded: true,
    filter,
    setFilter,
    stats,
    addTodo,
    toggleTodo,
    removeTodo,
    editTodo,
    clearCompleted,
  };
}
