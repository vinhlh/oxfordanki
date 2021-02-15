import firebase from 'firebase/app'
import 'firebase/auth'
import 'firebase/database'

const {
  REACT_APP_API_KEY: apiKey,
  REACT_APP_AUTH_DOMAIN: authDomain,
  REACT_APP_DATABASE_URL: databaseURL,
  REACT_APP_PROJECT_ID: projectId,
  REACT_APP_STORAGE_BUCKET: storageBucket,
  REACT_APP_MESSAGING_SENDER_ID: messagingSenderId,
  REACT_APP_APP_ID: appId,
  REACT_APP_MEASUREMENT_ID: measurementId,
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
