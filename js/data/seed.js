

import { addDays, toISODate } from '../utils/date.js';

const day = (offset) => toISODate(addDays(new Date(), offset));

const hoursAgo = (hours) => new Date(Date.now() - hours * 3_600_000).toISOString();

const yesterdayAt = (hours, minutes) => {
  const date = addDays(new Date(), -1);
  date.setHours(hours, minutes, 0, 0);
  return date.toISOString();
};

export function createSeedData() {
  const members = [
    { id: 'm1', name: 'Аня Ковалёва', email: 'anya@sprint.team', role: 'admin', tone: 'indigo', lastSeenAt: hoursAgo(0), isCurrentUser: true },
    { id: 'm2', name: 'Миша Орлов', email: 'misha@sprint.team', role: 'member', tone: 'coral', lastSeenAt: hoursAgo(26) },
    { id: 'm3', name: 'Лёва Гринберг', email: 'lev@sprint.team', role: 'member', tone: 'green', lastSeenAt: hoursAgo(2) },
    { id: 'm4', name: 'Катя Петрова', email: 'katya@sprint.team', role: 'member', tone: 'amber', lastSeenAt: hoursAgo(6) },
    { id: 'm5', name: 'Дима Соколов', email: 'dima@sprint.team', role: 'viewer', tone: 'violet', lastSeenAt: hoursAgo(72) },
  ];

  const task = (number, fields) => ({
    id: `t${number}`,
    code: `SPR-${number}`,
    description: '',
    tags: [],
    ...fields,
  });

  const tasks = [
    task(42, { title: 'Макет экрана профиля', status: 'backlog', priority: 'medium', assigneeId: 'm2', authorId: 'm1', tags: ['Дизайн'], due: day(9), createdAt: day(-6), description: 'Экран с аватаром, ролью и списком задач участника.' }),
    task(43, { title: 'Экспорт задач в CSV', status: 'backlog', priority: 'low', assigneeId: null, authorId: 'm4', tags: ['Фича'], due: day(16), createdAt: day(-5) }),
    task(44, { title: 'Гайд по онбордингу новых участников', status: 'backlog', priority: 'medium', assigneeId: 'm4', authorId: 'm1', tags: ['Документация'], due: day(12), createdAt: day(-5) }),
    task(41, { title: 'Настроить CI для автотестов', status: 'progress', priority: 'high', assigneeId: 'm1', authorId: 'm2', tags: ['Инфра'], due: day(3), createdAt: day(-7), description: 'Нужен пайплайн, который запускает тесты на каждый merge request и не даёт влить ветку с упавшими тестами. Результат прогона должен быть виден прямо в карточке MR.' }),
    task(39, { title: 'Тёмная тема интерфейса', status: 'progress', priority: 'medium', assigneeId: 'm2', authorId: 'm2', tags: ['Дизайн', 'Фронтенд'], due: day(7), createdAt: day(-8) }),
    task(40, { title: 'Уведомления о дедлайнах', status: 'progress', priority: 'low', assigneeId: 'm4', authorId: 'm4', tags: ['Фича'], due: day(6), createdAt: day(-7) }),
    task(38, { title: 'Валидация формы приглашения', status: 'review', priority: 'high', assigneeId: 'm3', authorId: 'm1', tags: ['Фронтенд'], due: day(-2), createdAt: day(-8), description: 'Проверять формат email и не давать пригласить человека дважды.' }),
    task(45, { title: 'Ревью API комментариев', status: 'review', priority: 'medium', assigneeId: 'm5', authorId: 'm3', tags: ['Инфра'], due: day(2), createdAt: day(-4) }),
    task(33, { title: 'Починить сортировку в таблице', status: 'done', priority: 'medium', assigneeId: 'm1', authorId: 'm3', tags: ['Баг'], due: day(-5), createdAt: day(-11) }),
    task(34, { title: 'Фильтры на доске', status: 'done', priority: 'low', assigneeId: 'm5', authorId: 'm1', tags: ['Фича'], due: day(-4), createdAt: day(-11) }),
  ];

  const comments = [
    { id: 'c1', taskId: 't41', authorId: 'm2', text: 'Могу помочь с раннером — у нас есть свободная машина под сборки.', createdAt: yesterdayAt(18, 40) },
    { id: 'c2', taskId: 't41', authorId: 'm3', text: 'Проверил на своей ветке: с кэшем сборка заметно быстрее. Оставляем.', createdAt: hoursAgo(0.5) },
  ];

  return {
    sprint: { name: 'Спринт 14', start: day(-8), end: day(5) },
    members,
    tasks,
    comments,
    customTags: [],
    preferences: { boardFilter: 'all', boardTab: 'progress', teamFilter: 'all' },
    counters: { task: 46, member: 6, comment: 3 },
  };
}
