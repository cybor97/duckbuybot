export function getFiatCurrency() {
  let fiatCurrency = process.env.FIAT_CURRENCY;
  if (
    fiatCurrency === undefined ||
    fiatCurrency === null ||
    fiatCurrency.trim().length === 0
  ) {
    return "USD";
  }
  return fiatCurrency;
}
