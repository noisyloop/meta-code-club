import {SegmentedControl, SegmentedControlItem} from '@astryxdesign/core/SegmentedControl';
import {Icon} from '@astryxdesign/core/Icon';
import {Monitor, Moon, Sun} from 'lucide-react';

export type ColorMode = 'system' | 'light' | 'dark';

export function ThemeModeToggle({
  mode,
  onChange,
}: {
  mode: ColorMode;
  onChange: (mode: ColorMode) => void;
}) {
  return (
    <SegmentedControl
      label="Color mode"
      size="sm"
      value={mode}
      onChange={value => onChange(value as ColorMode)}>
      <SegmentedControlItem value="light" label="Light" isLabelHidden icon={<Icon icon={Sun} />} />
      <SegmentedControlItem value="system" label="System" isLabelHidden icon={<Icon icon={Monitor} />} />
      <SegmentedControlItem value="dark" label="Dark" isLabelHidden icon={<Icon icon={Moon} />} />
    </SegmentedControl>
  );
}
