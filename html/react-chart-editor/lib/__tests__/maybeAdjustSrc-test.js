import {maybeAdjustSrc} from '../index';
/* eslint-disable no-magic-numbers */
describe('maybeAdjustSrc', () => {
  it('uses custom parsing function if one is provided', () => {
    const custom = srcs => srcs.join('$');
    const adjusted = maybeAdjustSrc(['z1', 'z2'], 'zsrc', 'heatmap', {
      fromSrc: custom,
    });
    expect(adjusted).toBe('z1$z2');
  });

  it('reduces src to string for special table case', () => {
    const adjusted = maybeAdjustSrc(['z1'], 'header.valuessrc', 'table');
    expect(adjusted).toBe('z1');
  });
});
