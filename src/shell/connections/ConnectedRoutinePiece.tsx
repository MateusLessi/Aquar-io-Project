import type { RoutineToday } from '@/features/routines/domain/types';

import { useConnect } from './ConnectProvider';
import { RoutinePiece } from './RoutinePiece';
import { useConnections } from './useConnected';

/** A routine piece with what is linked into it and the "Conectar" action wired. */
export function ConnectedRoutinePiece({
  routine,
  onEdit,
  initiallyOpen,
}: {
  routine: RoutineToday;
  onEdit: () => void;
  initiallyOpen?: boolean;
}) {
  const { inside, todayKey } = useConnections();
  const { open } = useConnect();
  return (
    <RoutinePiece
      routine={routine}
      inside={inside('routine', routine.id)}
      todayKey={todayKey}
      onEdit={onEdit}
      onConnect={() => open({ into: { kind: 'routine', id: routine.id, name: routine.name } })}
      initiallyOpen={initiallyOpen}
    />
  );
}
