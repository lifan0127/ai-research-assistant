import React from 'react'
import { Link } from '../../components/buttons/Link'

interface QuestionProps {
  question: string
  answer: string | JSX.Element
}

function Question({ question, answer }: QuestionProps) {
  return (
    <div className="ml-2">
      <h4 className="text-lg font-medium text-gray-900 m-0 p-0 pb-1">{question}</h4>
      <div className="text-sm text-gray-500">{answer}</div>
    </div>
  )
}

const questions = [
  {
    question: 'I cannot use Aria, even though I have a ChatGPT Plus subscription.',
    answer: (
      <div>
        <strong>ChatGPT Plus</strong> and <strong>GPT APIs</strong> are different offerings from OpenAI. Aria requires
        the GPT APIs to work. Please make sure you have a valid OpenAI API key:{' '}
        <Link url="https://platform.openai.com/api-keys" text="https://platform.openai.com/api-keys" />, and note that
        OpenAI may limit certain GPT models to paying customers only.
      </div>
    ),
  },
  {
    question: 'Can I use an OpenAI proxy server or the Azure OpenAI?',
    answer:
      'If you access the OpenAI APIs through a proxy server, you can update the OpenAI API base URL accordingly in Preferences > Aria. As for Azure OpenAI, it is unfortunately not supported at the moment.',
  },
  {
    question: 'I encountered an error when using Aria. What should I do?',
    answer: (
      <div>
        Common errors include: 1. invalid OpenAI API key, 2. invalid API base URL or proxy server error, 3. no access to
        certain GPT model(s). Please feel free to{' '}
        <Link url="https://github.com/lifan0127/ai-research-assistant/issues" text="report your error" /> on the GitHub
        repo for assistance.
      </div>
    ),
  },
  {
    question: 'Does Aria support languages other than English?',
    answer:
      'Aria officially only supports English. However, as the underlying GPT models are multilingual, you may have success in conversing with Aria in other languages',
  },
  {
    question: "What if I have a question that isn't answered here?",
    answer: (
      <div>
        You are welcome to{' '}
        <Link url="https://github.com/lifan0127/ai-research-assistant/issues" text="create an issue" /> or{' '}
        <Link url="https://github.com/lifan0127/ai-research-assistant/discussions" text="start a discussion" /> on the
        GitHub repo.
      </div>
    ),
  },
]

export function FAQ() {
  return (
    <ul className="divide-y divide-gray-200 w-full md:w-3/4 xl:w-2/3 mx-auto list-none p-0">
      {questions.map(({ question, answer }) => (
        <li key={question} className="mb-4">
          <Question question={question} answer={answer} />
        </li>
      ))}
    </ul>
  )
}
