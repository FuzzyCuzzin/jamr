import { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native'
import { Stack, useRouter } from 'expo-router'
import { supabase } from '@/lib/supabase'
import { useBand } from '@/lib/BandContext'

type EventType = 'rehearsal' | 'gig'

export default function NewEventScreen() {
  const router = useRouter()
  const { band } = useBand()
  const [title, setTitle] = useState('')
  const [type, setType] = useState<EventType>('rehearsal')
  const [dateInput, setDateInput] = useState('')  // free text: "YYYY-MM-DD HH:MM"
  const [location, setLocation] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function parseDate(input: string): Date | null {
    // Accept "YYYY-MM-DD" or "YYYY-MM-DD HH:MM"
    const d = new Date(input.trim())
    return isNaN(d.getTime()) ? null : d
  }

  async function handleSave() {
    if (!title.trim()) { setError('Title is required'); return }
    if (!dateInput.trim()) { setError('Date is required'); return }
    const parsedDate = parseDate(dateInput)
    if (!parsedDate) {
      setError('Invalid date. Use format: YYYY-MM-DD or YYYY-MM-DD HH:MM')
      return
    }
    if (!band) return

    setError(null)
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()

    const { error: insertError } = await supabase.from('events').insert({
      band_id: band.id,
      title: title.trim(),
      type,
      status: 'scheduled',
      date: parsedDate.toISOString(),
      location: location.trim() || null,
      notes: notes.trim() || null,
      created_by: user?.id,
    })

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    router.back()
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'New Event',
          headerBackTitle: 'Events',
          headerStyle: { backgroundColor: '#fff' },
          headerTitleStyle: { fontWeight: '700', color: '#111827' },
          headerShadowVisible: false,
        }}
      />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <View style={styles.field}>
            <Text style={styles.label}>Title *</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Friday Night Rehearsal"
              placeholderTextColor="#9ca3af"
              autoCapitalize="words"
              autoFocus
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Type</Text>
            <View style={styles.chipRow}>
              {(['rehearsal', 'gig'] as EventType[]).map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.chip, type === t && styles.chipActive]}
                  onPress={() => setType(t)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.chipText, type === t && styles.chipTextActive]}>
                    {t === 'rehearsal' ? 'Rehearsal' : 'Gig'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Date *</Text>
            <TextInput
              style={styles.input}
              value={dateInput}
              onChangeText={setDateInput}
              placeholder="YYYY-MM-DD HH:MM  (e.g. 2025-08-15 20:00)"
              placeholderTextColor="#9ca3af"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Location</Text>
            <TextInput
              style={styles.input}
              value={location}
              onChangeText={setLocation}
              placeholder="Venue or address"
              placeholderTextColor="#9ca3af"
              autoCapitalize="words"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Notes</Text>
            <TextInput
              style={[styles.input, styles.inputMultiline]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Load-in time, set length, contacts…"
              placeholderTextColor="#9ca3af"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSave}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Save event</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scroll: { padding: 24, paddingBottom: 48 },
  errorBox: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: { color: '#dc2626', fontSize: 14 },
  field: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#fff',
  },
  inputMultiline: { height: 100, paddingTop: 12 },
  chipRow: { flexDirection: 'row', gap: 8 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#fff',
  },
  chipActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  chipText: { fontSize: 14, fontWeight: '500', color: '#6b7280' },
  chipTextActive: { color: '#fff' },
  button: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: { backgroundColor: '#93c5fd' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
})
