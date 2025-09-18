import React from 'react';

import { useTheme } from '@emotion/react';
import type { Theme } from '@emotion/react';
import styled from '@emotion/styled';
import { FormControl } from '@mui/material';
import Highlighter from 'react-highlight-words';
import Select, {
  type GroupBase,
  type MultiValueProps,
  type SelectComponentsConfig,
  type Theme as SelectTheme,
  type ValueContainerProps as SelectValueContainerProps,
  components,
} from 'react-select';

import PopoverTip from '@/components/common/PopoverTip';

const Label = styled.label`
  font-size: ${({ theme }) => theme.fontSizeSm};
  font-weight: ${({ theme }) => theme.formLabelFontWeight};
  line-height: ${({ theme }) => theme.lineHeightMd};
  margin-bottom: ${({ theme }) => theme.spaces.s050};
`;

function getSelectStyles<
  Option extends SelectDropdownOption,
  IsMulti extends boolean,
  Group extends GroupBase<Option>,
>(theme: Theme, multi: boolean, size: string = '') {
  const suffix = size ? `-${size}` : '';
  const inputHeight =
    `calc((${theme.inputLineHeight}*${theme.fontSizeBase}) +` +
    ` (${theme.inputPaddingY}*2) + (${theme.inputBorderWidth}*2))`;

  const styles: NonNullable<SelectDropdownProps<Option, IsMulti, Group>['styles']> = {
    control: (provided, { isDisabled, isFocused }) => ({
      ...provided,
      backgroundColor: `var(--bs-select${isDisabled ? '-disabled' : ''}-bg)`,
      borderColor: isDisabled
        ? theme.graphColors.grey050
        : isFocused
          ? theme.inputBtnFocusColor
          : theme.themeColors.dark,
      borderWidth: theme.inputBorderWidth,
      borderRadius: theme.inputBorderRadius,
      lineHeight: theme.inputLineHeight,
      fontSize: `var(--bs-select-font-size${suffix})`,
      fontWeight: 'var(--bs-select-font-weight)',
      minHeight: inputHeight,
      ':hover': {
        borderColor: theme.themeColors.dark,
      },
      boxShadow: isFocused ? '0 0 0 0.25rem #4e80a6' : 'inherit',
    }),
    singleValue: ({ marginLeft, marginRight, ...provided }, { isDisabled }) => ({
      ...provided,
      maxWidth: `${multi ? '80%' : '100%'}`,
      color: `var(--bs-select${isDisabled ? '-disabled' : ''}-color)`,
    }),
    valueContainer: (provided) => ({
      ...provided,
      padding:
        `calc(var(--bs-select-padding-y${suffix})) ` + `calc(var(--bs-select-padding-x${suffix}))`,
    }),
    dropdownIndicator: () => ({
      height: '100%',
      width: 'var(--bs-select-indicator-padding)',
      backgroundImage: 'var(--bs-select-indicator)',
      backgroundRepeat: 'no-repeat',
      backgroundPosition: `right var(--bs-select-padding-x) center`,
      backgroundSize: 'var(--bs-select-bg-size)',
    }),
    input: ({ margin, paddingTop, paddingBottom, ...provided }) => ({
      ...provided,
    }),
    option: (provided, state) => {
      const { isSelected, isFocused } = state;
      //const { indent } = data;
      const ret = {
        ...provided,
        color: theme.themeColors.black,
        backgroundColor: isSelected
          ? theme.graphColors.grey020
          : isFocused
            ? theme.graphColors.grey005
            : theme.themeColors.white,
        margin: 0,
        //marginLeft: `${indent ?? 0}rem`,
      };
      return ret;
    },
    menu: ({ marginTop, ...provided }) => ({
      ...provided,
    }),
    multiValue: (provided) => ({
      ...provided,
      margin: `calc(var(--bs-select-padding-y${suffix})/2) calc(var(--bs-select-padding-x${suffix})/2)`,
    }),
    clearIndicator: ({ padding, ...provided }) => ({
      ...provided,
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      width: 'var(--bs-select-indicator-padding)',
    }),
    multiValueLabel: ({ padding, paddingLeft, fontSize, ...provided }) => ({
      ...provided,
      padding: `0 var(--bs-select-padding-y${suffix})`,
      whiteSpace: 'normal',
    }),
  };
  return styles;
}

const DropdownIndicator: typeof components.DropdownIndicator = (props) => {
  return (
    <components.DropdownIndicator {...props}>
      <span></span>
    </components.DropdownIndicator>
  );
};

function getSelectTheme(theme: SelectTheme) {
  const ret: SelectTheme = {
    ...theme,
    colors: {
      ...theme.colors,
      primary: 'var(--bs-light)',
      danger: 'var(--bs-danger)',
    },
  };
  return ret;
}

const CountContainer = styled.span`
  opacity: 0.5;
  font-style: italic;
  margin: 0 0.4em;
`;

const Counter = ({ count }: { count: number }) => <CountContainer> + {count}</CountContainer>;

function ValueContainer<
  Option extends SelectDropdownOption,
  IsMulti extends boolean,
  Group extends GroupBase<Option>,
>(props: SelectValueContainerProps<Option, IsMulti, Group>) {
  const { children, ...rest } = props;
  let realChildren = children;
  if (Array.isArray(children)) {
    const [firstChild, ...remainingChildren] = children as React.ReactNode[];
    /**
     * For multi-selections, we only show the first selection as
     * a label and the other selections just as "+ <n>".
     */
    if (Array.isArray(firstChild) && firstChild.length > 0) {
      realChildren = [
        firstChild[0],
        firstChild.length > 1 ? <Counter key="counter" count={firstChild.length - 1} /> : null,
        ...remainingChildren,
      ];
    }
  }
  return <components.ValueContainer {...rest}>{realChildren}</components.ValueContainer>;
}

function MultiValue<
  Option extends SelectDropdownOption,
  IsMulti extends boolean,
  Group extends GroupBase<Option>,
>(props: MultiValueProps<Option, IsMulti, Group>) {
  const { data, ...rest } = props;
  const newData = {
    id: '__combined__',
    label: props.getValue()[0].label,
    indent: Math.min(...props.getValue().map((v) => v.indent ?? 0)),
  } as Option;
  return <components.SingleValue data={newData} {...rest} />;
}

function getCustomComponents<
  Option extends SelectDropdownOption,
  IsMulti extends boolean,
  Group extends GroupBase<Option>,
>(isMulti: IsMulti) {
  const ret: SelectComponentsConfig<Option, IsMulti, Group> = Object.assign(
    { DropdownIndicator },
    isMulti ? { ValueContainer, MultiValue } : {}
  );
  return ret;
}

export interface SelectDropdownOption {
  id: string;
  label: string;
  indent?: number;
}

type SelectDropdownProps<
  Option extends SelectDropdownOption,
  IsMulti extends boolean,
  Group extends GroupBase<Option>,
> = Parameters<typeof Select<Option, IsMulti, Group>>[0] & {
  id: string;
  label?: string;
  size?: string;
  helpText?: string;
  invert?: boolean;
  isMulti: IsMulti;
};

function SelectDropdown<
  Option extends SelectDropdownOption,
  IsMulti extends boolean = false,
  Group extends GroupBase<Option> = GroupBase<Option>,
>(props: SelectDropdownProps<Option, IsMulti, Group>) {
  const { size, id, label, value, onChange, helpText, invert, isMulti, className, ...rest } = props;
  const theme = useTheme();
  const styles = getSelectStyles<Option, IsMulti, Group>(theme, props.isMulti === true, size);
  return (
    <FormControl className={className}>
      {label && (
        <Label htmlFor={id}>
          {label}
          {helpText && <PopoverTip content={helpText} />}
        </Label>
      )}
      <Select
        aria-label={label}
        isMulti={isMulti}
        components={getCustomComponents<Option, IsMulti, Group>(isMulti)}
        theme={getSelectTheme}
        value={value}
        styles={styles}
        getOptionLabel={(option) => option.label}
        getOptionValue={(option) => option.id}
        formatOptionLabel={(option, meta) => {
          const { context, inputValue } = meta;
          const { indent, label } = option;
          const highlighted = (
            <Highlighter highlightTag="b" searchWords={[inputValue]} textToHighlight={label} />
          );
          if (context === 'value' || !indent) return highlighted;
          const spans: React.JSX.Element[] = [];
          for (let i = 0; i < indent; i++) {
            spans.push(
              <span
                key={`span-${i}`}
                style={{ borderLeft: '1px solid #ccc', paddingLeft: '0.5em' }}
              />
            );
          }
          return (
            <>
              {spans}
              {highlighted}
            </>
          );
        }}
        onChange={onChange}
        {...rest}
      />
    </FormControl>
  );
}
export default SelectDropdown;
