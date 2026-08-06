import { buildPushMessages, chunkMessages, selectTasksDueForReminder, type ReminderTask } from './reminders';

function task(overrides: Partial<ReminderTask> = {}): ReminderTask {
  return {
    id: 'task-1',
    property_id: 'property-1',
    title: 'Boiler service',
    next_due_date: '2026-08-10',
    ...overrides,
  };
}

describe('selectTasksDueForReminder', () => {
  it('includes a task due within the reminder window', () => {
    const result = selectTasksDueForReminder([task({ next_due_date: '2026-08-10' })], '2026-08-06', new Set());
    expect(result).toHaveLength(1);
  });

  it('excludes a task due well outside the window', () => {
    const result = selectTasksDueForReminder([task({ next_due_date: '2026-09-30' })], '2026-08-06', new Set());
    expect(result).toHaveLength(0);
  });

  it('includes an overdue task (past due date)', () => {
    const result = selectTasksDueForReminder([task({ next_due_date: '2026-07-01' })], '2026-08-06', new Set());
    expect(result).toHaveLength(1);
  });

  it('excludes a task already notified today, even if still due', () => {
    const t = task({ id: 'task-2', next_due_date: '2026-08-06' });
    const result = selectTasksDueForReminder([t], '2026-08-06', new Set(['task-2']));
    expect(result).toHaveLength(0);
  });

  it('includes a task due exactly at the window boundary', () => {
    // REMINDER_WINDOW_DAYS = 7, so 2026-08-06 + 7 = 2026-08-13.
    const result = selectTasksDueForReminder([task({ next_due_date: '2026-08-13' })], '2026-08-06', new Set());
    expect(result).toHaveLength(1);
  });

  it('excludes a task one day past the window boundary', () => {
    const result = selectTasksDueForReminder([task({ next_due_date: '2026-08-14' })], '2026-08-06', new Set());
    expect(result).toHaveLength(0);
  });
});

describe('buildPushMessages', () => {
  it('builds one message per recipient token for a due task', () => {
    const messages = buildPushMessages(
      [{ task: task({ next_due_date: '2026-08-10' }), tokens: ['tokenA', 'tokenB'] }],
      '2026-08-06',
    );
    expect(messages).toHaveLength(2);
    expect(messages[0]).toMatchObject({ to: 'tokenA', data: { taskId: 'task-1', propertyId: 'property-1' } });
    expect(messages[0].title).toBe('Maintenance reminder');
  });

  it('labels an overdue task distinctly from an upcoming one', () => {
    const messages = buildPushMessages([{ task: task({ next_due_date: '2026-08-01' }), tokens: ['tokenA'] }], '2026-08-06');
    expect(messages[0].title).toBe('Overdue maintenance');
    expect(messages[0].body).toContain('was due');
  });

  it('produces no messages for a task with no registered devices', () => {
    const messages = buildPushMessages([{ task: task(), tokens: [] }], '2026-08-06');
    expect(messages).toHaveLength(0);
  });
});

describe('chunkMessages', () => {
  it('splits messages into chunks no larger than the given size', () => {
    const messages = Array.from({ length: 250 }, (_, i) => i);
    const chunks = chunkMessages(messages, 100);
    expect(chunks).toHaveLength(3);
    expect(chunks[0]).toHaveLength(100);
    expect(chunks[2]).toHaveLength(50);
  });

  it('returns an empty array for no messages', () => {
    expect(chunkMessages([])).toEqual([]);
  });
});
