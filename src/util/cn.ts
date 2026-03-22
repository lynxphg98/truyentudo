export const cn = (...inputs: (string | boolean | undefined | null | Record<string, boolean>)[]): string => {
  return inputs
    .flatMap((input) => {
      if (typeof input === 'string') return input;
      if (typeof input === 'object' && input !== null && !Array.isArray(input)) {
        return Object.entries(input)
          .filter(([, value]) => value)
          .map(([key]) => key);
      }
      return [];
    })
    .filter(Boolean)
    .join(' ');
};

export default cn;
