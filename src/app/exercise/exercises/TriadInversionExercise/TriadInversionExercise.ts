import { Exercise } from '../../Exercise';
import {
  ChordSymbol,
  TriadInversion,
  Chord,
} from '../../utility/music/chords';
import { randomFromList } from '../../../shared/ts-utility';
import * as Tone from 'tone';
import { Note } from 'tone/Tone/core/type/NoteUnits';
import { toSteadyPart } from '../../utility';
import { TriadInversionExplanationComponent } from './triad-inversion-explanation/triad-inversion-explanation.component';
import {
  IncludedAnswersSettings,
  includedAnswersSetting,
} from '../utility/settings/IncludedAnswersSettings';
import { createTonalExercise } from '../utility/exerciseFactories/createTonalExercise';
import { combineSettings } from '../utility/settings/combineSettings';
import {
  cadenceTypeSettings,
  CadenceTypeSetting,
} from '../utility/settings/CadenceTypeSetting';
import filterIncludedAnswers = Exercise.filterIncludedAnswers;

type TriadInversionAnswer = 'Root Position' | '1st Inversion' | '2nd Inversion'

const triadInversions: TriadInversionAnswer[] = [
  'Root Position',
  '1st Inversion',
  '2nd Inversion',
];

export type TriadInversionExerciseSettings =
  CadenceTypeSetting &
  IncludedAnswersSettings<TriadInversionAnswer> & { // todo: includedAnswersSettings should probably be removed
  arpeggiateSpeed: number;
  playRootAfterAnswer: boolean;
}

export const triadInversionExercise = () => {
  const allAnswersList = {
    rows: triadInversions.map(triadInversion => [triadInversion]),
  };

  return createTonalExercise<TriadInversionAnswer, TriadInversionExerciseSettings>({
    id: 'triadInversions',
    name: 'Triad Inversions',
    summary: 'Find the inversion of a triad in close position',
    explanation: TriadInversionExplanationComponent,
    // todo: this filtering should be someone reused together with includedAnswersSetting
    answerListInC: (settings: IncludedAnswersSettings<TriadInversionAnswer>) => filterIncludedAnswers(allAnswersList, settings.includedAnswers),
    getQuestionInC(settings: TriadInversionExerciseSettings): Exclude<Exercise.NotesQuestion<TriadInversionAnswer>, 'cadence'> {
      const chordsInC: ChordSymbol[] = ['C', 'Dm', 'Em', 'F', 'G', 'Am'];
      const randomChordInC: ChordSymbol = randomFromList(chordsInC);
      const invertionOptions: TriadInversion[] = [0, 1, 2].filter(invertionOption => settings.includedAnswers.includes(triadInversions[invertionOption]));
      const randomTriadInversion: TriadInversion = randomFromList(invertionOptions);
      const answer = triadInversions[randomTriadInversion];
      const voicing: Note[] = new Chord(randomChordInC).getVoicing({
        topVoicesInversion: randomTriadInversion,
        withBass: false,
        octave: 3, // picking a lower octave as a high one is more difficult
      });
      const question: Exercise.Question<TriadInversionAnswer> = {
        segments: [
          {
            partToPlay: voicing.map((note, index) => {
              const noteDelay = index * settings.arpeggiateSpeed / 100;
              return {
                notes: note,
                velocity: 0.3,
                duration: Tone.Time('1n').toSeconds() + (voicing.length - 1) * settings.arpeggiateSpeed / 100 - Tone.Time(noteDelay).toSeconds(),
                time: noteDelay,
              }
            }),
            rightAnswer: answer,
          },
        ],
        info: '',
      };

      if (settings.playRootAfterAnswer) {
        question.afterCorrectAnswer = [
          {
            partToPlay: toSteadyPart(voicing[(3 - randomTriadInversion) % 3], '1n', 0.3),
            answerToHighlight: answer,
          },
        ]
      }

      return question;
    },
    // TODO: consider if tonalExercise should keep the values provided here and add to it, right now it overrides
    ...combineSettings(
      cadenceTypeSettings(),
      includedAnswersSetting({
        answerList: allAnswersList,
        defaultSelectedAnswers: ['Root Position', '1st Inversion', '2nd Inversion'],
      }),
      {
        settingsDescriptors: [
          {
            key: 'arpeggiateSpeed',
            info: 'When set to a value larger then zero, the chord will be arpeggiated, making it easier to pick up individual notes from it. <br>' +
              'Starter with a large settings and gradually reducing can be a good way to train your ear to pick up individual notes being played harmonically',
            descriptor: {
              controlType: 'slider',
              label: 'Arpeggiate Speed',
              min: 0,
              max: 100,
              step: 1,
            },
          },
          {
            key: 'playRootAfterAnswer',
            descriptor: {
              controlType: 'checkbox',
              label: 'Play Root After Correct Answer',
            },
          },
        ],
        defaultSettings: {
          arpeggiateSpeed: 0,
          playRootAfterAnswer: true,
        },
      },
    ),
  });
}
