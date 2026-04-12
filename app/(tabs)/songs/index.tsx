import { View, Text, StyleSheet } from 'react-native'

// Placeholder — full song catalog built in Step 3
export default function SongsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Songs</Text>
      <Text style={styles.body}>Your song catalog will appear here.</Text>
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
