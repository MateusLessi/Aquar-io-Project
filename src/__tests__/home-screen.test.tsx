import { render, screen } from '@testing-library/react-native';

import HomeScreen from '@/app/index';

describe('HomeScreen (TEMPORARY)', () => {
  it('renders the app name as a header', async () => {
    await render(<HomeScreen />);

    expect(screen.getByRole('header', { name: 'Aquar.io' })).toBeOnTheScreen();
  });
});
