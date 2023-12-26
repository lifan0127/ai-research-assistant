import React, { forwardRef, useRef } from 'react'
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { MentionsInput, Mention, SuggestionDataItem } from 'react-mentions'
import Highlighter from 'react-highlight-words'
import { isEqual } from 'lodash'
import * as zot from '../../../apis/zotero'
import { States, selectionConfig } from '../../../models/utils/states'
import { useStates } from '../../hooks/useStates'
import { escapeTitle, StateName, MentionValue } from '../../../models/utils/states'

const editStyles = {
  control: {
    backgroundColor: '#fff',
    fontSize: 14,
    fontWeight: 'normal',
    color: '#000',
    maxHeight: '16rem',
  },
  '&multiLine': {
    control: {
      fontFamily: 'monospace',
      minHeight: '1.5rem',
    },
    highlighter: {
      padding: 0,
      border: 'none',
      overflow: 'visible',
      maxHeight: '16rem',
      lineHeight: '1.5rem',
    },
    input: {
      padding: 0,
      border: 'none',
      overflow: 'auto',
      lineHeight: '1.5rem',
      backgroundColor: 'transparent',
      color: '#000',
    },
  },
  suggestions: {
    list: {
      backgroundColor: 'white',
      border: '1px solid rgba(0,0,0,0.15)',
      fontSize: 14,
    },
    item: {
      padding: '5px 15px',
      borderBottom: '1px solid rgba(0,0,0,0.15)',
      '&focused': {
        backgroundColor: '#cee4e5',
      },
    },
  },
}

const displayStyle = {
  control: {
    fontSize: 14,
    fontWeight: 'normal',
  },
  '&multiLine': {
    control: {
      fontFamily: 'inherit',
    },
    highlighter: {
      padding: 0,
      border: 'none',
      color: 'white',
    },
    input: {
      padding: 0,
      border: 'none',
      overflow: 'auto',
      color: 'white',
    },
  },
}

const mentionEditStyle = {}
const mentionDisplayStyle = {}

const creatorEditStyle = {
  ...mentionEditStyle,
  // backgroundColor: selectionConfig.creators.backgroundColor,
  borderBottom: selectionConfig.creators.borderBottom,
}

const creatorDisplayStyle = {
  ...mentionDisplayStyle,
  textDecoration: 'underline',
}

const tagEditStyle = {
  ...mentionEditStyle,
  // backgroundColor: selectionConfig.tags.backgroundColor,
  borderBottom: selectionConfig.tags.borderBottom,
}

const tagDisplayStyle = {
  ...mentionDisplayStyle,
  textDecoration: 'underline',
}

const itemEditStyle = {
  ...mentionEditStyle,
  // backgroundColor: selectionConfig.items.backgroundColor,
  borderBottom: selectionConfig.items.borderBottom,
}

const itemDisplayStyle = {
  ...mentionDisplayStyle,
  textDecoration: 'underline',
}

const collectionEditStyle = {
  ...mentionEditStyle,
  // backgroundColor: selectionConfig.collections.backgroundColor,
  borderBottom: selectionConfig.collections.borderBottom,
}

const collectionDisplayStyle = {
  ...mentionDisplayStyle,
  textDecoration: 'underline',
}

const imageEditStyle = {
  ...mentionEditStyle,
  // backgroundColor: selectionConfig.collections.backgroundColor,
  borderBottom: selectionConfig.images.borderBottom,
}

const imageDisplayStyle = {
  ...mentionDisplayStyle,
  textDecoration: 'underline',
}

function fetchFactory(fieldName: zot.FieldName, name: StateName, qtextFunc?: (qtext: string) => string) {
  return function (qtext: string, callback: any) {
    zot
      .suggest(qtextFunc ? qtextFunc(qtext) : qtext, fieldName)
      .then(res =>
        (res as string[]).slice(0, 10).map((result: string) => ({
          display: escapeTitle(result),
          id: name + '|' + Zotero.Utilities.Internal.Base64.encode(result),
        }))
      )
      .then(callback)
      .catch(error => {
        console.log({ source: `fetch-${fieldName}`, error })
        return []
      })
  }
}

const fetchTags = fetchFactory('tag', 'tags')
const fetchCreators = fetchFactory('creator', 'creators', qtext => '%' + qtext.split(' ').join('%'))

function fetchItems(qtext: string, callback: any) {
  zot
    .suggestItems({ qtext })
    .then(results => results.map(({ id, title }) => ({ display: escapeTitle(title.toString()), id: `items|${id}` })))
    .then(callback)
    .catch(error => {
      console.log({ source: `fetch-item`, error })
      return []
    })
}

function fetchCollections(qtext: string, callback: any) {
  zot
    .suggestCollections({ qtext })
    .then(results =>
      results.map(({ id, title, itemCount }) => ({
        display: escapeTitle(`${title} (${itemCount} ${itemCount > 1 ? 'items' : 'item'})`),
        id: `collections|${id}`,
      }))
    )
    .then(callback)
    .catch(error => {
      console.log({ source: `fetch-collection`, error })
      return []
    })
}

interface TextFieldProps {
  isEdit?: boolean
  onSubmit?: () => void
  onCancel?: () => void
  displayButtons?: boolean
  states: States
  resetStates?: ReturnType<typeof useStates>['reset']
  value: MentionValue
  setValue?: (value: MentionValue) => void
  forceSuggestionsAboveCursor: boolean
}

type Ref = HTMLTextAreaElement | null

export const TextField = forwardRef<Ref, TextFieldProps>(
  (
    {
      isEdit = true,
      onSubmit,
      onCancel,
      displayButtons = false,
      states,
      resetStates,
      value,
      setValue,
      forceSuggestionsAboveCursor,
    },
    ref
  ) => {
    const mentionRef = useRef(null)
    function handleChange(event: any, newValue: string, newPlainTextValue: string, mentions: MentionValue['mentions']) {
      // console.log({ newValue, newPlainTextValue, mentions })
      setValue &&
        setValue({
          newValue,
          newPlainTextValue,
          mentions: isEqual(value.mentions, mentions) ? value.mentions : mentions,
        })
    }
    function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement> | React.KeyboardEvent<HTMLInputElement>) {
      if (event.key === 'Enter' && !event.shiftKey && event.currentTarget.value !== '') {
        event.preventDefault()
        onSubmit && onSubmit()
      }
    }
    function handleConfirm() {
      onSubmit && onSubmit()
    }

    function handleCancel() {
      onCancel && onCancel()
    }

    function tokenizedHighlighter(suggestion: SuggestionDataItem, search: string) {
      return (
        <Highlighter
          searchWords={search.split(' ')}
          autoEscape={true}
          textToHighlight={suggestion.display || ''}
          highlightTag="b"
        />
      )
    }

    function setText() {
      setValue &&
        setValue({
          newValue: 'Hello /',
          newPlainTextValue: 'Hello /',
          mentions: [],
        })
    }

    function moveCursor(e: any) {
      // e.target.blur()
      const myRef: any = ref
      myRef?.current?.focus()
      // myRef?.current?.setSelectionRange(7, 7)
      // const menRef: any = mentionRef
      // console.log({ menRef })
      // // menRef.current.state.caretPosition = 7
      // menRef.current.setState({ caretPosition: 7, selectionStart: 7, selectionEnd: 7 })
      // console.log({ ref: menRef.current.updateSuggestionsPosition })
      // menRef.current.renderSuggestionsOverlay()
      // menRef.current.updateSuggestionsPosition()
      // menRef.current.handleChange({ target: { value: 'Hello /' }, nativeEvent: {  } })
      const mentionsInput = mentionRef.current as any
      mentionsInput.queryData('', 2, 7, 7, 'Hello /')
      mentionsInput.render()
    }

    function simulatePaste(e: any) {
      const mentionsInput = mentionRef.current as any

      if (!mentionsInput) {
        return
      }

      // If the MentionsInput component uses an `onChange` handler, call it
      // Replace `newValue` and other arguments with appropriate values based on your implementation
      const simulatedEvent = {
        target: { value: 'Hello /', selectionStart: 7, selectionEnd: 7 },
        nativeEvent: {},
      }
      if (mentionsInput.handleChange) {
        mentionsInput.handleChange(simulatedEvent)
        // mentionsInput.updateMentionsQueries('Hello /', mentionsInput.state.caretPosition)
        // mentionsInput.updateSuggestionsPosition()
        mentionsInput.queryData('', 2, 7, 7, 'Hello /')
        // mentionsInput.render()
        // mentionsInput.setState({
        //   setSelectionAfterMentionChange: false,
        //   setSelectionAfterHandlePaste: false,
        //   selectionStart: 7,
        //   selectionEnd: 7,
        // })
        // const myRef: any = ref
        // myRef.current.focus()
      }
    }

    return (
      <div>
        <button onClick={setText}>Set text</button>
        <button onClick={moveCursor}>click me</button>
        <button onClick={simulatePaste}>paste</button>
        <MentionsInput
          value={value.newValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          ref={mentionRef}
          inputRef={ref}
          placeholder="Ask a question or reference @author, #tag, /document and more."
          style={isEdit ? editStyles : displayStyle}
          a11ySuggestionsListLabel={'Suggested Zotero entities for mention'}
          allowSuggestionsAboveCursor={true}
          forceSuggestionsAboveCursor={forceSuggestionsAboveCursor}
          allowSpaceInQuery={true}
          autoFocus={isEdit}
        >
          <Mention
            trigger="#"
            markup="#[__display__](__id__)"
            data={fetchTags}
            appendSpaceOnAdd={true}
            style={isEdit ? tagEditStyle : tagDisplayStyle}
          />
          <Mention
            trigger="@"
            data={fetchCreators}
            markup="@[__display__](__id__)"
            appendSpaceOnAdd={true}
            style={isEdit ? creatorEditStyle : creatorDisplayStyle}
            renderSuggestion={tokenizedHighlighter}
          />
          <Mention
            trigger="/"
            data={fetchItems}
            markup="/[__display__](__id__)"
            displayTransform={(_, display) => `${display.length > 32 ? display.slice(0, 32) + '...' : display}`}
            appendSpaceOnAdd={true}
            style={isEdit ? itemEditStyle : itemDisplayStyle}
            renderSuggestion={tokenizedHighlighter}
          />
          <Mention
            trigger="^"
            data={fetchCollections}
            markup="^[__display__](__id__)"
            appendSpaceOnAdd={true}
            style={isEdit ? collectionEditStyle : collectionDisplayStyle}
            renderSuggestion={tokenizedHighlighter}
          />
          <Mention
            trigger="~"
            data={[]}
            markup="~[__display__](__id__)"
            appendSpaceOnAdd={true}
            style={isEdit ? imageEditStyle : imageDisplayStyle}
          />
        </MentionsInput>
        {displayButtons ? (
          <div className="text-right">
            <span className="inline-flex rounded-md shadow-sm mt-1">
              <button
                type="button"
                className="relative inline-flex items-center bg-white hover:bg-gray-200 focus:z-10 border-none p-1 rounded-full mr-2"
                aria-label="Cancel"
                onClick={handleCancel}
              >
                <XMarkIcon className="w-4 h-4 text-black" aria-hidden="true" />
              </button>
              <button
                type="button"
                className="relative inline-flex items-center bg-white hover:bg-gray-200 focus:z-10 border-none p-1 rounded-full"
                aria-label="Confirm"
                onClick={handleConfirm}
              >
                <CheckIcon className="w-4 h-4 text-black" aria-hidden="true" />
              </button>
            </span>
          </div>
        ) : null}
      </div>
    )
  }
)
