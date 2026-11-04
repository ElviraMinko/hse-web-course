const DRAG_TYPE = 'application/x-sprint-task';
const DESKTOP_QUERY = '(min-width: 721px) and (hover: hover) and (pointer: fine)';

function isDragAndDropSupported() {
  return 'draggable' in document.createElement('div') && typeof DataTransfer === 'function';
}

export function setupBoardDragAndDrop(container, { onMove, onAvailabilityChange }) {
  const supported = isDragAndDropSupported();
  const desktop = window.matchMedia(DESKTOP_QUERY);
  let active = supported && desktop.matches;
  let draggedId = null;
  let targetColumn = null;

  desktop.addEventListener('change', () => {
    active = supported && desktop.matches;
    onAvailabilityChange(active);
  });

  const findColumn = (node) => (node instanceof Element ? node.closest('[data-column]') : null);
  const isTaskDrag = (event) => draggedId !== null || event.dataTransfer.types.includes(DRAG_TYPE);

  function highlight(column) {
    if (column === targetColumn) return;
    targetColumn?.classList.remove('board-column-drop-target');
    targetColumn = column;
    targetColumn?.classList.add('board-column-drop-target');
  }

  function finishDrag() {
    highlight(null);
    container.querySelector('.task-card-dragging')?.classList.remove('task-card-dragging');
    draggedId = null;
  }

  container.addEventListener('dragstart', (event) => {
    const card = event.target.closest?.('.task-card[draggable="true"]');
    if (!active || !card) return;
    draggedId = card.dataset.taskId;
    event.dataTransfer.setData(DRAG_TYPE, draggedId);
    event.dataTransfer.setData('text/plain', card.querySelector('.task-card-link').textContent);
    event.dataTransfer.effectAllowed = 'move';
    requestAnimationFrame(() => card.classList.add('task-card-dragging'));
  });

  container.addEventListener('dragover', (event) => {
    const column = findColumn(event.target);
    if (!active || !column || !isTaskDrag(event)) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    highlight(column);
  });

  container.addEventListener('dragleave', (event) => {
    if (!targetColumn) return;
    const rect = targetColumn.getBoundingClientRect();
    const inside = event.clientX > rect.left && event.clientX < rect.right
      && event.clientY > rect.top && event.clientY < rect.bottom;
    if (!inside) highlight(null);
  });

  container.addEventListener('drop', (event) => {
    const column = findColumn(event.target);
    if (!active || !column || !isTaskDrag(event)) return;
    event.preventDefault();
    const taskId = draggedId ?? event.dataTransfer.getData(DRAG_TYPE);
    finishDrag();
    if (taskId) onMove(taskId, column.dataset.column);
  });

  container.addEventListener('dragend', finishDrag);

  return { isActive: () => active };
}
