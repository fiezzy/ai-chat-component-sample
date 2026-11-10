'use client'

import { useState } from 'react'

import { Chat } from '@/features/Chat'
import { IQ_SCENARIO_HEADER } from '@/shared/constants/api'
import { IQ_DEMO_SCENARIOS } from '@/shared/constants/demo'

import { DEMO_COMMANDS } from './constants/demoCommands'
import s from './DemoPanel.module.css'

const AUTO = ''

/** Wraps the chat with mock controls. Chat itself knows nothing about them. */
export const DemoPanel = () => {
  const [scenario, setScenario] = useState(AUTO)
  const requestHeaders =
    scenario === AUTO ? undefined : { [IQ_SCENARIO_HEADER]: scenario }

  return (
    <div className={s.demo}>
      <div className={s.panel}>
        <label className={s.field}>
          Scenario
          <select
            onChange={(event) => setScenario(event.target.value)}
            value={scenario}
          >
            <option value={AUTO}>From the question</option>
            {IQ_DEMO_SCENARIOS.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className={s.chat}>
        <Chat commands={DEMO_COMMANDS} requestHeaders={requestHeaders} />
      </div>
    </div>
  )
}
