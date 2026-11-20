import { signal, computed, For, Show, type ReadonlySignal } from "@snoofox/reax";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";

type ColumnId = "backlog" | "progress" | "done";
type Priority = "low" | "medium" | "high";

interface Task {
  id: number;
  title: string;
  tag: string;
  priority: Priority;
  column: ColumnId;
}

interface Column {
  id: ColumnId;
  title: string;
  tasks: ReadonlySignal<Task[]>;
  count: ReadonlySignal<number>;
}

const COLUMN_ORDER: ColumnId[] = ["backlog", "progress", "done"];
const TAGS = ["Research", "Engineering", "Writing", "Design"];

const INITIAL_TASKS: Task[] = [
  { id: 1, title: "Define the reactivity model", tag: "Research", priority: "high", column: "backlog" },
  { id: 2, title: "Wire signals directly to DOM nodes", tag: "Engineering", priority: "high", column: "progress" },
  { id: 3, title: "Document control flow components", tag: "Writing", priority: "medium", column: "done" },
  { id: 4, title: "Benchmark 10,000 row updates", tag: "Engineering", priority: "medium", column: "done" },
];

let nextTaskId = INITIAL_TASKS.length + 1;

export function KanbanShowcase() {
  const tasks = signal<Task[]>(INITIAL_TASKS);
  const newTaskTitle = signal("");
  const draggedId = signal<number | null>(null);

  const columns: Column[] = [
    {
      id: "backlog",
      title: "Backlog",
      tasks: computed(() => tasks().filter((task) => task.column === "backlog")),
      count: computed(() => tasks().filter((task) => task.column === "backlog").length),
    },
    {
      id: "progress",
      title: "In Progress",
      tasks: computed(() => tasks().filter((task) => task.column === "progress")),
      count: computed(() => tasks().filter((task) => task.column === "progress").length),
    },
    {
      id: "done",
      title: "Done",
      tasks: computed(() => tasks().filter((task) => task.column === "done")),
      count: computed(() => tasks().filter((task) => task.column === "done").length),
    },
  ];

  const total = computed(() => tasks().length);
  const doneCount = computed(() => tasks().filter((task) => task.column === "done").length);
  const progressPct = computed(() => (total() === 0 ? 0 : Math.round((doneCount() / total()) * 100)));

  const moveTaskById = (id: number, column: ColumnId) => {
    tasks((prev) => prev.map((task) => (task.id === id ? { ...task, column } : task)));
  };

  const moveTask = (task: Task, direction: -1 | 1) => {
    const nextIndex = COLUMN_ORDER.indexOf(task.column) + direction;
    const nextColumn = COLUMN_ORDER[nextIndex];
    if (nextColumn) moveTaskById(task.id, nextColumn);
  };

  const deleteTask = (id: number) => {
    tasks((prev) => prev.filter((task) => task.id !== id));
  };

  const addTask = (e: Event) => {
    e.preventDefault();
    const title = newTaskTitle().trim();
    if (!title) return;

    tasks((prev) => [
      ...prev,
      {
        id: nextTaskId++,
        title,
        tag: TAGS[Math.floor(Math.random() * TAGS.length)],
        priority: "medium",
        column: "backlog",
      },
    ]);
    newTaskTitle("");
  };

  const handleDragStart = (task: Task) => (e: DragEvent) => {
    draggedId(task.id);
    if (e.dataTransfer) e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (column: ColumnId) => (e: DragEvent) => {
    e.preventDefault();
    const id = draggedId();
    if (id !== null) moveTaskById(id, column);
    draggedId(null);
  };

  const handleDragEnd = () => draggedId(null);

  return (
    <div class="page-container">
      <Header />
      <div class="page page--wide">
        <header class="page-header">
          <h1>Kanban Board</h1>
          <p class="tagline">Drag tasks between columns and watch the lists reconcile in place.</p>
        </header>

        <div class="kanban">
          <div class="kanban-toolbar">
            <form class="kanban-add" onSubmit={addTask}>
              <input
                type="text"
                class="kanban-input"
                value={newTaskTitle}
                onInput={(e) => newTaskTitle((e.target as HTMLInputElement).value)}
                placeholder="Add a task..."
                aria-label="New task title"
              />
              <button type="submit" class="btn btn-primary text-xs">
                Add task
              </button>
            </form>

            <div class="kanban-stats">
              <span>Total: <strong class="text-white">{total}</strong></span>
              <span>Done: <strong class="text-cyan">{doneCount}</strong></span>
              <div class="kanban-progress" aria-label={`${progressPct()}% complete`}>
                <div
                  class="kanban-progress-fill"
                  style={computed(() => `width: ${progressPct()}%`)}
                ></div>
              </div>
            </div>
          </div>

          <div class="kanban-board">
            {columns.map((column) => (
              <section
                class="kanban-column"
                onDragOver={handleDragOver}
                onDrop={handleDrop(column.id)}
              >
                <header class="kanban-column-head">
                  <span class={`kanban-dot kanban-dot--${column.id}`}></span>
                  <h2>{column.title}</h2>
                  <span class="kanban-count">{column.count}</span>
                </header>

                <div class="kanban-list">
                  <For each={column.tasks}>
                    {(task) => (
                      <article
                        class="kanban-card"
                        draggable="true"
                        onDragStart={handleDragStart(task)}
                        onDragEnd={handleDragEnd}
                      >
                        <div class="kanban-card-head">
                          <span class={`kanban-tag kanban-tag--${task.priority}`}>
                            {task.priority}
                          </span>
                          <button
                            type="button"
                            class="kanban-delete"
                            onClick={() => deleteTask(task.id)}
                            aria-label={`Delete ${task.title}`}
                          >
                            ×
                          </button>
                        </div>
                        <p class="kanban-card-title">{task.title}</p>
                        <div class="kanban-card-actions">
                          <button
                            type="button"
                            class="kanban-move"
                            disabled={task.column === "backlog"}
                            onClick={() => moveTask(task, -1)}
                            aria-label="Move left"
                          >
                            ←
                          </button>
                          <button
                            type="button"
                            class="kanban-move"
                            disabled={task.column === "done"}
                            onClick={() => moveTask(task, 1)}
                            aria-label="Move right"
                          >
                            →
                          </button>
                        </div>
                      </article>
                    )}
                  </For>

                  <Show when={computed(() => column.tasks().length === 0)}>
                    <div class="kanban-empty">Drop tasks here</div>
                  </Show>
                </div>
              </section>
            ))}
          </div>
        </div>

        <Footer />
      </div>
    </div>
  );
}
