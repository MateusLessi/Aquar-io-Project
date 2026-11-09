import { statusLabel } from '../AccountSection';

describe('sync status', () => {
  it('says the cloud needs an update, and which part, instead of "offline"', () => {
    expect(
      statusLabel({
        status: 'error',
        problem: { kind: 'outdated', tables: ['profile'] },
        lastSyncedAt: null,
      }),
    ).toBe('A nuvem precisa de uma atualização (perfil). Tudo continua salvo aqui.');
    expect(
      statusLabel({
        status: 'error',
        problem: { kind: 'unknown', tables: ['habits', 'habit_checks', 'routines'] },
        lastSyncedAt: null,
      }),
    ).toBe('Não deu para sincronizar hábitos e rotinas. Tenta de novo sozinho.');
  });

  it('keeps "offline" for a real lost connection', () => {
    expect(
      statusLabel({
        status: 'error',
        problem: { kind: 'offline', tables: [] },
        lastSyncedAt: null,
      }),
    ).toBe('Sem conexão. Tudo sobe depois.');
  });
});
