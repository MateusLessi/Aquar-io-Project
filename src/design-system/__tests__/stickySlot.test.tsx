import { screen } from '@testing-library/react-native';
import { View } from 'react-native';

import { StickySlot, StickySlotHost, StickySlotProvider, Text } from '..';
import { renderWithTheme } from '../test-utils/render';

describe('StickySlot', () => {
  it('shows in place without a provider', async () => {
    await renderWithTheme(
      <StickySlot>
        <Text>Dia</Text>
      </StickySlot>,
    );
    expect(screen.getByText('Dia')).toBeOnTheScreen();
  });

  it('moves into the host, once, with a provider', async () => {
    await renderWithTheme(
      <StickySlotProvider>
        <View testID="host">
          <StickySlotHost />
        </View>
        <View testID="content">
          <StickySlot>
            <Text>Semana</Text>
          </StickySlot>
        </View>
      </StickySlotProvider>,
    );
    expect(screen.getAllByText('Semana')).toHaveLength(1);
    expect(screen.getByTestId('host')).toContainElement(screen.getByText('Semana'));
  });
});
