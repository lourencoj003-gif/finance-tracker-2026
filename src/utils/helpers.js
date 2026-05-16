export const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export function fmt(n) {
  return "£" + Math.abs(Math.round(n)).toLocaleString("en-GB");
}
