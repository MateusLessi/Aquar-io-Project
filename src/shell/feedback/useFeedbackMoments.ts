import { useEffect, useRef } from 'react';

import { useEvents } from '@/core/events/eventsContext';
import { haptics, sound } from '@/design-system';
import { useRoutinesRepository } from '@/features/routines/hooks/routinesContext';
import { useTodo } from '@/features/todo/hooks/todoContext';

import { useProgress } from '../progress/useProgress';
import { soundForEvent } from './soundForEvent';

/**
 * Plays the sound of each thing done in this app (not of changes arriving from other
 * devices), and the full-tide arpeggio when today's tide fills while the app is open.
 */
export function useFeedbackMoments() {
  const events = useEvents();
  const todo = useTodo();
  const routines = useRoutinesRepository();

  useEffect(
    () =>
      events.subscribe((event) => {
        soundForEvent(event, {
          openTasksIn: async (listId) =>
            (await todo.listTasks(listId)).filter((t) => !t.parentTaskId && !t.completedAt).length,
          routineItemsLeft: async (routineId) => {
            const routine = (await routines.listToday()).find((r) => r.id === routineId);
            return routine ? routine.items.filter((i) => !i.done).length : 1;
          },
        })
          .then((name) => {
            if (!name) return;
            sound.play(name);
            if (name === 'complete') haptics.success();
          })
          .catch((error: unknown) => console.warn('Could not pick a sound.', error));
      }),
    [events, todo, routines],
  );

  // Full tide: only a change seen while the app is open (not the state found at launch).
  const { data: progress } = useProgress();
  const fullTide = progress?.today.fullTide;
  const previous = useRef<boolean | undefined>(undefined);
  useEffect(() => {
    if (fullTide === undefined) return;
    if (previous.current === false && fullTide) {
      sound.play('full-tide');
      haptics.success();
    }
    previous.current = fullTide;
  }, [fullTide]);
}
