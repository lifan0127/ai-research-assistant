import React, { Fragment, useState } from 'react'
import { ButtonGroup } from '../../components/buttons/ButtonGroup'

interface InfoPanelProps {
  promptLibrary: JSX.Element
  faq: JSX.Element
}

export function InfoPanel({ promptLibrary, faq }: InfoPanelProps) {
  const [selected, setSelected] = useState<string>('promptLibrary')
  const groups = [
    {
      key: 'promptLibrary',
      label: 'Prompt Library',
      component: promptLibrary,
      onClick: () => setSelected('promptLibrary'),
    },
    {
      key: 'faq',
      label: 'FAQ',
      component: faq,
      onClick: () => setSelected('faq'),
    },
  ]
  return (
    <div className="py-4">
      <ButtonGroup groups={groups} selected={selected} />
      <div className="mt-6">
        {groups.map(({ key, component }) => {
          return selected === key ? <Fragment key={key}>{component}</Fragment> : null
        })}
      </div>
    </div>
  )
}
