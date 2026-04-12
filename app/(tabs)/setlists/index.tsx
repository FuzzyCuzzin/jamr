import { View, Text, StyleSheet } from 'react-native'

// Placeholder — full setlist builder built in Step 4
export default function SetlistsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Setlists</Text>
      <Text style={styles.body}>Your setlists will appear here.</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  body: {
    fontSize: 15,
    color: '#6b7280',
    textAlign: 'center',
  },
})
