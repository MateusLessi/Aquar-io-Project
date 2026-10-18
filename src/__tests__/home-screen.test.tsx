import { screen } from '@testing-library/react-native';

import HomeScreen from '@/app/index';
import { renderWithTheme } from '@/design-system/test-utils/render';

describe('HomeScreen (TEMPORARY)', () => {
  it('renders the app name as a header', async () => {
    await renderWithTheme(<HomeScreen />);

    expect(screen.getByRole('header', { name: 'Aquar.io' })).toBeOnTheScreen();
  });
});
