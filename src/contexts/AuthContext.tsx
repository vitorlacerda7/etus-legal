import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  type User,
} from 'firebase/auth'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '../firebase'
import type { Role, UserProfile } from '../types'
import { isEmailAllowed } from '../utils/authAllowlist'

export interface AuthContextValue {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  loginWithGoogle: () => Promise<void>
  logout: () => Promise<void>
}

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const googleProvider = new GoogleAuthProvider()

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u)
      if (u) {
        try {
          const snap = await getDoc(doc(db, 'users', u.uid))
          if (snap.exists()) {
            setProfile({ uid: u.uid, ...(snap.data() as Omit<UserProfile, 'uid'>) })
          } else {
            setProfile(null)
          }
        } catch (err) {
          console.error('Erro ao carregar perfil:', err)
          setProfile(null)
        }
      } else {
        setProfile(null)
      }
      setLoading(false)
    })
    return unsub
  }, [])

  async function login(email: string, password: string) {
    if (!isEmailAllowed(email)) {
      throw new Error('E-mail não autorizado. Use um e-mail corporativo do Grupo ETUS.')
    }
    await signInWithEmailAndPassword(auth, email, password)
  }

  async function loginWithGoogle() {
    const result = await signInWithPopup(auth, googleProvider)
    const email = result.user.email ?? ''
    if (!isEmailAllowed(email)) {
      await signOut(auth)
      throw new Error('E-mail não autorizado. Use um e-mail corporativo do Grupo ETUS.')
    }
    const snap = await getDoc(doc(db, 'users', result.user.uid))
    if (!snap.exists()) {
      await setDoc(doc(db, 'users', result.user.uid), {
        email,
        name: result.user.displayName ?? email.split('@')[0],
        role: 'solicitante' as Role,
        empresa: '',
        createdAt: serverTimestamp(),
      })
    }
  }

  async function logout() {
    await signOut(auth)
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, login, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
