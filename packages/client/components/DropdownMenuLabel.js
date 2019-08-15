import styled from '@emotion/styled'
import textOverflow from '../styles/helpers/textOverflow'
import appTheme from '../styles/theme/appTheme'
import ui from '../styles/ui'

const DropdownMenuLabel = styled('div')(({isEmpty}) => ({
  ...textOverflow,
  borderBottom: `1px solid ${appTheme.palette.mid30l}`,
  color: ui.palette.dark,
  fontSize: 15,
  fontWeight: 600,
  lineHeight: '32px',
  marginBottom: isEmpty ? '-' + ui.menuGutterVertical : ui.menuGutterVertical,
  padding: `0 16px`,
  userSelect: 'none'
}))

export default DropdownMenuLabel
