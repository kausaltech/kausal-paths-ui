import { GetPageQuery } from 'common/__generated__/graphql';
import { useTranslation } from 'common/i18n';
import { useTheme } from 'common/theme';
import Button from 'components/common/Button';
import Joyride, { Step, TooltipRenderProps } from 'react-joyride';
import { Toast, ToastBody, ToastHeader } from 'reactstrap';

const joyrideSteps: Step[] = [
  { target: '#global-navigation-bar', content: 'Navbaari', title: 'Main menu' },
  {
    target: '#settings-panel',
    content: 'This is where you can select a scenario, blah blah.',
    disableScrolling: true,
    title: 'Settings panel',
  },
  {
    target: '#settings-panel-button',
    disableScrolling: true,
    content: 'Click here to open expanded settings.',
  },
  {
    target: '#net_emissions-panel-graph',
    content: 'Here are emissions blah blah.',
    placement: 'bottom-start',
  },
];

const Tooltip = (props: TooltipRenderProps) => {
  const {
    continuous,
    index,
    step,
    backProps,
    closeProps,
    primaryProps,
    tooltipProps,
  } = props;
  console.log(props);
  const { t } = useTranslation();
  const { ref, ...rest } = tooltipProps;
  return (
    <Toast fade={false} innerRef={ref} {...rest}>
      <ToastHeader
        toggle={closeProps.onClick}
        closeAriaLabel={t('close', 'Close')}
      >
        {step.title ? step.title : null}
      </ToastHeader>
      <ToastBody>
        <div>{step.content}</div>
        <div className="d-flex">
          {index > 0 && <Button {...backProps}>{t('back', 'Back')}</Button>}
          {continuous && (
            <Button {...primaryProps} className="ms-auto" color="primary">
              {t('next', 'Next')}
            </Button>
          )}
        </div>
      </ToastBody>
    </Toast>
  );
};

type ProductTourProps = {
  page: NonNullable<GetPageQuery['page']>;
};

export function ProductTour(props: ProductTourProps) {
  const { page } = props;
  const theme = useTheme();
  if (page.__typename !== 'OutcomePage') return null;
  return (
    <Joyride
      steps={joyrideSteps}
      debug={true}
      continuous={true}
      tooltipComponent={Tooltip}
      styles={{
        options: {
          arrowColor: theme.brandNavBackground,
          //backgroundColor: theme.brandNavBackground,
          overlayColor: 'rgba(0, 0, 0, .3)',
          //primaryColor: theme.graphColors.red050,
          //textColor: theme.textColor.primary,
          zIndex: 1000,
        },
        spotlight: {
          //backgroundColor: 'transparent',
          //zIndex: 500,
        },
      }}
      showProgress={true}
      showSkipButton={true}
    />
  );
}
