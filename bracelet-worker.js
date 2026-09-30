// Web Worker : espérance de gain d'une nouvelle campagne de bracelet, via le solveur exact de bracelet-model.js.
// Le calcul peut prendre plusieurs secondes (bracelet à 3 lignes) : il tourne ici pour ne pas figer la page.
importScripts('bracelet-data.js', 'gear-data.js', 'bracelet-model.js');

self.onmessage = (e) => {
  const { key, grade, role, fixed, granted, slots, traits, rolls } = e.data;
  try {
    const B = self.Bracelet;
    const profile = B.normalizeProfile({ role });
    // Score du bracelet actuel (aucun reroll)
    const cur = B.solve({ grade, profile, fixedLines: fixed, grantedLines: granted, slots, rollsLeft: 0, traitValues: traits });
    const curPct = B.damagePercent(cur.currentScore);
    // Bracelet neuf aux mêmes lignes fixes et traits, joué de façon optimale ; on garde l'ancien s'il reste meilleur
    const fresh = B.solve({
      grade, profile, fixedLines: fixed, grantedLines: [], slots, rollsLeft: rolls,
      traitValues: traits, goldPer1Pct: 1, baselinePct: curPct
    });
    // valueGold (1 gold par %) = E[max(0, nouveau % - actuel %)] ; gain relatif sur les dégâts totaux
    const gain = fresh.valueGold / (1 + curPct / 100);
    self.postMessage({ key, ok: true, curPct, gain, pBeat: fresh.pBeatBaseline, freshMeanPct: B.damagePercent(fresh.expectedFinal) });
  } catch (err) {
    self.postMessage({ key, ok: false, error: err && err.message });
  }
};
