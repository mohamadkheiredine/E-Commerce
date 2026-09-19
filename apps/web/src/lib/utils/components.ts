// export function composeCompoundComponent<TWrapper extends object, TUnits extends object>(
//   wrapper: TWrapper,
//   units: TUnits
// ) {
//   const CompoundComponent = Object.assign(wrapper, units);
//   return CompoundComponent;
// }
export function composeCompoundComponent<TWrapper extends object, TUnits extends object>(
  wrapper: TWrapper,
  units: TUnits,
) {
  const CompoundComponent = Object.assign(wrapper, units);
  return CompoundComponent as TWrapper & TUnits;
}
