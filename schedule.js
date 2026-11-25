const schedule = document.querySelector('[data-schedule]');
const today = new Intl.DateTimeFormat('en-US', {
  weekday: 'short',
  timeZone: 'Asia/Yekaterinburg',
}).format();
const row = [...schedule.querySelectorAll('[data-day]')].find(item => item.dataset.day === today);
if (row) {
  row.classList.add('schedule-today');
  const badge = document.createElement('span');
  badge.className = 'schedule-today-label';
  badge.textContent = 'Сегодня';
  row.querySelector('dt').append(badge);
}
