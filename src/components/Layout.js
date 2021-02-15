import { useContext } from 'react'

import LogIn from '../components/LogIn'
import Builder from '../components/Builder'
import { UserContext } from '../providers/UserProvider'

function Layout() {
  const user = useContext(UserContext)
  return <div>{user ? <Builder user={user} /> : <LogIn />}</div>
}

export default Layout
