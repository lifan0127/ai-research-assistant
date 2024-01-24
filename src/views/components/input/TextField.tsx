import React, { forwardRef, useState, useRef, useEffect, useLayoutEffect } from 'react'
import { CheckIcon, XMarkIcon, SparklesIcon } from '@heroicons/react/24/outline'
import { MentionsInput, Mention, SuggestionDataItem } from 'react-mentions'
import Highlighter from 'react-highlight-words'
import { isEqual } from 'lodash'
import * as zot from '../../../apis/zotero'
import { States, selectionConfig } from '../../../models/utils/states'
import { useStates } from '../../hooks/useStates'
import { escapeTitle, StateName, MentionValue } from '../../../models/utils/states'
import { prefixes, parsePromptTemplate } from '../../features/infoPanel/PromptLibrary'
import { LinkButton } from '../buttons/LinkButton'
import { PromptList } from '../../features/infoPanel/PromptLibrary'
import { INPUT_CHARACTER_LIMIT } from '../../../constants'

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
  promptTemplate?: { template: string }
  setPromptTemplate: (template: { template: string } | undefined) => void
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
      promptTemplate,
      setPromptTemplate,
    },
    ref
  ) => {
    const [hasPromptTemplate, setHasPromptTemplate] = useState(false)
    const [isNewTemplate, setIsNewTemplate] = useState(false)
    const mentionRef = useRef(null)

    useLayoutEffect(() => {
      if (promptTemplate === undefined) {
        setHasPromptTemplate(false)
      } else {
        setHasPromptTemplate(true)
        setIsNewTemplate(true)
        const htmlRef = (ref as any).current as HTMLTextAreaElement
        htmlRef.focus()
        // If the input didn't change, for example, the user clicked on the same prompt template button, we need to manually apply the prompt template to populate and position the suggestions overlay.
        if (value.newPlainTextValue === promptTemplate.template) {
          applyPromptTemplate(value.newPlainTextValue, true)
          return
        }
        const mentionsInput = (mentionRef as any).current
        // The position has to be set to the end of the input, for both current input value and the new value, otherwise the display may be incorrect when switching prompt templates.
        const position = Math.max(value.newPlainTextValue.length, promptTemplate.template.length)
        mentionsInput.handleChange({
          target: {
            value: promptTemplate.template,
            selectionStart: position,
            selectionEnd: position,
          },
          nativeEvent: {},
        })
      }
    }, [promptTemplate])

    useLayoutEffect(() => {
      if (hasPromptTemplate) {
        applyPromptTemplate(value.newPlainTextValue, isNewTemplate)
      }
    }, [value])

    function applyPromptTemplate(activePromptTemplate: string | undefined, isNewTemplate = false) {
      if (activePromptTemplate === undefined || activePromptTemplate === '') {
        return
      }

      const htmlRef = (ref as any).current as HTMLTextAreaElement
      const mentionsInput = (mentionRef as any).current

      mentionsInput.clearSuggestions()

      const parseResult = parsePromptTemplate(
        activePromptTemplate,
        prefixes,
        isNewTemplate ? undefined : htmlRef.selectionStart,
        isNewTemplate ? undefined : htmlRef.selectionEnd
      )
      if (!parseResult) {
        mentionsInput.setState({ disallowSelect: false })
        const position = activePromptTemplate.length
        setPromptTemplate && setPromptTemplate(undefined)
        setHasPromptTemplate(false)
        htmlRef.setSelectionRange(position, position)
      } else {
        const { prefix, query, position } = parseResult
        mentionsInput.setState({ disallowSelect: query === '', selectionStart: position, selectionEnd: position })
        mentionsInput.updateMentionsQueries(activePromptTemplate, position)
        console.log({ state: mentionsInput.state, position })

        // When a new templat is loaded, move the cursor and the suggestion overlay to the prefix position
        if (query === '') {
          htmlRef.setSelectionRange(position, position)
          // Ensure that the suggestion overlay is positioned above the current placeholder
          // If the condition is removed, keyboard selection won't work for multi-placeholder template.
          if (isNewTemplate) {
            mentionsInput.handleChange({
              target: {
                value: activePromptTemplate,
                selectionStart: position,
                selectionEnd: position,
              },
              nativeEvent: {},
            })
          } else {
            mentionsInput.render()
          }
        }
      }
      setIsNewTemplate(false)
    }

    function handleChange(event: any, newValue: string, newPlainTextValue: string, mentions: MentionValue['mentions']) {
      if (!isEqual(value, { newValue, newPlainTextValue, mentions })) {
        setValue &&
          setValue({
            newValue,
            newPlainTextValue,
            mentions: isEqual(value.mentions, mentions) ? value.mentions : mentions,
          })
      }
    }
    function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement> | React.KeyboardEvent<HTMLInputElement>) {
      if (event.key === 'Enter' && !event.shiftKey && event.currentTarget.value !== '') {
        event.preventDefault()
        onSubmit && onSubmit()
        setPromptTemplate && setPromptTemplate(undefined)
        setHasPromptTemplate(false)
      }
    }
    function handleConfirm() {
      onSubmit && onSubmit()
      setHasPromptTemplate(false)
      setPromptTemplate && setPromptTemplate(undefined)
    }

    function handleCancel() {
      onCancel && onCancel()
      setHasPromptTemplate(false)
      setPromptTemplate && setPromptTemplate(undefined)
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

    return (
      <div>
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
            appendSpaceOnAdd={!promptTemplate}
            style={isEdit ? tagEditStyle : tagDisplayStyle}
          />
          <Mention
            trigger="@"
            data={fetchCreators}
            markup="@[__display__](__id__)"
            appendSpaceOnAdd={!promptTemplate}
            style={isEdit ? creatorEditStyle : creatorDisplayStyle}
            renderSuggestion={tokenizedHighlighter}
          />
          <Mention
            trigger="/"
            data={fetchItems}
            markup="/[__display__](__id__)"
            displayTransform={(_, display) => `${display.length > 32 ? display.slice(0, 32) + '...' : display}`}
            appendSpaceOnAdd={!promptTemplate}
            style={isEdit ? itemEditStyle : itemDisplayStyle}
            renderSuggestion={tokenizedHighlighter}
          />
          <Mention
            trigger="^"
            data={fetchCollections}
            markup="^[__display__](__id__)"
            appendSpaceOnAdd={!promptTemplate}
            style={isEdit ? collectionEditStyle : collectionDisplayStyle}
            renderSuggestion={tokenizedHighlighter}
          />
          <Mention
            trigger="~"
            data={[]}
            markup="~[__display__](__id__)"
            appendSpaceOnAdd={!promptTemplate}
            style={isEdit ? imageEditStyle : imageDisplayStyle}
          />
        </MentionsInput>
        {isEdit ? (
          <div className="mt-2 flex flex-row">
            {displayButtons ? (
              <>
                <div className="px-1 pt-2">
                  <span
                    className={
                      value.newPlainTextValue.length <= INPUT_CHARACTER_LIMIT ? 'text-neutral-500' : 'text-tomato'
                    }
                  >
                    {value.newPlainTextValue.length}/{INPUT_CHARACTER_LIMIT}
                  </span>
                </div>
                <div className="grow"></div>
                <div>
                  <span className="inline-flex rounded-md shadow-sm mt-1">
                    <button
                      type="button"
                      className="relative inline-flex items-center bg-white hover:bg-gray-200 focus:z-10 border-none p-1 rounded-full mr-2"
                      aria-label="Cancel"
                      onClick={handleCancel}
                    >
                      <XMarkIcon className="w-4 h-4 text-neutral-500" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      className="relative inline-flex items-center bg-white hover:bg-gray-200 focus:z-10 border-none p-1 rounded-full"
                      aria-label="Confirm"
                      onClick={handleConfirm}
                    >
                      <CheckIcon className="w-4 h-4 text-neutral-500" aria-hidden="true" />
                    </button>
                  </span>
                </div>
              </>
            ) : (
              <>
                <PromptList displayButtons={displayButtons} setPromptTemplate={setPromptTemplate} />
                <div className="grow"></div>
                <div className="px-1 pt-1 mr-8">
                  <span
                    className={
                      value.newPlainTextValue.length <= INPUT_CHARACTER_LIMIT ? 'text-neutral-500' : 'text-tomato'
                    }
                  >
                    {value.newPlainTextValue.length}/{INPUT_CHARACTER_LIMIT}
                  </span>
                </div>
              </>
            )}
          </div>
        ) : null}
      </div>
    )
  }
)
