import { useEffect, useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Clipboard,
} from 'react-native'
import type { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { useBand } from '@/lib/BandContext'

export default function SettingsScreen() {
  const { band } = useBand()
  const [user, setUser] = useState<User | null>(null)
  const [inviteCode, setInviteCode] = useState<string | null>(null)
  const [signingOut, setSigningOut] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user))
  }, [])

  useEffect(() => {
    if (!band) return
    supabase
      .from('bands')
      .select('invite_code')
      .eq('id', band.id)
      .single()
      .then(({ data }) => {
        if (data) setInviteCode(data.invite_code)
      })
  }, [band?.id])

  function copyInviteCode() {
    if (!inviteCode) return
    Clipboard.setString(inviteCode)
    Alert.alert('Copied!', `Invite code "${inviteCode}" copied to clipboard.`)
  }

  async function handleSignOut() {
    setSigningOut(true)
    await supabase.auth.signOut()
    // Root layout detects the session change and redirects to login automatically
  }

  return (
    <View style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Signed in as</Text>
        <Text style={styles.value}>{user?.email ?? '—'}</Text>
      </View>

      {band && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Band</Text>
          <Text style={styles.value}>{band.name}</Text>

          {inviteCode && (
            <>
              <Text style={[styles.sectionLabel, { marginTop: 12 }]}>Invite code</Text>
              <TouchableOpacity onPress={copyInviteCode} activeOpacity={0.7}>
                <Text style={styles.inviteCode}>{inviteCode}</Text>
                <Text style={styles.inviteHint}>Tap to copy · Share with bandmates to let them join</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      )}

      <TouchableOpacity
        style={[styles.button, signingOut && styles.buttonDisabled]}
        onPress={handleSignOut}
        disabled={signingOut}
        activeOpacity={0.8}
      >
        {signingOut ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Sign out</Text>
        )}
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 24,
    paddingTop: 24,
  },
  section: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
  },
  inviteCode: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2563eb',
    letterSpacing: 2,
    marginTop: 2,
  },
  inviteHint: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
  },
  button: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: '#93c5fd',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
})
