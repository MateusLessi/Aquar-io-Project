import type { DomainEvent } from '@/core/events/events';
import { configureFeedback, defaultFeedbackPrefs, sound } from '@/design-system';

import { soundForEvent } from '../feedback/soundForEvent';

const event = <T extends DomainEvent['type']>(
  type: T,
  payload: DomainEvent<T>['payload'],
): DomainEvent =>
  ({ id: 'e', type, entityType: 'x', entityId: 'x', payload, occurredAt: '' }) as DomainEvent;

const lookups = (open = 1, left = 1) => ({
  openTasksIn: async () => open,
  routineItemsLeft: async () => left,
});

describe('soundForEvent', () => {
  it('drops for a task, chimes for the last one of its list', async () => {
    const done = event('TASK_COMPLETED', { taskId: 't', listId: 'l', parentTaskId: null });
    expect(await soundForEvent(done, lookups(2))).toBe('task');
    expect(await soundForEvent(done, lookups(0))).toBe('complete');
  });

  it('uses the small drop for subtasks and routine items, the chime for a finished routine', async () => {
    const sub = event('TASK_COMPLETED', { taskId: 't', listId: 'l', parentTaskId: 'p' });
    expect(await soundForEvent(sub, lookups(0))).toBe('step');
    const item = event('ROUTINE_ITEM_CHECKED', { routineId: 'r', itemId: 'i', date: 'd' });
    expect(await soundForEvent(item, lookups(1, 2))).toBe('step');
    expect(await soundForEvent(item, lookups(1, 0))).toBe('complete');
  });

  it('bubbles for a habit and stays quiet when unchecking', async () => {
    expect(
      await soundForEvent(event('HABIT_CHECKED', { habitId: 'h', date: 'd' }), lookups()),
    ).toBe('habit');
    expect(
      await soundForEvent(event('HABIT_UNCHECKED', { habitId: 'h', date: 'd' }), lookups()),
    ).toBeNull();
  });
});

describe('sound.play', () => {
  const audio = jest.requireMock<{ createAudioPlayer: jest.Mock }>('expo-audio');

  it('respects the switches, groups and preview', () => {
    const created: { play: jest.Mock }[] = [];
    jest.spyOn(audio, 'createAudioPlayer').mockImplementation(() => {
      const player = { play: jest.fn(), seekTo: () => Promise.resolve(), volume: 1 };
      created.push(player);
      return player;
    });
    configureFeedback({ ...defaultFeedbackPrefs, sound: false });
    sound.play('zone');
    expect(created).toHaveLength(0);

    configureFeedback({
      ...defaultFeedbackPrefs,
      groups: { ...defaultFeedbackPrefs.groups, celebrations: false },
    });
    sound.play('zone');
    expect(created).toHaveLength(0);
    sound.play('zone', { preview: true });
    expect(created[0]?.play).toHaveBeenCalledTimes(1);
    configureFeedback(defaultFeedbackPrefs);
  });
});
