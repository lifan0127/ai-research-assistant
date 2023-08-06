import React from 'react'
import releases from '../../releases'

export interface ReleaseNoteProps {}

export function ReleaseNote({}: ReleaseNoteProps) {
  const { date, version, features, bugFixes } = releases[0]
  const dateObj = new Date(date)
  const year = dateObj.getFullYear()
  const month = dateObj.toLocaleString('default', { month: 'long' })
  return (
    <div className="mx-24 my-12 px-8 py-4 text-gray-400 bg-white bg-opacity-50">
      <h3 className="text-lg font-bold mt-2">
        {month} {year} Release (Version: {version})
      </h3>
      <h4 className="text-base font-bold mb-2">New Features</h4>
      <ul>
        {features.map((feature, i) => {
          return (
            <li key={`feature-${i}`} className="mb-2 last-of-type:mb-0">
              {feature}
            </li>
          )
        })}
      </ul>
      <h4 className="text-base font-bold mb-2">Bug Fixes</h4>
      {bugFixes.length ? (
        <ul>
          {bugFixes.map((fix, i) => {
            return (
              <li key={`bug-fix-${i}`} className="mb-2 last-of-type:mb-0">
                {fix}
              </li>
            )
          })}
        </ul>
      ) : (
        'No major bug fixes this time.'
      )}
    </div>
  )
}
