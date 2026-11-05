import { parseDashboardCards, serializeDashboardCards } from '../settings/prefs';

describe('dashboard cards setting', () => {
  it('keeps the order and hidden cards, drops unknown ids, appends new cards', () => {
    const cards = parseDashboardCards('tasks,-folders,nope,depth');
    expect(cards.slice(0, 3)).toEqual([
      { id: 'tasks', visible: true },
      { id: 'folders', visible: false },
      { id: 'depth', visible: true },
    ]);
    expect(cards).toHaveLength(8);
    expect(cards.every((c, i) => i < 3 || c.visible)).toBe(true);
  });

  it('round-trips', () => {
    const cards = parseDashboardCards('');
    cards[1] = { ...cards[1]!, visible: false };
    expect(parseDashboardCards(serializeDashboardCards(cards))).toEqual(cards);
  });
});
