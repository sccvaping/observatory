(() => {
  const fmt = new Intl.NumberFormat('en-GB');
  const set = (id, value) => {
    const el = document.getElementById(id);
    if (el && value !== undefined && value !== null) el.textContent = value;
  };
  const date = value => {
    if (!value) return 'Awaiting publication';
    const d = new Date(value);
    return Number.isNaN(d.valueOf())
      ? String(value)
      : d.toLocaleDateString('en-GB', {day:'numeric', month:'long', year:'numeric', timeZone:'Europe/London'});
  };
  const question = (data, id) => (data.synthesis?.questions || []).find(item => item.id === id) || {};

  const statusRequest = fetch('data/public/research_status.json', {cache:'no-store'})
    .then(r => { if (!r.ok) throw new Error(String(r.status)); return r.json(); })
    .then(d => {
      const c = d.source_coverage || {};
      set('registered-sources', fmt.format(c.registered_sources ?? 43));
      set('successful-sources', fmt.format(c.successful_sources ?? 11));
      set('refresh-date', date(d.generated_at));
      return d;
    });

  const evidenceRequest = fetch('evidence/health_evidence_summary.json', {cache:'no-store'})
    .then(r => { if (!r.ok) throw new Error(String(r.status)); return r.json(); })
    .then(d => {
      const literature = d.literature || {};
      const cards = d.evidence_cards || {};
      const review = d.review_readiness || {};
      const topics = literature.topic_counts || {};
      const sources = literature.source_records || {};
      const sourceTotal = Object.values(sources).reduce((sum, value) => sum + (Number(value) || 0), 0);
      const respiratory = question(d, 'respiratory_health');
      const cardiovascular = question(d, 'cardiovascular_health');
      const cessation = question(d, 'cessation_nicotine_ecig_vs_nrt');
      const youth = question(d, 'youth_use');
      const ons = d.official_prevalence?.ons || {};
      const ohid = d.official_prevalence?.ohid_youth || {};
      const nhs = d.official_prevalence?.nhs_youth || {};

      set('candidate-evidence-records', fmt.format(literature.canonical_records ?? cards.card_count ?? 0));
      set('canonical-candidate-records', fmt.format(literature.canonical_records ?? cards.card_count ?? 0));
      set('literature-source-records', fmt.format(literature.input_records ?? sourceTotal));
      set('clinical-trials-indexed', fmt.format(d.clinical_trials?.record_count ?? 0));
      set('provisional-rct-count', fmt.format(cards.study_design_counts?.randomised_controlled_trial ?? 0));
      set('human-reviewed-count', fmt.format(review.reviewed_record_count ?? 0));
      set('conclusion-ready', fmt.format(review.conclusion_sensitive_ready_record_count ?? 0));
      set('synthesis-ready-count', fmt.format(review.conclusion_sensitive_ready_record_count ?? 0));
      set('respiratory-count', fmt.format(topics.respiratory ?? 0));
      set('cessation-count', fmt.format(topics.cessation ?? 0));
      set('cardiovascular-count', fmt.format(topics.cardiovascular ?? 0));
      set('youth-count', fmt.format(topics.youth ?? 0));

      set('respiratory-synthesis-candidates', fmt.format(respiratory.candidate_cards ?? 0));
      set('respiratory-synthesis-text', fmt.format(respiratory.candidate_cards ?? 0));
      set('cardiovascular-synthesis-candidates', fmt.format(cardiovascular.candidate_cards ?? 0));
      set('cardiovascular-synthesis-text', fmt.format(cardiovascular.candidate_cards ?? 0));
      set('health-human-reviewed', fmt.format(review.reviewed_record_count ?? 0));
      set('health-effect-ready', fmt.format(Math.max(respiratory.effect_estimate_ready_cards ?? 0, cardiovascular.effect_estimate_ready_cards ?? 0)));

      set('cessation-tagged-literature', fmt.format(topics.cessation ?? 0));
      set('cessation-synthesis-candidates', fmt.format(cessation.candidate_cards ?? 0));
      set('cessation-clinical-trials', fmt.format(d.clinical_trials?.record_count ?? 0));
      set('cessation-effect-ready', fmt.format(cessation.effect_estimate_ready_cards ?? 0));

      set('youth-tagged-literature', fmt.format(topics.youth ?? 0));
      set('youth-synthesis-candidates', fmt.format(youth.candidate_cards ?? 0));
      set('ohid-youth-records', fmt.format(ohid.record_count ?? 0));
      set('nhs-youth-records', fmt.format(nhs.record_count ?? 0));

      set('ons-status', ons.status ? String(ons.status).replaceAll('_', ' ').replace(/^./, c => c.toUpperCase()) : 'Awaiting publication');
      set('ons-latest-year', ons.latest_year ?? '—');
      set('ons-estimate-count', fmt.format(ons.estimate_count ?? 0));
      set('ons-latest-year-count', fmt.format(ons.latest_year_estimate_count ?? 0));
      return d;
    });

  Promise.allSettled([statusRequest, evidenceRequest]).then(results => {
    document.documentElement.dataset.publicDataStatus = results.some(result => result.status === 'rejected')
      ? 'fallback'
      : 'verified-json';
  });

  const footer = document.querySelector('footer');
  if (footer && !footer.querySelector('[data-scc-legal]')) {
    const legal = document.createElement('div');
    legal.dataset.sccLegal = '';
    legal.style.cssText = 'max-width:1180px;margin:0 auto;padding:12px 20px 18px;font-size:.78rem;line-height:1.55;opacity:.8';
    legal.innerHTML = 'Operated and published by <a href="https://sccnexus.co.uk/">SCC Nexus Limited</a> · Registered in England and Wales · Company No. <a href="https://find-and-update.company-information.service.gov.uk/company/17458303" rel="noopener">17458303</a> · Registered office: 49 Station Road, Polegate, East Sussex, BN26 6EA. Project conclusions remain governed by the published methodology, provenance and review controls.';
    footer.appendChild(legal);
  }
})();
