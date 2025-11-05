// Button.stories.js | Button.stories.jsx
import EmissionsCard from '../components/general/EmissionsCard';

export default {
  component: EmissionsCard,
  title: 'Components/EmissionsCard',
};

// 👇 We create a “template” of how args map to rendering
const Template = (args) => <EmissionsCard {...args} />;

// 👇 Each story then reuses that template
export const Primary = Template.bind({});
Primary.args = {
  sector: [],
  state: '',
  startYear: '2002',
  endYear: '2010',
  hovered: false,
  active: false,
  color: '#990055',
  onHover: () => undefined,
  handleClick: () => undefined,
};

export const Secondary = Template.bind({});
Secondary.args = { ...Primary.args, label: '😄👍😍💯' };

export const Tertiary = Template.bind({});
Tertiary.args = { ...Primary.args, label: '📚📕📈🤓' };

// sector, state, hovered, onHover, handleClick, active, color, startYear, endYear
