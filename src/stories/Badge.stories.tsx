import React from 'react';

import Badge from '@/components/common/Badge';

const Story = {
  title: 'Example/Badge',
  component: Badge,
  argTypes: {
    color: { control: 'color' },
  },
};

const Template = (args) => <Badge {...args}> Badge content </Badge>;

export const Primary = Template.bind({});
Primary.args = {
  label: 'Badge',
};

export default Story;
