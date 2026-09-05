(() => {
  const fmt = new Intl.NumberFormat('en-GB');
  const set = (id, value) => { const el = document.getElementById(id); if (el) el.textContent = value; };
  const date = value => {
    if (!value) return 'Awaiting publication';
    const d = new Date(value);
    return Number.isNaN(d.valueOf()) ? String(value) : d.toLocaleDateString('en-GB', {day:'numeric',month:'long',year:'numeric',timeZone:'Europe/London'});
  };
  fetch('data/public/research_status.json', {cache:'no-store'})
    .then(r => { if (!r.ok) throw new Error(String(r.status)); return r.json(); })
    .then(d => {
      const c = d.source_coverage || {};
      set('registered-sources', fmt.format(c.registered_sources ?? 43));
      set('successful-sources', fmt.format(c.successful_sources ?? 11));
      set('refresh-date', date(d.generated_at));
    })
    .catch(() => {});
})();
