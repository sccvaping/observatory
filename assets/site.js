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

  const footer=document.querySelector('footer');
  if(footer&&!footer.querySelector('[data-scc-legal]')){
    const legal=document.createElement('div');
    legal.dataset.sccLegal='';
    legal.style.cssText='max-width:1180px;margin:0 auto;padding:12px 20px 18px;font-size:.78rem;line-height:1.55;opacity:.8';
    legal.innerHTML='Operated and published by <a href="https://sccnexus.co.uk/">SCC Nexus Limited</a> · Registered in England and Wales · Company No. <a href="https://find-and-update.company-information.service.gov.uk/company/17458303" rel="noopener">17458303</a> · Registered office: 49 Station Road, Polegate, East Sussex, BN26 6EA. Project conclusions remain governed by the published methodology, provenance and review controls.';
    footer.appendChild(legal);
  }
})();
