import firebase from 'firebase/app'
import 'firebase/auth'
import 'firebase/database'

const {
  API_KEY: apiKey,
  AUTH_DOMAIN: authDomain,
  DATABASE_URL: databaseURL,
  PROJECT_ID: projectId,
  STORAGE_BUCKET: storageBucket,
  MESSAGING_SENDER_ID: messagingSenderId,
  APP_ID: appId,
  MEASUREMENT_ID: measurementId,
} = process.env

const firebaseConfig = {
  apiKey,
  authDomain,
  databaseURL,
  projectId,
  storageBucket,
  messagingSenderId,
  appId,
  measurementId,
}

firebase.initializeApp(firebaseConfig)
export const auth = firebase.auth()
export const database = firebase.database()

export const signInWithGoogle = () => {
  auth.signInWithRedirect(new firebase.auth.GoogleAuthProvider())
}
