import { describe, expect, it } from 'vitest';

import { getTask, getTaskSummary, loadAllTasks, searchTasks } from './task-loader.js';

describe('task-loader', () => {
  it('loads the repo task registry', () => {
    const tasks = loadAllTasks();
    expect(tasks.length).toBeGreaterThanOrEqual(13);
    expect(tasks[0]?.id).toBe('01-pumpkit-web-tests');
  });

  it('finds a task by exact id and query', () => {
    const task = getTask('30-pump-sdk-integration-tests');
    expect(task).toBeDefined();
    expect(task?.domains).toContain('testing');

    const results = searchTasks('pump sdk integration');
    expect(results.some((entry) => entry.id === '30-pump-sdk-integration-tests')).toBe(true);
  });

  it('builds a summary for the task registry', () => {
    const summary = getTaskSummary();
    expect(summary.total).toBeGreaterThanOrEqual(13);
    expect(summary.byPriority.HIGH + summary.byPriority.MED + summary.byPriority.LOW).toBe(summary.total);
    expect(Object.keys(summary.byDomain).length).toBeGreaterThan(0);
  });
});
