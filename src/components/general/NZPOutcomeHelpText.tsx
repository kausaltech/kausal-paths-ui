import React from 'react';

import { Accordion, AccordionDetails, AccordionSummary, Typography } from '@mui/material';
import { ChevronDown } from 'react-bootstrap-icons';

const CONTENT = [
  {
    id: 'emissions-scopes',
    title: 'Emissions scopes covered',
    content: (
      <>
        Emissions in NetZeroPlanner cover Scope 1 (direct emissions within the city boundary) and
        Scope 2 (emissions from purchased electricity and heat). Scope 3 emissions are generally
        excluded, except for solid waste that is generated in the city but treated outside the city.
      </>
    ),
  },

  {
    id: 'baseline-scenario',
    title: 'Understanding the baseline scenario',
    content: (
      <>
        The Baseline scenario (also called Business as Usual) shows how emissions would develop if
        no new climate actions were taken. Emissions rise over time as the population grows, but
        also fall slightly as old equipment (cars, trucks, heating systems, etc.) is naturally
        replaced with newer, more efficient fossil-fuel models.
      </>
    ),
  },
];

const NZPOutcomeHelpText = () => {
  return (
    <>
      {CONTENT.map((item) => (
        <Accordion disableGutters key={item.id}>
          <AccordionSummary
            expandIcon={<ChevronDown size={16} />}
            aria-controls={`${item.id}-content`}
            id={`${item.id}-header`}
            sx={{ minHeight: '40px' }}
          >
            <Typography variant="h6" component="p">
              {item.title}
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography>{item.content}</Typography>
          </AccordionDetails>
        </Accordion>
      ))}
    </>
  );
};

export default NZPOutcomeHelpText;
