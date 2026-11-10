import { type IqComponent } from '@/shared/api'

import {
  CareAction,
  LabResult,
  PrepChecklist,
  SafetyNotice,
} from './components'

interface GenerativeUIProps {
  component: IqComponent
}

export const GenerativeUI = ({ component }: GenerativeUIProps) => {
  switch (component.name) {
    case 'lab_result':
      return <LabResult {...component.props} />
    case 'care_action':
      return <CareAction {...component.props} />
    case 'safety_notice':
      return <SafetyNotice {...component.props} />
    case 'prep_checklist':
      return <PrepChecklist {...component.props} />
  }
}
