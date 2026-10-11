(() => {
  const label = (id,value) => { const el=document.getElementById(id); if(el) el.textContent=value; };
  if(!document.querySelector('[data-submission-status]')) return;
  const read=path=>fetch(path,{cache:'no-store'}).then(r=>{if(!r.ok)throw Error(path+': '+r.status);return r.json()});
  Promise.all([read('data/public/research_status.json'),read('evidence/health_evidence_summary.json'),read('provenance/release_evidence.json')])
    .then(([status,summary,release])=>{
      if(status.publication_level!=='aggregate_and_audit_metadata_only') throw Error('Unexpected publication class');
      const review=summary.review_readiness||{};
      const date=new Date(status.generated_at);
      if(!Number.isFinite(date.getTime())) throw Error('Release timestamp missing');
      label('sub-refresh',date.toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'}));
      label('sub-candidates',Number(summary.literature?.canonical_records??0).toLocaleString('en-GB'));
      label('sub-reviewed',Number(review.reviewed_record_count??0).toLocaleString('en-GB'));
      label('sub-ready',Number(review.conclusion_sensitive_ready_record_count??0).toLocaleString('en-GB'));
      label('sub-data-message','Source: validated public snapshot · research run '+String(release.run_id||'not recorded')+' · research refresh, not website deployment time.');
    })
    .catch(()=>{for(const id of ['sub-refresh','sub-candidates','sub-reviewed','sub-ready'])label(id,'Unavailable');label('sub-data-message','Current source data could not be verified. No fallback is presented as current.');});
})();