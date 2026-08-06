import { darkColors, lightColors } from '@/src/design-system/tokens';

describe('theme colour tokens', () => {
  it('defines the exact same set of keys for light and dark', () => {
    expect(Object.keys(darkColors).sort()).toEqual(Object.keys(lightColors).sort());
  });

  it('uses valid CSS colour values for every token', () => {
    const colorPattern = /^#([0-9a-f]{3,8})$|^rgba?\(/i;
    for (const value of [...Object.values(lightColors), ...Object.values(darkColors)]) {
      expect(value).toMatch(colorPattern);
    }
  });
});
