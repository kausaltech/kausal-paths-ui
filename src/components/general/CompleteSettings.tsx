import { useCallback, useContext, useState } from 'react';
import { useReactiveVar } from '@apollo/client';
import styled from 'styled-components';
import { Container, Row, Col, Button, UncontrolledCollapse, Card, CardBody } from 'reactstrap';
import { Sliders, ChevronBarExpand, ChevronBarContract, ChevronBarDown } from 'react-bootstrap-icons';
import RangeSelector from 'components/general/RangeSelector';
import { useSite } from 'context/site';
import { yearRangeVar, } from 'common/cache'
import GoalSelector from 'components/general/GoalSelector';
import ScenarioSelector from 'components/general/ScenarioSelector';
import NormalizationWidget from './NormalizationWidget';
import GoalOutcomeBar from 'components/general/GoalOutcomeBar';
import GlobalParameters from 'components/general/GlobalParameters';
import { useInstance } from 'common/instance';
import { useTranslation } from 'next-i18next';

const DisplaySettings = styled.div`
  display: flex;
`;

const SettingsSection = styled.div`
  margin-bottom: 1rem;
`;

const AccordionHeader = styled(Button)`
  width: 100%;
  text-align: left;
  border-radius: 0;
  border: none;
  background-color: ${(props) => props.theme.graphColors.grey000};
  color: ${(props) => props.theme.graphColors.grey090};
  box-shadow: 0 0 4px 4px rgba(20,20,20,0.05);
  border-top: 2px solid ${(props) => props.theme.graphColors.grey050};
`;

const AccordionContent = styled(UncontrolledCollapse)`
  background-color: ${(props) => props.theme.graphColors.grey020};
  padding: 1rem;
  overflow-y: auto;
`;

const CompleteSettings = (props) => {
  if (!(process.browser)) {
    return null;
  }
  const site = useSite();
  const instance = useInstance();

  const hasGlobalParameters = (
    site.parameters.find((param) => param.isCustomizable) !== undefined ||
    site.availableNormalizations.length > 0
  );

  // State of display settings
  // Year range
  const defaultYearRange = props.defaultYearRange ?? [site.minYear, site.targetYear];
  const yearRange = useReactiveVar(yearRangeVar);
  const setYearRange = useCallback((newRange: [number, number]) => {
    yearRangeVar(newRange);
  }, [yearRangeVar]);
  const { t } = useTranslation();

  // Target
  const nrGoals = instance.goals.length;

  // Normalization
  const availableNormalizations = site.availableNormalizations;
  return (
    <div>
      <h3>Settings</h3>
      <SettingsSection>
      <AccordionHeader
        color="primary"
        id="display-toggler"
      >
        Display
      </AccordionHeader>
      <UncontrolledCollapse toggler="#display-toggler" defaultOpen>
      <Card>
      <CardBody>
          <DisplaySettings>
            <div>
            <h5>{t('comparing-years')}</h5>
            <RangeSelector
                min={site.minYear}
                max={site.maxYear}
                initMin={defaultYearRange[0]}
                initMax={defaultYearRange[1]}
                baseYear={instance.referenceYear ?? site.baseYear}
                handleChange={setYearRange}
              />
            </div>
            <div>
            <h5>Normalization</h5>
            { availableNormalizations.length > 0 && <NormalizationWidget availableNormalizations={availableNormalizations} />}
            </div>
            <div>
            <h5>Target</h5>
            { nrGoals > 1 && (
                <GoalSelector />
              )}
            </div>
          </DisplaySettings>
          </CardBody>
        </Card>
      </UncontrolledCollapse>
      </SettingsSection>
      <SettingsSection>
      <AccordionHeader
        color="primary"
        id="scenario-toggler"
      >
        Scenario: Selected Scenario
      </AccordionHeader>
      <UncontrolledCollapse toggler="#scenario-toggler" defaultOpen>
      <Card>
          <CardBody>
            <h5>Select scenario</h5>
            <h5>Actions</h5>
            <h5>Global settings</h5>
            <GlobalParameters parameters={site.parameters} />
          </CardBody>
        </Card>
      </UncontrolledCollapse>
      </SettingsSection>
      <SettingsSection>
      <AccordionHeader
        color="primary"
        id="outcome-toggler"
      >
        Outcome
      </AccordionHeader>
      <UncontrolledCollapse toggler="#outcome-toggler" defaultOpen>
      <Card>
          <CardBody>
            <GoalOutcomeBar />
          </CardBody>
        </Card>
      </UncontrolledCollapse>     
      </SettingsSection>     
    </div>
  );

}

export default CompleteSettings;