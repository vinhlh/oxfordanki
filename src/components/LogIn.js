import React from 'react'
import Button from '@material-ui/core/Button'

import { signInWithGoogle } from '../firebase'
import styled from 'styled-components'

const Container = styled.div`
  margin-top: 160px;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
`

const Header = styled.a`
  font-family: 'Roboto', 'Helvetica', 'Arial', sans-serif;
  margin-bottom: 18px;
  font-size: 18px;
`

const Description = styled(Header)`
  margin-bottom: 80px;
  font-size: 16px;
`

function Login() {
  return (
    <Container>
      <Header target="__blank" href="https://github.com/vinhlh/oxfordanki">
        vinhlh/oxfordanki
      </Header>
      <Description>
        Manage and generate Anki cards from Oxford dictionaries
      </Description>
      <Button color="primary" variant="contained" onClick={signInWithGoogle}>
        Login with Google
      </Button>
    </Container>
  )
}

export default Login
