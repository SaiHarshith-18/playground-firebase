export function parseEventDateTime(dateStr, timeStr) {
  if (!dateStr || !timeStr) return new Date('invalid');
  const [year, month, day] = dateStr.trim().split('-');
  const cleanTime = timeStr.trim().toUpperCase();
  const convertTo24Hr = time12h => {
    const [time, modifier] = time12h.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    if (modifier === 'PM' && hours < 12) hours += 12;
    if (modifier === 'AM' && hours === 12) hours = 0;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;
  };
  const isoDate = `${year}-${month}-${day}T${convertTo24Hr(cleanTime)}`;
  return new Date(isoDate);
}
