import React, { useEffect, useState } from 'react'
import styled from 'styled-components'

import FormLabel from '@material-ui/core/FormLabel'
import FormControl from '@material-ui/core/FormControl'
import FormControlLabel from '@material-ui/core/FormControlLabel'
import Paper from '@material-ui/core/Paper'
import Grid from '@material-ui/core/Grid'
import InputBase from '@material-ui/core/InputBase'
import IconButton from '@material-ui/core/IconButton'
import SearchIcon from '@material-ui/icons/Search'
import InputLabel from '@material-ui/core/InputLabel'
import MenuItem from '@material-ui/core/MenuItem'
import RadioGroup from '@material-ui/core/RadioGroup'
import Radio from '@material-ui/core/Radio'
import Select from '@material-ui/core/Select'
import TextField from '@material-ui/core/TextField'
import Button from '@material-ui/core/Button'
import Table from '@material-ui/core/Table'
import TableBody from '@material-ui/core/TableBody'
import TableCell from '@material-ui/core/TableCell'
import TableContainer from '@material-ui/core/TableContainer'
import TableHead from '@material-ui/core/TableHead'
import TableRow from '@material-ui/core/TableRow'
import Dialog from '@material-ui/core/Dialog'
import DialogActions from '@material-ui/core/DialogActions'
import DialogContent from '@material-ui/core/DialogContent'
import DialogContentText from '@material-ui/core/DialogContentText'
import DialogTitle from '@material-ui/core/DialogTitle'
import DeleteIcon from '@material-ui/icons/Delete'
import Snackbar from '@material-ui/core/Snackbar'
import MuiAlert from '@material-ui/lab/Alert'

import { saveAs } from 'file-saver'

import { auth, database } from '../firebase'

const Container = styled.div`
  margin: 32px;
`

const ExportContainer = styled.div`
  margin-top: 16px;
  display: flex;
`

const StyledInput = styled(InputBase)`
  flex: 1;
  margin-left: 16px;
`

const SearchBox = styled(Paper)`
  display: flex;
`

const Footer = styled.div`
  font-family: 'Roboto', 'Helvetica', 'Arial', sans-serif;
  font-size: 14px;
  text-align: right;
  margin-top: 32px;
  padding-top: 32px;
  color: #666;
  line-height: 180%;
`

const AddWordForm = styled(Paper)`
  display: flex;
  margin-top: 24px;
  padding: 16px;
  flex-direction: column;
`

const StyledFormControl = styled(FormControl)`
  flex: 1;
  margin-bottom: 16px !important;
`

const EXAMPLE_LIMIT = 4

const parseHTMLV2 = (html) => {
  const el = document.createElement('html')
  el.innerHTML = html
  const entries = el.getElementsByClassName('entry')

  if (!entries.length) {
    return null
  }

  const [entry] = entries

  const phonBr = entry.querySelector('.phons_br .phon').innerText
  const phonAm = entry.querySelector('.phons_n_am .phon').innerText

  const pos = entry.querySelector('.webtop .pos').innerText
  const definitions = [
    ...entry.querySelectorAll('.senses_multiple .def,.sense_single .def'),
  ].map((el) => el.innerText)
  const examplesByDefinition = [...entry.querySelectorAll('.sense')]
    .map((el) => ({
      definition: el.querySelector('.def').innerText,
      examples: [...el.querySelectorAll('.examples li')]
        .slice(0, EXAMPLE_LIMIT)
        .map((li) => li.innerText.trim()),
    }))
    .reduce(
      (values, { definition, examples }) => ({
        [definition]: examples,
        ...values,
      }),
      {}
    )

  const soundBr = entry
    .querySelector('.phons_br .sound')
    .getAttribute('data-src-mp3')
  const soundAm = entry
    .querySelector('.phons_n_am .sound')
    .getAttribute('data-src-mp3')

  return {
    phonBr,
    phonAm,
    soundBr,
    soundAm,
    pos,
    definitions,
    examplesByDefinition,
  }
}

const sanitize = (def) => def.replaceAll('/', ' or ').replace(/[.$[\]$]/g, '')

const addWord = (user, { name, pos, definition, data }) => {
  database
    .ref(`user_words/${user.uid}/${name}/${pos}/${sanitize(definition)}`)
    .set(data)

  database.ref(`user_decks/${user.uid}/${data.deck}/${name}`).set(true)
}

const deleteWord = (user, { name, pos, definition }) => {
  database
    .ref(`user_words/${user.uid}/${name}/${pos}/${sanitize(definition)}`)
    .remove()
}

const addDeck = (user, name) => {
  database.ref(`user_decks/${user.uid}/${name}`).set(true)
}

const shortenPos = (pos) =>
  ({
    adjective: 'adj',
    noun: 'n',
    verb: 'v',
    adverb: 'adv',
    preposition: 'prep',
  }[pos] || pos)

const exportToAnki = async (words) => {
  fetch(process.env.REACT_APP_FUNCTION_GENERATE_APKG, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(
      words.map((w) => ({
        ...w,
        pos: shortenPos(w.pos),
      }))
    ),
  })
    .then((r) => r.blob())
    .then((b) => saveAs(b, 'output.apkg'))
    .catch()
}

function Builder({ user }) {
  const [error, setError] = useState(null)
  const [keyword, setKeyword] = useState('')
  const [decks, setDecks] = useState([])
  const [words, setWords] = useState([])
  const [selectedDefinition, setSelectedDefinition] = useState(null)
  const [selectedExample, setSelectedExample] = useState(null)
  const [selectedDeck, setSelectedDeck] = useState('')
  const [customExample, setCustomExample] = useState(null)
  const [searchResult, setSearchResult] = useState(null)
  const [openDialog, setOpenDialog] = useState(false)
  const [deckName, setDeckName] = useState('')

  const onSearchChanged = (event) => {
    const kw = event.target.value
    setKeyword(kw)
  }

  const handleClose = () => {
    setError(null)
  }

  const performSearch = (kw) => {
    fetch(process.env.REACT_APP_FUNCTION_SEARCH_ON_OXFORD + kw)
      .then((r) => r.text())
      .then(parseHTMLV2)
      .then((data) => {
        if (data) {
          setSearchResult(data)
          return
        }

        setError('Not found')
      })
      .catch((err) => {
        setError(err)
      })
  }

  useEffect(() => {
    database.ref('user_decks/' + user.uid).on('value', (snapshot) => {
      const decks = snapshot.val()
      if (decks) {
        setDecks(decks)
      }
    })

    database.ref('user_words/' + user.uid).on('value', (snapshot) => {
      const rawWords = snapshot.val()
      if (rawWords) {
        const words = []
        Object.entries(rawWords).forEach(([name, poss]) => {
          Object.entries(poss).forEach(([pos, definitions]) => {
            Object.entries(definitions).forEach(([definition, data]) => {
              words.push({ name, pos, definition, ...data })
            })
          })
        })

        setWords(words)
      }
    })
  }, [user.uid])

  const renderAddDeckForm = () => {
    const handleClose = () => {
      setOpenDialog(false)
    }

    return (
      <Dialog
        open={openDialog}
        onClose={handleClose}
        aria-labelledby="form-dialog-title"
      >
        <form
          onSubmit={(event) => {
            addDeck(user, deckName)
            handleClose()
            event.preventDefault()
          }}
        >
          <DialogTitle id="form-dialog-title">Add new deck</DialogTitle>
          <DialogContent>
            <DialogContentText>A group of cards</DialogContentText>
            <TextField
              autoFocus
              margin="dense"
              label="Deck name"
              type="text"
              fullWidth
              value={deckName}
              onChange={(event) => setDeckName(event.target.value)}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose} color="primary">
              Cancel
            </Button>
            <Button
              onClick={() => {
                addDeck(deckName)
                handleClose()
              }}
              color="primary"
            >
              Add
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    )
  }

  const renderExampleSelection = () => {
    if (!selectedDefinition) {
      return null
    }

    const { examplesByDefinition } = searchResult

    if (!examplesByDefinition[selectedDefinition]) {
      return null
    }

    const examples = examplesByDefinition[selectedDefinition]
    return (
      <StyledFormControl component="fieldset">
        <FormLabel component="legend">Example</FormLabel>
        <RadioGroup
          aria-label="example"
          name="example"
          onChange={(event) => setSelectedExample(event.target.value)}
        >
          {examples.map((ex) => (
            <FormControlLabel
              key={ex}
              value={ex}
              control={<Radio />}
              label={ex}
            />
          ))}
          <FormControlLabel value="custom" control={<Radio />} label="Custom" />
        </RadioGroup>

        {selectedExample === 'custom' && (
          <TextField
            id="standard-basic"
            value={customExample}
            label="Custom example"
            onChange={(event) => setCustomExample(event.target.value)}
          />
        )}
      </StyledFormControl>
    )
  }

  const renderAddWordForm = () => {
    if (!searchResult) {
      return null
    }

    const { phonBr, phonAm, soundBr, soundAm, pos, definitions } = searchResult
    return (
      <AddWordForm
        component="form"
        onSubmit={(event) => event.preventDefault()}
      >
        <StyledFormControl>
          <InputLabel>Deck</InputLabel>
          <Select
            value={selectedDeck}
            onChange={(event) => {
              const { value } = event.target

              if (value === 'add') {
                setOpenDialog(true)
                setDeckName('')
                event.preventDefault()
                return false
              }

              setSelectedDeck(value)
              event.preventDefault()
            }}
          >
            {Object.keys(decks).map((d) => (
              <MenuItem key={d} value={d}>
                {d}
              </MenuItem>
            ))}
            <MenuItem value="add">Add new deck</MenuItem>
          </Select>
        </StyledFormControl>

        <StyledFormControl component="fieldset">
          <FormLabel component="legend">Definition</FormLabel>
          <RadioGroup
            aria-label="definition"
            name="definition"
            value={selectedDefinition}
            onChange={({ target: { value } }) => {
              setSelectedDefinition(value)
              setSelectedExample(null)
              setCustomExample('')
            }}
          >
            {definitions.map((def) => (
              <FormControlLabel
                key={def}
                value={def}
                control={<Radio />}
                label={def}
              />
            ))}
          </RadioGroup>
        </StyledFormControl>

        {renderExampleSelection()}

        <Button
          color="primary"
          variant="contained"
          disabled={
            !selectedDeck ||
            !selectedDefinition ||
            !selectedExample ||
            (selectedExample === 'custom' && !customExample)
          }
          onClick={() => {
            addWord(user, {
              name: keyword,
              pos,
              definition: selectedDefinition,
              data: {
                phonBr,
                phonAm,
                soundBr,
                soundAm,
                example:
                  selectedExample === 'custom'
                    ? customExample
                    : selectedExample,
                deck: selectedDeck,
              },
            })
          }}
        >
          Add Word
        </Button>
      </AddWordForm>
    )
  }

  return (
    <Container>
      <Grid container spacing={3}>
        <Grid item xs={5}>
          <SearchBox
            component="form"
            onSubmit={(event) => {
              performSearch(keyword)
              event.preventDefault()
            }}
          >
            <StyledInput
              placeholder="Search Word"
              inputProps={{ 'aria-label': 'Search Word' }}
              value={keyword}
              onChange={onSearchChanged}
            />
            <IconButton type="submit" aria-label="search">
              <SearchIcon />
            </IconButton>
          </SearchBox>

          {renderAddWordForm()}
        </Grid>
        <Grid item xs={7}>
          <TableContainer component={Paper}>
            <Table stickyHeader aria-label="simple table">
              <TableHead>
                <TableRow>
                  <TableCell>Word</TableCell>
                  <TableCell align="left">Pos</TableCell>
                  <TableCell align="left">Definition</TableCell>
                  <TableCell align="left">Deck</TableCell>
                  <TableCell align="left">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {words.map((w) => (
                  <TableRow key={`${w.name}-${w.pos}-${w.definition}`}>
                    <TableCell component="th" scope="row">
                      {w.name}
                    </TableCell>
                    <TableCell align="left">{w.pos}</TableCell>
                    <TableCell align="left">{w.definition}</TableCell>
                    <TableCell align="left">{w.deck}</TableCell>
                    <TableCell align="left">
                      <IconButton
                        aria-label="delete"
                        onClick={() => {
                          deleteWord(user, w)
                        }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <ExportContainer>
            <Button
              color="primary"
              variant="contained"
              onClick={() => {
                exportToAnki(words)
              }}
            >
              Export apkg
            </Button>
          </ExportContainer>
        </Grid>

        <Grid item xs={12}>
          <Footer>
            Logged in as {user.email} |&nbsp;
            <a href="#" onClick={() => auth.signOut()}>
              Logout
            </a>
            <br />
            <a href="https://github.com/vinhlh/oxfordanki" target="__blank">
              vinhlh/oxfordanki
            </a>
          </Footer>
        </Grid>
      </Grid>

      {renderAddDeckForm()}

      <Snackbar open={!!error} autoHideDuration={6000} onClose={handleClose}>
        <MuiAlert
          elevation={6}
          variant="filled"
          onClose={handleClose}
          severity="error"
        >
          {error}
        </MuiAlert>
      </Snackbar>
    </Container>
  )
}

export default Builder
