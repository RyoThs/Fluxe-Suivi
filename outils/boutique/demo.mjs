/* Données de démo FICTIVES pour les captures des boutiques : 8 semaines, 3 séances par semaine,
   des charges qui montent doucement, 3 routines et 5 pesées. */
const JOUR = 864e5;
const serie = (kg, reps, echauffement) => ({
  kg: String(kg),
  reps: String(reps),
  done: true,
  ...(echauffement ? {w: true} : {}),
});
/* [exercice, charge de départ, hausse par semaine, répétitions] */
const ROUTINES = [
  {
    id: 'r1',
    name: 'Haut du corps',
    ex: [
      ['Développé couché', 60, 2.5, 8],
      ['Rowing barre', 55, 2.5, 10],
      ['Développé militaire', 35, 1.25, 8],
      ['Curl barre', 25, 1.25, 10],
    ],
  },
  {
    id: 'r2',
    name: 'Jambes',
    ex: [
      ['Squat', 80, 2.5, 6],
      ['Soulevé de terre', 100, 5, 5],
      ['Tirage vertical', 50, 2.5, 10],
    ],
  },
  {
    id: 'r3',
    name: 'Push',
    ex: [
      ['Développé incliné haltères', 22, 1, 10],
      ['Élévations latérales', 10, 0.5, 12],
      ['Triceps poulie', 25, 1.25, 12],
    ],
  },
];

export function demo(maintenant) {
  const sessions = [];
  for (let semaine = 7; semaine >= 0; semaine--) {
    [5, 3, 1].forEach((jour, k) => {
      const r = ROUTINES[k],
        prog = 7 - semaine,
        d = new Date(maintenant - (semaine * 7 + jour) * JOUR);
      d.setHours(18, 30, 0, 0);
      const exercises = r.ex.map(([name, kg, pas, reps]) => {
        const c = kg + pas * prog;
        return {
          name,
          sets: [serie(Math.round(kg * 0.6), reps, true), serie(c, reps), serie(c, reps), serie(c, reps - 1)],
        };
      });
      if (k === 1)
        exercises.push({
          name: 'Tapis de course',
          cardio: true,
          sets: [{min: '15', km: '2.4', kcal: '150', done: true}],
        });
      sessions.push({
        id: 'demo' + semaine + k,
        date: d.getTime(),
        dur: 52 + ((semaine + k) % 4) * 4,
        rt: r.id,
        exercises,
      });
    });
  }
  const routines = ROUTINES.map(r => ({
    id: r.id,
    name: r.name,
    exercises: r.ex.map(e => e[0]),
    sets: r.ex.map(([, kg, pas, reps]) => [0, 1, 2].map(() => serie(kg + pas * 7, reps))),
  }));
  const corps = [0, 14, 28, 42, 56].map((j, i) => ({
    t: maintenant - (56 - j) * JOUR,
    kg: +(78.6 - i * 0.5).toFixed(1),
  }));
  return {sessions, routines, current: null, notes: {}, rests: {}, corps, lastBackup: maintenant, rvInit: true};
}
