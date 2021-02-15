import Layout from './components/Layout'
import UserProvider from './providers/UserProvider'

function App() {
  return (
    <UserProvider>
      <Layout />
    </UserProvider>
  )
}

export default App
