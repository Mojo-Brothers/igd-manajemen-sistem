export const getEffectiveDate = (date: Date, switchTimeStr: string = '00:00'): Date => {
  const [hours, minutes] = switchTimeStr.split(':').map(Number);
  
  const switchTime = new Date(date);
  switchTime.setHours(hours || 0, minutes || 0, 0, 0);

  const effectiveDate = new Date(date);
  if (date < switchTime) {
    effectiveDate.setDate(effectiveDate.getDate() - 1);
  }
  
  return effectiveDate;
};

export const getEffectiveDateString = (date: Date, switchTimeStr: string = '00:00'): string => {
  const effectiveDate = getEffectiveDate(date, switchTimeStr);
  const yyyy = effectiveDate.getFullYear();
  const mm = String(effectiveDate.getMonth() + 1).padStart(2, '0');
  const dd = String(effectiveDate.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};
