// TEMPORARY: placeholder screen for Etapa 1 (technical foundation).
// Replaced by the real app shell in Etapa 3.
import { StyleSheet, Text, View } from 'react-native';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text accessibilityRole="header" style={styles.title}>
        Aquar.io
      </Text>
      <Text style={styles.subtitle}>Fundação técnica</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#071521',
  },
  title: {
    color: '#E6F1F5',
    fontSize: 32,
    fontWeight: '600',
  },
  subtitle: {
    color: '#8FA8B4',
    fontSize: 15,
    marginTop: 8,
  },
});
